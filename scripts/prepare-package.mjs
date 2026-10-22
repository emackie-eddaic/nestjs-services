import { copyFile, cp, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export async function preparePackage(directory, destination) {
  // Accept package directory names only, including when called from a release.
  if (!/^nestjs-[a-z0-9-]+$/.test(directory)) {
    throw new Error(`Invalid package directory: ${directory}`);
  }

  const packageRoot = join(root, 'packages', directory);
  const manifest = JSON.parse(
    await readFile(join(packageRoot, 'package.json'), 'utf8'),
  );
  const compiled = join(packageRoot, 'build');
  const build = destination ?? compiled;
  if (build !== compiled) {
    await cp(compiled, build, { recursive: true });
  }
  for (const file of ['index.js', 'index.d.ts']) {
    await readFile(join(build, file));
  }

  const { devDependencies, scripts, jest, ...publishedManifest } = manifest;
  publishedManifest.main = 'index.js';
  publishedManifest.types = 'index.d.ts';
  publishedManifest.files = ['**/*.js', '**/*.d.ts', 'README.md', 'LICENSE'];

  await copyFile(join(root, 'LICENSE'), join(build, 'LICENSE'));
  await copyFile(join(packageRoot, 'README.md'), join(build, 'README.md'));
  await writeFile(
    join(build, 'package.json'),
    JSON.stringify(publishedManifest, null, 2) + '\n',
  );
  return { build, manifest: publishedManifest };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) {
    throw new Error(
      'Usage: node scripts/prepare-package.mjs <package-directory>',
    );
  }
  await preparePackage(process.argv[2]);
}
