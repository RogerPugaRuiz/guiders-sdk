# Guiders SDK v2.0

SDK de seguimiento de píxeles y chat comercial en tiempo real optimizado para interacciones comerciales con visitantes de sitios web.

## 🆕 Novedades en v2.0

### API V2 del Chat
- **Endpoints optimizados**: Nuevos endpoints `/api/v2/chats` con mejor rendimiento
- **Paginación con cursor**: Navegación más eficiente en listas grandes de chats
- **Filtros avanzados**: Filtrado por estado, prioridad, departamento, etc.
- **Métricas integradas**: Estadísticas de tiempo de respuesta y rendimiento comercial
- **Compatibilidad backward**: Mantiene compatibilidad con la API v1

### Estructura de Datos Optimizada
- **MongoDB optimizado**: Esquemas desnormalizados para consultas más rápidas
- **Índices compuestos**: Mejor rendimiento en búsquedas frecuentes
- **Campos derivados**: Información precomputada para queries eficientes

### Nuevos Servicios
- **ChatV2Service**: Servicio completo para interactuar con la API v2
- **Conversión automática**: Mapeo automático entre formatos v1 y v2
- **Fallback inteligente**: Usa API v1 si v2 no está disponible

## 🚀 Instalación

```bash
npm install guiders-pixel
```

## 📖 Uso Básico

### Inicialización del SDK

```html
<!-- Método 1: Script tag con data-api-key -->
<script src="https://tu-cdn.com/guiders-sdk.js" data-api-key="tu-api-key"></script>

<!-- Método 2: Script tag con parámetro URL -->
<script src="https://tu-cdn.com/guiders-sdk.js?apiKey=tu-api-key"></script>

<!-- Método 3: Configuración global -->
<script>
window.GUIDERS_CONFIG = {
  apiKey: 'tu-api-key'
};
</script>
<script src="https://tu-cdn.com/guiders-sdk.js"></script>
```

### Configuración Avanzada

```javascript
// Configuración personalizada del SDK
window.GUIDERS_CONFIG = {
  apiKey: 'tu-api-key',
  endpoint: 'https://tu-backend.com', // Opcional
  webSocketEndpoint: 'wss://tu-backend.com', // Opcional
  autoFlush: true,
  flushInterval: 1000,
  maxRetries: 2,
  
  // Detección heurística automática
  heuristicDetection: {
    enabled: true,
    config: {
      confidenceThreshold: 0.7,
      fallbackToManual: true
    }
  },
  
  // Seguimiento de sesión avanzado
  sessionTracking: {
    enabled: true,
    config: {
      heartbeatInterval: 30000,
      trackBackgroundTime: false
    }
  }
};
```

## 🔧 Uso de la API V2

### Servicio de Chat V2

```javascript
import { ChatV2Service } from 'guiders-pixel';

const chatService = ChatV2Service.getInstance();

// Obtener un chat específico
const chat = await chatService.getChatById('chat-id');

// Obtener chats de un visitante con paginación
const visitorChats = await chatService.getVisitorChats('visitor-id', null, 20);

// Obtener chats de un comercial con filtros
const commercialChats = await chatService.getCommercialChats(
  'commercial-id',
  null,
  20,
  { status: ['ACTIVE', 'PENDING'] }
);

// Obtener cola de chats pendientes
const pendingChats = await chatService.getPendingQueue('ventas', 50);

// Asignar chat a comercial
const assignedChat = await chatService.assignChat('chat-id', 'commercial-id');

// Cerrar chat
const closedChat = await chatService.closeChat('chat-id');

// Obtener métricas de comercial
const metrics = await chatService.getCommercialMetrics(
  'commercial-id',
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
```

### Tracking de Eventos

```javascript
// El SDK se inicializa automáticamente
// Habilitar tracking automático
window.guiders.enableAutomaticTracking();

// Tracking manual de eventos
window.guiders.track({
  event: 'button_click',
  element: 'cta-primary',
  page: 'homepage'
});

// Configurar metadatos
window.guiders.setMetadata('page_view', {
  page_title: 'Página de Productos',
  category: 'productos'
});
```

## 🌐 API de Chat

### Estructura de Datos V2

```javascript
// Chat V2
const chatV2 = {
  id: 'chat-123',
  status: 'ACTIVE', // PENDING, ASSIGNED, ACTIVE, CLOSED, TRANSFERRED, ABANDONED
  priority: 'HIGH', // LOW, MEDIUM, NORMAL, HIGH, URGENT
  visitorInfo: {
    id: 'visitor-456',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+1234567890',
    location: 'Madrid, España'
  },
  assignedCommercialId: 'commercial-789',
  availableCommercialIds: ['commercial-789', 'commercial-101'],
  metadata: {
    department: 'ventas',
    source: 'website',
    initialUrl: 'https://example.com/productos',
    tags: { campaign: 'summer2024' }
  },
  createdAt: new Date('2025-01-15T10:30:00Z'),
  lastMessageDate: new Date('2025-01-15T11:15:00Z'),
  totalMessages: 15,
  unreadMessagesCount: 3,
  isActive: true
};
```

### Compatibilidad con V1

El SDK mantiene compatibilidad completa con la API v1:

```javascript
// Estas funciones siguen funcionando
const legacyDetail = await fetchChatDetail('chat-id');
console.log(legacyDetail.participants); // Array de participantes como antes
```

## 🔄 WebSocket Events

El SDK mantiene todos los eventos WebSocket existentes:

```javascript
// Escuchar mensajes
window.guiders.on('receive-message', (message) => {
  console.log('Nuevo mensaje:', message);
});

// Eventos del visitante
window.guiders.captureEvent('visitor:send-message', {
  message: 'Hola, necesito ayuda',
  chatId: 'chat-123'
});

// Eventos del chat
window.guiders.captureEvent('visitor:open-chat', {
  chatId: 'chat-123'
});
```

## 📊 Métricas y Estadísticas

### Métricas de Comercial

```javascript
const metrics = await chatService.getCommercialMetrics('commercial-id');
console.log({
  totalChats: metrics.totalChats,
  activeChats: metrics.activeChats,
  averageResponseTime: metrics.averageResponseTime,
  resolutionRate: metrics.resolutionRate
});
```

### Estadísticas de Tiempo de Respuesta

```javascript
const stats = await chatService.getResponseTimeStats(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'day'
);

stats.forEach(stat => {
  console.log(`${stat.period}: ${stat.avgResponseTime} min (${stat.count} chats)`);
});
```

## 🎯 Detección Heurística Inteligente

El SDK incluye un sistema de **detección heurística inteligente** que localiza automáticamente elementos relevantes:

### Ventajas principales

- ✅ **Sin modificaciones HTML** - No es necesario añadir atributos `data-track-event`
- ✅ **Fácil integración** - Funciona automáticamente en WordPress, WooCommerce, Shopify
- ✅ **Detección inteligente** - Usa patrones CSS, texto y contexto para identificar elementos
- ✅ **Detección por URL** - El tipo de página se detecta automáticamente por la URL
- ✅ **Altamente configurable** - Umbrales de confianza y reglas personalizables

### Configuración Heurística

```javascript
// Configurar detección heurística
window.guiders.updateHeuristicConfig({
  confidenceThreshold: 0.8,
  fallbackToManual: false
});

// Habilitar/deshabilitar
window.guiders.setHeuristicEnabled(true);
```

## 🔧 Seguimiento de Sesión

Funcionalidad avanzada tipo Intercom para seguimiento de sesiones:

```javascript
// El seguimiento de sesión se configura al inicializar
// Proporciona funcionalidad tipo Intercom
sessionTracking: {
  enabled: true,
  config: {
    heartbeatInterval: 10000, // 10 segundos
    maxInactivityTime: 60000  // 1 minuto
  }
}
```

## 🛠️ Desarrollo

### Construcción

```bash
npm run build
```

### Servidor de Desarrollo

```bash
npm start
```

### Estructura del Proyecto

```
src/
├── core/                   # Núcleo del SDK
│   ├── tracking-pixel-SDK.ts
│   ├── token-manager.ts
│   └── bot-detector.ts
├── services/               # Servicios
│   ├── chat-v2-service.ts  # Nuevo servicio V2
│   ├── chat-detail-service.ts
│   └── websocket-service.ts
├── presentation/           # Componentes UI
├── pipeline/              # Pipeline de eventos
└── types/                 # Definiciones de tipos
```

## 🔒 Seguridad

- **Autenticación JWT**: Tokens automáticos para todas las peticiones
- **Detección de bots**: Prevención automática de tráfico de bots
- **Validación de datos**: Validación de entrada en todos los endpoints
- **Rate limiting**: Protección contra abuso de API

## 🌍 Compatibilidad

- **Navegadores**: Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **API**: Compatible con backend Guiders v1 y v2
- **WebSocket**: Socket.io 4.x
- **TypeScript**: Tipado completo incluido
- **WP Rocket**: Totalmente compatible con plugins de optimización

## 📝 Changelog

### v2.0.0
- ✨ **Nueva API V2**: Endpoints optimizados con paginación cursor
- 🚀 **Mejor rendimiento**: MongoDB optimizado con índices compuestos
- 📊 **Métricas integradas**: Estadísticas de tiempo de respuesta y comerciales
- 🔄 **Compatibilidad**: Mantiene soporte completo para API v1
- 🛠️ **ChatV2Service**: Nuevo servicio para interactuar con API v2
- 📈 **Filtros avanzados**: Búsqueda mejorada por estado, prioridad, departamento
- 🔧 **Conversión automática**: Mapeo transparente entre formatos v1 y v2

### v1.0.5
- Versión estable anterior con API v1

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

ISC License

## 📞 Soporte

Para soporte técnico y preguntas, contacta al equipo de desarrollo.
