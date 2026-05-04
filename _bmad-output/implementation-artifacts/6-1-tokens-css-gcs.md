# Story 6.1: Sistema de Tokens CSS GCS (Guiders Concierge System)

Status: review

## Story

Como desarrollador del SDK que implementa el refinamiento visual,
quiero que exista un único archivo centralizado `tokens.styles.ts` con todos los tokens CSS (`--gds-*` y `--guiders-*`) del sistema GCS,
para que todos los componentes consuman variables coherentes y cualquier cambio de marca o tema se aplique en un solo lugar.

## Acceptance Criteria

1. **Given** que se crea `src/presentation/styles/tokens.styles.ts`
   **When** se ejecuta `npm run build`
   **Then** compila sin errores y el bundle no supera 450 KB

2. **Given** que `tokens.styles.ts` exporta la función `getTokensCSS()`
   **When** se inyecta en el Shadow DOM de `ChatWidget`
   **Then** todos los tokens `--gds-*` están disponibles en `:host` del Shadow DOM

3. **Given** que el SO del usuario tiene `prefers-color-scheme: dark`
   **When** el Shadow DOM está montado con los tokens inyectados
   **Then** los tokens semánticos cambian automáticamente a sus valores dark sin JS adicional

4. **Given** que el usuario tiene `prefers-reduced-motion: reduce`
   **When** el Shadow DOM está montado con los tokens inyectados
   **Then** todos los tokens `--gds-duration-*` valen `0ms`

5. **Given** que `ChatWidget.styles.ts` actualmente inyecta `@import url('https://fonts.googleapis.com/css2?family=Inter...')`
   **When** se migra al sistema de tokens
   **Then** ese import se elimina y se reemplaza por `font-family: var(--gds-font-family)` que usa `system-ui` stack (0 KB descarga)

6. **Given** que un cliente del SDK define en su CSS `:root { --guiders-primary: #ff6b35; }`
   **When** el widget se renderiza
   **Then** `--gds-color-primary` toma el valor `#ff6b35` (los tokens públicos `--guiders-*` sobreescriben los primitivos)

7. **Given** que los tests E2E están en verde antes de esta story
   **When** se ejecutan los tests E2E tras la story
   **Then** todos los tests siguen pasando (la migración a tokens es transparente visualmente)

8. **Given** que `ChatWidget.tsx` inyecta estilos en el Shadow DOM
   **When** se revisa el código
   **Then** llama a `getTokensCSS()` como primer bloque de estilos, antes de los estilos de componentes

## Tasks / Subtasks

- [ ] Crear directorio `src/presentation/styles/` (AC: 1)
- [ ] Crear `src/presentation/styles/tokens.styles.ts` con todos los tokens (AC: 2, 3, 4, 6)
  - [ ] Tokens de color primitivos Slate/Blue/Violet/Semánticos
  - [ ] Mapa semántico `--gds-color-*` light mode
  - [ ] `@media (prefers-color-scheme: dark)` con valores dark de todos los tokens semánticos
  - [ ] `@media (prefers-reduced-motion: reduce)` que pone `--gds-duration-*` a 0ms
  - [ ] Tokens de tipografía `--gds-font-*`
  - [ ] Tokens de spacing `--gds-spacing-*`
  - [ ] Tokens de radius `--gds-radius-*`
  - [ ] Tokens de sombras `--gds-shadow-*`
  - [ ] Tokens de motion `--gds-duration-*` y `--gds-ease-*`
  - [ ] Tokens de z-index `--gds-z-*`
  - [ ] Tokens de layout `--gds-layout-*`
  - [ ] Tokens públicos `--guiders-*` que derivan de los primitivos
- [ ] Crear `src/presentation/styles/index.ts` con barrel export (AC: 1)
- [ ] Modificar `ChatWidget.tsx` para inyectar `getTokensCSS()` al inicio del bloque de estilos del Shadow DOM (AC: 8)
- [ ] Eliminar el `@import url('https://fonts.googleapis.com/css2?family=Inter...')` de `ChatWidget.styles.ts` (AC: 5)
- [ ] Verificar `npm run build` sin errores (AC: 1)
- [ ] Ejecutar tests E2E y confirmar verde (AC: 7)

## Dev Notes

### Archivo de destino

Crear: `src/presentation/styles/tokens.styles.ts`

Este archivo es el **único lugar de verdad** para todos los tokens. No debe tener lógica, solo CSS como template literal.

### Estructura exacta del archivo

```typescript
/**
 * GCS (Guiders Concierge System) — CSS Tokens
 * Single source of truth for all design tokens.
 * Injected into the Shadow DOM :host before any component styles.
 */
export function getTokensCSS(): string {
  return `
    :host {
      /* === TOKENS PÚBLICOS (API del SDK — configurables por Marcos) === */
      --guiders-primary: #2563eb;
      --guiders-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      --guiders-radius: 14px;
      --guiders-spacing: 4px;
      --guiders-color-scheme: auto;

      /* === COLOR PRIMITIVOS === */
      /* Slate */
      --gds-slate-50: #f8fafc;
      /* ... resto de primitivos ... */

      /* === TOKENS SEMÁNTICOS LIGHT (default) === */
      --gds-color-bg: #ffffff;
      --gds-color-bg-elevated: #f8fafc;
      --gds-color-text: #0f172a;
      --gds-color-text-secondary: #475569;
      --gds-color-text-tertiary: #94a3b8;
      --gds-color-border: #e2e8f0;
      --gds-color-border-strong: #cbd5e1;
      --gds-color-primary: var(--guiders-primary, #2563eb);
      --gds-color-primary-soft: #dbeafe;
      /* Author tokens — NO configurables por requisito P7/AI Act */
      --gds-color-author-human: #2563eb;
      --gds-color-author-human-soft: #eff6ff;
      --gds-color-author-ai: #7c3aed;      /* FIJO — viola EU AI Act si se cambia */
      --gds-color-author-ai-soft: #f5f3ff;
      --gds-color-author-system: #94a3b8;
      /* Semánticos estado */
      --gds-color-success: #16a34a;
      --gds-color-warning: #d97706;
      --gds-color-error: #dc2626;
      --gds-color-info: #64748b;

      /* === TIPOGRAFÍA === */
      --gds-font-family: var(--guiders-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
      --gds-font-size-xs: 11px;
      --gds-font-size-sm: 13px;
      --gds-font-size-base: 14px;
      --gds-font-size-md: 15px;
      --gds-font-size-lg: 17px;
      --gds-font-weight-normal: 400;
      --gds-font-weight-medium: 500;
      --gds-font-weight-semibold: 600;
      --gds-line-height-tight: 1.3;
      --gds-line-height-normal: 1.5;
      --gds-line-height-relaxed: 1.6;

      /* === SPACING (escala 4px) === */
      --gds-spacing-1: calc(var(--guiders-spacing, 4px) * 1);   /* 4px */
      --gds-spacing-2: calc(var(--guiders-spacing, 4px) * 2);   /* 8px */
      --gds-spacing-3: calc(var(--guiders-spacing, 4px) * 3);   /* 12px */
      --gds-spacing-4: calc(var(--guiders-spacing, 4px) * 4);   /* 16px */
      --gds-spacing-5: calc(var(--guiders-spacing, 4px) * 5);   /* 20px */
      --gds-spacing-6: calc(var(--guiders-spacing, 4px) * 6);   /* 24px */
      --gds-spacing-8: calc(var(--guiders-spacing, 4px) * 8);   /* 32px */
      --gds-spacing-12: calc(var(--guiders-spacing, 4px) * 12); /* 48px */

      /* === RADIUS === */
      --gds-radius-sm: 4px;
      --gds-radius-md: 8px;
      --gds-radius-lg: var(--guiders-radius, 14px);
      --gds-radius-bubble: 14px;
      --gds-radius-bubble-tail-left: 14px 14px 14px 4px;
      --gds-radius-bubble-tail-right: 14px 14px 4px 14px;
      --gds-radius-widget: 16px;
      --gds-radius-pill: 9999px;

      /* === SOMBRAS === */
      --gds-shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
      --gds-shadow-md: 0 4px 12px rgba(0,0,0,0.10);
      --gds-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
      --gds-shadow-widget: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);

      /* === MOTION (Linear-style) === */
      --gds-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
      --gds-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
      --gds-duration-fast: 100ms;
      --gds-duration-normal: 150ms;
      --gds-duration-medium: 200ms;
      --gds-duration-slow: 300ms;

      /* === Z-INDEX === */
      --gds-z-widget: 2147483640;
      --gds-z-overlay: 2147483639;
      --gds-z-tooltip: 2147483641;

      /* === LAYOUT === */
      --gds-widget-width: 400px;
      --gds-widget-height: 600px;
      --gds-widget-offset: 24px;
    }

    /* === DARK MODE AUTO-DETECT === */
    @media (prefers-color-scheme: dark) {
      :host {
        --gds-color-bg: #0f172a;
        --gds-color-bg-elevated: #1e293b;
        --gds-color-text: #f1f5f9;
        --gds-color-text-secondary: #cbd5e1;
        --gds-color-text-tertiary: #64748b;
        --gds-color-border: #334155;
        --gds-color-border-strong: #475569;
        --gds-color-primary-soft: #1e3a8a;
        --gds-color-author-human: #3b82f6;
        --gds-color-author-human-soft: #1e3a8a;
        --gds-color-author-ai: #8b5cf6;
        --gds-color-author-ai-soft: #2e1065;
        --gds-color-author-system: #64748b;
      }
    }

    /* === REDUCED MOTION === */
    @media (prefers-reduced-motion: reduce) {
      :host {
        --gds-duration-fast: 0ms;
        --gds-duration-normal: 0ms;
        --gds-duration-medium: 0ms;
        --gds-duration-slow: 0ms;
      }
    }
  `;
}
```

### Cómo inyectar en ChatWidget.tsx

En `ChatWidget.tsx`, donde se construye el string de estilos del Shadow DOM, los tokens deben ir PRIMERO:

```typescript
// En ChatWidget.tsx — función que monta en Shadow DOM
import { getTokensCSS } from '../../styles/tokens.styles';
import { getChatStyles } from './ChatWidget.styles';

// Al montar el Shadow DOM:
const styleEl = document.createElement('style');
styleEl.textContent = getTokensCSS() + getChatStyles(resolvedPosition);
shadowRoot.appendChild(styleEl);
```

### Tokens de autor — RESTRICCIÓN LEGAL

`--gds-color-author-ai` (#7c3aed light / #8b5cf6 dark) y `--gds-color-author-ai-soft` **NO deben exponerse como tokens públicos `--guiders-*`**. Son fijos por el principio P7 y EU AI Act Art. 50: el color violeta identifica inequívocamente a la IA y no puede ser modificado por clientes del SDK sin romper el requisito de transparencia legal.

Documentar este constraint con comentario explícito en el código.

### Eliminación del @import Google Fonts

El archivo `ChatWidget.styles.ts` (línea 18) contiene:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
:host { all: initial; font-family: 'Inter', sans-serif; }
```

Esto debe eliminarse. Reemplazar por:
```css
:host { all: initial; font-family: var(--gds-font-family); }
```

**Razón:** Inter no es necesario — el SDK usa `system-ui` para 0 KB de descarga. Además, el `@import` dentro de Shadow DOM tiene soporte inconsistente cross-browser.

### Convenciones de código del proyecto

- **Named exports exclusivamente** — `export function getTokensCSS()` ✅ nunca `export default`
- **Rutas relativas** — `import { getTokensCSS } from '../../styles/tokens.styles'`
- **TypeScript strict** — la función retorna `string`, tipado explícito
- **Archivo `.styles.ts`** — convención del proyecto para archivos CSS

### Estructura de archivos a crear/modificar

```
src/presentation/
  styles/               ← NUEVO directorio
    tokens.styles.ts    ← NUEVO archivo (este story)
    index.ts            ← NUEVO barrel export
  components/
    ChatWidget/
      ChatWidget.tsx    ← MODIFICAR: inyectar getTokensCSS() al inicio
      ChatWidget.styles.ts  ← MODIFICAR: eliminar @import Inter, usar --gds-font-family
```

### Archivos de styles existentes (NO tocar en esta story)

Los siguientes `.styles.ts` existen y funcionan. Esta story NO los modifica — las stories del Epic 6 posteriores los migrarán a tokens gradualmente:

- `src/presentation/components/ChatMessages/MessageBubble.styles.ts`
- `src/presentation/components/ToggleButton/ToggleButton.styles.ts`
- `src/presentation/components/ChatListView/ChatListView.styles.ts`
- `src/presentation/components/QuickActions/QuickActions.styles.ts`
- `src/presentation/components/ChatInput/ChatInput.styles.ts`
- `src/presentation/components/TypingIndicator/TypingIndicator.styles.ts`
- `src/presentation/components/OfflineBanner/OfflineBanner.styles.ts`
- `src/presentation/components/PresenceIndicator/PresenceIndicator.styles.ts`
- `src/presentation/components/ChatHeader/ChatHeader.styles.ts`
- `src/presentation/components/ConsentBanner/ConsentBanner.styles.ts`

### Verificación bundle size

Después de la story, verificar:
```bash
npm run build 2>&1 | grep -E "bundle|size|KB"
```
El bundle no debe superar 450 KB. Los tokens son CSS puro como string — overhead esperado < 2 KB.

### Project Structure Notes

- Shadow DOM en `ChatWidget.tsx` está en modo `open`. Los tokens se definen en `:host` y son accesibles desde dentro del Shadow DOM.
- CSS Custom Properties definidas en `:host` del Shadow DOM **NO son accesibles desde fuera** del Shadow DOM (correcto — encapsulación). Los tokens `--guiders-*` (públicos) sí se leen desde el exterior porque son overrides que el cliente pone en su propio `:root` y que el widget lee al crear los tokens (no al consumirlos).
- **Aclaración importante sobre `--guiders-*`:** el mecanismo de override funciona porque `var(--guiders-primary, #2563eb)` en el `:host` del Shadow DOM busca primero el valor heredado del documento host. Las CSS Custom Properties SÍ se heredan a través del Shadow DOM (a diferencia de propiedades CSS normales). El cliente solo necesita definir `--guiders-primary` en `:root` o en cualquier ancestro del shadow host.

### References

- UX Spec Step 6 (Design System Foundation): `_bmad-output/planning-artifacts/ux-design-specification.md` — sección "Design System Foundation" → tabla completa de tokens `--gds-*` y valores light/dark
- UX Spec Step 8 (Visual Design Foundation): misma spec — sección "Color System", "Typography System", "Spacing & Layout Foundation"
- UX Spec Step 13 (Responsive & Accessibility): misma spec — sección "Responsive Design & Accessibility" → tokens `prefers-reduced-motion`, breakpoint 640px
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — sección "Gestión de estilos CSS" confirma patrón `.styles.ts` como template literal
- Código existente: `src/presentation/components/ChatWidget/ChatWidget.styles.ts` — archivo actual a modificar (1130 líneas, colores hardcodeados a reemplazar progresivamente por tokens)
- PRD NFR1: bundle ≤ 450 KB; NFR3: TypeScript strict

## Review Findings

- [ ] [Review][Decision] `--gds-color-author-ai` cambia en dark mode (#7c3aed → #8b5cf6): ¿es intencional o viola el constraint "FIXED" del EU AI Act? — El comentario dice FIXED pero el valor muta; si "fixed" significa "no configurable por clientes" entonces el override dark-mode es correcto; si "fixed" significa "valor inmutable", es una violación de compliance [`tokens.styles.ts:178`]
- [ ] [Review][Decision] `--guiders-color-scheme: auto` declarado pero inerte — no existe lógica CSS que lo consuma para suprimir el `@media (prefers-color-scheme: dark)`; un cliente que quiera forzar modo claro con `--guiders-color-scheme: light` no verá efecto [`tokens.styles.ts:26`]
- [x] [Review][Defer] `--gds-slate-600` ausente — salto de 500→700 sin 600; consumidores que referencien `var(--gds-slate-600)` obtendrán undefined silencioso [`tokens.styles.ts`] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

github-copilot/claude-sonnet-4.6

### Debug Log References

### Completion Notes List

### File List
