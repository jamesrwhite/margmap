import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';
import ViteMinifyPlugin from 'vite-plugin-html-minifier';

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
            },
        },
    },
    plugins: [
        ViteMinifyPlugin({}),
        {
            name: 'copy-data',
            closeBundle() {
                const distData = resolve(__dirname, 'dist', 'data');
                mkdirSync(distData, { recursive: true });
                copyFileSync(
                    resolve(__dirname, 'src', 'data', 'ratings.json'),
                    resolve(distData, 'ratings.json')
                );
            },
        },
    ],
});
