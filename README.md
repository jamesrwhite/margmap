# 🍕 MargMap

A web application for visualizing and rating pizza places on an interactive map. Data is maintained in a Google Sheets document and automatically converted to JSON for the web application.

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

- **Tailwind CSS**: Purged and minified in production
- **Leaflet**: Bundled as ES module
- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Minification**: JavaScript and CSS minified in production builds
- **Tree Shaking**: Unused code eliminated

### Development vs Production

- **Development**: Hot module replacement, fast refresh, source maps
- **Production**: Minified bundles, optimized assets, CDN-ready

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
