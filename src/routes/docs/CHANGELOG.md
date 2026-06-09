# Changelog

## [Unreleased]

Target release: `v1.0.0`.

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
