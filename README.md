# nestjs-services

An npm workspace monorepo containing NestJS libraries published under `@eddaic`.

| Package                                                                                       | Purpose                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [nestjs-cacheable](packages/nestjs-cacheable/README.md)                                       | DNS caching with cacheable-lookup                            |
| [nestjs-decorators](packages/nestjs-decorators/README.md)                                     | DTO decorators, transformers, validators, and pipes          |
| [nestjs-google-maps](packages/nestjs-google-maps/README.md)                                   | Google Maps API client configuration and convenience methods |
| [nestjs-maxmind-geoip2](packages/nestjs-maxmind-geoip2/README.md)                             | MaxMind GeoIP2 web service client                            |
| [nestjs-thingsboard-http-integration](packages/nestjs-thingsboard-http-integration/README.md) | ThingsBoard telemetry uploads with cached DNS lookups        |

## Development setup

Use Node.js 24 from `.nvmrc` and npm. Run commands from the repository root.

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm run build
```

The lockfile is shared across all workspaces. CI uses Node.js 24 and the locked NestJS 11 dependencies; package manifests define their consumer peer ranges.

This repository contains libraries, so configure API credentials in the consuming application. Unit tests use mocks or HTTP adapters and do not require API keys. Package verification installs dependencies from npm.

## Validation

```sh
npm run check
```

This builds all packages, lints TypeScript, runs unit tests with coverage, and verifies all five npm tarballs in a temporary consumer project. It does not publish packages.

| Command                                                                                                                            | Purpose                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run build`                                                                                                                    | Compile all packages in dependency order                                                     |
| `npm run lint`                                                                                                                     | Run lint and source formatting checks                                                        |
| `npm test -- --runInBand --watchman=false`                                                                                         | Run unit tests without Watchman                                                              |
| `npm run test:cov -- --runInBand --watchman=false`                                                                                 | Run tests and write coverage reports to `coverage/`                                          |
| `npm run test:packages`                                                                                                            | Verify tarball contents, runtime exports, and consumer TypeScript imports; run a build first |
| `npm run build --workspace packages/nestjs-thingsboard-http-integration`                                                           | Build ThingsBoard and its Cacheable dependency                                               |
| `npm test -- --runInBand --watchman=false --runTestsByPath packages/nestjs-decorators/src/int/transformer/int.transformer.spec.ts` | Run a single test file                                                                       |
| `npm audit --omit=dev`                                                                                                             | Check production dependency advisories                                                       |

Coverage collects source files, including Nest module wiring, and excludes tests, declarations, type-only files, and barrel exports.

## Making changes

Each package owns its source and tests under `packages/<package>/src`. Tests live beside implementation files as `*.spec.ts`. Export consumer APIs through the package's `src/index.ts` and its barrels, and update the package README when usage changes.

ThingsBoard depends on Cacheable through both its npm dependency and its TypeScript project reference. Keep those declarations aligned when adding workspace dependencies. The source manifests point to `build/index.js`; the publishing helper prepares a manifest with `index.js` and `index.d.ts` at the published package root.

Generated `build/`, `coverage/`, and `*.tsbuildinfo` files are ignored by Git. To rebuild after deleting outputs while retaining incremental metadata, use `npm run build -- --force`.

See [AGENTS.md](AGENTS.md) for coding-agent instructions.

## Releases

Use one-line Conventional Commit messages, with `!` for breaking changes, for example `fix(nestjs-decorators)!: reject invalid integer inputs`.

Release Please manages package versions, changelogs, and release PRs. The release workflow invokes the publish workflow, which installs from the lockfile, builds, verifies tarballs, prepares the selected package, and publishes it. Make packaging changes in `scripts/prepare-package.mjs` so verification and publishing use the same layout.
