/**
 * presence-types — minimal structural contracts the presentation layer needs
 * from the presence service. Defined here (rather than imported from
 * `services/`) so the signals/hooks layer can stay independent of the
 * services layer per the architecture rules in AGENTS.md.
 *
 * Patch #6 (Chunk 2): replaces `import { PresenceService } from '../../services/...'`
 * inside `signals/presenceState.ts` and `hooks/useTypingIndicator.ts`. The real
 * `PresenceService` class structurally satisfies `PresenceLike` — no `implements`
 * clause required.
 *
 * Patch #19 (Chunk 2): `PresenceUiStatus` named alias for the two-state UI
 * representation of presence. The upstream `PresenceChangedEvent.status` may
 * carry a wider set of values (`'away'`, `'busy'`, `'chatting'`); those are
 * collapsed into `'offline'` for the current widget UX. Adding the named alias
 * lets consumers do exhaustive `switch` checks against a stable type.
 */

import type { PresenceChangedEvent } from '../../types/presence-types';

/** UI-facing presence status (collapsed from the richer server-side enum). */
export type PresenceUiStatus = 'online' | 'offline';

/**
 * Minimum surface the presentation layer consumes from a presence provider.
 * Subscribing to presence changes returns an unsubscribe function.
 */
export interface PresenceLike {
    onPresenceChanged(handler: (event: PresenceChangedEvent) => void): () => void;
    startTyping(chatId: string): void;
    stopTyping(chatId: string): void;
}
