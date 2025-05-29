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
- Chat en vivo con inicialización optimizada
- Notificaciones
- Tracking DOM

## Chat en vivo

El chat utiliza un sistema de inicialización lazy que garantiza que permanezca completamente oculto hasta que el usuario haga clic en el botón toggle. 

### Funcionamiento de la inicialización

1. **Inicialización silenciosa**: El chat se inicializa en segundo plano sin mostrarse
2. **Carga diferida**: El contenido del chat (mensajes de bienvenida e iniciales) solo se carga cuando el usuario abre el chat por primera vez
3. **Sin parpadeo**: Elimina el problema donde el chat se mostraba brevemente antes de ocultarse

### Personalización del chat

```javascript
// El chat se inicializa automáticamente y permanece oculto
// hasta que el usuario interactúe con el botón toggle
```

## Detección de bots

El SDK incluye un sistema de detección de bots para evitar que se inicialice en visitantes que probablemente sean bots o crawlers. La detección se realiza automáticamente y, si se identifica un bot, el SDK no se iniciará.

### Cómo funciona la detección

La detección de bots realiza varias comprobaciones:

1. **User Agent**: Comprueba si el User Agent contiene palabras clave típicas de bots (como "bot", "crawler", "spider", etc.)
2. **Características del navegador**: Detecta anomalías en las características del navegador (como webdriver activo, falta de plugins, etc.)
3. **Tiempos de carga**: Identifica cargas de página sospechosamente rápidas
4. **Comportamiento**: Monitoriza interacciones del usuario durante el primer segundo

El resultado se calcula como una probabilidad. Si la probabilidad es superior al 60%, se considera un bot y el SDK no se inicia. La detección se realiza rápidamente (en 1 segundo) para no retrasar la aparición del chat.

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

## Cambios recientes

### v1.1.0 - Mejoras en la inicialización del chat

- **Solucionado**: El chat ya no se muestra brevemente durante la inicialización
- **Optimización**: Implementado sistema de carga lazy para el contenido del chat
- **Mejora UX**: El chat permanece completamente oculto hasta que el usuario lo active explícitamente
- **Rendimiento**: Reducido el tiempo de inicialización al diferir la carga de mensajes hasta que sea necesario

### Detalles técnicos

La solución implementa:
1. Inicialización en dos fases: estructura del chat + contenido diferido
2. Carga de mensajes solo cuando el chat se muestra por primera vez
3. Eliminación del parpadeo visual durante la inicialización
4. Mantiene la funcionalidad completa del chat sin afectar la experiencia del usuario

## Licencia

ISC