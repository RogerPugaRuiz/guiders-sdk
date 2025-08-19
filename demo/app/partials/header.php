
<!-- partials/header.php -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guiders SDK - Solución Integral de Análisis Web</title>
  <meta name="description" content="Guiders SDK: Seguimiento avanzado, análisis en tiempo real y chat integrado para aplicaciones web modernas.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
  
  <!-- Guiders SDK Script -->
  <script src="http://127.0.0.1:8081/index.js?apiKey=12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0"></script>
   
  <!-- Producción: -->
  <!-- <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js?apiKey=ea0cb2d33e9a186906747071e88a1a1eb1c219a0189f0344c7d87e2c497bf626"></script> -->

  <script>
    (function() {
      if (!sessionStorage.getItem('uniqueSessionId')) {
        const uniqueSessionId = 'sess-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now();
        sessionStorage.setItem('uniqueSessionId', uniqueSessionId);
      }
    })();
  </script>
</head>
<body>