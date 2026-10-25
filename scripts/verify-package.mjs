import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const json = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
const pkg = await json('package.json');
assert.equal(pkg.license, 'MIT');
assert.equal(pkg.name, '@zhenyu-24/dsh-workspace-manager');
for (const target of Object.values(pkg.exports).filter((value) => !value.includes('*'))) {
  assert((await stat(join(root, target))).isFile(), `Missing export: ${target}`);
}
for (const language of ['zh', 'en']) {
  const { meta } = await json(`locale/${language}.json`);
  assert(meta.title && meta.description, `Missing ${language} metadata`);
}
const patch = await readFile(join(root, pkg.dsh.bundle.patch), 'utf8');
assert(patch.includes(`name: '${pkg.name}'`));
const client = await readFile(join(root, pkg.exports['./client']), 'utf8');
assert(client.includes(`id: '${pkg.name}'`), 'Client module ID must match package name');
assert(!client.includes("require('@deepseek-ai/"), 'Do not load unstable host UI packages');
for (const face of ['host', 'client']) {
  for (const file of await readdir(join(root, 'src', face))) {
    const source = await readFile(join(root, 'src', face, file));
    const built = await readFile(join(root, 'dist', face, file));
    assert.equal(createHash('sha256').update(source).digest('hex'), createHash('sha256').update(built).digest('hex'), `Stale build: ${file}`);
  }
}
await import(new URL('../dist/host/index.js', import.meta.url));
console.log('Manifest, exports, locales, loader ID and built Host import verified.');
