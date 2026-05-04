import { ChatSelectorItem } from '../../types/chat-types';
import { formatRelativeTime } from '../../utils/chat-list-utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatListItemProps {
    chat: ChatSelectorItem;
    isSelected: boolean;
    onClick: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
    const timeLabel = chat.lastMessageDate
        ? formatRelativeTime(chat.lastMessageDate)
        : '';
    const hasUnread = chat.unreadCount > 0;

    return (
        <button
            class={`guiders-chat-list-item${isSelected ? ' selected' : ''}`}
            type="button"
            onClick={onClick}
            // Patch #39: aria-pressed is for toggle buttons; for the
            // "currently active item in a list" pattern aria-current is
            // semantically correct and announced more naturally by AT.
            aria-current={isSelected ? 'true' : undefined}
        >
            <div class="guiders-chat-list-avatar">
                {chat.avatarUrl
                    ? <img class="guiders-chat-list-avatar-img" src={chat.avatarUrl} alt="" />
                    : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    )
                }
            </div>

            <div class="guiders-chat-list-content">
                <div class="guiders-chat-list-title-row">
                    <span class="guiders-chat-list-item-title">{chat.title}</span>
                    {timeLabel && (
                        <span class="guiders-chat-list-item-time">{timeLabel}</span>
                    )}
                </div>
                {chat.lastMessagePreview && (
                    <div class="guiders-chat-list-preview-row">
                        <span class="guiders-chat-list-preview">{chat.lastMessagePreview}</span>
                    </div>
                )}
            </div>

            {/*
              Patch #28: badge lives in its own column so an unread count
              is always visible, even when there is no last-message preview
              (e.g. a freshly created chat with only system messages).
            */}
            {hasUnread && (
                <span
                    class="guiders-chat-list-badge"
                    aria-label={`${chat.unreadCount} mensajes no leídos`}
                >
                    {chat.unreadCount}
                </span>
            )}
        </button>
    );
}
