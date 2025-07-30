# 📚 API Reference

Referencia completa de la API de Guiders SDK.

## 🏗️ Constructores

### TrackingPixelSDK

```javascript
import { TrackingPixelSDK } from 'guiders-pixel';

const sdk = new TrackingPixelSDK(options);
```

#### Opciones del Constructor

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `apiKey` | `string` | ✅ | - | Tu clave API de Guiders |
| `endpoint` | `string` | ❌ | `'https://api.guiders.com'` | URL del endpoint de la API |
| `webSocketEndpoint` | `string` | ❌ | `'wss://ws.guiders.com'` | URL del WebSocket para chat |
| `autoFlush` | `boolean` | ❌ | `true` | Envío automático de eventos |
| `flushInterval` | `number` | ❌ | `1000` | Intervalo de envío (ms) |
| `maxRetries` | `number` | ❌ | `3` | Número máximo de reintentos |
| `debug` | `boolean` | ❌ | `false` | Habilitar logs de debug |

#### Ejemplo Completo

```javascript
const sdk = new TrackingPixelSDK({
  apiKey: 'your-api-key',
  endpoint: 'https://api.tudominio.com',
  autoFlush: true,
  flushInterval: 2000,
  maxRetries: 5,
  debug: process.env.NODE_ENV === 'development',
  
  // Configuración de detección heurística
  heuristicDetection: {
    enabled: true,
    confidenceThreshold: 0.7,
    fallbackToManual: true
  },
  
  // Configuración de chat
  chat: {
    enabled: true,
    position: 'bottom-right',
    theme: 'light'
  },
  
  // Configuración de detección de bots
  botDetection: {
    enabled: true,
    threshold: 0.6
  }
});
```

## 🚀 Métodos Principales

### init()

Inicializa el SDK. Debe llamarse antes de usar otras funcionalidades.

```javascript
await sdk.init();
```

**Returns:** `Promise<void>`

**Throws:** `Error` si falla la inicialización

### enableAutomaticTracking()

Habilita el tracking automático con detección heurística inteligente.

```javascript
sdk.enableAutomaticTracking();
```

**Returns:** `void`

### track(event)

Envía un evento personalizado.

```javascript
await sdk.track({
  event: 'custom_event',
  data: { key: 'value' }
});
```

**Parameters:**
- `event` (`TrackingEvent`): Objeto del evento

**Returns:** `Promise<void>`

#### Estructura de TrackingEvent

```typescript
interface TrackingEvent {
  event: string;                    // Nombre del evento (requerido)
  timestamp?: number;               // Timestamp (auto si no se proporciona)
  user_id?: string;                 // ID del usuario
  session_id?: string;              // ID de sesión (auto-generado)
  page_url?: string;                // URL de la página (auto si no se proporciona)
  page_title?: string;              // Título de la página (auto si no se proporciona)
  referrer?: string;                // Referrer (auto si no se proporciona)
  user_agent?: string;              // User Agent (auto si no se proporciona)
  data?: Record<string, any>;       // Datos personalizados del evento
}
```

### flush()

Envía inmediatamente todos los eventos pendientes.

```javascript
await sdk.flush();
```

**Returns:** `Promise<void>`

### configure(config)

Actualiza la configuración del SDK en tiempo real.

```javascript
sdk.configure({
  heuristicDetection: {
    confidenceThreshold: 0.8
  }
});
```

**Parameters:**
- `config` (`Partial<SDKConfig>`): Configuración parcial

## 🎯 Detección Heurística

### getHeuristicDetector()

Obtiene la instancia del detector heurístico para personalización avanzada.

```javascript
const detector = sdk.getHeuristicDetector();
```

**Returns:** `HeuristicDetector`

### addCustomRules(eventType, rules)

Añade reglas personalizadas de detección.

```javascript
detector.addCustomRules('mi_evento', [
  {
    selector: 'button',
    confidence: 0.9,
    textPatterns: ['mi_texto'],
    contextSelectors: ['.mi-contexto']
  }
]);
```

**Parameters:**
- `eventType` (`string`): Tipo de evento
- `rules` (`DetectionRule[]`): Array de reglas

#### Estructura de DetectionRule

```typescript
interface DetectionRule {
  selector: string;                 // Selector CSS
  confidence: number;               // Confianza (0-1)
  textPatterns?: string[];          // Patrones de texto
  contextSelectors?: string[];      // Selectores de contexto
  attributes?: Record<string, any>; // Atributos HTML esperados
  excludeSelectors?: string[];      // Selectores a excluir
}
```

### updateHeuristicConfig(config)

Actualiza la configuración de detección heurística.

```javascript
sdk.updateHeuristicConfig({
  enabled: true,
  confidenceThreshold: 0.8,
  fallbackToManual: true
});
```

## 💬 Chat

### openChat()

Abre el chat programáticamente.

```javascript
sdk.openChat();
```

### closeChat()

Cierra el chat programáticamente.

```javascript
sdk.closeChat();
```

### sendMessage(message)

Envía un mensaje programáticamente.

```javascript
sdk.sendMessage('Hola, necesito ayuda');
```

**Parameters:**
- `message` (`string`): Mensaje a enviar

### setChatConfig(config)

Configura el chat.

```javascript
sdk.setChatConfig({
  enabled: true,
  position: 'bottom-left',
  theme: 'dark',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?'
});
```

## 🤖 Detección de Bots

### BotDetector

```javascript
import { BotDetector } from 'guiders-pixel';

const detector = new BotDetector();
```

### detect()

Ejecuta la detección de bots.

```javascript
const result = await detector.detect();
```

**Returns:** `Promise<BotDetectionResult>`

#### Estructura de BotDetectionResult

```typescript
interface BotDetectionResult {
  isBot: boolean;                   // ¿Es un bot?
  probability: number;              // Probabilidad (0-1)
  confidence: number;               // Confianza del resultado (0-1)
  details: {
    userAgent: BotCheck;            // Resultado del análisis de User Agent
    behavior: BotCheck;             // Resultado del análisis de comportamiento
    features: BotCheck;             // Resultado del análisis de características
    timing: BotCheck;               // Resultado del análisis de timing
  };
}

interface BotCheck {
  passed: boolean;                  // ¿Pasó la verificación?
  score: number;                    // Puntuación (0-1)
  reason: string;                   // Razón del resultado
}
```

## 🔧 Gestión de Eventos

### on(event, handler)

Escucha eventos del SDK.

```javascript
sdk.on('chat:message-received', (data) => {
  console.log('Nuevo mensaje:', data.message);
});
```

**Parameters:**
- `event` (`string`): Nombre del evento
- `handler` (`Function`): Función de manejo

#### Eventos Disponibles

| Evento | Descripción | Data |
|--------|-------------|------|
| `sdk:initialized` | SDK inicializado | `{}` |
| `sdk:error` | Error en el SDK | `{ error: Error }` |
| `tracking:event-sent` | Evento enviado | `{ event: TrackingEvent }` |
| `tracking:event-failed` | Fallo al enviar evento | `{ event: TrackingEvent, error: Error }` |
| `heuristic:element-detected` | Elemento detectado | `{ element: HTMLElement, event: string, confidence: number }` |
| `chat:opened` | Chat abierto | `{}` |
| `chat:closed` | Chat cerrado | `{}` |
| `chat:message-sent` | Mensaje enviado | `{ message: string }` |
| `chat:message-received` | Mensaje recibido | `{ message: string, timestamp: number }` |
| `bot:detected` | Bot detectado | `{ result: BotDetectionResult }` |

### once(event, handler)

Escucha un evento una sola vez.

```javascript
sdk.once('sdk:initialized', () => {
  console.log('SDK listo para usar');
});
```

### off(event, handler)

Deja de escuchar un evento.

```javascript
const handler = (data) => console.log(data);
sdk.on('chat:message-received', handler);
sdk.off('chat:message-received', handler);
```

## 📊 Utilidades

### isInitialized()

Verifica si el SDK está inicializado.

```javascript
if (sdk.isInitialized()) {
  // SDK listo para usar
}
```

**Returns:** `boolean`

### getConfig()

Obtiene la configuración actual.

```javascript
const config = sdk.getConfig();
```

**Returns:** `SDKConfig`

### getVersion()

Obtiene la versión del SDK.

```javascript
const version = sdk.getVersion();
```

**Returns:** `string`

### setUserId(userId)

Establece el ID del usuario para tracking.

```javascript
sdk.setUserId('user-12345');
```

**Parameters:**
- `userId` (`string`): ID único del usuario

### setMetadata(eventType, metadata)

Añade metadatos que se incluirán automáticamente en eventos específicos.

```javascript
sdk.setMetadata('purchase', {
  affiliate_id: 'AFF123',
  campaign: 'summer_sale'
});
```

## 🚨 Gestión de Errores

### Tipos de Error

```typescript
enum SDKErrorType {
  INITIALIZATION_ERROR = 'initialization_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  BOT_DETECTION_ERROR = 'bot_detection_error',
  CHAT_ERROR = 'chat_error'
}
```

### Ejemplo de Manejo de Errores

```javascript
try {
  await sdk.init();
} catch (error) {
  if (error.type === 'initialization_error') {
    console.error('Error al inicializar:', error.message);
  } else if (error.type === 'api_error') {
    console.error('Error de API:', error.statusCode, error.message);
  }
}

// Escuchar errores globales
sdk.on('sdk:error', (data) => {
  console.error('Error del SDK:', data.error);
});
```

## 🔗 Ejemplo Completo

```javascript
import { TrackingPixelSDK, BotDetector } from 'guiders-pixel';

async function initializeGuiders() {
  // Detectar bots primero
  const botDetector = new BotDetector();
  const botResult = await botDetector.detect();
  
  if (botResult.isBot) {
    console.log('Bot detectado, no inicializar tracking');
    return;
  }
  
  // Configurar SDK
  const sdk = new TrackingPixelSDK({
    apiKey: 'your-api-key',
    debug: true,
    heuristicDetection: {
      enabled: true,
      confidenceThreshold: 0.7
    },
    chat: {
      enabled: true,
      position: 'bottom-right'
    }
  });
  
  // Escuchar eventos
  sdk.on('sdk:initialized', () => {
    console.log('SDK inicializado correctamente');
  });
  
  sdk.on('heuristic:element-detected', (data) => {
    console.log('Elemento detectado:', data.element, 'Evento:', data.event);
  });
  
  sdk.on('chat:message-received', (data) => {
    console.log('Nuevo mensaje de chat:', data.message);
  });
  
  // Inicializar
  try {
    await sdk.init();
    sdk.enableAutomaticTracking();
    
    // Configurar usuario
    sdk.setUserId('user-12345');
    
    // Metadatos globales
    sdk.setMetadata('purchase', {
      affiliate_id: 'AFF123'
    });
    
    // Evento personalizado
    await sdk.track({
      event: 'page_loaded',
      data: {
        page_type: 'product',
        product_id: 'PROD-123'
      }
    });
    
    console.log('Guiders SDK listo');
    
  } catch (error) {
    console.error('Error inicializando SDK:', error);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGuiders);
} else {
  initializeGuiders();
}
```

---

Esta referencia cubre todas las funcionalidades públicas del SDK. Para más ejemplos y casos de uso, consulta la [documentación completa](./PIXEL_ES.md).