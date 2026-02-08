import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const csvPath = resolve(__dirname, '../src/data/ratings.csv');
const readmePath = resolve(__dirname, '../README.md');

// Read and parse CSV
const csvContent = readFileSync(csvPath, 'utf-8');
const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
});

// Generate markdown table
const tableHeaders = '| Name | Rating | Location | Country | Date | Price | Crust | Dough | Sauce | Cheese | Basil | Sliced | Sloppiness | Saltiness | Oiliness |';
const tableSeparator = '|------|--------|----------|---------|------|-------|-------|-------|-------|--------|-------|--------|------------|-----------|----------|';

const tableRows = rows.map(row => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.Name + ' ' + row.Location + ' ' + row.Country)}`;
    const nameLink = `[${row.Name}](${googleMapsUrl})`;
    return `| ${nameLink} | ${row.mScore} | ${row.Location} | ${row.Country} | ${row.Date} | ${row.Price} | ${row.Crust} | ${row.Dough} | ${row.Sauce} | ${row.Cheese} | ${row.Basil} | ${row.Sliced} | ${row.Sloppiness} | ${row.Saltiness} | ${row.Oiliness} |`;
}).join('\n');

const markdownTable = `${tableHeaders}\n${tableSeparator}\n${tableRows}`;

// Read README
let readmeContent = readFileSync(readmePath, 'utf-8');

// Find and replace the table section
const tableStartMarker = '## Restaurant Ratings';
const tableEndMarker = '## Project Structure';

const startIndex = readmeContent.indexOf(tableStartMarker);
const endIndex = readmeContent.indexOf(tableEndMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find table markers in README.md');
    process.exit(1);
}

// Reconstruct README with new table
const beforeTable = readmeContent.substring(0, startIndex);
const afterTable = readmeContent.substring(endIndex);

const newReadme = `${beforeTable}${tableStartMarker}\n\n${markdownTable}\n\n${afterTable}`;

// Write updated README
writeFileSync(readmePath, newReadme, 'utf-8');

console.log('✅ README.md updated with latest restaurant ratings');
console.log(`📊 ${rows.length} restaurants in table`);
