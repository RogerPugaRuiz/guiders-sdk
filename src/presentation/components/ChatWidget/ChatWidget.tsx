import { h, render } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { effect } from '@preact/signals-core';
import { ChatUIOptions, QuickActionsConfig } from '../../types/chat-types';
import { ResolvedPosition } from '../../../utils/position-resolver';
import { isVisibleSignal, isShowingChatListSignal } from '../../signals';
import {
    toggleResolvedPositionSignal,
    toggleClickedSignal,
    toggleChatOpenSignal,
} from '../../signals/toggleState';
import { getChatStyles } from './ChatWidget.styles';
import { getTokensCSS } from '../../styles/tokens.styles';
import { ChatHeader } from '../ChatHeader';
import { ChatMessages } from '../ChatMessages';
import { ChatInput } from '../ChatInput';
import { AIDisclaimer } from '../AIDisclaimer';
import { OfflineBanner } from '../OfflineBanner';
import { QuickActions } from '../QuickActions';
import { ChatListView } from '../ChatListView';
import { ToggleButton } from '../ToggleButton';
import { usePresence } from '../../hooks/usePresence';
import { hasAssignedCommercialSignal } from '../../signals/chatState';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChatWidgetOptions extends ChatUIOptions {}

interface ChatWidgetProps {
    options: ChatWidgetOptions;
    position: ResolvedPosition;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveQuickActionsConfig(options: ChatWidgetOptions): QuickActionsConfig {
    return {
        enabled: false,
        welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
        showOnFirstOpen: true,
        showOnChatStart: true,
        buttons: [],
        ...options.quickActions,
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ChatWidget — Story 6.7:
 *   - bottom sheet layout mobile (<640px)
 *   - drag handle + tap-to-close overlay on mobile
 *   - focus trap (Tab cycling) when panel is open
 *   - role="dialog" aria-modal="true"
 */
export function ChatWidget({ options }: ChatWidgetProps) {
    const visible = isVisibleSignal.value;
    const isShowingList = isShowingChatListSignal.value;
    const quickActionsConfig = resolveQuickActionsConfig(options);
    // Show AI disclaimer when no human agent is assigned (EU AI Act Art. 50)
    const disclaimerVisible = !hasAssignedCommercialSignal.value;

    // Subscribe to PresenceService updates
    usePresence();

    // Patch #23: when the widget is hidden, mark its subtree as `inert` so
    // screen readers and Tab navigation skip it entirely.
    // Patch #24: when the chat closes, return focus to the element that had
    // focus before it was opened (typically the ToggleButton).
    const widgetRootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const lastFocusedBeforeOpenRef = useRef<HTMLElement | null>(null);
    // Initialize to !visible so that opening on mount always triggers the focus-save branch
    const wasVisibleRef = useRef<boolean>(!visible);

    // Story 6.7: drag-to-close (mobile)
    const dragStartYRef = useRef<number>(0);
    const dragStartXRef = useRef<number>(0);

    const handleClose = () => {
        if (toggleChatOpenSignal.peek()) {
            toggleClickedSignal.value = toggleClickedSignal.peek() + 1;
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        dragStartYRef.current = e.touches[0].clientY;
        dragStartXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        const deltaY = touch.clientY - dragStartYRef.current;
        const deltaX = Math.abs(touch.clientX - dragStartXRef.current);
        // Ignore upward swipes and horizontal-dominant gestures (scroll, side-swipe)
        if (deltaY <= 0 || deltaX > deltaY) return;
        const panelHeight = panelRef.current?.offsetHeight ?? 600;
        if (deltaY > panelHeight * 0.3) {
            handleClose();
        }
    };

    // useLayoutEffect ensures `inert` is set before the browser paints,
    // preventing the "dialog announced before inert" race (patch F-M4).
    useLayoutEffect(() => {
        const wasVisible = wasVisibleRef.current;
        wasVisibleRef.current = visible;

        const root = widgetRootRef.current;
        if (root) {
            if (visible) {
                root.removeAttribute('inert');
            } else {
                root.setAttribute('inert', '');
            }
        }

        if (visible && !wasVisible) {
            lastFocusedBeforeOpenRef.current =
                (document.activeElement as HTMLElement | null) ?? null;
        } else if (!visible && wasVisible) {
            const target = lastFocusedBeforeOpenRef.current;
            // Patch F-H3: document.contains() returns false for Shadow DOM nodes.
            // Use getRootNode({ composed: true }) to walk the composed tree.
            const isInDOM = (el: HTMLElement) =>
                document.contains(el) || el.getRootNode({ composed: true }) === document;
            if (target && isInDOM(target) && typeof target.focus === 'function') {
                queueMicrotask(() => {
                    try { target.focus(); } catch { /* ignore */ }
                });
            }
            lastFocusedBeforeOpenRef.current = null;
        }
    }, [visible]);

    // Story 6.7: Focus trap — Tab cycling inside the panel (AC: 9)
    useEffect(() => {
        if (!visible) return undefined;

        const trapFocus = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const panel = panelRef.current;
            if (!panel) return;
            const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
                'button,[href],input,textarea,[tabindex]:not([tabindex="-1"])'
            )).filter(el => !el.hasAttribute('disabled'));
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const shadowRoot = panel.getRootNode() as ShadowRoot | Document;
            const active = shadowRoot.activeElement as HTMLElement | null;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', trapFocus);
        return () => document.removeEventListener('keydown', trapFocus);
    }, [visible]);

    // Patch F-M1: isMobile must be reactive to window resize (not evaluated once at render)
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth <= 640
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return (
        <>
        <ToggleButton />
        {/* Mobile overlay: tap-to-close backdrop */}
        {visible && isMobile && (
            <div
                class="chat-overlay"
                onClick={handleClose}
                aria-hidden="true"
            />
        )}
        <div
            ref={widgetRootRef}
            class={`guiders-chat-widget-root${visible ? '' : ' hidden'}`}
        >
            <div
                ref={panelRef}
                class="chat-widget chat-widget-fixed"
                role="dialog"
                aria-modal="true"
                aria-label="Chat de soporte"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Drag handle (visible on mobile only via CSS display:none/block) */}
                <div class="chat-drag-handle" aria-hidden="true" />
                <ChatHeader options={options} />
                <OfflineBanner />
                {isShowingList
                    ? <ChatListView />
                    : (
                        <>
                            <ChatMessages />
                            {quickActionsConfig.enabled && quickActionsConfig.buttons.length > 0 && (
                                <QuickActions config={quickActionsConfig} />
                            )}
                            <AIDisclaimer visible={disclaimerVisible} />
                            <ChatInput />
                        </>
                    )
                }
            </div>
        </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

export interface MountedChatWidget {
    /** The shadow-host element appended to document.body. */
    host: HTMLElement;
    /**
     * Cleans up: disposes the style-update effect, unmounts Preact and removes
     * the shadow host. Patch #5 — previously the effect leaked across mounts.
     */
    dispose: () => void;
}

/**
 * Creates a Shadow Host on document.body, attaches a Shadow Root,
 * injects CSS and renders <ChatWidget /> with Preact.
 * Patch #5 — returns a `{ host, dispose }` pair so callers can clean up
 * the style-update effect (previously leaked) and the rendered tree.
 */
export function mountChatWidget(
    options: ChatWidgetOptions,
    position: ResolvedPosition
): MountedChatWidget {
    // Guard: if a host already exists and has a shadow root, return a no-op
    // dispose to prevent double mounts caused by SDK re-init on consent grant.
    const existing = document.getElementById('guiders-chat-widget');
    if (existing?.shadowRoot) {
        return {
            host: existing as HTMLElement,
            dispose: () => { /* already mounted — no-op */ },
        };
    }

    const shadowHost = document.createElement('div');
    shadowHost.id = 'guiders-chat-widget';
    document.body.appendChild(shadowHost);

    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = getTokensCSS() + getChatStyles(position);
    shadowRoot.appendChild(styleEl);

    // Re-generate styles when toggle position changes (e.g. after bridge updates position)
    const disposeStyleEffect = effect(() => {
        const updatedPosition = toggleResolvedPositionSignal.value ?? position;
        styleEl.textContent = getTokensCSS() + getChatStyles(updatedPosition);
    });

    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);

    render(h(ChatWidget, { options, position }), mountPoint);

    let disposed = false;
    const dispose = (): void => {
        if (disposed) return;
        disposed = true;
        try { disposeStyleEffect(); } catch { /* ignore */ }
        try { render(null, mountPoint); } catch { /* ignore */ }
        if (shadowHost.parentNode) shadowHost.parentNode.removeChild(shadowHost);
    };

    return { host: shadowHost, dispose };
}
