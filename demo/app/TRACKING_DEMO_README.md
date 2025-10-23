# 📊 Tracking V2 Demo - Guía de Uso

## 🚀 Inicio Rápido

### 1. Iniciar el servidor PHP

```bash
cd demo/app
php -S 127.0.0.1:8083
```

### 2. Abrir el demo en el navegador

```
http://127.0.0.1:8083/tracking-demo
```

## 🎯 ¿Qué hace este demo?

El demo interactivo muestra en **tiempo real** cómo funcionan las optimizaciones del sistema de tracking V2:

### **Throttling** (Limitación de frecuencia)
- Evita enviar demasiados eventos del mismo tipo en poco tiempo
- Ejemplo: Si mueves el mouse muy rápido, solo se captura 1 evento cada 50ms
- **Resultado**: Reduce eventos por ~60-90%

### **Agregación** (Consolidación inteligente)
- Agrupa eventos similares en ventanas de tiempo (1 segundo por defecto)
- Ejemplo: 100 eventos SCROLL → 1 evento consolidado con contador `aggregatedCount: 100`
- **Resultado**: Reduce payload por ~70-95%

### **Efecto Combinado**
- 🔥 **Reducción total de tráfico: 80-95%**
- ✅ **Sin pérdida de información**: metadata consolidada (min/max/count)
- ⚡ **Mejor performance**: menos requests HTTP, menor uso de CPU/RAM

## 🎮 Cómo usar el demo

### Estadísticas en Tiempo Real
Visualiza 4 métricas clave:
- **Eventos Capturados**: Total de eventos generados
- **Throttled**: Eventos descartados por throttling
- **Agregados**: Eventos después de consolidación
- **Enviados al Servidor**: Eventos finales en la cola

### Controles Interactivos
- **Toggle Throttling**: Activa/desactiva el throttling para comparar
- **Toggle Agregación**: Activa/desactiva la agregación
- **Botones de Generación**: Crea eventos masivos para probar el sistema
  - 📜 **50 SCROLL**: Simula scroll rápido
  - 🖱️ **50 MOUSE_MOVE**: Simula movimiento intenso del mouse
  - 🎲 **100 Mixtos**: Crea eventos de diferentes tipos

### Área Interactiva
- **Mueve el mouse** sobre el área morada
- **Haz scroll** en la página
- **Haz click** en cualquier parte
- Todos los eventos se capturan y procesan automáticamente

### Log de Eventos
- Muestra eventos en tiempo real con colores:
  - 🔵 **Azul**: Eventos tracked
  - 🟠 **Naranja**: Eventos throttled
  - 🟢 **Verde**: Eventos agregados

## 📈 Ejemplo de Uso

1. **Abre la consola del navegador** (F12)
2. **Observa los logs del SDK**:
   ```
   [EventThrottler] 🚫 SCROLL throttled (último hace 45ms < 100ms)
   [EventAggregator] 🔗 Consolidado SCROLL (count: 15)
   [EventAggregator] 🚀 Flush: original: 150, agregado: 8, reducción: 94.7%
   ```

3. **Prueba desactivando throttling/agregación** para ver la diferencia

4. **Genera 50 eventos SCROLL** con el botón:
   - Con optimizaciones: ~5 eventos enviados (90% reducción)
   - Sin optimizaciones: 50 eventos enviados

## ⚙️ Configuración Actual (header.php)

```javascript
trackingV2: {
  enabled: true,
  throttling: {
    enabled: true,
    rules: {
      'SCROLL': 100,        // Max 10 eventos/segundo
      'MOUSE_MOVE': 50,     // Max 20 eventos/segundo
      'HOVER': 200,         // Max 5 eventos/segundo
      'RESIZE': 300         // Max ~3 eventos/segundo
    },
    debug: true             // Ver logs en consola
  },
  aggregation: {
    enabled: true,
    windowMs: 1000,         // Ventana de 1 segundo
    maxBufferSize: 1000,    // Flush forzado si buffer lleno
    debug: true             // Ver logs en consola
  }
}
```

## 🔍 Debugging

### Ver el estado del SDK
```javascript
// En la consola del navegador
console.log({
  throttlerEnabled: window.guiders.trackingPixelSDK.eventThrottler?.isEnabled(),
  aggregatorEnabled: window.guiders.trackingPixelSDK.eventAggregator?.isEnabled(),
  queueSize: window.guiders.trackingPixelSDK.eventQueueManager?.size(),
  aggregatorStats: window.guiders.trackingPixelSDK.eventAggregator?.getStats()
});
```

### Ver eventos en la cola
```javascript
// Tamaño actual de la cola
window.guiders.trackingPixelSDK.eventQueueManager.size()

// Estadísticas del agregador
window.guiders.trackingPixelSDK.eventAggregator.getStats()
// {
//   totalEventsReceived: 150,
//   totalEventsAggregated: 8,
//   aggregationRatio: 94.7,
//   aggregatedByType: { SCROLL: 5, MOUSE_MOVE: 3 }
// }
```

### Forzar flush manual
```javascript
// Enviar eventos inmediatamente
window.guiders.trackingPixelSDK.flush();
```

## 🎓 Conceptos Técnicos

### Event Fingerprinting
Cada evento se identifica por su "huella digital":
- **SCROLL**: `eventType:visitorId:sessionId:url`
- **MOUSE_MOVE**: `eventType:visitorId:sessionId:elementId`
- **CLICK**: No se agrega (fingerprint único cada vez)

Eventos con la misma huella se consolidan.

### Metadata Fusion
Al consolidar eventos, la metadata se fusiona:
- **Números**: Se guarda min, max y último valor
  ```javascript
  { scrollY: 450, scrollYMin: 100, scrollYMax: 800 }
  ```
- **Strings**: Se guarda el último valor
- **Arrays**: Se concatenan sin duplicados

### Agregación Automática
Cada 1 segundo (configurable), el agregador:
1. **Consolida** eventos similares en el buffer
2. **Añade metadata** de agregación (`aggregatedCount`, `firstOccurredAt`, `lastOccurredAt`)
3. **Flush** automático enviando eventos consolidados a la cola
4. **Limpia** el buffer para la siguiente ventana

## 📚 Más Información

- **Guía completa**: Ver `TRACKING_V2_GUIDE.md` en la raíz del proyecto
- **Código fuente**:
  - `src/core/event-throttler.ts`
  - `src/core/event-aggregator.ts`
  - `src/core/tracking-pixel-SDK.ts` (integración)

## 🐛 Problemas Comunes

### Los eventos no se capturan
- ✅ Verifica que el SDK esté inicializado: `window.guiders?.trackingPixelSDK`
- ✅ Revisa la consola para errores
- ✅ Asegúrate de que `trackingV2.enabled: true`

### Las estadísticas no se actualizan
- ✅ Abre la consola del navegador (F12)
- ✅ Verifica que `debug: true` en la configuración
- ✅ Recarga la página y prueba de nuevo

### El servidor PHP no inicia
- ✅ Verifica que PHP esté instalado: `php --version`
- ✅ El puerto 8083 debe estar libre
- ✅ Ejecuta desde `demo/app/`: `php -S 127.0.0.1:8083`

---

**💡 Tip**: Para una mejor experiencia, usa Chrome DevTools con la pestaña "Network" abierta para ver los requests HTTP reducidos en tiempo real.
