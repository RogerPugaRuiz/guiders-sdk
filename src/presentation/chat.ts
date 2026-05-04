// presentation/chat.ts — compatibility shim
// ChatUI is now ChatUIBridge. All consumers (SDK, tests) import from here unchanged.
// Patch #18: re-export from the canonical barrel to avoid drift between the two files.
export { ChatUI } from './index';
export type { Sender, ChatUIOptions, ChatMessageParams, ActiveInterval } from './index';
export {
    formatTime,
    formatDate,
    isBot,
    generateInitials,
    createDateSeparator,
} from './index';
