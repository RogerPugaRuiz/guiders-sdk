import { useState, useEffect } from 'preact/hooks';
import { h } from 'preact';
import { ChatUIOptions } from '../../types/chat-types';
import {
    chatDetailSignal,
    chatSelectorEnabledSignal,
    hasAssignedCommercialSignal,
    isShowingChatListSignal,
} from '../../signals/chatState';
import { toggleClickedSignal, toggleChatOpenSignal } from '../../signals/toggleState';
import { generateInitials } from '../../utils/chat-utils';
import { CommercialAvatar } from './CommercialAvatar';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatHeaderProps {
    options: ChatUIOptions;
}

type AuthorType = 'human' | 'ai';

// ---------------------------------------------------------------------------
// AuthorBadge
// ---------------------------------------------------------------------------

function AuthorBadge({ type }: { type: AuthorType }) {
    const isAI = type === 'ai';
    const style: h.JSX.CSSProperties = {
        fontSize: 'var(--gds-font-size-xs, 11px)',
        fontWeight: 600,
        color: isAI ? 'var(--gds-color-author-ai)' : 'var(--gds-color-author-human)',
        background: isAI ? 'var(--gds-color-author-ai-soft)' : 'var(--gds-color-author-human-soft)',
        padding: '2px 6px',
        borderRadius: 'var(--gds-radius-pill)',
        letterSpacing: '0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        flexShrink: 0,
    };
    return (
        <span style={style} aria-label={isAI ? 'Asistente IA' : 'Agente humano'}>
            {isAI ? '✦ IA' : '● Agente'}
        </span>
    );
}

// ---------------------------------------------------------------------------
// ChatHeader
// ---------------------------------------------------------------------------

/**
 * ChatHeader — Story 6.5:
 *   - AuthorBadge "IA" (purple) or "Agente" (blue) derived from hasAssignedCommercialSignal
 *   - Crossfade 150ms when interlocutor changes
 *   - Tokens only, zero hardcoded colors
 */
export function ChatHeader({ options }: ChatHeaderProps) {
    const hasCommercial = hasAssignedCommercialSignal.value;
    const chatDetail = chatDetailSignal.value;
    const commercial = chatDetail?.assignedCommercial;
    const showBackBtn = chatSelectorEnabledSignal.value || !!(options.chatSelector?.enabled);
    const title = options.title ?? 'Chat';

    // Crossfade state: track displayed authorType to animate transitions
    const resolvedType: AuthorType = hasCommercial ? 'human' : 'ai';
    const [displayState, setDisplayState] = useState<{ type: AuthorType; opacity: number }>({
        type: resolvedType,
        opacity: 1,
    });

    useEffect(() => {
        if (resolvedType === displayState.type) return undefined;
        // Fade out current badge, then switch type
        setDisplayState(prev => ({ ...prev, opacity: 0 }));
        const t = setTimeout(() => {
            setDisplayState({ type: resolvedType, opacity: 1 });
        }, 150);
        return () => clearTimeout(t);
    // displayState.type is intentionally excluded: we only react to resolvedType changes.
    // Using a functional updater for setDisplayState avoids stale closure on prev state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedType]);

    // Patch #25: closing via header goes through toggle pipeline
    const handleClose = () => {
        if (toggleChatOpenSignal.peek()) {
            toggleClickedSignal.value = toggleClickedSignal.peek() + 1;
        }
    };

    const isHumanState = displayState.type === 'human';
    const humanCommercial = isHumanState ? commercial : undefined;

    return (
        <div
            class="chat-header"
            role="banner"
            aria-label={resolvedType === 'human'
                ? `Chat con ${commercial?.name ?? 'Agente'}`
                : `Chat con Asistente IA`}
        >
            {showBackBtn && (
                <button
                    class="chat-back-btn"
                    aria-label="Volver"
                    onClick={() => { isShowingChatListSignal.value = true; }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}

            {/* Crossfade wrapper */}
            <div
                class="chat-header-main"
                style={{
                    opacity: displayState.opacity,
                    transition: 'opacity 150ms ease',
                    flex: 1,
                    minWidth: 0,
                }}
            >
                {isHumanState && humanCommercial
                    ? (
                        <CommercialAvatar
                            name={humanCommercial.name}
                            avatarUrl={humanCommercial.avatarUrl}
                            initials={generateInitials(humanCommercial.name)}
                        />
                    )
                    : (
                        <div class="chat-header-identity">
                            <div class="chat-header-avatar-container">
                                <div class="chat-header-avatar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="chat-header-title-container">
                                <span class="chat-header-title">{title}</span>
                                <AuthorBadge type={displayState.type} />
                            </div>
                        </div>
                    )
                }
            </div>

            <div class="chat-header-actions">
                <button
                    class="chat-close-btn"
                    aria-label="Cerrar chat"
                    onClick={handleClose}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
