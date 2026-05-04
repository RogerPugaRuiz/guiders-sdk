/**
 * Unit tests for ChatMessages component.
 */
import { h } from 'preact';
import { render, screen, cleanup } from '@testing-library/preact';
import { ChatMessages } from '../../src/presentation/components/ChatMessages/ChatMessages';
import {
    messagesSignal,
    hasMoreMessagesSignal,
    isPaginatingSignal,
    loadChatTriggerSignal,
    loadedChatIdSignal,
} from '../../src/presentation/signals/messagesState';
import {
    isLoadingInitialMessagesSignal,
} from '../../src/presentation/signals/chatState';
import { ChatMessageParams } from '../../src/presentation/types/chat-types';

// Stub IntersectionObserver (not available in JSDOM)
const observeMock = jest.fn();
const disconnectMock = jest.fn();
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: observeMock,
    disconnect: disconnectMock,
    unobserve: jest.fn(),
})) as unknown as typeof IntersectionObserver;

afterEach(() => {
    cleanup();
    messagesSignal.value = [];
    isLoadingInitialMessagesSignal.value = false;
    hasMoreMessagesSignal.value = false;
    isPaginatingSignal.value = false;
    loadChatTriggerSignal.value = 0;
    loadedChatIdSignal.value = null;
    observeMock.mockClear();
    disconnectMock.mockClear();
});

const makeMessage = (id: number, text: string, sender: 'user' | 'agent' = 'user'): ChatMessageParams => ({
    text,
    sender,
    timestamp: Date.now() + id * 1000,
});

describe('ChatMessages', () => {
    it('renders the messages container', () => {
        const { container } = render(h(ChatMessages, {}));
        expect(container.querySelector('.chat-messages')).toBeInTheDocument();
    });

    it('shows LoadingIndicator while loading initial messages', () => {
        isLoadingInitialMessagesSignal.value = true;
        const { container } = render(h(ChatMessages, {}));
        // LoadingIndicator renders inside .chat-messages when loading
        expect(container.querySelector('.chat-messages')).toBeInTheDocument();
        // Should NOT render message list
        expect(container.querySelector('.chat-pagination-sentinel')).not.toBeInTheDocument();
    });

    it('renders message text for each message', () => {
        messagesSignal.value = [
            makeMessage(1, 'Hola'),
            makeMessage(2, 'Mundo'),
        ];
        render(h(ChatMessages, {}));
        expect(screen.getByText('Hola')).toBeInTheDocument();
        expect(screen.getByText('Mundo')).toBeInTheDocument();
    });

    it('renders no message bubbles when messages array is empty', () => {
        messagesSignal.value = [];
        isLoadingInitialMessagesSignal.value = false;
        render(h(ChatMessages, {}));
        // No bubble elements expected
        expect(document.querySelectorAll('[class*="bubble"]').length).toBe(0);
    });

    it('shows pagination sentinel when hasMore is true', () => {
        hasMoreMessagesSignal.value = true;
        render(h(ChatMessages, {}));
        expect(document.querySelector('.chat-pagination-sentinel')).toBeInTheDocument();
    });

    it('hides pagination sentinel when hasMore is false', () => {
        hasMoreMessagesSignal.value = false;
        render(h(ChatMessages, {}));
        expect(document.querySelector('.chat-pagination-sentinel')).not.toBeInTheDocument();
    });

    it('attaches IntersectionObserver to sentinel when hasMore is true', () => {
        hasMoreMessagesSignal.value = true;
        render(h(ChatMessages, {}));
        expect(observeMock).toHaveBeenCalled();
    });
});
