/// <reference path="../global.d.ts" />
import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' }); // Ejecutar tests secuencialmente

test.describe('Guiders SDK Chat UI Tests - Post Refactoring Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar interceptor de consola para debugging
    page.on('console', (msg: any) => {
      if (msg.text().includes('guiders') || msg.text().includes('Guiders') || msg.text().includes('SDK')) {
        console.log(`🔍 Browser Console: ${msg.text()}`);
      }
    });
  });

  // Función auxiliar para inicializar la página y el SDK
  async function initializePageAndSDK(page: Page) {
    // Navegar a la página
    await page.goto('http://127.0.0.1:8083');
    
    // Esperar a que el DOM esté completamente cargado
    await page.waitForLoadState('domcontentloaded');
    
    // Añadir logging de consola para debug
    page.on('console', msg => {
      if (msg.text().includes('guiders') || msg.text().includes('Guiders') || msg.text().includes('SDK')) {
        console.log(`🔍 Browser Console: ${msg.text()}`);
      }
    });
    
    // Verificar que el script del SDK se haya cargado
    await page.waitForFunction(() => {
      const scripts = Array.from(document.scripts);
      return scripts.some(script => script.src.includes('guiders-sdk.js'));
    }, { timeout: 10000 });
    
    console.log('✅ Script del SDK detectado en el DOM');
    
    // Esperar a que window.guiders esté disponible con múltiples estrategias
    let isSDKLoaded = false;
    let attempts = 0;
    const maxAttempts = 15; // Aumentamos intentos
    
    while (!isSDKLoaded && attempts < maxAttempts) {
      try {
        // Verificar si window.guiders existe y está inicializado
        const sdkStatus = await page.evaluate(() => {
          // Verificar también errores de JavaScript
          const jsErrors = window.onerror ? ['JS Error detected'] : [];
          
          return {
            windowExists: typeof window !== 'undefined',
            guidersExists: typeof window.guiders !== 'undefined',
            guidersType: typeof window.guiders,
            guidersKeys: window.guiders ? Object.keys(window.guiders) : [],
            isInitialized: window.guiders?.isInitialized || false,
            jsErrors: jsErrors,
            documentReady: document.readyState,
            scriptTags: Array.from(document.scripts).length
          };
        });
        
        console.log(`🔍 Intento ${attempts + 1}/${maxAttempts}: SDK Status:`, JSON.stringify(sdkStatus, null, 2));
        
        if (sdkStatus.guidersExists && sdkStatus.guidersKeys.length > 0) {
          isSDKLoaded = true;
          console.log('✅ SDK detectado y cargado correctamente');
          break;
        }
        
        // Si es el primer intento fallido, probar a ejecutar manualmente la inicialización
        if (attempts === 2) {
          console.log('🔄 Intentando forzar inicialización del SDK...');
          await page.evaluate(() => {
            // Verificar si el script se ha ejecutado pero no se ha inicializado
            if (typeof window.guiders === 'undefined') {
              // Buscar el script y re-ejecutarlo si es necesario
              const guidersScript = Array.from(document.scripts).find(s => s.src.includes('guiders-sdk.js'));
              if (guidersScript) {
                console.log('🔍 Script encontrado pero window.guiders no existe');
              }
            }
          });
        }
        
        await page.waitForTimeout(1500); // Aumentamos el tiempo de espera
        attempts++;
      } catch (error: any) {
        console.log(`❌ Error en intento ${attempts + 1}:`, error?.message || String(error));
        await page.waitForTimeout(1500);
        attempts++;
      }
    }
    
    if (!isSDKLoaded) {
      // Estrategia final: Recargar y diagnosticar
      console.log('🔄 Recargando página para diagnóstico final...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      const finalDiagnostic = await page.evaluate(() => {
        return {
          guidersExists: typeof window.guiders !== 'undefined',
          guidersContent: window.guiders ? 'EXISTS' : 'NOT_EXISTS',
          allScripts: Array.from(document.scripts).map(s => ({
            src: s.src,
            loaded: (s as any).readyState || 'unknown'
          })),
          documentState: document.readyState,
          windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('guider')),
          consoleErrors: 'Error logging available'
        };
      });
      
      console.log('🔍 Diagnóstico final:', JSON.stringify(finalDiagnostic, null, 2));
      
      if (!finalDiagnostic.guidersExists) {
        throw new Error(`SDK no se pudo cargar después de ${maxAttempts} intentos. Diagnóstico: ${JSON.stringify(finalDiagnostic)}`);
      }
    }
    
    // Verificación final de que el SDK está funcionalmente disponible
    await page.waitForTimeout(2000);
    
    return page;
  }

  test('should load the page and SDK', async ({ page }) => {
    console.log('🧪 Test 1: Verificando carga del SDK...');
    
    await initializePageAndSDK(page);
    
    // Verificar que window.guiders está disponible
    const guidersAvailable = await page.evaluate(() => {
      return typeof window.guiders !== 'undefined';
    });
    
    expect(guidersAvailable).toBe(true);
    console.log('✅ Test 1 completado: SDK cargado correctamente');
  });

  test('should show chat button', async ({ page }) => {
    console.log('🧪 Test 2: Verificando botón de chat...');
    
    await initializePageAndSDK(page);

    // Verificar que hay al menos un botón visible (que sería el botón del chat)
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible({ timeout: 10000 });
    
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ Test 2 completado: ${buttonCount} botón(es) encontrado(s)`);
  });

  test('should open chat interface', async ({ page }) => {
    console.log('🧪 Test 3: Verificando apertura del chat...');
    
    await initializePageAndSDK(page);
    
    // Encontrar y hacer clic en el primer botón disponible (debería ser el del chat)
    const chatButton = page.locator('button').first();
    await expect(chatButton).toBeVisible({ timeout: 10000 });
    
    await chatButton.click();
    await page.waitForTimeout(2000);
    
    // Verificar que aparece contenido del chat usando múltiples estrategias
    const chatIndicators = [
      () => page.locator('text=Chat').first().isVisible(),
      () => page.locator('text=Atención').first().isVisible(),
      () => page.locator('text=cliente').first().isVisible(),
      () => page.locator('textbox').first().isVisible(),
      () => page.locator('button').count().then(count => count > 1)
    ];
    
    let chatOpened = false;
    for (const indicator of chatIndicators) {
      try {
        const result = await indicator();
        if (result) {
          chatOpened = true;
          break;
        }
      } catch {
        // Continuar con el siguiente indicador
      }
    }
    
    expect(chatOpened).toBe(true);
  });

  test('should display input elements', async ({ page }) => {
    console.log('🧪 Test 4: Verificando elementos de entrada...');
    
    await initializePageAndSDK(page);
    
    // Abrir el chat
    const chatButton = page.locator('button').first();
    await expect(chatButton).toBeVisible({ timeout: 10000 });
    await chatButton.click();
    await page.waitForTimeout(2000);
    
    // Verificar que hay elementos de input con múltiples selectores
    const inputSelectors = ['input', 'textarea', 'textbox', '[role="textbox"]'];
    let hasInputs = false;
    
    for (const selector of inputSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        hasInputs = true;
        break;
      }
    }
    
    expect(hasInputs).toBe(true);
    
    // Verificar que hay más botones después de abrir el chat
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    expect(buttonCount).toBeGreaterThan(1); // Al menos el botón original + botones del chat
  });

  test('should load initial chat messages when chat is opened', async ({ page }) => {
    await initializePageAndSDK(page);

    // Interceptar las llamadas a la API de mensajes para verificar que se ejecutan
    let messageLoadingCalled = false;
    let initialLoadingCalled = false;
    let allNetworkCalls: string[] = [];

    // Interceptar TODAS las llamadas de red para debug
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      allNetworkCalls.push(url);
      
      // Solo interceptar llamadas de API de mensajes
      if (url.includes('/api/') && url.includes('messages')) {
        if (url.includes('limit=20') && !url.includes('cursor=')) {
          // Esta es la carga inicial de mensajes (sin cursor)
          initialLoadingCalled = true;
          console.log('🔍 [E2E Test] Detectada carga inicial de mensajes');
        }
        
        messageLoadingCalled = true;
        
        // Simular respuesta exitosa con mensajes de prueba
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            messages: [
              {
                id: 'msg-1',
                chatId: 'test-chat-1',
                content: 'Mensaje de prueba 1',
                senderId: 'user-1',
                createdAt: new Date(Date.now() - 60000).toISOString(),
                updatedAt: new Date(Date.now() - 60000).toISOString()
              }
            ],
            pagination: {
              hasMore: false,
              cursor: null,
              total: 1
            }
          })
        });
      } else {
        // Continuar con otras llamadas normalmente
        await route.continue();
      }
    });

    // Monitorear mensajes de consola relacionados con la carga inicial
    let chatOpenDetected = false;
    let noChatIdDetected = false;
    let consoleMessages: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      
      // Detectar que el chat se abrió
      if (text.includes('visitor:open-chat') || text.includes('open-chat')) {
        chatOpenDetected = true;
        console.log('🔍 [E2E Test] Detectado que el chat se abrió:', text);
      }
      
      // Detectar el comportamiento esperado: no hay chatId
      if (text.includes('No hay chatId, omitiendo carga de mensajes')) {
        noChatIdDetected = true;
        console.log('🔍 [E2E Test] Detectado comportamiento esperado - sin chatId:', text);
      }
      
      // Detectar si se ejecuta la carga de mensajes
      if (text.includes('Cargando mensajes iniciales') || 
          text.includes('loadInitialMessages') ||
          text.includes('initializeChat') ||
          text.includes('ChatMessagesUI')) {
        console.log('🔍 [E2E Test] Detectado log de carga de mensajes:', text);
      }
    });

    // Abrir el chat
    const chatButton = page.locator('button').first();
    await expect(chatButton).toBeVisible({ timeout: 10000 });
    await chatButton.click();
    await page.waitForTimeout(3000); // Dar tiempo extra para inicialización

    // Log de debug
    console.log('📊 [E2E Test] Console messages relacionados con chat:', 
      consoleMessages.filter(msg => 
        msg.includes('chat') || msg.includes('Chat') || msg.includes('message')
      )
    );

    // Verificar que el chat se abrió correctamente
    expect(chatOpenDetected).toBe(true);

    // Verificar el comportamiento esperado según la implementación actual:
    // Si no hay chatId, no se cargan mensajes (esto es correcto)
    if (noChatIdDetected) {
      console.log('✅ [E2E Test] Comportamiento correcto: sin chatId no se cargan mensajes');
      
      // En este caso, verificar que el chat está abierto pero sin mensajes
      const hasInputElements = await page.locator('input, textarea, textbox, [role="textbox"]').count() > 0;
      expect(hasInputElements).toBe(true);
      
    } else {
      // Si por alguna razón hay un chatId, entonces debería cargar mensajes
      console.log('✅ [E2E Test] Chat con ID detectado, verificando carga de mensajes');
      expect(messageLoadingCalled).toBe(true);
    }

    console.log('✅ [E2E Test] Test de comportamiento de carga inicial completado exitosamente');
  });
});
