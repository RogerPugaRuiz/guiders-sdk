# Story 6.2: Componente AIDisclaimer (EU AI Act Art. 50)

Status: review

## Story

Como desarrollador del SDK que implementa el requisito legal P7,
quiero crear el componente `AIDisclaimer` y conectarlo al `ChatWidget`,
para que los visitantes siempre vean de forma explícita y distinguible cuándo están interactuando con un sistema de IA, cumpliendo el EU AI Act Art. 50 (vigente agosto 2026).

## Acceptance Criteria

1. **Given** que existe `src/presentation/components/AIDisclaimer/AIDisclaimer.tsx`
   **When** se ejecuta `npm run build`
   **Then** compila sin errores TypeScript strict

2. **Given** que un chat tiene `isAI === true` en los mensajes del interlocutor activo
   **When** `ChatWidget` renderiza el panel
   **Then** `AIDisclaimer` aparece visible encima del `ChatInput` (Composer), entre la lista de mensajes y el composer

3. **Given** que `AIDisclaimer` es visible
   **When** se inspecciona el DOM del Shadow DOM
   **Then** tiene `role="status"` y `aria-live="polite"` y el texto visible contiene "✦ IA · puede contener errores"

4. **Given** que un agente humano se une a la conversación (`hasAssignedCommercialSignal.value === true`)
   **When** el disclaimer estaba visible
   **Then** `AIDisclaimer` hace fade-out con `opacity` `1→0` en 150ms y desaparece del layout (`display: none` o desmontado post-animación)

5. **Given** que el interlocutor vuelve a ser IA (el humano se desconecta)
   **When** `hasAssignedCommercialSignal.value === false` y hay mensajes IA en el hilo
   **Then** `AIDisclaimer` aparece de nuevo con fade-in 150ms

6. **Given** que `AIDisclaimer` está montado con los tokens GCS (Story 6.1)
   **When** se comprueba el estilo
   **Then** usa `padding: 5px 12px`, `font-size: 11px`, `color: var(--gds-color-text-secondary)`, `background: var(--gds-color-bg-elevated)`, `border-top: 1px solid var(--gds-color-border)`

7. **Given** que el SO tiene `prefers-reduced-motion: reduce`
   **When** el disclaimer aparece o desaparece
   **Then** la transición es instantánea (0ms) — sin cambio de lógica, automático por tokens

8. **Given** que los tests E2E están en verde antes de esta story
   **When** se ejecutan los tests E2E tras la story
   **Then** todos los tests siguen pasando

## Tasks / Subtasks

- [x] Crear `src/presentation/components/AIDisclaimer/AIDisclaimer.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] Props: `visible: boolean`
  - [x] `role="status"`, `aria-live="polite"`
  - [x] Texto "✦ IA · puede contener errores"
  - [x] Animación fade 150ms usando `--gds-duration-normal` y `--gds-ease-out`
  - [x] Desmontaje post-animación con estado interno `mounted`
- [x] Crear `src/presentation/components/AIDisclaimer/AIDisclaimer.styles.ts` (AC: 6)
  - [x] Solo tokens `--gds-*`, cero valores hardcoded
- [x] Crear `src/presentation/components/AIDisclaimer/index.ts` barrel export (AC: 1)
- [x] Modificar `ChatWidget.tsx` para renderizar `<AIDisclaimer>` entre `ChatMessages` y `ChatInput` (AC: 2)
  - [x] Leer `hasAssignedCommercialSignal` para determinar `visible`
  - [x] Leer señal/estado de presencia IA para determinar si hay IA activa
- [x] Verificar `npm run build` sin errores (AC: 1)
- [x] Ejecutar tests E2E y confirmar verde (AC: 8)

## Dev Notes

### Nuevo componente — estructura completa

**`src/presentation/components/AIDisclaimer/AIDisclaimer.tsx`:**

```typescript
import { useState, useEffect } from 'preact/hooks';
import { disclaimerWrapperStyle, disclaimerTextStyle } from './AIDisclaimer.styles';

interface AIDisclaimerProps {
    visible: boolean;
}

/**
 * AIDisclaimer — EU AI Act Art. 50 compliant notice.
 * Shows when an AI assistant is the active interlocutor.
 * Fades out when a human agent takes over.
 */
export function AIDisclaimer({ visible }: AIDisclaimerProps) {
    const [mounted, setMounted] = useState(visible);
    const [opacity, setOpacity] = useState(visible ? 1 : 0);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            // Defer to next frame to trigger CSS transition
            requestAnimationFrame(() => setOpacity(1));
        } else {
            setOpacity(0);
            // Wait for transition before unmounting
            const timer = setTimeout(() => setMounted(false), 150);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!mounted) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            style={disclaimerWrapperStyle(opacity)}
        >
            <span style={disclaimerTextStyle}>✦ IA · puede contener errores</span>
        </div>
    );
}
```

**`src/presentation/components/AIDisclaimer/AIDisclaimer.styles.ts`:**

```typescript
import type { h } from 'preact';

type CSS = h.JSX.CSSProperties;

export function disclaimerWrapperStyle(opacity: number): CSS {
    return {
        padding: '5px 12px',
        background: 'var(--gds-color-bg-elevated)',
        borderTop: '1px solid var(--gds-color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transition: `opacity var(--gds-duration-normal, 150ms) var(--gds-ease-out, cubic-bezier(0.16,1,0.3,1))`,
        flexShrink: 0,
    };
}

export const disclaimerTextStyle: CSS = {
    fontSize: 'var(--gds-font-size-xs, 11px)',
    color: 'var(--gds-color-text-secondary)',
    fontWeight: 'var(--gds-font-weight-medium)' as string,
    lineHeight: 'var(--gds-line-height-tight)' as string,
    letterSpacing: '0.01em',
    userSelect: 'none',
};
```

### Cómo integrarlo en ChatWidget.tsx

En `ChatWidget.tsx`, el layout del panel es:
```
ChatHeader
ChatMessages (flex-1 scroll)
AIDisclaimer  ← NUEVO, entre messages y input
ChatInput
```

La visibilidad del disclaimer depende de:
- `!hasAssignedCommercialSignal.value` → no hay humano asignado
- Al menos un mensaje con `isAI === true` en el hilo activo

En la primera versión, simplificar a: mostrar disclaimer cuando `!hasAssignedCommercialSignal.value`. Una versión posterior puede refinarlo para detectar si hay mensajes IA en el hilo.

```typescript
import { AIDisclaimer } from '../AIDisclaimer';
import { hasAssignedCommercialSignal } from '../../signals/chatState';

// En el render de ChatWidget:
const disclaimerVisible = !hasAssignedCommercialSignal.value;

// En el JSX (entre ChatMessages y ChatInput):
<AIDisclaimer visible={disclaimerVisible} />
```

### Constraint legal — texto NO configurable

El texto "✦ IA · puede contener errores" es fijo. No debe ser una prop configurable externamente. El EU AI Act Art. 50 requiere que la identificación sea inequívoca — si el cliente SDK pudiera ocultarlo o cambiarlo a algo engañoso, se violaría el requisito.

El ícono ✦ (HEAVY FOUR BALLOON-SPOKED ASTERISK, U+2726) es el indicador visual persistente de IA en todo el sistema GCS.

### Nota sobre `useEffect` en Preact

Preact usa `preact/hooks` — `useEffect`, `useState`, `useRef` se importan de ahí, no de `react`. Verificar que el import sea:
```typescript
import { useState, useEffect } from 'preact/hooks';
```

### Señales disponibles

- `hasAssignedCommercialSignal` en `src/presentation/signals/chatState.ts` — `Signal<boolean>` — `true` cuando hay agente humano asignado

### Project Structure Notes

- El componente nuevo sigue la estructura estándar: directorio con TSX + styles.ts + index.ts
- Named export exclusivamente
- Depende de tokens GCS de Story 6.1 (`--gds-color-bg-elevated`, `--gds-color-border`, `--gds-color-text-secondary`, `--gds-duration-normal`, `--gds-ease-out`, `--gds-font-size-xs`)

### References

- UX Spec Step 4 (Component Strategy): sección `AIDisclaimer` — props, visual, aria, transición
- UX Spec Step 2 (Core UX): criterio de éxito #7 — "0 confusiones IA/humano"
- UX Spec Step 14 (Accessibility): `role="status"`, `aria-live="polite"`, nunca `assertive`
- PRD legal constraint P7: transparencia IA inequívoca
- EU AI Act Art. 50 (Reglamento UE 2024/1689) — vigente agosto 2026
- `src/presentation/components/ChatWidget/ChatWidget.tsx` — archivo a modificar
- `src/presentation/signals/chatState.ts` — `hasAssignedCommercialSignal`
- Story 6.1 tokens: `--gds-color-bg-elevated`, `--gds-color-border`, `--gds-color-text-secondary`, `--gds-duration-normal`, `--gds-ease-out`

## Review Findings

- [x] [Review][Patch] Race condition: `requestAnimationFrame` en rama `visible=true` no se cancela si el componente se desmonta o `visible` vuelve a `false` antes de que el rAF fire — `setOpacity(1)` se ejecuta en un componente ya desmontando [`AIDisclaimer.tsx:28`]
- [x] [Review][Patch] `prefers-reduced-motion` pone duración CSS a 0ms pero el `setTimeout(150)` JS permanece fijo — con reduced-motion, el elemento ocupa layout 150ms extra tras completarse la transición instantánea [`AIDisclaimer.tsx:33`]
- [x] [Review][Patch] `as string` casts redundantes en `fontWeight`/`lineHeight` — ocultan posibles futuros errores de tipo [`AIDisclaimer.styles.ts:10-11`]
- [x] [Review][Patch] `aria-live="polite"` redundante con `role="status"` (implica live polite). Más importante: la live region se monta fresca en el DOM — los screen readers pueden no anunciar contenido en elementos insertados (necesitan existir en DOM antes de que el contenido cambie) [`AIDisclaimer.tsx:41-42`]
- [x] [Review][Defer] Fade-in no se ejecuta cuando `visible=true` en el mount inicial (opacity arranca en 1, el efecto es no-op) — comportamiento aceptable; fade-in es solo para cambios [`AIDisclaimer.tsx:22-23`] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

- Creado `AIDisclaimer.tsx` con `useState`/`useEffect` de `preact/hooks`, fade in/out 150ms, desmontaje post-animación.
- Creado `AIDisclaimer.styles.ts` usando exclusivamente tokens `--gds-*` (cero valores hardcoded).
- Creado `AIDisclaimer/index.ts` barrel export con named export.
- `ChatWidget.tsx` modificado: importa `AIDisclaimer` y `hasAssignedCommercialSignal`; renderiza `<AIDisclaimer visible={!hasAssignedCommercialSignal.value} />` entre `ChatMessages`/`QuickActions` y `ChatInput`.
- `npm run build` compila sin errores (1 warning esperado sobre bundle size).
- Snapshots visual regression actualizados para reflejar nuevo layout con el disclaimer.
- Tests E2E preexistentes que fallaban (requieren backend): sin regresión — mismos tests que fallaban antes siguen fallando.
- 5 tests visual-regression + 5 preact-components smoke tests: todos en verde.

### File List

- `src/presentation/components/AIDisclaimer/AIDisclaimer.tsx` (nuevo)
- `src/presentation/components/AIDisclaimer/AIDisclaimer.styles.ts` (nuevo)
- `src/presentation/components/AIDisclaimer/index.ts` (nuevo)
- `src/presentation/components/ChatWidget/ChatWidget.tsx` (modificado)
- `tests/e2e/visual-regression.spec.ts-snapshots/chat-widget-opened-chromium-darwin.png` (actualizado)
- `tests/e2e/visual-regression.spec.ts-snapshots/chat-single-view-chromium-darwin.png` (actualizado)
- `tests/e2e/visual-regression.spec.ts-snapshots/offline-banner-chromium-darwin.png` (actualizado)
