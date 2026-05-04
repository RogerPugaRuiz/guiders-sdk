# Story 1.3: Implementar ChatUIBridge delegante

**Epic:** Epic 1 — Preparación del toolchain y fundamentos  
**Status:** Ready for Development  
**Depends on:** Story 1.2  
**Implements:** FR1, FR11

---

## User Story

Como desarrollador del SDK,
quiero que `TrackingPixelSDK` use `ChatUIBridge` en lugar de `ChatUI` directamente,
para que la migración a Preact sea transparente y no requiera modificar `TrackingPixelSDK`.

---

## Acceptance Criteria

**Given** que se crea `src/presentation/bridge/ChatUIBridge.ts`  
**When** `TrackingPixelSDK` instancia `ChatUI` (que ahora es `ChatUIBridge`)  
**Then** el comportamiento del widget es idéntico al anterior — `ChatUIBridge` delega todos los métodos en la instancia interna de `ChatUI` original

**Given** `src/presentation/index.ts`  
**When** se actualiza para exportar `ChatUIBridge as ChatUI`  
**Then** `TrackingPixelSDK` no necesita ningún cambio de importación

**Given** los 55 métodos públicos del contrato  
**When** se verifica el tipo de `ChatUIBridge`  
**Then** TypeScript confirma que implementa exactamente la misma interfaz que `ChatUI` (usar `implements` o verificación de tipos explícita)

**Given** los tests E2E  
**When** se ejecutan con el bridge delegante activo  
**Then** todos los tests pasan

**Given** el bundle compilado  
**When** se verifica el tamaño  
**Then** el bundle no aumenta significativamente (el bridge es un wrapper delgado)

---

## Technical Notes

### Approach
En esta Fase 1, el bridge es un **wrapper puro delegante**:

```typescript
export class ChatUIBridge {
  private _chatUI: ChatUI;

  constructor(options: ChatUIOptions = {}) {
    this._chatUI = new ChatUI(options);
  }

  // Cada método delega en _chatUI
  init(): void { return this._chatUI.init(); }
  show(): void { return this._chatUI.show(); }
  hide(): void { return this._chatUI.hide(); }
  // ... todos los métodos
}
```

### Propiedades con getter/setter (delegación bidireccional)
```typescript
get onChatSwitch() { return this._chatUI.onChatSwitch; }
set onChatSwitch(value) { this._chatUI.onChatSwitch = value; }
```

### `src/presentation/index.ts`
```typescript
// Añadir re-export con alias para que TrackingPixelSDK no necesite cambios
export { ChatUIBridge as ChatUI } from './bridge/ChatUIBridge';
// Mantener la exportación original de ChatUI para uso interno
export { ChatUI as ChatUIOriginal } from './components/chat-ui';
```

### Identificar los 55 métodos
Buscar en `src/core/tracking-pixel-SDK.ts` todas las llamadas a `this.chatUI.` para obtener la lista completa de métodos y propiedades públicas requeridos.

---

## Files to Create
- `src/presentation/bridge/ChatUIBridge.ts`

## Files to Modify
- `src/presentation/index.ts`

## Definition of Done
- [ ] `ChatUIBridge` creado e implementa todos los métodos del contrato de `ChatUI`
- [ ] `src/presentation/index.ts` exporta `ChatUIBridge as ChatUI`
- [ ] `TrackingPixelSDK` no modificado
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan con el bridge activo
- [ ] Bundle size no aumenta significativamente respecto al baseline
