# 🍕 MargMap

A web application for visualizing and rating pizza places on an interactive map. Data is maintained in a Google Sheets document and automatically converted to JSON for the web application.

## Restaurant Ratings

| Name | Rating | Location | Country | Date | Price | Crust | Dough | Sauce | Cheese | Basil | Sliced | Sloppiness | Saltiness | Oiliness |
|------|--------|----------|---------|------|-------|-------|-------|-------|--------|-------|--------|------------|-----------|----------|
| Monellis | 8.5 | Hastings | England | 19/10/2024 | £13.50 | 9 | 9 | 9 | 9 | 5 | 5 | 8 | 8 | 9 |
| Slice of Life | 8.3 | Busan | South Korea | 10/10/2025 | £11.14 | 7 | 8 | 8 | 9 | 10 | 10 | 9 | 8 | 9 |
| Pizzarelli | 8 | St Leonards-on-Sea | England | 22/08/2025 | £11.99 | 8 | 7 | 8 | 9 | 5 | 10 | 9 | 8 | 9 |
| Le Bellini | 8 | Toulouse | France | 23/09/2024 | £10.80 | 9 | 8 | 8 | 8 | 5 | 5 | 9 | 8 | 8 |
| La Pizza | 7.6 | València | Spain | 30/08/2025 | £10.82 | 8 | 7 | 8 | 7 | 10 | 0 | 8 | 8 | 8 |
| Brewing Brothers | 7.4 | Hastings | England | 25/04/2025 | £9.50 | 8 | 7 | 9 | 7 | 0 | 10 | 7 | 8 | 7 |
| The Crust | 7.3 | Bude | England | 13/08/2024 | £12.00 | 8 | 8 | 7 | 7 | 5 | 5 | 7 | 8 | 7 |
| Rustico | 7.2 | Hastings | England | 03/05/2025 | £9.50 | 8 | 7 | 8 | 6 | 5 | 5 | 7 | 8 | 8 |
| Dough Ray Me | 7 | St Leonards-on-Sea | England | 17/07/2025 | £11.00 | 7 | 7 | 8 | 6 | 5 | 5 | 7 | 8 | 7 |
| Homeslice | 6.9 | City of London | England | 02/02/2026 | £14.00 | 7 | 7 | 8 | 7 | 5 | 5 | 6 | 7 | 6 |
| Tredici | 6.7 | Cannes | France | 09/08/2025 | £14.00 | 7 | 6 | 8 | 6 | 5 | 0 | 7 | 8 | 7 |
| Magpie | 6.6 | Seoul | South Korea | 07/10/2025 | £12.14 | 6 | 6 | 7 | 7 | 5 | 10 | 7 | 7 | 6 |
| La Saporita | 6.4 | St Leonards-on-Sea | England | 31/10/2025 | £9.95 | 6 | 6 | 7 | 7 | 0 | 10 | 7 | 7 | 7 |
| The Rising Sun | 6.2 | Chelmsford | England | 01/02/2026 | £10.00 | 7 | 6 | 7 | 6 | 0 | 10 | 6 | 7 | 7 |
| Bellisimo | 5.8 | Corfu | Greece | 26/10/2024 | £8.33 | 5 | 6 | 6 | 6 | 0 | 5 | 7 | 8 | 7 |
| Marina Fountain | 5.8 | St Leonards-on-Sea | England | 16/10/2024 | £9.50 | 5 | 5 | 6 | 5 | 5 | 10 | 7 | 7 | 7 |
| The Boat House | 5.8 | Christchurch | England | 19/04/2025 | £14.00 | 5 | 6 | 7 | 6 | 0 | 10 | 5 | 6 | 6 |
| Wetherspoons | 5.5 | Gatwick | England | 19/09/2024 | £13.25 | 6 | 6 | 6 | 6 | 0 | 0 | 7 | 5 | 6 |
| Casa de Pier | 5.4 | St Leonards-on-Sea | England | 16/05/2025 | £10.00 | 5 | 5 | 6 | 5 | 0 | 10 | 6 | 6 | 7 |

## Project Structure

```text
├── .github/workflows/     # GitHub Actions for deployment
│   └── cd.yml            # Cloudflare Pages deployment workflow
├── scripts/              # Data processing scripts
│   └── csv-to-json.js    # Convert CSV data to JSON format
├── src/                  # Web application source
│   ├── index.html        # Main application file
│   ├── main.js           # JavaScript entry point
│   ├── styles.css        # Tailwind CSS entry point
│   └── data/            # Data directory
│       ├── ratings.csv   # CSV data fetched from Google Sheets
│       └── ratings.json  # Processed JSON data for the app
├── dist/                 # Production build output (generated)
├── vite.config.js        # Vite build configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── mise.toml            # Development environment config
```

## Build System

The application uses [Vite](https://vitejs.dev/) for optimal bundling and performance:

- **Tailwind CSS**: Purged and minified
- **Leaflet**: Bundled as ES module
- **HTML**: Minified with whitespace removal
- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Minification**: JavaScript minified with esbuild
- **Tree Shaking**: Unused code eliminated

### Commands

- `pnpm dev` - Development server with hot reload and source maps (unminified)
- `pnpm build` - Production build with full minification and optimization
- `pnpm preview` - Serves the production build locally for testing (minified)

## Getting Started

### Prerequisites

- Node.js and pnpm
- A Google Sheets document with restaurant data

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

   Open your browser to `http://localhost:5173` (Vite default port)

### Available Scripts

- `pnpm dev` - Start Vite development server with hot reload
- `pnpm build` - Build optimized production bundle (includes data preparation)
- `pnpm preview` - Preview production build locally
- `pnpm deploy` - Build and deploy to Cloudflare Pages
- `pnpm fetch-data` - Fetch CSV from Google Sheets and convert to JSON
- `pnpm prepare-data` - Convert existing CSV to JSON
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
   pnpm clean
   pnpm fetch-data
   ```

3. **Commit and push changes**:

   ```bash
   git add src/data/
   git commit -m "Update restaurant data"
   git push origin main
   ```

This will trigger automatic deployment to Cloudflare Pages.

## Deployment

The application is deployed manually to Cloudflare Workers Assets from a local machine via:

```sh
pnpm wrangler deploy
```

## Technology Stack

- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Mapping**: Leaflet.js for interactive maps
- **Data**: Google Sheets → CSV → JSON pipeline
- **Build**: Node.js scripts with pnpm package manager
- **Deployment**: Cloudflare Workers Assets via GitHub Actions
- **Environment**: Mise for development tooling

## Development Notes

- The application uses a responsive design that works on both desktop and mobile
- Map view is available on larger screens, with a list-only view on mobile
- Data conversion happens automatically during the build process
- All source code is in the `src/` directory for easy deployment

## Contributing

1. Update restaurant data in the Google Sheets document
2. Run `pnpm fetch-data` to regenerate the data files
3. Test locally with `pnpm dev`
4. Commit and push changes to trigger deployment
