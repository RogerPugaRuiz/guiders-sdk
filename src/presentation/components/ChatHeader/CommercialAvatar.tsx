import { PresenceIndicator } from '../PresenceIndicator';

// ---------------------------------------------------------------------------
// CommercialAvatar
// ---------------------------------------------------------------------------

interface CommercialAvatarProps {
    name: string;
    avatarUrl?: string;
    initials: string;
}

export function CommercialAvatar({ name, avatarUrl, initials }: CommercialAvatarProps) {
    return (
        <div class="chat-header-main">
            <div class="chat-header-avatar-container">
                <div class="chat-header-avatar">
                    {avatarUrl
                        // Patch #45: avatar is decorative — the commercial's
                        // name is already in chat-header-title right next to
                        // it. Empty alt prevents double-announcement by AT.
                        ? <img src={avatarUrl} alt="" role="presentation" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" />
                        : <span style="font-weight:600;font-size:16px;" aria-hidden="true">{initials}</span>
                    }
                </div>
                {/* Presence dot — positioned absolute via avatar-status-dot CSS */}
                <PresenceIndicator />
            </div>
            <div class="chat-header-title-container">
                <span class="chat-header-title">{name}</span>
            </div>
        </div>
    );
}
