# Architecture Document — Migración de Presentación a Preact

**Proyecto:** guiders-sdk  
**Versión:** 1.0  
**Fecha:** 2026-04-25  
**Alcance:** `src/presentation/` únicamente. El resto del SDK (core, pipeline, services, types, utils) no cambia.

---

## Contexto y problema

El SDK es una solución de rastreo de visitantes y chat en tiempo real que se inyecta como `<script>` tag en sitios web de clientes. Actualmente tiene:

- **72 archivos TypeScript**, ~24.634 líneas de código
- **Bundle**: 495 KB minificado sin gzip (~140-160 KB con gzip)
- **2 monolitos críticos**: `chat-ui.ts` (3.484 líneas) y `tracking-pixel-SDK.ts` (3.510 líneas)
- **UI en DOM vanilla puro**: `createElement`, `innerHTML`, `classList` — sin sistema de componentes
- **Sin tests unitarios de UI**: solo E2E con Playwright

Los principales problemas de mantenibilidad:
- `chat-ui.ts` mezcla estado, manipulación DOM y lógica de negocio
- ~25 propiedades de instancia privadas con mutaciones difíciles de razonar
- CSS inyectado como strings dentro del JS (método `getChatStyles()` con >900 líneas)
- Callbacks enlazados manualmente con `addEventListener`
- Imposible hacer tests unitarios sin levantar el servidor PHP demo

## Decisión de arquitectura

**Migrar la capa `src/presentation/` a Preact** manteniendo intacto el resto del SDK.

### Por qué Preact y no otras opciones

| Opción | Descartada porque |
|---|---|
| React | 45 KB overhead — inaceptable para un SDK embebido |
| Vue | Requiere compilador adicional, mayor overhead |
| Lit / Web Components | Shadow DOM complica estilos del cliente; modelo mental incorrecto |
| Solid.js | Ecosistema pequeño, dificultad de onboarding del equipo |
| TypeScript puro (refactor) | Sin templates declarativos, el DOM manual seguirá siendo difícil |
| **Preact** | ✅ 4 KB gzip, API compatible React, JSX familiar, sin Shadow DOM por defecto |

### Estado global: Preact Signals (no Context API)

Los signals de `@preact/signals` son la opción correcta porque:
1. Actualizaciones granulares sin re-render del árbol completo
2. Accesibles desde **fuera** del árbol de componentes (el bridge los necesita)
3. ~1.5 KB de peso adicional

Context API de Preact **no puede usarse** para estado que el bridge escribe, porque el Context solo funciona dentro del árbol de componentes.

---

## Nueva estructura de `src/presentation/`

```
src/presentation/
│
├── components/                        # Componentes Preact puros (.tsx)
│   ├── ChatWidget/
│   │   ├── ChatWidget.tsx             # Root del widget (monta en Shadow DOM)
│   │   ├── ChatWidget.styles.ts       # CSS como template literal (sin loaders extra)
│   │   └── index.ts
│   ├── ChatHeader/
│   │   ├── ChatHeader.tsx
│   │   └── index.ts
│   ├── ChatMessages/
│   │   ├── ChatMessages.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── DateSeparator.tsx
│   │   ├── TypingIndicator.tsx        # Migrado desde typing-indicator.ts
│   │   ├── LoadingIndicator.tsx
│   │   └── index.ts
│   ├── ChatInput/
│   │   ├── ChatInput.tsx              # Fusiona chat-input-ui.ts + chat-input.ts
│   │   └── index.ts
│   ├── QuickActions/
│   │   ├── QuickActions.tsx           # Migrado desde quick-actions-ui.ts
│   │   └── index.ts
│   ├── ChatListView/
│   │   ├── ChatListView.tsx
│   │   ├── ChatListItem.tsx
│   │   └── index.ts
│   ├── ConsentBanner/
│   │   ├── ConsentBanner.tsx          # Migrado desde consent-banner-ui.ts
│   │   ├── ConsentBanner.styles.ts
│   │   └── index.ts
│   ├── ConsentMessage/
│   │   ├── ConsentMessage.tsx
│   │   └── index.ts
│   ├── OfflineBanner/
│   │   ├── OfflineBanner.tsx
│   │   └── index.ts
│   ├── PresenceIndicator/
│   │   ├── PresenceIndicator.tsx
│   │   └── index.ts
│   └── CommercialAvatar/
│       ├── CommercialAvatar.tsx
│       └── index.ts
│
├── hooks/                             # Custom hooks reutilizables
│   ├── useChatMessages.ts
│   ├── usePresence.ts
│   ├── useTypingIndicator.ts
│   ├── useChatVisibility.ts
│   ├── useChatDetail.ts
│   ├── useChatList.ts
│   └── useScrollToBottom.ts
│
├── signals/                           # Estado global con Preact Signals
│   ├── chatState.ts                   # chatId, visitorId, chatDetail, status
│   ├── messagesState.ts               # Array de mensajes renderizados
│   ├── uiState.ts                     # isVisible, isLoading, isCreatingChat…
│   └── presenceState.ts               # presenceStatus, isTyping
│
├── bridge/                            # Adaptador: preserva la API pública de ChatUI
│   └── ChatUIBridge.ts                # Misma interfaz que ChatUI actual
│
├── types/                             # Sin cambios
│   ├── chat-types.ts
│   ├── chat-selector-types.ts
│   └── quick-actions-types.ts
│
├── utils/                             # Sin cambios
│   ├── chat-utils.ts
│   ├── chat-list-utils.ts
│   └── message-renderer.ts
│
└── index.ts                           # Re-exports: ChatUIBridge exportado como ChatUI
```

---

## Pieza central: ChatUIBridge

`TrackingPixelSDK` llama directamente **55 métodos y propiedades públicas** de `ChatUI`. La migración sin romper nada requiere un adaptador que implemente exactamente la misma interfaz pública pero delegue internamente en Preact Signals.

### Contrato de interfaz que debe preservarse

**Propiedades públicas (callbacks configurables):**
```typescript
onChatSwitch: ((chatId: string) => Promise<void>) | null
onNewChatRequest: (() => Promise<void>) | null
onQuickActionSendMessage: ((message: string, metadata?: Record<string, any>) => Promise<void>) | null
onQuickActionRequestAgent: (() => Promise<void>) | null
onTrackQuickAction: ((data: Record<string, any>) => void) | null
```

**Métodos por grupo:**

| Grupo | Métodos |
|---|---|
| Ciclo de vida | `init()` |
| Visibilidad | `show()`, `hide()`, `toggle()`, `isVisible()`, `canAutoOpen()` |
| Identificadores | `setChatId()`, `getChatId()`, `setVisitorId()`, `getVisitorId()` |
| Mensajes | `renderChatMessage()`, `clearMessages()`, `addSystemMessage()`, `addChatConsentMessage()`, `scrollToBottom()`, `scrollToBottomV2()`, `showLoadingMessages()`, `hideLoadingMessages()`, `setLoadingInitialMessages()`, `isLoadingMessages()`, `getMessagesContainer()`, `checkAndAddInitialMessages()` |
| Estado del chat | `getLastKnownChatStatus()`, `hasAssignedCommercial()`, `updateHeaderWithCommercial()`, `refreshChatDetails()`, `refreshChatDetailsForced()`, `refreshChatDetailsFromVisitorList()`, `resetHeaderToDefault()` |
| Chat selector | `showChatListView()`, `hideChatListView()`, `switchToChat()`, `createNewChat()`, `updateSelectedChat()`, `setChatSelectorEnabled()` |
| Presencia | `setPresenceService()`, `setShowOfflineBanner()` |
| Creación de chat | `isCreatingChat()`, `setCreatingChat()`, `waitForChatCreation()` |
| Callbacks | `onOpen()`, `onClose()`, `onChatInitialized()`, `onActiveInterval()` |
| Utilidades | `getOptions()`, `getResolvedPosition()` |

### Traducción imperativo → declarativo

| Imperativo (ChatUI actual) | Declarativo (ChatUIBridge + Signals) |
|---|---|
| `this.titleElement.textContent = name` | `chatDetailSignal.value = { ...prev, assignedCommercial: { name } }` |
| `this.container.style.display = 'none'` | `isVisibleSignal.value = false` |
| `this.containerMessages.appendChild(el)` | `messagesSignal.value = [...prev, newMsg]` |
| `this.offlineBanner.style.display = 'block'` | `showOfflineBannerSignal.value = true` |
| `this.avatarStatusDot.className = 'status-online'` | `presenceStatusSignal.value = 'online'` |

---

## Configuración de toolchain

### Dependencias nuevas

```bash
npm install preact @preact/signals
npm install --save-dev @babel/preset-react
```

### tsconfig.json — añadir 3 líneas

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "lib": ["ES6", "DOM", "DOM.Iterable"]
  }
}
```

### webpack.config.js — cambios

```js
resolve: {
  extensions: ['.ts', '.tsx', '.js'],  // añadir .tsx
  alias: {
    'react': 'preact/compat',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime'
  }
},
module: {
  rules: [
    {
      test: /\.(ts|tsx)$/,  // modificar para incluir .tsx
      use: 'ts-loader',
      exclude: /node_modules/
    }
  ]
}
```

### Gestión de estilos CSS

**Decisión: CSS como template literal en archivos `.styles.ts`** — sin `css-loader` ni `style-loader`.

Justificación: evita dependencias adicionales en webpack. El CSS del widget se inyecta en el Shadow DOM directamente como string.

```typescript
// ChatWidget.styles.ts
export const chatWidgetStyles = `
  .chat-widget { ... }
  .chat-header { ... }
`;
```

---

## Estrategia de migración incremental

### Principio rector

> En ningún commit intermedio los tests E2E deben fallar.

Los tests E2E de Playwright prueban comportamiento (abrir, cerrar, enviar mensaje, recibir mensaje), no implementación interna. Son la red de seguridad de cada fase.

### Fases

| Fase | Objetivo | Criterio de éxito |
|---|---|---|
| **0** | Instalar Preact, configurar toolchain | `npm run build` sin errores. Tests E2E sin cambios. |
| **1** | Signals + Bridge delegante (ChatUI original intacta) | Tests E2E pasan. `TrackingPixelSDK` no sabe nada. |
| **2** | Componentes `.tsx` creados sin conectar | `npm run build` sin errores. Tests E2E pasan. |
| **3** | Bridge monta Preact (widget, mensajes, visibilidad) | Tests E2E pasan. Widget funcional en navegador. |
| **4** | Header, presencia, `refreshChatDetails` | Header actualiza nombre e icono. Dot de presencia funciona. |
| **5** | `ChatListView` y `QuickActions` conectados | Tests E2E de selector y quick actions pasan. |
| **6** | Eliminar código legado (monolito de 3.484 líneas) | Build limpio. Tests E2E pasan. Sin referencias a archivos eliminados. |

### Diagrama de fases

```
Fase 0: toolchain (preact instalado, build verde)
  ↓
Fase 1: ChatUIBridge delegante — ChatUI original intacta
  ↓
Fase 2: Componentes .tsx creados pero sin montar
  ↓
Fase 3: Bridge monta Preact (widget principal funcional)
  ↓
Fase 4: Header y presencia migrados
  ↓
Fase 5: ChatListView y QuickActions migrados
  ↓
Fase 6: Eliminar chat-ui.ts, quick-actions-ui.ts, typing-indicator.ts
```

---

## Convenciones de código

### Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes Preact | PascalCase (sin sufijo UI) | `ChatHeader` |
| Archivos de componente | PascalCase `.tsx` | `ChatHeader.tsx` |
| Carpetas de componente | PascalCase | `ChatHeader/` |
| Custom hooks | camelCase prefijo `use` | `useScrollToBottom.ts` |
| Signals | camelCase sufijo `Signal` | `chatIdSignal` |
| Props interfaces | PascalCase sufijo `Props` | `ChatHeaderProps` |
| Archivos de signals | camelCase sufijo `State.ts` | `chatState.ts` |

> Los componentes Preact **no llevan sufijo UI**. El sufijo `UI` era convención del código legado de clases imperativas.

### Regla del estado

| Tipo de estado | Mecanismo |
|---|---|
| Estado global del chat (chatId, visitorId, chatDetail) | `@preact/signals` en `signals/` |
| Estado de mensajes | `@preact/signals` en `signals/messagesState.ts` |
| Estado local de UI (hover, foco) | `useState` de Preact |
| Configuración inmutable | Props drilling desde `ChatWidget` |
| Callbacks | Props drilling definidos en el bridge |

**Nunca usar Context API para estado que el bridge necesita escribir.**

### Estructura de un componente estándar

```tsx
// 1. Imports Preact
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

// 2. Imports signals (si necesita estado global)
import { chatIdSignal } from '../../signals/chatState';

// 3. Imports tipos SDK
import { ChatMessageParams } from '../../types/chat-types';

// 4. Imports utilidades SDK
import { debugLog } from '../../../utils/debug-logger';

// 5. Imports otros componentes
import { MessageBubble } from './MessageBubble';

// 6. Props interface
interface ComponentNameProps {
  propA: string;
  onAction: () => void;
}

// 7. Componente funcional (named export, nunca default)
export function ComponentName({ propA, onAction }: ComponentNameProps) {
  // Leer signals: SIEMPRE con .value (no desestructurar)
  const chatId = chatIdSignal.value; // ✅
  // const { value: chatId } = chatIdSignal; // ❌ no reactivo

  return (
    <div class="component-name">
      {/* usar class, no className */}
    </div>
  );
}
```

### Reglas de importación (igual que el resto del SDK)

- Rutas relativas (`../../signals/chatState`), nunca alias `@/`
- Omitir extensión `.ts`/`.tsx`
- Named exports, nunca default exports

---

## Lo que NO cambia

- `src/core/` — orquestación, managers, session tracking
- `src/pipeline/` — procesamiento inmutable de eventos
- `src/services/` — WebSocket, HTTP, presence
- `src/types/` — tipos centralizados
- `src/utils/` — debug-logger, position-resolver
- `src/index.ts` — entry point
- Tests E2E en `tests/e2e/`
- `webpack.config.js` entrada/salida (solo se añaden extensiones y alias)

---

## Archivos a eliminar en Fase 6

| Archivo | Reemplazado por |
|---|---|
| `src/presentation/components/chat-ui.ts` (3.484 líneas) | `ChatWidget.tsx` + subcomponentes |
| `src/presentation/components/quick-actions-ui.ts` | `QuickActions/QuickActions.tsx` |
| `src/presentation/components/typing-indicator.ts` | `ChatMessages/TypingIndicator.tsx` |
| `src/presentation/chat-input.ts` | `ChatInput/ChatInput.tsx` |
| `src/presentation/chat-fixed.ts` | Absorbido por `ChatWidget.tsx` |

---

*Documento generado el 2026-04-25. Basado en análisis del codebase y decisión de arquitectura acordada con el equipo.*
