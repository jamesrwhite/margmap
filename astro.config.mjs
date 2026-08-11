import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    site: 'https://margmap.com',
    outDir: './dist',
    server: {
        port: 8787,
        host: '127.0.0.1',
    },
    // This app has no cookies/session usage; skip the adapter's default
    // auto-provisioned Cloudflare KV session binding.
    session: false,
    adapter: cloudflare({
        // Workerd-sandboxed static prerendering is currently broken
        // (https://github.com/withastro/astro/issues/17600); render
        // prerendered pages in Node instead until that's fixed upstream.
        prerenderEnvironment: 'node',
    }),
    vite: {
        plugins: [tailwindcss()],
    },
});
