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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './translations/en.json';
import ja from './translations/ja.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import it from './translations/it.json';
import pt from './translations/pt.json';
import ko from './translations/ko.json';
import zh from './translations/zh.json';
import zhTW from './translations/zh-TW.json';
import settingNamesJa from './translations/settingNames.ja.json';

export type AppLocale =
  'auto' | 'ja' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ko' | 'zh' | 'zh-TW';

/** All concrete (non-'auto') languages the app ships translations for. */
export const SUPPORTED_LOCALES = [
  'en',
  'ja',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ko',
  'zh',
  'zh-TW',
] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const resources = {
  en: { translation: en },
  ja: {
    translation: {
      ...ja,
      metadata: {
        ...(ja as { metadata?: Record<string, unknown> }).metadata,
        settingNames: settingNamesJa,
      },
    },
  },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ko: { translation: ko },
  zh: { translation: zh },
  'zh-TW': { translation: zhTW },
};

let initialized = false;

/**
 * Resolve the actual translation language tag from a user-facing locale setting.
 * 'auto' uses the device locale, mapping it to a supported language and falling
 * back to English. Chinese is split into Traditional (zh-TW) for Hant scripts
 * and Taiwan/Hong Kong/Macau regions, and Simplified (zh) otherwise.
 */
export function resolveLocale(appLocale: AppLocale): SupportedLocale {
  if (appLocale !== 'auto') return appLocale;

  const device = Localization.getLocales()[0];
  const tag = device?.languageTag ?? 'en'; // e.g. "zh-Hant-TW", "pt-BR"
  const lang = (device?.languageCode ?? tag.split('-')[0] ?? 'en').toLowerCase();

  if (lang === 'zh') {
    const script = (device?.languageScriptCode ?? '').toLowerCase();
    const region = (device?.regionCode ?? '').toUpperCase();
    const lowerTag = tag.toLowerCase();
    const isTraditional =
      script === 'hant' ||
      lowerTag.includes('hant') ||
      region === 'TW' ||
      region === 'HK' ||
      region === 'MO';
    return isTraditional ? 'zh-TW' : 'zh';
  }

  const supported = SUPPORTED_LOCALES.find((l) => l === lang);
  return supported ?? 'en';
}

/** Synchronous bootstrap — call from index.js before the first render. */
export function initI18n(appLocale: AppLocale = 'auto') {
  const locale = resolveLocale(appLocale);

  if (!initialized) {
    i18n.use(initReactI18next).init({
      lng: locale,
      fallbackLng: 'en',
      supportedLngs: [...SUPPORTED_LOCALES],
      resources,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    initialized = true;
  } else {
    void i18n.changeLanguage(locale);
  }

  return locale;
}

/** Change language at runtime (e.g. from App Settings). */
export function setAppLocale(appLocale: AppLocale) {
  const locale = resolveLocale(appLocale);
  if (!initialized) {
    initI18n(appLocale);
  } else {
    void i18n.changeLanguage(locale);
  }
  return locale;
}

/** Translate outside React components (BLE manager, IAP, metadata helpers). */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export default i18n;
