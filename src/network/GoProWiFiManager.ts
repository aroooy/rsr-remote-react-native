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

import { PermissionsAndroid, Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { useGoProStore, selectActiveCameraState } from '../store/GoProStore';
import { goProBle } from '../ble/GoProBLEManager';
import { debugLog } from '../utils/debugLogging';
import { t } from '../i18n';

const GOPRO_BASE_URL = 'http://10.5.5.9:8080';

/** Thrown when a connection step observes an aborted signal. Treated as a user cancel, not an error. */
class WifiAbortError extends Error {
  constructor() {
    super('Wi-Fi connection aborted');
    this.name = 'AbortError';
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new WifiAbortError();
}

export function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError';
}

/**
 * A setTimeout-based delay that resolves after `ms`, or rejects immediately
 * with an AbortError if the signal fires first. Lets the long "wait for the AP
 * to start broadcasting" pause be cancelled the moment the user backs out.
 */
function interruptibleDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new WifiAbortError());
      return;
    }
    const cleanup = () => {
      if (!signal) return;
      if (typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      } else {
        (signal as { onabort?: (() => void) | null }).onabort = null;
      }
    };
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new WifiAbortError());
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    if (signal) {
      if (typeof signal.addEventListener === 'function') {
        signal.addEventListener('abort', onAbort);
      } else {
        (signal as { onabort?: (() => void) | null }).onabort = onAbort;
      }
    }
  });
}

class GoProWiFiManager {
  /**
   * Enables the Wi-Fi AP via BLE, retrieves the password, and connects to Wi-Fi
   */
  public async connectToCameraWiFi(signal?: AbortSignal): Promise<boolean> {
    const store = useGoProStore.getState();
    store.setWifiStatus('connecting');

    try {
      throwIfAborted(signal);
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('wifi.locationPermissionTitle'),
            message: t('wifi.locationPermissionMessage'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('common.ok'),
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error(t('wifi.locationPermissionDenied'));
        }
      }

      // 1. Turn on the AP
      throwIfAborted(signal);
      await goProBle.enableWiFiAP();

      // Defer execution because it takes a few seconds for the GoPro AP to start
      // broadcasting its SSID. This wait is interruptible so cancelling is instant.
      await interruptibleDelay(5000, signal);

      // 2. Retrieve the Wi-Fi password
      throwIfAborted(signal);
      const activeCamera = selectActiveCameraState(useGoProStore.getState());
      let password = activeCamera.apPassword;
      if (!password) {
        password = await goProBle.fetchWiFiPassword();
        if (password) {
          store.setApPassword(password);
        }
      }

      const ssid = activeCamera.hardwareInfo?.ssid;

      if (!ssid) {
        throw new Error('SSID is not available. Please ensure BLE is fully connected.');
      }
      if (!password) {
        throw new Error('Failed to retrieve Wi-Fi password from camera.');
      }

      // Never log the actual Wi-Fi password — debug logs can end up in logcat/Console
      debugLog('wifi', `[WiFi] Connecting to SSID: ${ssid} (password: ${password.length} chars)`);

      // 3. Connect to Wi-Fi (react-native-wifi-reborn)
      // Android 10+ routes users through a local network guide via WifiNetworkSpecifier.
      // iOS displays a system hotspot prompt using NEHotspotConfigurationManager.
      // This native call cannot be aborted mid-flight, so we re-check the signal
      // the instant it returns and tear down if the user cancelled meanwhile.
      throwIfAborted(signal);
      await WifiManager.connectToProtectedSSID(ssid, password, false, false);
      throwIfAborted(signal);

      debugLog('wifi', '[WiFi] Connected successfully!');
      store.setWifiStatus('connected');
      return true;
    } catch (e) {
      if (isAbortError(e)) {
        debugLog('wifi', '[WiFi] Connection cancelled by user.');
        store.setWifiStatus('disconnected');
        // Drop any partial association that may have completed after the cancel.
        if (Platform.OS === 'android') {
          WifiManager.disconnect().catch(() => {});
        }
        return false;
      }
      console.error('[WiFi] Connection failed:', e);
      store.setWifiStatus('disconnected');
      return false;
    }
  }

  /**
   * Explicitly disconnects from Wi-Fi
   */
  public async disconnectFromCameraWiFi(): Promise<void> {
    const store = useGoProStore.getState();
    try {
      if (Platform.OS === 'android') {
        await WifiManager.disconnect();
      }
      debugLog('wifi', '[WiFi] Disconnected from camera.');
    } catch (e) {
      console.warn('[WiFi] Error disconnecting:', e);
    } finally {
      store.setWifiStatus('disconnected');
    }
  }

  /**
   * Starts the UDP preview stream (requires a Wi-Fi connection)
   */
  public async startPreviewStream(signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetch(`${GOPRO_BASE_URL}/gopro/camera/stream/start`, { signal });
      if (response.ok) {
        debugLog('wifi', '[WiFi] Preview stream started successfully.');
        return true;
      } else {
        console.warn(`[WiFi] Failed to start stream: HTTP ${response.status}`);
        return false;
      }
    } catch (e) {
      if (isAbortError(e)) {
        console.warn('[WiFi] Start stream aborted.');
        return false;
      }
      console.error('[WiFi] Error starting stream:', e);
      return false;
    }
  }

  /**
   * Stops the UDP preview stream
   */
  public async stopPreviewStream(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout after 2 seconds

      const response = await fetch(`${GOPRO_BASE_URL}/gopro/camera/stream/stop`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        debugLog('wifi', '[WiFi] Preview stream stopped.');
        return true;
      }
      return false;
    } catch (e: any) {
      // Demote expected fetch failures (e.g. from network already being disconnected) to warnings
      if (e.name === 'AbortError' || e.message?.includes('Network request failed')) {
        console.warn(`[WiFi] Ignored error stopping stream: ${e.message}`);
      } else {
        console.error('[WiFi] Error stopping stream:', e);
      }
      return false;
    }
  }
}

export const goProWiFi = new GoProWiFiManager();
