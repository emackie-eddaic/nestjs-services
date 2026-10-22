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

Use Node.js 24.9 or newer on the 24.x line (selected by `.nvmrc`) and npm. Run commands from the repository root.

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm run build
```

The lockfile is shared across all workspaces. CI uses Node.js 24 and the locked NestJS 12 dependencies. Tarball consumer tests also verify NestJS 11 compatibility.

This repository contains libraries, so configure API credentials in the consuming application. Unit tests use mocks or HTTP adapters and do not require API keys. Package verification installs dependencies from npm.

## Module compatibility

The libraries publish CommonJS JavaScript and TypeScript declarations. Both CommonJS
(`require` or TypeScript imports) and ESM (named `import` statements) applications
can use the same packages and Nest injection tokens. The repository keeps TypeScript's
`nodenext` resolution with explicit `"type": "commonjs"` manifests; the `.mjs`
packaging and ESLint helpers remain native ESM scripts.

NestJS 11 and 12 are supported. NestJS 12's ESM dependencies require Node.js 20.19+
(or 22.12+ on Node 22); Node.js 24 is recommended. Development tests use Jest 30
and require Node.js 24.9+; the test scripts enable Node's VM modules for ESM dependencies. See the [NestJS migration guide](https://docs.nestjs.com/migration-guide).
ThingsBoard supports `@nestjs/axios` 4 with NestJS 11 and `@nestjs/axios` 12 with
NestJS 11 or 12. Match `@nestjs/swagger` to the NestJS major when using Decorators.

## Validation

```sh
npm run check
```

This builds all packages, lints TypeScript, runs unit tests with coverage, and verifies all five npm tarballs in temporary CommonJS and ESM consumer projects on NestJS 11 and 12. It does not publish packages.

| Command                                                                                                                            | Purpose                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run build`                                                                                                                    | Compile all packages in dependency order                                                         |
| `npm run lint`                                                                                                                     | Run lint and source formatting checks                                                            |
| `npm test -- --runInBand --watchman=false`                                                                                         | Run unit tests without Watchman                                                                  |
| `npm run test:cov -- --runInBand --watchman=false`                                                                                 | Run tests and write coverage reports to `coverage/`                                              |
| `npm run test:packages`                                                                                                            | Verify tarballs, CJS/ESM TypeScript consumers, and NestJS 11/12 module wiring; run a build first |
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

Every commit message must be a one-line Conventional Commit header, such as `fix(nestjs-cacheable): correct DNS lookup handling` or `feat(nestjs-google-maps): add a client method`. The scope is optional.

Any code or dependency change must use `fix` or `feat` because those types trigger new versions through Release Please. This includes tests, scripts, tooling, build and CI configuration, and manifest or lockfile updates for runtime, development, or transitive dependencies. Use `fix` for corrections and maintenance, and `feat` for new functionality. Reserve `docs` for documentation-only commits; mixed code and documentation changes must use `fix` or `feat`.

Breaking changes require explicit user permission after explaining the compatibility impact. General permission to implement or commit is insufficient. After approval, mark the header with `!`; keep the message on one line without a `BREAKING CHANGE` body or footer. Do not make an unapproved breaking change under an ordinary `fix` or `feat` header.

Release Please manages package versions, changelogs, and release PRs. The release workflow invokes the publish workflow, which installs from the lockfile, builds, verifies tarballs, prepares the selected package, and publishes it. Make packaging changes in `scripts/prepare-package.mjs` so verification and publishing use the same layout.
