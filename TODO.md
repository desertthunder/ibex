# Intrepid Ibex To-Dos

v1 is a static, public, read-only ATProto browser deployed to Cloudflare Pages.
It should feel like Ubuntu 8.10 / GNOME 2, run entirely in the browser, and require
no authentication or server.

## Routing

- Keep `/` as the desktop home.
- Keep `/browse` as the configured/default public repo in Nautilus.
- Add canonical repo routes under `/repos/:did`.
- Add collection routes at `/repos/:did/collections/:collection`.
- Add record routes at `/repos/:did/collections/:collection/:rkey`.
- Add app routes that open the matching GNOME-style window:
  - `/repos/:did/map` -> Network Map.
  - `/repos/:did/identity` -> Identity Inspector.
  - `/repos/:did/logs` -> Log Viewer.
  - `/repos/:did/blobs` and `/repos/:did/blobs/:cid` -> Eye of GNOME.
  - `/live`, `/live/jetstream`, `/live/firehose`, `/live/spacedust` -> System Monitor.
  - `/labels` -> Label Browser.
  - `/car` -> Archive Manager.
  - `/servers/:host` -> Network Servers.
  - `/lexicons` and `/lexicons/:nsid` -> Web Browser.
- Route loaders should stay browser-only and public/read-only.
- DIDs remain canonical in URLs; handles are accepted as lookup/input affordances and
  resolved client-side.

## Apps

Every new surface should feel like a GNOME 2 app that happens to speak `at://`.

- [ ] **Nautilus**
  - Preserve the first-run public handle setup flow for browsing a repo.
  - Add handle typeahead to setup using `app.bsky.actor.searchActorsTypeahead`.
  - Browse public repo collections.
  - Select collections and records.
  - Open records in gedit or media blobs in Eye of GNOME.
  - Keep cursor-based pagination / “Load more records” for large collections.
  - Keep local record caching and full-text search across cached records.
  - Keep user-readable network and cache errors.
  - Surface cached/search states clearly.
  - Add collection filtering, reverse order, page-size controls, and preview field
    selection.
  - Add collection schema tabs and links into System Monitor for the selected repo or
    collection.
- [ ] **gedit**
  - Read-only JSON viewer for records.
  - Preserve copy, wrapping, syntax highlighting, and native GTK-style window behavior.
  - Add record tabs for JSON, schema, backlinks, and info.
  - Show AT URI, CID, raw PDS link, external app links, and read-only verification status.
- [ ] **Eye of GNOME (eog)**
  - List public repo blob CIDs via `com.atproto.sync.listBlobs`.
  - Open from Nautilus when a record contains embedded images or media blobs.
  - Preview image/video blobs, with `app.bsky.feed.post` embedded images as the first
    target.
  - Link each blob back to its repo and raw PDS URL when possible.
- [ ] **Network Map**
  - Visualize an account at the center with app namespaces around it.
  - Show app count, record-type count, PDS hosting status, and app/domain validation.
  - Let users hide unresolved apps and jump from an app namespace into Nautilus.
- [ ] **System Monitor**
  - Icon: `/icons/humanity/apps/utilities-system-monitor.svg`.
  - Read-only live ATProto monitor for Jetstream, Firehose, and Spacedust-style backlink
    streams.
  - Filter by DID, collection, cursor, and stream instance where supported.
  - Show event rate, total events, top collections/sources, expandable JSON, and copy.
- [ ] **Identity Inspector**
  - Icon: `/icons/humanity/apps/identity-inspector.svg`.
  - Show DID document, aliases, services, verification methods, and rotation keys.
  - Validate handles through DNS TXT and `.well-known` when possible.
  - Link out to PDS endpoints and copy identity fields.
- [ ] **Log Viewer**
  - Show PLC audit history for `did:plc` identities.
  - Present alias, service, verification method, and rotation-key diffs.
  - Include event filters, validation status, and hash links to individual log entries.
- [ ] **Archive Manager**
  - Icon: `/icons/humanity/apps/archive-manager.svg`.
  - Open local CAR files without requiring a live PDS connection.
  - Browse archive collections and records in the same read-only style as Nautilus/gedit.
  - Export archive contents to a ZIP of JSON files.
- [ ] **Label Browser**
  - Query public labeler services with URI patterns.
  - Show label value, target, CID, negation, created/expiry timestamps, and pagination.
  - Add client-side label filtering with wildcard include and `-exclude` support.
- [ ] **Network Servers**
  - Inspect public PDS host info, version, available domains, and repo list.
  - Link repos into Nautilus and open server firehose views in System Monitor.
- [ ] **Web Browser**
  - GNOME-style browser for reading Lexicon schemas and resolution traces.
  - Accept NSIDs, `at://` lexicon records, and HTTPS URLs in an address bar.
  - Parse NSIDs into domain authority, authority domain, name segment, and optional
    fragment.
  - For live lookup, resolve the NSID authority domain through DNS from the browser,
    likely via DNS-over-HTTPS rather than a backend resolver.
  - Use the goat/Indigo Lexicon publication convention: read `did=...` TXT records
    from the NSID authority domain.
  - Show a resolution trace with each attempted DNS name, record type, answer, fetch URL,
    status, and error details.
  - Display Lexicon JSON and a readable schema view with definitions, primary type,
    required fields, refs, unions, known values, and descriptions.
  - Link gedit Schema tabs and Nautilus collection schema actions into the matching
    browser view.
  - Keep lookup public/read-only.
  - Make unsupported NSIDs clear: ATProto does not define universal automated NSID
    schema fetching or enumeration.
- [ ] **About This Computer**
  - Show OS/theme info and current public repo identity metadata when available.

## Priority Order

- [x] Add canonical `/repos/:did/...` routing.
- [x] Deepen Nautilus and gedit with collection controls plus record JSON/schema/info tabs.
- [x] Add Identity Inspector.
- [ ] Add System Monitor with Jetstream first.
- [ ] Add Network Map.
- [ ] Add Archive Manager.
- [ ] Add Eye of GNOME blob browsing and previews.
- [ ] Add Label Browser.
- [ ] Add Web Browser for Lexicon viewing.
- [ ] Add Log Viewer.
- [ ] Add Network Servers.

## Tests

- Vitest unit tests for pure helpers and data behavior:
  - ATProto route helpers.
  - identity normalization and DID/PDS resolution helpers.
  - repo record summarization and collection grouping.
  - pagination behavior.
  - local DB migrations, cache repositories, and search.
- Browser/component tests for desktop UI behavior:
  - first-run setup and handle typeahead states.
  - Nautilus collection selection, search, pagination, and record opening.
  - gedit JSON display, copy behavior, and record metadata tabs.
  - Web Browser NSID parsing, vendored schema display, and resolution trace states.
  - window manager open, focus, minimize, maximize, and route-driven gedit opening.
- Playwright E2E/smoke tests for critical flows:
  - `/` boots the desktop.
  - `/browse` opens the configured repo after setup.
  - `/repos/:did` hydrates identity and opens Nautilus.
  - `/repos/:did/collections/:collection` selects the collection.
  - `/repos/:did/collections/:collection/:rkey` opens Nautilus and gedit around the record.
  - Mock external ATProto boundaries in tests unless the test is explicitly an integration
    smoke test.

## Parking Lot

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
- Local starred/bookmarked records surfaced as a “Bookmarks” sidebar item in Nautilus.
- Sync indicator in the panel showing last-synced time per repo/collection.
- Multi-repo switching from the panel without implying authentication.

- Relay
