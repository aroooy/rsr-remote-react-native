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
const TABLE_NAME = 'custom_presets';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export type CustomPreset = {
  id: number;
  cameraId: string;
  name: string;
  presetGroup: number;
  settingsJson: string; // JSON.stringify(Record<number, number>)
  updatedAt: string;
  sortOrder: number;
};

export const initCustomPresetTable = async (): Promise<void> => {
  const db = await getDb();
  // Table creation (first time)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cameraId TEXT NOT NULL,
      name TEXT NOT NULL,
      presetGroup INTEGER NOT NULL,
      settingsJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  // Migration for sortOrder column (adding to existing database)
  try {
    await db.execAsync(
      `ALTER TABLE ${TABLE_NAME} ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0;`,
    );
    // Assign id as the initial sortOrder for existing records
    await db.execAsync(`UPDATE ${TABLE_NAME} SET sortOrder = id WHERE sortOrder = 0;`);
  } catch {
    // Ignore if the column already exists
  }
};

export const saveCustomPreset = async (
  cameraId: string,
  name: string,
  presetGroup: number,
  settings: Record<number, number>,
): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  const settingsJson = JSON.stringify(settings);
  // Assign the current maximum sortOrder + 1 to the new record
  const row = await db.getFirstAsync<{ maxOrder: number }>(
    `SELECT COALESCE(MAX(sortOrder), 0) as maxOrder FROM ${TABLE_NAME} WHERE cameraId = ?;`,
    [cameraId],
  );
  const nextOrder = (row?.maxOrder ?? 0) + 1;

  await db.runAsync(
    `INSERT INTO ${TABLE_NAME} (cameraId, name, presetGroup, settingsJson, updatedAt, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cameraId, name, presetGroup, settingsJson, now, nextOrder],
  );
};

export const getCustomPresets = async (cameraId: string): Promise<CustomPreset[]> => {
  const db = await getDb();
  return await db.getAllAsync<CustomPreset>(
    `SELECT * FROM ${TABLE_NAME} WHERE cameraId = ? ORDER BY sortOrder ASC, id ASC;`,
    [cameraId],
  );
};

export const deleteCustomPreset = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?;`, [id]);
};

export const updateSortOrders = async (
  updates: { id: number; sortOrder: number }[],
): Promise<void> => {
  if (updates.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const { id, sortOrder } of updates) {
      await db.runAsync(`UPDATE ${TABLE_NAME} SET sortOrder = ? WHERE id = ?;`, [sortOrder, id]);
    }
  });
};
