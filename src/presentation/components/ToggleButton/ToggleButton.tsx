import type { h } from 'preact';
import { useEffect } from 'preact/hooks';
import {
    toggleButtonVisibleSignal,
    toggleChatOpenSignal,
    unreadCountSignal,
    toggleResolvedPositionSignal,
    toggleClickedSignal,
    activeChatForUnreadSignal,
    unreadServiceConfigSignal,
} from '../../signals/toggleState';
import type { UnreadServiceConfig } from '../../types/toggle-types';
import { UnreadMessagesService } from '../../../services/unread-messages-service';
import { effect } from '@preact/signals-core';
import { debugLog } from '../../../utils/debug-logger';

export function ToggleButton() {
    const visible = toggleButtonVisibleSignal.value;
    const isOpen = toggleChatOpenSignal.value;
    const unread = unreadCountSignal.value;
    const position = toggleResolvedPositionSignal.value;

    // Patches #7 + #8: a single effect that re-initialises UnreadMessagesService
    // only when the *identity* of the config object actually changes. Without
    // this guard, every spurious change (e.g. another effect re-emitting the
    // same payload) would re-initialise the service.
    useEffect(() => {
        let lastCfg: UnreadServiceConfig | null = null;
        return effect(() => {
            const cfg = unreadServiceConfigSignal.value;
            if (!cfg || cfg === lastCfg) return;
            lastCfg = cfg;
            const svc = UnreadMessagesService.getInstance();
            svc.initialize({
                visitorId: cfg.visitorId,
                onCountChange: (count) => { unreadCountSignal.value = count; },
                onMessageReceived: cfg.onMessageReceived,
                autoOpenChatOnMessage: cfg.autoOpenChatOnMessage,
                debug: true,
            });
        });
    }, []);

    // Patch #8: separate effect for active-chat updates — only writes when
    // the chat id actually changes.
    useEffect(() => {
        let lastChatId: string | null = null;
        return effect(() => {
            const chatId = activeChatForUnreadSignal.value;
            if (!chatId || chatId === lastChatId) return;
            lastChatId = chatId;
            UnreadMessagesService.getInstance().setCurrentChat(chatId);
        });
    }, []);

    if (!visible) return null;

    const posStyle: h.JSX.CSSProperties = {};
    if (position?.button) {
        const p = position.button;
        if (p.top) posStyle.top = p.top;
        if (p.bottom) posStyle.bottom = p.bottom;
        if (p.left) posStyle.left = p.left;
        if (p.right) posStyle.right = p.right;
    }

    const handleClick = () => {
        debugLog('🔘 [ToggleButton] clicked');
        // Patch from prior chunk: pulse counter is read by the bridge effect.
        toggleClickedSignal.value = toggleClickedSignal.peek() + 1;
    };

    const badgeText = unread > 99 ? '99+' : unread > 0 ? String(unread) : '';

    return (
        <button
            class={`chat-toggle-btn${isOpen ? ' open' : ''}`}
            style={posStyle}
            onClick={handleClick}
            aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
        >
            <div class="btn-background" />
            {badgeText && (
                <div class="chat-unread-badge" aria-label={`${unread} mensajes no leídos`}>
                    {badgeText}
                </div>
            )}
        </button>
    );
}
