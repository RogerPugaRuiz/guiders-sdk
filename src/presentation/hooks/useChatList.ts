import { useState, useEffect, useRef } from 'preact/hooks';
import { ChatSelectorItem } from '../types/chat-types';
import { isShowingChatListSignal, chatIdSignal, visitorIdSignal } from '../signals';
import { chatV2ListToSelectorItems } from '../utils/chat-list-utils';
import { ChatV2Service } from '../../services/chat-v2-service';
import { debugLog, debugError } from '../../utils/debug-logger';
import { DEFAULT_CHAT_SELECTOR_CONFIG } from '../types/chat-selector-types';

export interface UseChatListResult {
    chats: ChatSelectorItem[];
    isLoading: boolean;
    error: string | null;
}

/**
 * Fetches the visitor's chat list whenever the chat list view becomes visible.
 * Returns items mapped to ChatSelectorItem (with preview fields) for display.
 *
 * Patch #14 (Chunk 2): added monotonic request token so rapid toggles of the
 * chat-list view cannot let a stale response overwrite a newer one. Also
 * hoisted the previously-dynamic ChatV2Service import to the top of the file
 * (no real benefit to the dynamic form — it's a singleton module).
 *
 * Patch #15 (Chunk 2): page size is read from `DEFAULT_CHAT_SELECTOR_CONFIG`
 * to keep a single source of truth.
 *
 * Patch #26 (Chunk 3): refetch when the active chat changes so previews and
 * selection stay in sync.
 */
export function useChatList(): UseChatListResult {
    const [chats, setChats] = useState<ChatSelectorItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestTokenRef = useRef(0);

    const isShowing = isShowingChatListSignal.value;
    const visitorId = visitorIdSignal.value;
    const activeChatId = chatIdSignal.value;

    useEffect(() => {
        if (!isShowing || !visitorId) return;

        const myToken = ++requestTokenRef.current;
        let cancelled = false;
        setIsLoading(true);
        setError(null);

        ChatV2Service.getInstance()
            .getVisitorChats(visitorId, undefined, DEFAULT_CHAT_SELECTOR_CONFIG.maxChatsToShow)
            .then((chatList) => {
                // Patch #14: discard stale responses.
                if (cancelled || myToken !== requestTokenRef.current) return;
                const items = chatV2ListToSelectorItems(
                    chatList.chats,
                    activeChatId,
                    /* sortByDate */ true
                );
                setChats(items);
                debugLog('💬 [useChatList] Chats cargados:', items.length);
            })
            .catch((err) => {
                if (cancelled || myToken !== requestTokenRef.current) return;
                debugError('[useChatList] Error al cargar chats:', err);
                // TODO(i18n): externalise this string when i18n epic lands.
                setError('Error al cargar conversaciones');
            })
            .finally(() => {
                if (!cancelled && myToken === requestTokenRef.current) {
                    setIsLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [isShowing, visitorId, activeChatId]);

    return { chats, isLoading, error };
}
