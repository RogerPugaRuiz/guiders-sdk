import type { PresenceUiStatus } from '../../types/presence-types';
import { presenceStatusSignal } from '../../signals/chatState';

export const PRESENCE_LABEL: Record<PresenceUiStatus, string> = {
    online: 'En línea',
    away: 'Ausente',
    busy: 'Ocupado',
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
