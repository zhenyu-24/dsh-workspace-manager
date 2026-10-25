import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const face of ['host', 'client']) {
  const source = join(root, 'src', face);
  const target = join(root, 'dist', face);
  await mkdir(target, { recursive: true });
  for (const name of await readdir(source)) {
    if (!name.endsWith('.js')) throw new Error(`Unexpected source file: ${face}/${name}`);
    execFileSync(process.execPath, ['--check', resolve(source, name)], { stdio: 'inherit' });
    await copyFile(join(source, name), join(target, name));
  }
}
console.log('Built dist/host and dist/client (no bundler or code transformation).');
