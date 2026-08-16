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

import { Platform } from 'react-native';
import notifee, {
  AndroidColor,
  AndroidForegroundServiceType,
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import { t } from '../i18n';
import { debugWarn } from '../utils/debugLogging';
import { useGoProStore } from '../store/GoProStore';

/**
 * Local-notification + Android foreground-service helper.
 *
 *  1. Warn the user when a connected GoPro is lost unexpectedly (out of range /
 *     silent power-off), NOT for app-initiated disconnects.
 *  2. Android: run a foreground service while any camera is connected so the OS
 *     keeps the process alive and BLE callbacks keep firing in the background.
 *     Its ongoing notification doubles as a live status display (recording time
 *     via chronometer, battery, SD, warnings) and updates silently.
 *  3. iOS (no foreground service): show a single status notification while
 *     recording, updated only on important events (stop / overheat / low battery
 *     / SD full) to avoid re-alert spam. iOS background BLE relies on the
 *     existing `bluetooth-central` mode.
 *
 * Every call is guarded — notifications must never break a BLE operation.
 */

const WARN_CHANNEL_ID = 'gopro-disconnect';
const TEMP_CHANNEL_ID = 'gopro-temperature';
const CONNECTION_CHANNEL_ID = 'gopro-connection';
const FGS_NOTIFICATION_ID = 'gopro-connection-fgs';
const IOS_REC_NOTIFICATION_ID = 'gopro-recording-status';

let channelsReady = false;
let fgsRegistered = false;
let fgsActive = false;

type CameraStatus = {
  connected: boolean;
  recording: boolean;
  recordingSec: number;
  battery: number;
  sdPct: number | null;
  overheat: boolean;
  lowBattery: boolean;
  sdFull: boolean;
  name: string;
};

function buildStatusFromStore(): CameraStatus {
  const st = useGoProStore.getState();
  const id = st.connectedDeviceId;
  const cs = id ? st.cameraStates[id] : undefined;
  const connected = !!id && st.deviceConnectionStatuses[id] === 'connected';
  const battery = cs?.batteryLevel ?? 0;
  const cap = cs?.sdCapacityKB ?? 0;
  const rem = cs?.sdRemainingKB ?? 0;
  const sdPct = cap > 0 ? Math.max(0, Math.min(100, Math.round((rem / cap) * 100))) : null;
  return {
    connected,
    recording: !!cs?.isEncoding,
    recordingSec: cs?.recordingTimeSec ?? 0,
    battery,
    sdPct,
    overheat: !!cs?.overheating,
    lowBattery: battery > 0 && battery < 15,
    sdFull: sdPct !== null && sdPct <= 1,
    name: cs?.hardwareInfo?.ssid || cs?.hardwareInfo?.modelName || 'GoPro',
  };
}

function formatStatusBody(s: CameraStatus): string {
  const parts: string[] = [
    s.sdPct !== null
      ? t('notifications.statusLine', { battery: s.battery, sd: s.sdPct })
      : t('notifications.statusLineNoSd', { battery: s.battery }),
  ];
  const warns: string[] = [];
  if (s.overheat) warns.push(t('notifications.warnOverheat'));
  if (s.lowBattery) warns.push(t('notifications.warnLowBattery'));
  if (s.sdFull) warns.push(t('notifications.warnSdFull'));
  if (warns.length) parts.push('⚠️ ' + warns.join(' · '));
  return parts.join('  ·  ');
}

export async function initNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: WARN_CHANNEL_ID,
        name: 'Camera disconnection',
        importance: AndroidImportance.HIGH,
      });
      await notifee.createChannel({
        id: TEMP_CHANNEL_ID,
        name: 'Temperature warning',
        importance: AndroidImportance.HIGH,
      });
      await notifee.createChannel({
        id: CONNECTION_CHANNEL_ID,
        name: 'Camera connection',
        importance: AndroidImportance.LOW,
      });
    }
    channelsReady = true;
  } catch (e) {
    debugWarn('notif', '[notif] initNotifications failed', e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (e) {
    debugWarn('notif', '[notif] requestNotificationPermission failed', e);
    return false;
  }
}

/** Warn that an established connection was lost unexpectedly. */
export async function warnUnexpectedDisconnect(deviceName: string): Promise<void> {
  try {
    if (!channelsReady) await initNotifications();
    await notifee.displayNotification({
      title: t('notifications.disconnectTitle'),
      body: t('notifications.disconnectBody', { name: deviceName }),
      android: {
        channelId: WARN_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        color: AndroidColor.RED,
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    debugWarn('notif', '[notif] warnUnexpectedDisconnect failed', e);
  }
}

// ---------------------------------------------------------------------------
// Temperature warnings (per camera, auto-cleared when the condition resolves)
// ---------------------------------------------------------------------------

type TempKind = 'overheat' | 'cold';
const tempId = (deviceId: string, kind: TempKind) => `temp-${kind}-${deviceId}`;

/** Show a high/low temperature warning for a specific camera. */
export async function notifyTemperature(
  deviceId: string,
  name: string,
  kind: TempKind,
): Promise<void> {
  try {
    if (!channelsReady) await initNotifications();
    const title =
      kind === 'overheat' ? t('notifications.tempHighTitle') : t('notifications.tempLowTitle');
    const body =
      kind === 'overheat'
        ? t('notifications.tempHighBody', { name })
        : t('notifications.tempLowBody', { name });
    await notifee.displayNotification({
      id: tempId(deviceId, kind),
      title,
      body,
      android: {
        channelId: TEMP_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        color: kind === 'overheat' ? AndroidColor.RED : AndroidColor.BLUE,
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    debugWarn('notif', '[notif] notifyTemperature failed', e);
  }
}

/** Remove a previously shown temperature warning (condition resolved / disconnected). */
export async function clearTemperature(deviceId: string, kind: TempKind): Promise<void> {
  try {
    await notifee.cancelNotification(tempId(deviceId, kind));
  } catch (e) {
    debugWarn('notif', '[notif] clearTemperature failed', e);
  }
}

// ---------------------------------------------------------------------------
// Android foreground service (also the live status display)
// ---------------------------------------------------------------------------

export function registerConnectionForegroundService(): void {
  if (fgsRegistered || Platform.OS !== 'android') return;
  fgsRegistered = true;
  try {
    notifee.registerForegroundService(() => new Promise<void>(() => {}));
  } catch (e) {
    debugWarn('notif', '[notif] registerForegroundService failed', e);
  }
}

async function renderForegroundService(): Promise<void> {
  const s = buildStatusFromStore();
  await notifee.displayNotification({
    id: FGS_NOTIFICATION_ID,
    title: s.recording
      ? t('notifications.recordingTitle')
      : t('notifications.connectionOngoingTitle'),
    body: formatStatusBody(s),
    android: {
      channelId: CONNECTION_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      onlyAlertOnce: true,
      importance: AndroidImportance.LOW,
      color: s.recording ? AndroidColor.RED : undefined,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
      ],
      showChronometer: s.recording,
      ...(s.recording ? { timestamp: Date.now() - s.recordingSec * 1000 } : {}),
      pressAction: { id: 'default' },
    },
  });
}

/** Start the foreground service (called on connect, from the foreground). */
export async function startConnectionForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    if (!channelsReady) await initNotifications();
    await renderForegroundService();
    fgsActive = true;
  } catch (e) {
    debugWarn('notif', '[notif] startConnectionForegroundService failed', e);
  }
}

/** Update the ongoing notification's status. No-op (never starts) when inactive. */
export async function refreshConnectionForegroundService(): Promise<void> {
  if (Platform.OS !== 'android' || !fgsActive) return;
  // Never refresh once no camera is connected — avoids re-rendering a stale
  // "connected" notification during the disconnect teardown.
  if (!buildStatusFromStore().connected) return;
  try {
    await renderForegroundService();
  } catch (e) {
    debugWarn('notif', '[notif] refreshConnectionForegroundService failed', e);
  }
}

export async function stopConnectionForegroundService(): Promise<void> {
  if (Platform.OS !== 'android' || !fgsActive) return;
  // Flip the flag synchronously so a concurrent refresh can't re-display the
  // notification between here and the awaited stop below.
  fgsActive = false;
  try {
    await notifee.stopForegroundService();
    // stopForegroundService should remove the notification, but cancel by id too
    // so a stale "connected" notification can never linger after disconnect.
    await notifee.cancelNotification(FGS_NOTIFICATION_ID);
  } catch (e) {
    debugWarn('notif', '[notif] stopForegroundService failed', e);
  }
}

// ---------------------------------------------------------------------------
// iOS recording status notification
// ---------------------------------------------------------------------------

/** Show/refresh the iOS recording status notification (record start / important event). */
export async function presentRecordingStatus(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    if (!channelsReady) await initNotifications();
    const s = buildStatusFromStore();
    await notifee.displayNotification({
      id: IOS_REC_NOTIFICATION_ID,
      title: t('notifications.recordingTitle'),
      body: formatStatusBody(s),
    });
  } catch (e) {
    debugWarn('notif', '[notif] presentRecordingStatus failed', e);
  }
}

/** Remove the iOS recording status notification (record stop). */
export async function clearRecordingStatus(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await notifee.cancelNotification(IOS_REC_NOTIFICATION_ID);
  } catch (e) {
    debugWarn('notif', '[notif] clearRecordingStatus failed', e);
  }
}
