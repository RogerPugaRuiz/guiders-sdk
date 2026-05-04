# Story 2.1: Crear estructura de componentes y ChatWidget

**Epic:** Epic 2 — Widget principal funcional con Preact  
**Status:** Ready for Development  
**Depends on:** Story 1.3  
**Implements:** FR10, FR11, NFR7

---

## User Story

Como desarrollador del SDK,
quiero que el widget de chat se monte usando Preact y Shadow DOM,
para que los estilos estén encapsulados y el widget sea reactivo.

---

## Acceptance Criteria

**Given** que se crea la estructura de carpetas en `src/presentation/components/`  
**When** se ejecuta `npm run build`  
**Then** compila sin errores con todos los componentes nuevos

**Given** `src/presentation/components/ChatWidget/ChatWidget.tsx`  
**When** se llama a `mountChatWidget(options, resolvedPosition)`  
**Then** se crea un Shadow Host en `document.body`, se adjunta un Shadow Root, se inyectan los estilos CSS y se renderiza `<ChatWidget />` con Preact

**Given** que `isVisibleSignal.value` cambia a `true`  
**When** Preact re-renderiza `ChatWidget`  
**Then** el widget es visible en el DOM (sin `display: none`)

**Given** que `isVisibleSignal.value` cambia a `false`  
**When** Preact re-renderiza `ChatWidget`  
**Then** el widget está oculto

**Given** los tests E2E  
**When** se ejecutan (el bridge aún delega en ChatUI original en esta story)  
**Then** todos los tests pasan

---

## Technical Notes

### Estructura de carpetas a crear
```
src/presentation/
  components/
    ChatWidget/
      ChatWidget.tsx
      ChatWidget.styles.ts
      index.ts
    ChatHeader/
      ChatHeader.tsx          ← placeholder vacío
      ChatHeader.styles.ts
      index.ts
    ChatMessages/
      ChatMessages.tsx        ← placeholder vacío
      index.ts
    ChatInput/
      ChatInput.tsx           ← placeholder vacío
      index.ts
    OfflineBanner/
      OfflineBanner.tsx       ← placeholder vacío
      index.ts
    ConsentMessage/
      ConsentMessage.tsx      ← placeholder vacío
      index.ts
  bridge/
    ChatUIBridge.ts           ← ya existe de Story 1.3
  signals/
    ...                       ← ya existe de Story 1.2
```

### `mountChatWidget` function
```typescript
export function mountChatWidget(
  options: ChatWidgetOptions,
  position: ResolvedPosition
): HTMLElement {
  const shadowHost = document.createElement('div');
  shadowHost.id = 'guiders-chat-widget';
  document.body.appendChild(shadowHost);

  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = getChatStyles(options); // migrado de chat-ui.ts
  shadowRoot.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  render(<ChatWidget options={options} position={position} />, mountPoint);

  return shadowHost;
}
```

### `ChatWidget.tsx` (estructura)
```tsx
export function ChatWidget({ options, position }: ChatWidgetProps) {
  const visible = isVisibleSignal.value;

  return (
    <div class={`guiders-chat ${visible ? 'visible' : 'hidden'}`}>
      <ChatHeader options={options} />
      <ChatMessages />
      <ChatInput />
      <OfflineBanner />
    </div>
  );
}
```

### CSS
- Migrar `getChatStyles()` de `chat-ui.ts` a `ChatWidget.styles.ts` como template literal exportado
- No usar `css-loader` — solo template literals

---

## Files to Create
- `src/presentation/components/ChatWidget/ChatWidget.tsx`
- `src/presentation/components/ChatWidget/ChatWidget.styles.ts`
- `src/presentation/components/ChatWidget/index.ts`
- `src/presentation/components/ChatHeader/ChatHeader.tsx` (placeholder)
- `src/presentation/components/ChatHeader/ChatHeader.styles.ts`
- `src/presentation/components/ChatHeader/index.ts`
- `src/presentation/components/ChatMessages/ChatMessages.tsx` (placeholder)
- `src/presentation/components/ChatMessages/index.ts`
- `src/presentation/components/ChatInput/ChatInput.tsx` (placeholder)
- `src/presentation/components/ChatInput/index.ts`
- `src/presentation/components/OfflineBanner/OfflineBanner.tsx` (placeholder)
- `src/presentation/components/OfflineBanner/index.ts`
- `src/presentation/components/ConsentMessage/ConsentMessage.tsx` (placeholder)
- `src/presentation/components/ConsentMessage/index.ts`

## Definition of Done
- [ ] Estructura de carpetas creada
- [ ] `ChatWidget` monta en Shadow DOM con los estilos CSS migrados
- [ ] `isVisibleSignal` controla la visibilidad del widget
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan (bridge aún delega en ChatUI original)
