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

import { describe, it, expect } from 'vitest';
import en from './en.json';
import ja from './ja.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import itIT from './it.json';
import pt from './pt.json';
import ko from './ko.json';
import zh from './zh.json';
import zhTW from './zh-TW.json';

/** All non-English translations, keyed by their locale tag. English is the reference. */
const translations: { [locale: string]: Record<string, unknown> } = {
  ja,
  es,
  fr,
  de,
  it: itIT,
  pt,
  ko,
  zh,
  'zh-TW': zhTW,
};

/**
 * Recursively get all nested keys in a flat dot-notation format.
 * Example: { common: { cancel: "Cancel" } } -> ["common.cancel"]
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function emptyValueKeys(obj: Record<string, unknown>): string[] {
  return flattenKeys(obj).filter((k) => {
    const parts = k.split('.');
    let cur: unknown = obj;
    for (const p of parts) {
      if (typeof cur === 'object' && cur !== null) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return false;
      }
    }
    return typeof cur === 'string' && cur.trim() === '';
  });
}

describe('i18n translation integrity', () => {
  const enKeys = flattenKeys(en);

  it('no empty translation values in en', () => {
    const empties = emptyValueKeys(en);
    expect(empties, `Empty en values: ${empties.join(', ')}`).toHaveLength(0);
  });

  for (const [locale, dict] of Object.entries(translations)) {
    describe(locale, () => {
      it('has the same keys as en', () => {
        const localeKeys = flattenKeys(dict);
        const missing = enKeys.filter((k) => !localeKeys.includes(k));
        const extra = localeKeys.filter((k) => !enKeys.includes(k));

        expect(missing, `Keys missing in ${locale}.json: ${missing.join(', ')}`).toHaveLength(0);
        expect(extra, `Extra keys in ${locale}.json: ${extra.join(', ')}`).toHaveLength(0);
      });

      it('has no empty values', () => {
        const empties = emptyValueKeys(dict);
        expect(empties, `Empty ${locale} values: ${empties.join(', ')}`).toHaveLength(0);
      });
    });
  }
});
