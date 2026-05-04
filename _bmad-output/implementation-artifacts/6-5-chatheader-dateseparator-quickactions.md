# Story 6.5: ChatHeader + DateSeparator handoff + QuickActions — Fase 2

Status: review

## Story

Como desarrollador del SDK que implementa la Fase 2 del refinamiento visual (identidad y transparencia IA),
quiero refactorizar `ChatHeader` con `authorType` y badge de tipo, añadir la variante `handoff` a `DateSeparator`, y refactorizar `QuickActions` con el CTA "Hablar con persona" persistente y fade-out al seleccionar,
para que el usuario siempre sepa inequívocamente con quién habla y pueda solicitar un humano en cualquier momento (P7 + EU AI Act Art. 50).

## Acceptance Criteria

1. **Given** que `hasAssignedCommercialSignal.value === false` (IA activa)
   **When** se renderiza `ChatHeader`
   **Then** muestra el nombre del asistente IA, un badge "IA" en color `var(--gds-color-author-ai)` y el tiempo de respuesta estimado

2. **Given** que `hasAssignedCommercialSignal.value === true` (humano activo)
   **When** se renderiza `ChatHeader`
   **Then** muestra el nombre y avatar del agente humano con badge "Agente" en `var(--gds-color-author-human)` y elimina cualquier referencia a IA en el header

3. **Given** que el interlocutor cambia (IA→humano o humano→IA)
   **When** ocurre el cambio
   **Then** el header hace crossfade: fade-out 150ms del estado anterior, fade-in 150ms del nuevo estado (total ~300ms)

4. **Given** que `ChatHeader` usa tokens GCS
   **When** se revisa `ChatHeader.styles.ts`
   **Then** no contiene valores de color hardcodeados, usa solo tokens `--gds-*`

5. **Given** que `DateSeparator` recibe `type: 'handoff'` y `label: 'María se ha unido · agente'`
   **When** se renderiza
   **Then** muestra una línea horizontal `var(--gds-color-border)` con el texto centrado en `font-size: 12px / font-weight: 500 / color: var(--gds-color-text-secondary)` con fade-in 200ms

6. **Given** que `DateSeparator` recibe `type: 'date'` (comportamiento actual)
   **When** se renderiza
   **Then** el comportamiento es idéntico al actual (sin regresión)

7. **Given** que hay mensajes IA en el hilo (`hasAssignedCommercialSignal.value === false`)
   **When** `QuickActions` renderiza los botones configurados
   **Then** el primer chip siempre es "🙋 Hablar con persona" con `outline: 1px solid var(--gds-color-author-ai)` y persiste entre respuestas IA

8. **Given** que hay un agente humano activo (`hasAssignedCommercialSignal.value === true`)
   **When** `QuickActions` renderiza
   **Then** el chip "Hablar con persona" NO aparece (ya está hablando con humano)

9. **Given** que el usuario toca el chip "Hablar con persona"
   **When** se dispara el click
   **Then** el chip hace fade-out a `opacity: 0` en 150ms y luego se oculta, y se dispara `quickActionRequestAgentSignal`

10. **Given** que los tests E2E están en verde antes de esta story
    **When** se ejecutan los tests E2E tras la story
    **Then** todos los tests siguen pasando

## Tasks / Subtasks

- [ ] Refactorizar `ChatHeader.tsx` (AC: 1–3)
  - [ ] Añadir `role="banner"` y `aria-label` dinámico al div raíz
  - [ ] Badge `authorType`: componente interno `AuthorBadge` que muestra "IA" o "Agente"
  - [ ] `responseTime` prop o leer de señal para mostrar tiempo estimado
  - [ ] Crossfade: estado `displayedAuthorType` con transición opacity
- [ ] Actualizar `ChatHeader.styles.ts` con tokens GCS — cero hardcoded (AC: 4)
  - [ ] Padding Express: `10px 14px`, altura ~44px
  - [ ] Avatar header: `28×28px`
  - [ ] Badge: `font-size: 11px`, `border-radius: pill`
- [ ] Refactorizar `DateSeparator.tsx` — añadir `type: 'handoff'` (AC: 5, 6)
  - [ ] Prop `type: 'date' | 'handoff'`
  - [ ] Variante handoff: línea + texto centrado + fade-in 200ms
- [ ] Actualizar `DateSeparator.styles.ts` con tokens GCS (AC: 5)
- [ ] Refactorizar `QuickActions.tsx` — CTA "Hablar con persona" persistente (AC: 7–9)
  - [ ] Leer `hasAssignedCommercialSignal` para mostrar/ocultar CTA
  - [ ] CTA se añade dinámicamente como primer elemento de `config.buttons` si aplica
  - [ ] Fade-out chip al click: estado `fadingOut` + setTimeout 150ms antes de `setHidden`
- [ ] Actualizar `QuickActions.styles.ts` con tokens GCS — cero hardcoded
- [ ] Verificar `npm run build` sin errores (AC: 1)
- [ ] Ejecutar tests E2E y confirmar verde (AC: 10)

## Dev Notes

### ChatHeader badge AuthorType

```typescript
// Componente interno
function AuthorBadge({ type }: { type: 'human' | 'ai' }) {
    return (
        <span style={badgeStyle(type)}>
            {type === 'ai' ? '✦ IA' : '● Agente'}
        </span>
    );
}

// badgeStyle en ChatHeader.styles.ts:
function badgeStyle(type: 'human' | 'ai'): CSS {
    return {
        fontSize: 'var(--gds-font-size-xs, 11px)',
        fontWeight: 'var(--gds-font-weight-medium)' as string,
        color: type === 'ai' ? 'var(--gds-color-author-ai)' : 'var(--gds-color-author-human)',
        background: type === 'ai' ? 'var(--gds-color-author-ai-soft)' : 'var(--gds-color-author-human-soft)',
        padding: '2px 6px',
        borderRadius: 'var(--gds-radius-pill)',
        letterSpacing: '0.01em',
    };
}
```

### ChatHeader crossfade

Usar un estado `prevAuthorType` para gestionar la transición:
```typescript
const [displayState, setDisplayState] = useState({ type: resolvedType, opacity: 1 });

useEffect(() => {
    if (resolvedType !== displayState.type) {
        setDisplayState(prev => ({ ...prev, opacity: 0 }));
        const t = setTimeout(() => setDisplayState({ type: resolvedType, opacity: 1 }), 150);
        return () => clearTimeout(t);
    }
}, [resolvedType]);
```

### DateSeparator tipo handoff

```typescript
interface DateSeparatorProps {
    label: string;
    type?: 'date' | 'handoff'; // default: 'date'
}
```

Visual handoff:
```css
/* handoff wrapper */
display: flex; align-items: center; gap: 8px; margin: 8px 0; opacity: 0 → 1 fade-in 200ms
/* línea izq/der */
flex: 1; height: 1px; background: var(--gds-color-border);
/* texto */
font-size: 12px; font-weight: 500; color: var(--gds-color-text-secondary); white-space: nowrap;
```

### QuickActions — CTA "Hablar con persona" persistente

El CTA no se usa `hidden` al hacer click en "Hablar con persona" — solo ese chip desaparece con fade. Los demás chips siguen visibles hasta que el usuario hace click en uno de ellos.

```typescript
const [humanCtaFading, setHumanCtaFading] = useState(false);
const [humanCtaHidden, setHumanCtaHidden] = useState(false);
const showHumanCTA = !hasAssignedCommercialSignal.value && !humanCtaHidden;

// Al resetear chatId (conversación nueva) o al volver humano→IA:
// restablecer humanCtaFading=false, humanCtaHidden=false
```

El chip "Hablar con persona" es distinto al `setHidden(true)` del componente completo — solo este chip desaparece, los demás chips del config.buttons siguen.

### Integración con ChatMessages — handoff separador

El separador handoff debe ser emitido por el sistema cuando llega el evento WebSocket de agente conectado. En la arquitectura actual, esto probablemente se implementa añadiendo un mensaje `sender: 'system'` con un formato especial a la lista de mensajes.

Para esta story, la implementación mínima es:
1. `DateSeparator` acepta `type: 'handoff'`
2. `ChatMessages.tsx` detecta mensajes `sender: 'system'` con prefijo `"[handoff]"` y renderiza `<DateSeparator type="handoff" label={...} />` en vez de `<MessageBubble>`

### Tokens a usar en ChatHeader.styles.ts

| Elemento | Token |
|----------|-------|
| Padding | `10px 14px` |
| Bg header | `var(--gds-color-bg)` |
| Border bottom | `1px solid var(--gds-color-border)` |
| Título empresa | `var(--gds-font-size-lg)` + `letter-spacing: -0.01em` |
| Nombre interlocutor | `var(--gds-font-size-sm)` |
| Avatar header | `28×28px`, `border-radius: 50%` |
| Close btn | `var(--gds-color-text-secondary)`, hover `var(--gds-color-text)` |

### References

- UX Spec Step 4: `ChatHeader refactor`, `DateSeparator variant handoff`, `QuickActions refactor`
- UX Spec Step 3: J2 (solicitud humano), J3 (handoff IA→humano)
- UX Spec Step 2: criterio de fracaso "avatar genérico sin distinción IA/humano", "¿hablo con humano? sin respuesta accionable"
- `src/presentation/components/ChatHeader/ChatHeader.tsx` — archivo a refactorizar (96 líneas)
- `src/presentation/components/ChatMessages/DateSeparator.tsx` — archivo a extender
- `src/presentation/components/QuickActions/QuickActions.tsx` — archivo a refactorizar (117 líneas)
- `src/presentation/signals/chatState.ts` — `hasAssignedCommercialSignal`, `chatDetailSignal`
- `src/presentation/signals/actionState.ts` — `quickActionRequestAgentSignal`
- Story 6.1: tokens CSS GCS disponibles

## Dev Agent Record

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

### File List
