# 🔧 Endpoints Opcionales del Chat

## 📋 Problema Resuelto

El SDK intentaba llamar a endpoints del backend que no están implementados, causando errores en consola:

```
❌ PUT /api/v2/chats/{id}/open → 404 (Not Found)
❌ PUT /api/v2/chats/{id}/close → 501 (Not Implemented)
```

Estos errores **NO bloqueaban** el funcionamiento del chat, pero generaban ruido en la consola y confusión.

---

## ✅ Solución Implementada

Los endpoints `/open` y `/close` ahora son **completamente opcionales**:

### Comportamiento Anterior (Problemático)

```typescript
// ❌ Lanzaba excepción si el endpoint no existía
async openChat(chatId: string): Promise<ChatV2> {
  const response = await fetch(`${url}/${chatId}/open`, ...);

  if (!response.ok) {
    throw new Error(`Error al abrir chat (${response.status})`);
    // ↑ Esto causaba errores en consola incluso con try-catch
  }

  return await response.json();
}
```

### Comportamiento Nuevo (Correcto)

```typescript
// ✅ Retorna null silenciosamente si el endpoint no está disponible
async openChat(chatId: string): Promise<ChatV2 | null> {
  try {
    const response = await fetch(`${url}/${chatId}/open`, ...);

    // Endpoints opcionales: 404 (no existe) o 501 (no implementado)
    if (response.status === 404 || response.status === 501) {
      console.warn('⚠️ Endpoint /open no disponible - continuando sin sincronizar');
      return null; // ← NO lanza excepción
    }

    if (!response.ok) {
      throw new Error(`Error al abrir chat (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    // Errores de red también son no-críticos
    if (error instanceof TypeError) {
      console.warn('⚠️ No se pudo conectar al endpoint /open');
      return null;
    }
    throw error;
  }
}
```

---

## 🎯 Endpoints Afectados

### 1. PUT /api/v2/chats/:chatId/open

**Propósito**: Notificar al backend que el visitante abrió el chat.

**Uso en el SDK**:
```typescript
// tracking-pixel-SDK.ts:668
try {
  await ChatV2Service.getInstance().openChat(chatId);
  debugLog("✅ Chat abierto en backend");
} catch (error) {
  console.error("❌ Error al abrir chat en backend:", error);
}
```

**Códigos de respuesta manejados**:
- `200 OK` → Chat sincronizado correctamente ✅
- `404 Not Found` → Endpoint no existe (⚠️ warning, continúa)
- `501 Not Implemented` → Endpoint no implementado (⚠️ warning, continúa)
- Otros errores → Se propagan (❌ error crítico)

**Impacto si no está disponible**:
- ❌ El backend NO sabrá cuándo el visitante abre el chat
- ✅ El chat funciona normalmente en el frontend
- ✅ Los mensajes se envían y reciben correctamente
- ✅ La presencia del visitante sigue funcionando (heartbeats)

---

### 2. PUT /api/v2/chats/:chatId/close

**Propósito**: Notificar al backend que el visitante cerró el chat.

**Uso en el SDK**:
```typescript
// tracking-pixel-SDK.ts:705 (aproximado)
try {
  await ChatV2Service.getInstance().closeChat(chatId);
  debugLog("✅ Chat cerrado en backend");
} catch (error) {
  console.error("❌ Error al cerrar chat en backend:", error);
}
```

**Códigos de respuesta manejados**:
- `200 OK` → Chat sincronizado correctamente ✅
- `404 Not Found` → Endpoint no existe (⚠️ warning, continúa)
- `501 Not Implemented` → Endpoint no implementado (⚠️ warning, continúa)
- Otros errores → Se propagan (❌ error crítico)

**Impacto si no está disponible**:
- ❌ El backend NO sabrá cuándo el visitante cierra el chat
- ✅ El chat funciona normalmente en el frontend
- ✅ Los mensajes siguen funcionando
- ✅ La presencia del visitante sigue funcionando

---

## 🔍 ¿Para Qué Sirven Estos Endpoints?

### Sincronización de Estado del Chat

Estos endpoints permiten al **backend** saber cuándo el visitante tiene el chat **abierto** o **cerrado** en su navegador.

**Casos de uso**:
1. **Métricas y Analytics**:
   - Tiempo promedio que el chat está abierto
   - Tasa de abandono del chat
   - Engagement del visitante con el chat

2. **Optimización de Notificaciones**:
   - No enviar notificaciones push si el chat está abierto
   - Priorizar respuestas a visitantes con chat abierto

3. **Estados Avanzados de Presencia**:
   - Diferenciar entre "visitante online" y "visitante con chat abierto"
   - Mostrar indicador especial en el dashboard del comercial

4. **Auto-asignación Inteligente**:
   - Asignar comerciales solo a chats que el visitante tiene abiertos
   - Evitar asignar chats que el visitante cerró hace mucho

**PERO**: Estos son **features avanzados**. El chat básico funciona perfectamente sin ellos.

---

## 📊 Logs en Consola

### Antes (Errores Ruidosos)

```
❌ [ChatV2Service] Error al abrir chat: {"message":"Cannot PUT ...","error":"Not Found"}
❌ [TrackingPixelSDK] Error al abrir chat en backend: Error: Error al abrir chat (404)
❌ [ChatV2Service] Error al cerrar chat: {"statusCode":501,"message":"Funcionalidad no implementada"}
❌ [TrackingPixelSDK] Error al cerrar chat en backend: Error: Error al cerrar chat (501)
```

### Después (Warnings Silenciosos)

```
⚠️ [ChatV2Service] Endpoint /open no disponible (404) - continuando sin sincronizar estado
⚠️ [ChatV2Service] Endpoint /close no disponible (501) - continuando sin sincronizar estado
```

**Beneficios**:
- ✅ Menos ruido en la consola
- ✅ Más claro que no es un error crítico
- ✅ Fácil de filtrar en herramientas de monitoreo
- ✅ Desarrolladores saben que es esperado

---

## 🛠️ Implementación en el Backend (Opcional)

Si quieres implementar estos endpoints en el backend:

### Endpoint: PUT /api/v2/chats/:chatId/open

```typescript
// Backend (NestJS, Express, etc.)
app.put('/api/v2/chats/:chatId/open', async (req, res) => {
  const { chatId } = req.params;
  const visitorId = req.headers['x-guiders-sid'] || req.cookies['guiders_session_id'];

  // Actualizar timestamp de última vez que el chat estuvo abierto
  await updateChatMetadata(chatId, {
    lastOpenedAt: new Date(),
    isCurrentlyOpen: true,
    openedBy: visitorId
  });

  // Opcional: Emitir evento WebSocket al comercial
  socket.to(`commercial:${commercialId}`).emit('visitor:chat-opened', {
    chatId,
    visitorId,
    timestamp: new Date()
  });

  // Retornar el chat actualizado
  const chat = await getChat(chatId);
  res.json(chat);
});
```

### Endpoint: PUT /api/v2/chats/:chatId/close

```typescript
// Backend (NestJS, Express, etc.)
app.put('/api/v2/chats/:chatId/close', async (req, res) => {
  const { chatId } = req.params;
  const visitorId = req.headers['x-guiders-sid'] || req.cookies['guiders_session_id'];

  // Actualizar timestamp de cierre
  await updateChatMetadata(chatId, {
    lastClosedAt: new Date(),
    isCurrentlyOpen: false,
    closedBy: visitorId
  });

  // Opcional: Calcular duración de la sesión
  const chat = await getChat(chatId);
  if (chat.lastOpenedAt) {
    const sessionDuration = Date.now() - chat.lastOpenedAt.getTime();
    await saveChatMetric(chatId, {
      type: 'session_duration',
      value: sessionDuration,
      timestamp: new Date()
    });
  }

  // Opcional: Emitir evento WebSocket al comercial
  socket.to(`commercial:${commercialId}`).emit('visitor:chat-closed', {
    chatId,
    visitorId,
    timestamp: new Date()
  });

  res.json(chat);
});
```

---

## ✅ Checklist de Compatibilidad

### Frontend (SDK) - ✅ Ya Compatible

- ✅ Endpoints `/open` y `/close` son opcionales
- ✅ Errores 404 y 501 se manejan silenciosamente
- ✅ Chat funciona sin estos endpoints
- ✅ Mensajes se envían y reciben correctamente
- ✅ Presencia sigue funcionando
- ✅ Logs claros con warnings en lugar de errores

### Backend - Implementación Opcional

**Si NO implementas estos endpoints**:
- ⚠️ Verás warnings en la consola del navegador (esperado)
- ✅ El chat funcionará perfectamente
- ❌ No tendrás métricas de apertura/cierre del chat
- ❌ No podrás diferenciar "chat abierto" vs "visitante online"

**Si SÍ implementas estos endpoints**:
- ✅ No habrá warnings en la consola
- ✅ Tendrás métricas avanzadas de uso del chat
- ✅ Podrás implementar features avanzados (notificaciones inteligentes, etc.)
- ✅ Mejor experiencia para el comercial (sabe cuándo el visitante tiene el chat abierto)

---

## 🎯 Recomendaciones

### Para Desarrollo/Testing

**NO implementar estos endpoints inicialmente**:
- ✅ Simplifica el desarrollo
- ✅ Un endpoint menos que mantener
- ✅ El chat funciona perfectamente sin ellos
- ✅ Los warnings son informativos, no problemáticos

### Para Producción

**Evaluar si necesitas implementarlos**:

**Implementar SI**:
- ✅ Quieres métricas detalladas de uso del chat
- ✅ Necesitas optimizar notificaciones push
- ✅ Quieres features avanzados de presencia
- ✅ Tienes comerciales que necesitan saber si el visitante tiene el chat abierto

**NO implementar SI**:
- ✅ Solo necesitas funcionalidad básica de chat
- ✅ Prefieres simplicidad sobre métricas avanzadas
- ✅ El sistema de heartbeats de presencia es suficiente
- ✅ Tienes presupuesto/tiempo limitado

---

## 📝 Changelog

### v1.6.1 (2025-11-14)

**🔧 Cambios**:
- Endpoints `/open` y `/close` ahora son completamente opcionales
- Errores 404 y 501 se manejan con warnings en lugar de excepciones
- Chat funciona sin necesidad de implementar estos endpoints en el backend
- Logs más claros y menos ruidosos en la consola

**📄 Archivos modificados**:
- `src/services/chat-v2-service.ts:227-262` - Método `openChat()`
- `src/services/chat-v2-service.ts:264-304` - Método `closeChat()`

**🎯 Impacto**:
- ✅ Reduce ruido en la consola
- ✅ Facilita desarrollo y testing
- ✅ Backend puede implementar endpoints a su propio ritmo
- ✅ No afecta funcionalidad existente del chat

---

## 🔗 Referencias

- **Guía de presencia**: `PRESENCE_INDEPENDENCE.md`
- **Estado AWAY**: `AWAY_STATUS_SOLUTION.md`
- **Chat API v2**: `README_V2.md`
- **Migración API**: `MIGRATION_GUIDE_V2.md`

---

**Última actualización**: 2025-11-14
**Versión del SDK**: 1.6.1
**Estado**: Endpoints opcionales implementados ✅
