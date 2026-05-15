#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvToJson } from './csv-to-json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const csvPath = path.join(rootDir, 'src', 'data', 'ratings.csv');
const jsonPath = path.join(rootDir, 'src', 'data', 'ratings.json');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'margmap-data-'));
const tempJsonPath = path.join(tempDir, 'ratings.json');

try {
    csvToJson(csvPath, tempJsonPath);

    const expected = fs.readFileSync(tempJsonPath, 'utf-8');
    const actual = fs.readFileSync(jsonPath, 'utf-8');

    if (actual !== expected) {
        console.error('❌ src/data/ratings.json is out of date. Run `pnpm prepare-data`.');
        process.exit(1);
    }

    console.log('✅ Data files are up to date');
} finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
