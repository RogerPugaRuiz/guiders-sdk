import { test, expect, Page, Locator } from '@playwright/test';
import { requireDemo } from './utils/env';

/**
 * Visual regression baselines for the Preact-migrated UI.
 *
 * These tests capture pixel-level snapshots of the canonical UI components
 * (ToggleButton, ChatWidget header, OfflineBanner, ChatListView) so any
 * future regression in the Preact components is caught automatically.
 *
 * Run once with `--update-snapshots` to create the baselines, then
 * subsequent runs assert against them.
 *
 * Stability notes:
 *  - All dynamic content (timestamps, presence dots animation, unread
 *    badge counters) is masked or normalized via injected CSS.
 *  - The BotDetector mitigation (mouse move) is required to unblock SDK
 *    initialization in headless mode — see preact-components.spec.ts.
 *  - We disable CSS animations and transitions globally to avoid frame
 *    timing flakiness across machines.
 */

const DEMO_URL = 'http://127.0.0.1:8083/?dev';

/**
 * Pierce the SDK Shadow DOM. All Preact components are mounted inside
 * `#guiders-chat-widget`'s shadow root.
 */
function shadow(page: Page, selector: string): Locator {
    return page.locator(`#guiders-chat-widget ${selector}`);
}

async function gotoDemoStable(page: Page): Promise<void> {
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });

    // BotDetector mitigation (see preact-components.spec.ts:33).
    await page.mouse.move(200, 200);
    await page.mouse.move(220, 220);

    await page.waitForFunction(() => Boolean((window as any).guiders), {
        timeout: 15000,
    });

    // Wait for Preact mounts and Shadow DOM hydration.
    await page.waitForTimeout(500);

    // Disable animations globally for deterministic screenshots. We have
    // to inject the rule into the Shadow DOM as well — global CSS does
    // not pierce shadow boundaries.
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `,
    });

    // Inject the same rule into the SDK's shadow root.
    await page.evaluate(() => {
        const host = document.querySelector('#guiders-chat-widget');
        const sr = (host as any)?.shadowRoot as ShadowRoot | undefined;
        if (!sr) return;
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `;
        sr.appendChild(style);
    });
}

test.describe('Visual regression — Preact components', () => {
    test.beforeEach(() => {
        requireDemo();
    });

    test('ToggleButton — closed state', async ({ page }) => {
        await gotoDemoStable(page);

        const toggle = shadow(page, '.chat-toggle-btn');
        await expect(toggle).toBeVisible();

        // Snapshot the button only — keeps the baseline tight (~80x80px).
        await expect(toggle).toHaveScreenshot('toggle-button-closed.png', {
            // Sub-pixel anti-aliasing differs across OS/GPU. Allow a
            // small per-pixel diff plus a tiny ratio of total pixels.
            maxDiffPixelRatio: 0.02,
            threshold: 0.2,
        });
    });

    test('ToggleButton — open state', async ({ page }) => {
        await gotoDemoStable(page);

        const toggle = shadow(page, '.chat-toggle-btn');
        await toggle.click();
        await page.waitForTimeout(300);

        await expect(toggle).toHaveClass(/open/);
        await expect(toggle).toHaveScreenshot('toggle-button-open.png', {
            maxDiffPixelRatio: 0.02,
            threshold: 0.2,
        });
    });

    test('ChatWidget — opened (full widget)', async ({ page }) => {
        await gotoDemoStable(page);

        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(500);

        const root = shadow(page, '.guiders-chat-widget-root');
        await expect(root).not.toHaveClass(/hidden/);

        // The root element is a 0x0 positioning wrapper. The actual
        // visible widget lives in the `.chat-widget-fixed` child.
        const widget = shadow(page, '.chat-widget-fixed');
        await expect(widget).toBeVisible();

        // Mask any element whose content varies between runs (timestamps,
        // dynamic counters, etc.).
        await expect(widget).toHaveScreenshot('chat-widget-opened.png', {
            mask: [
                shadow(page, '[data-testid="message-timestamp"]'),
                shadow(page, '.guiders-chat-list-item__time'),
                shadow(page, '.guiders-presence__label'),
            ],
            maxDiffPixelRatio: 0.02,
            threshold: 0.2,
        });
    });

    test('OfflineBanner — visible when offline', async ({ page, context }) => {
        await gotoDemoStable(page);

        // Open the widget — OfflineBanner only renders inside the chat.
        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(300);

        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await page.waitForTimeout(500);

        const banner = shadow(page, '.guiders-offline-banner');
        const present = await banner.count();
        test.skip(
            present === 0,
            'Offline banner not rendered (offline detection not enabled in demo build)',
        );

        await expect(banner).toBeVisible();
        await expect(banner).toHaveScreenshot('offline-banner.png', {
            maxDiffPixelRatio: 0.02,
            threshold: 0.2,
        });
    });

    test('ChatListView OR ChatWidget — list/single view', async ({ page }) => {
        await gotoDemoStable(page);

        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(500);

        // Either the list view OR a single chat widget is mounted
        // depending on the visitor's chat history.
        const listView = shadow(page, '.guiders-chat-list-view');
        const chatWidget = shadow(page, '.chat-widget-fixed');

        const listCount = await listView.count();
        const widgetCount = await chatWidget.count();
        expect(listCount + widgetCount).toBeGreaterThan(0);

        const target = listCount > 0 ? listView : chatWidget;
        const baselineName =
            listCount > 0 ? 'chat-list-view.png' : 'chat-single-view.png';

        await expect(target).toHaveScreenshot(baselineName, {
            mask: [
                shadow(page, '.guiders-chat-list-item__time'),
                shadow(page, '[data-testid="message-timestamp"]'),
            ],
            maxDiffPixelRatio: 0.03,
            threshold: 0.25,
        });
    });
});
