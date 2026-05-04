# Story 1.2: Crear infraestructura de Signals

**Epic:** Epic 1 — Preparación del toolchain y fundamentos  
**Status:** Ready for Development  
**Depends on:** Story 1.1  
**Implements:** FR9

---

## User Story

Como desarrollador del SDK,
quiero que el estado global del widget esté centralizado en Signals de Preact,
para que el bridge pueda escribir estado desde fuera del árbol de componentes y los componentes reaccionen automáticamente.

---

## Acceptance Criteria

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

---

## Technical Notes

### `src/presentation/signals/chatState.ts`
```typescript
import { signal, computed } from '@preact/signals';
import { ChatV2, ChatStatus } from '../../types';

export const chatIdSignal = signal<string | null>(null);
export const visitorIdSignal = signal<string | null>(null);
export const chatDetailSignal = signal<ChatV2 | null>(null);
export const lastKnownChatStatusSignal = signal<ChatStatus | null>(null);
export const isVisibleSignal = signal<boolean>(false);
export const isShowingChatListSignal = signal<boolean>(false);
export const isCreatingChatSignal = signal<boolean>(false);
export const isLoadingInitialMessagesSignal = signal<boolean>(false);
export const presenceStatusSignal = signal<'online' | 'offline'>('offline');
export const showOfflineBannerSignal = signal<boolean>(false);
export const offlineBannerEnabledSignal = signal<boolean>(true);

// Computed: true if there is an assigned commercial with an ID
export const hasAssignedCommercialSignal = computed(
  () => !!(chatDetailSignal.value?.assignedCommercial?.id)
);
```

### `src/presentation/signals/messagesState.ts`
```typescript
import { signal } from '@preact/signals';
import { RenderedMessage } from '../../types';

export const messagesSignal = signal<RenderedMessage[]>([]);
export const messagesLoadedSignal = signal<boolean>(false);
```

### `src/presentation/signals/presenceState.ts`
```typescript
import { signal } from '@preact/signals';
import { PresenceService } from '../../services/presence-service';

export const presenceServiceSignal = signal<PresenceService | null>(null);
export const messagesContainerSignal = signal<HTMLElement | null>(null);
```

### `src/presentation/signals/index.ts` (barrel)
```typescript
export * from './chatState';
export * from './messagesState';
export * from './presenceState';
```

---

## Files to Create
- `src/presentation/signals/chatState.ts`
- `src/presentation/signals/messagesState.ts`
- `src/presentation/signals/presenceState.ts`
- `src/presentation/signals/index.ts`

## Definition of Done
- [ ] Los 4 archivos de signals existen y compilan con `strict: true`
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan sin cambios (signals no conectados a nada aún)
- [ ] `hasAssignedCommercialSignal` implementado como `computed`
