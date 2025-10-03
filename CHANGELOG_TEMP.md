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
- `.github/copilot-instructions.md` - Documentación del flujo

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

