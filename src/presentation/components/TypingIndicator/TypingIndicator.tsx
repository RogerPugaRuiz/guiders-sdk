import { h } from 'preact';
import { isTypingSignal } from '../../signals/chatState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TypingIndicatorProps {
    /** Determines dot color and default display name */
    authorType: 'human' | 'ai';
    /** Display name shown in "X está escribiendo…" */
    authorName?: string;
}

// ---------------------------------------------------------------------------
// Inline style helpers (dots must use JS for color because CSS class
// shared across human/ai and the color depends on runtime prop)
// ---------------------------------------------------------------------------

function dotsColor(authorType: 'human' | 'ai'): string {
    return authorType === 'ai'
        ? 'var(--gds-color-author-ai)'
        : 'var(--gds-color-author-human)';
}

function dotStyle(authorType: 'human' | 'ai'): h.JSX.CSSProperties {
    return {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: dotsColor(authorType),
        display: 'inline-block',
        // Use --gds-duration-slow so prefers-reduced-motion (0ms) suppresses animation.
        // animationDuration drives the actual timing; animationPlayState is always running
        // (browser ignores 0ms-duration animations visually).
        animation: 'gdsBounce var(--gds-duration-bounce, 1.2s) infinite ease-in-out',
    };
}

// ---------------------------------------------------------------------------
// Mini-avatar for the typing indicator (same 20×20 as MessageBubble)
// ---------------------------------------------------------------------------

function TypingAvatar({ authorType, initial }: { authorType: 'human' | 'ai'; initial?: string }) {
    const isAI = authorType === 'ai';
    return (
        <div
            aria-hidden="true"
            style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 600,
                background: isAI ? 'var(--gds-color-author-ai-soft)' : 'var(--gds-color-author-human)',
                color: isAI ? 'var(--gds-color-author-ai)' : 'var(--gds-color-text-on-primary, #ffffff)',
            }}
        >
            {isAI ? '✦' : ((initial && initial[0]?.toUpperCase()) || '?')}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * TypingIndicator — shows animated 3-dot bubble when the interlocutor is typing.
 * Driven by isTypingSignal (set via ChatUIBridge.setCommercialTyping()).
 *
 * Story 6.4: authorType prop controls dot color (human=blue, ai=purple).
 */
export function TypingIndicator({ authorType, authorName }: TypingIndicatorProps) {
    const isTyping = isTypingSignal.value;

    const displayName = authorName ?? (authorType === 'ai' ? 'Asistente IA' : 'Agente');
    const initial = authorName?.[0]?.toUpperCase();

    // Keep the live region always in the DOM so screen readers don't re-announce
    // the full text on every mount (which would happen if we return null here).
    // Use aria-hidden to hide it when not typing.
    return (
        <div
            class="guiders-typing-indicator"
            role="status"
            aria-live="polite"
            aria-hidden={isTyping ? undefined : 'true'}
            style={{ opacity: isTyping ? 1 : 0, pointerEvents: 'none' }}
        >
            <TypingAvatar authorType={authorType} initial={initial} />
            <div class="guiders-typing-bubble" aria-hidden="true">
                <span class="guiders-typing-dot" style={dotStyle(authorType)} />
                <span class="guiders-typing-dot" style={{ ...dotStyle(authorType), animationDelay: '0.2s' }} />
                <span class="guiders-typing-dot" style={{ ...dotStyle(authorType), animationDelay: '0.4s' }} />
            </div>
            {isTyping && <span class="guiders-typing-text">{displayName} está escribiendo…</span>}
        </div>
    );
}
