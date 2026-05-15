#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const devPort = process.env.PORT || '8787';

function spawnProcess(command, args, label) {
    const child = spawn(command, args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: false,
    });

    child.on('exit', (code, signal) => {
        if (signal) {
            return;
        }

        if (code !== 0) {
            console.error(`${label} exited with code ${code}`);
            shutdown(code ?? 1);
        }
    });

    return child;
}

function runProcessOnce(command, args, label) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: rootDir,
            stdio: 'inherit',
            shell: false,
        });

        child.on('exit', (code, signal) => {
            if (signal) {
                reject(new Error(`${label} exited via signal ${signal}`));
                return;
            }

            if (code !== 0) {
                reject(new Error(`${label} exited with code ${code}`));
                return;
            }

            resolve();
        });
    });
}

const children = [];

function shutdown(exitCode = 0) {
    while (children.length > 0) {
        const child = children.pop();
        if (child && !child.killed) {
            child.kill('SIGTERM');
        }
    }

    process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

(async () => {
    try {
        await runProcessOnce(process.execPath, ['scripts/csv-to-json.js', 'src/data/ratings.csv', 'src/data/ratings.json'], 'prepare-data');

        const vitePath = path.join(rootDir, 'node_modules', '.bin', 'vite');
        const wranglerPath = path.join(rootDir, 'node_modules', '.bin', 'wrangler');

        await runProcessOnce(vitePath, ['build'], 'vite build');

        children.push(
            spawnProcess(vitePath, ['build', '--watch'], 'vite build --watch'),
            spawnProcess(wranglerPath, ['dev', '--port', devPort, '--live-reload'], 'wrangler dev')
        );
    } catch (error) {
        console.error(error.message);
        shutdown(1);
    }
})();
