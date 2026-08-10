# Agent Operating Guide

This file contains execution steps and boundaries for coding agents working in this repository. Project-wide design policy lives in `.github/copilot-instructions.md`; avoid duplicating it here.

## Commands

- `npx tsc --noEmit` - TypeScript validation. Run after TypeScript source edits.
- `npm run check:cycles` - Detect circular imports under `src/`. Run when touching layout resolvers, facade constants, or model resolver imports.
- `npm run format` / `npm run format:check` - Prettier (shared config with rsr-alignment-react-native in `.prettierrc.json`). Run `format:check` before committing.
- `npx expo start -c` - Start Expo with a cleared Metro cache when stale bundler state or require-cycle warnings may persist.
- `npx expo run:android --device` - Build and launch on an Android device.
- `npx expo run:ios --device` - Build and launch on an iOS device.
- `npx expo install --check` - Check Expo dependency compatibility when build or package issues appear.

## Standard Workflow

1. Start from the file, symbol, log line, or behavior named by the user.
2. Read only enough nearby code to identify the owner of the behavior and a falsifiable hypothesis.
3. Make the smallest edit at the owning abstraction, but verify the fix is consistent with equivalent behavior in other models (e.g., Hero12 vs Hero13). If the change reveals a systemic pattern issue, flag it for broader review.
4. Immediately validate with the narrowest relevant command.
5. Re-check warnings or user-reported logs before saying the issue is resolved.
6. Summarize residual risk separately from confirmed behavior.

## Validation Rules

- Always run `npx tsc --noEmit` after TypeScript edits.
- Run `npm run check:cycles` when editing any of these areas:
  - `src/constants/GoProSettingIds.ts`
  - `src/constants/displayLayoutResolver.ts`
  - `src/constants/*LayoutState.ts`
  - `src/cameraModels/*/layout.ts`
  - imports between `src/constants/*` and `src/cameraModels/*`
- If `npm run check:cycles` reports pre-existing cycles unrelated to the change, identify whether the touched files are part of a new or existing cycle before proceeding.
- For Expo/Metro require-cycle warnings, inspect the import chain directly and remove the cycle before treating the warning as harmless.
- When changing quick toggle visibility, verify all three paths: layout `quickSettingIds`, forced visibility, and selectable value filtering.
- When modifying model-specific behavior (constraints, framing, layouts), cross-check with the equivalent implementation in other models to ensure consistency. Document any intentional deviations.

## Always Do

- Preserve user changes and unrelated worktree state.
- Check git diff before committing or declaring the implementation ready.
- Keep model-specific logic inside `src/cameraModels/<model>/...` or a model-specific constants module when possible.
- Use lightweight constants modules to share preset IDs with model layout files when importing the main facade would create a cycle.
- Prefer model metadata overrides for model-specific labels.
- Prefer capability policies and resolver paths over component-level special cases.
- Use i18n translation keys (`useTranslation`) for all user-facing strings. Do not hardcode Japanese or English text in components. Add new keys to `src/i18n/translations/en.json` and `src/i18n/translations/ja.json`.
- When a fix reveals inconsistent behavior across models, note it in the completion summary even if out of scope.
- Record device-verified decisions in `docs/`: when a spec is settled by testing on a physical device or camera (protocol quirks, timing values, behavior that contradicts documentation or reference source), write it into the relevant `docs/` file with the verified reference values and why alternatives were rejected. Code comments alone are not enough; these decisions must survive refactors.

## Ask First

- Before adding npm packages.
- Before changing global `GOPRO_SETTINGS_METADATA` values for a model-specific label.
- Before large refactors that touch common facades or shared renderer code.
- Before deleting documentation, instruction files, or agent customization files.
- Before updating `docs/` architecture documents to confirm scope and accuracy.

## Never Do

- Do not use BLE advertise names for model detection.
- Do not claim a user-reported problem is fixed while a plausible related warning remains unexplained.
- Do not import `GoProSettingIds.ts` from a model display layout resolver loaded by `displayLayoutResolver.ts`; this can create `GoProSettingIds.ts -> displayLayoutResolver.ts -> cameraModels/<model>/layout.ts -> GoProSettingIds.ts`.
- Do not put one model's special cases into `src/cameraModels/shared/*.ts`.
- Do not add preset-specific UI branches directly to `SettingsPanel.tsx` unless no resolver boundary can own the behavior.
- Do not revert or rewrite unrelated user changes.
- Do not hardcode user-facing strings in components; always use i18n translation keys.
- Do not leave debug logging (`console.log`, `debugLog`) in production code. Use `src/utils/debugLogging.ts` utilities when debug output is needed, and remove them before committing.

## Commit Readiness Checklist

- The diff is limited to files required by the request.
- `npx tsc --noEmit` succeeds.
- `npm run check:cycles` has been run when relevant, and any remaining cycles are understood.
- User-reported logs have either disappeared or are explicitly explained as unrelated with evidence.
- Instruction or documentation changes do not duplicate conflicting rules across files.
- Model-specific changes were cross-checked against equivalent models for consistency.
- No hardcoded user-facing strings remain in the diff.