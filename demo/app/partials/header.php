
<!-- partials/header.php -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Proyecto PHP</title>
  <script src="http://127.0.0.1:8081/index.js"></script>
   
  <!-- <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js"></script> -->

</head>
<body>
  <script>
    const sdk = new window.TrackingPixelSDK({
      // endpoint: "https://guiders-backend-production.up.railway.app",
      apiKey: "49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763",
      autoFlush: true,
      flushInterval: 1000, // 1 second
      maxRetries: 2,
    });

    sdk.init();
    (async () => {
      await sdk.init();
      sdk.enableDOMTracking();
      window.sdk = sdk;
    })();

  </script>