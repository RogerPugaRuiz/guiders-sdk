import { test, expect } from '@playwright/test';

test.describe('Event Queue TTL & Payload Limits', () => {
  test.beforeEach(async ({ page }) => {
    // Cargar página de test
    await page.goto('http://127.0.0.1:8083/test-ttl-limits.html');
    
    // Esperar a que el SDK esté cargado
    await page.waitForFunction(() => {
      return typeof window['TrackingPixelSDK'] !== 'undefined';
    }, { timeout: 5000 });
    
    // Limpiar estado previo
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Recargar página para tener estado limpio
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should initialize with correct default configuration', async ({ page }) => {
    // Verificar que las estadísticas muestran los valores por defecto correctos
    const statsText = await page.locator('#stats').textContent();
    
    expect(statsText).toContain('1000'); // maxQueueSize
    expect(statsText).toContain('24 horas'); // TTL
    expect(statsText).toContain('0 / 1000'); // Cola vacía al inicio
  });

  test('should enqueue events correctly', async ({ page }) => {
    // Generar 10 eventos
    await page.click('button:has-text("➕ Generar 10 Eventos")');
    
    // Esperar a que se actualicen las estadísticas
    await page.waitForTimeout(1000);
    
    // Verificar que la cola contiene 10 eventos
    const statsText = await page.locator('#stats').textContent();
    expect(statsText).toContain('10 / 1000');
  });

  test('should respect maxQueueSize limit', async ({ page }) => {
    // Generar 1000 eventos (el máximo)
    await page.click('button:has-text("🚨 Generar 1000 Eventos")');
    
    // Esperar procesamiento
    await page.waitForTimeout(2000);
    
    // Verificar que no excede el límite
    const stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    
    expect(stats.size).toBeLessThanOrEqual(1000);
  });

  test('should prune expired events (TTL)', async ({ page }) => {
    // Generar eventos expirados (48 horas atrás)
    await page.click('button:has-text("🚨 100 eventos de hace 48 horas")');
    
    // Esperar a que se generen
    await page.waitForTimeout(1500);
    
    // Verificar que fueron encolados
    let stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    expect(stats.size).toBe(100);
    
    // Hacer flush (debería ejecutar pruning)
    await page.click('button:has-text("🚀 Flush Manual")');
    await page.waitForTimeout(2000);
    
    // Verificar que los eventos expirados fueron eliminados
    stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    
    // Después del flush y pruning, debería haber 0 eventos (todos expirados)
    expect(stats.size).toBe(0);
  });

  test('should show oldest event age in stats', async ({ page }) => {
    // Generar eventos de hace 12 horas
    await page.click('button:has-text("⏰ 10 eventos de hace 12 horas")');
    
    // Esperar procesamiento
    await page.waitForTimeout(1500);
    
    // Verificar estadísticas
    const stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    
    expect(stats.oldestEventAgeHours).toBeDefined();
    expect(stats.oldestEventAgeHours).toBeGreaterThan(11);
    expect(stats.oldestEventAgeHours).toBeLessThan(13);
  });

  test('should handle large payloads with trimming', async ({ page }) => {
    // Escuchar requests de red
    const requests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/tracking-v2/events')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    // Generar eventos grandes que excedan 1MB
    await page.click('button:has-text("🚨 50 eventos grandes")');
    await page.waitForTimeout(2000);
    
    // Hacer flush
    await page.click('button:has-text("🚀 Flush Manual")');
    await page.waitForTimeout(3000);
    
    // Verificar que se hicieron múltiples requests (multi-request fallback)
    // O que el payload fue recortado
    const logs = await page.evaluate(() => {
      return (window as any).logs.map((l: any) => l.message);
    });
    
    const hasTrimming = logs.some((log: string) => 
      log.includes('Payload recortado') || log.includes('Multi-request')
    );
    
    expect(hasTrimming).toBeTruthy();
  });

  test('should persist queue to localStorage', async ({ page }) => {
    // Generar eventos
    await page.click('button:has-text("➕ Generar 50 Eventos")');
    await page.waitForTimeout(1000);
    
    // Verificar localStorage
    const storageData = await page.evaluate(() => {
      const data = localStorage.getItem('guiders_tracking_queue');
      return data ? JSON.parse(data) : null;
    });
    
    expect(storageData).toBeTruthy();
    expect(storageData.events).toHaveLength(50);
  });

  test('should load queue from localStorage on page reload', async ({ page }) => {
    // Generar eventos
    await page.click('button:has-text("➕ Generar 25 Eventos")');
    await page.waitForTimeout(1000);
    
    // Recargar página
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Verificar que los eventos se cargaron
    const stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    
    expect(stats.size).toBe(25);
  });

  test('should clear queue correctly', async ({ page }) => {
    // Generar eventos
    await page.click('button:has-text("➕ Generar 100 Eventos")');
    await page.waitForTimeout(1000);
    
    // Verificar que hay eventos
    let stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    expect(stats.size).toBe(100);
    
    // Limpiar cola
    await page.click('button:has-text("🗑️ Vaciar Cola")');
    await page.waitForTimeout(500);
    
    // Verificar que está vacía
    stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    expect(stats.size).toBe(0);
  });

  test('should log verbose statistics during flush', async ({ page }) => {
    // Generar algunos eventos
    await page.click('button:has-text("➕ Generar 50 Eventos")');
    await page.waitForTimeout(1000);
    
    // Hacer flush
    await page.click('button:has-text("🚀 Flush Manual")');
    await page.waitForTimeout(2000);
    
    // Verificar logs
    const logs = await page.evaluate(() => {
      return (window as any).logs.map((l: any) => l.message);
    });
    
    // Buscar log de estadísticas
    const statsLog = logs.find((log: string) => 
      log.includes('📊 Estadísticas de cola')
    );
    
    expect(statsLog).toBeTruthy();
    
    // Verificar que incluye métricas importantes
    const allLogs = logs.join('\n');
    expect(allLogs).toContain('queueSize');
    expect(allLogs).toContain('ttlHours');
  });

  test('should handle mixed old and new events', async ({ page }) => {
    // Generar eventos nuevos
    await page.click('button:has-text("➕ Generar 50 Eventos")');
    await page.waitForTimeout(1000);
    
    // Generar eventos expirados
    await page.click('button:has-text("🚨 50 eventos de hace 48 horas")');
    await page.waitForTimeout(1500);
    
    // Verificar que hay 100 eventos totales
    let stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    expect(stats.size).toBe(100);
    
    // Hacer flush (debería eliminar solo los expirados)
    await page.click('button:has-text("🚀 Flush Manual")');
    await page.waitForTimeout(2000);
    
    // Verificar que quedaron solo los eventos nuevos (~50)
    stats = await page.evaluate(() => {
      return (window as any).sdk.eventQueueManager.getStats();
    });
    
    // Debería quedar algo cercano a 50 (los eventos nuevos)
    // Pueden ser menos si algunos fueron enviados exitosamente
    expect(stats.size).toBeLessThanOrEqual(50);
  });
});
