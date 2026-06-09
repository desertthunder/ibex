# Changelog

## [Unreleased]

Target release: `v1.0.0`.

### 2026-06-09

#### Added

- PGlite-backed local cache/search foundation with WASM build support.
  - Transactional schema migrations for accounts, cached records, collection
    sync state, and record search.
- Ubuntu-purple boot splash that initializes PGlite, runs migrations, and offers
  recovery actions.
- Cache-aware AT Protocol browsing: live record fetches populate PGlite and offline
  failures can fall back to cached collections/records.
- Full-text cache search in the Nautilus-style collection browser.

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
