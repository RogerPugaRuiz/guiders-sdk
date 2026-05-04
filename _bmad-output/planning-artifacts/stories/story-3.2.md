# Story 3.2: Implementar PresenceIndicator y OfflineBanner

**Epic:** Epic 3 — Header, presencia y typing indicator  
**Status:** Ready for Development  
**Depends on:** Story 3.1  
**Implements:** FR3 (presencia), FR8, FR11

---

## User Story

Como desarrollador del SDK,
quiero que el indicador de presencia y el banner offline reaccionen automáticamente al estado del comercial,
para que el visitante siempre vea el estado correcto sin lógica imperativa.

---

## Acceptance Criteria

**Given** que `presenceStatusSignal.value` es `'online'`  
**When** `PresenceIndicator` se renderiza  
**Then** muestra el dot verde de online en el avatar

**Given** que `presenceStatusSignal.value` es `'offline'`  
**When** `PresenceIndicator` se renderiza  
**Then** muestra el dot gris de offline

**Given** que `showOfflineBannerSignal.value` es `true` y `offlineBannerEnabledSignal.value` es `true`  
**When** `OfflineBanner` se renderiza  
**Then** muestra el banner de estado offline debajo del header

**Given** que `ChatUIBridge.setPresenceService(presenceService)` se llama  
**When** el comercial cambia su estado a online  
**Then** `presenceStatusSignal.value` se actualiza y los componentes reaccionan

**Given** que `ChatUIBridge.setShowOfflineBanner(false)` se llama  
**When** se ejecuta  
**Then** `offlineBannerEnabledSignal.value = false` y el banner nunca se muestra

---

## Technical Notes

### `PresenceIndicator.tsx`
```tsx
export function PresenceIndicator() {
  const status = presenceStatusSignal.value;

  return (
    <span
      class={`guiders-presence guiders-presence--${status}`}
      aria-label={status}
    />
  );
}
```
- Dot verde para `'online'`, gris para `'offline'`
- CSS en `PresenceIndicator.styles.ts`

### `OfflineBanner.tsx`
```tsx
export function OfflineBanner() {
  const show = showOfflineBannerSignal.value;
  const enabled = offlineBannerEnabledSignal.value;

  if (!show || !enabled) return null;

  return (
    <div class="guiders-offline-banner">
      {/* Mensaje configurado en options */}
    </div>
  );
}
```

### `hooks/usePresence.ts`
```typescript
export function usePresence() {
  useEffect(() => {
    const service = presenceServiceSignal.value;
    if (!service) return;

    const unsubscribe = service.onStatusChange((status) => {
      presenceStatusSignal.value = status;
    });

    return unsubscribe;
  }, [presenceServiceSignal.value]);
}
```
- El hook se llama dentro de `ChatWidget` cuando el widget está montado
- Gestiona la suscripción al `PresenceService` y la limpia en unmount

### `ChatUIBridge` integration
```typescript
setPresenceService(service: PresenceService): void {
  presenceServiceSignal.value = service;
}

setShowOfflineBanner(show: boolean): void {
  showOfflineBannerSignal.value = show;
}

setOfflineBannerEnabled(enabled: boolean): void {
  offlineBannerEnabledSignal.value = enabled;
}
```

---

## Files to Create
- `src/presentation/components/PresenceIndicator/PresenceIndicator.tsx`
- `src/presentation/components/PresenceIndicator/PresenceIndicator.styles.ts`
- `src/presentation/components/PresenceIndicator/index.ts`
- `src/presentation/components/OfflineBanner/OfflineBanner.tsx` (reemplaza placeholder)
- `src/presentation/components/OfflineBanner/OfflineBanner.styles.ts`
- `src/presentation/hooks/usePresence.ts`

## Files to Modify
- `src/presentation/components/ChatHeader/CommercialAvatar.tsx` — integrar `PresenceIndicator`
- `src/presentation/components/ChatWidget/ChatWidget.tsx` — llamar `usePresence()`
- `src/presentation/bridge/ChatUIBridge.ts` — migrar métodos de presencia

## Definition of Done
- [ ] `PresenceIndicator` muestra dot online/offline según `presenceStatusSignal`
- [ ] `OfflineBanner` aparece y desaparece reactivamente
- [ ] `usePresence` hook gestiona suscripción al `PresenceService`
- [ ] `setPresenceService()` conecta el servicio con los signals
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
