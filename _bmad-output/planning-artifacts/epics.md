---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
storiesLocation: "_bmad-output/planning-artifacts/stories/"
status: "Done"
---

# guiders-sdk - Epic Breakdown

## Overview

Este documento descompone los requisitos de la migración de la capa de presentación a Preact en epics y stories implementables por el agente desarrollador. La migración es incremental en 6 fases — ninguna fase rompe los tests E2E existentes.

---

## Requirements Inventory

### Functional Requirements

FR1: El `ChatUIBridge` debe implementar exactamente los 55 métodos y propiedades públicas que `TrackingPixelSDK` consume de `ChatUI`, con las mismas firmas TypeScript.
FR2: El widget de chat (apertura, cierre, envío y recepción de mensajes, scroll automático) debe funcionar correctamente usando componentes Preact.
FR3: El header del chat debe mostrar nombre, avatar e indicador de presencia del comercial asignado, actualizándose reactivamente.
FR4: El typing indicator debe mostrar la animación cuando el comercial escribe, y enviar eventos `typing:start`/`typing:stop` con debounce cuando escribe el visitante.
FR5: Los botones de Quick Actions deben mostrarse y ejecutar las acciones configuradas (`send_message`, `open_url`, `request_agent`).
FR6: La vista de lista de conversaciones (Chat List View) debe mostrarse/ocultarse y permitir cambiar entre conversaciones.
FR7: El `ConsentBanner` debe montarse en `document.body` (fuera del Shadow DOM) y funcionar con los estilos `bottom_bar`, `modal` y `corner`.
FR8: El banner offline debe mostrarse/ocultarse reactivamente según el estado de presencia del comercial.
FR9: Todo el estado del widget debe gestionarse con `@preact/signals`, accesible desde el bridge fuera del árbol de componentes.
FR10: El widget principal debe montarse en un Shadow DOM para encapsular estilos.
FR11: Cada fase de la migración debe completarse con los tests E2E en verde antes de pasar a la siguiente.
FR12: Al finalizar Fase 6, los archivos `chat-ui.ts`, `quick-actions-ui.ts`, `typing-indicator.ts` y `chat-input.ts` deben eliminarse sin referencias rotas.

### NonFunctional Requirements

NFR1: El bundle final no debe superar el bundle actual en más de 10 KB gzip (Preact ~3 KB + Signals ~1.5 KB = ~5 KB overhead esperado).
NFR2: El SDK debe seguir funcionando en los mismos navegadores (ES6+, sin polyfills adicionales).
NFR3: Todos los archivos `.tsx` y `.ts` nuevos deben compilar con `strict: true` sin errores ni `@ts-ignore`.
NFR4: Solo se añaden `preact` y `@preact/signals` a `dependencies`. El resto en `devDependencies`.
NFR5: En ningún commit intermedio de ninguna fase pueden fallar los tests E2E existentes.
NFR6: Los componentes Preact resultantes deben ser testeables con `@testing-library/preact` sin necesidad de levantar el servidor PHP.
NFR7: Ningún componente `.tsx` debe superar 300 líneas.
NFR8: Los Signals deben garantizar actualizaciones granulares — un cambio en un mensaje no debe provocar re-render del widget completo.

### Additional Requirements

- Starter template: No aplica. Proyecto brownfield existente.
- `TrackingPixelSDK` no debe modificarse en ninguna fase.
- Los tests E2E requieren el servidor PHP demo en `127.0.0.1:8083`.
- El Shadow DOM del widget debe preservarse para la encapsulación de estilos.
- Context API de Preact no puede usarse para estado que el bridge escribe (usar Signals).
- CSS gestionado como template literals en archivos `.styles.ts` (sin `css-loader` adicional).
- Named exports exclusivamente — nunca default exports.
- Rutas de importación relativas, nunca alias `@/`.
- Convención de nombres: componentes PascalCase sin sufijo `UI`, signals con sufijo `Signal`, hooks con prefijo `use`.

### UX Design Requirements

No aplica. Este es un SDK técnico embebido. La interfaz de usuario final no cambia — se preserva exactamente el mismo aspecto visual y comportamiento. No hay documento de diseño UX.

### FR Coverage Map

| FR | Epic | Stories |
|---|---|---|
| FR1 | Epic 1 | 1.3 |
| FR2 | Epic 2 | 2.1, 2.2, 2.3 |
| FR3 | Epic 3 | 3.1, 3.2 |
| FR4 | Epic 3 | 3.3 |
| FR5 | Epic 4 | 4.1 |
| FR6 | Epic 4 | 4.2 |
| FR7 | Epic 2 | 2.4 |
| FR8 | Epic 3 | 3.2 |
| FR9 | Epic 1 | 1.2 |
| FR10 | Epic 2 | 2.1 |
| FR11 | Todos los epics | Criterio transversal |
| FR12 | Epic 5 | 5.1 |
| NFR1–NFR8 | Todos los epics | Criterio transversal |

---

## Epic List

- **Epic 1**: Preparación del toolchain y fundamentos (Fase 0 + Fase 1)
- **Epic 2**: Widget principal funcional con Preact (Fase 2 + Fase 3)
- **Epic 3**: Header, presencia y typing indicator (Fase 4)
- **Epic 4**: Features secundarias — Quick Actions y Chat List View (Fase 5)
- **Epic 5**: Limpieza y eliminación del código legado (Fase 6)
- **Epic 7**: Customización y configuración administrativa (Post-migración)

---

## Epic 1: Preparación del toolchain y fundamentos

**Objetivo:** Instalar Preact, configurar el toolchain para TypeScript + JSX, crear la infraestructura de Signals y establecer el `ChatUIBridge` delegante que preserva el contrato con `TrackingPixelSDK` sin cambiar ningún comportamiento.

Al finalizar este epic, el SDK compila y funciona exactamente igual que antes — el bridge simplemente delega en el `ChatUI` original.

---

### Story 1.1: Configurar toolchain para Preact y TSX

Como desarrollador del SDK,
quiero que el proyecto compile archivos `.tsx` con Preact correctamente,
para que pueda empezar a escribir componentes Preact sin errores de compilación.

**Acceptance Criteria:**

**Given** el proyecto con su configuración actual de webpack y TypeScript
**When** se ejecuta `npm install preact @preact/signals` y se actualizan `tsconfig.json` y `webpack.config.js`
**Then** `npm run build` completa sin errores

**Given** un archivo `.tsx` de prueba con JSX de Preact en `src/presentation/`
**When** se ejecuta `npm run build`
**Then** el archivo compila correctamente sin necesidad de importar `h` manualmente (gracias a `jsxImportSource: "preact"`)

**Given** la configuración actualizada
**When** se ejecuta `npx tsc --noEmit --strict`
**Then** no hay errores de TypeScript

**Given** los tests E2E
**When** se ejecutan tras los cambios de configuración
**Then** todos los tests pasan sin modificaciones

**Notas técnicas:**
- Añadir a `tsconfig.json`: `"jsx": "react-jsx"`, `"jsxImportSource": "preact"`, `"lib": ["ES6", "DOM", "DOM.Iterable"]`
- Añadir a `webpack.config.js` `resolve.extensions`: `.tsx`
- Añadir a `webpack.config.js` `resolve.alias`: `react → preact/compat`, `react-dom → preact/compat`, `react/jsx-runtime → preact/jsx-runtime`
- Modificar la regla de `ts-loader` para incluir `/\.(ts|tsx)$/`
- Instalar: `npm install preact @preact/signals` y `npm install --save-dev @babel/preset-react`
- Crear y eliminar un componente smoke test para validar la compilación

---

### Story 1.2: Crear infraestructura de Signals

Como desarrollador del SDK,
quiero que el estado global del widget esté centralizado en Signals de Preact,
para que el bridge pueda escribir estado desde fuera del árbol de componentes y los componentes reaccionen automáticamente.

**Acceptance Criteria:**

**Given** que se crean los archivos de signals en `src/presentation/signals/`
**When** se ejecuta `npm run build`
**Then** compila sin errores

**Given** `src/presentation/signals/chatState.ts`
**When** se importa en cualquier módulo TypeScript
**Then** exporta los signals: `chatIdSignal`, `visitorIdSignal`, `chatDetailSignal`, `lastKnownChatStatusSignal`, `isVisibleSignal`, `isShowingChatListSignal`, `isCreatingChatSignal`, `isLoadingInitialMessagesSignal`, `presenceStatusSignal`, `showOfflineBannerSignal`, `offlineBannerEnabledSignal`, `hasAssignedCommercialSignal` (computed)

**Given** `src/presentation/signals/messagesState.ts`
**When** se importa
**Then** exporta `messagesSignal` (array de `RenderedMessage`) y `messagesLoadedSignal`

**Given** los tests E2E
**When** se ejecutan tras crear los signals
**Then** todos los tests pasan (los signals no afectan el runtime aún)

**Notas técnicas:**
- `hasAssignedCommercialSignal` debe ser `computed(() => !!(chatDetailSignal.value?.assignedCommercial?.id))`
- No conectar los signals a ningún componente en esta story — solo crearlos
- Crear también `src/presentation/signals/presenceState.ts` con `presenceServiceSignal` y `messagesContainerSignal`

---

### Story 1.3: Implementar ChatUIBridge delegante

Como desarrollador del SDK,
quiero que `TrackingPixelSDK` use `ChatUIBridge` en lugar de `ChatUI` directamente,
para que la migración a Preact sea transparente y no requiera modificar `TrackingPixelSDK`.

**Acceptance Criteria:**

**Given** que se crea `src/presentation/bridge/ChatUIBridge.ts`
**When** `TrackingPixelSDK` instancia `ChatUI` (que ahora es `ChatUIBridge`)
**Then** el comportamiento del widget es idéntico al anterior — `ChatUIBridge` delega todos los métodos en la instancia interna de `ChatUI` original

**Given** `src/presentation/index.ts`
**When** se actualiza para exportar `ChatUIBridge as ChatUI`
**Then** `TrackingPixelSDK` no necesita ningún cambio de importación

**Given** los 55 métodos públicos del contrato
**When** se verifica el tipo de `ChatUIBridge`
**Then** TypeScript confirma que implementa exactamente la misma interfaz que `ChatUI` (usar `implements` o verificación de tipos explícita)

**Given** los tests E2E
**When** se ejecutan con el bridge delegante activo
**Then** todos los tests pasan

**Given** el bundle compilado
**When** se verifica el tamaño
**Then** el bundle no aumenta significativamente (el bridge es un wrapper delgado)

**Notas técnicas:**
- En Fase 1, el bridge es un wrapper puro: `constructor` crea `this._chatUI = new ChatUI(options)`, y cada método llama `return this._chatUI.método(...args)`
- Las propiedades públicas (`onChatSwitch`, `onNewChatRequest`, etc.) deben delegarse bidirecccionalmente con getters/setters
- Mantener `ChatUI` original exportada internamente — no eliminar hasta Fase 6
- El bridge debe tener la misma firma de constructor: `constructor(options: ChatUIOptions = {})`

---

## Epic 2: Widget principal funcional con Preact

**Objetivo:** Crear todos los componentes Preact de la capa de presentación y conectar el `ChatUIBridge` para que el widget principal (apertura, cierre, mensajes) funcione con Preact en lugar del DOM vanilla.

---

### Story 2.1: Crear estructura de componentes y ChatWidget

Como desarrollador del SDK,
quiero que el widget de chat se monte usando Preact y Shadow DOM,
para que los estilos estén encapsulados y el widget sea reactivo.

**Acceptance Criteria:**

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

**Notas técnicas:**
- Los estilos CSS se definen en `ChatWidget.styles.ts` como template literal exportado
- El CSS migrado proviene del método `getChatStyles()` del `chat-ui.ts` original
- La función `mountChatWidget` devuelve el `shadowHost` para que el bridge lo almacene
- Crear también los componentes vacíos (placeholder) de: `ChatHeader`, `ChatMessages`, `ChatInput`, `OfflineBanner`, `ConsentMessage`

---

### Story 2.2: Implementar ChatMessages y MessageBubble

Como desarrollador del SDK,
quiero que la lista de mensajes se renderice reactivamente desde el signal de mensajes,
para que cada nuevo mensaje aparezca automáticamente sin manipulación DOM manual.

**Acceptance Criteria:**

**Given** `messagesSignal.value` contiene un array de mensajes
**When** `ChatMessages` se renderiza
**Then** se muestra un `MessageBubble` por cada mensaje, con separadores de fecha cuando el día cambia

**Given** un mensaje de tipo `sender: 'user'`
**When** `MessageBubble` lo renderiza
**Then** aplica las clases CSS de mensaje de usuario (alineado a la derecha, color de fondo configurado)

**Given** un mensaje de tipo `sender: 'other'`
**When** `MessageBubble` lo renderiza
**Then** aplica las clases CSS de mensaje del comercial (alineado a la izquierda)

**Given** un mensaje con `isSystem: true`
**When** `MessageBubble` lo renderiza
**Then** se muestra como mensaje de sistema (centrado, estilo diferente)

**Given** que `isLoadingInitialMessagesSignal.value` es `true`
**When** `ChatMessages` se renderiza
**Then** se muestra el `LoadingIndicator`

**Given** que se añade un nuevo mensaje a `messagesSignal`
**When** Preact re-renderiza `ChatMessages`
**Then** el contenedor hace scroll automático al último mensaje (via `useScrollToBottom` hook)

**Notas técnicas:**
- `useScrollToBottom(containerRef, messages)`: usa `useEffect` que observa cambios en `messages` y llama `containerRef.current.scrollTop = containerRef.current.scrollHeight`
- `MessageRenderer.render()` de `utils/message-renderer.ts` se usa para el HTML de cada mensaje (sin cambios)
- Usar `dangerouslySetInnerHTML={{ __html: html }}` para el contenido renderizado

---

### Story 2.3: Conectar ChatUIBridge al widget Preact

Como desarrollador del SDK,
quiero que el bridge monte el widget Preact en lugar de delegar en el `ChatUI` original,
para que la UI del chat esté completamente gestionada por Preact.

**Acceptance Criteria:**

**Given** que `ChatUIBridge.init()` se llama desde `TrackingPixelSDK`
**When** se ejecuta
**Then** llama a `mountChatWidget()` (Preact) en lugar de `this._chatUI.init()`

**Given** que `ChatUIBridge.show()` se llama
**When** se ejecuta
**Then** `isVisibleSignal.value = true` y el widget Preact se muestra

**Given** que `ChatUIBridge.hide()` se llama
**When** se ejecuta
**Then** `isVisibleSignal.value = false` y el widget Preact se oculta

**Given** que `ChatUIBridge.renderChatMessage(params)` se llama
**When** se ejecuta
**Then** añade el mensaje a `messagesSignal` y `ChatMessages` lo renderiza automáticamente

**Given** que `ChatUIBridge.clearMessages()` se llama
**When** se ejecuta
**Then** `messagesSignal` queda vacío (preservando mensajes de sistema y consentimiento)

**Given** los tests E2E
**When** se ejecutan con el bridge conectado a Preact
**Then** todos los tests pasan

**Notas técnicas:**
- En esta story se elimina la dependencia interna `this._chatUI` del bridge para los métodos de visibilidad y mensajes
- Los métodos aún no migrados (header, presencia, chat list) siguen delegando en `this._chatUI` temporalmente
- Verificar manualmente en el navegador que el widget abre, cierra y muestra mensajes correctamente

---

### Story 2.4: Implementar ConsentBanner con Preact

Como desarrollador del SDK,
quiero que el banner de consentimiento GDPR use Preact,
para que sea declarativo y fácil de mantener.

**Acceptance Criteria:**

**Given** que `ConsentBanner.tsx` se monta en `document.body`
**When** el SDK detecta que el consentimiento está pendiente
**Then** se muestra el banner correctamente fuera del Shadow DOM del widget

**Given** el estilo `bottom_bar`
**When** el banner se renderiza
**Then** aparece como barra fija en la parte inferior de la pantalla

**Given** el estilo `modal`
**When** el banner se renderiza
**Then** aparece como modal centrado con overlay

**Given** que el usuario hace click en "Aceptar"
**When** se ejecuta el callback `onAccept`
**Then** el banner desaparece y el SDK continúa su inicialización

**Given** que el usuario hace click en "Rechazar"
**When** se ejecuta el callback `onDeny`
**Then** el banner desaparece y el SDK no inicializa el tracking

**Notas técnicas:**
- `mountConsentBanner(config, callbacks)` retorna función de limpieza `() => void`
- El banner monta en `document.body` con `render(<ConsentBanner />, mountPoint)` de Preact
- Los estilos del banner en `ConsentBanner.styles.ts` (migrados de `consent-banner-ui.ts`)

---

## Epic 3: Header, presencia y typing indicator

**Objetivo:** Migrar las funcionalidades del header (información del comercial asignado), el indicador de presencia online/offline y el typing indicator a componentes Preact reactivos.

---

### Story 3.1: Implementar ChatHeader reactivo

Como desarrollador del SDK,
quiero que el header del chat muestre la información del comercial y se actualice automáticamente,
para que cuando se asigna un comercial a la conversación el header refleje el cambio sin manipulación DOM.

**Acceptance Criteria:**

**Given** que `chatDetailSignal.value` es `null`
**When** `ChatHeader` se renderiza
**Then** muestra el título por defecto configurado en `options`

**Given** que `chatDetailSignal.value.assignedCommercial` contiene datos del comercial
**When** `ChatHeader` se renderiza
**Then** muestra el nombre del comercial y su avatar (`CommercialAvatar`)

**Given** que `ChatUIBridge.updateHeaderWithCommercial(commercial, newStatus)` se llama
**When** se ejecuta
**Then** actualiza `chatDetailSignal` y `lastKnownChatStatusSignal`, y `ChatHeader` se re-renderiza automáticamente

**Given** que `chatSelectorConfig.enabled` es `true`
**When** `ChatHeader` se renderiza
**Then** muestra el botón de flecha atrás

**Given** que se hace click en el botón de flecha atrás
**When** el evento se dispara
**Then** se llama `showChatListView()` que actualiza `isShowingChatListSignal`

**Notas técnicas:**
- `CommercialAvatar` recibe `name`, `avatarUrl` y `initials` como props
- `generateInitials()` de `utils/chat-utils.ts` se usa sin cambios
- El botón de cierre llama al callback `onClose` pasado como prop desde `ChatWidget`

---

### Story 3.2: Implementar PresenceIndicator y OfflineBanner

Como desarrollador del SDK,
quiero que el indicador de presencia y el banner offline reaccionen automáticamente al estado del comercial,
para que el visitante siempre vea el estado correcto sin lógica imperativa.

**Acceptance Criteria:**

**Given** que `presenceStatusSignal.value` es `'online'`
**When** `PresenceIndicator` se renderiza
**Then** muestra el dot verde de online en el avatar

**Given** que `presenceStatusSignal.value` es `'offline'`
**When** `PresenceIndicator` se renderiza
**Then** muestra el dot gris de offline

**Given** que `showOfflineBannerSignal.value` es `true` y `offlineBannerEnabledSignal.value` es `true`
**When** `OfflineBanner` se renderiza
**Then** muestra el banner de estado offline debajo del header

**Given** que `ChatUIBridge.setPresenceService(presenceService)` se llama
**When** el comercial cambia su estado a online
**Then** `presenceStatusSignal.value` se actualiza y los componentes reaccionan

**Given** que `ChatUIBridge.setShowOfflineBanner(false)` se llama
**When** se ejecuta
**Then** `offlineBannerEnabledSignal.value = false` y el banner nunca se muestra

**Notas técnicas:**
- El hook `usePresence` en `hooks/usePresence.ts` gestiona la suscripción a `PresenceService`
- `presenceServiceSignal` (en `signals/presenceState.ts`) permite que el hook acceda al servicio desde fuera del árbol
- El `usePresence` hook se activa dentro de `ChatWidget` cuando el widget está montado

---

### Story 3.3: Implementar ChatInput con typing indicator

Como desarrollador del SDK,
quiero que el input de mensajes y el typing indicator funcionen con Preact,
para que el código sea declarativo y el comportamiento de debounce esté encapsulado en un hook reutilizable.

**Acceptance Criteria:**

**Given** que el visitante escribe en el textarea
**When** han pasado 300ms desde la última tecla pulsada
**Then** se envía `typing:start` al servidor via `PresenceService`

**Given** que el visitante deja de escribir
**When** han pasado 2000ms de inactividad
**Then** se envía `typing:stop` automáticamente

**Given** que el visitante hace click en enviar o pulsa Enter (sin Shift)
**When** el mensaje no está vacío
**Then** se llama `onSend(message)` y el textarea se vacía y resetea su altura

**Given** que el comercial está escribiendo (evento WebSocket recibido)
**When** `isTypingSignal.value` es `true`
**Then** `TypingIndicator` se muestra con animación de 3 dots

**Given** que el comercial deja de escribir
**When** `isTypingSignal.value` es `false`
**Then** `TypingIndicator` se oculta con fade-out

**Given** `ChatInput` con Preact
**When** se mide el tamaño del bundle
**Then** el comportamiento es idéntico al `ChatInputUI` original pero el código tiene <200 líneas

**Notas técnicas:**
- `useTypingIndicator(presenceService, chatId)` encapsula toda la lógica de debounce
- El textarea tiene auto-resize: `input.style.height = Math.min(input.scrollHeight, 120) + 'px'`
- `TypingIndicator` recibe `isTyping: boolean` como prop — sin lógica interna de show/hide

---

## Epic 4: Features secundarias — Quick Actions y Chat List View

**Objetivo:** Conectar las features de Quick Actions y Chat List View al bridge, completando la migración de toda la funcionalidad del widget.

---

### Story 4.1: Implementar QuickActions con Preact

Como desarrollador del SDK,
quiero que los botones de Quick Actions funcionen con Preact,
para que su configuración sea declarativa y el estado de visibilidad sea local al componente.

**Acceptance Criteria:**

**Given** que `quickActionsConfig.enabled` es `true` y hay botones configurados
**When** `QuickActions` se renderiza
**Then** muestra el mensaje de bienvenida y los botones

**Given** un botón con `action.type: 'send_message'`
**When** el visitante hace click
**Then** se llama `onSend(message, metadata)` y los botones desaparecen

**Given** un botón con `action.type: 'open_url'`
**When** el visitante hace click
**Then** se abre la URL en nueva pestaña con `noopener,noreferrer` y los botones desaparecen

**Given** un botón con `action.type: 'request_agent'`
**When** el visitante hace click
**Then** se llama `onRequestAgent()` y los botones desaparecen

**Given** que `onTrackQuickAction` está configurado en el bridge
**When** cualquier botón es clickado
**Then** se llama `onTrackQuickAction` con los datos del botón

**Given** que los botones desaparecen tras un click
**When** el usuario reabre el chat
**Then** los botones NO se muestran de nuevo (estado local `hidden` persiste mientras el componente está montado)

**Notas técnicas:**
- El estado `hidden` es local al componente (`useState`) — no necesita signal global
- Los callbacks `onSend`, `onRequestAgent`, `onOpenUrl`, `onActionClicked` vienen como props desde `ChatWidget`
- `ChatWidget` recibe estos callbacks del bridge via props al montarse

---

### Story 4.2: Implementar ChatListView con Preact

Como desarrollador del SDK,
quiero que la vista de lista de conversaciones funcione con Preact,
para que el cambio entre conversaciones sea reactivo y el código sea mantenible.

**Acceptance Criteria:**

**Given** que `isShowingChatListSignal.value` es `true`
**When** `ChatWidget` se renderiza
**Then** muestra `ChatListView` en lugar de `ChatMessages` + `ChatInput`

**Given** que `isShowingChatListSignal.value` es `false`
**When** `ChatWidget` se renderiza
**Then** muestra `ChatMessages` + `ChatInput`

**Given** `ChatListView` con la lista de conversaciones cargada
**When** el visitante hace click en una conversación
**Then** se llama `onChatSwitch(chatId)` del bridge

**Given** que el visitante hace click en "Nueva conversación"
**When** el evento se dispara
**Then** se llama `onNewChatRequest()` del bridge

**Given** que la lista está cargando
**When** `ChatListView` se renderiza
**Then** muestra un indicador de carga

**Given** que `ChatUIBridge.showChatListView()` se llama
**When** se ejecuta
**Then** `isShowingChatListSignal.value = true` y `ChatWidget` muestra la lista

**Given** que `ChatUIBridge.updateSelectedChat(chatId)` se llama
**When** se ejecuta
**Then** `chatIdSignal.value` se actualiza y `ChatListView` resalta la conversación activa

**Notas técnicas:**
- `ChatListItem` recibe `chat`, `isSelected`, `onClick` como props
- La carga de la lista usa `useChatList` hook que llama a `ChatV2Service.getVisitorChats()`
- El hook `useChatList` se activa cuando `isShowingChatListSignal.value` cambia a `true`

---

## Epic 5: Limpieza y eliminación del código legado

**Objetivo:** Eliminar todos los archivos de la implementación DOM vanilla que han sido reemplazados por componentes Preact, dejando un codebase limpio sin código muerto.

---

### Story 5.1: Eliminar archivos legados y finalizar migración

Como desarrollador del SDK,
quiero eliminar los archivos de presentación DOM vanilla que han sido reemplazados,
para que el codebase no tenga código muerto y la arquitectura sea coherente.

**Acceptance Criteria:**

**Given** que todos los epics anteriores están completados y los tests E2E pasan
**When** se ejecuta la limpieza
**Then** los siguientes archivos son eliminados sin que ningún archivo del proyecto los importe:
- `src/presentation/components/chat-ui.ts`
- `src/presentation/components/quick-actions-ui.ts`
- `src/presentation/components/typing-indicator.ts`
- `src/presentation/chat-input.ts`
- `src/presentation/chat-fixed.ts`

**Given** que `ChatUIBridge` ya no delega en `ChatUI` original
**When** se elimina la propiedad interna `_chatUI`
**Then** `ChatUIBridge` compila sin referencias a `ChatUI` original

**Given** que `src/presentation/index.ts` se actualiza
**When** se verifica
**Then** no exporta ninguno de los archivos eliminados

**Given** que se ejecuta `npm run build`
**When** completa
**Then** no hay warnings de módulos no usados ni referencias rotas

**Given** que se ejecuta `npx tsc --noEmit --strict`
**When** completa
**Then** no hay errores TypeScript

**Given** que se ejecutan los tests E2E
**When** completan
**Then** todos los tests pasan

**Given** el bundle final
**When** se compara con el bundle pre-migración
**Then** el overhead no supera 10 KB gzip (NFR1)

**Notas técnicas:**
- Verificar con `grep -r "chat-ui" src/` que no quedan referencias antes de eliminar
- Actualizar `src/presentation/index.ts` para eliminar exports de archivos borrados
- Ejecutar el servidor PHP demo y verificar manualmente el widget completo antes de marcar como completado
- Documentar el bundle size pre y post migración en el commit de cierre

---

## Epic 7: Customización y configuración administrativa

**Objetivo:** Habilitar a los administradores de sitio para personalizar el comportamiento visual del widget desde el panel de WordPress, empezando por el tema (claro/oscuro/automático), sin requerir conocimientos técnicos ni edición de código.

---

### Story 7.1: Configuración de tema del widget desde WP Admin

Como administrador del sitio WordPress,
quiero forzar un tema concreto del widget de chat (claro / oscuro / automático) desde el panel de configuración del plugin,
para que la apariencia del widget coincida con la identidad visual de mi sitio independientemente de la preferencia del sistema operativo del visitante.

**Source:** BL-001 (`docs/BACKLOG.md`)

**Acceptance Criteria (resumen):**

**Given** que `chat_theme` no está definido
**When** se renderiza el widget
**Then** sigue `prefers-color-scheme` (sin regresión)

**Given** que el admin selecciona "Oscuro"
**When** un visitante carga la página
**Then** el host del Shadow DOM tiene `data-theme="dark"` y el widget aplica tokens oscuros independientemente del SO

**Given** que el admin selecciona "Claro"
**When** un visitante con SO oscuro carga la página
**Then** el widget se renderiza con tokens claros (la media query queda neutralizada)

**Given** cualquier valor de tema activo
**When** se inspecciona el DOM
**Then** los tokens fijos `--gds-color-author-ai` y `--gds-color-author-ai-soft` siguen flipando correctamente y NO son customizables (cumplimiento P7 / EU AI Act Art. 50)

**Notas técnicas:**
- Refactor de `tokens.styles.ts`: extraer overrides dark a constante reutilizable; emitir bajo `:host([data-theme="dark"])` y `@media (prefers-color-scheme: dark) :host(:not([data-theme="light"]))`
- Validación PHP con whitelist `in_array(['system','light','dark'], true)`, fallback `'system'`
- Edge case: cambio de tema requiere recarga (consistente con resto de settings WP)
- Bundle delta ≤ 0.5 KB gzip

Detalle completo: `_bmad-output/planning-artifacts/stories/story-7.1.md`

---

*Documento generado el 2026-04-25 — Workflow completo. Stories en `_bmad-output/planning-artifacts/stories/`. Listo para desarrollo.*
