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
const TABLE_NAME = 'setting_visibility';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export const initSettingVisibilityTable = async (): Promise<void> => {
  const db = await getDb();

  // Migration: v1 schema had (settingId PRIMARY KEY) without cameraId/presetId.
  // Check for old schema and drop if found — preferences are non-critical UI data.
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${TABLE_NAME});`);
  const hasCameraId = cols.some((c) => c.name === 'cameraId');
  if (!hasCameraId) {
    await db.execAsync(`DROP TABLE IF EXISTS ${TABLE_NAME};`);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      cameraId  TEXT    NOT NULL,
      presetId  INTEGER NOT NULL,
      settingId INTEGER NOT NULL,
      isVisible INTEGER NOT NULL,
      updatedAt TEXT    NOT NULL,
      PRIMARY KEY (cameraId, presetId, settingId)
    );
  `);
};

export const getSettingVisibilityMap = async (
  cameraId: string,
  presetId: number,
): Promise<Record<number, boolean>> => {
  const db = await getDb();
  const rows = await db.getAllAsync<{ settingId: number; isVisible: number }>(
    `SELECT settingId, isVisible FROM ${TABLE_NAME} WHERE cameraId = ? AND presetId = ?;`,
    [cameraId, presetId],
  );

  const map: Record<number, boolean> = {};
  for (const row of rows) {
    map[row.settingId] = row.isVisible === 1;
  }
  return map;
};

export const setSettingVisible = async (
  cameraId: string,
  presetId: number,
  settingId: number,
  isVisible: boolean,
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO ${TABLE_NAME} (cameraId, presetId, settingId, isVisible, updatedAt)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(cameraId, presetId, settingId) DO UPDATE SET
      isVisible = excluded.isVisible,
      updatedAt = excluded.updatedAt;
    `,
    [cameraId, presetId, settingId, isVisible ? 1 : 0, now],
  );
};
