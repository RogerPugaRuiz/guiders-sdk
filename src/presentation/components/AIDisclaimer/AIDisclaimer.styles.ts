import type { h } from 'preact';

type CSS = h.JSX.CSSProperties;

/**
 * Wrapper style for the AIDisclaimer banner.
 * Animates opacity for fade-in/out transitions.
 * Uses only --gds-* tokens from Story 6.1.
 */
/**
 * Wrapper style for the AIDisclaimer banner.
 * The wrapper stays in the DOM so the live region exists before content changes,
 * ensuring reliable screen-reader announcements (rAF A-9).
 *
 * When not mounted: opacity 0, height 0, overflow hidden, pointer-events none
 * so the element takes no visual or interaction space.
 */
export function disclaimerWrapperStyle(opacity: number, mounted: boolean): CSS {
    return {
        padding: mounted ? '5px 12px' : '0',
        height: mounted ? undefined : 0,
        overflow: mounted ? undefined : 'hidden',
        background: 'var(--gds-color-bg-elevated)',
        borderTop: mounted ? '1px solid var(--gds-color-border)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        pointerEvents: mounted ? undefined : 'none',
        transition: `opacity var(--gds-duration-normal, 150ms) var(--gds-ease-out, cubic-bezier(0.16,1,0.3,1))`,
        flexShrink: 0,
    };
}

/**
 * Text style for the AI notice label.
 * Non-selectable to avoid accidental copy.
 */
export const disclaimerTextStyle: CSS = {
    fontSize: 'var(--gds-font-size-xs, 11px)',
    color: 'var(--gds-color-text-secondary)',
    fontWeight: 'var(--gds-font-weight-medium)',
    lineHeight: 'var(--gds-line-height-tight)',
    letterSpacing: '0.01em',
    userSelect: 'none',
};
