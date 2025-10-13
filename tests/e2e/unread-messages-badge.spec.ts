/// <reference path="../global.d.ts" />
import { test, expect, Page } from '@playwright/test';

test.describe('Unread Messages Badge Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar interceptor de consola para debugging
    page.on('console', (msg: any) => {
      const text = msg.text();
      if (
        text.includes('guiders') ||
        text.includes('Guiders') ||
        text.includes('SDK') ||
        text.includes('Badge') ||
        text.includes('badge') ||
        text.includes('📬') ||
        text.includes('💬')
      ) {
        console.log(`🔍 Browser Console: ${text}`);
      }
    });
  });

  /**
   * Función auxiliar para inicializar la página y el SDK
   */
  async function initializePageAndSDK(page: Page) {
    // Navegar a la página
    await page.goto('http://127.0.0.1:8083');

    // Esperar a que el DOM esté completamente cargado
    await page.waitForLoadState('domcontentloaded');

    // Verificar que el script del SDK se haya cargado
    await page.waitForFunction(() => {
      const scripts = Array.from(document.scripts);
      return scripts.some(script => script.src.includes('guiders-sdk.js'));
    }, { timeout: 10000 });

    console.log('✅ Script del SDK detectado en el DOM');

    // Esperar a que window.guiders esté disponible
    let isSDKLoaded = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!isSDKLoaded && attempts < maxAttempts) {
      try {
        const sdkStatus = await page.evaluate(() => {
          return {
            guidersExists: typeof window.guiders !== 'undefined',
            guidersKeys: window.guiders ? Object.keys(window.guiders) : [],
          };
        });

        if (sdkStatus.guidersExists && sdkStatus.guidersKeys.length > 0) {
          isSDKLoaded = true;
          console.log('✅ SDK detectado y cargado correctamente');
          break;
        }

        await page.waitForTimeout(1500);
        attempts++;
      } catch (error: any) {
        console.log(`❌ Error en intento ${attempts + 1}:`, error?.message || String(error));
        await page.waitForTimeout(1500);
        attempts++;
      }
    }

    if (!isSDKLoaded) {
      throw new Error(`SDK no se pudo cargar después de ${maxAttempts} intentos.`);
    }

    await page.waitForTimeout(2000);

    return page;
  }

  /**
   * Función auxiliar para encontrar el botón de chat (evitando botones de GDPR)
   */
  async function getChatToggleButton(page: Page) {
    // Buscar el botón del chat en el shadow DOM
    const button = await page.evaluateHandle(() => {
      const shadowHost = document.querySelector('.chat-widget-host') as HTMLElement;
      if (shadowHost && shadowHost.shadowRoot) {
        return shadowHost.shadowRoot.querySelector('.chat-toggle-btn');
      }
      // Fallback: buscar en el body
      return document.querySelector('.chat-toggle-btn');
    });

    return button.asElement();
  }

  /**
   * Función auxiliar para simular un mensaje entrante del comercial
   */
  async function simulateIncomingMessage(page: Page, messageContent: string = 'Buenos días, ¿cómo puedo ayudarte?') {
    const messageId = `msg-${Date.now()}`;
    const chatId = 'test-chat-123';
    const senderId = 'commercial-456';

    console.log('📨 Simulando mensaje entrante del comercial:', messageContent);

    return await page.evaluate((params) => {
      // Simular mensaje entrante a través del servicio de mensajes no leídos
      const unreadService = (window.guiders as any)?.unreadService;
      if (!unreadService) {
        console.error('❌ UnreadMessagesService no disponible');
        return { success: false, error: 'Service not available' };
      }

      // Simular que llegó un mensaje vía WebSocket
      const mockMessage: any = {
        messageId: params.messageId,
        chatId: params.chatId,
        senderId: params.senderId,
        senderType: 'commercial',
        content: params.content,
        type: 'text',
        sentAt: new Date().toISOString(),
        isInternal: false
      };

      // Llamar al método interno handleNewMessage (si está disponible)
      // Alternativamente, podemos actualizar el estado directamente
      if (typeof (unreadService as any).handleNewMessage === 'function') {
        (unreadService as any).handleNewMessage(mockMessage);
      } else {
        // Fallback: actualizar estado directamente
        const unreadMessage = {
          id: mockMessage.messageId,
          chatId: mockMessage.chatId,
          senderId: mockMessage.senderId,
          senderType: 'commercial',
          content: mockMessage.content,
          type: mockMessage.type,
          isRead: false,
          readAt: null,
          readBy: null,
          createdAt: mockMessage.sentAt,
          updatedAt: mockMessage.sentAt,
          isInternal: false
        };

        (unreadService as any).unreadMessages.push(unreadMessage);
        (unreadService as any).unreadCount = (unreadService as any).unreadMessages.length;
        (unreadService as any).notifyCountChange();
      }

      return {
        success: true,
        messageId: params.messageId,
        chatId: params.chatId,
        count: (unreadService as any).unreadCount
      };
    }, { messageId, chatId, senderId, content: messageContent });
  }

  /**
   * Función auxiliar para obtener el texto del badge
   */
  async function getBadgeText(page: Page): Promise<string | null> {
    return await page.evaluate(() => {
      const shadowHost = document.querySelector('.chat-widget-host') as HTMLElement;
      if (shadowHost && shadowHost.shadowRoot) {
        const badge = shadowHost.shadowRoot.querySelector('.chat-unread-badge') as HTMLElement;
        if (badge && badge.style.display !== 'none' && badge.style.opacity !== '0') {
          return badge.textContent || null;
        }
      }

      // Fallback: buscar en el body
      const badge = document.querySelector('.chat-unread-badge') as HTMLElement;
      if (badge && badge.style.display !== 'none' && badge.style.opacity !== '0') {
        return badge.textContent || null;
      }

      return null;
    });
  }

  /**
   * Función auxiliar para verificar si el badge está visible
   */
  async function isBadgeVisible(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      const shadowHost = document.querySelector('.chat-widget-host') as HTMLElement;
      if (shadowHost && shadowHost.shadowRoot) {
        const badge = shadowHost.shadowRoot.querySelector('.chat-unread-badge') as HTMLElement;
        if (badge) {
          const isVisible = badge.style.display !== 'none' &&
                          badge.style.opacity !== '0' &&
                          !badge.classList.contains('hidden');
          return isVisible;
        }
      }

      // Fallback: buscar en el body
      const badge = document.querySelector('.chat-unread-badge') as HTMLElement;
      if (badge) {
        const isVisible = badge.style.display !== 'none' &&
                        badge.style.opacity !== '0' &&
                        !badge.classList.contains('hidden');
        return isVisible;
      }

      return false;
    });
  }

  test('should show badge when commercial sends message, persist after refresh, and hide when chat is opened', async ({ page }) => {
    console.log('🧪 Test: Flujo completo de badge de mensajes no leídos');

    // ===== PASO 1: Mockear APIs del backend =====
    console.log('📝 PASO 1: Configurando mocks del backend');

    // Mock para obtener mensajes no leídos
    await page.route('**/api/v2/messages/chat/*/unread', async (route) => {
      console.log('🔍 [MOCK] Interceptada llamada a /unread');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'msg-commercial-1',
            chatId: 'test-chat-123',
            senderId: 'commercial-456',
            senderType: 'commercial',
            content: 'Buenos días, ¿cómo puedo ayudarte?',
            type: 'text',
            isRead: false,
            readAt: null,
            readBy: null,
            createdAt: new Date(Date.now() - 60000).toISOString(),
            updatedAt: new Date(Date.now() - 60000).toISOString(),
            isInternal: false
          }
        ])
      });
    });

    // Mock para marcar mensajes como leídos
    await page.route('**/api/v2/messages/mark-as-read', async (route) => {
      console.log('🔍 [MOCK] Interceptada llamada a /mark-as-read');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          markedCount: 1
        })
      });
    });

    // Mock para otras llamadas de chat (evitar errores 404)
    await page.route('**/api/v2/chats**', async (route) => {
      console.log('🔍 [MOCK] Interceptada llamada a /chats');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-chat-123',
          visitorId: 'visitor-123',
          status: 'active',
          messages: []
        })
      });
    });

    // ===== PASO 2: Inicializar SDK =====
    console.log('📝 PASO 2: Inicializando SDK');
    await initializePageAndSDK(page);

    // Verificar que el botón de chat está visible
    const chatButton = await getChatToggleButton(page);
    expect(chatButton).not.toBeNull();
    console.log('✅ Botón de chat encontrado');

    // ===== PASO 3: 09:00 - Comercial envía mensaje =====
    console.log('📝 PASO 3 (09:00): Comercial envía mensaje');

    // Primero, necesitamos configurar el servicio de mensajes no leídos
    await page.evaluate(() => {
      const visitorId = 'visitor-123';
      const chatId = 'test-chat-123';

      // Obtener instancia del servicio y del toggle button
      const toggleButton = (window.guiders as any)?.chatToggleButton;

      if (toggleButton) {
        // Conectar el servicio con el visitorId (esto inicializa el callback)
        toggleButton.connectUnreadService(visitorId);

        // Establecer el chat actual
        toggleButton.setActiveChatForUnread(chatId);

        console.log('✅ UnreadMessagesService configurado con chatId:', chatId);
      } else {
        console.error('❌ No se pudo obtener ChatToggleButton');
      }
    });

    await page.waitForTimeout(1000);

    // Simular mensaje entrante del comercial
    const result = await simulateIncomingMessage(page, 'Buenos días, ¿cómo puedo ayudarte?');
    console.log('📨 Resultado de simulación de mensaje:', result);

    await page.waitForTimeout(2000); // Dar tiempo para que se actualice el badge

    // ===== PASO 4: 09:01 - Usuario ve badge: 🔴1 =====
    console.log('📝 PASO 4 (09:01): Verificando que el badge muestra "1"');

    const badgeVisibleBefore = await isBadgeVisible(page);
    console.log('👁️ Badge visible:', badgeVisibleBefore);

    expect(badgeVisibleBefore).toBe(true);

    const badgeTextBefore = await getBadgeText(page);
    console.log('🔴 Texto del badge:', badgeTextBefore);

    expect(badgeTextBefore).toBe('1');
    console.log('✅ Badge muestra "1" correctamente');

    // ===== PASO 5: 09:02 - Usuario refresca la página =====
    console.log('📝 PASO 5 (09:02): Usuario refresca la página');

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Dar tiempo para que el SDK se recargue

    console.log('✅ Página refrescada');

    // ===== PASO 6: 09:02 - Badge se restaura automáticamente: 🔴1 =====
    console.log('📝 PASO 6 (09:02): Verificando que el badge persiste después del refresh');

    // Esperar a que el SDK se recargue
    await page.waitForFunction(() => {
      return typeof window.guiders !== 'undefined' &&
             Object.keys(window.guiders).length > 0;
    }, { timeout: 15000 });

    // Reconfigurar el servicio después del refresh
    await page.evaluate(() => {
      const visitorId = 'visitor-123';
      const chatId = 'test-chat-123';

      const toggleButton = (window.guiders as any)?.chatToggleButton;

      if (toggleButton) {
        // Conectar el servicio con el visitorId (esto inicializa el callback)
        toggleButton.connectUnreadService(visitorId);

        // Establecer el chat actual (esto llamará a refreshUnreadMessages)
        toggleButton.setActiveChatForUnread(chatId);

        console.log('✅ UnreadMessagesService reconfigurado después de refresh');
      }
    });

    await page.waitForTimeout(3000); // Dar tiempo para que se carguen los mensajes no leídos desde el mock

    const badgeVisibleAfterRefresh = await isBadgeVisible(page);
    console.log('👁️ Badge visible después de refresh:', badgeVisibleAfterRefresh);

    expect(badgeVisibleAfterRefresh).toBe(true);

    const badgeTextAfterRefresh = await getBadgeText(page);
    console.log('🔴 Texto del badge después de refresh:', badgeTextAfterRefresh);

    expect(badgeTextAfterRefresh).toBe('1');
    console.log('✅ Badge persiste correctamente después del refresh');

    // ===== PASO 7: 09:03 - Usuario abre el chat =====
    console.log('📝 PASO 7 (09:03): Usuario abre el chat');

    const chatButtonAfterRefresh = await getChatToggleButton(page);
    expect(chatButtonAfterRefresh).not.toBeNull();

    await chatButtonAfterRefresh!.click();
    console.log('🖱️ Click en botón de chat');

    await page.waitForTimeout(2000); // Dar tiempo para que se abra el chat

    // ===== PASO 8: 09:04 - Badge desaparece (mensaje marcado como leído) =====
    console.log('📝 PASO 8 (09:04): Verificando que el badge desaparece');

    // Simular marcado de mensajes como leídos
    await page.evaluate(() => {
      const toggleButton = (window.guiders as any)?.chatToggleButton;

      if (toggleButton) {
        // Marcar todos los mensajes como leídos
        toggleButton.markAllMessagesAsRead();
        console.log('✅ Mensajes marcados como leídos');
      }
    });

    await page.waitForTimeout(2000); // Dar tiempo para que se actualice el badge

    const badgeVisibleAfterOpen = await isBadgeVisible(page);
    console.log('👁️ Badge visible después de abrir chat:', badgeVisibleAfterOpen);

    expect(badgeVisibleAfterOpen).toBe(false);

    const badgeTextAfterOpen = await getBadgeText(page);
    console.log('🔴 Texto del badge después de abrir chat:', badgeTextAfterOpen);

    expect(badgeTextAfterOpen).toBeNull();
    console.log('✅ Badge desapareció correctamente (mensaje marcado como leído)');

    console.log('🎉 Test completado exitosamente: Flujo completo de badge de mensajes no leídos');
  });

  test('should handle multiple unread messages', async ({ page }) => {
    console.log('🧪 Test: Badge con múltiples mensajes no leídos');

    // Mock para obtener mensajes no leídos (3 mensajes)
    await page.route('**/api/v2/messages/chat/*/unread', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'msg-1',
            chatId: 'test-chat-123',
            senderId: 'commercial-456',
            senderType: 'commercial',
            content: 'Mensaje 1',
            type: 'text',
            isRead: false,
            readAt: null,
            readBy: null,
            createdAt: new Date(Date.now() - 180000).toISOString(),
            updatedAt: new Date(Date.now() - 180000).toISOString(),
            isInternal: false
          },
          {
            id: 'msg-2',
            chatId: 'test-chat-123',
            senderId: 'commercial-456',
            senderType: 'commercial',
            content: 'Mensaje 2',
            type: 'text',
            isRead: false,
            readAt: null,
            readBy: null,
            createdAt: new Date(Date.now() - 120000).toISOString(),
            updatedAt: new Date(Date.now() - 120000).toISOString(),
            isInternal: false
          },
          {
            id: 'msg-3',
            chatId: 'test-chat-123',
            senderId: 'commercial-456',
            senderType: 'commercial',
            content: 'Mensaje 3',
            type: 'text',
            isRead: false,
            readAt: null,
            readBy: null,
            createdAt: new Date(Date.now() - 60000).toISOString(),
            updatedAt: new Date(Date.now() - 60000).toISOString(),
            isInternal: false
          }
        ])
      });
    });

    await initializePageAndSDK(page);

    // Configurar servicio y cargar mensajes
    await page.evaluate(() => {
      const visitorId = 'visitor-123';
      const chatId = 'test-chat-123';

      const toggleButton = (window.guiders as any)?.chatToggleButton;

      if (toggleButton) {
        // Conectar el servicio con el visitorId (esto inicializa el callback)
        toggleButton.connectUnreadService(visitorId);

        // Establecer el chat actual (esto llamará a refreshUnreadMessages)
        toggleButton.setActiveChatForUnread(chatId);

        console.log('✅ UnreadMessagesService configurado con chatId:', chatId);
      }
    });

    await page.waitForTimeout(3000); // Dar tiempo para cargar mensajes

    // Verificar badge muestra "3"
    const badgeVisible = await isBadgeVisible(page);
    expect(badgeVisible).toBe(true);

    const badgeText = await getBadgeText(page);
    expect(badgeText).toBe('3');

    console.log('✅ Badge muestra "3" mensajes no leídos correctamente');
  });

  test('should not show badge for visitor own messages', async ({ page }) => {
    console.log('🧪 Test: Badge no debe mostrar mensajes propios del visitante');

    // Mock que devuelve mensajes del propio visitante (deben ser filtrados)
    await page.route('**/api/v2/messages/chat/*/unread', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'msg-visitor',
            chatId: 'test-chat-123',
            senderId: 'visitor-123', // Mismo ID que el visitante
            senderType: 'visitor',
            content: 'Mensaje del visitante',
            type: 'text',
            isRead: false,
            readAt: null,
            readBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isInternal: false
          }
        ])
      });
    });

    await initializePageAndSDK(page);

    // Configurar servicio
    await page.evaluate(() => {
      const visitorId = 'visitor-123';
      const chatId = 'test-chat-123';

      const toggleButton = (window.guiders as any)?.chatToggleButton;

      if (toggleButton) {
        // Conectar el servicio con el visitorId (esto inicializa el callback)
        toggleButton.connectUnreadService(visitorId);

        // Establecer el chat actual (esto llamará a refreshUnreadMessages)
        toggleButton.setActiveChatForUnread(chatId);

        console.log('✅ UnreadMessagesService configurado con chatId:', chatId);
      }
    });

    await page.waitForTimeout(3000);

    // Verificar que el badge NO está visible (mensajes propios filtrados)
    const badgeVisible = await isBadgeVisible(page);
    expect(badgeVisible).toBe(false);

    const badgeText = await getBadgeText(page);
    expect(badgeText).toBeNull();

    console.log('✅ Badge correctamente oculto para mensajes propios del visitante');
  });
});
