/*
 * Copyright (C) 2026 SPORT-SERVICE RS★R
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * In-App Purchase manager.
 *
 * Wraps react-native-iap to provide:
 *  - Connection / initialisation
 *  - Purchase flow with confirmation
 *  - Restore purchases
 *  - Listener for purchase updates
 *
 * NOTE: react-native-iap is listed as a dependency but actual store
 * communication only works in dev-client builds (not Expo Go).
 * When running in Expo Go, all IAP calls gracefully degrade:
 *  - initIAP() returns without error
 *  - purchaseProduct() shows an alert explaining the limitation
 *  - restorePurchases() returns an empty array
 * This lets the rest of the app (lock UI, banners, etc.) be developed
 * and tested without a store connection.
 */
import { Alert, Platform } from 'react-native';
import { t } from '../i18n';
import {
  initPurchaseTable,
  savePurchase,
  getPurchasedProducts,
  clearPurchases,
} from '../device/PurchaseRepository';
import { IAP_PRODUCT_IDS, IAPProductId, getProductDisplayName } from './IAPProducts';
import { debugLog, debugWarn, debugError } from '../utils/debugLogging';

// ---------- react-native-iap dynamic import ----------
// We try to require react-native-iap at runtime. If it's not installed
// or we're running in Expo Go, rniap will be null and all store calls
// are no-ops.
let rniap: Record<string, Function> | null = null;
try {
  rniap = require('react-native-iap');
} catch {
  debugLog('iap', '[IAP] react-native-iap not available — running in stub mode');
}

let isInitialised = false;
let purchaseUpdateSubscription: { remove: () => void } | null = null;
let purchaseErrorSubscription: { remove: () => void } | null = null;

/** Callback invoked when a purchase or restore succeeds. */
type OnPurchaseSuccess = (productId: string) => void;

let _onPurchaseSuccess: OnPurchaseSuccess | null = null;

/**
 * Initialise the IAP system.
 * - Creates the local purchases table
 * - Connects to the store (iOS / Android)
 * - Starts listening for purchase updates
 *
 * @param onPurchaseSuccess called with the productId whenever a
 *   purchase or restore completes. The caller should update the store.
 */
export const initIAP = async (onPurchaseSuccess: OnPurchaseSuccess): Promise<void> => {
  if (isInitialised) return;
  _onPurchaseSuccess = onPurchaseSuccess;

  // Always init the local DB table
  await initPurchaseTable();

  if (!rniap) {
    isInitialised = true;
    return;
  }

  try {
    await rniap.initConnection();

    // Listen for completed purchases.
    // react-native-iap v15 unified the receipt field: use `purchaseToken`
    // (iOS JWS / Android purchaseToken) instead of the removed `transactionReceipt`.
    // We require productId + purchaseToken before acknowledging.
    // NOTE on Android: finishTransaction({ isConsumable: false }) calls
    // acknowledgePurchase under the hood. Google Play auto-refunds any
    // purchase that is not acknowledged within 3 days, so this MUST run.
    purchaseUpdateSubscription = rniap.purchaseUpdatedListener(
      async (purchase: { productId?: string; purchaseToken?: string; purchaseState?: string }) => {
      debugLog('iap', '[IAP][listener] purchaseUpdated fired, keys =', Object.keys(purchase ?? {}));
      debugLog(
        'iap',
        '[IAP][listener] productId =',
        purchase?.productId,
        'purchaseToken?',
        !!purchase?.purchaseToken,
        'state =',
        purchase?.purchaseState,
      );
      try {
        if (!purchase?.productId || !purchase?.purchaseToken) {
          debugWarn('iap', '[IAP][listener] missing productId/purchaseToken, skip');
          return;
        }
        // Only grant entitlements for completed purchases. On Android the same
        // listener also delivers PENDING purchases (deferred payment methods
        // such as cash/konbini); acknowledging those here would grant the
        // product before payment settles. The listener fires again with
        // purchaseState 'purchased' once payment completes.
        if (purchase?.purchaseState !== 'purchased') {
          debugLog(
            'iap',
            '[IAP][listener] purchase not completed yet, skip. state =',
            purchase?.purchaseState,
          );
          return;
        }
        await rniap!.finishTransaction({ purchase, isConsumable: false });
        debugLog('iap', '[IAP][listener] finishTransaction OK for', purchase.productId);
        await savePurchase(purchase.productId);
        const verify = await getPurchasedProducts();
        debugLog('iap', '[IAP][listener] DB after save =', verify);
        _onPurchaseSuccess?.(purchase.productId);
      } catch (e) {
        debugError('iap', '[IAP][listener] failed to process purchase', e);
      }
    });

    purchaseErrorSubscription = rniap.purchaseErrorListener((error: { code?: string }) => {
      if (error.code !== 'E_USER_CANCELLED') {
        debugWarn('iap', '[IAP] Purchase error', error);
      }
    });

    isInitialised = true;

    // Fetch products so prices are cached (v15+: fetchProducts)
    // Run this in a separate try-catch so product/SKU lookup errors or transient network failures
    // do not block the connection initialization and listener registration.
    try {
      const fetchFn = rniap.fetchProducts ?? rniap.getProducts;
      await fetchFn({ skus: [...IAP_PRODUCT_IDS], type: 'in-app' });
    } catch (productError) {
      debugWarn('iap', '[IAP] fetchProducts failed (non-fatal)', productError);
    }
  } catch (e) {
    debugWarn('iap', '[IAP] initConnection failed', e);
  }
};

/**
 * Request a purchase for the given product.
 * Shows a 2-step confirmation dialog before invoking the OS purchase flow.
 */
export const purchaseProduct = (productId: IAPProductId): void => {
  const displayName = getProductDisplayName(productId);

  Alert.alert(t('iap.unlockProtune'), t('iap.purchaseConfirm', { name: displayName }), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('common.purchase'),
      onPress: async () => {
        if (!rniap) {
          Alert.alert(t('iap.notAvailable'), t('iap.notAvailableDesc'));
          return;
        }
        try {
          // react-native-iap v15+ requires the new request shape:
          //   { request: { google: { skus }, apple: { sku } }, type: 'in-app' }
          await rniap.requestPurchase({
            request: {
              android: { skus: [productId] },
              ios: { sku: productId },
            },
            type: 'in-app',
          });
        } catch (e: unknown) {
          const err = e as { code?: string; message?: string };
          const isAlreadyOwned =
            err.code === 'E_ALREADY_OWNED' ||
            (err.message &&
              (err.message.toLowerCase().includes('already owned') ||
                err.message.toLowerCase().includes('alreadyowned')));
          if (isAlreadyOwned) {
            try {
              debugLog('iap', '[IAP] Item already owned, triggering auto-restore');
              const restored = await restorePurchasesCore();
              if (restored.includes(productId)) {
                Alert.alert(
                  t('alert.restored'),
                  t('alert.restoredDesc', { count: restored.length }),
                );
              } else {
                Alert.alert(t('iap.purchaseFailed'), err.message ?? t('iap.unknownError'));
              }
            } catch (restoreErr: unknown) {
              debugError('iap', '[IAP] Auto-restore on already owned item failed', restoreErr);
              Alert.alert(t('iap.purchaseFailed'), err.message ?? t('iap.unknownError'));
            }
          } else if (err.code !== 'E_USER_CANCELLED') {
            Alert.alert(t('iap.purchaseFailed'), err.message ?? t('iap.unknownError'));
          }
        }
      },
    },
  ]);
};

const restorePurchasesCore = async (): Promise<string[]> => {
  if (!rniap) {
    throw new Error(t('iap.notAvailableShort'));
  }

  // v15: on iOS we must run syncIOS() before getAvailablePurchases(),
  // otherwise StoreKit2 entitlements may not be loaded yet and the
  // call returns an empty array. Doing it manually (instead of
  // calling rniap.restorePurchases()) lets us collect the productIds.
  if (Platform.OS === 'ios' && typeof rniap.syncIOS === 'function') {
    try {
      debugLog('iap', '[IAP][restore] calling syncIOS()...');
      await rniap.syncIOS();
      debugLog('iap', '[IAP][restore] syncIOS() OK');
    } catch (e) {
      debugWarn('iap', '[IAP][restore] syncIOS failed (continuing)', e);
    }
  }

  const purchases = await rniap.getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: true,
  });
  debugLog('iap', '[IAP][restore] getAvailablePurchases returned', purchases?.length, 'items');
  debugLog('iap', '[IAP][restore] raw =', JSON.stringify(purchases, null, 2));
  const restored: string[] = [];
  for (const p of purchases) {
    if (p?.productId) restored.push(p.productId);
  }
  // Only sync local DB to store result when the store actually returned
  // something. Sandbox / StoreKit2 sometimes returns 0 items even right
  // after a successful purchase (currentEntitlements lag). Wiping the DB
  // in that case would destroy a known-good local record (the user would
  // lose entitlements after Restore + restart). See docs/technical/10_in-app-purchase.md.
  if (restored.length > 0) {
    await clearPurchases();
    for (const pid of restored) {
      await savePurchase(pid);
      _onPurchaseSuccess?.(pid);
    }
  } else {
    debugWarn('iap', '[IAP][restore] store returned 0 items — keeping local DB intact');
  }
  debugLog('iap', '[IAP][restore] done, restored =', restored);
  return restored;
};

/**
 * Restore previous purchases from the store.
 * Clears local DB and re-populates from store receipts.
 *
 * @returns array of restored product IDs
 */
export const restorePurchases = async (): Promise<string[]> => {
  if (!rniap) {
    Alert.alert(t('iap.notAvailable'), t('iap.notAvailableShort'));
    return [];
  }

  try {
    return await restorePurchasesCore();
  } catch (e: unknown) {
    const err = e as { message?: string };
    debugError('iap', '[IAP][restore] failed', e);
    Alert.alert(t('iap.restoreFailed'), err.message ?? t('iap.unknownError'));
    return [];
  }
};

/**
 * Load previously persisted purchases from local DB.
 * Call at app startup to hydrate the store without network.
 */
export const loadLocalPurchases = async (): Promise<string[]> => {
  await initPurchaseTable();
  const rows = await getPurchasedProducts();
  debugLog('iap', '[IAP][startup] loadLocalPurchases =', rows);
  return rows;
};

/** Clean up listeners on app shutdown. */
export const endIAP = (): void => {
  purchaseUpdateSubscription?.remove();
  purchaseErrorSubscription?.remove();
  purchaseUpdateSubscription = null;
  purchaseErrorSubscription = null;
  if (rniap) {
    rniap.endConnection();
  }
  isInitialised = false;
};
