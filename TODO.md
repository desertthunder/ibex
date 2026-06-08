# Intrepid Ibex To-Do's

This is a parking lot of ideas and tasks for the project.

## Ideas

Every new surface should feel like a GNOME 2 app that happens to speak `at://`.

### Persistence

- Dexie or PGLite to make records searchable
- Cache fetched collections and records in IndexedDB so the app works offline
- Sync indicator in the panel showing last-synced time per account
- Starred / bookmarked records stored locally and surfaced as a "Bookmarks"
  sidebar item in Nautilus
- Full-text search across locally cached records (Dexie `liveQuery` + a simple
  input in the toolbar)
- Multi-account support: store multiple `AccountIdentity` rows and let the user
  switch between them from the panel

### New apps

- **gnome-terminal**
  - AT Protocol REPL: resolve handles, inspect DID documents,
    run raw `com.atproto.*` / `app.bsky.*` queries, and page through results as
    scrolling terminal output
- **Eye of GNOME (eog)**
  - Image and video viewer that opens from Nautilus when a
    `app.bsky.feed.post` record contains embedded images or a video blob
- **Evolution / Thunderbird**
  - Conversation viewer for `chat.bsky.convo.*`
    records, presented as a classic mail client with an inbox list and a reading pane
- **Contacts**
  - Follows / followers graph browser built on
    `app.bsky.graph.follow`; shows avatar, handle, and mutual-follow status in an
    address-book layout
- **File Roller**
  - Export any collection to a `.json` archive or a CAR file for
    local backup; also import to preview records without a live PDS connection

### Infra

- Cursor-based pagination in Nautilus
