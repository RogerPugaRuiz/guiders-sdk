# Story 6.6: ToggleButton badge + OfflineBanner + scroll inteligente ChatMessages — Fase 3

Status: review

## Story

Como desarrollador del SDK que implementa la Fase 3 del refinamiento visual (retorno y resiliencia),
quiero añadir el badge numérico animado al `ToggleButton`, refactorizar `OfflineBanner` con color neutro y tap-to-retry, e implementar scroll inteligente en `ChatMessages`,
para que los visitantes recurrentes vean mensajes no leídos, perciban los errores de red sin ansiedad y el chat abra siempre en el punto relevante de la conversación.

## Acceptance Criteria

1. **Given** que `unreadCountSignal.value > 0` y el panel está cerrado
   **When** se renderiza `ToggleButton`
   **Then** aparece un badge rojo `18×18px` position absolute con el número (o "99+" si > 99) con animación `scale(0)→scale(1)` en 200ms usando `--gds-ease-out`

2. **Given** que `unreadCountSignal.value === 0`
   **When** se renderiza `ToggleButton`
   **Then** no hay badge visible (sin espacio reservado vacío)

3. **Given** que el toggle ya tiene la lógica de `unreadCountSignal` implementada (línea 73 de ToggleButton.tsx)
   **When** se migra a tokens GCS
   **Then** el badge usa `background: var(--gds-color-error)` y `color: #ffffff`, con `border-radius: var(--gds-radius-pill)`

4. **Given** que el WebSocket se desconecta
   **When** `OfflineBanner` aparece
   **Then** muestra fondo `var(--gds-color-bg-elevated)`, borde `var(--gds-color-border)`, texto `var(--gds-color-text-secondary)` — sin colores warning/amarillo/rojo

5. **Given** que han pasado 30 segundos offline
   **When** el banner sigue visible
   **Then** el texto cambia a "Sin conexión · toca para reintentar" y el banner completo es tappable

6. **Given** que el usuario toca el banner en estado retryable
   **When** se dispara el tap
   **Then** se llama a `onRetry()` prop

7. **Given** que la conexión se restaura
   **When** llega el evento de reconexión
   **Then** el banner hace fade-out en 200ms y desaparece

8. **Given** que el panel abre con mensajes no leídos
   **When** `ChatMessages` monta o el panel se abre
   **Then** hace scroll automático al primer mensaje no leído (si los hay), o al fondo si no hay no leídos

9. **Given** que el usuario está leyendo mensajes anteriores (scrolled up > 100px del fondo)
   **When** llega un nuevo mensaje
   **Then** NO hace auto-scroll (el usuario está leyendo), solo muestra un indicador "↓ Nuevo mensaje" que al click hace scroll al fondo

10. **Given** que el usuario está en el fondo (<100px del fondo)
    **When** llega un nuevo mensaje
    **Then** hace auto-scroll suave al fondo en ~200ms

11. **Given** que los tests E2E están en verde antes de esta story
    **When** se ejecutan los tests E2E tras la story
    **Then** todos los tests siguen pasando

## Tasks / Subtasks

- [ ] Refactorizar `ToggleButton.tsx` — badge visual con tokens GCS (AC: 1–3)
  - [ ] El badge ya existe en el TSX (línea 83); migrar a tokens en `ToggleButton.styles.ts`
  - [ ] Animación `scale(0)→scale(1)` 200ms con `--gds-ease-out`
  - [ ] Posición `absolute`, `top: -4px; right: -4px`
- [ ] Actualizar `ToggleButton.styles.ts` con tokens GCS — cero hardcoded
- [ ] Refactorizar `OfflineBanner.tsx` — color neutro + tap-to-retry (AC: 4–7)
  - [ ] Props nuevas: `retryable: boolean`, `onRetry?: () => void`
  - [ ] Estado interno con `setTimeout(30000)` para activar modo retryable
  - [ ] Fade-out al reconectar: prop `visible` + `opacity` 1→0 en 200ms
  - [ ] `role="alert"` al aparecer, `aria-live="assertive"`
- [ ] Actualizar `OfflineBanner.styles.ts` con tokens GCS — cero hardcoded (AC: 4)
- [ ] Implementar scroll inteligente en `ChatMessages.tsx` (AC: 8–10)
  - [ ] `useRef` para el contenedor de mensajes
  - [ ] `isNearBottom()`: `scrollHeight - scrollTop - clientHeight < 100`
  - [ ] Al montar: scroll al primer no leído o al fondo instantáneo
  - [ ] Al llegar nuevo mensaje: `if (isNearBottom()) scrollToBottom(smooth)` else mostrar indicador
  - [ ] Indicador "↓ Nuevo mensaje": aparece position absolute abajo-centrado, click → scroll
- [ ] Verificar `npm run build` sin errores (AC: 1)
- [ ] Ejecutar tests E2E y confirmar verde (AC: 11)

## Dev Notes

### ToggleButton badge — ya implementado, solo migrar a tokens

El badge YA existe en `ToggleButton.tsx` (línea 83–85):
```typescript
{badgeText && (
    <div class="chat-unread-badge" aria-label={`${unread} mensajes no leídos`}>
        {badgeText}
    </div>
)}
```

La tarea principal es asegurar que `ChatWidget.styles.ts` (donde se define `.chat-unread-badge`) use tokens GCS. Añadir también la animación de escala con CSS.

El CSS del badge debe ser:
```css
.chat-unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    background: var(--gds-color-error);
    color: #ffffff;
    font-size: var(--gds-font-size-xs, 11px);
    font-weight: var(--gds-font-weight-semibold);
    border-radius: var(--gds-radius-pill);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: gds-badge-in var(--gds-duration-slow, 200ms) var(--gds-ease-out, cubic-bezier(0.16,1,0.3,1));
}
@keyframes gds-badge-in {
    from { transform: scale(0); }
    to { transform: scale(1); }
}
```

### OfflineBanner — nuevas props y lógica

```typescript
interface OfflineBannerProps {
    visible: boolean;
    onRetry?: () => void;
}

export function OfflineBanner({ visible, onRetry }: OfflineBannerProps) {
    const [retryable, setRetryable] = useState(false);
    const [mounted, setMounted] = useState(visible);
    const [opacity, setOpacity] = useState(visible ? 1 : 0);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            setRetryable(false);
            requestAnimationFrame(() => setOpacity(1));
            const t = setTimeout(() => setRetryable(true), 30000);
            return () => clearTimeout(t);
        } else {
            setOpacity(0);
            const t = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(t);
        }
    }, [visible]);

    if (!mounted) return null;

    return (
        <div
            role="alert"
            aria-live="assertive"
            onClick={retryable && onRetry ? onRetry : undefined}
            style={bannerStyle(opacity, retryable)}
        >
            {retryable ? 'Sin conexión · toca para reintentar' : 'Sin conexión · reintentando…'}
        </div>
    );
}
```

### Scroll inteligente ChatMessages

```typescript
const listRef = useRef<HTMLDivElement>(null);

function isNearBottom(): boolean {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
}

function scrollToBottom(smooth = true): void {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

// Al montar: scroll instantáneo
useEffect(() => { scrollToBottom(false); }, []);

// Al recibir nuevos mensajes:
useEffect(() => {
    if (isNearBottom()) {
        scrollToBottom(true);
    } else {
        setShowNewMessageHint(true);
    }
}, [messages.length]);
```

Indicador "↓ Nuevo mensaje":
```typescript
{showNewMessageHint && (
    <button
        style={newMessageHintStyle}
        onClick={() => { scrollToBottom(true); setShowNewMessageHint(false); }}
        aria-label="Ir al nuevo mensaje"
    >
        ↓ Nuevo mensaje
    </button>
)}
```

### Tokens a usar en OfflineBanner.styles.ts

| Elemento | Token |
|----------|-------|
| Bg banner | `var(--gds-color-bg-elevated)` |
| Border bottom | `1px solid var(--gds-color-border)` |
| Texto | `var(--gds-color-text-secondary)` |
| Font size | `var(--gds-font-size-sm, 13px)` |
| Padding | `6px 16px` |
| Cursor retryable | `pointer` |

**NUNCA:** `background: yellow`, `background: #fff3cd`, `color: warning`, `border: orange`. El offline es un estado técnico, no un error del usuario.

### References

- UX Spec Step 3: J4 (retorno) — scroll al primer no leído; J5 (offline) — banner slate-100, tap-to-retry 30s
- UX Spec Step 4: `ToggleButton refactor` — badge `18×18px`, `scale(0)→scale(1) 200ms`; `OfflineBanner refactor` — props retryable, onRetry, fade-out 200ms
- UX Spec Step 8: feedback "Banner de conexión — NUNCA rojo/amarillo"
- `src/presentation/components/ToggleButton/ToggleButton.tsx` — badge ya implementado (línea 83)
- `src/presentation/components/OfflineBanner/OfflineBanner.tsx` — archivo a refactorizar
- `src/presentation/components/ChatMessages/ChatMessages.tsx` — añadir scroll inteligente
- `src/presentation/signals/toggleState.ts` — `unreadCountSignal`
- Story 6.1: tokens CSS GCS disponibles

## Dev Agent Record

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

### File List
