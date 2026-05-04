# PRD — Migración de Presentación a Preact

**Proyecto:** guiders-sdk  
**Versión:** 1.0  
**Fecha:** 2026-04-25  
**Tipo:** Refactoring técnico interno (no afecta la API pública del SDK)

---

## Resumen ejecutivo

El SDK `guiders-sdk` es una solución de rastreo de visitantes y chat en tiempo real que se inyecta como `<script>` tag en sitios web de clientes. La capa de presentación actual está implementada en DOM vanilla puro, con dos archivos monolíticos de ~3.500 líneas cada uno que combinan estado, manipulación DOM y lógica de negocio. Esto hace que el mantenimiento y la incorporación de nuevas features sea costoso y propenso a regresiones.

**Objetivo:** Migrar la capa de presentación (`src/presentation/`) a Preact con Signals para mejorar la mantenibilidad y la velocidad de desarrollo, preservando al 100% el comportamiento observable del SDK y sin romper los tests E2E existentes en ningún momento del proceso.

---

## Problema

### Síntomas actuales

- `chat-ui.ts` tiene **3.484 líneas** que mezclan estado, DOM y lógica de negocio — imposible hacer code review efectivo
- Cualquier cambio en la UI requiere **levantar el servidor PHP demo** para validarlo (sin tests unitarios de UI)
- Los ~25 propiedades de instancia privadas con mutaciones directas hacen el flujo de datos invisible
- El CSS está inyectado como strings dentro del JS (~900 líneas en `getChatStyles()`) — sin autocompletado ni herramientas CSS
- Onboarding de nuevos desarrolladores lento: el modelo mental de DOM imperativo es difícil de entender sin un sistema de componentes

### Impacto en el negocio

- Velocidad de desarrollo reducida: features simples requieren modificar archivos de 3.000+ líneas
- Riesgo de regresión alto: sin tests unitarios, cada cambio puede romper comportamiento existente sin detectarse hasta E2E
- Dificultad para escalar el equipo: el código es difícil de entender para desarrolladores con experiencia en frameworks modernos

---

## Objetivos (por prioridad)

1. **Mantenibilidad**: La capa de presentación debe ser legible, modular y fácil de modificar
2. **Velocidad de desarrollo**: Nuevas features de UI deben implementarse más rápido gracias a componentes reutilizables
3. **Reducción de bundle** *(objetivo secundario)*: No es el driver principal, pero no debe empeorar

---

## No objetivos

- **No cambiar la API pública del SDK** — `window.GuidersPixel` y `window.guiders` deben seguir funcionando igual
- **No migrar `src/core/`**, `src/pipeline/`, `src/services/`, `src/types/`, `src/utils/`
- **No reescribir los tests E2E** — deben seguir pasando sin modificaciones
- **No añadir funcionalidades nuevas** durante la migración — esto es refactoring puro
- **No cambiar el comportamiento visual** del widget para el usuario final

---

## Requisitos funcionales

### FR1 — Preservar interfaz pública de ChatUI
El `ChatUIBridge` debe implementar exactamente los 55 métodos y propiedades públicas que `TrackingPixelSDK` consume de `ChatUI`, con las mismas firmas TypeScript.

### FR2 — Widget de chat funcional con Preact
El widget de chat (apertura, cierre, envío y recepción de mensajes, scroll automático) debe funcionar correctamente usando componentes Preact.

### FR3 — Header con información del comercial
El header del chat debe mostrar nombre, avatar e indicador de presencia del comercial asignado, actualizándose reactivamente cuando cambian los datos.

### FR4 — Indicador de escritura (typing indicator)
Cuando el comercial está escribiendo, debe mostrarse el indicador animado. Cuando el visitante escribe, debe enviarse el evento `typing:start` / `typing:stop` al servidor con debounce.

### FR5 — Quick Actions funcionales
Los botones de Quick Actions deben mostrarse correctamente y ejecutar las acciones configuradas (`send_message`, `open_url`, `request_agent`).

### FR6 — Chat List View (selector de conversaciones)
La vista de lista de conversaciones (estilo Intercom) debe mostrarse/ocultarse correctamente y permitir cambiar entre conversaciones.

### FR7 — Banner de consentimiento GDPR
El `ConsentBanner` debe montarse en `document.body` (fuera del Shadow DOM del widget) y funcionar con los tres estilos: `bottom_bar`, `modal`, `corner`.

### FR8 — Banner offline
El banner de estado offline debe mostrarse/ocultarse reactivamente según el estado de presencia del comercial.

### FR9 — Estado reactivo via Signals
Todo el estado del widget (visibilidad, mensajes, presencia, chatId, etc.) debe gestionarse con `@preact/signals`, accesible desde el bridge fuera del árbol de componentes.

### FR10 — Montaje en Shadow DOM
El widget principal debe montarse en un Shadow DOM para encapsular estilos y evitar conflictos con el CSS del sitio del cliente.

### FR11 — Migración incremental sin romper tests E2E
Cada fase de la migración debe completarse con los tests E2E en verde antes de pasar a la siguiente.

### FR12 — Eliminación del código legado
Al finalizar la Fase 6, los archivos `chat-ui.ts`, `quick-actions-ui.ts`, `typing-indicator.ts` y `chat-input.ts` deben eliminarse sin dejar referencias rotas.

---

## Requisitos no funcionales

### NFR1 — Bundle size
El bundle final no debe superar el bundle actual en más de 10 KB gzip. Preact (~3 KB gzip) + Signals (~1.5 KB gzip) = overhead máximo esperado de ~5 KB gzip.

### NFR2 — Compatibilidad de navegadores
El SDK debe seguir funcionando en los mismos navegadores que actualmente soporta (ES6+, sin polyfills adicionales).

### NFR3 — TypeScript strict
Todos los archivos `.tsx` y `.ts` nuevos deben compilar con `strict: true` sin errores ni `@ts-ignore`.

### NFR4 — Sin dependencias adicionales de producción
Solo se añaden `preact` y `@preact/signals` a `dependencies`. El resto de cambios son en `devDependencies`.

### NFR5 — Tests E2E en verde en todo momento
En ningún commit intermedio de ninguna fase pueden fallar los tests E2E existentes en `tests/e2e/`.

### NFR6 — Componentes unitariamente testeables
Los componentes Preact resultantes deben ser testeables con `@testing-library/preact` sin necesidad de levantar el servidor PHP demo (habilitador para futuros tests unitarios).

### NFR7 — Tamaño máximo por componente
Ningún componente `.tsx` debe superar 300 líneas. Si supera ese límite, debe dividirse en subcomponentes.

### NFR8 — Performance de renderizado
El uso de Signals debe garantizar actualizaciones granulares. No se permite que un cambio en el estado de un mensaje provoque el re-render del widget completo.

---

## Criterios de aceptación globales

- [ ] `npm run build` completa sin errores ni warnings en todas las fases
- [ ] Todos los tests E2E en `tests/e2e/` pasan tras cada fase
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] El widget de chat abre, cierra, envía y recibe mensajes correctamente
- [ ] El banner de consentimiento GDPR funciona (accept, deny, preferences)
- [ ] El indicador de presencia online/offline funciona
- [ ] El typing indicator funciona (animación 3 dots)
- [ ] Los Quick Actions ejecutan sus acciones correctamente
- [ ] El Chat List View permite cambiar entre conversaciones
- [ ] `chat-ui.ts` eliminado en Fase 6 sin referencias rotas
- [ ] Bundle final dentro del límite NFR1

---

## Dependencias y restricciones

### Dependencias técnicas
- Preact `^10.26.0` — framework UI
- `@preact/signals` `^2.0.0` — gestión de estado global
- `@babel/preset-react` `^7.26.3` — compilación JSX (devDependency)

### Restricciones
- `TrackingPixelSDK` (`src/core/tracking-pixel-SDK.ts`) **no debe modificarse** durante la migración
- Los tests E2E requieren el servidor PHP demo en `127.0.0.1:8083`
- El Shadow DOM del widget no debe romperse — es necesario para la encapsulación de estilos

---

## Métricas de éxito

| Métrica | Antes | Objetivo |
|---|---|---|
| Líneas en `chat-ui.ts` | 3.484 | 0 (eliminado) |
| Archivos en `src/presentation/` | 22 | ~45 (más pequeños y enfocados) |
| Líneas promedio por componente | ~500 | <150 |
| Tests unitarios de UI | 0 | Habilitados (sin bloqueo de servidor) |
| Tests E2E pasando | ✅ | ✅ (sin degradación) |
| Bundle overhead de la migración | — | <10 KB gzip |

---

*Documento generado el 2026-04-25. Aprobado para iniciar el proceso de creación de Epics y Stories.*
