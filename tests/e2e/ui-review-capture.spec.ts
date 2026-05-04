import { test, Page, Locator } from '@playwright/test';
import { requireDemo } from './utils/env';

/**
 * UI/UX review capture — produces high-resolution screenshots of every
 * visible chat state for design review purposes.
 *
 * NOT a regression test: it always passes. Outputs go to
 * `_bmad-output/ui-review-artifacts/`.
 *
 * Run with:
 *   npx playwright test ui-review-capture --project=chromium --workers=1
 */

const DEMO_URL = 'http://127.0.0.1:8083/?dev';
const OUT_DIR = '_bmad-output/ui-review-artifacts';

function shadow(page: Page, selector: string): Locator {
    return page.locator(`#guiders-chat-widget ${selector}`);
}

async function unblockSdk(page: Page): Promise<void> {
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page.mouse.move(200, 200);
    await page.mouse.move(220, 220);
    await page.mouse.move(240, 240);
    await page.waitForFunction(() => Boolean((window as any).guiders), { timeout: 15000 });
    await page.waitForTimeout(800);
}

async function safeShot(
    page: Page,
    name: string,
    clip?: { x: number; y: number; width: number; height: number }
): Promise<void> {
    try {
        const viewport = page.viewportSize();
        if (clip && viewport) {
            const x = Math.max(0, Math.floor(clip.x));
            const y = Math.max(0, Math.floor(clip.y));
            const width = Math.max(1, Math.min(Math.floor(clip.width), viewport.width - x));
            const height = Math.max(1, Math.min(Math.floor(clip.height), viewport.height - y));
            if (width <= 1 || height <= 1) {
                await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: false });
                return;
            }
            await page.screenshot({ path: `${OUT_DIR}/${name}.png`, clip: { x, y, width, height } });
        } else {
            await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: false });
        }
    } catch {
        try { await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: false }); } catch { /* swallow */ }
    }
}

async function captureWidget(page: Page, name: string): Promise<void> {
    const measured = await page.evaluate(() => {
        const host = document.getElementById('guiders-chat-widget');
        if (!host || !host.shadowRoot) return null;
        const candidates = [
            host.shadowRoot.querySelector('.guiders-chat-widget-root'),
            host.shadowRoot.querySelector('.chat-widget-fixed'),
            host.shadowRoot.querySelector('.chat-toggle-btn'),
            host.shadowRoot.firstElementChild as Element | null,
        ];
        let best: DOMRect | null = null;
        for (const el of candidates) {
            if (!el) continue;
            const r = (el as HTMLElement).getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                if (!best || r.width * r.height > best.width * best.height) best = r;
            }
        }
        if (!best) return null;
        return { x: best.x, y: best.y, width: best.width, height: best.height };
    });
    if (measured) {
        await safeShot(page, name, {
            x: measured.x - 30,
            y: measured.y - 30,
            width: measured.width + 60,
            height: measured.height + 60,
        });
        return;
    }
    await safeShot(page, name);
}

async function captureShadowEl(page: Page, selectorInsideShadow: string, name: string): Promise<void> {
    const measured = await page.evaluate((sel) => {
        const host = document.getElementById('guiders-chat-widget');
        if (!host?.shadowRoot) return null;
        const el = host.shadowRoot.querySelector(sel) as HTMLElement | null;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return null;
        return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, selectorInsideShadow);
    if (!measured) return;
    await safeShot(page, name, {
        x: measured.x - 10,
        y: measured.y - 10,
        width: measured.width + 20,
        height: measured.height + 20,
    });
}

const SAMPLE_MESSAGES = [
    { id: 'm1', chatId: 't', senderId: 'v1', senderType: 'visitor', content: 'Hola, ¿podéis ayudarme?', type: 'text', createdAt: new Date(Date.now() - 600000).toISOString(), readAt: new Date(Date.now() - 590000).toISOString() },
    { id: 'm2', chatId: 't', senderId: 'a1', senderType: 'commercial', content: '¡Hola! Claro, dime en qué puedo ayudarte 😊', type: 'text', createdAt: new Date(Date.now() - 540000).toISOString() },
    { id: 'm3', chatId: 't', senderId: 'v1', senderType: 'visitor', content: 'Quiero saber cuándo llega mi pedido #12345', type: 'text', createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: 'm4', chatId: 't', senderId: 'a1', senderType: 'commercial', content: 'Déjame consultar el estado en el sistema. Un momento, por favor.', type: 'text', createdAt: new Date(Date.now() - 240000).toISOString() },
    { id: 'm5', chatId: 't', senderId: 'a1', senderType: 'commercial', content: 'Tu pedido #12345 está en reparto y llegará hoy entre las 16:00 y las 19:00. El transportista es SEUR y el número de seguimiento es ABC123XYZ.', type: 'text', createdAt: new Date(Date.now() - 60000).toISOString() },
];

test.describe('UI review capture — desktop', () => {
    test.beforeEach(() => { requireDemo(); });
    test.use({ viewport: { width: 1280, height: 900 } });

    test('desktop — full UI state tour', async ({ page, context }) => {
        await unblockSdk(page);

        await safeShot(page, 'desktop-01-page-landing');
        await captureWidget(page, 'desktop-02-toggle-closed');

        const toggle = shadow(page, '.chat-toggle-btn').first();
        if (await toggle.count() > 0) {
            await toggle.hover();
            await page.waitForTimeout(300);
            await captureWidget(page, 'desktop-03-toggle-hover');
        }

        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(800);
        await captureWidget(page, 'desktop-04-chat-opened-initial');
        await safeShot(page, 'desktop-05-chat-opened-fullpage');

        await captureShadowEl(page, '.chat-header', 'desktop-06-chat-header');
        await captureShadowEl(page, '.chat-input, .chat-composer, [class*="composer"]', 'desktop-07-composer-empty');

        // Type into composer
        const input = shadow(page, 'textarea, input[type="text"]').first();
        if (await input.count() > 0) {
            await input.fill('Hola, necesito ayuda con mi pedido y quiero saber el estado del envío');
            await page.waitForTimeout(300);
            await captureShadowEl(page, '.chat-input, .chat-composer, [class*="composer"]', 'desktop-08-composer-with-text');
            await input.fill('');
        }

        await captureShadowEl(page, '.quick-actions, [class*="quick-action"]', 'desktop-09-quick-actions');

        // Inject test messages
        await page.evaluate((msgs) => {
            const sdk = (window as any).guiders;
            if (sdk?.chatUI?.renderChatMessages) {
                sdk.chatUI.renderChatMessages(msgs);
            }
        }, SAMPLE_MESSAGES);
        await page.waitForTimeout(600);
        await captureWidget(page, 'desktop-10-chat-with-messages');

        // Offline banner
        await context.setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await page.waitForTimeout(600);
        const banner = shadow(page, '.guiders-offline-banner').first();
        if (await banner.count() > 0) {
            await captureWidget(page, 'desktop-11-offline-banner');
        }
        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.waitForTimeout(400);

        await page.evaluate(() => (window as any).guiders.hideChat());
        await page.waitForTimeout(500);
        await captureWidget(page, 'desktop-12-toggle-after-close');
    });
});

test.describe('UI review capture — mobile', () => {
    test.beforeEach(() => { requireDemo(); });
    test.use({ viewport: { width: 375, height: 812 } });

    test('mobile — UI state tour', async ({ page, context }) => {
        await unblockSdk(page);

        await safeShot(page, 'mobile-01-page-landing');
        await captureWidget(page, 'mobile-02-toggle-closed');

        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(800);
        await safeShot(page, 'mobile-03-chat-opened-fullscreen');

        await page.evaluate((msgs) => {
            const sdk = (window as any).guiders;
            if (sdk?.chatUI?.renderChatMessages) {
                sdk.chatUI.renderChatMessages(msgs);
            }
        }, SAMPLE_MESSAGES.slice(0, 3));
        await page.waitForTimeout(500);
        await safeShot(page, 'mobile-04-chat-with-messages');

        const input = shadow(page, 'textarea, input[type="text"]').first();
        if (await input.count() > 0) {
            await input.fill('Quiero saber el estado de mi pedido');
            await page.waitForTimeout(300);
            await safeShot(page, 'mobile-05-composer-with-text');
            await input.fill('');
        }

        await page.evaluate(() => (window as any).guiders.hideChat());
        await page.waitForTimeout(400);
        await safeShot(page, 'mobile-06-toggle-after-close');
    });
});
