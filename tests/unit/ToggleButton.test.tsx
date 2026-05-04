/**
 * Unit tests for ToggleButton component.
 *
 * Strategy: import signals directly and mutate their .value before rendering.
 * No mocks of external modules needed — signals are plain objects in JSDOM.
 */
import { h } from 'preact';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { ToggleButton } from '../../src/presentation/components/ToggleButton/ToggleButton';
import {
    toggleButtonVisibleSignal,
    toggleChatOpenSignal,
    unreadCountSignal,
    toggleResolvedPositionSignal,
    toggleClickedSignal,
    unreadServiceConfigSignal,
    activeChatForUnreadSignal,
} from '../../src/presentation/signals/toggleState';

// Stub UnreadMessagesService so tests don't make network calls
jest.mock('../../src/services/unread-messages-service', () => ({
    UnreadMessagesService: {
        getInstance: () => ({
            initialize: jest.fn(),
            setCurrentChat: jest.fn(),
            setChatOpenState: jest.fn(),
            markAllAsRead: jest.fn(),
        }),
    },
}));

afterEach(() => {
    cleanup();
    // Reset signals to defaults after each test
    toggleButtonVisibleSignal.value = false;
    toggleChatOpenSignal.value = false;
    unreadCountSignal.value = 0;
    toggleResolvedPositionSignal.value = null;
    toggleClickedSignal.value = 0;
    unreadServiceConfigSignal.value = null;
    activeChatForUnreadSignal.value = null;
});

describe('ToggleButton', () => {
    it('renders nothing when visible signal is false', () => {
        toggleButtonVisibleSignal.value = false;
        const { container } = render(h(ToggleButton, {}));
        expect(container.firstChild).toBeNull();
    });

    it('renders the button when visible signal is true', () => {
        toggleButtonVisibleSignal.value = true;
        render(h(ToggleButton, {}));
        expect(screen.getByRole('button', { name: 'Abrir chat' })).toBeInTheDocument();
    });

    it('shows "Cerrar chat" aria-label when chat is open', () => {
        toggleButtonVisibleSignal.value = true;
        toggleChatOpenSignal.value = true;
        render(h(ToggleButton, {}));
        expect(screen.getByRole('button', { name: 'Cerrar chat' })).toBeInTheDocument();
    });

    it('applies the open CSS class when chat is open', () => {
        toggleButtonVisibleSignal.value = true;
        toggleChatOpenSignal.value = true;
        render(h(ToggleButton, {}));
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('open');
    });

    it('increments toggleClickedSignal on click', () => {
        toggleButtonVisibleSignal.value = true;
        render(h(ToggleButton, {}));
        const before = toggleClickedSignal.value;
        fireEvent.click(screen.getByRole('button'));
        expect(toggleClickedSignal.value).toBe(before + 1);
    });

    it('shows unread badge with correct count', () => {
        toggleButtonVisibleSignal.value = true;
        unreadCountSignal.value = 5;
        render(h(ToggleButton, {}));
        expect(screen.getByLabelText('5 mensajes no leídos')).toBeInTheDocument();
        expect(screen.getByLabelText('5 mensajes no leídos').textContent).toBe('5');
    });

    it('caps badge at 99+ when unread > 99', () => {
        toggleButtonVisibleSignal.value = true;
        unreadCountSignal.value = 120;
        render(h(ToggleButton, {}));
        expect(screen.getByLabelText('120 mensajes no leídos').textContent).toBe('99+');
    });

    it('hides badge when unread is 0', () => {
        toggleButtonVisibleSignal.value = true;
        unreadCountSignal.value = 0;
        render(h(ToggleButton, {}));
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
});
