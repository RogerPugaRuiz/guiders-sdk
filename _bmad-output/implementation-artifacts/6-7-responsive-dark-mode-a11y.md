# Story 6.7: Responsive mobile + dark mode + reduced-motion — Fase 4

Status: review

## Story

Como desarrollador del SDK que implementa la Fase 4 del refinamiento visual (tokens central + pulido final),
quiero implementar el layout responsive mobile (bottom sheet), dark mode automático via `prefers-color-scheme`, y verificar `prefers-reduced-motion` en todos los componentes,
para que el widget sea completamente funcional en mobile con teclado nativo, soporte dark mode del SO automáticamente, y respete las preferencias de accesibilidad del usuario.

## Acceptance Criteria

1. **Given** que el viewport es < 640px
   **When** el panel de chat está abierto
   **Then** el widget ocupa `min(85vh, 640px)` de altura, `width: 100%`, `border-radius: 20px 20px 0 0`, posicionado en la parte inferior (bottom sheet)

2. **Given** que el viewport es ≥ 640px
   **When** el panel de chat está abierto
   **Then** el widget ocupa `400×600px`, `border-radius: 16px`, posicionado en esquina inferior derecha (o según `--guiders-position`) con offset 24px

3. **Given** que el SO tiene `prefers-color-scheme: dark`
   **When** el widget está montado con tokens GCS (Story 6.1)
   **Then** todos los colores cambian a sus valores dark automáticamente sin JS adicional (ya implementado en tokens, solo verificar que se propaga correctamente al Shadow DOM)

4. **Given** que el SO tiene `prefers-color-scheme: light` (o no tiene preferencia)
   **When** el widget está montado
   **Then** usa los colores light mode por defecto

5. **Given** que el SO tiene `prefers-reduced-motion: reduce`
   **When** el widget está montado con tokens GCS (Story 6.1)
   **Then** todas las animaciones y transiciones son instantáneas (0ms) sin cambios de lógica

6. **Given** que el widget está en mobile (< 640px) y hay un overlay detrás del bottom sheet
   **When** el usuario toca el overlay
   **Then** el panel se cierra

7. **Given** que el widget está en mobile
   **When** se arrastra el drag handle hacia abajo más del 30% de la altura
   **Then** el panel se cierra con animación spring

8. **Given** que `ChatWidget.styles.ts` contiene los estilos del layout responsivo
   **When** se revisa el código
   **Then** usa `@media (max-width: 640px)` y variables CSS para los cambios de layout (no duplicación de reglas)

9. **Given** que el panel tiene `role="dialog"` y `aria-modal="true"`
   **When** el panel está abierto
   **Then** el foco está atrapado dentro (Tab no sale del panel) y al cerrar el foco vuelve al toggle button

10. **Given** que los tests E2E están en verde antes de esta story
    **When** se ejecutan los tests E2E tras la story
    **Then** todos los tests siguen pasando

## Tasks / Subtasks

- [ ] Implementar layout responsive en `ChatWidget.styles.ts` (AC: 1, 2, 8)
  - [ ] Variables CSS para breakpoint: `--widget-width`, `--widget-height`, `--widget-radius`
  - [ ] Mobile: `min(85vh, 640px)`, `100%`, `20px 20px 0 0`
  - [ ] Desktop: `400px`, `600px`, `16px`
  - [ ] `@media (max-width: 640px)` override de variables
- [ ] Implementar overlay mobile y cierre por tap (AC: 6)
  - [ ] En `ChatWidget.tsx`: renderizar `<div class="chat-overlay">` solo en mobile
  - [ ] Click en overlay → `toggleClickedSignal` (mismo que cierre por X)
- [ ] Implementar drag handle mobile básico (AC: 7)
  - [ ] Handle visual: `36×4px`, centrado, `border-radius: 2px`, `background: var(--gds-color-border)`
  - [ ] Lógica drag: `touchstart` → `touchmove` → si deltaY > 30% altura → cerrar
- [ ] Verificar dark mode se propaga al Shadow DOM (AC: 3, 4)
  - [ ] Los tokens GCS ya incluyen `@media (prefers-color-scheme: dark)` en `:host`
  - [ ] Verificar que `getTokensCSS()` se inyecta correctamente en el Shadow DOM de `ChatWidget`
  - [ ] Smoke test manual: activar dark mode en macOS → comprobar widget
- [ ] Verificar `prefers-reduced-motion` (AC: 5)
  - [ ] Los tokens GCS ya incluyen el `@media (prefers-reduced-motion: reduce)` que pone durations a 0ms
  - [ ] Revisar que ningún componente use `transition` o `animation` con duraciones hardcodeadas
  - [ ] Si hay duraciones hardcodeadas en algún `.styles.ts`, migrar a `var(--gds-duration-*)` 
- [ ] Implementar focus trap en `ChatWidget.tsx` (AC: 9)
  - [ ] `trapFocus` function con `Tab`/`Shift+Tab` cycling
  - [ ] Focus al composer al abrir, focus al toggle al cerrar
  - [ ] `role="dialog"`, `aria-modal="true"`, `aria-label="Chat de soporte"`
- [ ] Verificar `npm run build` sin errores (AC: 1)
- [ ] Ejecutar tests E2E y confirmar verde (AC: 10)

## Dev Notes

### Layout responsive en ChatWidget.styles.ts

Patrón de variables CSS que cambian en el breakpoint (UX Spec Step 13):

```css
/* En el :host — valores desktop por defecto */
:host {
    --widget-width: 400px;
    --widget-height: 600px;
    --widget-radius: 16px;
    --widget-position-bottom: 24px;
    --widget-position-right: 24px;
}

/* En getTokensCSS() ya están los tokens --gds-layout-* */
/* En ChatWidget.styles.ts — layout del panel */
.chat-panel {
    width: var(--widget-width, 400px);
    height: var(--widget-height, 600px);
    border-radius: var(--widget-radius, 16px);
    position: fixed;
    bottom: var(--widget-position-bottom, 24px);
    right: var(--widget-position-right, 24px);
}

@media (max-width: 640px) {
    :host {
        --widget-width: 100%;
        --widget-height: min(85vh, 640px);
        --widget-radius: 20px 20px 0 0;
        --widget-position-bottom: 0;
        --widget-position-right: 0;
    }
}
```

### Overlay mobile

```typescript
// En ChatWidget.tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

{isOpen && isMobile && (
    <div
        class="chat-overlay"
        onClick={handleClose}
        aria-hidden="true"
    />
)}
```

CSS overlay:
```css
.chat-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(2px);
    z-index: var(--gds-z-overlay);
}
```

### Drag handle — implementación mínima

```typescript
const dragStartY = useRef<number>(0);
const panelRef = useRef<HTMLDivElement>(null);

const handleTouchStart = (e: TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
};

const handleTouchEnd = (e: TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - dragStartY.current;
    const panelHeight = panelRef.current?.offsetHeight ?? 600;
    if (deltaY > panelHeight * 0.3) {
        handleClose();
    }
};
```

El drag handle visual (no funcional en MVP, solo visual):
```typescript
<div class="chat-drag-handle" aria-hidden="true" />
```

### Verificación dark mode

El dark mode YA está en `getTokensCSS()` (Story 6.1):
```css
@media (prefers-color-scheme: dark) {
    :host { --gds-color-bg: #0f172a; /* etc */ }
}
```

Pero hay que verificar que:
1. `getTokensCSS()` se inyecta en el `<style>` dentro del Shadow DOM antes de los estilos de componentes
2. Los componentes refactorizados en Stories 6.3-6.6 usen tokens `--gds-*` y no valores hardcodeados

Si algún componente tiene valores hardcodeados que no cambian en dark mode, identificarlos y migrar a tokens.

### Verificación prefers-reduced-motion

Igual que dark mode: los tokens lo manejan automáticamente. La verificación es asegurar que las transiciones usen `var(--gds-duration-*)`:

```css
/* CORRECTO — respeta reduced-motion automáticamente */
transition: opacity var(--gds-duration-normal) var(--gds-ease-out);

/* INCORRECTO — ignora reduced-motion */
transition: opacity 150ms ease-out;
```

Revisar todos los `.styles.ts` de los componentes modificados en este Epic y migrar duraciones hardcodeadas.

### Focus trap — código exacto (UX Spec Step 13)

```typescript
const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(panelRef.current!.querySelectorAll(
        'button,[href],input,textarea,[tabindex]:not([tabindex="-1"])'
    ));
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length-1] as HTMLElement;
    if (e.shiftKey && document.activeElement===first) {
        e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement===last) {
        e.preventDefault(); first.focus();
    }
};

// En el useEffect de apertura del panel:
document.addEventListener('keydown', trapFocus);
return () => document.removeEventListener('keydown', trapFocus);
```

**Nota Shadow DOM:** el `document.activeElement` dentro del Shadow DOM puede requerir `shadowRoot.activeElement`. Verificar con tests reales.

### Tab order ChatView (UX Spec Step 8)

`back → cerrar → composer → send → quick replies`

Asegurar que el `tabIndex` o el orden DOM coincida con este tab order natural.

### Scope de esta story

Esta story es de **verificación + pulido** más que de implementación nueva. La mayor parte (dark mode, reduced-motion) ya está en los tokens de Story 6.1. Las tareas principales son:

1. Responsive layout (única implementación nueva grande)
2. Focus trap (accesibilidad WCAG AA obligatoria)
3. Audit de duraciones hardcodeadas en `.styles.ts`
4. Smoke test visual dark mode + mobile

### References

- UX Spec Step 13 (Responsive & Accessibility): breakpoint 640px, bottom sheet `min(85vh,640px)`, overlay, drag handle, focus trap código exacto, Visual Viewport API
- UX Spec Step 8: `prefers-color-scheme`, `prefers-reduced-motion`, tabla WCAG AA requirements
- UX Spec Step 2: Platform Strategy — "breakpoint único 640px", bottom sheet
- `src/presentation/components/ChatWidget/ChatWidget.tsx` — archivo principal a modificar
- `src/presentation/components/ChatWidget/ChatWidget.styles.ts` — layout responsive a añadir
- Story 6.1: tokens ya incluyen dark mode + reduced-motion en `:host`
- Stories 6.3–6.6: componentes a auditar por duraciones hardcodeadas

## Dev Agent Record

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

### File List
