# nestjs-services

An npm workspace monorepo containing NestJS libraries published under `@eddaic`.

| Package                                                                                       | Purpose                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [nestjs-cacheable](packages/nestjs-cacheable/README.md)                                       | DNS caching with cacheable-lookup                            |
| [nestjs-decorators](packages/nestjs-decorators/README.md)                                     | DTO decorators, transformers, validators, and pipes          |
| [nestjs-google-maps](packages/nestjs-google-maps/README.md)                                   | Dependency injection for the official Google Maps client |
| [nestjs-google-places](packages/nestjs-google-places/README.md) | Dependency injection for the official Places API (New) client |
| [nestjs-maxmind-geoip2](packages/nestjs-maxmind-geoip2/README.md)                             | MaxMind GeoIP2 web service client                            |
| [nestjs-thingsboard-http-integration](packages/nestjs-thingsboard-http-integration/README.md) | ThingsBoard telemetry uploads with cached DNS lookups        |

## Development setup

Use the Node.js version specified in `.nvmrc` and npm. Run commands from the repository root.

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm run build
```

The lockfile is shared across all workspaces.

## Module compatibility

The packages publish CommonJS JavaScript and TypeScript declarations and support
CommonJS and ESM consumers. See each package's README and manifest for framework,
runtime, and peer-dependency requirements.

## Validation

```sh
npm run check
```

This builds all packages, lints TypeScript, runs unit tests with coverage, and verifies package tarballs in temporary CommonJS and ESM consumer projects.

| Command                                                                                                                            | Purpose                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run build`                                                                                                                    | Compile all packages in dependency order                                                         |
| `npm run lint`                                                                                                                     | Run lint and source formatting checks                                                            |
| `npm test -- --runInBand --watchman=false`                                                                                         | Run unit tests without Watchman                                                                  |
| `npm run test:cov -- --runInBand --watchman=false`                                                                                 | Run tests and write coverage reports to `coverage/`                                              |
| `npm run test:packages`                                                                                                            | Verify tarballs, CJS/ESM TypeScript consumers, and module wiring; run a build first |
| `npm run build --workspace packages/nestjs-thingsboard-http-integration`                                                           | Build ThingsBoard and its Cacheable dependency                                                   |
| `npm test -- --runInBand --watchman=false --runTestsByPath packages/nestjs-decorators/src/int/transformer/int.transformer.spec.ts` | Run a single test file                                                                           |
| `npm audit --omit=dev`                                                                                                             | Check production dependency advisories                                                           |

Coverage collects source files, including Nest module wiring, and excludes tests, declarations, type-only files, and barrel exports.

## Making changes

Each package owns its source and tests under `packages/<package>/src`. Tests live beside implementation files as `*.spec.ts`. Export consumer APIs through the package's `src/index.ts` and its barrels, and update the package README when usage changes.

ThingsBoard depends on Cacheable through both its npm dependency and its TypeScript project reference. Keep those declarations aligned when adding workspace dependencies. The source manifests point to `build/index.js`; the publishing helper prepares a manifest with `index.js` and `index.d.ts` at the published package root.

Generated `build/`, `coverage/`, and `*.tsbuildinfo` files are ignored by Git. To rebuild after deleting outputs while retaining incremental metadata, use `npm run build -- --force`.

See [AGENTS.md](AGENTS.md) for coding-agent instructions.

## Releases

Use Conventional Commit headers for branch commits and PR titles. Code and runtime dependency changes use `fix` or `feat`; development-only dependency updates use `chore`; documentation-only updates use `docs`. Use `fix` for documentation only when explicitly requested to ship the documentation in a release.

PR descriptions contain plain Conventional Commit lines for each final change, separated by blank lines without bullet prefixes. Squash merges use the PR title and description so those entries reach the changelog. Breaking changes require explicit approval and `!` in the header. See [AGENTS.md](AGENTS.md) for the complete commit and PR rules.

Release Please manages package versions, changelogs, and release PRs. The release workflow invokes the publish workflow, which installs from the lockfile, builds, verifies tarballs, prepares the selected package, and publishes it. Make packaging changes in `scripts/prepare-package.mjs` so verification and publishing use the same layout.
