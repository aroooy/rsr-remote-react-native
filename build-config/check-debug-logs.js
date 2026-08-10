/*
 * Copyright (C) 2026 SPORT-SERVICE RS★R
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const allowedFiles = new Set([
  path.join(repoRoot, 'src', 'utils', 'debugLogging.ts'),
]);
const ignoredDirs = new Set([
  '.git',
  '.expo',
  'node_modules',
  'android',
  'ios',
  'build',
]);
const targetExtensions = new Set(['.js', '.ts', '.tsx']);
const forbiddenPattern = /console\.(log|debug)\s*\(/;

const violations = [];

const scanFile = (filePath) => {
  if (allowedFiles.has(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  const lines = contents.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!forbiddenPattern.test(line)) return;
    violations.push(`${path.relative(repoRoot, filePath)}:${index + 1}: ${line.trim()}`);
  });
};

const walk = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    if (ignoredDirs.has(entry.name)) return;

    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
      return;
    }

    if (!targetExtensions.has(path.extname(entry.name))) return;
    scanFile(entryPath);
  });
};

walk(repoRoot);

if (violations.length === 0) {
  process.stdout.write('check:debug-logs passed\n');
  process.exit(0);
}

console.error('Found console.log/debug outside src/utils/debugLogging.ts:');
violations.forEach((violation) => console.error(violation));
process.exit(1);