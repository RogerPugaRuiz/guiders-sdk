# 🔧 Tracking V2 - Solución de Problemas

## 🐛 Problema: Eventos no se envían al endpoint `/tracking-v2/events`

### ❌ Síntoma
- Los eventos se capturan en el frontend
- Eventos visibles en la cola: `window.guiders.trackingPixelSDK.eventQueueManager.size()` retorna > 0
- **PERO** nunca se envían al backend (no hay requests HTTP a `/tracking-v2/events`)

### 🔍 Causa Raíz
El **auto-flush estaba deshabilitado** en la configuración del SDK.

#### ¿Cómo funciona el flujo de tracking V2?

```
Usuario interactúa
       ↓
Evento capturado → Pipeline → Throttler → Agregador → Cola → [FLUSH TIMER] → Backend
                                             ↓                       ↑
                                    (cada 1s, auto-flush)    (cada 5s, necesita autoFlush: true)
```

Hay **DOS timers** independientes:

1. **EventAggregator timer** (cada 1s por defecto)
   - Consolida eventos similares
   - Flush automático a la cola
   - ✅ Siempre activo cuando `aggregation.enabled: true`

2. **SDK auto-flush timer** (cada 5s por defecto)
   - Envía batches al backend vía HTTP POST
   - ⚠️ **Solo activo si `autoFlush: true`**
   - **Este era el que faltaba**

### ✅ Solución Aplicada

Se agregó la configuración faltante en `demo/app/partials/header.php`:

```javascript
window.GUIDERS_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  autoFlush: true,        // ✅ CRÍTICO: Habilitar envío automático
  flushInterval: 5000,    // Enviar eventos cada 5 segundos (default: 10000ms)
  trackingV2: {
    enabled: true,
    // ... resto de la configuración
  }
};
```

## 🧪 Cómo Verificar que Funciona

### 1. Limpiar estado anterior
```javascript
// En la consola del navegador (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Abrir la consola del navegador (F12)
Deberías ver logs como:
```
[TrackingPixelSDK] ✅ SDK inicializado
[TrackingPixelSDK] 📊 Tracking V2 habilitado { ... autoFlush: enabled }
[TrackingV2Service] ✅ Metadata obtenida del backend
[EventAggregator] ⏰ Auto-flush iniciado cada 1000ms
```

### 3. Generar eventos
Interactúa con la página (scroll, clicks, etc.) o ejecuta:
```javascript
// Generar evento de prueba
window.guiders.trackingPixelSDK.trackEvent('TEST_EVENT', {
  test: true,
  timestamp: Date.now()
});
```

### 4. Verificar la cola
```javascript
// Ver cuántos eventos están en la cola
window.guiders.trackingPixelSDK.eventQueueManager.size()
// Debería retornar > 0 inicialmente, luego bajar a 0 después del flush
```

### 5. Verificar el envío (Network Tab)
- Abre la pestaña **Network** en DevTools
- Filtra por `tracking-v2`
- Después de 5 segundos deberías ver:
  ```
  POST http://localhost:3000/api/tracking-v2/events
  Status: 200 OK (o 201 Created)
  ```

### 6. Verificar la respuesta
Click en el request y verifica el Response:
```json
{
  "success": true,
  "received": 10,
  "processed": 8,
  "discarded": 2,
  "aggregated": 5,
  "message": "Eventos procesados exitosamente",
  "processingTimeMs": 45
}
```

## 🎯 Verificación Paso a Paso

### Paso 1: Verificar configuración
```javascript
// En consola del navegador
console.log({
  autoFlush: window.GUIDERS_CONFIG.autoFlush,
  flushInterval: window.GUIDERS_CONFIG.flushInterval,
  trackingV2Enabled: window.GUIDERS_CONFIG.trackingV2?.enabled
});

// Debe mostrar:
// { autoFlush: true, flushInterval: 5000, trackingV2Enabled: true }
```

### Paso 2: Verificar estado del SDK
```javascript
const sdk = window.guiders.trackingPixelSDK;
console.log({
  initialized: !!sdk,
  trackingV2Enabled: sdk?.trackingV2Enabled,
  serviceInitialized: sdk?.trackingV2Service?.isInitialized(),
  queueSize: sdk?.eventQueueManager?.size(),
  aggregatorEnabled: sdk?.eventAggregator?.isEnabled()
});

// Debe mostrar:
// {
//   initialized: true,
//   trackingV2Enabled: true,
//   serviceInitialized: true,
//   queueSize: 0-10 (variable),
//   aggregatorEnabled: true
// }
```

### Paso 3: Monitorear auto-flush
Abre la consola y observa cada 5 segundos:
```
[TrackingPixelSDK] 📤 Enviando batch de 8 eventos (V2)...
[TrackingV2Service] ✅ Batch enviado exitosamente: { success: true, processed: 8 }
[EventQueueManager] ➖ 8 eventos eliminados (quedan: 0)
```

### Paso 4: Test manual de flush
```javascript
// Forzar flush inmediato
await window.guiders.trackingPixelSDK.flush();
// Debería enviar inmediatamente los eventos en cola
```

## 🚨 Problemas Comunes

### Problema 1: Cola crece pero nunca se vacía
**Causa**: `autoFlush: false` o no configurado
**Solución**: Agregar `autoFlush: true` en `GUIDERS_CONFIG`

### Problema 2: Error "TrackingV2Service no inicializado"
**Causa**: `trackingV2.enabled: false` o falta apiKey
**Solución**: Verificar configuración en header.php

### Problema 3: Error 401/403 en el request
**Causa**: API Key inválida o backend no accesible
**Solución**: Verificar que el backend esté corriendo en `http://localhost:3000`

### Problema 4: Eventos inválidos descartados
**Causa**: Eventos en formato antiguo en localStorage
**Solución**:
```javascript
// Limpiar cola antigua
localStorage.removeItem('guiders_tracking_v2_queue');
localStorage.removeItem('guiders_event_queue');
location.reload();
```

### Problema 5: sendBeacon error en beforeunload
**Causa**: Normal, no todos los navegadores soportan sendBeacon
**Solución**: No requiere acción, los eventos se enviarán en el próximo flush

## 📊 Estadísticas Útiles

### Ver estadísticas del agregador
```javascript
window.guiders.trackingPixelSDK.eventAggregator.getStats();
// {
//   totalEventsReceived: 150,
//   totalEventsAggregated: 12,
//   aggregationRatio: 92.0,  // 92% de reducción
//   aggregatedByType: { SCROLL: 8, MOUSE_MOVE: 4 }
// }
```

### Ver estadísticas de la cola
```javascript
window.guiders.trackingPixelSDK.eventQueueManager.getStats();
// {
//   size: 5,
//   maxSize: 10000,
//   utilizationPercent: 0.05,
//   persistEnabled: true
// }
```

### Ver configuración del throttler
```javascript
window.guiders.trackingPixelSDK.eventThrottler.getStats();
// {
//   totalEventsReceived: 200,
//   totalEventsThrottled: 120,
//   throttlingRatio: 60.0,  // 60% throttled
//   throttledByType: { SCROLL: 80, MOUSE_MOVE: 40 }
// }
```

## 🎓 Configuración Recomendada para Producción

```javascript
window.GUIDERS_CONFIG = {
  apiKey: 'YOUR_PRODUCTION_API_KEY',

  // Auto-flush SIEMPRE debe estar habilitado en producción
  autoFlush: true,
  flushInterval: 5000,  // 5 segundos (balance entre latencia y carga)

  trackingV2: {
    enabled: true,
    batchSize: 500,
    maxQueueSize: 10000,
    persistQueue: true,  // Importante para no perder eventos en recargas

    throttling: {
      enabled: true,
      rules: {
        'SCROLL': 100,       // Max 10/segundo
        'MOUSE_MOVE': 50,    // Max 20/segundo
        'HOVER': 200,        // Max 5/segundo
        'RESIZE': 300        // Max ~3/segundo
      },
      debug: false  // En producción, desactivar logs
    },

    aggregation: {
      enabled: true,
      windowMs: 1000,      // 1 segundo
      maxBufferSize: 1000,
      debug: false         // En producción, desactivar logs
    }
  }
};
```

## 🔗 Referencias

- **Guía completa**: `TRACKING_V2_GUIDE.md`
- **Demo interactivo**: `http://127.0.0.1:8083/tracking-demo`
- **Código fuente**:
  - `src/services/tracking-v2-service.ts`
  - `src/core/event-queue-manager.ts`
  - `src/core/event-throttler.ts`
  - `src/core/event-aggregator.ts`

---

**Última actualización**: 2025-10-23
**Versión SDK**: 1.5.2
