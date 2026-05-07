/**
 * GCS Theme — Default
 *
 * The original Guiders theme. Light mode uses white backgrounds with slate
 * accents; dark mode uses the deep slate-900 palette.
 * Header background: slate-700 (#334155) — the classic Guiders navy-grey.
 */
import { ThemeDefinition } from './theme-types';

export const defaultTheme: ThemeDefinition = {
    id: 'default',
    name: 'Default',
    description: 'Classic Guiders theme — white/slate with blue accents.',

    light: {
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
    },

    dark: {
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
        colorHeaderBg:        '#1e293b',   /* dark header: bg-elevated, separated by border-bottom */
        colorAuthorHuman:     '#3b82f6',
        colorAuthorHumanSoft: '#1e3a8a',
        colorAuthorSystem:    '#64748b',
        colorAgentBtnBorder:  '#6d28d9',
        colorBubbleOwn:       '#2563eb',   /* own bubble: vivid blue — legible on dark bg */
        colorTextOnBubbleOwn: '#ffffff',
    },
};
