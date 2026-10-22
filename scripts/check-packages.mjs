import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preparePackage, root } from './prepare-package.mjs';

const exportsToCheck = {
  'nestjs-cacheable': ['CacheableModule', 'CacheableService'],
  'nestjs-decorators': ['TransformInt', 'ParseBigIntPipe'],
  'nestjs-google-maps': ['GoogleMapsModule', 'GoogleMapsService'],
  'nestjs-maxmind-geoip2': ['MaxmindGeoip2Module', 'MaxmindGeoip2Service'],
  'nestjs-thingsboard-http-integration': [
    'ThingsBoardHttpIntegrationModule',
    'ThingsBoardHttpIntegrationService',
  ],
};
const lock = JSON.parse(
  await readFile(join(root, 'package-lock.json'), 'utf8'),
);
const temporary = await mkdtemp(join(tmpdir(), 'nestjs-services-packages-'));
const runNpm = (args, cwd = temporary) =>
  execFileSync('npm', args, { cwd, encoding: 'utf8' });

try {
  const packages = [];
  // Swagger also loads Nest core; keep core and common on the tested versions.
  const dependencies = {
    '@nestjs/core': lock.packages['node_modules/@nestjs/core'].version,
  };
  for (const [directory, exports] of Object.entries(exportsToCheck)) {
    const { build, manifest } = await preparePackage(
      directory,
      join(temporary, directory),
    );
    const [packed] = JSON.parse(
      runNpm(
        ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
        build,
      ),
    );
    const files = new Set(packed.files.map(({ path }) => path));
    for (const required of [
      'index.js',
      'index.d.ts',
      'package.json',
      'README.md',
      'LICENSE',
    ]) {
      assert.ok(files.has(required), `${manifest.name}: missing ${required}`);
    }
    for (const file of files) {
      assert.ok(
        file === 'package.json' ||
          file === 'README.md' ||
          file === 'LICENSE' ||
          (file.endsWith('.js') && !file.endsWith('.spec.js')) ||
          (file.endsWith('.d.ts') && !file.endsWith('.spec.d.ts')),
        `${manifest.name}: unexpected packaged file ${file}`,
      );
    }
    dependencies[manifest.name] = `file:${join(temporary, packed.filename)}`;
    // Use the peer versions already exercised by the repository's tests.
    for (const name of Object.keys(manifest.peerDependencies ?? {})) {
      if (!name.startsWith('@eddaic/')) {
        const version = lock.packages[`node_modules/${name}`]?.version;
        assert.ok(version, `Missing locked peer version for ${name}`);
        dependencies[name] = version;
      }
    }
    packages.push({ directory, manifest, exports });
    console.log(`Packed ${manifest.name}: ${files.size} files verified`);
  }

  await writeFile(
    join(temporary, 'package.json'),
    JSON.stringify({
      name: 'nestjs-services-package-check',
      private: true,
      dependencies,
      devDependencies: {
        '@types/node': lock.packages['node_modules/@types/node'].version,
      },
    }),
  );
  runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  const require = createRequire(join(temporary, 'consumer.cjs'));
  const typeImports = [];
  for (const [index, { directory, manifest, exports }] of packages.entries()) {
    const installed = require(`${manifest.name}/package.json`);
    assert.equal(installed.version, manifest.version);
    assert.equal(installed.main, 'index.js');
    assert.equal(installed.types, 'index.d.ts');
    assert.equal(installed.devDependencies, undefined);
    assert.equal(installed.scripts, undefined);
    const api = require(manifest.name);
    for (const name of exports) {
      assert.equal(
        typeof api[name],
        'function',
        `${manifest.name}: missing ${name}`,
      );
    }
    const installedRoot = join(temporary, 'node_modules', manifest.name);
    assert.equal(
      await readFile(join(installedRoot, 'LICENSE'), 'utf8'),
      await readFile(join(root, 'LICENSE'), 'utf8'),
    );
    assert.equal(
      await readFile(join(installedRoot, 'README.md'), 'utf8'),
      await readFile(join(root, 'packages', directory, 'README.md'), 'utf8'),
    );
    typeImports.push(
      `import { ${exports.map((name) => `${name} as ${name}${index}`).join(', ')} } from '${manifest.name}';`,
      ...exports.map((name) => `void ${name}${index};`),
    );
    console.log(`Imported ${manifest.name} from installed tarball`);
  }

  await writeFile(
    join(temporary, 'consumer.cts'),
    typeImports.join('\n') + '\n',
  );
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--module',
      'nodenext',
      '--target',
      'ES2023',
      'consumer.cts',
    ],
    { cwd: temporary, stdio: 'inherit' },
  );
  console.log(
    'All five installed packages passed runtime and TypeScript checks',
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
