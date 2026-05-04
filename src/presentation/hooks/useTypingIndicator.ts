import { useRef, useCallback, useEffect } from 'preact/hooks';
import type { PresenceLike } from '../types/presence-types';
import { debugError } from '../../utils/debug-logger';

const TYPING_START_DEBOUNCE_MS = 300;
const TYPING_STOP_IDLE_MS = 2000;

/**
 * useTypingIndicator — manages typing:start / typing:stop events with debounce.
 * Returns a handleTyping() function to be called on every textarea input event.
 *
 * Behaviour (Patch #32 — fix continuous typing):
 *   - typing:start fires exactly once 300 ms after the FIRST keystroke and is
 *     not reset on subsequent keystrokes.
 *   - typing:stop fires 2000 ms after the LAST keystroke. Each keystroke resets
 *     this idle timer.
 *   - After typing:stop fires, the start cycle resets so the next keystroke
 *     burst will produce a fresh typing:start.
 *
 * Patch #21: chatId and presenceService are stored in refs so timers fire against
 * the *current* values rather than the snapshots captured when the timer was set.
 * Also: when chatId changes, any pending start/stop timers are cancelled and
 * the started flag is cleared to avoid leaking typing events into the previous
 * conversation.
 */
export function useTypingIndicator(
    presenceService: PresenceLike | null,
    chatId: string | null
): { handleTyping: () => void } {
    const startTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const hasStartedRef = useRef<boolean>(false);
    const chatIdRef = useRef<string | null>(chatId);
    const serviceRef = useRef<PresenceLike | null>(presenceService);

    // Keep refs in sync with the latest props.
    useEffect(() => { serviceRef.current = presenceService; }, [presenceService]);
    useEffect(() => {
        // When the chat changes, cancel any pending events for the previous chat
        // and reset the started flag so the new chat gets its own start event.
        if (chatIdRef.current !== chatId) {
            if (startTimerRef.current !== undefined) {
                clearTimeout(startTimerRef.current);
                startTimerRef.current = undefined;
            }
            if (stopTimerRef.current !== undefined) {
                clearTimeout(stopTimerRef.current);
                stopTimerRef.current = undefined;
            }
            hasStartedRef.current = false;
        }
        chatIdRef.current = chatId;
    }, [chatId]);

    const handleTyping = useCallback(() => {
        // Patch #32: only schedule typing:start if it hasn't already fired AND
        // there's no start timer pending. Otherwise continuous typing would
        // perpetually reset the start timer and the event would never fire.
        if (!hasStartedRef.current && startTimerRef.current === undefined) {
            startTimerRef.current = setTimeout(() => {
                startTimerRef.current = undefined;
                hasStartedRef.current = true;
                const svc = serviceRef.current;
                const cid = chatIdRef.current;
                if (svc && cid) {
                    try {
                        svc.startTyping(cid);
                    } catch (err) {
                        debugError('[useTypingIndicator] startTyping threw:', err);
                    }
                }
            }, TYPING_START_DEBOUNCE_MS);
        }

        // The stop timer always resets on every keystroke.
        if (stopTimerRef.current !== undefined) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
            stopTimerRef.current = undefined;
            // If the user stopped typing before typing:start ever fired, cancel
            // the pending start so we never emit a stale start/stop pair.
            if (startTimerRef.current !== undefined) {
                clearTimeout(startTimerRef.current);
                startTimerRef.current = undefined;
            }
            const wasStarted = hasStartedRef.current;
            hasStartedRef.current = false;
            // Only emit stop if start was actually emitted (otherwise the
            // backend never saw a start to pair with).
            if (!wasStarted) return;
            const svc = serviceRef.current;
            const cid = chatIdRef.current;
            if (svc && cid) {
                try {
                    svc.stopTyping(cid);
                } catch (err) {
                    debugError('[useTypingIndicator] stopTyping threw:', err);
                }
            }
        }, TYPING_STOP_IDLE_MS);
    }, []);

    // Cleanup on unmount.
    useEffect(() => {
        return () => {
            if (startTimerRef.current !== undefined) clearTimeout(startTimerRef.current);
            if (stopTimerRef.current !== undefined) clearTimeout(stopTimerRef.current);
        };
    }, []);

    return { handleTyping };
}
