/**
 * Patches:
 *   #6 (Chunk 2) — typed against `PresenceLike` from `presentation/types/`
 *                  instead of importing `PresenceService` from `services/`.
 *                  This keeps the signals layer independent of the services
 *                  layer (architecture rule in AGENTS.md).
 *   #7 (Chunk 2) — removed dead export `messagesContainerSignal` (no readers,
 *                  no writers anywhere in the codebase).
 *   #9 (Chunk 2 — interim) — annotated with `@writer` tag (see chatState.ts
 *                  header for convention).
 */

import { signal } from '@preact/signals';
import type { PresenceLike, PresenceUiStatus } from '../types/presence-types';

/** @writer bridge — injected after auth completes via `setPresenceService()`. */
export const presenceServiceSignal = signal<PresenceLike | null>(null);

/**
 * Map of `commercialId → PresenceUiStatus` used by the chat list to render
 * a presence dot per item. Updated by `useCommercialPresenceMap` from:
 *   - WebSocket `presence:changed` events (real-time)
 *   - Lazy REST `getChatPresence(chatId)` calls (initial snapshot per chat)
 *
 * Stored as a plain object (not a `Map`) so that signal equality treats each
 * mutation as a new reference — the hook always replaces the whole object.
 *
 * @writer hooks/useCommercialPresenceMap
 */
export const commercialPresenceMapSignal = signal<Readonly<Record<string, PresenceUiStatus>>>({});
