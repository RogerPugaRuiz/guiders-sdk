import { ResolvedPosition } from '../../../utils/position-resolver';

export function TOGGLE_BUTTON_CSS(position: ResolvedPosition | null): string {
    const pos = position?.button ?? {};
    const btnPos = [
        pos.top    ? `top: ${pos.top};`    : '',
        pos.bottom ? `bottom: ${pos.bottom};` : '',
        pos.left   ? `left: ${pos.left};`  : '',
        pos.right  ? `right: ${pos.right};` : '',
    ].filter(Boolean).join('\n\t\t\t\t\t');

    return `
        /* @property required for conic-gradient animation (Houdini).
         * Supported in Chrome 85+, Safari 16.4+, Firefox 128+.
         * Without this, --deg does not animate between @keyframes steps. */
        @property --deg {
            syntax: '<angle>';
            inherits: false;
            initial-value: 0deg;
        }
        .chat-toggle-btn {
            position: fixed;
            ${btnPos}
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: transparent;
            color: var(--gds-color-toggle-icon, #111827);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: none;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: var(--gds-z-widget, 2147483640);
        }
        @keyframes rotate-gradient {
            from { --deg: 0deg; }
            to   { --deg: 360deg; }
        }
        .chat-toggle-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: conic-gradient(from var(--deg, 0deg), #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000);
            filter: blur(8px);
            border-radius: 16px;
            opacity: 0.7;
            z-index: 1;
            animation: rotate-gradient 4s linear infinite;
            transition: filter 0.3s ease, opacity 0.3s ease;
        }
        .chat-toggle-btn .btn-background {
            position: absolute;
            inset: 0;
            background: var(--gds-color-toggle-bg, #ffffff);
            border-radius: 16px;
            z-index: 2;
        }
        .chat-toggle-btn::before {
            content: '';
            display: block;
            width: 24px;
            height: 24px;
            background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.937 1.25 22.75 6.06293 22.75 12C22.75 17.937 17.937 22.75 12 22.75C10.1437 22.75 8.39536 22.2788 6.87016 21.4493L2.63727 22.2373C2.39422 22.2826 2.14448 22.2051 1.96967 22.0303C1.79485 21.8555 1.71742 21.6058 1.76267 21.3627L2.55076 17.1298C1.72113 15.6046 1.25 13.8563 1.25 12ZM7.25 10C7.25 9.58579 7.58579 9.25 8 9.25H12H16C16.4142 9.25 16.75 9.58579 16.75 10C16.75 10.4142 16.4142 10.75 16 10.75H12H8C7.58579 10.75 7.25 10.4142 7.25 10ZM8 13.25C7.58579 13.25 7.25 13.5858 7.25 14C7.25 14.4142 7.58579 14.75 8 14.75H10H12C12.4142 14.75 12.75 14.4142 12.75 14C12.75 13.5858 12.4142 13.25 12 13.25H10H8Z' fill='%23111827'/%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: center;
            transition: transform 0.3s ease;
            z-index: 3;
            position: relative;
        }
        .chat-toggle-btn.open::before {
            background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z' fill='%23111827'/%3E%3C%2Fsvg%3E");
        }
        .chat-toggle-btn:hover {
            transform: translateY(-3px) scale(1.05);
        }
        .chat-toggle-btn:hover::after {
            filter: blur(12px);
            opacity: 1;
        }
        .chat-toggle-btn:active {
            transform: translateY(0) scale(0.95);
        }
        .chat-unread-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 18px;
            height: 18px;
            background: var(--gds-color-error, #ef4444);
            color: #ffffff;
            border-radius: var(--gds-radius-pill);
            font-size: var(--gds-font-size-xs, 11px);
            font-weight: var(--gds-font-weight-semibold, 600);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            box-sizing: border-box;
            z-index: 10;
            pointer-events: none;
            animation: gds-badge-in var(--gds-duration-slow, 300ms) var(--gds-ease-out, cubic-bezier(0.16,1,0.3,1));
        }
        @keyframes gds-badge-in {
            from { transform: scale(0); }
            to   { transform: scale(1); }
        }
    `;
}
