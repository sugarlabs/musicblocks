# Changelog

All notable changes to Music Blocks are documented in this file. This
file is maintained by release-please based on Conventional Commits.

Do not edit the version sections below by hand — they are generated from
commit messages on `master`. To get an entry here, write a Conventional
Commit (`feat:`, `fix:`, `perf:`, `docs:`, `revert:`); see
[CONTRIBUTING.md](CONTRIBUTING.md#releases-and-the-changelog).

## [3.8.0](https://github.com/sugarlabs/musicblocks/compare/v3.7.1...v3.8.0) (2026-08-08)


### Features

* **edo:** wire EDO temperament consumers and fix scalar transposition ([#7991](https://github.com/sugarlabs/musicblocks/issues/7991)) ([51c0185](https://github.com/sugarlabs/musicblocks/commit/51c018583658efc7a78051dbc217a95557e9d0d2))
* thread EDO through derived scale helpers ([#7986](https://github.com/sugarlabs/musicblocks/issues/7986)) ([1363004](https://github.com/sugarlabs/musicblocks/commit/1363004c339231e4e28999f09864eb7262c3f033))


### Bug Fixes

* headless fast-run path for notation exports ([#7970](https://github.com/sugarlabs/musicblocks/issues/7970)) ([077adff](https://github.com/sugarlabs/musicblocks/commit/077adffd663281fc28c87581f6799f52aa325ebf))
* **phrasemaker:** correct isInitial typo, drop dead field, dedupe lastConnection guard ([#7971](https://github.com/sugarlabs/musicblocks/issues/7971)) ([fb5eb77](https://github.com/sugarlabs/musicblocks/commit/fb5eb775bea4adb092129dee4cbef2d19c1dcfe4))
* stop double-queuing note clamp on beat events ([#7946](https://github.com/sugarlabs/musicblocks/issues/7946)) ([61c2e3f](https://github.com/sugarlabs/musicblocks/commit/61c2e3f42855e6039ebc636336ae389f7de3ef09))

## 3.7.1 (2026-02-15)

Baseline entry. Music Blocks shipped v3.7.1 ("Pre-GSoC-2026") before this
changelog was automated, so there are no generated notes for it or for any
earlier version. See the
[GitHub releases page](https://github.com/sugarlabs/musicblocks/releases)
for the release history up to this point.

Note that the work between v3.7.1 and the commit where this automation was
adopted is not listed anywhere in this file: it predates the changelog but
postdates the last release. For that window, `git log v3.7.1..` is the
record. Generated notes begin with the first release after adoption.
