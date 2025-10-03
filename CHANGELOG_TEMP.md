# Changelog Temporal - Guiders SDK WordPress Plugin

Este archivo contiene los cambios pendientes de agregar al readme.txt del plugin de WordPress.

## Versión en Desarrollo: [Por definir]

### 🎯 Cambios Realizados

#### 🚫 Filtrado de Mensajes Propios en WebSocket

**Fecha**: 3 de octubre de 2025

**Problema resuelto**: 
- Se eliminó la duplicación de mensajes del visitante en el chat
- Anteriormente, cuando un visitante enviaba un mensaje, aparecía dos veces: una al enviarlo (optimistic UI) y otra cuando llegaba el eco desde el WebSocket

**Implementación**:
- Agregado filtro automático en `RealtimeMessageManager.handleNewMessage()`
- Los mensajes cuyo `senderId` coincide con el `visitorId` actual se ignoran automáticamente
- Solo se renderizan mensajes de comerciales, bots y otros participantes

**Beneficios**:
- ✅ Experiencia de usuario mejorada - sin duplicados
- ✅ Renderizado instantáneo de mensajes propios (optimistic UI)
- ✅ Recepción en tiempo real de mensajes de comerciales
- ✅ Arquitectura limpia: HTTP para envío, WebSocket para recepción

**Archivos modificados**:
- `src/services/realtime-message-manager.ts` - Filtro en `handleNewMessage()`
- `test-websocket-filter-own-messages.html` - Test interactivo completo
- `docs/WEBSOCKET_OWN_MESSAGE_FILTER.md` - Documentación del patrón

---

#### 📡 Logs Detallados de Conexión WebSocket

**Fecha**: 3 de octubre de 2025

**Problema resuelto**: 
- Dificultad para diagnosticar problemas de conexión WebSocket
- No había visibilidad de la URL exacta de conexión
- Errores de conexión no proporcionaban información suficiente para debugging

**Implementación**:
- Añadidos logs exhaustivos en todas las fases de conexión WebSocket
- Logs de inicio con endpoint resuelto y configuración completa
- Logs de conexión exitosa con Socket ID, URL y transporte usado
- Logs de errores con mensaje detallado, stack trace y URL intentada
- Logs de desconexión con razón específica
- Logs de reintentos de reconexión con número de intento

**Características de los logs**:
- 🔍 **Inicio**: Muestra URL completa (`wss://guiders.es/socket.io`), path, transports, credentials
- ✅ **Éxito**: Socket ID, URL conectada, transporte usado (websocket/polling)
- ❌ **Error**: URL intentada, mensaje de error, stack completo, objeto error completo
- ⚠️ **Desconexión**: Razón de desconexión, URL que estaba conectada
- 🔄 **Reconexión**: Número de intento, URL de reconexión

**Beneficios**:
- ✅ Debugging simplificado - toda la información necesaria en consola
- ✅ Verificación inmediata de endpoints correctos (prod: `wss://guiders.es`)
- ✅ Identificación rápida de errores de red, CORS, autenticación
- ✅ Visibilidad completa del ciclo de vida de la conexión
- ✅ Facilita soporte técnico y resolución de problemas

**Archivos modificados**:
- `src/services/websocket-service.ts` - Logs en método `connect()` y `registerEventListeners()`
- `test-websocket-logs.html` - Página de prueba interactiva con visualización de logs
- `WEBSOCKET_LOGS_GUIDE.md` - Guía completa de interpretación de logs

**Testing**:
```bash
# Abrir página de prueba
open test-websocket-logs.html

# O usar demo PHP
php -S 127.0.0.1:8083 -t demo/app
```

**Logs en consola** (filtrar por `📡` o `WebSocketService`):
```
📡 [WebSocketService] 🔍 INICIO DE CONEXIÓN WebSocket
📡 [WebSocketService] 📋 Endpoint resuelto: wss://guiders.es
📡 [WebSocketService] 🚀 INTENTANDO CONECTAR a: {...}
📡 [WebSocketService] 🌐 URL COMPLETA WebSocket: wss://guiders.es/socket.io
📡 [WebSocketService] ✅✅✅ CONEXIÓN EXITOSA! ✅✅✅
📡 [WebSocketService] 🆔 Socket ID: abc123...
📡 [WebSocketService] 🚀 Transporte usado: websocket
```

---

## Próximos Cambios Pendientes

_Aquí se irán agregando los siguientes cambios que se realicen..._

---

## Instrucciones de Uso

1. **Para agregar nuevos cambios**: Edita este archivo y agrega la nueva funcionalidad en la sección "Versión en Desarrollo"
2. **Para release**: Copia el contenido del bloque "Formato para readme.txt" al archivo oficial `readme.txt`
3. **Actualizar versión**: Cambiar tanto en este archivo como en los archivos del plugin (`guiders-wp-plugin.php`)

---

## Validaciones Antes del Release

* [ ] Compilación exitosa del SDK (`npm run build`)
* [ ] Tests de funcionalidad pasando
* [ ] Verificación en navegadores principales
* [ ] Pruebas con diferentes configuraciones
* [ ] Documentación actualizada

