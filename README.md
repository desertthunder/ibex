# Intrepid Ibex

A recreation of Ubuntu 8.10 as an ATProto browser. Inspired by
[docs.surf](https://docs.surf).

![Screenshot](./doc/screenshot.png)

## Apps

### Nautilus

The main repo browser. It lists public collections, groups them by namespace,
filters collections, pages through records, searches cached records, and opens
records in gedit or media in Eye of GNOME.

### gedit

A read-only record viewer. It opens JSON records from Nautilus with copy, word
wrap, syntax highlighting, and tabs for JSON, inferred schema details, and record
info such as AT URI, CID, raw PDS link, and external links.

### Eye of GNOME

A media viewer for repo blobs and record-attached media. It is used when Nautilus
finds image or media blob references in a selected record.

### Identity Inspector

A public identity window for DID documents, aliases, services, verification
methods, rotation keys, handle checks, and PDS links.

### About

A small “About This Computer” window with OS, account, DID, PDS, and project links.

## Theme

The desktop follows Ubuntu 8.10 and classic GNOME: Humanity icons, Ubuntu fonts,
brown panels, tan window chrome, desktop shortcuts, and draggable/resizable windows.

Syntax highlighting uses a JSON-only Shiki bundle with an Ubuntu terminal palette
based on the Base 16 spec.

## Credits

- Ubuntu 11 ([duh](https://archive.org/details/ubuntu-11.10-desktop-i386-20110812))
- Atmosphere app logos are adapted from
  [atmologos](https://tangled.org/cozylittle.house/atmologos).
- Atmosphere [info](/src/routes/docs/atmosphere.md) adapted from
  [Atmosphere Account](https://atmosphereaccount.com/).
