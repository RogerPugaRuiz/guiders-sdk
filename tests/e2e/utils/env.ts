/**
 * Test environment helpers — read service availability flags written by
 * `tests/e2e/global-setup.ts` and expose them as typed booleans plus
 * `requireXxx()` helpers that skip the test when missing.
 */
import { test } from '@playwright/test';

export const hasDemo = (): boolean => process.env.E2E_DEMO_AVAILABLE === 'true';
export const hasBackend = (): boolean => process.env.E2E_BACKEND_AVAILABLE === 'true';
export const hasWordPress = (): boolean => process.env.E2E_WORDPRESS_AVAILABLE === 'true';

/**
 * Skip the current test when the PHP demo server is not running.
 * Use inside `test.beforeEach` or at the top of a `test()` body.
 */
export function requireDemo(): void {
    test.skip(!hasDemo(), 'PHP demo server not available at 127.0.0.1:8083');
}

/**
 * Skip the current test when the NestJS backend is not reachable.
 */
export function requireBackend(): void {
    test.skip(!hasBackend(), 'Backend not available at localhost:3000/api');
}

/**
 * Skip the current test when the WordPress Docker stack is not running.
 */
export function requireWordPress(): void {
    test.skip(!hasWordPress(), 'WordPress not available at localhost:8090');
}
