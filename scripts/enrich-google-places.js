#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createRestaurantKey } from './csv-to-json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '..', 'src', 'data', 'ratings.csv');
const GOOGLE_PLACES_MAP_PATH = path.resolve(__dirname, '..', 'src', 'data', 'google-places.json');
const ENV_LOCAL_PATH = path.resolve(__dirname, '..', '.env.local');

function loadEnvLocal() {
    if (!fs.existsSync(ENV_LOCAL_PATH)) {
        return;
    }

    const envLines = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8').split('\n');
    envLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    });
}

loadEnvLocal();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function loadRestaurants() {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    return parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
}

function loadGooglePlacesMap() {
    if (!fs.existsSync(GOOGLE_PLACES_MAP_PATH)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(GOOGLE_PLACES_MAP_PATH, 'utf-8'));
}

function saveGooglePlacesMap(map) {
    fs.writeFileSync(GOOGLE_PLACES_MAP_PATH, `${JSON.stringify(map, null, 2)}\n`, 'utf-8');
}

function createSearchQuery(restaurant) {
    return `${restaurant.Name} ${restaurant.Location} ${restaurant.Country}`;
}

function namesLikelyMatch(sourceName, candidateName) {
    const normalize = (value) => String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const source = normalize(sourceName);
    const candidate = normalize(candidateName);

    if (!source || !candidate) {
        return false;
    }

    if (candidate.includes(source) || source.includes(candidate)) {
        return true;
    }

    const sourceTokens = new Set(source.split(/\s+/));
    const candidateTokens = new Set(candidate.split(/\s+/));
    let overlap = 0;

    sourceTokens.forEach((token) => {
        if (candidateTokens.has(token)) {
            overlap += 1;
        }
    });

    return overlap >= Math.max(2, Math.ceil(sourceTokens.size / 2));
}

async function fetchPlaceCandidate(restaurant) {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({
            textQuery: createSearchQuery(restaurant),
            maxResultCount: 5,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Places search failed (${response.status}): ${text}`);
    }

    const payload = await response.json();
    return (payload.places || []).find((candidate) =>
        namesLikelyMatch(restaurant.Name, candidate?.displayName?.text)
    ) || null;
}

async function main() {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('❌ Missing GOOGLE_MAPS_API_KEY');
        process.exit(1);
    }

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ ratings.csv not found at ${CSV_PATH}`);
        process.exit(1);
    }

    const restaurants = loadRestaurants();
    const googlePlacesMap = loadGooglePlacesMap();

    for (const restaurant of restaurants) {
        const key = createRestaurantKey(restaurant);
        if (googlePlacesMap[key]?.googlePlaceId) {
            continue;
        }

        const candidate = await fetchPlaceCandidate(restaurant);
        if (!candidate?.id) {
            console.warn(`⚠️ No confident Google Places match for ${restaurant.Name}`);
            continue;
        }

        googlePlacesMap[key] = {
            googlePlaceId: candidate.id,
            matchedName: candidate.displayName?.text || '',
            matchedAddress: candidate.formattedAddress || '',
            matchedAt: new Date().toISOString(),
        };

        console.log(`✅ Matched ${restaurant.Name} -> ${candidate.displayName?.text || candidate.id}`);
        saveGooglePlacesMap(googlePlacesMap);
    }
}

main().catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
});
