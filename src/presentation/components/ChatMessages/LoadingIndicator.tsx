interface LoadingIndicatorProps {
    /** When true, renders a smaller indicator suited for pagination (top of list). */
    compact?: boolean;
}

export function LoadingIndicator({ compact }: LoadingIndicatorProps) {
    const padding = compact ? '8px' : '24px';
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding }}>
            <span class="guiders-spinner" />
        </div>
    );
}
