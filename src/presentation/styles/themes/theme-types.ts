/**
 * GCS Theme System — Type definitions
 *
 * A theme overrides the semantic color tokens for light and dark modes.
 * All other tokens (typography, spacing, radius, motion, z-index, layout)
 * remain constant across themes and are NOT overridable here.
 *
 * EU AI Act Art. 50 constraint: --gds-color-author-ai and --gds-color-author-ai-soft
 * are intentionally excluded from the theme surface — they MUST stay violet.
 */

export interface ThemeColorSet {
    /** Main widget background */
    colorBg: string;
    /** Elevated surface (chat list items, dropdowns) */
    colorBgElevated: string;
    /** Primary text */
    colorText: string;
    /** Secondary text */
    colorTextSecondary: string;
    /** Tertiary / placeholder text */
    colorTextTertiary: string;
    /** Default border */
    colorBorder: string;
    /** Stronger border (separators) */
    colorBorderStrong: string;
    /** Accent border (info/consent banners) */
    colorBorderAccent: string;
    /** Soft tint of primary color */
    colorPrimarySoft: string;
    /** Toggle button icon color */
    colorToggleIcon: string;
    /** Toggle button inner panel background */
    colorToggleBg: string;
    /** Chat header background */
    colorHeaderBg: string;
    /**
     * Chat header text/icon color.
     * Defaults to #ffffff when omitted (suitable for dark headers).
     * Set to a dark value when colorHeaderBg is light.
     */
    colorHeaderText?: string;
    /** Human message bubble color */
    colorAuthorHuman: string;
    /** Human message bubble soft background */
    colorAuthorHumanSoft: string;
    /** System message color */
    colorAuthorSystem: string;
    /** Agent action button border */
    colorAgentBtnBorder: string;
    /**
     * Text color rendered on top of a primary-colored background
     * (e.g. own message bubble text, send button icon).
     * Defaults to #ffffff when omitted.
     */
    colorTextOnPrimary?: string;
    /**
     * Background color of the visitor's own message bubble.
     * When omitted, falls back to --gds-color-primary (the accent color).
     * Use this to decouple the bubble color from the toggle/send-button accent.
     */
    colorBubbleOwn?: string;
    /**
     * Text color on top of the visitor's own message bubble.
     * When omitted, falls back to --gds-color-text-on-primary.
     */
    colorTextOnBubbleOwn?: string;
}

export interface ThemeDefinition {
    /** Unique identifier used in SDKOptions.theme */
    id: string;
    /** Human-readable display name */
    name: string;
    /** Brief description */
    description: string;
    /** Light mode color overrides */
    light: ThemeColorSet;
    /** Dark mode color overrides */
    dark: ThemeColorSet;
    /** Optional: override the default widget border-radius (--guiders-radius) */
    radius?: string;
    /**
     * Optional: override --guiders-primary (the accent / send-button / own-bubble color).
     * When set, this value is injected directly into --guiders-primary inside :host,
     * replacing the default #2563eb blue regardless of any host-page :root override.
     * Use this when the theme requires a non-blue primary (e.g. white for Carbon).
     */
    primaryColor?: string;
    /**
     * Optional: override the toggle gradient.
     * If provided, replaces the default slate gradient on the FAB button.
     */
    toggleGradient?: string;
    /**
     * Optional: override the widget shadow.
     * If provided, replaces --gds-shadow-widget.
     */
    shadowWidget?: string;
}

/** All available built-in theme IDs */
export type BuiltInThemeId = 'default' | 'carbon';

/** Theme ID — built-in or any custom string */
export type ThemeId = BuiltInThemeId | string;
