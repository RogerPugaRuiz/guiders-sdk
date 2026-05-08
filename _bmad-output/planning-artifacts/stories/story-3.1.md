# Story 3.1: Implementar ChatHeader reactivo

**Epic:** Epic 3 — Header, presencia y typing indicator  
**Status:** Done  
**Depends on:** Story 2.4  
**Implements:** FR3 (parcial — header y comercial), FR11

---

## User Story

Como desarrollador del SDK,
quiero que el header del chat muestre la información del comercial y se actualice automáticamente,
para que cuando se asigna un comercial a la conversación el header refleje el cambio sin manipulación DOM.

---

## Acceptance Criteria

**Given** que `chatDetailSignal.value` es `null`  
**When** `ChatHeader` se renderiza  
**Then** muestra el título por defecto configurado en `options`

**Given** que `chatDetailSignal.value.assignedCommercial` contiene datos del comercial  
**When** `ChatHeader` se renderiza  
**Then** muestra el nombre del comercial y su avatar (`CommercialAvatar`)

**Given** que `ChatUIBridge.updateHeaderWithCommercial(commercial, newStatus)` se llama  
**When** se ejecuta  
**Then** actualiza `chatDetailSignal` y `lastKnownChatStatusSignal`, y `ChatHeader` se re-renderiza automáticamente

**Given** que `chatSelectorConfig.enabled` es `true`  
**When** `ChatHeader` se renderiza  
**Then** muestra el botón de flecha atrás

**Given** que se hace click en el botón de flecha atrás  
**When** el evento se dispara  
**Then** se llama `showChatListView()` que actualiza `isShowingChatListSignal`

---

## Technical Notes

### `ChatHeader.tsx`
```tsx
interface ChatHeaderProps {
  options: ChatWidgetOptions;
  onClose: () => void;
}

export function ChatHeader({ options, onClose }: ChatHeaderProps) {
  const chatDetail = chatDetailSignal.value;
  const hasCommercial = hasAssignedCommercialSignal.value;
  const commercial = chatDetail?.assignedCommercial;

  return (
    <div class="guiders-header">
      {options.chatSelector?.enabled && (
        <button class="guiders-back-btn" onClick={() => {
          isShowingChatListSignal.value = true;
        }}>
          ←
        </button>
      )}
      {hasCommercial ? (
        <CommercialAvatar
          name={commercial!.name}
          avatarUrl={commercial!.avatarUrl}
          initials={generateInitials(commercial!.name)}
        />
      ) : (
        <span class="guiders-title">{options.title ?? 'Chat'}</span>
      )}
      <button class="guiders-close-btn" onClick={onClose}>✕</button>
    </div>
  );
}
```

### `CommercialAvatar.tsx`
```tsx
interface CommercialAvatarProps {
  name: string;
  avatarUrl?: string;
  initials: string;
}

export function CommercialAvatar({ name, avatarUrl, initials }: CommercialAvatarProps) {
  return (
    <div class="guiders-commercial">
      <div class="guiders-avatar">
        {avatarUrl
          ? <img src={avatarUrl} alt={name} />
          : <span>{initials}</span>
        }
        <PresenceIndicator />
      </div>
      <span class="guiders-commercial-name">{name}</span>
    </div>
  );
}
```

### `generateInitials`
- Usar `generateInitials()` de `utils/chat-utils.ts` sin cambios

### `ChatUIBridge` integration
```typescript
updateHeaderWithCommercial(commercial: AssignedCommercial, status: ChatStatus): void {
  chatDetailSignal.value = {
    ...chatDetailSignal.value,
    assignedCommercial: commercial
  };
  lastKnownChatStatusSignal.value = status;
}
```

---

## Files to Create
- `src/presentation/components/ChatHeader/ChatHeader.tsx` (reemplaza placeholder)
- `src/presentation/components/ChatHeader/CommercialAvatar.tsx`
- `src/presentation/components/ChatHeader/ChatHeader.styles.ts`

## Files to Modify
- `src/presentation/bridge/ChatUIBridge.ts` — migrar métodos de header

## Definition of Done
- [ ] `ChatHeader` muestra título por defecto cuando no hay comercial asignado
- [ ] `ChatHeader` muestra `CommercialAvatar` cuando hay comercial asignado
- [ ] `updateHeaderWithCommercial()` actualiza signals y UI reacciona
- [ ] Botón de flecha atrás visible cuando `chatSelector.enabled` es `true`
- [ ] Click en flecha atrás actualiza `isShowingChatListSignal`
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
