
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
      welcomeMessage: {
        enabled: true,
        style: 'custom',
        customMessage: 'Estamos aquí para orientarte y responder lo que necesites. ¿Empezamos?',
        includeEmojis: false,
        language: 'es',
        showTips: false
      },
      activeHours: {
        enabled: false,
        timezone: 'Europe/Madrid',
        ranges: [
          { start: '08:00', end: '17:00' }
        ],
        fallbackMessage: '🕐 Nuestro chat está disponible de 8:00-17:00 (hora de Madrid). ¡Vuelve durante nuestros horarios de atención!'
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
  <script src="/guiders-sdk.js?dev=true" data-api-key="12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0"></script>

  <!-- Desarrollo (servidor webpack): -->
  <!-- <script src="http://127.0.0.1:8081/index.js?dev=true" data-api-key="12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0"></script> -->

  <!-- Producción: -->
  <!-- <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" data-api-key="ea0cb2d33e9a186906747071e88a1a1eb1c219a0189f0344c7d87e2c497bf626"></script> -->
</head>
<body>
  <?php
  // Incluir banner de consentimiento GDPR
  require_once __DIR__ . '/gdpr-banner.php';
  ?>