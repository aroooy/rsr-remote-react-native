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
import { GoProPresetGroupData } from '../ble/PresetProtobuf';
import { resolveBaseDisplayPresetId } from '../cameraModels/shared/displayPreset';

const DB_NAME = 'gopro_devices.db';
const TABLE_NAME = 'preset_meta_cache';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Serialization queue to prevent transaction conflicts from concurrent savePresetMetaCache calls */
let saveQueue: Promise<void> = Promise.resolve();

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

/**
 * Persistent cache of preset metadata (iconId / customName / titleId / groupId / basePresetId).
 * Intended to make the initial UI display immediate when reconnecting via BLE.
 * Setting values (preset.settings[]) are not stored (since they must follow the live camera state).
 */
export const initPresetMetaCacheTable = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      cameraId    TEXT    NOT NULL,
      groupId     INTEGER NOT NULL,
      presetId    INTEGER NOT NULL,
      titleId     INTEGER NOT NULL,
      titleNumber INTEGER NOT NULL,
      basePresetId INTEGER,
      userDefined INTEGER NOT NULL,
      iconId      INTEGER NOT NULL,
      customName  TEXT,
      updatedAt   TEXT    NOT NULL,
      PRIMARY KEY (cameraId, presetId)
    );
  `);
  try {
    await db.execAsync(`ALTER TABLE ${TABLE_NAME} ADD COLUMN basePresetId INTEGER;`);
  } catch {
    // column already exists
  }
  await db.runAsync(
    `UPDATE ${TABLE_NAME} SET basePresetId = presetId WHERE basePresetId IS NULL AND userDefined = 0;`,
  );
};

type Row = {
  cameraId: string;
  groupId: number;
  presetId: number;
  titleId: number;
  titleNumber: number;
  basePresetId: number | null;
  userDefined: number;
  iconId: number;
  customName: string | null;
};

/**
 * Returns PresetGroup[] restored from cache.
 * settings, isModified, isFixed, and isVisible are dynamic data fetched via BLE, so they are initialized empty/default.
 */
export const loadPresetMetaCache = async (cameraId: string): Promise<GoProPresetGroupData[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM ${TABLE_NAME} WHERE cameraId = ? ORDER BY groupId ASC, presetId ASC;`,
    [cameraId],
  );
  if (rows.length === 0) return [];

  const groupMap = new Map<number, GoProPresetGroupData>();
  for (const row of rows) {
    let group = groupMap.get(row.groupId);
    if (!group) {
      group = { groupId: row.groupId, presets: [] };
      groupMap.set(row.groupId, group);
    }
    group.presets.push({
      id: row.presetId,
      titleId: row.titleId,
      titleNumber: row.titleNumber,
      basePresetId: row.basePresetId ?? (row.userDefined === 1 ? undefined : row.presetId),
      userDefined: row.userDefined === 1,
      isModified: false,
      isFixed: false,
      isVisible: true,
      customName: row.customName,
      iconId: row.iconId,
      settings: [],
    });
  }
  return Array.from(groupMap.values());
};

export const savePresetMetaCache = async (
  cameraId: string,
  groups: GoProPresetGroupData[],
  options?: { allowCustomNames?: boolean },
): Promise<void> => {
  if (!cameraId) return;
  const allowCustomNames = options?.allowCustomNames ?? true;
  // Serialize concurrent calls: start the next save only after the previous save completes
  const run = async () => {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      // Full refresh: Delete existing rows for this cameraId before inserting new ones
      // (Prevents stale data from remaining if presets are deleted)
      await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE cameraId = ?;`, [cameraId]);
      for (const group of groups) {
        for (const preset of group.presets) {
          const basePresetId =
            preset.basePresetId ??
            resolveBaseDisplayPresetId(preset, preset.id, group.groupId) ??
            (preset.userDefined ? null : preset.id);
          await db.runAsync(
            `INSERT INTO ${TABLE_NAME}
               (cameraId, groupId, presetId, titleId, titleNumber, basePresetId, userDefined, iconId, customName, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              cameraId,
              group.groupId,
              preset.id,
              preset.titleId,
              preset.titleNumber,
              basePresetId,
              preset.userDefined ? 1 : 0,
              preset.iconId,
              allowCustomNames ? preset.customName : null,
              now,
            ],
          );
        }
      }
    });
  };
  saveQueue = saveQueue.then(run, run);
  return saveQueue;
};

/**
 * Updates metadata for a single preset (intended to be called upon successful renameActivePreset).
 */
export const updatePresetMetaCacheEntry = async (
  cameraId: string,
  presetId: number,
  fields: { customName?: string | null; iconId?: number },
): Promise<void> => {
  if (!cameraId) return;
  const db = await getDb();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (fields.customName !== undefined) {
    sets.push('customName = ?');
    params.push(fields.customName);
  }
  if (fields.iconId !== undefined) {
    sets.push('iconId = ?');
    params.push(fields.iconId);
  }
  if (sets.length === 0) return;
  sets.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(cameraId);
  params.push(presetId);
  await db.runAsync(
    `UPDATE ${TABLE_NAME} SET ${sets.join(', ')} WHERE cameraId = ? AND presetId = ?;`,
    params,
  );
};

export const clearPresetMetaCache = async (cameraId: string): Promise<void> => {
  if (!cameraId) return;
  const run = async () => {
    const db = await getDb();
    await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE cameraId = ?;`, [cameraId]);
  };
  saveQueue = saveQueue.then(run, run);
  return saveQueue;
};

export const clearAllPresetMetaCaches = async (): Promise<void> => {
  const run = async () => {
    const db = await getDb();
    await db.runAsync(`DELETE FROM ${TABLE_NAME};`);
  };
  saveQueue = saveQueue.then(run, run);
  return saveQueue;
};
