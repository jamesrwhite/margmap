import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://margmap.com',
    outDir: './dist',
    server: {
        port: 8787,
        host: '127.0.0.1',
    },
    integrations: [sitemap()],
    // This app has no cookies/session usage; skip the adapter's default
    // auto-provisioned Cloudflare KV session binding.
    session: false,
    adapter: cloudflare({
        // Workerd-sandboxed static prerendering is currently broken
        // (https://github.com/withastro/astro/issues/17600); render
        // prerendered pages in Node instead until that's fixed upstream.
        prerenderEnvironment: 'node',
        // This app never uses Astro's <Image>/astro:assets pipeline (all
        // photos come from the Google Places proxy as plain <img> tags), so
        // skip the adapter's default Cloudflare Images binding.
        imageService: 'passthrough',
    }),
    vite: {
        plugins: [
            tailwindcss(),
            {
                // `imageService: 'passthrough'` above pulls in
                // astro/assets/services/noop, which isn't in the Cloudflare
                // adapter's default SSR dep pre-bundle. Vite then discovers
                // it lazily on first request in the workerd dev sandbox,
                // triggering a re-optimize + reload that races with the
                // in-flight request and crashes `astro dev` with "The file
                // does not exist ... deps_ssr/route-cache-*.js" (see
                // https://github.com/withastro/astro/issues/16248).
                // Pre-including it here avoids the lazy discovery entirely.
                name: 'pre-include-noop-image-service',
                configEnvironment(name) {
                    if (name !== 'client') {
                        return {
                            optimizeDeps: {
                                include: ['astro/assets/services/noop'],
                            },
                        };
                    }
                },
            },
        ],
    },
});
