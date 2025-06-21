<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0](https://github.com/rexxars/namecheap-dns-updater/compare/v1.0.1...v2.0.0) (2025-06-21)

### ⚠ BREAKING CHANGES

- This module now requires node.js version 20 or higher.

### Features

- add `--interval` and `--verbose` cli flags ([59a3e88](https://github.com/rexxars/namecheap-dns-updater/commit/59a3e8827b2b063108b95b726714c56293330786))
- add types, allow array of hosts ([05326b0](https://github.com/rexxars/namecheap-dns-updater/commit/05326b039efb61eb1382f696d1284ac8e5a6cf5c))
- allow passing `apiHost` option (or use `NC_DDNS_API_HOST`) ([75b17bb](https://github.com/rexxars/namecheap-dns-updater/commit/75b17bbd65afc764215ab57c608d11e13d7bd408))
- require node 20, use native fetch ([37c98e3](https://github.com/rexxars/namecheap-dns-updater/commit/37c98e30b223b7379e24f2c891ef5f20fa8a0e29))

## [1.0.1](https://github.com/rexxars/namecheap-dns-updater/compare/v1.0.0...v1.0.1) (2025-05-27)

### Bug Fixes

- explicit `ip` parameter ([#1](https://github.com/rexxars/namecheap-dns-updater/issues/1)) ([24ac609](https://github.com/rexxars/namecheap-dns-updater/commit/24ac609715255f5b8311b008b41d9882e7bc2b07))

## [1.0.0](https://github.com/rexxars/namecheap-dns-updater/compare/v0.0.1...v1.0.0) (2023-09-08)

### ⚠ BREAKING CHANGES

- move IP assignment prior to URL construction

### Bug Fixes

- move IP assignment prior to URL construction ([f5fde6b](https://github.com/rexxars/namecheap-dns-updater/commit/f5fde6b072945a77d14f1817521ddb2242233a0c))
