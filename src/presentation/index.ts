// presentation/index.ts — public barrel

// ChatUIBridge is the canonical ChatUI implementation
export { ChatUIBridge as ChatUI } from './bridge/ChatUIBridge';

// Types
export type { Sender, ChatUIOptions, ChatMessageParams, ActiveInterval } from './types/chat-types';
export type { ConsentBannerConfig } from './types/consent-types';

// Utilities
export {
    formatTime,
    formatDate,
    isBot,
    generateInitials,
    createDateSeparator,
} from './utils/chat-utils';
