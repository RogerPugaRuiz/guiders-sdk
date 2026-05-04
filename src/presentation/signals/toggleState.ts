import { signal } from '@preact/signals-core';
import { ResolvedPosition } from '../../utils/position-resolver';
import type { UnreadServiceConfig } from '../types/toggle-types';

/** Whether the toggle button is rendered/visible in the DOM */
export const toggleButtonVisibleSignal = signal<boolean>(false);

/** Whether the chat panel is currently open (affects button icon) */
export const toggleChatOpenSignal = signal<boolean>(false);

/** Unread message count shown on the badge */
export const unreadCountSignal = signal<number>(0);

/** Resolved position passed from SDK at init time */
export const toggleResolvedPositionSignal = signal<ResolvedPosition | null>(null);

/** Fired when the user clicks the toggle button — SDK listens via onToggle */
export const toggleClickedSignal = signal<number>(0);

/** Active chat id for the UnreadMessagesService */
export const activeChatForUnreadSignal = signal<string | null>(null);

/**
 * Params for connectUnreadService — set once by SDK.
 *
 * Patch #28 (Chunk 2): the `UnreadServiceConfig` interface lives in
 * `../types/toggle-types`; this file holds only the signal that carries it.
 */
export const unreadServiceConfigSignal = signal<UnreadServiceConfig | null>(null);
