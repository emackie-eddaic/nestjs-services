# Repository instructions

## Layout and boundaries

- This is an npm workspace monorepo of five NestJS libraries. Use Node.js 24 from `.nvmrc`.
- Package responsibilities and setup commands are in [README.md](README.md). Read the relevant package README and existing code before changing behavior.
- Implementation and colocated `*.spec.ts` tests belong under `packages/<package>/src`. Public APIs flow through each package's `src/index.ts` and its barrels.
- ThingsBoard imports Cacheable by package name. Its npm dependency, TypeScript project reference, and build command must continue to support standalone builds.

## Implementation conventions

- Use strict TypeScript and Nest dependency injection. Follow the existing ESLint and Prettier configuration.
- Keep framework and consumer integration peers in `peerDependencies` with development versions available for local builds. Keep required implementation libraries in `dependencies`.
- Use the root npm lockfile for dependency changes. Avoid forced audit fixes that introduce unreviewed major upgrades or downgrades.
- Add behavioral regressions for changed runtime behavior. Mock external APIs or use an HTTP test adapter; tests must not require credentials or make paid API requests.
- Keep package documentation focused on current APIs. Check README snippets against exported types and avoid examples that silently accept invalid values or serialize bigint directly.
- Edit source and packaging helpers rather than generated `build/`, `coverage/`, or `*.tsbuildinfo` artifacts.

## Validation

- Install with `npm ci --ignore-scripts` and build before linting or testing on a fresh checkout; workspace imports resolve through compiled entry points.
- `npm run check` runs the complete build, lint, unit coverage, and tarball consumer checks. Package verification needs registry access and uses temporary staging directories.
- For focused iteration, use the individual commands in [README.md](README.md). Run relevant checks for the change and report what was actually verified.
- Run `npm run test:packages` after public export, dependency, compiler, or packaging changes. It assumes packages have already been built.
- After deleting build outputs while retaining incremental metadata, run `npm run build -- --force`.
- Coverage must measure source code, including module wiring, and exclude generated outputs.

## Releases and commits

- Every commit message must be a one-line Conventional Commit header: `type(scope): description` or `type: description`.
- Any commit that changes code or dependencies must use `fix` or `feat` so Release Please creates a new version. This includes tests, scripts, tooling, build and CI configuration, and dependency updates in manifests or the lockfile, including development and transitive dependencies.
- Use `fix` for corrections and maintenance, and `feat` for new functionality. Do not use `chore`, `refactor`, `test`, `build`, `ci`, `perf`, or `style` for code or dependency changes. Use `docs` only for documentation-only commits; a mixed documentation and code commit must use `fix` or `feat`.
- Before making a breaking API or behavior change or adding a breaking-change marker, explain the compatibility impact and obtain explicit user permission. A general request to fix, refactor, or commit does not authorize a breaking change.
- Only after that permission, mark the breaking change with `!` in the commit header. Keep the message to one line; do not add a `BREAKING CHANGE` body or footer. Do not hide an unapproved breaking change in an ordinary `fix` or `feat` commit.
- Release Please owns package versions, changelogs, and the release manifest. Do not update them manually as part of ordinary changes.
- `scripts/prepare-package.mjs` defines the published layout; `scripts/check-packages.mjs` verifies the tarballs in a consumer project. Keep CI and publishing on that shared preparation path.
- Follow the user's requested review and commit checkpoints.
