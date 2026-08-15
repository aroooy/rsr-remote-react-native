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
import { LayoutBuilder } from './layout';

describe('LayoutBuilder', () => {
  it('creates empty layout by default', () => {
    const layout = new LayoutBuilder().build();
    expect(layout.quickSettingIds).toEqual([]);
    expect(layout.prioritizedAdvancedSettingIds).toEqual([]);
    expect(layout.defaultVisibleAdvancedSettingIds).toEqual([]);
  });

  it('clones from base layout', () => {
    const base = {
      quickSettingIds: [1, 2],
      prioritizedAdvancedSettingIds: [3, 4],
      defaultVisibleAdvancedSettingIds: [5],
    };
    const layout = new LayoutBuilder(base).build();
    expect(layout.quickSettingIds).toEqual([1, 2]);
    expect(layout.prioritizedAdvancedSettingIds).toEqual([3, 4]);
    expect(layout.defaultVisibleAdvancedSettingIds).toEqual([5]);
  });

  it('does not mutate base layout', () => {
    const base = {
      quickSettingIds: [1, 2],
      prioritizedAdvancedSettingIds: [3],
      defaultVisibleAdvancedSettingIds: [],
    };
    const builder = new LayoutBuilder(base);
    builder.insertAfter('quickSettingIds', 1, 99);
    expect(base.quickSettingIds).toEqual([1, 2]); // unchanged
  });

  describe('insertAfter', () => {
    it('inserts after target', () => {
      const layout = new LayoutBuilder({
        quickSettingIds: [1, 2, 3],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      })
        .insertAfter('quickSettingIds', 2, 99)
        .build();
      expect(layout.quickSettingIds).toEqual([1, 2, 99, 3]);
    });

    it('appends when target not found', () => {
      const layout = new LayoutBuilder({
        quickSettingIds: [1, 2],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      })
        .insertAfter('quickSettingIds', 999, 99)
        .build();
      expect(layout.quickSettingIds).toEqual([1, 2, 99]);
    });

    it('is chainable', () => {
      const builder = new LayoutBuilder({
        quickSettingIds: [1, 2],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      });
      expect(builder.insertAfter('quickSettingIds', 1, 99)).toBe(builder);
    });
  });

  describe('replace', () => {
    it('replaces target with new value', () => {
      const layout = new LayoutBuilder({
        quickSettingIds: [1, 2, 3],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      })
        .replace('quickSettingIds', 2, 99)
        .build();
      expect(layout.quickSettingIds).toEqual([1, 99, 3]);
    });

    it('does nothing when target not found', () => {
      const layout = new LayoutBuilder({
        quickSettingIds: [1, 2],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      })
        .replace('quickSettingIds', 999, 99)
        .build();
      expect(layout.quickSettingIds).toEqual([1, 2]);
    });
  });

  describe('remove', () => {
    it('removes target', () => {
      const layout = new LayoutBuilder({
        quickSettingIds: [1, 2, 3],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      })
        .remove('quickSettingIds', 2)
        .build();
      expect(layout.quickSettingIds).toEqual([1, 3]);
    });

    it('does nothing when target not found', () => {
      const layout = new LayoutBuilder({
        quickSettingIds: [1, 2],
        prioritizedAdvancedSettingIds: [],
        defaultVisibleAdvancedSettingIds: [],
      })
        .remove('quickSettingIds', 999)
        .build();
      expect(layout.quickSettingIds).toEqual([1, 2]);
    });
  });
});
