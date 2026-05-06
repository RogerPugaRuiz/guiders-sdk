# Story 4.1: Implementar QuickActions con Preact

**Epic:** Epic 4 — Features secundarias — Quick Actions y Chat List View  
**Status:** Done  
**Depends on:** Story 3.3  
**Implements:** FR5, FR11

---

## User Story

Como desarrollador del SDK,
quiero que los botones de Quick Actions funcionen con Preact,
para que su configuración sea declarativa y el estado de visibilidad sea local al componente.

---

## Acceptance Criteria

**Given** que `quickActionsConfig.enabled` es `true` y hay botones configurados  
**When** `QuickActions` se renderiza  
**Then** muestra el mensaje de bienvenida y los botones

**Given** un botón con `action.type: 'send_message'`  
**When** el visitante hace click  
**Then** se llama `onSend(message, metadata)` y los botones desaparecen

**Given** un botón con `action.type: 'open_url'`  
**When** el visitante hace click  
**Then** se abre la URL en nueva pestaña con `noopener,noreferrer` y los botones desaparecen

**Given** un botón con `action.type: 'request_agent'`  
**When** el visitante hace click  
**Then** se llama `onRequestAgent()` y los botones desaparecen

**Given** que `onTrackQuickAction` está configurado en el bridge  
**When** cualquier botón es clickado  
**Then** se llama `onTrackQuickAction` con los datos del botón

**Given** que los botones desaparecen tras un click  
**When** el usuario reabre el chat  
**Then** los botones NO se muestran de nuevo (estado local `hidden` persiste mientras el componente está montado)

---

## Technical Notes

### `QuickActions.tsx`
```tsx
interface QuickActionsProps {
  config: QuickActionsConfig;
  onSend: (message: string, metadata?: Record<string, unknown>) => void;
  onRequestAgent: () => void;
  onTrackQuickAction?: (button: QuickActionButton) => void;
}

export function QuickActions({ config, onSend, onRequestAgent, onTrackQuickAction }: QuickActionsProps) {
  const [hidden, setHidden] = useState(false);

  if (hidden || !config.enabled) return null;

  const handleClick = (button: QuickActionButton) => {
    onTrackQuickAction?.(button);
    setHidden(true);

    switch (button.action.type) {
      case 'send_message':
        onSend(button.action.message, button.action.metadata);
        break;
      case 'open_url':
        window.open(button.action.url, '_blank', 'noopener,noreferrer');
        break;
      case 'request_agent':
        onRequestAgent();
        break;
    }
  };

  return (
    <div class="guiders-quick-actions">
      {config.welcomeMessage && (
        <p class="guiders-quick-actions__welcome">{config.welcomeMessage}</p>
      )}
      {config.buttons.map((button) => (
        <button
          key={button.id}
          class="guiders-quick-actions__btn"
          onClick={() => handleClick(button)}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
```

### State management
- El estado `hidden` es **local** al componente (`useState`) — no necesita signal global
- Se resetea solo cuando el componente se desmonta y vuelve a montar (ej. al cerrar y abrir el widget con re-mount)

### Integration in `ChatWidget`
- `ChatWidget` recibe los callbacks del bridge como props al montarse via `mountChatWidget(options, callbacks)`
- Renderiza `<QuickActions>` sobre `<ChatMessages>` cuando los botones no están ocultos

---

## Files to Create
- `src/presentation/components/QuickActions/QuickActions.tsx`
- `src/presentation/components/QuickActions/QuickActions.styles.ts`
- `src/presentation/components/QuickActions/index.ts`

## Files to Modify
- `src/presentation/components/ChatWidget/ChatWidget.tsx` — integrar `QuickActions`
- `src/presentation/bridge/ChatUIBridge.ts` — migrar configuración de Quick Actions

## Definition of Done
- [ ] `QuickActions` renderiza botones desde la config
- [ ] Los 3 tipos de acción funcionan (`send_message`, `open_url`, `request_agent`)
- [ ] `onTrackQuickAction` se llama en cada click
- [ ] Los botones desaparecen tras el primer click y no vuelven en la misma sesión del componente
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
