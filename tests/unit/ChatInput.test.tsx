/**
 * Unit tests for ChatInput component.
 */
import { h } from 'preact';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { ChatInput } from '../../src/presentation/components/ChatInput/ChatInput';
import { sendMessageCallbackSignal } from '../../src/presentation/signals/messagesState';
import { chatIdSignal } from '../../src/presentation/signals/chatState';
import { presenceServiceSignal } from '../../src/presentation/signals/presenceState';

afterEach(() => {
    cleanup();
    sendMessageCallbackSignal.value = null;
    chatIdSignal.value = null;
    presenceServiceSignal.value = null;
});

describe('ChatInput', () => {
    it('renders the textarea', () => {
        render(h(ChatInput, {}));
        expect(screen.getByRole('textbox', { name: 'Mensaje' })).toBeInTheDocument();
    });

    it('renders the send button', () => {
        render(h(ChatInput, {}));
        expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeInTheDocument();
    });

    it('calls sendMessageCallbackSignal with textarea value on button click', () => {
        const onSend = jest.fn();
        sendMessageCallbackSignal.value = onSend;

        render(h(ChatInput, {}));
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.input(textarea, { target: { value: 'Hola mundo' } });
        // Manually set value since jsdom doesn't propagate target.value via onInput
        textarea.value = 'Hola mundo';

        fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
        expect(onSend).toHaveBeenCalledWith('Hola mundo');
    });

    it('clears the textarea after send', () => {
        sendMessageCallbackSignal.value = jest.fn();
        render(h(ChatInput, {}));
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        textarea.value = 'Test message';

        fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
        expect(textarea.value).toBe('');
    });

    it('does not call callback when message is empty', () => {
        const onSend = jest.fn();
        sendMessageCallbackSignal.value = onSend;
        render(h(ChatInput, {}));

        fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
        expect(onSend).not.toHaveBeenCalled();
    });

    it('does not call callback when no callback is registered', () => {
        sendMessageCallbackSignal.value = null;
        render(h(ChatInput, {}));
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        textarea.value = 'Something';

        // Should not throw
        expect(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
        }).not.toThrow();
    });

    it('sends message on Enter key', () => {
        const onSend = jest.fn();
        sendMessageCallbackSignal.value = onSend;
        render(h(ChatInput, {}));
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        textarea.value = 'Enter test';

        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
        expect(onSend).toHaveBeenCalledWith('Enter test');
    });

    it('does NOT send on Shift+Enter', () => {
        const onSend = jest.fn();
        sendMessageCallbackSignal.value = onSend;
        render(h(ChatInput, {}));
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        textarea.value = 'Multiline';

        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
        expect(onSend).not.toHaveBeenCalled();
    });
});
