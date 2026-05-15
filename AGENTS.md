# MargMap – Agent Instructions

## What This Is

A vanilla JS + Leaflet.js pizza-rating map app. No framework (no React/Vue). Data lives in Google Sheets, flows through a CSV→JSON pipeline, and is deployed as static assets to Cloudflare Workers Assets at `margmap.com`.

## Architecture Overview

```
Google Sheets (source of truth)
    └─ pnpm update-data ──→ src/data/ratings.csv  (committed)
                              ├─ src/data/google-places.json
                              └─ pnpm prepare-data ──→ src/data/ratings.json
                                                            └─ Vite build ──→ dist/data/ratings.json
```

- `vite.config.js` sets `root: 'src'` and outputs to `dist/`. A custom Vite plugin (`copy-data`) copies `ratings.json` into `dist/data/` at bundle time.
- **`src/data/ratings.csv` is checked in** – this intentional design means builds don't require a network call to Google Sheets.

## Key Commands

| Command | Effect |
|---|---|
| `pnpm dev` | Worker-first dev server at `http://localhost:8787` |
| `pnpm dev:frontend` | Vite-only dev server at `http://127.0.0.1:8080` without Worker routes |
| `pnpm build` | Runs `prepare-data`, Vite build, then updates the README table |
| `pnpm check` | Non-mutating CI validation: verify data, build assets, syntax-check Worker |
| `pnpm preview` | Serve production Worker locally at `http://localhost:8788` |
| `pnpm fetch-csv` | Pull fresh CSV from Google Sheets only |
| `pnpm fetch-data` | Pull fresh CSV from Google Sheets + convert to JSON |
| `pnpm prepare-data` | Convert existing `ratings.csv` → `ratings.json` only |
| `pnpm enrich-google-places` | Add missing Google place IDs for photo lookups |
| `pnpm update-data` | Fetch CSV, enrich place IDs, regenerate JSON, and sync README |
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
- `scripts/check-data.js` – verifies checked-in `ratings.json` matches `ratings.csv` without rewriting tracked data.
- `scripts/dev-worker.js` – runs the Worker-first local dev flow: prepare data, build assets, watch Vite output, and start Wrangler.
- `scripts/enrich-google-places.js` – stores Google place IDs in `src/data/google-places.json`; it only requires `GOOGLE_MAPS_API_KEY` when missing restaurants need matching.
- `scripts/update-readme-table.js` – rewrites the `## Restaurant Ratings` section in `README.md` between the two heading markers. Run after any data change.

## Deployment

Deployed via **Cloudflare Workers Assets** (`wrangler.jsonc`), not Cloudflare Pages. Custom domains `margmap.com` and `www.margmap.com` are configured directly in `wrangler.jsonc`. Deploy with `pnpm ship`.

## Adding a New Restaurant

1. Add the row to the Google Sheets document.
2. `pnpm update-data` – updates CSV, Google place IDs, JSON, and README.
3. `git add src/data/ README.md && git commit -m "Add <restaurant name>"`
4. `pnpm ship` to deploy.
