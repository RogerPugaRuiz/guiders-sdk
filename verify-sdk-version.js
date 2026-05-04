// ═══════════════════════════════════════════════════════════════════════
// 🔍 SCRIPT DE VERIFICACIÓN AUTOMÁTICA - SDK VERSIÓN NUEVA
// ═══════════════════════════════════════════════════════════════════════
// Copia y pega este script completo en la consola de DevTools (F12)
// en cualquier página de http://localhost:8090/
// ═══════════════════════════════════════════════════════════════════════

(async function verifySDKVersion() {
  console.log('%c╔══════════════════════════════════════════════════════════════╗', 'color: #0073aa; font-weight: bold');
  console.log('%c║     🔍 VERIFICACIÓN DE VERSIÓN DEL SDK - Guiders v1.6.0     ║', 'color: #0073aa; font-weight: bold');
  console.log('%c╚══════════════════════════════════════════════════════════════╝', 'color: #0073aa; font-weight: bold');
  console.log('');

  let passedTests = 0;
  let totalTests = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 1: Verificar timestamp y tamaño del archivo
  // ═══════════════════════════════════════════════════════════════════════
  console.log('%c━━━ TEST 1: Verificar Archivo SDK ━━━', 'color: #46b450; font-weight: bold');
  totalTests++;

  try {
    const response = await fetch('/wp-content/plugins/guiders-wp-plugin/assets/js/guiders-sdk.js', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    const lastModified = response.headers.get('last-modified');
    const contentLength = parseInt(response.headers.get('content-length'));
    const sizeKB = (contentLength / 1024).toFixed(2);
    
    console.log('📅 Última modificación:', lastModified);
    console.log('📦 Tamaño:', sizeKB, 'KB');
    
    // Verificar que sea la versión correcta (≈494 KB)
    if (contentLength > 500000 && contentLength < 510000) {
      console.log('%c✅ PASS: Tamaño correcto (~494 KB)', 'color: #46b450; font-weight: bold');
      passedTests++;
    } else {
      console.log('%c❌ FAIL: Tamaño incorrecto (esperado: ~494 KB)', 'color: #dc3232; font-weight: bold');
    }
  } catch (error) {
    console.log('%c❌ FAIL: Error al verificar archivo', 'color: #dc3232; font-weight: bold', error);
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 2: Verificar funciones nuevas en el código
  // ═══════════════════════════════════════════════════════════════════════
  console.log('%c━━━ TEST 2: Verificar Funciones Nuevas ━━━', 'color: #46b450; font-weight: bold');
  totalTests++;

  try {
    const response = await fetch('/wp-content/plugins/guiders-wp-plugin/assets/js/guiders-sdk.js', {
      cache: 'no-cache'
    });
    const code = await response.text();
    
    const requiredFunctions = {
      'pruneExpiredEvents': code.includes('pruneExpiredEvents'),
      'estimatePayloadSize': code.includes('estimatePayloadSize'),
      'trimEventsToFitPayload': code.includes('trimEventsToFitPayload'),
      'sendBatchMultiRequest': code.includes('sendBatchMultiRequest'),
      'DEFAULT_TTL_MS': code.includes('DEFAULT_TTL_MS'),
      'eventTtlMs': code.includes('eventTtlMs'),
      'maxPayloadSizeBytes': code.includes('maxPayloadSizeBytes'),
      'getOldestEventAge': code.includes('getOldestEventAge')
    };
    
    console.table(requiredFunctions);
    
    const allPresent = Object.values(requiredFunctions).every(v => v);
    if (allPresent) {
      console.log('%c✅ PASS: Todas las funciones nuevas presentes', 'color: #46b450; font-weight: bold');
      passedTests++;
    } else {
      console.log('%c❌ FAIL: Faltan funciones nuevas', 'color: #dc3232; font-weight: bold');
      const missing = Object.entries(requiredFunctions)
        .filter(([_, present]) => !present)
        .map(([name]) => name);
      console.log('Funciones faltantes:', missing);
    }
    
    // Verificar valor de DEFAULT_MAX_SIZE
    const maxSizeMatch = code.match(/DEFAULT_MAX_SIZE\s*=\s*(\d+)/);
    if (maxSizeMatch) {
      const value = parseInt(maxSizeMatch[1]);
      console.log(`📊 DEFAULT_MAX_SIZE: ${value}`);
      if (value === 1000) {
        console.log('%c   ✓ Valor correcto (1000)', 'color: #46b450');
      } else {
        console.log(`%c   ✗ Valor incorrecto (esperado: 1000, actual: ${value})`, 'color: #dc3232');
      }
    }
  } catch (error) {
    console.log('%c❌ FAIL: Error al verificar código', 'color: #dc3232; font-weight: bold', error);
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 3: Verificar SDK en runtime
  // ═══════════════════════════════════════════════════════════════════════
  console.log('%c━━━ TEST 3: Verificar SDK en Runtime ━━━', 'color: #46b450; font-weight: bold');
  totalTests++;

  // Esperar a que el SDK esté disponible
  let attempts = 0;
  const maxAttempts = 10;
  
  const waitForSDK = () => new Promise((resolve) => {
    const check = () => {
      if (window.guiders?.trackingPixelSDK?.eventQueueManager) {
        resolve(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, 500);
      } else {
        resolve(false);
      }
    };
    check();
  });

  const sdkAvailable = await waitForSDK();
  
  if (!sdkAvailable) {
    console.log('%c❌ FAIL: SDK no disponible después de 5 segundos', 'color: #dc3232; font-weight: bold');
    console.log('   Intenta recargar la página y ejecutar el script nuevamente');
  } else {
    try {
      const stats = window.guiders.trackingPixelSDK.eventQueueManager.getStats();
      
      console.log('📊 Estadísticas del EventQueueManager:');
      console.table({
        'Tamaño actual': stats.size,
        'Límite máximo': stats.maxSize,
        'Utilización (%)': stats.utilizationPercent,
        'TTL (ms)': stats.ttlMs,
        'TTL (horas)': stats.ttlHours,
        'Persistencia': stats.persistEnabled,
        'Evento más antiguo (ms)': stats.oldestEventAgeMs,
        'Evento más antiguo (h)': stats.oldestEventAgeHours
      });
      
      // Verificaciones clave
      const checks = {
        'maxSize es 1000': stats.maxSize === 1000,
        'ttlMs presente': stats.ttlMs !== undefined,
        'ttlHours presente': stats.ttlHours !== undefined,
        'oldestEventAgeMs presente': stats.hasOwnProperty('oldestEventAgeMs'),
        'oldestEventAgeHours presente': stats.hasOwnProperty('oldestEventAgeHours')
      };
      
      console.log('🔍 Verificaciones clave:');
      console.table(checks);
      
      const allChecksPassed = Object.values(checks).every(v => v);
      if (allChecksPassed) {
        console.log('%c✅ PASS: SDK runtime verificado correctamente', 'color: #46b450; font-weight: bold');
        passedTests++;
      } else {
        console.log('%c❌ FAIL: Algunas verificaciones fallaron', 'color: #dc3232; font-weight: bold');
      }
    } catch (error) {
      console.log('%c❌ FAIL: Error al verificar SDK runtime', 'color: #dc3232; font-weight: bold', error);
    }
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════════════════════════════════
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #0073aa; font-weight: bold');
  console.log('%c📊 RESULTADO FINAL', 'color: #0073aa; font-weight: bold; font-size: 16px');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #0073aa; font-weight: bold');
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(0);
  console.log(`Tests pasados: ${passedTests}/${totalTests} (${percentage}%)`);
  console.log('');
  
  if (passedTests === totalTests) {
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'color: #46b450; font-weight: bold; font-size: 14px');
    console.log('%c║  ✅ VERSIÓN NUEVA CONFIRMADA                              ║', 'color: #46b450; font-weight: bold; font-size: 14px');
    console.log('%c║  SDK con TTL y Payload Limits activo en WordPress        ║', 'color: #46b450; font-weight: bold; font-size: 14px');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #46b450; font-weight: bold; font-size: 14px');
    console.log('');
    console.log('✨ Características activas:');
    console.log('   • TTL de 24 horas');
    console.log('   • Queue size de 1,000 eventos (reducido de 10,000)');
    console.log('   • Payload limit de 1 MB');
    console.log('   • Multi-request fallback automático');
    console.log('   • Logging verboso con estadísticas');
  } else if (passedTests > 0) {
    console.log('%c⚠️ VERIFICACIÓN PARCIAL', 'color: #ffb900; font-weight: bold; font-size: 14px');
    console.log(`${passedTests} de ${totalTests} tests pasaron`);
    console.log('Puede que necesites recargar la página con Ctrl+Shift+R');
  } else {
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'color: #dc3232; font-weight: bold; font-size: 14px');
    console.log('%c║  ❌ VERSIÓN ANTIGUA O ERROR                               ║', 'color: #dc3232; font-weight: bold; font-size: 14px');
    console.log('%c║  Por favor verifica la instalación del plugin            ║', 'color: #dc3232; font-weight: bold; font-size: 14px');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #dc3232; font-weight: bold; font-size: 14px');
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Recarga la página con Ctrl+Shift+R (limpiar caché)');
    console.log('   2. Verifica que el plugin esté activo en WordPress');
    console.log('   3. Revisa los logs del contenedor Docker');
  }
  console.log('');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #0073aa; font-weight: bold');
  
  return {
    passedTests,
    totalTests,
    percentage,
    success: passedTests === totalTests
  };
})();
