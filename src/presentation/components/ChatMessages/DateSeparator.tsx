import { useState, useEffect } from 'preact/hooks';
import { formatDate } from '../../utils/chat-utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DateSeparatorProps {
    date?: Date;
    /** 'date' (default) renders formatted date; 'handoff' renders handoff notice */
    type?: 'date' | 'handoff';
    /** Used when type='handoff' — e.g. "María se ha unido · agente" */
    label?: string;
}

// ---------------------------------------------------------------------------
// Shared line style (tokens only, no hardcoded colors)
// ---------------------------------------------------------------------------

const lineStyle = {
    flex: 1,
    height: '1px',
    background: 'var(--gds-color-border)',
};

// ---------------------------------------------------------------------------
// DateSeparator
// ---------------------------------------------------------------------------

/**
 * DateSeparator — Story 6.5:
 *   - type='date'    → existing behavior (date label, no regression)
 *   - type='handoff' → handoff notice with fade-in 200ms, tokens only
 */
export function DateSeparator({ date, type = 'date', label }: DateSeparatorProps) {
    // Fade-in for handoff variant
    const [opacity, setOpacity] = useState(type === 'handoff' ? 0 : 1);
    useEffect(() => {
        if (type === 'handoff') {
            // Trigger fade-in on mount
            const t = setTimeout(() => setOpacity(1), 16);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [type]);

    const displayLabel = type === 'handoff'
        ? (label ?? 'Agente se ha unido')
        : (date ? formatDate(date) : '');

    return (
        <div
            class="chat-date-separator"
            data-date={displayLabel}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: type === 'handoff' ? '8px 0' : '16px 0',
                opacity,
                transition: type === 'handoff' ? 'opacity 200ms ease' : undefined,
            }}
        >
            <div style={lineStyle} />
            <span
                style={{
                    color: 'var(--gds-color-text-secondary)',
                    fontSize: type === 'handoff' ? '12px' : '11px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    letterSpacing: type === 'date' ? '0.05em' : '0.01em',
                    textTransform: type === 'date' ? 'uppercase' : 'none',
                }}
            >
                {displayLabel}
            </span>
            <div style={lineStyle} />
        </div>
    );
}
