import { useEffect } from 'preact/hooks';
import { RefObject } from 'preact';

interface ScrollToBottomOptions {
    /** When false, the hook does not scroll (e.g. while paginating older messages). */
    enabled?: boolean;
}

/**
 * Scrolls a container to the bottom whenever `deps` changes.
 * Used by ChatMessages to auto-scroll when new messages arrive.
 *
 * Patch #3 — added the `enabled` flag so the consumer can suppress scrolling
 * during pagination (which prepends older messages and would otherwise yank
 * the user back to the bottom).
 */
export function useScrollToBottom(
    containerRef: RefObject<HTMLElement>,
    deps: unknown[],
    options?: ScrollToBottomOptions
): void {
    const enabled = options?.enabled ?? true;
    useEffect(() => {
        if (!enabled) return;
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
