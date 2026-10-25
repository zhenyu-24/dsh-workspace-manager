import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run pack:release');
execFileSync(process.execPath, [join(root, 'scripts/verify-package.mjs')], { stdio: 'inherit' });
await mkdir(join(root, 'artifacts'), { recursive: true });
const output = execFileSync(process.execPath, [npm, 'pack', '--json', '--pack-destination', 'artifacts'], { cwd: root, encoding: 'utf8' });
const [packed] = JSON.parse(output);
const paths = packed.files.map((row) => row.path);
for (const required of ['dist/host/index.js', 'dist/host/operations.js', 'dist/host/catalog.js', 'dist/client/index.js', 'cordis.patch.yml', 'LICENSE', 'locale/zh.json', 'icon.svg']) {
  if (!paths.includes(required)) throw new Error(`Missing packed file: ${required}`);
}
if (paths.some((path) => /^(?:src|tests|scripts|node_modules|artifacts|\.git)\//.test(path) || /(?:\.env|\.tgz|\.log)$/.test(path))) throw new Error('Unexpected private/development file in archive');
const digest = createHash('sha256').update(await readFile(join(root, 'artifacts', packed.filename))).digest('hex');
await writeFile(join(root, 'artifacts', 'SHA256SUMS.txt'), `${digest}  ${packed.filename}\n`);
console.log(`Verified ${paths.length} archive entries: artifacts/${packed.filename}\nSHA256 ${digest}`);
