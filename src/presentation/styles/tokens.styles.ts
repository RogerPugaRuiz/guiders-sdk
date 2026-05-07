/**
 * GCS (Guiders Concierge System) — CSS Design Tokens
 * Single source of truth for all design tokens.
 * Injected into the Shadow DOM :host before any component styles.
 *
 * Token categories:
 *   --guiders-*  Public API tokens — configurable by SDK clients (Marcos)
 *   --gds-*      Internal tokens — NOT exposed to SDK clients
 *
 * LEGAL CONSTRAINT (EU AI Act Art. 50 / P7):
 *   --gds-color-author-ai (#7c3aed) and --gds-color-author-ai-soft are FIXED.
 *   The violet color unambiguously identifies AI responses. Exposing these as
 *   public --guiders-* tokens would allow clients to disguise AI as human,
 *   violating the transparency requirement (vigent August 2026).
 */
import { ThemeDefinition } from './themes/theme-types';

/** Generate the :host color block for a given ThemeColorSet */
function themeColorBlock(t: ThemeDefinition['light']): string {
    return `
            --gds-color-bg:               ${t.colorBg};
            --gds-color-bg-elevated:      ${t.colorBgElevated};
            --gds-color-text:             ${t.colorText};
            --gds-color-text-secondary:   ${t.colorTextSecondary};
            --gds-color-text-tertiary:    ${t.colorTextTertiary};
            --gds-color-border:           ${t.colorBorder};
            --gds-color-border-strong:    ${t.colorBorderStrong};
            --gds-color-border-accent:    ${t.colorBorderAccent};
            --gds-color-primary-soft:     ${t.colorPrimarySoft};
            --gds-color-toggle-icon:      ${t.colorToggleIcon};
            --gds-color-toggle-bg:        ${t.colorToggleBg};
            --gds-color-header-bg:        ${t.colorHeaderBg};
            --gds-color-header-text:      ${t.colorHeaderText ?? '#ffffff'};
            --gds-color-author-human:     ${t.colorAuthorHuman};
            --gds-color-author-human-soft:${t.colorAuthorHumanSoft};
            --gds-color-author-system:    ${t.colorAuthorSystem};
            --gds-color-agent-btn-border: ${t.colorAgentBtnBorder};
            --gds-color-bubble-own:       ${t.colorBubbleOwn ?? 'var(--gds-color-primary)'};
            --gds-color-text-on-bubble-own: ${t.colorTextOnBubbleOwn ?? 'var(--gds-color-text-on-primary)'};`;
}

/**
 * Generate the full CSS tokens string for injection into the Shadow DOM :host.
 *
 * @param theme - Optional ThemeDefinition. Defaults to the built-in 'default' theme
 *                (slate/white palette). Pass a ThemeDefinition from the theme registry
 *                to override the semantic color tokens.
 */
export function getTokensCSS(theme?: ThemeDefinition): string {
    // Derive the effective radius: theme override → CSS public token → 14px default
    const radiusValue = theme?.radius ?? '14px';
    const shadowWidget = theme?.shadowWidget
        ?? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)';
    const toggleGradient = theme?.toggleGradient
        ?? 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)';

    // Light-mode colors: from theme or hardcoded defaults (= defaultTheme.light)
    const light = theme?.light ?? {
        colorBg:              '#ffffff',
        colorBgElevated:      '#f8fafc',
        colorText:            '#0f172a',
        colorTextSecondary:   '#475569',
        colorTextTertiary:    '#94a3b8',
        colorBorder:          '#e2e8f0',
        colorBorderStrong:    '#cbd5e1',
        colorBorderAccent:    '#bfdbfe',
        colorPrimarySoft:     '#dbeafe',
        colorToggleIcon:      '#111827',
        colorToggleBg:        '#ffffff',
        colorHeaderBg:        '#334155',
        colorAuthorHuman:     '#2563eb',
        colorAuthorHumanSoft: '#eff6ff',
        colorAuthorSystem:    '#94a3b8',
        colorAgentBtnBorder:  '#7c3aed',
    };

    // Dark-mode colors: from theme or hardcoded defaults (= defaultTheme.dark)
    const dark = theme?.dark ?? {
        colorBg:              '#0f172a',
        colorBgElevated:      '#1e293b',
        colorText:            '#f1f5f9',
        colorTextSecondary:   '#cbd5e1',
        colorTextTertiary:    '#64748b',
        colorBorder:          '#334155',
        colorBorderStrong:    '#475569',
        colorBorderAccent:    '#1e3a8a',
        colorPrimarySoft:     '#1e3a8a',
        colorToggleIcon:      '#f1f5f9',
        colorToggleBg:        '#1e293b',
        colorHeaderBg:        '#1e293b',
        colorAuthorHuman:     '#3b82f6',
        colorAuthorHumanSoft: '#1e3a8a',
        colorAuthorSystem:    '#64748b',
        colorAgentBtnBorder:  '#6d28d9',
        colorBubbleOwn:       '#2563eb',
        colorTextOnBubbleOwn: '#ffffff',
    };

    return `
        :host {
            /* ================================================================
             * PUBLIC TOKENS — SDK client API (configurable via :root CSS)
             * ================================================================ */
            --guiders-primary: #2563eb;
            --guiders-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            --guiders-radius: ${radiusValue};
            --guiders-spacing: 4px;
            --guiders-color-scheme: auto;

            /* Theme identifier — readable by devtools */
            --gds-theme: '${theme?.id ?? 'default'}';

            /* ================================================================
             * COLOR PRIMITIVES — Slate palette
             * ================================================================ */
            --gds-slate-50: #f8fafc;
            --gds-slate-100: #f1f5f9;
            --gds-slate-200: #e2e8f0;
            --gds-slate-300: #cbd5e1;
            --gds-slate-400: #94a3b8;
            --gds-slate-500: #64748b;
            --gds-slate-700: #334155;
            --gds-slate-800: #1e293b;
            --gds-slate-900: #0f172a;

            /* Blue palette — human / primary */
            --gds-blue-50: #eff6ff;
            --gds-blue-100: #dbeafe;
            --gds-blue-600: #2563eb;
            --gds-blue-700: #1d4ed8;

            /* Violet palette — AI identity (FIXED, EU AI Act P7) */
            --gds-violet-50: #f5f3ff;
            --gds-violet-100: #ede9fe;
            --gds-violet-600: #7c3aed;
            --gds-violet-700: #6d28d9;

            /* ================================================================
             * SEMANTIC COLOR TOKENS — light mode (theme-driven)
             * ================================================================ */${themeColorBlock(light)}

            /* Primary — theme override or client-configurable public token */
            --guiders-primary: ${theme?.primaryColor ?? '#2563eb'};
            --gds-color-primary: var(--guiders-primary, #2563eb);
            --gds-color-text-on-primary: ${theme?.light?.colorTextOnPrimary ?? '#ffffff'};  /* text on primary bg (own bubble) */

            /* Author AI tokens — FIXED by EU AI Act Art. 50 */
            --gds-color-author-ai: #7c3aed;       /* FIXED — EU AI Act Art. 50 */
            --gds-color-author-ai-soft: #f5f3ff;  /* FIXED — EU AI Act Art. 50 */

            /* Semantic state colors */
            --gds-color-success: #16a34a;
            --gds-color-warning: #d97706;
            --gds-color-error: #dc2626;
            --gds-color-info: #64748b;

            /* Toggle gradient (theme-driven) */
            --gds-toggle-gradient: ${toggleGradient};

            /* ================================================================
             * TYPOGRAPHY TOKENS
             * ================================================================ */
            /* Stack uses system-ui — 0 KB download, no external fonts */
            --gds-font-family: var(--guiders-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);

            --gds-font-size-xs: 11px;
            --gds-font-size-sm: 13px;
            --gds-font-size-base: 14px;
            --gds-font-size-md: 15px;
            --gds-font-size-lg: 17px;

            --gds-font-weight-normal: 400;
            --gds-font-weight-medium: 500;
            --gds-font-weight-semibold: 600;

            --gds-line-height-tight: 1.3;
            --gds-line-height-normal: 1.5;
            --gds-line-height-relaxed: 1.6;

            /* ================================================================
             * SPACING TOKENS — 4px base scale
             * ================================================================ */
            --gds-spacing-1:  calc(var(--guiders-spacing, 4px) * 1);   /*  4px */
            --gds-spacing-2:  calc(var(--guiders-spacing, 4px) * 2);   /*  8px */
            --gds-spacing-3:  calc(var(--guiders-spacing, 4px) * 3);   /* 12px */
            --gds-spacing-4:  calc(var(--guiders-spacing, 4px) * 4);   /* 16px */
            --gds-spacing-5:  calc(var(--guiders-spacing, 4px) * 5);   /* 20px */
            --gds-spacing-6:  calc(var(--guiders-spacing, 4px) * 6);   /* 24px */
            --gds-spacing-8:  calc(var(--guiders-spacing, 4px) * 8);   /* 32px */
            --gds-spacing-12: calc(var(--guiders-spacing, 4px) * 12);  /* 48px */

            /* ================================================================
             * BORDER RADIUS TOKENS
             * ================================================================ */
            --gds-radius-sm: 4px;
            --gds-radius-md: 8px;
            --gds-radius-lg: var(--guiders-radius, 14px);
            --gds-radius-bubble: 14px;
            --gds-radius-bubble-tail-left: 14px 14px 14px 4px;
            --gds-radius-bubble-tail-right: 14px 14px 4px 14px;
            --gds-radius-widget: 16px;
            --gds-radius-pill: 9999px;

            /* ================================================================
             * SHADOW TOKENS
             * ================================================================ */
            --gds-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
            --gds-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);
            --gds-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
            --gds-shadow-widget: ${shadowWidget};

            /* ================================================================
             * MOTION TOKENS — Linear-style easing
             * ================================================================ */
            --gds-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
            --gds-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

            --gds-duration-fast:   100ms;
            --gds-duration-normal: 150ms;
            --gds-duration-medium: 200ms;
            --gds-duration-slow:   300ms;
            --gds-duration-bounce: 1200ms;  /* TypingIndicator gdsBounce */

            /* ================================================================
             * Z-INDEX TOKENS — near INT32_MAX to survive hostile host pages
             * ================================================================ */
            --gds-z-overlay: 2147483639;
            --gds-z-widget:  2147483640;
            --gds-z-tooltip: 2147483641;

            /* ================================================================
             * LAYOUT TOKENS
             * ================================================================ */
            --gds-widget-width:  400px;
            --gds-widget-height: 600px;
            --gds-widget-offset: 24px;

            /* Widget border — transparent in light mode, visible in dark mode */
            --gds-widget-border-color: transparent;
            /* Header border-bottom — hidden in light (header already contrasts), visible in dark */
            --gds-header-border-color: transparent;
        }

        /* ====================================================================
         * DARK MODE — three strategies (all use the same color block):
         *
         * 1. :host([data-color-scheme="dark"])
         *    Forced by SDKOptions.colorScheme = 'dark' (WP Admin override).
         *    Applies regardless of OS preference.
         *
         * 2. @media (prefers-color-scheme: dark) :host(:not([data-color-scheme="light"]))
         *    Automatic: OS is dark AND admin has NOT forced light mode.
         *    Covers both 'system' (no attribute) and the defensive case where
         *    data-color-scheme="dark" is present (rule 1 already applies).
         *
         * No JS required — pure CSS on :host.
         * ==================================================================== */
        :host([data-color-scheme="dark"]) {
                ${themeColorBlock(dark)}
                --gds-color-text-on-primary: ${theme?.dark?.colorTextOnPrimary ?? theme?.light?.colorTextOnPrimary ?? '#ffffff'};
                --gds-color-author-ai: #8b5cf6;       /* FIXED — EU AI Act Art. 50 */
                --gds-color-author-ai-soft: #2e1065;  /* FIXED — EU AI Act Art. 50 */
                --gds-widget-border-color: var(--gds-color-border-strong);
                --gds-header-border-color: var(--gds-color-border);
                /* Header: ensure readable slate bg regardless of client primary */
                --gds-color-header-bg: ${theme?.dark?.colorHeaderBg ?? '#1e293b'};
        }

        @media (prefers-color-scheme: dark) {
            :host(:not([data-color-scheme="light"])) {
                ${themeColorBlock(dark)}
                --gds-color-text-on-primary: ${theme?.dark?.colorTextOnPrimary ?? theme?.light?.colorTextOnPrimary ?? '#ffffff'};
                --gds-color-author-ai: #8b5cf6;       /* FIXED — EU AI Act Art. 50 */
                --gds-color-author-ai-soft: #2e1065;  /* FIXED — EU AI Act Art. 50 */
                --gds-widget-border-color: var(--gds-color-border-strong);
                --gds-header-border-color: var(--gds-color-border);
                /* Header: ensure readable slate bg regardless of client primary */
                --gds-color-header-bg: ${theme?.dark?.colorHeaderBg ?? '#1e293b'};
            }
        }

        /* ====================================================================
         * REDUCED MOTION — respects user accessibility preference
         * All components using var(--gds-duration-*) get 0ms automatically
         * ==================================================================== */
        @media (prefers-reduced-motion: reduce) {
            :host {
                --gds-duration-fast:   0ms;
                --gds-duration-normal: 0ms;
                --gds-duration-medium: 0ms;
                --gds-duration-slow:   0ms;
                --gds-duration-bounce: 0ms;
            }
        }
    `;
}
