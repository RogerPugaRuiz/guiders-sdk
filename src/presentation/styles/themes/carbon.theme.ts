/**
 * GCS Theme — Carbon
 *
 * Inspired by Vercel / Linear dark-first design language.
 * True blacks, zinc grays, razor-thin borders, no colored header —
 * the widget blends into dark-mode product UIs without visual noise.
 *
 * Light mode: near-white with cool zinc tones (not the warm slate of Default).
 *   Header: white (#fafafa) with border-bottom — clean, no heavy dark bar.
 *   Own bubble: zinc-700 (#3f3f46) — dark gray, not black, readable contrast.
 *
 * Dark mode:  pure #000000 background, #111111 elevated, zinc-800 borders.
 *   Header: #111111 elevated surface with border-bottom separator.
 *   Own bubble: #e4e4e7 (zinc-200, light gray) — legible on black bg.
 *
 * Toggle FAB: replaces the default gradient with a solid black/zinc button.
 * Widget shadow: more dramatic to pop against dark backgrounds.
 *
 * Radius override: 10px — slightly more angular than the default 14px,
 * matching the sharper aesthetic of Vercel's UI.
 */
import { ThemeDefinition } from './theme-types';

export const carbonTheme: ThemeDefinition = {
    id: 'carbon',
    name: 'Carbon',
    description: 'Vercel-inspired dark theme — true blacks with zinc gray accents.',

    radius: '10px',

    /**
     * White primary: send button and own message bubbles are white/near-white,
     * matching the zero-color Vercel aesthetic.
     */
    primaryColor: '#fafafa',

    toggleGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',

    shadowWidget: '0 8px 40px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.30)',

    light: {
        colorBg:              '#fafafa',
        colorBgElevated:      '#f4f4f5',
        colorText:            '#09090b',
        colorTextSecondary:   '#52525b',
        colorTextTertiary:    '#a1a1aa',
        colorBorder:          '#e4e4e7',
        colorBorderStrong:    '#d4d4d8',
        colorBorderAccent:    '#a1a1aa',
        colorPrimarySoft:     '#f4f4f5',
        colorToggleIcon:      '#09090b',
        colorToggleBg:        '#fafafa',
        colorHeaderBg:        '#ffffff',  /* light header: white — clean, no heavy black bar */
        colorHeaderText:      '#09090b',  /* dark text on white header */
        colorAuthorHuman:     '#18181b',
        colorAuthorHumanSoft: '#f4f4f5',
        colorAuthorSystem:    '#a1a1aa',
        colorAgentBtnBorder:  '#7c3aed',
        colorTextOnPrimary:   '#09090b',
        colorBubbleOwn:       '#3f3f46',  /* own bubble: zinc-700 gray — not black, readable */
        colorTextOnBubbleOwn: '#fafafa',
    },

    dark: {
        colorBg:              '#000000',
        colorBgElevated:      '#111111',
        colorText:            '#fafafa',
        colorTextSecondary:   '#a1a1aa',
        colorTextTertiary:    '#52525b',
        colorBorder:          '#27272a',
        colorBorderStrong:    '#3f3f46',
        colorBorderAccent:    '#3f3f46',
        colorPrimarySoft:     '#18181b',
        colorToggleIcon:      '#fafafa',
        colorToggleBg:        '#111111',
        colorHeaderBg:        '#111111',  /* dark header: slightly elevated from pure black */
        colorAuthorHuman:     '#e4e4e7',
        colorAuthorHumanSoft: '#27272a',
        colorAuthorSystem:    '#52525b',
        colorAgentBtnBorder:  '#6d28d9',
        colorTextOnPrimary:   '#09090b',
        colorBubbleOwn:       '#27272a',  /* own bubble: zinc-800 — tonal gray, same family as agent bubbles */
        colorTextOnBubbleOwn: '#fafafa',  /* white text on zinc bubble */
    },
};
