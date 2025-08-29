# Guiders SDK - AI Coding Instructions

## Arquitectura General
Este es un **SDK de tracking de píxeles y chat comercial en tiempo real v2.0** construido con **TypeScript** y **Webpack**. El SDK se despliega como una librería UMD que se integra en sitios web para tracking de eventos y chat comercial automático.

### Estructura del Proyecto
```
src/
├── core/                    # Núcleo del SDK
│   ├── tracking-pixel-SDK.ts    # Clase principal del SDK
│   ├── bot-detector.ts          # Detección automática de bots
│   ├── token-manager.ts         # Gestión de tokens JWT
│   └── heuristic-element-detector.ts # Detección inteligente de elementos
├── services/                # Servicios externos
│   ├── chat-v2-service.ts       # API V2 optimizada de chats
│   ├── websocket-service.ts     # Cliente WebSocket para tiempo real
│   └── health-check-service.ts  # Verificación de conexión
├── pipeline/                # Pipeline de procesamiento de eventos
│   ├── pipeline-processor.ts    # Procesador principal con stages
│   └── stages/              # Etapas de transformación de datos
├── presentation/            # Componentes UI del chat
│   ├── chat.ts                  # Widget de chat embebido
│   └── chat-toggle-button.ts   # Botón flotante de chat
└── types/                   # Definiciones TypeScript
```

### Backend Conectado
- **Guiders Backend**: NestJS con DDD/CQRS en `guiders-backend/`
- **Base de datos dual**: PostgreSQL (usuarios) + MongoDB (mensajes cifrados)
- **WebSocket**: Socket.io para comunicación tiempo real
- **API V2**: Endpoints optimizados con paginación cursor y filtros avanzados

## Características Principales del SDK

### 1. Detección Heurística Inteligente (v2.0)
Sistema automático que localiza elementos DOM sin necesidad de atributos `data-track-event`:

```typescript
// Habilitar detección automática (recomendado en v2.0)
window.guiders.enableAutomaticTracking();

// Configurar umbrales de confianza
window.guiders.updateHeuristicConfig({
  confidenceThreshold: 0.8,
  fallbackToManual: true
});
```

- **Reglas CSS + texto**: Detecta botones "Añadir al carrito", "Contactar", etc.
- **Detección por URL**: Identifica tipo de página automáticamente
- **Configurable**: Umbrales de confianza, reglas personalizadas
- **Compatible**: Funciona en WordPress, WooCommerce, Shopify sin modificaciones

### 2. Chat Comercial en Tiempo Real
Chat embebido con inicialización lazy sin parpadeo:

```typescript
// El chat se inicializa automáticamente oculto
// Se muestra solo cuando hay comerciales online
// Gestión automática de mensajes no leídos y notificaciones
```

- **Lazy loading**: Sin parpadeo visual en la inicialización
- **Detección de bots**: Previene inicialización en crawlers
- **Estado comercial**: Muestra/oculta según disponibilidad de asesores
- **WebSocket**: Comunicación bidireccional con reconexión automática

### 3. Pipeline de Procesamiento de Eventos
Arquitectura pipeline para transformar eventos antes del envío:

```typescript
// Pipeline automático: TimeStamp → Token → URL → Session → Metadata → Validation
const eventPipeline = this.pipelineBuilder
  .addStage(new TimeStampStage())
  .addStage(new TokenInjectionStage())
  .addStage(new URLInjectionStage())
  .build();
```

### 4. Seguimiento de Sesión Avanzado
Funcionalidad tipo Intercom para tracking de actividad:

```typescript
// Configurado automáticamente con heartbeat y detección de inactividad
sessionTracking: {
  enabled: true,
  heartbeatInterval: 30000,
  trackBackgroundTime: false
}
```

## Patrones de Desarrollo Críticos

### Inicialización del SDK
El SDK se auto-inicializa con compatibilidad para WP Rocket y optimizadores:

```typescript
// Detección automática de parámetros
// Múltiples métodos: data-api-key, URL params, window.GUIDERS_CONFIG
// Detección de entorno: development vs production
initializeGuidersSDK();
```

### EndpointManager Singleton
Gestión centralizada de endpoints con detección automática de entorno:

```typescript
// Automático: desarrollo (localhost:3000) vs producción (217.154.105.26)
EndpointManager.setInstance(endpoint, webSocketEndpoint);
```

### TokenManager con Auto-refresh
Sistema de tokens JWT con renovación automática:

```typescript
// Auto-refresh antes de expiración
// Persistencia en localStorage
// Subscriber pattern para actualizaciones de WebSocket
TokenManager.startTokenMonitor();
```

### Gestión de Estado del Chat
Control de visibilidad basado en disponibilidad de comerciales:

```typescript
// Verificación automática cada 10 segundos
// Eventos WebSocket para cambios de estado en tiempo real
// Sistema de "claims" para asignación de chats
this.checkAndUpdateChatVisibility(chatId, chat, chatToggleButton);
```

### API V2 con Fallback
Servicio optimizado con compatibilidad hacia atrás:

```typescript
// Intenta API V2, fallback a V1 automático
const chatDetailV2 = await fetchChatDetailV2(chatId);
const legacyDetail = this.convertV2ToLegacyDetail(chatDetailV2);
```

## Comandos de Desarrollo

### Build y Testing
```bash
npm run build          # Webpack production build
npm start              # Webpack dev server
```

### Estructura de Output
```bash
dist/index.js          # UMD build para navegadores
# Librería: 'GuidersPixel', target: 'umd'
```

### Variables de Entorno
```typescript
// NODE_ENV detecta automáticamente development vs production
const isDev = process.env.NODE_ENV === 'development';
const endpoint = isDev ? "http://localhost:3000" : "http://217.154.105.26/api/";
```

## Integración y Compatibilidad

### Métodos de Integración
```html
<!-- Método 1: data-api-key -->
<script src="path/to/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>

<!-- Método 2: URL parameter -->
<script src="path/to/guiders-sdk.js?apiKey=YOUR_API_KEY"></script>

<!-- Método 3: Global config -->
<script>window.GUIDERS_CONFIG = {apiKey: 'YOUR_API_KEY'};</script>
```

### Compatibilidad Plugins
- **WP Rocket**: Listeners especiales para lazy loading scripts
- **Detección de bots**: Evita inicialización en crawlers (60% threshold)
- **Optimizadores**: Múltiples estrategias de detección de scripts

### Eventos WebSocket Principales
```typescript
// Visitante → Backend
'visitor:send-message'     // Envío de mensaje
'visitor:open-chat'        // Apertura de chat
'visitor:close-chat'       // Cierre de chat

// Backend → Visitante  
'receive-message'          // Mensaje entrante
'chat:participant-joined'  // Comercial se une
'participant:online-status-updated'  // Cambio estado comercial
```

## Mejores Prácticas Específicas

### Manejo de Errores Sin Excepciones
```typescript
// WebSocket con manejo graceful de errores
if (!this.webSocket?.isConnected()) {
  console.warn("WebSocket no conectado, mensaje no enviado");
  return;
}
```

### Detección de Elementos Inteligente
```typescript
// Configuración de confianza y reglas personalizadas
this.heuristicDetector.addCustomRules('mi_evento', [
  {
    selector: 'button',
    confidence: 0.9,
    textPatterns: ['mi_texto'],
    contextSelectors: ['.mi-contexto']
  }
]);
```

### Cleanup de Recursos
```typescript
// Siempre cleanup en destrucción
public cleanup(): void {
  this.stopAutoFlush();
  this.eventQueue = [];
  this.listeners.clear();
  this.webSocket?.disconnect();
}
```

### Indicadores Visuales (Desarrollo)
```typescript
// Solo en modo desarrollo: indicadores sobre elementos detectados
if (process.env.NODE_ENV === 'development') {
  this.addVisualIndicator(element, eventType, confidence);
}
```

## Flujo de Trabajo Post-Cambios

1. **Testing local**: `npm start` para desarrollo con hot-reload
2. **Build producción**: `npm run build` 
3. **Verificar UMD**: Comprobar `dist/index.js` se genera correctamente
4. **Testing integración**: Usar archivos `.html` de test en la raíz
5. **Documentación**: Actualizar `README_V2.md` para cambios importantes

## Debugging y Troubleshooting

### Estados Comunes
```typescript
// Verificar estado del SDK
console.log({
  hasValidTokens: TokenManager.hasValidTokens(),
  isWebSocketConnected: window.guiders.webSocket?.isConnected(),
  chatVisible: window.guiders.chatUI?.isVisible(),
  heuristicEnabled: window.guiders.heuristicEnabled
});

// Debug detección de bots
const detector = new BotDetector();
detector.detect().then(result => console.log('Bot detection:', result));
```

### Logs Estructurados
El SDK usa logs prefijados para fácil debugging:
- `🚀` Inicialización y configuración
- `📊` Tracking de eventos
- `💬` Chat y mensajes
- `🔍` Detección heurística
- `📡` WebSocket y comunicación
- `❌` Errores y warnings

Esta arquitectura garantiza un SDK robusto, fácil de integrar y con funcionalidades avanzadas de tracking y chat comercial automatizado.
