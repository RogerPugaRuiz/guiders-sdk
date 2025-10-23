
<!-- partials/header.php -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guiders SDK - Solución Integral de Análisis Web</title>
  <meta name="description" content="Guiders SDK: Seguimiento avanzado, análisis en tiempo real y chat integrado para aplicaciones web modernas.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
  
  <!-- Configuración de Guiders SDK -->
  <script>
    window.GUIDERS_CONFIG = {
      apiKey: '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0',
      environment: 'development',
      dev: true,
      endpoint: 'http://localhost:3000/api',
      webSocketEndpoint: 'ws://localhost:3000',
      requireConsent: false, // ✅ Consentimiento DESACTIVADO - SDK funciona sin barreras GDPR
      consentBanner: {
        enabled: false        // ✅ Banner de consentimiento DESACTIVADO
      },
      autoFlush: true,        // ✅ IMPORTANTE: Habilitar envío automático de eventos
      flushInterval: 5000,    // Enviar eventos cada 5 segundos
      welcomeMessage: {
        enabled: true,
        style: 'custom',
        customMessage: 'Estamos aquí para orientarte y responder lo que necesites. ¿Empezamos?',
        includeEmojis: false,
        language: 'es',
        showTips: false
      },
      chatConsentMessage: {
        enabled: true,
        message: 'Al unirte al chat, confirmas que has leído y entiendes nuestra',
        privacyPolicyUrl: '/privacy-policy',
        privacyPolicyText: 'Política de Privacidad',
        cookiesPolicyUrl: '/cookies-policy',
        cookiesPolicyText: 'Política de Cookies',
        showOnce: true
      },
      activeHours: {
        enabled: false,
        timezone: 'Europe/Madrid',
        ranges: [
          { start: '08:00', end: '17:00' }
        ],
        fallbackMessage: '🕐 Nuestro chat está disponible de 8:00-17:00 (hora de Madrid). ¡Vuelve durante nuestros horarios de atención!'
      },
      commercialAvailability: {
        enabled: true,          // Habilitar verificación de disponibilidad
        pollingInterval: 10,    // Consultar cada 10 segundos (rápido para demo)
        showBadge: true,        // Mostrar número de comerciales disponibles
        debug: true             // Habilitar logs de debug
      },
      trackingV2: {
        enabled: true,          // Habilitar tracking V2
        batchSize: 500,         // Tamaño del batch
        flushInterval: 5000,    // Flush cada 5 segundos
        maxQueueSize: 10000,    // Tamaño máximo de cola
        persistQueue: true,     // Persistir en localStorage
        bypassConsent: true,    // ✅ BYPASS CONSENT ACTIVADO (Solo desarrollo - NUNCA en producción)
        throttling: {
          enabled: true,
          rules: {
            'SCROLL': 100,        // Max 10 eventos/segundo
            'MOUSE_MOVE': 50,     // Max 20 eventos/segundo
            'HOVER': 200,         // Max 5 eventos/segundo
            'RESIZE': 300,        // Max ~3 eventos/segundo
            'MOUSE_ENTER': 150,
            'MOUSE_LEAVE': 150
          },
          debug: true             // Ver eventos throttled en consola
        },
        aggregation: {
          enabled: true,
          windowMs: 1000,         // Ventana de agregación de 1 segundo
          maxBufferSize: 1000,    // Flush forzado si buffer lleno
          debug: true             // Ver eventos agregados en consola
        }
      },
      presence: {
        enabled: true,                  // Habilitar sistema de presencia
        showTypingIndicator: true,      // Mostrar indicadores de escritura
        typingDebounce: 300,            // Delay antes de enviar "escribiendo" (ms)
        typingTimeout: 2000,            // Auto-stop después de inactividad (ms)
        pollingInterval: 30000,         // Consultar presencia cada 30s
        showOfflineBanner: true         // Mostrar banner cuando comercial está offline
      }
    };

    // Generar session ID único
    (function() {
      if (!sessionStorage.getItem('uniqueSessionId')) {
        const uniqueSessionId = 'sess-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now();
        sessionStorage.setItem('uniqueSessionId', uniqueSessionId);
      }
    })();
  </script>

  <!-- Guiders SDK Script -->
  <script src="/guiders-sdk.js?dev=true&v=<?php echo time(); ?>" data-api-key="12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0"></script>

  <!-- Desarrollo (servidor webpack): -->
  <!-- <script src="http://127.0.0.1:8081/index.js?dev=true" data-api-key="12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0"></script> -->

  <!-- Producción: -->
  <!-- <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" data-api-key="ea0cb2d33e9a186906747071e88a1a1eb1c219a0189f0344c7d87e2c497bf626"></script> -->
</head>
<body>
  <?php
  // ✅ BANNER GDPR DESACTIVADO - No se requiere consentimiento en modo desarrollo
  // require_once __DIR__ . '/gdpr-banner.php';
  ?>