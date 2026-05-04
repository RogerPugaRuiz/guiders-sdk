# Story 3.3: Implementar ChatInput con typing indicator

**Epic:** Epic 3 — Header, presencia y typing indicator  
**Status:** Ready for Development  
**Depends on:** Story 3.2  
**Implements:** FR4, FR11, NFR7

---

## User Story

Como desarrollador del SDK,
quiero que el input de mensajes y el typing indicator funcionen con Preact,
para que el código sea declarativo y el comportamiento de debounce esté encapsulado en un hook reutilizable.

---

## Acceptance Criteria

**Given** que el visitante escribe en el textarea  
**When** han pasado 300ms desde la última tecla pulsada  
**Then** se envía `typing:start` al servidor via `PresenceService`

**Given** que el visitante deja de escribir  
**When** han pasado 2000ms de inactividad  
**Then** se envía `typing:stop` automáticamente

**Given** que el visitante hace click en enviar o pulsa Enter (sin Shift)  
**When** el mensaje no está vacío  
**Then** se llama `onSend(message)` y el textarea se vacía y resetea su altura

**Given** que el comercial está escribiendo (evento WebSocket recibido)  
**When** `isTypingSignal.value` es `true`  
**Then** `TypingIndicator` se muestra con animación de 3 dots

**Given** que el comercial deja de escribir  
**When** `isTypingSignal.value` es `false`  
**Then** `TypingIndicator` se oculta con fade-out

**Given** `ChatInput` con Preact  
**When** se mide el tamaño del bundle  
**Then** el comportamiento es idéntico al `ChatInputUI` original pero el código tiene < 200 líneas

---

## Technical Notes

### `ChatInput.tsx`
```tsx
interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const presenceService = presenceServiceSignal.value;
  const chatId = chatIdSignal.value;

  useTypingIndicator(presenceService, chatId);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = () => {
    const message = textareaRef.current?.value.trim();
    if (!message) return;
    onSend(message);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div class="guiders-input-area">
      <TypingIndicator />
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={handleSend}>Enviar</button>
    </div>
  );
}
```

### `hooks/useTypingIndicator.ts`
```typescript
export function useTypingIndicator(
  presenceService: PresenceService | null,
  chatId: string | null
) {
  const typingStartTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const sendTypingStart = useCallback(() => {
    if (!presenceService || !chatId) return;
    presenceService.sendTypingStart(chatId);
  }, [presenceService, chatId]);

  const sendTypingStop = useCallback(() => {
    if (!presenceService || !chatId) return;
    presenceService.sendTypingStop(chatId);
  }, [presenceService, chatId]);

  const handleTyping = useCallback(() => {
    clearTimeout(typingStartTimerRef.current);
    clearTimeout(typingStopTimerRef.current);

    typingStartTimerRef.current = setTimeout(sendTypingStart, 300);
    typingStopTimerRef.current = setTimeout(sendTypingStop, 2000);
  }, [sendTypingStart, sendTypingStop]);

  return { handleTyping };
}
```

### `TypingIndicator.tsx`
```tsx
// isTypingSignal: signal global que se actualiza vía WebSocket
export const isTypingSignal = signal<boolean>(false);

export function TypingIndicator() {
  const isTyping = isTypingSignal.value;
  if (!isTyping) return null;

  return (
    <div class="guiders-typing">
      <span /><span /><span />
    </div>
  );
}
```

### Add `isTypingSignal` to signals
- Añadir `isTypingSignal` a `src/presentation/signals/chatState.ts`
- `ChatUIBridge.setCommercialTyping(isTyping: boolean)` → `isTypingSignal.value = isTyping`

---

## Files to Create
- `src/presentation/components/ChatInput/ChatInput.tsx` (reemplaza placeholder)
- `src/presentation/components/ChatInput/ChatInput.styles.ts`
- `src/presentation/components/TypingIndicator/TypingIndicator.tsx`
- `src/presentation/components/TypingIndicator/TypingIndicator.styles.ts`
- `src/presentation/components/TypingIndicator/index.ts`
- `src/presentation/hooks/useTypingIndicator.ts`

## Files to Modify
- `src/presentation/signals/chatState.ts` — añadir `isTypingSignal`
- `src/presentation/bridge/ChatUIBridge.ts` — migrar métodos de typing

## Definition of Done
- [ ] Textarea con auto-resize hasta 120px
- [ ] Enter (sin Shift) envía el mensaje y limpia el textarea
- [ ] `typing:start` se envía con debounce de 300ms al escribir
- [ ] `typing:stop` se envía tras 2000ms de inactividad
- [ ] `TypingIndicator` aparece/desaparece según `isTypingSignal`
- [ ] Componente `ChatInput` < 200 líneas
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
