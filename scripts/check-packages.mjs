import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
  // Use the development lockfile for Nest 12 and retain the Nest 11 baseline.
  const dependencies = Object.fromEntries(
    ['@nestjs/core', '@nestjs/testing'].map((name) => [
      name,
      lock.packages[`node_modules/${name}`].version,
    ]),
  );
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

  const nest11 = {
    '@nestjs/common': '11.1.18',
    '@nestjs/core': '11.1.18',
    '@nestjs/testing': '11.1.9',
    '@nestjs/swagger': '11.4.7',
    '@nestjs/axios': '4.0.1',
    'class-validator': '0.14.4',
  };
  const fixture = await readFile(
    join(root, 'scripts', 'package-consumer.ts'),
    'utf8',
  );
  for (const [major, overrides] of [
    [11, nest11],
    [12, {}],
  ]) {
    const consumer = join(temporary, `nest-${major}`);
    await mkdir(consumer);
    await writeFile(
      join(consumer, 'package.json'),
      JSON.stringify({
        name: `nestjs-services-package-check-${major}`,
        private: true,
        type: 'module',
        dependencies: { ...dependencies, ...overrides },
        devDependencies: {
          '@types/node': lock.packages['node_modules/@types/node'].version,
        },
      }),
    );
    runNpm(
      ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
      consumer,
    );
    const require = createRequire(join(consumer, 'consumer.cjs'));
    const typeImports = [];
    for (const [
      index,
      { directory, manifest, exports },
    ] of packages.entries()) {
      const installed = require(`${manifest.name}/package.json`);
      assert.equal(installed.version, manifest.version);
      assert.equal(installed.type, 'commonjs');
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
      const installedRoot = join(consumer, 'node_modules', manifest.name);
      for (const file of ['LICENSE', 'README.md']) {
        assert.equal(
          await readFile(join(installedRoot, file), 'utf8'),
          await readFile(
            join(
              file === 'LICENSE' ? root : join(root, 'packages', directory),
              file,
            ),
            'utf8',
          ),
        );
      }
      typeImports.push(
        `import { ${exports.map((name) => `${name} as ${name}${index}`).join(', ')} } from '${manifest.name}';`,
        ...exports.map((name) => `void ${name}${index};`),
      );
    }

    for (const extension of ['cts', 'mts']) {
      await writeFile(
        join(consumer, `consumer.${extension}`),
        typeImports.join('\n') + '\n' + fixture,
      );
    }
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
        '--strict',
        '--skipLibCheck',
        '--experimentalDecorators',
        '--emitDecoratorMetadata',
        '--module',
        'nodenext',
        '--target',
        'ES2023',
        'consumer.cts',
        'consumer.mts',
      ],
      { cwd: consumer, stdio: 'inherit' },
    );
    for (const extension of ['cjs', 'mjs']) {
      execFileSync(process.execPath, [`consumer.${extension}`], {
        cwd: consumer,
        stdio: 'inherit',
      });
      console.log(
        `NestJS ${major}: ${extension} consumer passed runtime, types, and module wiring checks`,
      );
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
