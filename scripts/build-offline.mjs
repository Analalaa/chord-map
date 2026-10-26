import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(projectRoot, 'dist');
let html = await readFile(path.join(dist, 'index.html'), 'utf8');
const css = (await readFile(path.join(dist, 'style.css'), 'utf8'))
  .split('\n').filter(line => !line.startsWith('@import')).join('\n');
const moduleNames = ['music.js', 'inversions.js', 'practice.js', 'app.js'];
const modules = await Promise.all(moduleNames.map(name => readFile(path.join(dist, name), 'utf8')));
const combined = modules.map(source => source.replace(/^import\s[\s\S]*?\sfrom\s*['"][^'"]+['"];?\s*$/gm, '')).join('\n');
html = html.replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./app.js"></script>', () => `<script type="module">\n${combined}\n</script>`);
if (html.includes('src="./app.js"') || html.includes('href="./style.css"')) throw new Error('Offline bundle still references local assets.');
await writeFile(path.join(projectRoot, 'guitar-fretboard-offline.html'), html);
console.log('Built guitar-fretboard-offline.html');
