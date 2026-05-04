# Implementation Readiness Assessment Report

**Fecha:** 2026-05-04
**Proyecto:** guiders-sdk

---

## Inventario de Documentos

### PRD
- `prd.md` (8.1 KB, 25 Apr 2026) — documento completo

### Architecture
- `architecture.md` (14 KB, 25 Apr 2026) — documento completo

### Epics & Stories
- `epics.md` (26 KB, 25 Apr 2026) — documento completo
- `stories/story-1.1.md` a `story-5.1.md` — 13 archivos

### UX Design
- `ux-design-specification.md` (50 KB, 04 May 2026) — documento completo (Steps 1–14)

Sin duplicados. Sin documentos faltantes.

---

## Análisis del PRD

### Requisitos Funcionales

| ID | Requisito |
|----|-----------|
| FR1 | `ChatUIBridge` implementa exactamente los 55 métodos y propiedades públicas de `ChatUI` con las mismas firmas TypeScript |
| FR2 | Widget de chat (apertura, cierre, envío y recepción de mensajes, scroll automático) funcional con Preact |
| FR3 | Header muestra nombre, avatar e indicador de presencia del comercial asignado, con actualizaciones reactivas |
| FR4 | Typing indicator animado cuando el comercial escribe; eventos `typing:start`/`typing:stop` con debounce desde el visitante |
| FR5 | Quick Actions visibles y funcionales: `send_message`, `open_url`, `request_agent` |
| FR6 | Chat List View — mostrar/ocultar y cambiar entre conversaciones |
| FR7 | `ConsentBanner` montado en `document.body` (fuera del Shadow DOM) con estilos `bottom_bar`, `modal`, `corner` |
| FR8 | Banner offline reactivo al estado de presencia del comercial |
| FR9 | Estado global con `@preact/signals`, accesible desde fuera del árbol de componentes |
| FR10 | Widget montado en Shadow DOM para encapsulación de estilos |
| FR11 | Cada fase de migración finaliza con tests E2E en verde |
| FR12 | Eliminación de `chat-ui.ts`, `quick-actions-ui.ts`, `typing-indicator.ts`, `chat-input.ts` al finalizar Fase 6 |

**Total FRs: 12**

### Requisitos No Funcionales

| ID | Requisito |
|----|-----------|
| NFR1 | Bundle no supera bundle actual en más de 10 KB gzip |
| NFR2 | Compatibilidad ES6+ sin polyfills adicionales |
| NFR3 | TypeScript strict sin errores ni `@ts-ignore` |
| NFR4 | Solo `preact` y `@preact/signals` como nuevas dependencias de producción |
| NFR5 | Tests E2E en verde en todo momento (ningún commit intermedio los rompe) |
| NFR6 | Componentes testeables con `@testing-library/preact` sin servidor PHP |
| NFR7 | Ningún componente `.tsx` supera 300 líneas |
| NFR8 | Actualizaciones granulares via Signals — un cambio en un mensaje no re-renderiza el widget completo |

**Total NFRs: 8**

### Restricciones Adicionales

- `TrackingPixelSDK` no debe modificarse en ninguna fase
- Context API de Preact no puede usarse para estado que el bridge necesita escribir
- CSS como template literals en `.styles.ts` (sin css-loader adicional)
- Named exports exclusivamente; rutas relativas, nunca alias `@/`
- Componentes PascalCase sin sufijo UI; signals con sufijo `Signal`; hooks con prefijo `use`

### Valoración de Completitud del PRD

El PRD es claro, bien estructurado y cubre el alcance técnico de la migración. Los criterios de aceptación globales son verificables. La principal limitación es que el PRD fue escrito **antes** de que se decidiera el refinamiento visual UX (que surgió posteriormente), por lo que **no menciona ningún requisito de UX/UI visual** del nuevo diseño. Esto genera una brecha de trazabilidad entre la especificación UX producida y los epics/stories existentes.

---

## Validación de Cobertura de Epics

### Mapa de Cobertura FR → Epic → Story

| FR | Texto PRD | Cobertura Epic | Estado |
|----|-----------|----------------|--------|
| FR1 | ChatUIBridge: 55 métodos y propiedades | Epic 1 → Story 1.3 | ✅ Cubierto |
| FR2 | Widget funcional con Preact | Epic 2 → Stories 2.1, 2.2, 2.3 | ✅ Cubierto |
| FR3 | Header reactivo con comercial | Epic 3 → Stories 3.1, 3.2 | ✅ Cubierto |
| FR4 | Typing indicator + debounce | Epic 3 → Story 3.3 | ✅ Cubierto |
| FR5 | Quick Actions funcionales | Epic 4 → Story 4.1 | ✅ Cubierto |
| FR6 | Chat List View | Epic 4 → Story 4.2 | ✅ Cubierto |
| FR7 | ConsentBanner en document.body | Epic 2 → Story 2.4 | ✅ Cubierto |
| FR8 | Banner offline reactivo | Epic 3 → Story 3.2 | ✅ Cubierto |
| FR9 | Estado con Preact Signals | Epic 1 → Story 1.2 | ✅ Cubierto |
| FR10 | Shadow DOM | Epic 2 → Story 2.1 | ✅ Cubierto |
| FR11 | Tests E2E en verde transversal | Todos los epics | ✅ Criterio transversal |
| FR12 | Eliminar archivos legados | Epic 5 → Story 5.1 | ✅ Cubierto |

**Cobertura de FRs: 12/12 — 100%**

### NFR Coverage

Todos los NFRs (1–8) están referenciados como criterios transversales en el epics.md. No hay NFR sin mención explícita. La cobertura es completa a nivel de documentación.

### Requisitos sin cobertura en Epics

**Ninguno de los FRs/NFRs del PRD carece de cobertura en los epics.**

Sin embargo, existe una **brecha significativa** no detectada en el mapa de cobertura: los **requisitos de la especificación UX** (Steps 1–14) no tienen ninguna representación en los epics actuales. La UX spec fue producida **después** de los epics y define un alcance diferente (refinamiento visual) que los epics no contemplan.

---

## Evaluación de Alineación UX

### Estado del Documento UX

**Encontrado.** `ux-design-specification.md` — completo, Steps 1–14, 50 KB.

### Alineación UX ↔ PRD

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Alcance del proyecto | ⚠️ **Divergencia** | El PRD define "migración técnica a Preact sin cambiar el comportamiento visual". La UX spec define "refinamiento visual — dirección Concierge Express" con nuevos componentes, tokens CSS, diseño mobile-first y AIDisclaimer. Son dos proyectos distintos. |
| Preservación del comportamiento | ✅ Alineado | La UX spec respeta la arquitectura Preact y los signals. |
| Componente AIDisclaimer | ⚠️ **Sin cobertura PRD** | La UX spec exige un componente nuevo `AIDisclaimer` (EU AI Act Art. 50). El PRD no lo menciona. No existe story para implementarlo. |
| Visual Viewport API (mobile) | ⚠️ **Sin cobertura PRD/Epics** | La UX spec define uso obligatorio de Visual Viewport API en el Composer mobile. No hay story ni criterio de aceptación que lo contemple. |
| Sistema de tokens GCS (`--gds-*`, `--guiders-*`) | ⚠️ **Sin cobertura PRD/Epics** | La UX spec define ~50 tokens primitivos + 6 tokens públicos configurables. No hay ninguna story de implementación de tokens. |
| Responsive design (breakpoint 640px, bottom sheet) | ⚠️ **Sin cobertura PRD/Epics** | La UX spec define layout mobile radicalmente diferente. El PRD no menciona responsive. |
| Dark mode (`prefers-color-scheme`) | ⚠️ **Sin cobertura PRD/Epics** | La UX spec lo requiere. El PRD no lo menciona. |
| WCAG 2.1 AA / EU AI Act | ⚠️ **Sin cobertura PRD/Epics** | La UX spec exige cumplimiento WCAG AA completo y EU AI Act Art.50. El PRD solo menciona NFR2 (compatibilidad navegadores). |

### Alineación UX ↔ Architecture

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Shadow DOM + CSS encapsulado | ✅ Alineado | La arquitectura ya contempla Shadow DOM. La UX spec usa CSS custom properties en Shadow DOM. |
| Estructura de componentes | ✅ Mayormente alineado | La arquitectura define 16 componentes. La UX spec los adopta y añade `AIDisclaimer` como único componente nuevo. |
| Signals para estado reactivo | ✅ Alineado | La UX spec respeta el uso de signals existentes. |
| `AuthorAvatar` / mini-avatars 20px | ⚠️ **Parcialmente alineado** | La UX spec define `AuthorAvatar` como subcomponente inline dentro de `MessageBubble`. La arquitectura no lo menciona explícitamente. |
| `.styles.ts` para CSS | ✅ Alineado | La UX spec define los tokens GCS en `.styles.ts`, coherente con la arquitectura. |
| Bundle size ≤ 450 KB | ✅ Alineado | La UX spec no añade dependencias externas (Design System custom, CSS puro). |

### Advertencias Críticas de Alineación UX

1. **La UX spec describe un proyecto diferente al PRD.** El PRD es una migración técnica (comportamiento visual sin cambios). La UX spec es un rediseño visual. Si se implementa la UX spec sin actualizar el PRD y los epics, el trabajo realizado no tiene trazabilidad formal.

2. **AIDisclaimer (EU AI Act) no tiene story de implementación.** Es el componente con mayor riesgo legal del proyecto (incumplimiento desde agosto 2026) y no existe ninguna story que lo contemple.

3. **13 stories existentes (1.1–5.1) están completas o en progreso** según el contexto del proyecto. El trabajo de refinamiento UX es un segundo proyecto que requiere sus propias stories.

---

## Revisión de Calidad de Epics

### Validación de Valor de Usuario

| Epic | Título | ¿Valor para usuario? | Evaluación |
|------|--------|----------------------|------------|
| Epic 1 | Preparación del toolchain y fundamentos | ⚠️ Técnico | El título y objetivo son técnicos ("instalar Preact", "configurar toolchain"). El valor es interno al equipo, no para el usuario final Sara/Marcos/Diego. Aceptable para un proyecto brownfield de migración interna, aunque formalmente es una violación de "epics deben entregar valor de usuario". |
| Epic 2 | Widget principal funcional con Preact | ✅ Valor usuario | El widget funciona — Sara puede chatear. |
| Epic 3 | Header, presencia y typing indicator | ✅ Valor usuario | Sara ve si el comercial está disponible y cuando escribe. |
| Epic 4 | Quick Actions y Chat List View | ✅ Valor usuario | Sara puede elegir conversación y usar acciones rápidas. |
| Epic 5 | Limpieza del código legado | ⚠️ Técnico | Valor puramente técnico (codebase limpio). Sin impacto directo en usuario final. Aceptable como epic de cierre en migración brownfield. |

**Veredicto:** Epics 1 y 5 son técnicos, no orientados a usuario. En un proyecto de migración brownfield con restricción explícita "no añadir funcionalidades nuevas", esto es aceptable y pragmático. No es una violación bloqueante.

### Validación de Independencia de Epics

| Epic | ¿Independiente? | Observación |
|------|-----------------|-------------|
| Epic 1 | ✅ | Puede completarse solo (toolchain + signals + bridge delegante) |
| Epic 2 | ✅ | Usa output de Epic 1 (signals, bridge). Sin Epic 3/4/5. |
| Epic 3 | ✅ | Usa Epic 1+2. Sin dependencia de Epic 4/5. |
| Epic 4 | ✅ | Usa Epic 1+2+3. Sin dependencia de Epic 5. |
| Epic 5 | ✅ | Requiere Epics 1–4 completos (explicitado en criterios de Story 5.1). |

**Sin dependencias circulares. Orden secuencial correcto.**

### Análisis de Dependencias de Stories

#### Epic 1
- Story 1.1 (toolchain) — independiente ✅
- Story 1.2 (signals) — depende de 1.1 (build configurado) ✅ lógico
- Story 1.3 (bridge delegante) — depende de 1.1 + 1.2 ✅ lógico

#### Epic 2
- Story 2.1 (ChatWidget + Shadow DOM) — depende de Epic 1 ✅
- Story 2.2 (ChatMessages + MessageBubble) — depende de 2.1 ✅
- Story 2.3 (conectar bridge a Preact) — depende de 2.1 + 2.2 ✅
- Story 2.4 (ConsentBanner) — depende de Epic 1; independiente de 2.1–2.3 ✅

#### Epic 3
- Story 3.1 (ChatHeader) — depende de Epic 2 ✅
- Story 3.2 (PresenceIndicator + OfflineBanner) — depende de Epic 2 ✅
- Story 3.3 (ChatInput + TypingIndicator) — depende de Epic 2 ✅

#### Epic 4
- Story 4.1 (QuickActions) — depende de Epic 2 ✅
- Story 4.2 (ChatListView) — depende de Epics 2+3 ✅

#### Epic 5
- Story 5.1 — depende de Epics 1–4 todos completos. **Explicitado claramente.** ✅

**Sin forward dependencies. Sin dependencias circulares.**

### Revisión de Criterios de Aceptación (muestra)

| Story | BDD Given/When/Then | Testable | Cubre errores | Evaluación |
|-------|---------------------|----------|---------------|------------|
| 1.1 | ✅ | ✅ | Parcial | No incluye AC para el caso de fallo de `npm install` o conflictos de versión |
| 1.3 | ✅ | ✅ | ✅ | Bien definido. Cubre los 55 métodos. |
| 2.2 | ✅ | ✅ | Parcial | No cubre mensajes con contenido HTML malformado en `dangerouslySetInnerHTML` |
| 2.3 | ✅ | ✅ | ✅ | Bien definido. Cubre casos de show/hide/renderMessage/clearMessages. |
| 3.3 | ✅ | ✅ | Parcial | El AC de debounce (300ms / 2000ms) es correcto pero no cubre el caso de pérdida de conexión durante el typing |
| 5.1 | ✅ | ✅ | ✅ | Criterios de aceptación completos y verificables |

### Verificación Brownfield

✅ El proyecto es brownfield. Los epics contemplan correctamente:
- Integration points con `TrackingPixelSDK` existente (Story 1.3)
- Migración incremental que preserva tests E2E (criterio transversal)
- Eliminación ordenada de código legado (Epic 5)

No se aplica el criterio "starter template" (no es greenfield).

### Hallazgos de Calidad por Severidad

#### 🔴 Violaciones Críticas

**Ninguna violación crítica** en los epics existentes para el alcance de la migración técnica.

#### 🟠 Problemas Mayores

**M1 — Brecha de cobertura UX:** Los 5 epics y 13 stories cubren la migración técnica a Preact, pero **no contemplan ningún aspecto del refinamiento visual** definido en la UX spec (50 KB, Steps 1–14). El proyecto tiene dos fases distintas:
- Fase A: Migración técnica (Epics 1–5) — **completada según contexto**
- Fase B: Refinamiento visual UX (sin epics ni stories)

La Fase B no tiene ninguna trazabilidad formal en los artefactos de planificación.

**M2 — AIDisclaimer sin story:** El componente `AIDisclaimer` es obligatorio por EU AI Act Art. 50 (agosto 2026) y está definido en la UX spec como componente nuevo. No existe ninguna story que contemple su implementación. Es el único componente verdaderamente nuevo del proyecto.

**M3 — Ausencia de stories de tokens CSS:** La UX spec define el sistema de tokens GCS (`--gds-*` + `--guiders-*`) como pieza central del diseño. No hay story que contemple la creación de estos tokens.

#### 🟡 Preocupaciones Menores

**m1 — Story 2.2:** No cubre el caso de sanitización de HTML en `dangerouslySetInnerHTML`. Riesgo XSS si el backend devuelve contenido no sanitizado.

**m2 — Story 3.3:** Los valores de debounce (300ms / 2000ms) están hardcodeados en los ACs. Si son configurables, deberían ser tokens de configuración, no literales.

**m3 — NFR6 (testeabilidad con `@testing-library/preact`):** No hay ninguna story que establezca la infraestructura de tests unitarios. Se declara como habilitador pero no hay work item que lo implemente.

**m4 — Epics 1 y 5 son técnicos (sin valor directo de usuario).** Aceptable en brownfield, pero formalmente son violaciones del principio "epics entregan valor de usuario".

---

## Resumen y Recomendaciones

### Estado General de Readiness

> **⚠️ NECESITA TRABAJO — LISTO PARA FASE A (migración técnica), NO LISTO PARA FASE B (refinamiento UX)**

Los artefactos de planificación existentes son **suficientes y bien estructurados para la migración técnica a Preact** (Epics 1–5). Sin embargo, la especificación UX producida define un segundo proyecto de refinamiento visual que **no tiene cobertura en ningún epic ni story**.

### Problemas Críticos a Resolver Antes de Implementar el Refinamiento UX

1. **Crear epics y stories para la Fase B (refinamiento visual UX)**
   Las 4 fases del roadmap definidas en la UX spec (Step 11) deben convertirse en epics/stories formales antes de comenzar la implementación. Sin ellas, el dev agent no tendrá contexto suficiente.

2. **Crear story específica para `AIDisclaimer`**
   Es el componente con mayor riesgo legal (EU AI Act Art. 50, agosto 2026). Debe tener su propia story con criterios de aceptación explícitos que validen el comportamiento y la visibilidad del disclaimer.

3. **Actualizar o crear addendum al PRD**
   El PRD actual declara explícitamente "No cambiar el comportamiento visual". La Fase B lo contradice. Se necesita o un PRD separado para el refinamiento o un addendum que amplíe el alcance.

### Pasos Recomendados

1. **Ejecutar `bmad-create-story` para cada fase del roadmap UX** — las 4 fases del Step 11 de la UX spec son el input ideal para generar stories con ACs basados en la dirección visual "Concierge Express".

2. **Story prioritaria: AIDisclaimer** — crear story 6.1 (o como corresponda en la nueva numeración) con ACs que validen: disclaimer visible cuando IA activa, desaparece cuando humano activo, copy configurable por Marcos, cumplimiento EU AI Act.

3. **Decidir si actualizar el PRD o crear uno nuevo** para el refinamiento visual, para mantener trazabilidad.

4. **Opcional: añadir story de infraestructura de tokens CSS** que genere el archivo de tokens GCS antes de tocar ningún componente visual.

### Nota Final

Esta evaluación identificó **2 problemas mayores** y **4 preocupaciones menores**. Los problemas mayores no bloquean la implementación de la migración técnica (ya completada según contexto), pero sí bloquean una implementación ordenada y trazable del refinamiento visual. Se recomienda resolver M1, M2 y M3 antes de comenzar la Fase B.

Los epics y stories existentes (1.1–5.1) tienen **alta calidad**: dependencias correctas, ACs en formato BDD, cobertura 100% de FRs del PRD original.

---

*Reporte generado el 2026-05-04. Evaluador: Implementation Readiness Validator.*
