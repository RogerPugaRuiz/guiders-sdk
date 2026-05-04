/**
 * PresenceIndicator styles — injected inside Shadow DOM via ChatWidget.styles.ts.
 * The CSS classes (avatar-status-dot, status-online, etc.) are already defined there.
 * This file provides the standalone dot used outside the avatar container.
 */
export function getPresenceIndicatorStyles(): string {
    return `
        .guiders-presence {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .guiders-presence--online {
            background-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }
        .guiders-presence--offline {
            background-color: #6b7280;
        }
        .guiders-presence--away {
            background-color: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
        }
        .guiders-presence--busy {
            background-color: #ef4444;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
        }
        .guiders-presence--chatting {
            background-color: #60a5fa;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.25);
        }
    `;
}
