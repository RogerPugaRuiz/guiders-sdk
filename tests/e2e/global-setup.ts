/**
 * globalSetup — runs once before the entire E2E suite.
 *
 * Probes the optional services the suite depends on (PHP demo server,
 * NestJS backend, WordPress Docker) and exports their availability via
 * env vars so individual specs can `test.skip()` cleanly when an
 * environment is missing.
 *
 * Env vars set:
 *   E2E_DEMO_AVAILABLE      — 'true' if PHP demo at 127.0.0.1:8083 responds
 *   E2E_BACKEND_AVAILABLE   — 'true' if NestJS backend at localhost:3000/api responds
 *   E2E_WORDPRESS_AVAILABLE — 'true' if WordPress at localhost:8090 responds
 *
 * Specs read these via `process.env.E2E_*`. See `tests/e2e/utils/env.ts`
 * for the helpers.
 */
import { request } from 'http';

const DEMO_URL = 'http://127.0.0.1:8083';
const BACKEND_URL = 'http://localhost:3000/api';
const WP_URL = 'http://localhost:8090';

function probe(url: string, timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
        const u = new URL(url);
        const req = request(
            {
                hostname: u.hostname,
                port: u.port,
                path: u.pathname || '/',
                method: 'HEAD',
                timeout: timeoutMs,
            },
            (res) => {
                // Any 2xx/3xx/4xx counts as "responding"; only network errors mean absent
                resolve((res.statusCode ?? 0) > 0 && (res.statusCode ?? 0) < 500);
                res.resume();
            }
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

export default async function globalSetup() {
    const [demo, backend, wp] = await Promise.all([
        probe(DEMO_URL),
        probe(BACKEND_URL),
        probe(WP_URL),
    ]);

    process.env.E2E_DEMO_AVAILABLE = String(demo);
    process.env.E2E_BACKEND_AVAILABLE = String(backend);
    process.env.E2E_WORDPRESS_AVAILABLE = String(wp);

    /* eslint-disable no-console */
    console.log('\n[E2E globalSetup] Service availability:');
    console.log(`  Demo (${DEMO_URL}):       ${demo ? 'available' : 'MISSING — affected tests will skip'}`);
    console.log(`  Backend (${BACKEND_URL}): ${backend ? 'available' : 'MISSING — affected tests will skip'}`);
    console.log(`  WordPress (${WP_URL}):    ${wp ? 'available' : 'MISSING — affected tests will skip'}`);
    console.log('');

    if (!demo) {
        console.warn('[E2E globalSetup] PHP demo server not reachable. Start with:');
        console.warn('  php -S 127.0.0.1:8083 -t demo/app');
    }
}
