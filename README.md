# 🍕 MargMap

A web application for visualizing and rating pizza places on an interactive map, built with [Astro](https://astro.build/). Data is maintained in a Google Sheets document and automatically converted to JSON for the web application.

## Restaurant Ratings

| Name | Rating | Value | Location | Country | Date | Price | Crust | Dough | Sauce | Cheese | Basil | Sliced | Sloppiness | Saltiness | Oiliness |
|------|--------|-------|----------|---------|------|-------|-------|-------|-------|--------|-------|--------|------------|-----------|----------|
| [Monellis](https://www.google.com/maps/search/?api=1&query=Monellis%20Hastings%20England) | 8.5 | 7.3 | Hastings | England | 19/10/2024 | £13.50 | 9 | 9 | 9 | 9 | 5 | 5 | 8 | 8 | 9 |
| [SOL Taphouse](https://www.google.com/maps/search/?api=1&query=SOL%20Taphouse%20Busan%20South%20Korea) | 8.4 | 8.0 | Busan | South Korea | 10/10/2025 | £11.14 | 7 | 8 | 8 | 9 | 10 | 10 | 9 | 8 | 9 |
| [Oro di Napoli](https://www.google.com/maps/search/?api=1&query=Oro%20di%20Napoli%20Saint-Rapha%C3%ABl%20France) | 8.2 | 8.8 | Saint-Raphaël | France | 03/05/2026 | £8.64 | 7 | 8 | 9 | 8 | 10 | 10 | 7 | 8 | 8 |
| [Bonturo Pizzeria Astrusa](https://www.google.com/maps/search/?api=1&query=Bonturo%20Pizzeria%20Astrusa%20Lucca%20Italy) | 8.2 | 9.9 | Lucca | Italy | 08/08/2026 | £6.85 | 8 | 9 | 9 | 9 | 5 | 5 | 7 | 8 | 8 |
| [Pizzarelli](https://www.google.com/maps/search/?api=1&query=Pizzarelli%20St%20Leonards-on-Sea%20England) | 8 | 7.3 | St Leonards-on-Sea | England | 22/08/2025 | £11.99 | 8 | 7 | 8 | 9 | 5 | 10 | 9 | 8 | 9 |
| [Le Bellini](https://www.google.com/maps/search/?api=1&query=Le%20Bellini%20Toulouse%20France) | 8 | 7.7 | Toulouse | France | 23/09/2024 | £10.80 | 9 | 8 | 8 | 8 | 5 | 5 | 9 | 8 | 8 |
| [Dora's](https://www.google.com/maps/search/?api=1&query=Dora's%20St%20Leonards-on-Sea%20England) | 7.8 | 7.8 | St Leonards-on-Sea | England | 14/06/2026 | £10.00 | 8 | 7 | 8 | 7 | 10 | 10 | 7 | 8 | 8 |
| [La Pizza](https://www.google.com/maps/search/?api=1&query=La%20Pizza%20Val%C3%A8ncia%20Spain) | 7.6 | 7.3 | València | Spain | 30/08/2025 | £10.82 | 8 | 7 | 8 | 7 | 10 | 0 | 8 | 8 | 8 |
| [Marghe](https://www.google.com/maps/search/?api=1&query=Marghe%20Milan%20Italy) | 7.6 | 8.2 | Milan | Italy | 31/07/2026 | £8.55 | 9 | 8 | 8 | 7 | 10 | 0 | 6 | 6 | 8 |
| [Brewing Brothers The Imperial](https://www.google.com/maps/search/?api=1&query=Brewing%20Brothers%20The%20Imperial%20Hastings%20England) | 7.2 | 7.4 | Hastings | England | 25/04/2025 | £9.50 | 8 | 7 | 9 | 7 | 0 | 10 | 7 | 8 | 7 |
| [The Crust](https://www.google.com/maps/search/?api=1&query=The%20Crust%20Bude%20England) | 7.2 | 6.6 | Bude | England | 13/08/2024 | £12.00 | 8 | 8 | 7 | 7 | 5 | 5 | 7 | 8 | 7 |
| [Rustico](https://www.google.com/maps/search/?api=1&query=Rustico%20Hastings%20England) | 7.1 | 7.3 | Hastings | England | 03/05/2025 | £9.50 | 8 | 7 | 8 | 6 | 5 | 5 | 7 | 8 | 8 |
| [Dough Ray Me](https://www.google.com/maps/search/?api=1&query=Dough%20Ray%20Me%20St%20Leonards-on-Sea%20England) | 6.9 | 6.6 | St Leonards-on-Sea | England | 17/07/2025 | £11.00 | 7 | 7 | 8 | 6 | 5 | 5 | 7 | 8 | 7 |
| [Homeslice](https://www.google.com/maps/search/?api=1&query=Homeslice%20City%20of%20London%20England) | 6.9 | 5.8 | City of London | England | 02/02/2026 | £14.00 | 7 | 7 | 8 | 7 | 5 | 5 | 6 | 7 | 6 |
| [Tredici](https://www.google.com/maps/search/?api=1&query=Tredici%20Cannes%20France) | 6.6 | 5.6 | Cannes | France | 09/08/2025 | £14.00 | 7 | 6 | 8 | 6 | 5 | 0 | 7 | 8 | 7 |
| [Magpie](https://www.google.com/maps/search/?api=1&query=Magpie%20Seoul%20South%20Korea) | 6.6 | 6.0 | Seoul | South Korea | 07/10/2025 | £12.14 | 6 | 6 | 7 | 7 | 5 | 10 | 7 | 7 | 6 |
| [Porlock Weir Hotel](https://www.google.com/maps/search/?api=1&query=Porlock%20Weir%20Hotel%20Porlock%20Weir%20England) | 6.6 | 5.7 | Porlock Weir | England | 23/07/2026 | £13.50 | 6 | 6 | 7 | 7 | 5 | 10 | 7 | 7 | 6 |
| [La Saporita](https://www.google.com/maps/search/?api=1&query=La%20Saporita%20St%20Leonards-on-Sea%20England) | 6.3 | 6.3 | St Leonards-on-Sea | England | 31/10/2025 | £9.95 | 6 | 6 | 7 | 7 | 0 | 10 | 7 | 7 | 7 |
| [The Rising Sun](https://www.google.com/maps/search/?api=1&query=The%20Rising%20Sun%20Chelmsford%20England) | 6.1 | 6.1 | Chelmsford | England | 01/02/2026 | £10.00 | 7 | 6 | 7 | 6 | 0 | 10 | 6 | 7 | 7 |
| [PizzaExpress](https://www.google.com/maps/search/?api=1&query=PizzaExpress%20Hastings%20England) | 6.1 | 4.8 | Hastings | England | 01/04/2026 | £15.90 | 6 | 6 | 7 | 7 | 0 | 5 | 6 | 8 | 7 |
| [Marina Fountain](https://www.google.com/maps/search/?api=1&query=Marina%20Fountain%20St%20Leonards-on-Sea%20England) | 5.8 | 5.4 | St Leonards-on-Sea | England | 08/05/2026 | £11.50 | 6 | 6 | 7 | 5 | 0 | 10 | 6 | 8 | 7 |
| [Bellissimo](https://www.google.com/maps/search/?api=1&query=Bellissimo%20Corfu%20Greece) | 5.6 | 6.1 | Corfu | Greece | 26/10/2024 | £8.33 | 5 | 6 | 6 | 6 | 0 | 5 | 7 | 8 | 7 |
| [The Boathouse](https://www.google.com/maps/search/?api=1&query=The%20Boathouse%20Christchurch%20England) | 5.6 | 4.7 | Christchurch | England | 19/04/2025 | £14.00 | 5 | 6 | 7 | 6 | 0 | 10 | 5 | 6 | 6 |
| [Wetherspoons](https://www.google.com/maps/search/?api=1&query=Wetherspoons%20Gatwick%20England) | 5.5 | 4.8 | Gatwick | England | 19/09/2024 | £13.25 | 6 | 6 | 6 | 6 | 0 | 0 | 7 | 5 | 6 |
| [Casa de Pier](https://www.google.com/maps/search/?api=1&query=Casa%20de%20Pier%20St%20Leonards-on-Sea%20England) | 5.2 | 5.2 | St Leonards-on-Sea | England | 16/05/2025 | £10.00 | 5 | 5 | 6 | 5 | 0 | 10 | 6 | 6 | 7 |
| [Wetherspoons (Cornfield Garage)](https://www.google.com/maps/search/?api=1&query=Wetherspoons%20(Cornfield%20Garage)%20Eastbourne%20England) | 5.1 | 5.3 | Eastbourne | England | 08/03/2026 | £9.28 | 5 | 5 | 6 | 6 | 0 | 0 | 6 | 5 | 6 |

## Project Structure

```text
├── scripts/              # Data and local dev helper scripts
│   ├── csv-to-json.js    # Convert CSV data to JSON format
│   ├── enrich-google-places.js # Store Google place IDs for restaurant photos
│   └── update-readme-table.js  # Sync this README's ratings table from the CSV
├── src/                  # Web application source
│   ├── pages/
│   │   ├── index.astro   # Route: / (prerendered static page)
│   │   └── api/           # On-demand routes: Google Places photo proxy
│   ├── layouts/
│   │   └── Layout.astro  # <html> shell: meta tags, CSS import, main.js script
│   ├── components/       # Header, MobileFilters, Sidebar, MobileDetailView
│   ├── lib/
│   │   └── photos.js     # Shared helpers for the photo API routes
│   ├── scripts/
│   │   └── main.js       # Application logic and Leaflet integration
│   ├── styles/
│   │   └── main.css      # Tailwind CSS and Leaflet styles
│   └── data/              # Data directory
│       ├── google-places.json # Stored Google place IDs by restaurant
│       └── ratings.csv   # CSV data fetched from Google Sheets
├── public/
│   └── data/
│       └── ratings.json  # Processed JSON data for the app (generated, gitignored)
├── dist/                 # Production build output (generated): client/ (static assets) + server/ (Worker)
├── astro.config.mjs      # Astro build configuration (Cloudflare adapter, Tailwind CSS v4 Vite plugin)
├── wrangler.jsonc         # Cloudflare Worker/deploy configuration
└── mise.toml            # Development environment config
```

## Build System

The application uses [Astro](https://astro.build/) with the `@astrojs/cloudflare` adapter, so the whole app — static homepage and the Google Places photo-proxy API — builds and deploys as a single Cloudflare Worker (no separate hand-written worker script):

- **Templating**: `.astro` components (layout + Header/Sidebar/MobileFilters/MobileDetailView) compose the single page today, and provide a template for adding more routes (e.g. a page per restaurant) later
- **API routes**: `src/pages/api/place-photo/[placeId].js` and `src/pages/api/place-photo-media/[placeId].js` run on-demand (`export const prerender = false`), reading bindings via `import { env } from 'cloudflare:workers'` and `context.locals.cfContext.waitUntil`
- **CSS**: Tailwind CSS v4 via the `@tailwindcss/vite` plugin, imported in the layout
- **Leaflet CSS**: Imported from node_modules via CSS `@import` in `main.css`
- **Leaflet**: Bundled as ES module
- **HTML**: Minified by Astro by default
- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Minification**: JavaScript minified with esbuild
- **Tree Shaking**: Unused code eliminated

> **Note:** `wrangler` and `@cloudflare/vite-plugin` are pinned to specific versions in `package.json`/`pnpm-workspace.yaml`, and `astro.config.mjs` sets `prerenderEnvironment: 'node'` on the adapter — both work around active upstream bugs. See the comments in those files and `AGENTS.md` before upgrading.

### Commands

- `pnpm dev` - Astro dev server on `http://127.0.0.1:8787`, serving the frontend and `/api/*` routes together
- `pnpm check` - Non-mutating CI validation: regenerate data and build
- `pnpm build` - Production build with full minification and optimization (also updates the README ratings table)
- `pnpm preview` - Builds and serves the production Worker locally via `wrangler dev` on `http://localhost:8788`
- `pnpm ship` - Build and deploy to Cloudflare Workers

## Getting Started

### Prerequisites

- Node.js and pnpm
- A Google Sheets document with restaurant data
- `GOOGLE_MAPS_API_KEY` in `.dev.vars` for local photo API calls, and in your shell environment for `pnpm enrich-google-places`/`pnpm update-data`

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd margmap
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Fetch and build data**

   ```bash
   pnpm fetch-data
   ```

4. **Start local development server**

   ```bash
   pnpm dev
   ```

5. **Access the application**

   Open your browser to `http://127.0.0.1:8787`

   `pnpm dev` runs `astro dev` as a background daemon; use `astro dev status`, `astro dev logs`, or `astro dev stop` to manage it.

### Available Scripts

- `pnpm dev` - Start the Astro dev server (frontend + `/api/*` routes) on port 8787
- `pnpm check` - Run the CI validation build without updating README
- `pnpm build` - Build optimized production bundle and update README ratings table
- `pnpm preview` - Preview the production Worker locally (via `wrangler dev`) on port 8788
- `pnpm ship` - Build and deploy to Cloudflare Workers
- `pnpm fetch-csv` - Fetch the raw CSV from Google Sheets only
- `pnpm fetch-data` - Fetch CSV from Google Sheets and convert to JSON
- `pnpm enrich-google-places` - Match restaurants to Google place IDs for photo lookups
- `pnpm prepare-data` - Convert existing CSV to JSON
- `pnpm update-data` - Fetch fresh data, enrich missing Google place IDs, regenerate JSON, and sync README
- `pnpm update-readme` - Sync README ratings table from CSV
- `pnpm clean` - Remove generated data files and build output

## Data Management

### Google Sheets Integration

The application pulls data from a Google Sheets document. The sheet should contain restaurant information with columns for:

- Restaurant names
- Addresses/locations
- Ratings
- Additional metadata

### Manual Data Updates

Since data is committed to the repository for simplified builds:

1. **Update the Google Sheets document** with new restaurants or ratings
2. **Regenerate local data**:

   ```bash
   pnpm update-data
   ```

3. **Commit and push changes**:

   ```bash
   git add src/data/ README.md
   git commit -m "Update restaurant data"
   git push origin main
   ```

## Deployment

The application is deployed manually to [Cloudflare Workers](https://developers.cloudflare.com/workers/) from a local machine via:

```sh
pnpm ship
```

`GOOGLE_MAPS_API_KEY` must be set as a Worker secret in production: `wrangler secret put GOOGLE_MAPS_API_KEY`.

## Technology Stack

- **Frontend**: [Astro](https://astro.build/) with the `@astrojs/cloudflare` adapter, CSS (Tailwind v4), JavaScript
- **Mapping**: Leaflet.js for interactive maps
- **Data**: Google Sheets → CSV → JSON pipeline
- **Build**: Astro/Vite with Node.js helper scripts, pnpm package manager
- **Deployment**: Single Cloudflare Worker — static assets + on-demand photo API routes (via `pnpm ship`)
- **Environment**: Mise for development tooling

## Development Notes

- The application uses a responsive design that works on both desktop and mobile
- Map view is available on larger screens, with a list-only view on mobile
- Data conversion happens automatically during the build process
- Photo lookups are served by on-demand Astro API routes running on the same Worker, so local development should use `pnpm dev` (not `wrangler dev` directly) to get both the frontend and those routes
- `pnpm update-data` requires `GOOGLE_MAPS_API_KEY` when new restaurants need Google place IDs
- All source code is in the `src/` directory; the site is a single page today but is structured as an Astro template (layout + components) to support adding more pages, e.g. one per restaurant

## Contributing

1. Update restaurant data in the Google Sheets document
2. Run `pnpm update-data` to regenerate data, place IDs, and the README table
3. Test locally with `pnpm dev`
4. Commit and push changes to trigger deployment
