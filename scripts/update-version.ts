import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface PackageJson {
  version: string;
}

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const versionFile: string = path.join(__dirname, '../src/version.ts');
const packageJson: PackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Update version in version.ts
const versionContent: string = `export const VERSION = '${packageJson.version}';\n`;
fs.writeFileSync(versionFile, versionContent);

console.log(`Updated version to ${packageJson.version}`);
