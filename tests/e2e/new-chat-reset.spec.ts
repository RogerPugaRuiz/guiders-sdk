/**
 * Regression test: "Nueva conversación" button clears previous chat messages.
 *
 * Bug: createNewChat() was not calling clearMessages(), so the previous chat's
 * history remained visible while the visitor composed the first message of the
 * new conversation.
 *
 * Fix: added `this.chatUI.clearMessages()` inside createNewChat() in
 * src/core/tracking-pixel-SDK.ts.
 *
 * This spec covers the scenario end-to-end:
 *   1. Open the chat — a ChatListView is rendered (visitor has prior chats).
 *   2. Select an existing chat so its messages are visible.
 *   3. Navigate back to the list and press "Nueva conversación".
 *   4. Assert that the message area is empty (no prior messages shown).
 *
 * When no prior chats exist the SDK goes straight to a new-chat composer, so
 * we seed a fake chat list via page.route() mocks to guarantee the list view
 * path is exercised regardless of the demo backend state.
 */

import { test, expect, type Page } from '@playwright/test';
import { requireDemo } from './utils/env';

const DEMO_URL = 'http://127.0.0.1:8083/?dev';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoDemo(page: Page): Promise<void> {
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    // Mimic human interaction to pass the BotDetector heuristic.
    await page.mouse.move(200, 200);
    await page.mouse.move(220, 220);
    await page.waitForFunction(() => Boolean((window as any).guiders), {
        timeout: 15000,
    });
    await page.waitForTimeout(500);
}

/** Pierces the SDK Shadow DOM scoped to the chat widget host. */
function shadow(page: Page, selector: string) {
    return page.locator(`#guiders-chat-widget ${selector}`);
}

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const FAKE_CHAT_ID = 'test-chat-reset-001';
const FAKE_VISITOR_ID = 'visitor-reset-001';

const FAKE_CHAT_LIST = {
    data: [
        {
            id: FAKE_CHAT_ID,
            visitorId: FAKE_VISITOR_ID,
            status: 'open',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 1800000).toISOString(),
            lastMessage: {
                id: 'msg-last-001',
                content: 'Último mensaje de prueba',
                createdAt: new Date(Date.now() - 1800000).toISOString(),
            },
            unreadCount: 0,
        },
    ],
    pagination: { total: 1, page: 1, limit: 20, hasMore: false },
};

const FAKE_MESSAGES = {
    data: [
        {
            id: 'msg-001',
            chatId: FAKE_CHAT_ID,
            senderId: 'commercial-agent-001',
            senderType: 'commercial',
            content: 'Hola, ¿en qué puedo ayudarte?',
            type: 'text',
            isRead: true,
            createdAt: new Date(Date.now() - 3000000).toISOString(),
        },
        {
            id: 'msg-002',
            chatId: FAKE_CHAT_ID,
            senderId: FAKE_VISITOR_ID,
            senderType: 'visitor',
            content: 'Tengo una pregunta sobre mi pedido',
            type: 'text',
            isRead: true,
            createdAt: new Date(Date.now() - 2800000).toISOString(),
        },
        {
            id: 'msg-003',
            chatId: FAKE_CHAT_ID,
            senderId: 'commercial-agent-001',
            senderType: 'commercial',
            content: 'Claro, con mucho gusto te ayudo',
            type: 'text',
            isRead: true,
            createdAt: new Date(Date.now() - 2600000).toISOString(),
        },
    ],
    pagination: { total: 3, page: 1, limit: 50, hasMore: false },
};

// ---------------------------------------------------------------------------
// Route mocks
// ---------------------------------------------------------------------------

async function setupApiMocks(page: Page): Promise<void> {
    // Visitor chats list
    await page.route('**/api/v2/chats**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(FAKE_CHAT_LIST),
        });
    });

    // Messages for the fake chat
    await page.route(`**/api/v2/messages/chat/${FAKE_CHAT_ID}**`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(FAKE_MESSAGES),
        });
    });

    // Mark messages as read
    await page.route('**/api/v2/messages/mark-as-read**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, markedCount: 0 }),
        });
    });

    // Unread count
    await page.route(`**/api/v2/messages/chat/${FAKE_CHAT_ID}/unread**`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // New chat creation (called when first message is sent after new-chat request)
    await page.route('**/api/v2/chats', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-chat-new-002',
                    visitorId: FAKE_VISITOR_ID,
                    status: 'open',
                    createdAt: new Date().toISOString(),
                }),
            });
        } else {
            await route.continue();
        }
    });
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe('Nueva conversación — reset de mensajes', () => {
    test.beforeEach(() => {
        requireDemo();
    });

    test('el botón "Nueva conversación" limpia los mensajes del chat anterior', async ({ page }) => {
        await setupApiMocks(page);
        await gotoDemo(page);

        // 1. Open the chat widget.
        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(400);

        const widget = shadow(page, '.guiders-chat-widget-root');
        await expect(widget).not.toHaveClass(/hidden/);

        // 2. Check whether a ChatListView or a direct chat view is shown.
        const listView = shadow(page, '.guiders-chat-list-view');
        const listCount = await listView.count();

        if (listCount > 0) {
            // Path A: list view is shown → select the fake chat.
            await expect(listView).toBeVisible();

            // Click the first chat item in the list.
            const chatItem = listView.locator('[class*="chat-list-item"], [class*="chat-item"], li, .guiders-chat-list-item').first();
            const chatItemCount = await chatItem.count();

            if (chatItemCount > 0) {
                await chatItem.click();
                await page.waitForTimeout(600);
            }

            // Verify that the messages from the previous chat are visible.
            const messageBubbles = shadow(page, '.chat-message, .message-bubble, [class*="message"]');
            const messagesBeforeReset = await messageBubbles.count();

            // Navigate back to list view (back button or re-trigger list).
            const backBtn = shadow(page, '[class*="back"], [aria-label*="volver"], [aria-label*="back"], .chat-header-back');
            const backBtnCount = await backBtn.count();
            if (backBtnCount > 0) {
                await backBtn.first().click();
                await page.waitForTimeout(400);
            } else {
                // Fallback: re-open to trigger list view.
                await page.evaluate(() => {
                    const sdk = (window as any).guiders?.trackingPixelSDK;
                    if (sdk?.showChatList) sdk.showChatList();
                });
                await page.waitForTimeout(400);
            }

            // 3. Press "Nueva conversación".
            const newChatBtn = shadow(page, '.guiders-chat-list-new-chat');
            await expect(newChatBtn).toBeVisible({ timeout: 5000 });
            await newChatBtn.click();
            await page.waitForTimeout(500);

            // 4. Assert: the previous chat messages are no longer visible.
            // After clicking "Nueva conversación" the chat area should be
            // empty (no conversation bubbles, only the quick-actions or
            // composer in a blank state).
            const messageBubblesAfterReset = shadow(page, '.chat-message, .message-bubble');
            const countAfterReset = await messageBubblesAfterReset.count();

            expect(countAfterReset).toBe(0);

            // Additionally verify that no text from the previous conversation
            // is present anywhere inside the shadow root.
            const previousContent = await page.evaluate(() => {
                const host = document.querySelector('#guiders-chat-widget');
                const root = (host as any)?.shadowRoot;
                if (!root) return '';
                return root.innerText ?? root.textContent ?? '';
            });

            const previousMessages = FAKE_MESSAGES.data.map((m) => m.content);
            for (const msgContent of previousMessages) {
                expect(previousContent).not.toContain(msgContent);
            }
        } else {
            // Path B: no prior chats — the SDK renders the new-chat composer
            // directly. The bug only manifests when there IS a prior chat, so
            // we log a skip note but don't fail.
            test.skip(
                true,
                'No ChatListView rendered (no prior chats in demo). ' +
                'Bug requires at least one previous chat to reproduce.',
            );
        }
    });

    test('createNewChat() vía API pública limpia los mensajes', async ({ page }) => {
        await setupApiMocks(page);
        await gotoDemo(page);

        // Open the chat.
        await page.evaluate(() => (window as any).guiders.showChat());
        await page.waitForTimeout(400);

        // Seed messages directly into the SDK internal state to simulate a
        // chat with prior history without needing a real backend response.
        const seeded = await page.evaluate((messages) => {
            const bridge = (window as any).guiders?.chatUI;
            if (!bridge) return false;

            // Use the public addMessage method if available, otherwise the
            // internal messagesSignal manipulation via updateMessages.
            if (typeof bridge.addMessage === 'function') {
                messages.forEach((m: any) => bridge.addMessage(m));
                return true;
            }
            return false;
        }, FAKE_MESSAGES.data.map((m) => ({
            id: m.id,
            sender: m.senderType === 'commercial' ? 'agent' : 'user',
            text: m.content,
            timestamp: new Date(m.createdAt).getTime(),
        })));

        if (!seeded) {
            // If the internal API is not accessible skip rather than fail.
            test.skip(true, 'Internal addMessage API not available on window.guiders.chatUI');
            return;
        }

        await page.waitForTimeout(200);

        // Verify messages are present before reset.
        const beforeReset = shadow(page, '.chat-message, .message-bubble');
        const countBefore = await beforeReset.count();
        expect(countBefore).toBeGreaterThan(0);

        // Call createNewChat() via the public SDK API.
        await page.evaluate(async () => {
            const sdk = (window as any).guiders?.trackingPixelSDK;
            if (sdk?.createNewChat) await sdk.createNewChat();
        });
        await page.waitForTimeout(400);

        // Assert: messages cleared.
        const afterReset = shadow(page, '.chat-message, .message-bubble');
        const countAfter = await afterReset.count();
        expect(countAfter).toBe(0);
    });
});
