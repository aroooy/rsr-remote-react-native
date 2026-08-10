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
 * Expo Config Plugin: withDisableLint
 *
 * Appends lintOptions configuration to android/app/build.gradle to disable
 * release lint checks. This prevents ExtraTranslation errors caused by iOS-only
 * localization keys defined in app.json locales.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

function withDisableLint(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    const lintConfig = `
// --- withDisableLint: disable lint checks on release build to prevent ExtraTranslation errors ---
android {
    lintOptions {
        checkReleaseBuilds false
        abortOnError false
    }
}
// --- end withDisableLint ---
`;

    if (!contents.includes('withDisableLint')) {
      cfg.modResults.contents = contents + '\n' + lintConfig;
    }
    return cfg;
  });
}

module.exports = withDisableLint;