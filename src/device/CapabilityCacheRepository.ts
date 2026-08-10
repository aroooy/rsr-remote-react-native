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

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'gopro_devices.db';
const TABLE_NAME = 'capability_cache_v1';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export const initCapabilityCacheTable = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      cameraId TEXT PRIMARY KEY,
      data     TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
};

export const loadCapabilityCache = async (
  cameraId: string,
): Promise<Record<string, Record<number, number[]>>> => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(
    `SELECT data FROM ${TABLE_NAME} WHERE cameraId = ?;`,
    [cameraId],
  );
  if (!row) return {};
  try {
    return JSON.parse(row.data);
  } catch (e) {
    console.warn('[BLE] Failed to parse capability cache JSON', e);
    return {};
  }
};

let saveTimeout: NodeJS.Timeout | null = null;
let pendingSaveData: Record<string, Record<number, number[]>> | null = null;
let pendingSaveCameraId: string | null = null;
let globalSaveVersion = 0;
const cameraSaveVersions = new Map<string, number>();

const getCameraSaveVersion = (cameraId: string): number => cameraSaveVersions.get(cameraId) ?? 0;

const bumpCameraSaveVersion = (cameraId: string): void => {
  cameraSaveVersions.set(cameraId, getCameraSaveVersion(cameraId) + 1);
};

const bumpAllSaveVersions = (): void => {
  globalSaveVersion += 1;
  cameraSaveVersions.clear();
};

const cancelPendingCapabilityCacheSave = (cameraId?: string): void => {
  if (!saveTimeout) {
    if (!cameraId || pendingSaveCameraId === cameraId) {
      pendingSaveCameraId = null;
      pendingSaveData = null;
    }
    return;
  }

  if (cameraId && pendingSaveCameraId !== cameraId) return;

  clearTimeout(saveTimeout);
  saveTimeout = null;
  pendingSaveCameraId = null;
  pendingSaveData = null;
};

export const saveCapabilityCache = (
  cameraId: string,
  cacheData: Record<string, Record<number, number[]>>,
): void => {
  if (!cameraId) return;
  const scheduledGlobalVersion = globalSaveVersion;
  const scheduledCameraVersion = getCameraSaveVersion(cameraId);
  pendingSaveCameraId = cameraId;
  pendingSaveData = cacheData;
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    if (!pendingSaveCameraId || !pendingSaveData) return;
    const cid = pendingSaveCameraId;
    const data = pendingSaveData;
    if (scheduledGlobalVersion !== globalSaveVersion) return;
    if (scheduledCameraVersion !== getCameraSaveVersion(cid)) return;

    const run = async () => {
      if (scheduledGlobalVersion !== globalSaveVersion) return;
      if (scheduledCameraVersion !== getCameraSaveVersion(cid)) return;

      const db = await getDb();
      const now = new Date().toISOString();
      const dataString = JSON.stringify(data);
      await db.runAsync(
        `INSERT OR REPLACE INTO ${TABLE_NAME} (cameraId, data, updatedAt) VALUES (?, ?, ?);`,
        [cid, dataString, now],
      );
    };
    saveQueue = saveQueue.then(run, run);
  }, 2000);
};

export const clearCapabilityCache = async (cameraId: string): Promise<void> => {
  if (!cameraId) return;
  cancelPendingCapabilityCacheSave(cameraId);
  bumpCameraSaveVersion(cameraId);
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE cameraId = ?;`, [cameraId]);
};

export const clearAllCapabilityCaches = async (): Promise<void> => {
  cancelPendingCapabilityCacheSave();
  bumpAllSaveVersions();
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TABLE_NAME};`);
};
