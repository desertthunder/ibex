# Intrepid Ibex To-Dos

v1 is a static, public, read-only ATProto browser deployed to Cloudflare Pages.
It should feel like Ubuntu 8.10 / GNOME 2, run entirely in the browser, and require
no authentication or server.

## Routing

- Add shareable record routes:
  - `/records/:did/:collection/:rkey`
- Use DIDs, not handles, as canonical URL identity because DIDs are stable.
- When opening a record route directly, boot the full desktop shell, select the
  repo/collection in Nautilus, and open the record in gedit.
- Fetch direct record links client-side with public ATProto, likely
  `com.atproto.repo.getRecord`.
- Opportunistically hydrate public identity metadata for nicer labels: handle,
  display name, avatar, DID, and PDS.

## Browser

- Preserve the first-run public handle setup flow for browsing a repo.
- Add handle typeahead to setup using `app.bsky.actor.searchActorsTypeahead`.
- Keep repository collection browsing in Nautilus.
- Keep cursor-based pagination / “Load more records” for large collections.
- Keep public record JSON viewing in gedit.
- Keep local record caching and full-text search across cached records.
- Keep user-readable network and cache errors.

## Apps

Every new surface should feel like a GNOME 2 app that happens to speak `at://`.

- **Nautilus**
  - Browse public repo collections.
  - Select collections and records.
  - Open records in gedit or media blobs in Eye of GNOME.
  - Surface cached/search states clearly.
- **gedit**
  - Read-only JSON viewer for records.
  - Preserve copy, wrapping, syntax highlighting, and native GTK-style window behavior.
- **Eye of GNOME (eog)**
  - Add image/blob viewing.
  - Open from Nautilus when a record contains embedded images or media blobs.
  - Support `app.bsky.feed.post` embedded images as the first target.
- **About This Computer**
  - Show OS/theme info and current public repo identity metadata when available.
- **Desktop shell**
  - Preserve brown panels, tan chrome, Humanity icons, small dense spacing, task buttons,
    tray affordances, and movable/resizable windows.

## V2

- **gnome-terminal**
  - AT Protocol REPL: resolve handles, inspect DID documents, run raw
    `com.atproto.*` / `app.bsky.*` queries, and page through results as
    scrolling terminal output.
- **Evolution / Thunderbird**
  - Conversation viewer for `chat.bsky.convo.*` records, presented as a classic mail
    client with an inbox list and reading pane.
- **Contacts**
  - Follows / followers graph browser built on `app.bsky.graph.follow`; show avatar,
    handle, and mutual-follow status in an address-book layout.
- **File Roller**
  - Export any collection to a `.json` archive or CAR file for local backup.
  - Import archives to preview records without a live PDS connection.
- Local starred/bookmarked records surfaced as a “Bookmarks” sidebar item in Nautilus.
- Sync indicator in the panel showing last-synced time per repo/collection.
- Multi-repo switching from the panel without implying authentication.
