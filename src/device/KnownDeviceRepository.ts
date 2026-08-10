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
import { KnownDevice, KnownDeviceUpsertInput } from '../types/KnownDevice';

const DB_NAME = 'gopro_devices.db';
const TABLE_NAME = 'known_devices';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export const initKnownDeviceTable = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      displayName TEXT,
      modelNo INTEGER,
      modelName TEXT,
      boardType INTEGER,
      firmwareVersion TEXT,
      serialNumber TEXT,
      ssid TEXT,
      macAddress TEXT,
      lastSeenAt TEXT,
      lastConnectedAt TEXT,
      sortOrder INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  // Migration from old schema: Add new columns if they do not exist
  const migrations = [
    'displayName TEXT',
    'modelNo INTEGER',
    'modelName TEXT',
    'boardType INTEGER',
    'firmwareVersion TEXT',
    'serialNumber TEXT',
    'ssid TEXT',
    'macAddress TEXT',
    'sortOrder INTEGER',
  ];
  for (const col of migrations) {
    try {
      await db.execAsync(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${col};`);
    } catch {
      // Ignore if the column already exists
    }
  }
};

export const getKnownDevices = async (): Promise<KnownDevice[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<KnownDevice>(`
    SELECT id, name, displayName, modelNo, modelName, boardType, firmwareVersion, serialNumber, ssid, macAddress,
           lastSeenAt, lastConnectedAt, sortOrder, createdAt, updatedAt
    FROM ${TABLE_NAME}
    ORDER BY
      CASE WHEN sortOrder IS NULL THEN 1 ELSE 0 END,
      sortOrder ASC,
      CASE WHEN lastConnectedAt IS NULL THEN 1 ELSE 0 END,
      lastConnectedAt DESC,
      updatedAt DESC;
  `);
  return rows;
};

export const getKnownDeviceById = async (id: string): Promise<KnownDevice | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<KnownDevice>(
    `
    SELECT id, name, displayName, modelNo, modelName, boardType, firmwareVersion, serialNumber, ssid, macAddress,
           lastSeenAt, lastConnectedAt, sortOrder, createdAt, updatedAt
    FROM ${TABLE_NAME}
    WHERE id = ?;
  `,
    [id],
  );
  return row ?? null;
};

export const upsertKnownDeviceConnected = async (input: KnownDeviceUpsertInput): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `
    INSERT INTO ${TABLE_NAME} (id, name, displayName, modelNo, modelName, boardType, firmwareVersion, serialNumber, ssid, macAddress,
                               lastSeenAt, lastConnectedAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      displayName = COALESCE(excluded.displayName, ${TABLE_NAME}.displayName),
      modelNo = COALESCE(excluded.modelNo, ${TABLE_NAME}.modelNo),
      modelName = COALESCE(excluded.modelName, ${TABLE_NAME}.modelName),
      boardType = COALESCE(excluded.boardType, ${TABLE_NAME}.boardType),
      firmwareVersion = COALESCE(excluded.firmwareVersion, ${TABLE_NAME}.firmwareVersion),
      serialNumber = COALESCE(excluded.serialNumber, ${TABLE_NAME}.serialNumber),
      ssid = COALESCE(excluded.ssid, ${TABLE_NAME}.ssid),
      macAddress = COALESCE(excluded.macAddress, ${TABLE_NAME}.macAddress),
      lastSeenAt = excluded.lastSeenAt,
      lastConnectedAt = excluded.lastConnectedAt,
      updatedAt = excluded.updatedAt;
    `,
    [
      input.id,
      input.name,
      input.displayName ?? null,
      input.modelNo ?? null,
      input.modelName ?? null,
      input.boardType ?? null,
      input.firmwareVersion ?? null,
      input.serialNumber ?? null,
      input.ssid ?? null,
      input.macAddress ?? null,
      now,
      now,
      now,
      now,
    ],
  );
};

export const deleteKnownDevice = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?;`, [id]);
};

export const updateKnownDeviceSortOrder = async (id: string, sortOrder: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync(`UPDATE ${TABLE_NAME} SET sortOrder = ?, updatedAt = ? WHERE id = ?;`, [
    sortOrder,
    new Date().toISOString(),
    id,
  ]);
};
