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
export function getTokensCSS(): string {
    return `
        :host {
            /* ================================================================
             * PUBLIC TOKENS — SDK client API (configurable via :root CSS)
             * ================================================================ */
            --guiders-primary: #2563eb;
            --guiders-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            --guiders-radius: 14px;
            --guiders-spacing: 4px;
            --guiders-color-scheme: auto;

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
             * SEMANTIC COLOR TOKENS — light mode (default)
             * ================================================================ */
            --gds-color-bg: #ffffff;
            --gds-color-bg-elevated: #f8fafc;
            --gds-color-text: #0f172a;
            --gds-color-text-secondary: #475569;
            --gds-color-text-tertiary: #94a3b8;
            --gds-color-border: #e2e8f0;
            --gds-color-border-strong: #cbd5e1;
            --gds-color-border-accent: #bfdbfe;  /* blue-200 — accent border for consent/info */

            /* Toggle button */
            --gds-color-toggle-icon: #111827;   /* icon color on toggle button */
            --gds-color-toggle-bg: #ffffff;     /* inner panel bg behind gradient */
            --gds-color-header-bg: #334155;     /* chat header background — slate-700 */

            /* Primary — inherits public token */
            --gds-color-primary: var(--guiders-primary, #2563eb);
            --gds-color-primary-soft: #dbeafe;
            --gds-color-text-on-primary: #ffffff;  /* text on primary bg (own bubble) */

            /* Author identity tokens
             * human: configurable (inherits from --guiders-primary)
             * ai: FIXED by EU AI Act P7 — violet MUST identify AI unambiguously
             * system: neutral slate */
            --gds-color-author-human: #2563eb;
            --gds-color-author-human-soft: #eff6ff;
            --gds-color-author-ai: #7c3aed;       /* FIXED — EU AI Act Art. 50 */
            --gds-color-author-ai-soft: #f5f3ff;  /* FIXED — EU AI Act Art. 50 */
            --gds-color-author-system: #94a3b8;
            --gds-color-agent-btn-border: #7c3aed; /* light: intense violet border */

            /* Semantic state colors */
            --gds-color-success: #16a34a;
            --gds-color-warning: #d97706;
            --gds-color-error: #dc2626;
            --gds-color-info: #64748b;

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
            --gds-shadow-widget: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);

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
        }

        /* ====================================================================
         * DARK MODE — auto-detected via prefers-color-scheme
         * No JS required — pure CSS media query on :host
         * ==================================================================== */
        @media (prefers-color-scheme: dark) {
            :host {
                --gds-color-bg: #0f172a;
                --gds-color-bg-elevated: #1e293b;
                --gds-color-text: #f1f5f9;
                --gds-color-text-secondary: #cbd5e1;
                --gds-color-text-tertiary: #64748b;
                --gds-color-border: #334155;
                --gds-color-border-strong: #475569;
                --gds-color-border-accent: #1e3a8a;  /* blue-900 dark — accent border */
                --gds-color-primary-soft: #1e3a8a;
                --gds-color-toggle-icon: #f1f5f9;   /* light icon on dark toggle */
                --gds-color-toggle-bg: #1e293b;     /* dark panel bg behind gradient */
                --gds-color-header-bg: #1e293b;     /* chat header background dark */
                --gds-color-author-human: #3b82f6;
                --gds-color-author-human-soft: #1e3a8a;
                --gds-color-author-ai: #8b5cf6;       /* FIXED — EU AI Act Art. 50 */
                --gds-color-author-ai-soft: #2e1065;  /* FIXED — EU AI Act Art. 50 */
                --gds-color-author-system: #64748b;
                --gds-color-agent-btn-border: #6d28d9; /* dark: deeper violet border */
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
