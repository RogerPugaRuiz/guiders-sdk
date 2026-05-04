# Story 2.3: Conectar ChatUIBridge al widget Preact

**Epic:** Epic 2 — Widget principal funcional con Preact  
**Status:** Ready for Development  
**Depends on:** Story 2.2  
**Implements:** FR2 (completo — apertura, cierre, mensajes), FR11

---

## User Story

Como desarrollador del SDK,
quiero que el bridge monte el widget Preact en lugar de delegar en el `ChatUI` original,
para que la UI del chat esté completamente gestionada por Preact.

---

## Acceptance Criteria

**Given** que `ChatUIBridge.init()` se llama desde `TrackingPixelSDK`  
**When** se ejecuta  
**Then** llama a `mountChatWidget()` (Preact) en lugar de `this._chatUI.init()`

**Given** que `ChatUIBridge.show()` se llama  
**When** se ejecuta  
**Then** `isVisibleSignal.value = true` y el widget Preact se muestra

**Given** que `ChatUIBridge.hide()` se llama  
**When** se ejecuta  
**Then** `isVisibleSignal.value = false` y el widget Preact se oculta

**Given** que `ChatUIBridge.renderChatMessage(params)` se llama  
**When** se ejecuta  
**Then** añade el mensaje a `messagesSignal` y `ChatMessages` lo renderiza automáticamente

**Given** que `ChatUIBridge.clearMessages()` se llama  
**When** se ejecuta  
**Then** `messagesSignal` queda vacío (preservando mensajes de sistema y consentimiento)

**Given** los tests E2E  
**When** se ejecutan con el bridge conectado a Preact  
**Then** todos los tests pasan

---

## Technical Notes

### Cambios en `ChatUIBridge.ts`
En esta story se **corta la delegación** para los métodos de visibilidad y mensajes:

```typescript
// ANTES (Story 1.3 - delegante puro)
show(): void { return this._chatUI.show(); }

// DESPUÉS (Story 2.3 - conectado a Preact)
show(): void { isVisibleSignal.value = true; }
```

### Métodos a migrar del delegante a Preact:
- `init()` → llama `mountChatWidget()`, guarda referencia al `shadowHost`
- `show()` / `hide()` → escribe `isVisibleSignal`
- `renderChatMessage(params)` → añade a `messagesSignal`
- `clearMessages()` → resetea `messagesSignal` (preservar system/consent messages)
- `setMessagesLoading(bool)` → escribe `isLoadingInitialMessagesSignal`
- `setChatId(id)` / `setVisitorId(id)` → escribe signals correspondientes

### Métodos que siguen delegando en `_chatUI` (migrar en epics 3/4):
- Header / commercial info methods
- Presence methods
- Chat list view methods
- Typing indicator methods

### Verificación manual obligatoria
Antes de marcar como completado, verificar en el navegador:
1. El widget abre y cierra correctamente
2. Los mensajes se renderizan con las burbujas correctas
3. El scroll automático funciona
4. La consola no muestra errores

---

## Files to Modify
- `src/presentation/bridge/ChatUIBridge.ts` — migrar métodos de visibilidad y mensajes

## Definition of Done
- [ ] `init()` monta el widget Preact vía `mountChatWidget()`
- [ ] `show()` / `hide()` controlan `isVisibleSignal`
- [ ] `renderChatMessage()` añade a `messagesSignal`
- [ ] `clearMessages()` limpia `messagesSignal` correctamente
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
- [ ] Verificación manual en navegador: widget abre, cierra y muestra mensajes
