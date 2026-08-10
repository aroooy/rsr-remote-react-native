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
 * Expo Config Plugin: with-swift-emit-module-interface
 *
 * Expo SDK 56 + prebuilt React Native requires SWIFT_EMIT_MODULE_INTERFACE = NO
 * on the main app target to prevent "ambiguous implicit access level" errors
 * with Swift 6. The autolinking script only applies this to Pod targets, not
 * the app target, so we inject it here.
 *
 * Usage: app.json plugins array: "./plugins/withSwiftEmitModuleInterface"
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

function withSwiftEmitModuleInterface(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const pbxprojPath = path.join(cfg.modRequest.platformProjectRoot, 'RSRRemote.xcodeproj', 'project.pbxproj');
      const contents = fs.readFileSync(pbxprojPath, 'utf8');

      // Add SWIFT_EMIT_MODULE_INTERFACE = NO to both Debug and Release build configurations
      // by inserting it after SWIFT_OBJC_BRIDGING_HEADER lines that don't already have it nearby.
      if (contents.includes('SWIFT_EMIT_MODULE_INTERFACE')) {
        cfg.modResults.contents = contents;
        return cfg;
      }

      // Match the Debug config: after SWIFT_OBJC_BRIDGING_HEADER line, before SWIFT_OPTIMIZATION_LEVEL
      let result = contents.replace(
        /(\t+\t\tSWIFT_OBJC_BRIDGING_HEADER = "RSRRemote\/RSRRemote-Bridging-Header\.h";\n)(\t+\t\tSWIFT_OPTIMIZATION_LEVEL)/g,
        '$1\t\t\tSWIFT_EMIT_MODULE_INTERFACE = NO;\n$2'
      );

      // Match the Release config: after SWIFT_OBJC_BRIDGING_HEADER line, before SWIFT_VERSION
      result = result.replace(
        /(\t+\t\tSWIFT_OBJC_BRIDGING_HEADER = "RSRRemote\/RSRRemote-Bridging-Header\.h";\n)(\t+\t\tSWIFT_VERSION)/g,
        '$1\t\t\tSWIFT_EMIT_MODULE_INTERFACE = NO;\n$2'
      );

      fs.writeFileSync(pbxprojPath, result, 'utf8');
      cfg.modResults.contents = result;
      return cfg;
    },
  ]);
}

module.exports = withSwiftEmitModuleInterface;