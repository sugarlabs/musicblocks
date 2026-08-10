# Dependency Overrides

This document records `npm` `overrides` in [`package.json`](../package.json)
whose rationale isn't obvious from the version number alone, so future
maintainers know why they exist and when they can be removed.

## `@electron/rebuild` pinned to `3.7.2`

- `@electron/rebuild` is a transitive dependency of `electron-builder`.
- `@electron/rebuild` 4.x requires Node.js `>=22.12.0`.
- Music Blocks currently supports Node.js 20 (see `engines` in `package.json`).
- The override pins `@electron/rebuild` to `3.7.2`, the newest version still
  compatible with Node 20, to avoid an `EBADENGINE` mismatch during install.
- This is an **intentional compatibility constraint, not a permanent pin**.
  It should not be removed just because a newer `@electron/rebuild` becomes
  available.
- **Revisit when:** Music Blocks officially raises its minimum supported
  Node.js version to `>=22.12.0`. At that point, verify Node support and
  Electron packaging compatibility before removing or changing the override.

Added in [#7973](https://github.com/sugarlabs/musicblocks/pull/7973).
