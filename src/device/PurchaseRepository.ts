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
 * SQLite persistence layer for in-app purchase records.
 *
 * Stores which product IDs the user has purchased so the app can
 * gate features offline without querying the store every launch.
 */
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'gopro_devices.db';
const TABLE_NAME = 'purchases';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export type PurchaseRecord = {
  productId: string;
  purchaseTime: string;
};

/** Create the purchases table if it doesn't already exist. */
export const initPurchaseTable = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      productId TEXT PRIMARY KEY,
      purchaseTime TEXT NOT NULL
    );
  `);
};

/** Persist a single product purchase. */
export const savePurchase = async (productId: string): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${TABLE_NAME} (productId, purchaseTime) VALUES (?, ?)`,
    [productId, now],
  );
};

/** Fetch all purchased product IDs. */
export const getPurchasedProducts = async (): Promise<string[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<PurchaseRecord>(
    `SELECT * FROM ${TABLE_NAME} ORDER BY purchaseTime ASC`,
  );
  return rows.map((r) => r.productId);
};

/** Remove all purchase records (used before a full restore). */
export const clearPurchases = async (): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
};
