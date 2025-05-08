import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFile = path.join(__dirname, '../src/version.js');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Update version in version.js
const versionContent = `export const VERSION = '${packageJson.version}';\n`;
fs.writeFileSync(versionFile, versionContent);

console.log(`Updated version to ${packageJson.version}`); 