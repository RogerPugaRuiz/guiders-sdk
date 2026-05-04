# Story 2.2: Implementar ChatMessages y MessageBubble

**Epic:** Epic 2 — Widget principal funcional con Preact  
**Status:** Ready for Development  
**Depends on:** Story 2.1  
**Implements:** FR2 (parcial — mensajes), FR11, NFR6, NFR7, NFR8

---

## User Story

Como desarrollador del SDK,
quiero que la lista de mensajes se renderice reactivamente desde el signal de mensajes,
para que cada nuevo mensaje aparezca automáticamente sin manipulación DOM manual.

---

## Acceptance Criteria

**Given** `messagesSignal.value` contiene un array de mensajes  
**When** `ChatMessages` se renderiza  
**Then** se muestra un `MessageBubble` por cada mensaje, con separadores de fecha cuando el día cambia

**Given** un mensaje de tipo `sender: 'user'`  
**When** `MessageBubble` lo renderiza  
**Then** aplica las clases CSS de mensaje de usuario (alineado a la derecha, color de fondo configurado)

**Given** un mensaje de tipo `sender: 'other'`  
**When** `MessageBubble` lo renderiza  
**Then** aplica las clases CSS de mensaje del comercial (alineado a la izquierda)

**Given** un mensaje con `isSystem: true`  
**When** `MessageBubble` lo renderiza  
**Then** se muestra como mensaje de sistema (centrado, estilo diferente)

**Given** que `isLoadingInitialMessagesSignal.value` es `true`  
**When** `ChatMessages` se renderiza  
**Then** se muestra el `LoadingIndicator`

**Given** que se añade un nuevo mensaje a `messagesSignal`  
**When** Preact re-renderiza `ChatMessages`  
**Then** el contenedor hace scroll automático al último mensaje (via `useScrollToBottom` hook)

---

## Technical Notes

### `ChatMessages.tsx`
```tsx
export function ChatMessages() {
  const messages = messagesSignal.value;
  const isLoading = isLoadingInitialMessagesSignal.value;
  const containerRef = useRef<HTMLDivElement>(null);

  useScrollToBottom(containerRef, messages);

  if (isLoading) return <LoadingIndicator />;

  return (
    <div class="guiders-messages" ref={containerRef}>
      {renderMessagesWithDateSeparators(messages)}
    </div>
  );
}
```

### `MessageBubble.tsx`
```tsx
interface MessageBubbleProps {
  message: RenderedMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const html = MessageRenderer.render(message);
  // Determinar clase CSS según sender e isSystem
  return (
    <div
      class={getMessageClass(message)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

### `hooks/useScrollToBottom.ts`
```typescript
export function useScrollToBottom(
  containerRef: RefObject<HTMLElement>,
  deps: unknown[]
) {
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, deps);
}
```

### Date separators
- `renderMessagesWithDateSeparators(messages)` agrupa mensajes por día
- Inserta un `<DateSeparator date={date} />` entre mensajes de días distintos
- La lógica de formateo de fecha se migra de `chat-ui.ts`

### MessageRenderer
- `MessageRenderer.render()` de `utils/message-renderer.ts` se usa sin cambios
- Usar `dangerouslySetInnerHTML` para el HTML generado

---

## Files to Create
- `src/presentation/components/ChatMessages/ChatMessages.tsx` (reemplaza placeholder)
- `src/presentation/components/ChatMessages/MessageBubble.tsx`
- `src/presentation/components/ChatMessages/DateSeparator.tsx`
- `src/presentation/components/ChatMessages/LoadingIndicator.tsx`
- `src/presentation/hooks/useScrollToBottom.ts`
- `src/presentation/hooks/index.ts` (barrel)

## Definition of Done
- [ ] `ChatMessages` renderiza mensajes desde `messagesSignal`
- [ ] `MessageBubble` aplica clases CSS correctas según tipo de mensaje
- [ ] Scroll automático funciona al añadir mensajes
- [ ] Separadores de fecha se insertan correctamente
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
