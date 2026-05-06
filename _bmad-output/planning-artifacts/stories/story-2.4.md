# Story 2.4: Implementar ConsentBanner con Preact

**Epic:** Epic 2 — Widget principal funcional con Preact  
**Status:** Done  
**Depends on:** Story 2.3  
**Implements:** FR7, FR11

---

## User Story

Como desarrollador del SDK,
quiero que el banner de consentimiento GDPR use Preact,
para que sea declarativo y fácil de mantener.

---

## Acceptance Criteria

**Given** que `ConsentBanner.tsx` se monta en `document.body`  
**When** el SDK detecta que el consentimiento está pendiente  
**Then** se muestra el banner correctamente fuera del Shadow DOM del widget

**Given** el estilo `bottom_bar`  
**When** el banner se renderiza  
**Then** aparece como barra fija en la parte inferior de la pantalla

**Given** el estilo `modal`  
**When** el banner se renderiza  
**Then** aparece como modal centrado con overlay

**Given** que el usuario hace click en "Aceptar"  
**When** se ejecuta el callback `onAccept`  
**Then** el banner desaparece y el SDK continúa su inicialización

**Given** que el usuario hace click en "Rechazar"  
**When** se ejecuta el callback `onDeny`  
**Then** el banner desaparece y el SDK no inicializa el tracking

---

## Technical Notes

### `mountConsentBanner` function
```typescript
export function mountConsentBanner(
  config: ConsentBannerConfig,
  callbacks: { onAccept: () => void; onDeny: () => void }
): () => void {
  const mountPoint = document.createElement('div');
  mountPoint.id = 'guiders-consent-banner';
  document.body.appendChild(mountPoint);

  render(
    <ConsentBanner config={config} {...callbacks} />,
    mountPoint
  );

  // Returns cleanup function
  return () => {
    render(null, mountPoint);
    mountPoint.remove();
  };
}
```

### `ConsentBanner.tsx`
```tsx
interface ConsentBannerProps {
  config: ConsentBannerConfig;
  onAccept: () => void;
  onDeny: () => void;
}

export function ConsentBanner({ config, onAccept, onDeny }: ConsentBannerProps) {
  const style = config.style ?? 'bottom_bar'; // 'bottom_bar' | 'modal' | 'corner'
  return (
    <div class={`guiders-consent guiders-consent--${style}`}>
      <style>{getConsentStyles(config)}</style>
      <p>{config.message}</p>
      <button onClick={onAccept}>{config.acceptText}</button>
      <button onClick={onDeny}>{config.denyText}</button>
    </div>
  );
}
```

### CSS
- Estilos migrados de `consent-banner-ui.ts` a `ConsentBanner.styles.ts`
- Los 3 estilos (`bottom_bar`, `modal`, `corner`) implementados como clases CSS
- El banner monta **fuera** del Shadow DOM — estilos deben ser globales o inyectados en el `mountPoint`

### `ChatUIBridge` integration
- `ChatUIBridge.showConsentBanner(config, callbacks)` llama a `mountConsentBanner`
- La función de limpieza se guarda y se llama cuando el banner ya no es necesario

---

## Files to Create
- `src/presentation/components/ConsentBanner/ConsentBanner.tsx`
- `src/presentation/components/ConsentBanner/ConsentBanner.styles.ts`
- `src/presentation/components/ConsentBanner/index.ts`

## Files to Modify
- `src/presentation/bridge/ChatUIBridge.ts` — migrar `showConsentBanner()` a Preact

## Definition of Done
- [ ] `ConsentBanner` monta en `document.body` fuera del Shadow DOM
- [ ] Los 3 estilos (`bottom_bar`, `modal`, `corner`) se renderizan correctamente
- [ ] Callbacks `onAccept` y `onDeny` funcionan y el banner desaparece
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
