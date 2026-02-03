#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Convert CSV file to JSON array of objects
 * @param {string} inputFile - Path to input CSV file
 * @param {string} outputFile - Path to output JSON file
 */
function csvToJson(inputFile, outputFile) {
    try {
        const csvContent = fs.readFileSync(inputFile, 'utf-8');
        const lines = csvContent.trim().split('\n');

        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index].trim();
                });
                data.push(row);
            }
        }

        // Write JSON output
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✅ Converted ${inputFile} to ${outputFile}`);

    } catch (error) {
        console.error(`❌ Error converting CSV to JSON: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Parse a CSV line handling quoted values
 * @param {string} line - CSV line to parse
 * @returns {string[]} Array of parsed values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }

    // Add the last value
    values.push(current.replace(/^"|"$/g, ''));
    return values;
}

// Main execution
if (require.main === module) {
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
}

module.exports = { csvToJson };