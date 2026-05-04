import { test, Page, Locator } from '@playwright/test';
import { requireDemo } from './utils/env';

/**
 * Manual verification capture — produces full-page screenshots of the
 * canonical Preact UI states for documentation/review purposes.
 *
 * NOT a regression test: it always passes and just dumps PNGs to
 * `_bmad-output/verification-artifacts/`. Run on demand with:
 *
 *   npx playwright test verification-capture --project=chromium --headed
 *
 * Each screenshot is named after the UI state it represents, so the
 * BMad reviewer can eyeball the migration end-state without spinning
 * up the demo server manually.
 */

const DEMO_URL = 'http://127.0.0.1:8083/?dev';
const OUT_DIR = '_bmad-output/verification-artifacts';

function shadow(page: Page, selector: string): Locator {
    return page.locator(`#guiders-chat-widget ${selector}`);
}

async function unblockSdk(page: Page): Promise<void> {
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page.mouse.move(200, 200);
    await page.mouse.move(220, 220);
    await page.waitForFunction(() => Boolean((window as any).guiders), {
        timeout: 15000,
    });
    await page.waitForTimeout(500);
}

test.describe('Manual verification capture', () => {
    test.beforeEach(() => {
        requireDemo();
    });

    test('capture all Preact UI states', async ({ page, context }) => {
        await unblockSdk(page);

        // 1. Toggle button — closed (default landing state).
        await page.screenshot({
            path: `${OUT_DIR}/01-toggle-closed.png`,
            fullPage: false,
        });

        // 2. Toggle button — open + chat widget visible.
        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(500);
        await page.screenshot({
            path: `${OUT_DIR}/02-chat-opened.png`,
            fullPage: false,
        });

        // 3. Offline banner active (chat is open).
        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await page.waitForTimeout(500);
        const bannerCount = await shadow(page, '.guiders-offline-banner').count();
        if (bannerCount > 0) {
            await page.screenshot({
                path: `${OUT_DIR}/03-chat-offline.png`,
                fullPage: false,
            });
        }
        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.waitForTimeout(300);

        // 4. Close again — return to landing state.
        await page.evaluate(() => (window as any).guiders.hideChat());
        await page.waitForTimeout(400);
        await page.screenshot({
            path: `${OUT_DIR}/04-toggle-closed-after.png`,
            fullPage: false,
        });
    });
});
