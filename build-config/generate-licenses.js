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

/**
 * Generates src/constants/ossLicenses.json — the OSS attribution list shown
 * in the in-app "Open Source Licenses" screen (OssLicensesScreen).
 *
 * Walks package-lock.json (lockfile v3) and collects every production
 * (non-dev) package, reading the license and repository URL from the
 * installed package's package.json. Packages that are not actually installed
 * (e.g. optional dependencies for other platforms) are skipped.
 *
 * Run after changing dependencies:  npm run generate:licenses
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const lockPath = path.join(repoRoot, 'package-lock.json');
const outPath = path.join(repoRoot, 'src', 'constants', 'ossLicenses.json');

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
if (lock.lockfileVersion < 2 || !lock.packages) {
  process.stderr.write('package-lock.json v2/v3 with a "packages" map is required\n');
  process.exit(1);
}

const normalizeRepositoryUrl = (repo) => {
  let url = null;
  if (typeof repo === 'string') url = repo;
  else if (repo && typeof repo.url === 'string') url = repo.url;
  if (!url) return null;
  url = url
    .replace(/^git\+/, '')
    .replace(/\.git(#.*)?$/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@github\.com:/, 'https://github.com/');
  return /^https?:\/\//.test(url) ? url : null;
};

const readLicense = (pkgJson) => {
  if (typeof pkgJson.license === 'string') return pkgJson.license;
  if (pkgJson.license && typeof pkgJson.license.type === 'string') return pkgJson.license.type;
  if (Array.isArray(pkgJson.licenses)) {
    const types = pkgJson.licenses.map((l) => l && l.type).filter(Boolean);
    if (types.length > 0) return types.join(' OR ');
  }
  return 'Unknown';
};

const seen = new Map();
let skippedNotInstalled = 0;

for (const [pkgPath, info] of Object.entries(lock.packages)) {
  if (!pkgPath.includes('node_modules/')) continue; // skip the root project
  if (info.dev) continue; // dev-only dependency: not shipped

  const name = info.name || pkgPath.replace(/^.*node_modules\//, '');
  const version = info.version;
  if (!version) continue;
  const key = `${name}@${version}`;
  if (seen.has(key)) continue;

  let pkgJson;
  try {
    pkgJson = JSON.parse(fs.readFileSync(path.join(repoRoot, pkgPath, 'package.json'), 'utf8'));
  } catch {
    skippedNotInstalled += 1; // not installed on this platform
    continue;
  }

  seen.set(key, {
    name,
    version,
    license: readLicense(pkgJson),
    repository: normalizeRepositoryUrl(pkgJson.repository),
  });
}

const list = Array.from(seen.values()).sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
);

fs.writeFileSync(outPath, JSON.stringify(list, null, 2) + '\n');
process.stdout.write(
  `Wrote ${list.length} packages to ${path.relative(repoRoot, outPath)}` +
  (skippedNotInstalled > 0 ? ` (${skippedNotInstalled} not installed, skipped)` : '') + '\n',
);

const unknown = list.filter((e) => e.license === 'Unknown');
if (unknown.length > 0) {
  process.stdout.write(`Packages with unknown license (verify manually): ${unknown.map((e) => e.name).join(', ')}\n`);
}