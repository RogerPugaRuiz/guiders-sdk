import { presenceStatusSignal } from '../../signals/chatState';

// Patch #41: aria-label was exposing the raw English status ("online"/
// "offline") to screen readers. We localise to Spanish (the default UI
// locale) here. A future i18n epic should externalise these strings.
const PRESENCE_LABEL: Record<'online' | 'offline', string> = {
    online: 'En línea',
    offline: 'Desconectado',
};

/**
 * PresenceIndicator — reactive dot driven by presenceStatusSignal.
 * Renders as a small coloured circle reflecting the commercial's online status.
 */
export function PresenceIndicator() {
    const status = presenceStatusSignal.value;

    return (
        <span
            class={`guiders-presence guiders-presence--${status}`}
            aria-label={PRESENCE_LABEL[status]}
            role="img"
        />
    );
}
