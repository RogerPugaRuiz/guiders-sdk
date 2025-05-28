# Guiders SDK

SDK para la integración del sistema de guías y chat en sitios web.

## Instalación

```bash
npm install guiders-pixel
```

## Uso básico

```html
<script src="path/to/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>
```

O bien, pasando la API key como parámetro:

```html
<script src="path/to/guiders-sdk.js?apiKey=YOUR_API_KEY"></script>
```

## Características

- Tracking de eventos
- Chat en vivo
- Notificaciones
- Tracking DOM

## Detección de bots

El SDK incluye un sistema de detección de bots para evitar que se inicialice en visitantes que probablemente sean bots o crawlers. La detección se realiza automáticamente y, si se identifica un bot, el SDK no se iniciará.

### Cómo funciona la detección

La detección de bots realiza varias comprobaciones:

1. **User Agent**: Comprueba si el User Agent contiene palabras clave típicas de bots (como "bot", "crawler", "spider", etc.)
2. **Características del navegador**: Detecta anomalías en las características del navegador (como webdriver activo, falta de plugins, etc.)
3. **Tiempos de carga**: Identifica cargas de página sospechosamente rápidas
4. **Comportamiento**: Monitoriza interacciones del usuario durante los primeros segundos

El resultado se calcula como una probabilidad. Si la probabilidad es superior al 60%, se considera un bot y el SDK no se inicia.

### Personalización de la detección

Si necesitas personalizar la detección de bots, puedes crear tu propia instancia del `BotDetector` y utilizarla antes de inicializar manualmente el SDK:

```javascript
import { BotDetector, TrackingPixelSDK } from 'guiders-pixel';

// Opciones del SDK
const options = {
  apiKey: 'YOUR_API_KEY',
  // Otras opciones...
};

// Comprobar si es un bot antes de inicializar
const detector = new BotDetector();
detector.detect().then(result => {
  if (!result.isBot) {
    // Solo inicializar para usuarios legítimos
    const sdk = new TrackingPixelSDK(options);
    sdk.init().then(() => {
      // SDK inicializado correctamente
    });
  } else {
    console.log('Bot detectado. No se inicializa el SDK.');
  }
});
```

## Licencia

ISC