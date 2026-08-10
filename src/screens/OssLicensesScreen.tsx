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

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGoProStore } from '../store/GoProStore';
import { getThemeColors } from '../constants/Theme';
import { LIBVLC_SOURCE_URL, LGPL_2_1_TEXT_URL } from '../constants/AppLinks';
import ossLicenses from '../constants/ossLicenses.json';

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  repository: string | null;
};

const openUrl = (url: string | null) => {
  if (url) void Linking.openURL(url).catch(() => {});
};

export const OssLicensesScreen = () => {
  const { t } = useTranslation();
  const theme = useGoProStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const entries = ossLicenses as LicenseEntry[];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(item) => `${item.name}@${item.version}`}
      ListHeaderComponent={
        <View>
          {/* libVLC is a native component, so it does not appear in the
              npm-generated list below; LGPL requires an explicit notice. */}
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('licenses.nativeComponents')}
            </Text>
            <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>
              {t('licenses.vlcNotice')}
            </Text>
            <TouchableOpacity onPress={() => openUrl(LIBVLC_SOURCE_URL)}>
              <Text style={[styles.link, { color: colors.accent }]}>{LIBVLC_SOURCE_URL}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openUrl(LGPL_2_1_TEXT_URL)}>
              <Text style={[styles.link, { color: colors.accent }]}>
                {t('licenses.lgplFullText')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
            {t('licenses.jsPackages')}
          </Text>
          <Text style={[styles.noticeBody, { color: colors.textMuted, marginBottom: 8 }]}>
            {t('licenses.jsPackagesDesc')}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => openUrl(item.repository)}
          disabled={!item.repository}
          activeOpacity={0.6}
        >
          <Text style={[styles.pkgName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
            <Text style={{ color: colors.textMuted }}>{`  v${item.version}`}</Text>
          </Text>
          <Text style={[styles.pkgLicense, { color: colors.textSecondary }]}>{item.license}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  pkgName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  pkgLicense: {
    fontSize: 12,
    fontWeight: '500',
  },
});
