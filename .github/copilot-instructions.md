# GoPro Expo App Project Instructions

## Project Overview

This is an Expo React Native app for controlling GoPro cameras over BLE. The app renders camera settings, presets, quick toggles, and advanced controls from camera state, model capabilities, and model-specific resolvers.

## Core Principles

- Treat device-provided BLE data and verified real-device logs as the primary source of truth.
- Prefer `modelNo` and hardware information over display names or app-local string labels when making model decisions.
- Preserve stable public facades such as `SettingsPanel.tsx`, `GoProSettingIds.ts`, `GoProMetadata.ts`, and `settingConstraints.ts`; keep model-specific behavior in `src/cameraModels/<model>/...` whenever possible.
- Keep UI components focused on orchestration and generic rendering. Put model-specific layout, visibility, value filtering, and setting constraints behind resolver facades.
- Avoid broad refactors while fixing a model-specific behavior. Change the smallest owning abstraction that directly controls the behavior.

## Architecture Rules

- `GoProSettingIds.ts` is a shared facade for setting IDs, base layouts, and layout builders. Do not add runtime model-specific branching there unless no resolver boundary fits.
- `src/cameraModels/shared/*.ts` should contain dispatchers, shared types, and shared helpers only. Do not put one model's special cases there.
- Model-specific display layout resolvers loaded from `displayLayoutResolver.ts` must not import `GoProSettingIds.ts` directly, because `GoProSettingIds.ts` imports `displayLayoutResolver.ts` and this creates a Metro require cycle. Use lightweight constants modules or local constants instead.
- If a model-specific resolver needs shared preset IDs, place those IDs in a lightweight constants module that does not import the facade it is used to break away from.
- Capability-driven behavior should go through metadata, fallback policies, primary item value resolvers, forced visibility resolvers, or model layout resolvers rather than ad hoc component conditions.

## Coding Guidelines

- Use TypeScript with explicit, narrow types. Do not introduce `any` unless there is no reasonable alternative and the reason is documented.
- Use `camelCase` for functions and variables, `PascalCase` for React components and types.
- Do not use BLE advertise names such as `discover.name` for model logic; users can rename cameras.
- Avoid `cameraModel === 'hero13'` style checks in components. Prefer model number based helpers, hardware feature flags, or model-specific resolvers.
- Do not change global metadata labels for a model-specific behavior. Use model metadata overrides when a value label differs by model.

## Required Mindset For Fixes

- Before editing, identify the controlling code path, one falsifiable local hypothesis, and a cheap check that can disconfirm it.
- If a user reports a log warning, treat the warning as evidence until it is traced or ruled out. Do not call the issue resolved while a plausible related warning remains unexplained.
- After editing, run the narrowest available executable validation before continuing with more edits.
- For layout or resolver changes, consider both the layout definition and the visibility/value filtering path that determines whether an item actually renders.

## Key References

- `docs/guides/02_model-implementation-guide.md`
- `docs/guides/01_model-specific-logic.md`
- `docs/architecture/06_settings-metadata.md`
- `docs/architecture/07_ui-rendering.md`
- `docs/guides/03_capability_policies.md`
