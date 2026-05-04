import { signal } from '@preact/signals';
import { ChatMessageParams } from '../types/chat-types';

/**
 * messagesState — message-list signals.
 *
 * Patch #9 (Chunk 2) — interim documentation pass (see chatState.ts header for
 * the `@writer` convention). Bonus: removed dead `messagesLoadedSignal` export
 * (no readers, no writers anywhere in the codebase — same situation as #7).
 */

// ---------------------------------------------------------------------------
// Bridge + hooks — both layers contribute writes
// ---------------------------------------------------------------------------

/** @writer bridge|hooks — array of rendered messages; written by bridge (incoming) + usePagination (loaded). */
export const messagesSignal = signal<ChatMessageParams[]>([]);

/**
 * Patch #30 (Chunk 2): callback may return a Promise so the SDK's HTTP POST to
 * `/v2/messages` (per the Hybrid Communication Model in AGENTS.md) can surface
 * completion or failure to the UI. Synchronous callers continue to work — the
 * `void | Promise<void>` widening is backward-compatible.
 */
export type SendMessageCallback = (message: string) => void | Promise<void>;

/**
 * @writer bridge — callback registered by the SDK layer to handle message
 * sends from ChatInput. Written once at bridge initialisation. Consumers
 * (`ChatInput`) may `await` the result to know when the send completed.
 */
export const sendMessageCallbackSignal = signal<SendMessageCallback | null>(null);

// ---------------------------------------------------------------------------
// Pagination signals — managed by usePagination hook
// ---------------------------------------------------------------------------

/** @writer hooks — cursor for fetching the next (older) page of messages. Null means no more pages. */
export const paginationCursorSignal = signal<string | null>(null);

/** @writer hooks — whether there are more (older) messages available to load. */
export const hasMoreMessagesSignal = signal<boolean>(false);

/** @writer hooks — whether a pagination request is in flight. */
export const isPaginatingSignal = signal<boolean>(false);

/**
 * @writer bridge — monotonically-incrementing counter. Incrementing this signal
 * triggers usePagination to (re)load messages for the current chatId.
 * Set to 0 to reset without loading.
 */
export const loadChatTriggerSignal = signal<number>(0);

/**
 * @writer bridge|hooks — the chatId that was last loaded. Bridge clears it on
 * chat-switch reset; usePagination sets it after a successful initial load.
 * Used by usePagination to detect chat switches.
 */
export const loadedChatIdSignal = signal<string | null>(null);
