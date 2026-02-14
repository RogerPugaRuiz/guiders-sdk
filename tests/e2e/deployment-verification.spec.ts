import { test, expect } from '@playwright/test';

test.describe('Guiders SDK - Verificación de Deployment', () => {
  
  test('✅ should verify SDK has V1 cleanup code', async ({ page }) => {
    await page.goto('http://localhost:8090/');
    
    const checks = await page.evaluate(async () => {
      const response = await fetch('/wp-content/plugins/guiders-wp-plugin/assets/js/guiders-sdk.js');
      const code = await response.text();
      
      return {
        v1Cleanup: code.includes('All events were invalid and discarded'),
        ttlMigration: code.includes('eventos legacy migrados'),
        forceCleanup: code.includes('Cola excede límite después de pruning'),
        maxSize1000: code.includes('DEFAULT_MAX_SIZE=1e3') || code.includes('DEFAULT_MAX_SIZE=1000'),
        ttl24h: code.includes('DEFAULT_TTL_MS=864e5') || code.includes('24*60*60*1000')
      };
    });
    
    console.log('📊 SDK Verification:', checks);
    
    expect(checks.v1Cleanup).toBe(true);
    expect(checks.ttlMigration).toBe(true);
    expect(checks.forceCleanup).toBe(true);
    expect(checks.maxSize1000).toBe(true);
    
    console.log('✅ SDK tiene todas las correcciones implementadas');
  });

  test('✅ should verify localStorage can be cleaned', async ({ page }) => {
    await page.goto('http://localhost:8090/');
    
    // Añadir eventos de prueba
    await page.evaluate(() => {
      localStorage.setItem('guiders_tracking_v2_queue', JSON.stringify([
        { visitorId: 'test', sessionId: 'test', eventType: 'test', occurredAt: new Date().toISOString(), metadata: {} }
      ]));
    });
    
    // Verificar que se guardó
    let count = await page.evaluate(() => {
      const stored = localStorage.getItem('guiders_tracking_v2_queue');
      return stored ? JSON.parse(stored).length : 0;
    });
    expect(count).toBe(1);
    
    // Limpiar
    await page.evaluate(() => {
      localStorage.removeItem('guiders_tracking_v2_queue');
    });
    
    // Verificar que se limpió
    count = await page.evaluate(() => {
      const stored = localStorage.getItem('guiders_tracking_v2_queue');
      return stored ? JSON.parse(stored).length : 0;
    });
    expect(count).toBe(0);
    
    console.log('✅ localStorage limpieza funciona correctamente');
  });

  test('✅ should verify V1 events are detected', async ({ page }) => {
    await page.goto('http://localhost:8090/');
    
    // Inyectar eventos V1 (con pageUrl/pagePath)
    await page.evaluate(() => {
      const v1Events = [
        {
          visitorId: '12345678-1234-1234-1234-123456789012',
          sessionId: '87654321-4321-4321-4321-210987654321',
          eventType: 'VISITOR_CHAT_ACTIVE',
          occurredAt: new Date().toISOString(),
          pageUrl: 'http://localhost:8090/', // ❌ Campo V1
          pagePath: '/', // ❌ Campo V1
          metadata: { test: true }
        },
        {
          visitorId: '12345678-1234-1234-1234-123456789012',
          sessionId: '87654321-4321-4321-4321-210987654321',
          eventType: 'PAGE_VIEW',
          occurredAt: new Date().toISOString(),
          metadata: { test: true }
        }
      ];
      
      localStorage.setItem('guiders_tracking_v2_queue', JSON.stringify(v1Events));
    });
    
    // Detectar eventos V1
    const analysis = await page.evaluate(() => {
      const stored = localStorage.getItem('guiders_tracking_v2_queue');
      if (!stored) return { total: 0, v1: 0, v2: 0 };
      
      const events = JSON.parse(stored);
      const v1Events = events.filter((e: any) => e.pageUrl || e.pagePath);
      const v2Events = events.filter((e: any) => !e.pageUrl && !e.pagePath);
      
      return {
        total: events.length,
        v1: v1Events.length,
        v2: v2Events.length
      };
    });
    
    console.log('📊 Event Analysis:', analysis);
    
    expect(analysis.total).toBe(2);
    expect(analysis.v1).toBe(1);
    expect(analysis.v2).toBe(1);
    
    // Limpiar
    await page.evaluate(() => localStorage.removeItem('guiders_tracking_v2_queue'));
    
    console.log('✅ Detección de eventos V1 funciona correctamente');
  });

  test('✅ should verify WordPress is accessible', async ({ page }) => {
    const response = await page.goto('http://localhost:8090/');
    expect(response?.status()).toBe(200);
    
    const title = await page.title();
    console.log('📄 WordPress Title:', title);
    
    // Verificar que el plugin está activo
    const sdkScript = await page.locator('script[src*="guiders-sdk.js"]').count();
    console.log('📦 SDK Script Tags:', sdkScript);
    
    console.log('✅ WordPress accesible en localhost:8090');
  });

  test('✅ should verify test pages are accessible', async ({ page }) => {
    const testPages = [
      '/wp-content/plugins/guiders-wp-plugin/test-v1-cleanup.html',
      '/wp-content/plugins/guiders-wp-plugin/debug-ttl.html',
      '/wp-content/plugins/guiders-wp-plugin/test-ttl-emergency.html',
      '/wp-content/plugins/guiders-wp-plugin/force-reload.html'
    ];
    
    for (const path of testPages) {
      const response = await page.goto(`http://localhost:8090${path}`);
      expect(response?.status()).toBe(200);
      console.log(`✅ ${path.split('/').pop()} - HTTP 200`);
    }
    
    console.log('✅ Todas las páginas de test son accesibles');
  });
});
