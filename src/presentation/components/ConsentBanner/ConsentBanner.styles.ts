import { ConsentBannerConfig } from '../../types/consent-types';

/**
 * Generates the CSS for the ConsentBanner component.
 * Migrated from ConsentBannerUI.injectStyles() + inline styles.
 */
export function getConsentStyles(config: ConsentBannerConfig): string {
    const bg = config.colors?.background ?? '#2c3e50';
    const color = config.colors?.text ?? '#ffffff';
    const acceptColor = config.colors?.acceptButton ?? '#27ae60';
    const denyColor = config.colors?.denyButton ?? '#95a5a6';
    const prefsColor = config.colors?.preferencesButton ?? '#3498db';
    const position = config.position ?? 'bottom';

    return `
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
        }

        .guiders-consent {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                         "Helvetica Neue", Arial, sans-serif;
            z-index: 999999;
            box-sizing: border-box;
        }

        /* ── bottom_bar ── */
        .guiders-consent--bottom_bar {
            position: fixed;
            ${position}: 0;
            left: 0;
            right: 0;
            background: ${bg};
            color: ${color};
            padding: 20px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease-out;
        }
        .guiders-consent--bottom_bar .guiders-consent__inner {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
        }
        .guiders-consent--bottom_bar .guiders-consent__text {
            margin: 0;
            flex: 1;
            min-width: 300px;
            font-size: 14px;
            line-height: 1.5;
        }

        /* ── modal ── */
        .guiders-consent--modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease-out;
        }
        .guiders-consent--modal .guiders-consent__modal-box {
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: scaleIn 0.3s ease-out;
        }
        .guiders-consent--modal .guiders-consent__title {
            margin-top: 0;
            color: #2c3e50;
            font-size: 20px;
            font-weight: 600;
        }
        .guiders-consent--modal .guiders-consent__text {
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .guiders-consent--modal .guiders-consent__buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            flex-wrap: wrap;
        }

        /* ── corner ── */
        .guiders-consent--corner {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bg};
            color: ${color};
            padding: 20px;
            border-radius: 8px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        }
        .guiders-consent--corner .guiders-consent__text {
            margin: 0 0 15px 0;
            font-size: 13px;
            line-height: 1.5;
        }
        .guiders-consent--corner .guiders-consent__buttons {
            display: flex;
            gap: 8px;
            flex-direction: column;
        }
        .guiders-consent--corner .guiders-consent__btn {
            width: 100%;
        }

        /* ── shared buttons ── */
        .guiders-consent__buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .guiders-consent__btn {
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
            font-family: inherit;
            color: white;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .guiders-consent__btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .guiders-consent__btn--accept      { background: ${acceptColor}; }
        .guiders-consent__btn--deny        { background: ${denyColor}; }
        .guiders-consent__btn--preferences { background: ${prefsColor}; }

        /* ── mobile ── */
        @media (max-width: 768px) {
            .guiders-consent--bottom_bar { padding: 15px !important; }
            .guiders-consent--bottom_bar .guiders-consent__inner {
                flex-direction: column;
                align-items: flex-start;
            }
            .guiders-consent__btn { width: 100%; }
        }
    `;
}
