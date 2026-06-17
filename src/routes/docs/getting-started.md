# Getting Started

Intrepid Ibex is a public AT Protocol browser dressed like an Ubuntu 8.10 desktop.
It stores everything in your browser.

## Browse a repo

Start with a public handle such as `desertthunder.dev`. The setup dialog resolves the
handle to a DID and finds the repo's public PDS when it is advertised.

Open **Browse public repo** to view collections in Nautilus. Pick a collection to load
records, then open any record in gedit for a formatted JSON view.

## Share a record

Record windows use stable DID-based URLs:

```txt
/repos/:did/collections/:collection/:rkey
```

Opening one of those links boots the desktop, selects the collection in Nautilus, and
opens the record in gedit.

## Local cache

Records you fetch are cached in your browser with IndexedDB. Search works against that
local cache, and cache failures should stay recoverable from the boot screen.
