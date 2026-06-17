# Changelog

## 1.2.0

### Changed

- refactor routing to use a controller
- added a blob viewer made to feel like eye of gnome
- add localStorage backed startup sound from ubuntu
- expand repo browser capabilities with more information
- changed identity resolution to url state based for deep linking
- add build version to sticky note
- added more granular build details to About thie Computer

### Fixed

- fix url positioning
- icon overrides via namespaces

## 1.1.0 - 2026-06-16

### Minor Changes

- Added Changesets release tracking and contributor documentation.
- Added an Identity Inspector for ATProto identity material, handle validation, services,
  verification methods, and PLC rotation keys.
- Added canonical `/repos/:did/identity` routing and desktop/Nautilus launchers for the
  Identity Inspector.
- Added a build version label in the sticky note linked to the project source.
- Marked the current app release as `v1.1.0`.

---

## 1.0.0

### 2026-06-09

#### Added

- Dexie-backed local cache/search foundation using IndexedDB.
  - Versioned stores for accounts, cached records, and collection sync state.
- Ubuntu-purple boot splash that initializes the local cache and offers recovery
  actions.
- Cache-aware AT Protocol browsing: live record fetches populate IndexedDB and
  offline failures can fall back to cached collections/records.
- FlexSearch-powered cache search in the Nautilus-style collection browser.
- Atmosphere app logo mapping for known AT Protocol collection namespaces.
- Cursor-based record pagination with a generator-backed “Load more records” flow.

#### Changed

- Grouped Nautilus collections by top-level namespace folders.

### 2026-06-08

#### Added

- Ubuntu 8.10 / GNOME 2-inspired desktop shell, panel, wallpaper, windows, and Humanity
  icon styling.
- First-run AT Protocol account setup flow with handle resolution and persisted account
  identity.
- Nautilus-style collection browser backed by live AT Protocol repository collection and
  record loading.
- gedit-style JSON record viewer opened from selected records.
- Window management basics including movable, resizable, minimizable, maximizable, and
  closable windows.
- About Computer dialog, desktop icons, sticky note, and Tangled project links.
