# Story 6.4: Composer (ChatInput) + TypingIndicator — Fase 1

Status: review

## Story

Como desarrollador del SDK que implementa la Fase 1 del refinamiento visual,
quiero refactorizar `ChatInput` (Composer) con auto-grow, Visual Viewport API mobile y microstate del botón send, y refactorizar `TypingIndicator` con `authorType` y colores diferenciados humano/IA,
para que el compositor sea usable en mobile con teclado nativo y el usuario siempre sepa quién está escribiendo.

## Acceptance Criteria

1. **Given** que el usuario abre el chat en mobile (viewport < 640px) y toca el Composer
   **When** aparece el teclado nativo
   **Then** el Composer sube con el teclado usando Visual Viewport API (`window.visualViewport`) y el último mensaje permanece visible

2. **Given** que el usuario escribe más de 1 línea en el Composer
   **When** el contenido supera la altura de 1 línea
   **Then** el textarea crece automáticamente hasta un máximo de `100px` (≈5 líneas a 20px)

3. **Given** que el Composer está vacío
   **When** se renderiza
   **Then** el botón Send tiene `opacity: 0.35` y `aria-disabled="true"` y no dispara `onSend` al click

4. **Given** que el usuario escribe al menos 1 carácter
   **When** se evalúa el estado del botón Send
   **Then** el botón Send tiene `opacity: 1` y responde al click disparando `onSend`

5. **Given** que el usuario presiona `Enter` sin `Shift`
   **When** el Composer tiene contenido
   **Then** se dispara `onSend` y el textarea se vacía

6. **Given** que el usuario presiona `Shift+Enter`
   **When** el Composer tiene contenido
   **Then** se inserta un salto de línea y el textarea crece

7. **Given** que `TypingIndicator` recibe `authorType: 'human'` y `authorName: 'María'`
   **When** se renderiza
   **Then** los dots de animación usan `var(--gds-color-author-human)` y el texto dice "María está escribiendo…"

8. **Given** que `TypingIndicator` recibe `authorType: 'ai'`
   **When** se renderiza
   **Then** los dots de animación usan `var(--gds-color-author-ai)` y el texto dice "Asistente IA está escribiendo…"

9. **Given** que `ChatInput.styles.ts` y `TypingIndicator.styles.ts` están actualizados
   **When** se revisa el código
   **Then** no contienen ningún valor de color hardcodeado (`#` ni `rgb(`)

10. **Given** que `window.visualViewport` no está disponible (browser antiguo)
    **When** el usuario toca el Composer
    **Then** el widget no lanza error — el handler tiene `if (!window.visualViewport) return;`

11. **Given** que los tests E2E están en verde antes de esta story
    **When** se ejecutan los tests E2E tras la story
    **Then** todos los tests siguen pasando

## Tasks / Subtasks

- [x] Refactorizar `ChatInput.tsx` (AC: 1–6, 10)
  - [x] Auto-grow textarea: `onInput` ajusta `height` a `scrollHeight`, max `100px`
  - [x] Visual Viewport API: `useEffect` con listener `window.visualViewport resize`
  - [x] Send button: `aria-disabled`, `opacity` condicional, no dispara con vacío
  - [x] `Enter` → submit (sin Shift), `Shift+Enter` → newline
  - [x] Guard `if (!window.visualViewport) return;`
- [x] Actualizar `ChatInput.styles.ts` con tokens GCS — cero hardcoded (AC: 9)
  - [x] Padding Express: `8px 10px`
  - [x] Input radius: `var(--gds-radius-md, 8px)`
  - [x] Font-size: `var(--gds-font-size-md, 15px)` (Composer es más grande que burbujas)
- [x] Refactorizar `TypingIndicator.tsx` con props `authorType` y `authorName` (AC: 7, 8)
  - [x] Props: `authorType: 'human' | 'ai'`, `authorName?: string`
  - [x] Mini-avatar `20×20px` inline (igual que en MessageBubble, dirección Express)
  - [x] Texto: `"{authorName ?? 'Asistente IA'} está escribiendo…"`
  - [x] `aria-live="polite"` en el wrapper
- [x] Actualizar `TypingIndicator.styles.ts` con tokens GCS — cero hardcoded (AC: 9)
  - [x] Dots color via `authorType` → `--gds-color-author-human` o `--gds-color-author-ai`
  - [x] Animación bounce: `1.2s infinite`, `desfase 0.2s`, `amplitud 4px vertical`
- [x] Verificar `npm run build` sin errores (AC: 1)
- [x] Ejecutar tests E2E y confirmar verde (AC: 11)

## Dev Notes

### Auto-grow textarea

```typescript
// En ChatInput.tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);

const handleInput = (e: Event) => {
    const ta = e.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
};
```

El textarea debe tener `overflow-y: auto` cuando `scrollHeight > 100px`.

### Visual Viewport API

```typescript
useEffect(() => {
    if (!window.visualViewport) return;
    const composerEl = composerRef.current;
    if (!composerEl) return;

    const handler = () => {
        const offset = window.innerHeight - window.visualViewport!.height;
        composerEl.style.transform = `translateY(-${offset}px)`;
    };

    window.visualViewport.addEventListener('resize', handler);
    return () => window.visualViewport!.removeEventListener('resize', handler);
}, []);
```

El `composerRef` debe apuntar al contenedor del input+button, no al textarea. Esto mueve el bloque completo sobre el teclado.

### Send button microstate

```typescript
const hasContent = value.trim().length > 0;

<button
    aria-label="Enviar mensaje"
    aria-disabled={!hasContent}
    onClick={hasContent ? handleSend : undefined}
    style={{ opacity: hasContent ? 1 : 0.35, transition: 'opacity 150ms' }}
>
```

### TypingIndicator nueva interfaz

```typescript
interface TypingIndicatorProps {
    authorType: 'human' | 'ai';
    authorName?: string;
}
```

Texto display: `"{authorName ?? (authorType === 'ai' ? 'Asistente IA' : 'Agente')} está escribiendo…"`

### Dots animation CSS

```css
@keyframes gds-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}
.dot-1 { animation: gds-bounce 1.2s infinite; }
.dot-2 { animation: gds-bounce 1.2s 0.2s infinite; }
.dot-3 { animation: gds-bounce 1.2s 0.4s infinite; }
```

Los dots tienen `width: 6px; height: 6px; border-radius: 50%`. Color:
- human: `background: var(--gds-color-author-human)`
- ai: `background: var(--gds-color-author-ai)`

### Conexión TypingIndicator con señales existentes

Revisar qué señal expone el estado "está escribiendo". Si no hay señal para `authorType` en el estado actual, usar `hasAssignedCommercialSignal.value` como proxy:
- `hasAssignedCommercialSignal.value === true` → `authorType: 'human'`
- `false` → `authorType: 'ai'`

### Tokens a usar en ChatInput.styles.ts

| Elemento | Token |
|----------|-------|
| Bg input área | `var(--gds-color-bg)` |
| Border input | `1px solid var(--gds-color-border)` |
| Border focus | `1px solid var(--gds-color-primary)` |
| Radius input | `var(--gds-radius-md, 8px)` |
| Padding wrapper | `8px 10px` |
| Font size textarea | `var(--gds-font-size-md, 15px)` |
| Color texto | `var(--gds-color-text)` |
| Placeholder color | `var(--gds-color-text-tertiary)` |
| Send button bg | `var(--gds-color-primary)` |
| Send button radius | `var(--gds-radius-pill)` |
| Send button 44×44px | min-touch-target WCAG |
| Bg composer área | `var(--gds-color-bg-elevated)` |
| Border top | `1px solid var(--gds-color-border)` |

### References

- UX Spec Step 4 (Component Strategy): `ChatInput → Composer refactor` — auto-grow, Visual Viewport API, Enter/Shift+Enter, send button
- UX Spec Step 4: `TypingIndicator refactor` — authorType, colores humano/IA, mini-avatar
- UX Spec Step 13 (Responsive & Accessibility): Visual Viewport API código exacto, `prefers-reduced-motion`
- UX Spec Step 3 (Journey J1, Fase 2+4): composer auto-focus, typing indicator púrpura/azul
- `src/presentation/components/ChatInput/ChatInput.tsx` — archivo a refactorizar
- `src/presentation/components/ChatInput/ChatInput.styles.ts` — styles a migrar a tokens (si existe)
- `src/presentation/components/TypingIndicator/TypingIndicator.tsx` — archivo a refactorizar
- `src/presentation/signals/chatState.ts` — `hasAssignedCommercialSignal`
- Story 6.1: tokens CSS GCS disponibles

## Dev Agent Record

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

### File List
