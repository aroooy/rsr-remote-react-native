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
 * Expo Config Plugin: with-notifee-foreground-service-type
 *
 * Notifee's bundled core service `app.notifee.core.ForegroundService` declares
 * `android:foregroundServiceType="shortService"` (0x800) in its AAR manifest.
 * Our connection monitor runs it as a BLE connection service, requesting the
 * `connectedDevice` type (0x10) at runtime. On Android 14+ the runtime type must
 * be a subset of the type declared in the manifest, otherwise startForeground
 * throws:
 *   foregroundServiceType 0x00000010 is not a subset of ... 0x00000800
 *
 * This plugin merges a <service> override that replaces the declared
 * foregroundServiceType with "connectedDevice" so the two match.
 *
 * Usage: add "./plugins/withNotifeeForegroundServiceType" to expo.plugins.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = 'app.notifee.core.ForegroundService';
const TOOLS_NS = 'http://schemas.android.com/tools';

/**
 * Pure transform (exported for testing): set the notifee foreground service type
 * to `connectedDevice` with a manifest-merger replace rule.
 * @param {object} androidManifest parsed AndroidManifest (modResults shape)
 */
function applyForegroundServiceType(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest.$ = manifest.$ || {};
  if (!manifest.$['xmlns:tools']) {
    manifest.$['xmlns:tools'] = TOOLS_NS;
  }

  const application =
    manifest.application && manifest.application[0] ? manifest.application[0] : null;
  if (!application) return androidManifest;

  application.service = application.service || [];
  let service = application.service.find(
    (s) => s.$ && s.$['android:name'] === SERVICE_NAME
  );
  if (!service) {
    service = { $: { 'android:name': SERVICE_NAME } };
    application.service.push(service);
  }

  // Override the AAR-declared type and tell the manifest merger to replace it.
  service.$['android:foregroundServiceType'] = 'connectedDevice';
  service.$['tools:node'] = 'merge';
  service.$['tools:replace'] = 'android:foregroundServiceType';

  return androidManifest;
}

module.exports = function withNotifeeForegroundServiceType(config) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = applyForegroundServiceType(cfg.modResults);
    return cfg;
  });
};

module.exports.applyForegroundServiceType = applyForegroundServiceType;