import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { disclaimerWrapperStyle, disclaimerTextStyle } from './AIDisclaimer.styles';

interface AIDisclaimerProps {
    visible: boolean;
}

/**
 * AIDisclaimer — EU AI Act Art. 50 compliant notice.
 *
 * Shows when an AI assistant is the active interlocutor.
 * Fades out (opacity 1→0) when a human agent takes over,
 * then unmounts from the DOM to free layout space.
 * Fades back in when the AI is active again.
 *
 * The notice text is intentionally non-configurable per legal requirement:
 * EU AI Act Art. 50 (Reglamento UE 2024/1689) — vigente agosto 2026.
 *
 * Live region note: the wrapper div is always present in the DOM (opacity-gated,
 * not mount-gated) so screen readers announce content changes rather than
 * element insertion. A role="status" element inserted fresh into the DOM
 * may not be announced by all screen readers.
 */
export function AIDisclaimer({ visible }: AIDisclaimerProps) {
    const [opacity, setOpacity] = useState(visible ? 1 : 0);
    const [mounted, setMounted] = useState(visible);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Detect reduced-motion preference to sync JS timeout with CSS transition duration
        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const transitionDuration = prefersReducedMotion ? 0 : 150;

        // Cancel any pending animations from previous renders
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (visible) {
            setMounted(true);
            // Double-rAF: first rAF ensures mount is painted, second triggers transition
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = requestAnimationFrame(() => {
                    setOpacity(1);
                    rafRef.current = null;
                });
            });
        } else {
            setOpacity(0);
            // Unmount after fade-out transition completes — synced with actual duration
            timerRef.current = setTimeout(() => {
                setMounted(false);
                timerRef.current = null;
            }, transitionDuration);
        }

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [visible]);

    // Keep element in DOM (hidden via opacity + pointer-events) so the live region
    // container exists before content changes — required for reliable SR announcements.
    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={disclaimerWrapperStyle(opacity, mounted)}
        >
            {mounted && (
                <span style={disclaimerTextStyle}>✦ IA · puede contener errores</span>
            )}
        </div>
    );
}
