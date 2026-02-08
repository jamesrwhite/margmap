#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert CSV file to JSON array of objects
 * @param {string} inputFile - Path to input CSV file
 * @param {string} outputFile - Path to output JSON file
 */
function csvToJson(inputFile, outputFile) {
    try {
        const csvContent = fs.readFileSync(inputFile, 'utf-8');

        // Parse CSV using csv-parse
        const data = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (data.length === 0) {
            throw new Error('CSV file must have at least one data row');
        }

        // Write JSON output
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✅ Converted ${inputFile} to ${outputFile}`);
        console.log(`📊 ${data.length} records converted`);

    } catch (error) {
        console.error(`❌ Error converting CSV to JSON: ${error.message}`);
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error('Usage: node csv-to-json.js input.csv output.json');
    process.exit(1);
}

const [inputFile, outputFile] = args;

// Ensure input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

csvToJson(inputFile, outputFile);

export { csvToJson };