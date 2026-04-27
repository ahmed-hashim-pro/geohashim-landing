import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'www');
const candidates = [
  resolve(root, '404', 'index.html'),
  resolve(root, '404.html'),
];

const dest = resolve(root, '404.html');

for (const candidate of candidates) {
  if (existsSync(candidate) && candidate !== dest) {
    copyFileSync(candidate, dest);
    console.log(`Copied ${candidate} -> ${dest}`);
    process.exit(0);
  }
}

if (existsSync(dest)) {
  console.log(`404.html already present at ${dest}`);
  process.exit(0);
}

console.warn('No prerendered 404 found; Amplify Hosting will fall back to its default 404.');
