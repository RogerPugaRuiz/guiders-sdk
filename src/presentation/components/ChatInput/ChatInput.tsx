import { useRef, useState, useEffect } from 'preact/hooks';
import { presenceServiceSignal } from '../../signals/presenceState';
import { chatIdSignal, chatInputPlaceholderSignal, hasAssignedCommercialSignal } from '../../signals/chatState';
import { sendMessageCallbackSignal } from '../../signals/messagesState';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { TypingIndicator } from '../TypingIndicator';

const MAX_TEXTAREA_HEIGHT_PX = 100;

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

/**
 * ChatInput — Composer with:
 *   - Auto-grow textarea (max 100px ≈ 5 lines)
 *   - Visual Viewport API for mobile keyboard avoidance
 *   - Send button microstate (opacity + aria-disabled when empty)
 *   - Enter-to-send (Shift+Enter inserts newline)
 *   - IME composition guard (Patch #19)
 *
 * Story 6.4: Visual Viewport, send microstate, tokens.
 */
export function ChatInput() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const presenceService = presenceServiceSignal.value;
    const chatId = chatIdSignal.value;
    const placeholder = chatInputPlaceholderSignal.value;
    const isHumanAssigned = hasAssignedCommercialSignal.value;

    // Track textarea content for send button microstate
    const [hasContent, setHasContent] = useState(false);

    const { handleTyping } = useTypingIndicator(presenceService, chatId);
    // Read send callback at component level so Preact Signals establishes reactivity
    const onSend = sendMessageCallbackSignal.value;

    // ── Visual Viewport API (mobile keyboard avoidance) ──────────────────────
    useEffect(() => {
        // AC 10: guard for browsers without visualViewport support
        const vv = window.visualViewport;
        if (!vv) return;
        const composerEl = composerRef.current;
        if (!composerEl) return;

        const handler = () => {
            const offset = window.innerHeight - vv.height;
            composerEl.style.transform = offset > 0 ? `translateY(-${offset}px)` : '';
        };

        // iOS Safari fires 'scroll' before 'resize' when keyboard appears
        vv.addEventListener('resize', handler);
        vv.addEventListener('scroll', handler);
        return () => {
            vv.removeEventListener('resize', handler);
            vv.removeEventListener('scroll', handler);
        };
    }, []);

    // ── auto-resize ──────────────────────────────────────────────────────────
    const handleInput = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX) + 'px';
        setHasContent(el.value.trim().length > 0);
        handleTyping();
    };

    // ── send ─────────────────────────────────────────────────────────────────
    const handleSend = () => {
        const el = textareaRef.current;
        if (!el) return;
        const message = el.value.trim();
        if (!message) return;

        if (onSend) onSend(message);

        el.value = '';
        el.style.height = 'auto';
        setHasContent(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        // Patch #19: ignore Enter during IME composition
        if (e.isComposing || (e as KeyboardEvent & { keyCode: number }).keyCode === 229) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── render ───────────────────────────────────────────────────────────────
    const typingAuthorType = isHumanAssigned ? 'human' : 'ai';

    return (
        <div class="chat-input-container" ref={composerRef}>
            <TypingIndicator authorType={typingAuthorType} />
            <div class="chat-input-wrapper">
                <textarea
                    ref={textareaRef}
                    class="chat-input-field"
                    placeholder={placeholder}
                    rows={1}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    aria-label="Mensaje"
                />
                <button
                    class="chat-send-btn"
                    type="button"
                    aria-label="Enviar mensaje"
                    aria-disabled={hasContent ? undefined : 'true'}
                    onClick={hasContent ? handleSend : undefined}
                    style={{
                        opacity: hasContent ? 1 : 0.35,
                        transition: `opacity var(--gds-duration-normal, 150ms)`,
                        cursor: hasContent ? 'pointer' : 'default',
                    }}
                >
                    {/* Paper-plane icon (Patch #17) */}
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
