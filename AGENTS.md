# MargMap – Agent Instructions

## What This Is

A vanilla JS + Leaflet.js pizza-rating map app. No framework (no React/Vue). Data lives in Google Sheets, flows through a CSV→JSON pipeline, and is deployed as static assets to Cloudflare Workers Assets at `margmap.com`.

## Architecture Overview

```
Google Sheets (source of truth)
    └─ pnpm fetch-data ──→ src/data/ratings.csv  (committed)
                               └─ pnpm prepare-data ──→ src/data/ratings.json
                                                             └─ Vite build ──→ dist/data/ratings.json
```

- `vite.config.js` sets `root: 'src'` and outputs to `dist/`. A custom Vite plugin (`copy-data`) copies `ratings.json` into `dist/data/` at bundle time.
- **`src/data/ratings.csv` is checked in** – this intentional design means builds don't require a network call to Google Sheets.

## Key Commands

| Command | Effect |
|---|---|
| `pnpm dev` | Dev server at `http://localhost:8080` |
| `pnpm build` | Runs `prepare-data` then Vite build |
| `pnpm preview` | Serve production build at port 8080 |
| `pnpm fetch-data` | Pull fresh CSV from Google Sheets + convert to JSON |
| `pnpm prepare-data` | Convert existing `ratings.csv` → `ratings.json` only |
| `pnpm update-readme` | Sync README restaurant table from CSV |
| `pnpm ship` | Full build + `wrangler deploy` to Cloudflare |
| `pnpm clean` | Remove `src/data/ratings.*` and `dist/` |

## Data Schema

Each restaurant record (fields in `ratings.json`):

- **`mScore`** – overall rating (1–10 float); use this for all rating comparisons
- Dimension scores (0–10 int): `Crust`, `Dough`, `Sauce`, `Cheese`, `Basil`, `Sliced`, `Sloppiness`, `Saltiness`, `Oiliness`
- `Name`, `Location`, `Country`, `Date` (DD/MM/YYYY), `Price` (£-prefixed string), `Lat`, `Lon`

## UI Patterns

- **Dual desktop/mobile inputs**: every filter control has two DOM elements, e.g. `#search-input` / `#search-input-mobile`. They are kept in sync via `syncFilters()` in `src/main.js`. Always update both IDs when adding new filter controls.
- **Rating colour bands**: ≥8 → red, ≥7 → orange, ≥6 → yellow, else gray. Applied in both Tailwind classes (`getRatingColor`) and hex colours for Leaflet markers (`updateMapMarkers`).
- Map uses CartoDB Voyager tiles; markers are custom `L.divIcon` with `marker-badge` class.

## Scripts

- `scripts/csv-to-json.js` – standalone Node ESM script; also exported as `csvToJson` for programmatic use.
- `scripts/update-readme-table.js` – rewrites the `## Restaurant Ratings` section in `README.md` between the two heading markers. Run after any data change.

## Deployment

Deployed via **Cloudflare Workers Assets** (`wrangler.jsonc`), not Cloudflare Pages. Custom domains `margmap.com` and `www.margmap.com` are configured directly in `wrangler.jsonc`. Deploy with `pnpm ship`.

## Adding a New Restaurant

1. Add the row to the Google Sheets document.
2. `pnpm fetch-data` – updates CSV and JSON.
3. `pnpm update-readme` – syncs README table.
4. `git add src/data/ README.md && git commit -m "Add <restaurant name>"`
5. `pnpm ship` to deploy.
