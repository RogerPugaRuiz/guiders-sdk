
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
  <script src="http://127.0.0.1:8081/index.js?apiKey=49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763"></script>
   
  <!-- Producción: -->
  <!-- <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js?apiKey=0dfcbca086b2ca8ef8000e15d10aa9b5efc40b2f8591b1bfa36725e3848f0e0a"></script> -->

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