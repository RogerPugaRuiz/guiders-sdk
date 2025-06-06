# Píxel de Seguimiento Guiders SDK

## Introducción

El Píxel de Seguimiento Guiders SDK es una herramienta integral para capturar datos de movimiento de visitantes en sitios web. Incluye funcionalidades de tracking de eventos, chat en vivo, detección de bots y seguimiento automático del DOM.

## Instalación

### Mediante npm

```bash
npm install guiders-pixel
```

### Mediante script directo

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" data-api-key="YOUR_API_KEY"></script>
```

## Integración Básica

### Opción 1: Atributo data-api-key

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" data-api-key="YOUR_API_KEY"></script>
```

### Opción 2: Parámetro en URL

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js?apiKey=YOUR_API_KEY"></script>
```

### Opción 3: Inicialización manual

```javascript
import { TrackingPixelSDK, BotDetector } from 'guiders-pixel';

// Configuración del SDK
const options = {
  apiKey: 'YOUR_API_KEY',
  autoFlush: true,
  flushInterval: 1000,
  maxRetries: 2,
  endpoint: 'https://your-api-endpoint.com/api',
  webSocketEndpoint: 'wss://your-websocket-endpoint.com'
};

// Detección de bots (opcional)
const detector = new BotDetector();
detector.detect().then(result => {
  if (!result.isBot) {
    // Inicializar solo para usuarios legítimos
    const sdk = new TrackingPixelSDK(options);
    sdk.init().then(() => {
      console.log('SDK inicializado correctamente');
      sdk.enableDOMTracking();
    });
  }
});
```

## Opciones de Configuración

| Parámetro | Tipo | Requerido | Por Defecto | Descripción |
|-----------|------|-----------|-------------|-------------|
| `apiKey` | string | Sí | - | Clave API para autenticación |
| `endpoint` | string | No | https://guiders.ancoradual.com/api | URL del endpoint de la API |
| `webSocketEndpoint` | string | No | wss://guiders.ancoradual.com | URL del WebSocket |
| `autoFlush` | boolean | No | true | Envío automático de eventos |
| `flushInterval` | number | No | 1000 | Intervalo de envío en milisegundos |
| `maxRetries` | number | No | 2 | Número máximo de reintentos |

## Tracking Automático del DOM

El SDK incluye tracking automático para eventos de e-commerce comunes. Simplemente añade atributos `data-track-event` a tus elementos HTML:

### Eventos Soportados

| Evento | Trigger | Descripción |
|--------|---------|-------------|
| `page_view` | DOMContentLoaded | Vista de página |
| `view_product` | mouseenter | Visualización de producto |
| `add_to_cart` | click | Añadir al carrito |
| `view_cart` | mouseenter | Ver carrito |
| `purchase` | click | Compra completada |

### Ejemplos de Uso

```html
<!-- Vista de producto -->
<div data-track-event="view_product" 
     data-product-id="12345" 
     data-product-name="Producto Ejemplo"
     data-price="29.99"
     data-category="Electronics">
  <h3>Producto Ejemplo</h3>
</div>

<!-- Botón añadir al carrito -->
<button data-track-event="add_to_cart"
        data-product-id="12345"
        data-quantity="1">
  Añadir al Carrito
</button>

<!-- Vista de carrito -->
<div data-track-event="view_cart" 
     data-cart-value="89.97"
     data-items-count="3">
  Ver Carrito
</div>

<!-- Botón de compra -->
<button data-track-event="purchase"
        data-order-id="ORD-12345"
        data-total="89.97"
        data-currency="EUR">
  Completar Compra
</button>

<!-- Vista de página (automático) -->
<div data-track-event="page_view" 
     data-page-title="Página de Inicio"
     data-page-url="/inicio">
</div>
```

### Habilitar Tracking del DOM

```javascript
// El tracking se habilita automáticamente, pero también puedes activarlo manualmente:
window.guiders.enableDOMTracking();
```

## Tracking Personalizado

### Envío de Eventos Personalizados

```javascript
// Evento básico
await window.guiders.track({
  event: 'custom_event',
  user_id: '12345',
  action: 'button_click',
  value: 100
});

// Evento con metadatos adicionales
await window.guiders.track({
  event: 'newsletter_signup',
  email: 'user@example.com',
  source: 'footer_form',
  timestamp: Date.now()
});
```

### Gestión de Eventos

```javascript
// Escuchar eventos
window.guiders.on('receive-message', (message) => {
  console.log('Mensaje recibido:', message);
});

// Escuchar evento una sola vez
window.guiders.once('visitor:open-chat', (event) => {
  console.log('Chat abierto por primera vez');
});

// Dejar de escuchar eventos
function messageHandler(msg) {
  console.log('Manejador de mensaje:', msg);
}
window.guiders.on('receive-message', messageHandler);
window.guiders.off('receive-message', messageHandler);
```

### Control del Envío de Datos

```javascript
// Envío manual inmediato
await window.guiders.flush();

// Detener envío automático
window.guiders.stopAutoFlush();

// Añadir metadatos a eventos específicos
window.guiders.setMetadata('purchase', {
  affiliate_id: 'AFF123',
  campaign: 'black_friday_2024'
});
```

## Detección de Bots

El SDK incluye detección automática de bots para evitar tracking de crawlers y bots. La detección analiza:

- User Agent del navegador
- Características del navegador (plugins, webdriver, etc.)
- Tiempos de carga de página
- Comportamiento de interacción del usuario

### Configuración Personalizada

```javascript
import { BotDetector } from 'guiders-pixel';

const detector = new BotDetector();
detector.detect().then(result => {
  console.log('¿Es un bot?:', result.isBot);
  console.log('Probabilidad:', result.probability);
  console.log('Detalles:', result.details);
  
  if (result.probability < 0.3) {
    // Umbral personalizado más permisivo
    initializeSDK();
  }
});
```

## Chat en Vivo

El SDK incluye funcionalidad de chat en vivo integrada:

### Características del Chat

- Inicialización lazy (sin parpadeo)
- Carga diferida de contenido
- Notificaciones de mensajes no leídos
- WebSocket para tiempo real
- Detección automática de typing

### Eventos de Chat

```javascript
// El chat se inicializa automáticamente y se oculta por defecto
// Los eventos se trackean automáticamente:

// - visitor:open-chat: Cuando el usuario abre el chat
// - visitor:close-chat: Cuando el usuario cierra el chat  
// - visitor:send-message: Cuando el usuario envía un mensaje
// - receive-message: Cuando se recibe un mensaje del asesor
```

### Personalización del Chat

```javascript
// Añadir mensajes del sistema
window.addEventListener('add-system-message', (event) => {
  console.log('Mensaje del sistema:', event.detail.message);
});

// Escuchar apertura/cierre del chat
window.guiders.on('visitor:open-chat', (event) => {
  console.log('Chat abierto:', event.data);
});

window.guiders.on('visitor:close-chat', (event) => {
  console.log('Chat cerrado:', event.data);
});
```

## Pipeline de Procesamiento

El SDK utiliza un sistema de pipeline para procesar eventos:

```javascript
// Añadir etapas personalizadas al pipeline
window.guiders.addPipelineStage({
  name: 'custom-validator',
  process: (event) => {
    // Validación personalizada
    if (event.type === 'purchase' && !event.data.order_id) {
      throw new Error('order_id es requerido para eventos de compra');
    }
    return event;
  }
});
```

## Ejemplos Completos

### E-commerce Básico

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Tienda</title>
</head>
<body>
  <!-- Tracking automático de página -->
  <div data-track-event="page_view" 
       data-page-title="Catálogo de Productos"
       data-page-category="shop"></div>

  <!-- Producto -->
  <div class="product" 
       data-track-event="view_product"
       data-product-id="PROD-001"
       data-product-name="Smartphone XYZ"
       data-price="299.99"
       data-category="Electronics">
    
    <h2>Smartphone XYZ</h2>
    <p>Precio: €299.99</p>
    
    <button data-track-event="add_to_cart"
            data-product-id="PROD-001"
            data-price="299.99"
            data-quantity="1">
      Añadir al Carrito
    </button>
  </div>

  <!-- Carrito -->
  <div data-track-event="view_cart"
       data-cart-value="299.99"
       data-items-count="1">
    <h3>Tu Carrito</h3>
    <p>Total: €299.99</p>
    
    <button data-track-event="purchase"
            data-order-id="ORD-789"
            data-total="299.99"
            data-currency="EUR"
            data-payment-method="credit_card">
      Finalizar Compra
    </button>
  </div>

  <!-- Integración del SDK -->
  <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" 
          data-api-key="your-api-key-here"></script>
</body>
</html>
```

### Integración Avanzada

```javascript
// Configuración completa con manejo de errores
async function initializeGuiders() {
  try {
    const options = {
      apiKey: 'YOUR_API_KEY',
      endpoint: 'https://your-api.com/api',
      webSocketEndpoint: 'wss://your-api.com',
      autoFlush: true,
      flushInterval: 2000,
      maxRetries: 3
    };

    // Verificar si es un bot
    const detector = new BotDetector();
    const detection = await detector.detect();
    
    if (detection.isBot) {
      console.log('Bot detectado, no se inicializa tracking');
      return;
    }

    // Inicializar SDK
    const sdk = new TrackingPixelSDK(options);
    window.guiders = sdk;
    
    await sdk.init();
    sdk.enableDOMTracking();

    // Tracking personalizado
    await sdk.track({
      event: 'page_load',
      page: window.location.pathname,
      referrer: document.referrer,
      timestamp: Date.now()
    });

    console.log('Guiders SDK inicializado correctamente');
    
  } catch (error) {
    console.error('Error inicializando Guiders SDK:', error);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGuiders);
} else {
  initializeGuiders();
}
```

## Resolución de Problemas

### Problemas Comunes

1. **SDK no se inicializa**
   - Verificar que la API key sea correcta
   - Comprobar la conexión con el servidor
   - Revisar si se detectó como bot incorrectamente

2. **Eventos no se envían**
   - Verificar que `autoFlush` esté habilitado
   - Comprobar la configuración de `flushInterval`
   - Revisar errores en la consola del navegador

3. **Chat no aparece**
   - El chat está oculto por defecto hasta que el usuario lo active
   - Verificar la conexión WebSocket
   - Comprobar que los tokens sean válidos

### Debugging

```javascript
// Habilitar logs detallados
console.log('Estado del SDK:', {
  hasValidTokens: TokenManager.hasValidTokens(),
  isConnected: window.guiders.isConnected?.(),
  eventQueue: window.guiders.eventQueue?.length
});

// Verificar detección de bots
const detector = new BotDetector();
detector.detect().then(result => {
  console.log('Detección de bot:', result);
});
```

## Soporte

Para obtener soporte técnico o reportar problemas:

1. Revisar la documentación completa
2. Verificar la configuración de la API key
3. Comprobar la consola del navegador en busca de errores
4. Contactar al equipo de soporte con detalles específicos del problema

---

## Versionado

Versión actual: 1.0.5

Para más información sobre cambios y actualizaciones, consultar el archivo README.md del proyecto.