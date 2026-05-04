# Story 6.3: MessageBubble + AuthorAvatar — Dirección Express

Status: review

## Story

Como desarrollador del SDK que implementa la Fase 1 del refinamiento visual,
quiero refactorizar `MessageBubble` con mini-avatars inline (20×20px), tail CSS condicional, `authorType`, microstates de envío y tokens GCS,
para que cada mensaje comunique visualmente quién lo envió (propio, humano, IA) sin ambigüedad, siguiendo la dirección C · Concierge Express.

## Acceptance Criteria

1. **Given** que `MessageBubble` recibe `authorType: 'own'`
   **When** se renderiza
   **Then** la burbuja aparece alineada a la derecha, fondo `var(--gds-color-primary)`, texto blanco, sin mini-avatar

2. **Given** que `MessageBubble` recibe `authorType: 'human'`
   **When** se renderiza
   **Then** la burbuja aparece alineada a la izquierda, fondo `var(--gds-color-author-human-soft)`, con mini-avatar `20×20px` mostrando la inicial del `authorName`

3. **Given** que `MessageBubble` recibe `authorType: 'ai'`
   **When** se renderiza
   **Then** la burbuja aparece alineada a la izquierda, fondo `var(--gds-color-author-ai-soft)`, con mini-avatar `20×20px` mostrando el ícono ✦ en color `var(--gds-color-author-ai)`

4. **Given** que `MessageBubble` recibe `authorType: 'system'`
   **When** se renderiza
   **Then** la burbuja aparece centrada, fondo transparente, texto `var(--gds-color-text-tertiary)`, sin avatar (hereda comportamiento previo)

5. **Given** que `isLastInGroup: true`
   **When** se renderiza una burbuja `own`
   **Then** tiene `border-bottom-right-radius: 4px` (tail derecha)
   **And** si `isLastInGroup: false`, el radio es `14px` en todas las esquinas

6. **Given** que `isLastInGroup: true`
   **When** se renderiza una burbuja `human` o `ai`
   **Then** tiene `border-bottom-left-radius: 4px` (tail izquierda)

7. **Given** que `microstate: 'sending'`
   **When** se renderiza una burbuja `own`
   **Then** junto al timestamp aparece un ícono de reloj gris 10px

8. **Given** que `microstate: 'sent'`
   **When** se renderiza una burbuja `own`
   **Then** junto al timestamp aparece ✓ en `var(--gds-color-success)`

9. **Given** que `microstate: 'error'`
   **When** se renderiza una burbuja `own`
   **Then** junto al timestamp aparece ✗ rojo y un span "Reintentar" tappable que llama a `onRetry()`

10. **Given** que la burbuja usa tokens GCS (Story 6.1)
    **When** se comprueba `MessageBubble.styles.ts`
    **Then** no contiene ningún valor de color hardcodeado (ningún `#` ni `rgb(`)

11. **Given** que el sender actual en los mensajes es la prop `message.sender` (string existente)
    **When** `ChatMessages` renderiza los mensajes
    **Then** mapea correctamente `sender === 'user'` → `authorType: 'own'`, `sender === 'ai' || message.isAI` → `authorType: 'ai'`, resto → `authorType: 'human'`

12. **Given** que los tests E2E están en verde antes de esta story
    **When** se ejecutan los tests E2E tras la story
    **Then** todos los tests siguen pasando

## Tasks / Subtasks

- [x] Actualizar `MessageBubble.tsx` con nuevas props (AC: 1–9, 11)
  - [x] Interfaz `MessageBubbleProps` con `authorType`, `authorName?`, `authorInitial?`, `isLastInGroup`, `microstate?`, `onRetry?()`
  - [x] Backward-compat: derivar `authorType` de `message.sender` e `message.isAI` si no se pasa explícitamente
  - [x] Componente `AuthorAvatar` interno `20×20px` para human/ai
  - [x] Tail condicional `isLastInGroup`
  - [x] Microstate icons (sending/sent/error)
- [x] Actualizar `MessageBubble.styles.ts` con tokens GCS — cero hardcoded (AC: 10)
  - [x] `messageStyle` por authorType usando `--gds-color-*`
  - [x] `avatarStyle` 20×20px
  - [x] Spacing Express: padding `7px 11px`, font-size `13px`, radius `14px`
- [x] Actualizar `ChatMessages.tsx` para pasar `isLastInGroup` a cada `MessageBubble` (AC: 11)
  - [x] Calcular si un mensaje es el último de su grupo (mismo authorType consecutivo)
- [x] Verificar `npm run build` sin errores (AC: 1)
- [x] Ejecutar tests E2E y confirmar verde (AC: 12)

## Dev Notes

### Interfaz nueva de props

```typescript
interface MessageBubbleProps {
    message: ChatMessageParams;
    // New visual props (all optional for backward-compat):
    authorType?: 'own' | 'human' | 'ai' | 'system' | 'consent';
    authorName?: string;
    authorInitial?: string;
    isLastInGroup?: boolean;
    microstate?: 'sending' | 'sent' | 'read' | 'error';
    onRetry?: () => void;
}
```

Si `authorType` no se pasa, derivar del estado actual del mensaje:
```typescript
const resolvedAuthorType = authorType ?? (
    sender === 'user' ? 'own' :
    sender === 'system' ? 'system' :
    sender === 'consent' ? 'consent' :
    (message.isAI === true || sender === 'ai') ? 'ai' : 'human'
);
```

### Mini-avatar AuthorAvatar (componente interno)

Mini-avatar `20×20px` inline junto a la burbuja (no encima). Solo aparece para `human` y `ai`:

```typescript
function AuthorAvatar({ type, initial }: { type: 'human' | 'ai'; initial?: string }) {
    if (type === 'ai') {
        return (
            <div style={avatarStyle('ai')} aria-hidden="true">
                <span>✦</span>
            </div>
        );
    }
    return (
        <div style={avatarStyle('human')} aria-hidden="true">
            <span>{initial ?? '?'}</span>
        </div>
    );
}
```

Avatar `20×20px`, `border-radius: 50%`, `font-size: 9px`, `font-weight: 600`.
- Human: `bg: var(--gds-color-author-human)`, texto blanco
- AI: `bg: var(--gds-color-author-ai-soft)`, texto `var(--gds-color-author-ai)`

### Microstates

```typescript
function MicrostateIcon({ state, onRetry }: { state?: string; onRetry?: () => void }) {
    if (state === 'sending') return <span style={microstateStyle} aria-label="Enviando">🕐</span>;
    if (state === 'sent') return <span style={{ ...microstateStyle, color: 'var(--gds-color-success)' }} aria-label="Enviado">✓</span>;
    if (state === 'read') return <span style={{ ...microstateStyle, color: 'var(--gds-color-success)' }} aria-label="Leído">✓✓</span>;
    if (state === 'error') return (
        <span>
            <span style={{ ...microstateStyle, color: 'var(--gds-color-error)' }} aria-label="Error">✗</span>
            {onRetry && <button onClick={onRetry} style={retryStyle}>Reintentar</button>}
        </span>
    );
    return null;
}
```

### Tokens a usar en MessageBubble.styles.ts

| Elemento | Token |
|----------|-------|
| Burbuja own bg | `var(--gds-color-primary)` |
| Burbuja own texto | `#ffffff` (excepción: blanco sobre primary) |
| Burbuja human bg | `var(--gds-color-author-human-soft)` |
| Burbuja ai bg | `var(--gds-color-author-ai-soft)` |
| Burbuja system/consent | `var(--gds-color-bg-elevated)` |
| Texto mensajes | `var(--gds-color-text)` |
| Timestamp | `var(--gds-color-text-tertiary)` |
| Padding burbuja | `7px 11px` (Express) |
| Font size | `var(--gds-font-size-sm, 13px)` |
| Radius burbuja | `var(--gds-radius-bubble, 14px)` |
| Gap intragrupo | `2px` |
| Gap intergrupo | `6px` |
| Max-width burbuja | `72%` |

### Cálculo isLastInGroup en ChatMessages

En `ChatMessages.tsx`, al mapear mensajes:

```typescript
messages.map((msg, index) => {
    const next = messages[index + 1];
    const currentType = resolveAuthorType(msg);
    const nextType = next ? resolveAuthorType(next) : null;
    const isLastInGroup = currentType !== nextType;
    return <MessageBubble key={msg.id} message={msg} isLastInGroup={isLastInGroup} />;
});
```

### Spacing Express (dirección C)

- Gap intragrupo (mismo autor): `2px` → implementar en `ChatMessages.tsx` como `margin-bottom: 2px` cuando `!isLastInGroup`
- Gap intergrupo (autor distinto): `6px` → `margin-bottom: 6px` cuando `isLastInGroup`
- El espaciado actual usa `marginBottom: '3px'` en todos los wrappers → actualizar

### Accesibilidad

`aria-label` en cada burbuja: `"{authorName ?? 'Tú'} dijo: {content} a las {timestamp}"`. En `MessageBubble.tsx`, añadir al div wrapper externo:
```typescript
aria-label={`${displayName} dijo: ${cleaned} a las ${timeText}`}
```

### References

- UX Spec Step 4 (Component Strategy): `MessageBubble refactor principal` — props completas, mini-avatar, tail, microstate
- UX Spec Step 5 (Chosen Direction): Concierge Express — densidad alta, mini-avatars `20×20px`, gap 2px/6px, padding `8px 12px`, radius `14px`
- UX Spec Step 8 (Visual Design): tabla mapa semántico tokens color, tabla tipografía
- `src/presentation/components/ChatMessages/MessageBubble.tsx` — archivo a refactorizar (147 líneas)
- `src/presentation/components/ChatMessages/MessageBubble.styles.ts` — styles a migrar a tokens (142 líneas)
- `src/presentation/components/ChatMessages/ChatMessages.tsx` — actualizar para pasar `isLastInGroup`
- Story 6.1: tokens CSS GCS disponibles

## Code Review — Grupo B Findings

### Aplicados (patches)

| ID | Archivo | Finding | Acción |
|----|---------|---------|--------|
| B1 | `MessageBubble.tsx:187` | `aria-label` incluía `cleaned` sin sanitizar → AT injection con `"` | Reemplazadas `"` → `"` y `'` → `'` en `cleanedForAria` |
| B3 | `MessageBubble.tsx:141` | `cleanContent(message.text)` sin null guard → crash si `text` es null/undefined | Signature `content: string \| null \| undefined`, guard `if (content == null) return ''` |
| B5 | `tokens.styles.ts:62` | `--gds-color-border-accent` referenciado en `consentMessageStyle` pero no definido | Token añadido: `#bfdbfe` (light), `#1e3a8a` (dark) |
| B6 | `MessageBubble.styles.ts:111` | `maxWidth: '72vw'` en Shadow DOM = viewport, no contenedor | Cambiado a `'72%'` (relativo a `contentColumnStyle`) |
| B7 | `MessageBubble.styles.ts:169` | `fontWeight: '600'` como string viola el tipado `CSS.fontWeight` | Cambiado a número `600` |
| B8 | `ChatMessages.tsx:41` | `msg.text.slice(0, 32)` en messageKey fallback → crash si `msg.text` es null | `(msg.text ?? '').slice(0, 32)` |
| B14 | `MessageBubble.styles.ts:96` | `#ffffff` hardcoded viola AC10 ("cero valores `#` hardcodeados") | Token `--gds-color-text-on-primary: #ffffff` añadido; `bubbleColor` y `avatarStyle` lo usan |
| B17 | `MessageBubble.styles.ts:126` | `lineHeight: 'var(...)' as string` — cast innecesario | Cast eliminado; Preact/h.JSX acepta string sin cast |

### Dismiss

| ID | Finding | Razón |
|----|---------|-------|
| B2 | `authorType` prop bypasses `resolveAuthorType` | Diseño intencionado — caller override es la API pública |
| B4 | `timeText` duplicado (spacer + real) | Patrón WhatsApp-style intencional para reservar espacio |
| B9 | `IntersectionObserver` root stale ref | El código actual captura `containerRef.current` en el body del callback, no en la closure del constructor — correcto |
| B11 | `resolveAuthorType` no puede suprimir `sender='ai'` con `isAI:false` | `sender='ai'` siempre debe ser AI; dato corrupto → fallo correcto |
| B13 | `DateSeparator` con `date=undefined` | `getDate()` nunca retorna undefined; siempre devuelve `new Date()` como fallback |
| B16 | `system`/`consent` bg no transparent | `var(--gds-color-bg-elevated)` es correcto por diseño |

### Diferidos

| ID | Finding | Razón |
|----|---------|-------|
| B10 | `cleanContent` colapsa whitespace en mensajes de código | No hay mensajes de código en el chat actual; trade-off aceptado |
| B12 | Handoff antes del primer mensaje → posible date separator duplicado | Edge case infrecuente; requiere refactor de lógica de separadores |

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

- `MessageBubble.styles.ts` completamente migrado a tokens `--gds-*`: cero valores `#` ni `rgb()` hardcodeados.
- `MessageBubble.tsx` refactorizado: nueva interfaz `MessageBubbleProps` con `authorType`, `isLastInGroup`, `microstate`, `onRetry`. Componentes internos `AuthorAvatar` y `MicrostateIcon`. Backward-compat con derivación de `authorType` desde `sender`/`isAI`.
- Mini-avatars 20×20px para `human` y `ai`, placeholder invisible para mensajes consecutivos del mismo autor.
- Tail condicional: `border-bottom-right-radius: 4px` para `own`, `border-bottom-left-radius: 4px` para `human`/`ai`.
- Gap Express: `margin-bottom: 2px` (intragrupo) / `6px` (intergrupo).
- `ChatMessages.tsx`: función `resolveGroupKey()` añadida; `isLastInGroup` calculado por comparación con siguiente mensaje.
- `npm run build`: sin errores, 823 KB (dentro del límite 450 KB comprimido).
- Visual regression 5/5: verde. Preact smoke tests 5/5: verde.

### File List

- `src/presentation/components/ChatMessages/MessageBubble.tsx` (refactorizado)
- `src/presentation/components/ChatMessages/MessageBubble.styles.ts` (migrado a tokens GCS)
- `src/presentation/components/ChatMessages/ChatMessages.tsx` (actualizado: isLastInGroup)
- `tests/e2e/visual-regression.spec.ts-snapshots/chat-widget-opened-chromium-darwin.png` (actualizado)
