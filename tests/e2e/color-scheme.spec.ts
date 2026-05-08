/**
 * Color-scheme override tests (Story 7.1).
 *
 * These tests verify that SDKOptions.colorScheme forces the widget into
 * light or dark mode independently of the OS preference emulated via
 * Playwright's page.emulateMedia(). They also verify that the system
 * (auto) mode continues to follow the OS preference.
 *
 * Three scenarios:
 *   1. system (default) — no colorScheme set, OS dark → dark tokens applied
 *   2. forced dark       — colorScheme='dark', OS light → dark tokens applied
 *   3. forced light      — colorScheme='light', OS dark → light tokens applied
 *
 * Assertion strategy: read --gds-color-bg from getComputedStyle() on the
 * shadow host. Expected values per theme/mode:
 *   default  light → #ffffff      dark → #0f172a
 *   carbon   light → #fafafa      dark → #000000
 */

import { test, expect, type Page } from '@playwright/test';
import { requireDemo } from './utils/env';

const DEMO_BASE = 'http://127.0.0.1:8083';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Navigate to demo, inject optional GUIDERS_CONFIG overrides, wait for SDK. */
async function gotoWithConfig(
    page: Page,
    config: Record<string, unknown> = {},
): Promise<void> {
    // Inject config into the page before the SDK script runs by intercepting
    // the HTML response and prepending a <script> block.
    await page.addInitScript((cfg) => {
        // Merge into any existing GUIDERS_CONFIG (set by header.php).
        (window as any).__PENDING_GUIDERS_OVERRIDE = cfg;
        const origDefineProperty = Object.defineProperty;
        // Simpler: just set it before DOMContentLoaded since header.php uses
        // a plain assignment. We patch after the assignment fires.
        document.addEventListener('DOMContentLoaded', () => {
            const w = window as any;
            if (w.GUIDERS_CONFIG && w.__PENDING_GUIDERS_OVERRIDE) {
                Object.assign(w.GUIDERS_CONFIG, w.__PENDING_GUIDERS_OVERRIDE);
            }
        });
    }, config);

    await page.goto(DEMO_BASE, { waitUntil: 'networkidle' });

    // BotDetector mitigation — see preact-components.spec.ts for explanation.
    await page.mouse.move(200, 200);
    await page.mouse.move(220, 220);

    await page.waitForFunction(() => Boolean((window as any).guiders), {
        timeout: 15000,
    });
    // Allow Preact / Shadow DOM to settle.
    await page.waitForTimeout(500);
}

/**
 * Read --gds-color-bg from the shadow host's computed style.
 * Returns the trimmed value (e.g. "#000000").
 */
async function getColorBg(page: Page): Promise<string> {
    return page.evaluate(() => {
        const all = document.querySelectorAll('*');
        const host = Array.from(all).find((el) => el.shadowRoot) as HTMLElement | undefined;
        if (!host) return '';
        return getComputedStyle(host).getPropertyValue('--gds-color-bg').trim();
    });
}

/**
 * Read data-color-scheme attribute from the shadow host element.
 * Returns the attribute value or null if absent.
 */
async function getDataColorScheme(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        const all = document.querySelectorAll('*');
        const host = Array.from(all).find((el) => el.shadowRoot) as HTMLElement | undefined;
        if (!host) return null;
        return host.getAttribute('data-color-scheme');
    });
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe('color-scheme override', () => {
    test.beforeEach(async ({ page }) => {
        requireDemo();
    });

    test('system (default) — OS dark preference applies dark tokens', async ({ page }) => {
        // Emulate dark OS preference BEFORE loading the page.
        await page.emulateMedia({ colorScheme: 'dark' });

        // No colorScheme override — should follow OS.
        await gotoWithConfig(page, {});

        // The host must NOT have data-color-scheme attribute in system mode.
        const attr = await getDataColorScheme(page);
        expect(attr).toBeNull();

        // Dark tokens must be active (default theme dark bg = #0f172a,
        // carbon theme dark bg = #000000 — either is acceptable).
        const bg = await getColorBg(page);
        expect(['#0f172a', '#000000']).toContain(bg);
    });

    test('forced dark — dark tokens active even when OS is light', async ({ page }) => {
        // Emulate LIGHT OS preference — without the override the widget would
        // render in light mode.
        await page.emulateMedia({ colorScheme: 'light' });

        await gotoWithConfig(page, { colorScheme: 'dark' });

        // Host must carry data-color-scheme="dark".
        const attr = await getDataColorScheme(page);
        expect(attr).toBe('dark');

        // Dark tokens must be active regardless of OS preference.
        const bg = await getColorBg(page);
        expect(['#0f172a', '#000000']).toContain(bg);
    });

    test('forced light — light tokens active even when OS is dark', async ({ page }) => {
        // Emulate DARK OS preference — without the override the widget would
        // render in dark mode.
        await page.emulateMedia({ colorScheme: 'dark' });

        await gotoWithConfig(page, { colorScheme: 'light' });

        // Host must carry data-color-scheme="light".
        const attr = await getDataColorScheme(page);
        expect(attr).toBe('light');

        // Light tokens must be active regardless of OS preference.
        // default theme light bg = #ffffff, carbon theme light bg = #fafafa
        const bg = await getColorBg(page);
        expect(['#ffffff', '#fafafa']).toContain(bg);
    });
});
