/**
 * usePresence — subscribes to the PresenceLike provider stored in
 * `presenceServiceSignal` and mirrors its events into `presenceStatusSignal`
 * and `showOfflineBannerSignal`.
 *
 * Patches:
 *   #11 (Chunk 2) — uses `useSignalEffect` so the hook re-subscribes when the
 *        SDK lazily injects (or replaces) the PresenceService instance after
 *        auth completes. Reading `presenceServiceSignal.value` at the top of a
 *        plain function would only capture the value at first render and
 *        wouldn't react to later writes if the @preact/signals integration
 *        wasn't active for the host component.
 *   #12 (Chunk 2) — wraps `service.onPresenceChanged(...)` in try/catch and
 *        validates that the returned unsubscribe handle is callable. A
 *        synchronous throw on subscribe (or a non-function return value) would
 *        otherwise crash the cleanup chain on unmount.
 *   #13 (Chunk 2 — folded in) — dropped the misleading
 *        `eslint-disable react-hooks/exhaustive-deps` comment that no longer
 *        applies once we use `useSignalEffect`.
 */

import { useSignalEffect } from '@preact/signals';
import {
    presenceStatusSignal,
    showOfflineBannerSignal,
    offlineBannerEnabledSignal,
} from '../signals/chatState';
import { presenceServiceSignal } from '../signals/presenceState';
import type { PresenceUiStatus } from '../types/presence-types';
import type { PresenceChangedEvent } from '../../types/presence-types';
import { debugError } from '../../utils/debug-logger';

export function usePresence(): void {
    useSignalEffect(() => {
        const service = presenceServiceSignal.value; // tracked
        if (!service) return;

        let unsubscribe: () => void = () => {};
        try {
            const result = service.onPresenceChanged((event: PresenceChangedEvent) => {
                // Patch #19 (Chunk 2): collapse the richer server-side status
                // enum into the binary UI representation via PresenceUiStatus.
                const next: PresenceUiStatus =
                    event.status === 'online' ? 'online' : 'offline';
                presenceStatusSignal.value = next;
                if (offlineBannerEnabledSignal.value) {
                    showOfflineBannerSignal.value = next === 'offline';
                }
            });
            if (typeof result === 'function') {
                unsubscribe = result;
            } else {
                debugError(
                    '[usePresence] onPresenceChanged did not return an unsubscribe function'
                );
            }
        } catch (err) {
            debugError('[usePresence] Failed to subscribe to PresenceService:', err);
        }

        return () => {
            try {
                unsubscribe();
            } catch (err) {
                debugError('[usePresence] Error during unsubscribe:', err);
            }
        };
    });
}
