import { PresenceService } from '../services/presence-service';
import { WebSocketService } from '../services/websocket-service';
import { PresenceConfig } from '../types/presence-types';
import { debugLog } from '../utils/debug-logger';

/** Extended config that adds SDK-level fields not present in PresenceConfig */
export interface PresenceManagerConfig extends PresenceConfig {
    showOfflineBanner: boolean;
}

/** Minimal ChatUI surface needed by PresenceManager */
export interface PresenceChatUILike {
    setPresenceService(service: PresenceService): void;
    setShowOfflineBanner?(show: boolean): void;
}

/**
 * PresenceManager — encapsulates all PresenceService lifecycle logic
 * that previously lived inline in TrackingPixelSDK.setupPresenceService().
 */
export class PresenceManager {
    private service: PresenceService | null = null;
    private readonly wsService: WebSocketService;
    private readonly config: PresenceManagerConfig;

    constructor(wsService: WebSocketService, config: PresenceManagerConfig) {
        this.wsService = wsService;
        this.config = config;
    }

    /** Returns the active PresenceService instance, if initialized. */
    getService(): PresenceService | null {
        return this.service;
    }

    /**
     * Initialises PresenceService for the given visitor and optionally wires
     * the service into a ChatUI-compatible bridge.
     *
     * Safe to call multiple times: if the service is already initialised,
     * subsequent calls will only re-wire the provided `chatUI` (idempotent setup,
     * fresh wiring) so a late-arriving ChatUI still receives the PresenceService.
     */
    setup(visitorId: string, chatUI?: PresenceChatUILike): void {
        debugLog('🟢 [PresenceManager] setup() called');

        if (!visitorId) return;

        if (!this.config.enabled) {
            debugLog('🟢 [PresenceManager] ⚠️ Presence disabled in config');
            return;
        }

        // If service already exists, just re-wire the chatUI (if provided) and return.
        if (this.service) {
            debugLog('🟢 [PresenceManager] ✅ PresenceService already initialised');
            if (chatUI) {
                this.wireChatUI(chatUI, this.service);
            }
            return;
        }

        debugLog('🟢 [PresenceManager] 🚀 Initialising PresenceService...', this.config);

        try {
            this.service = new PresenceService(this.wsService, visitorId, {
                enabled: this.config.enabled,
                pollingInterval: this.config.pollingInterval,
                showTypingIndicator: this.config.showTypingIndicator,
                typingTimeout: this.config.typingTimeout,
                typingDebounce: this.config.typingDebounce,
                heartbeatInterval: this.config.heartbeatInterval,
            });
            debugLog('🟢 [PresenceManager] ✅ PresenceService initialised');

            if (chatUI) {
                this.wireChatUI(chatUI, this.service);
            }

            // Auto-connect WebSocket so user:activity (AWAY → ONLINE) works without opening chat
            if (!this.wsService.isConnected()) {
                debugLog('📡 [PresenceManager] 🚀 Auto-connecting WebSocket for presence...');
                const sessionId = sessionStorage.getItem('guiders_backend_session_id');
                this.wsService.connect(
                    { sessionId: sessionId || undefined },
                    {
                        onConnect: () => {
                            debugLog('📡 [PresenceManager] ✅ WebSocket connected (presence)');
                            this.wsService.joinVisitorRoom(visitorId);
                        },
                        onDisconnect: (reason) => {
                            debugLog('📡 [PresenceManager] ⚠️ WebSocket disconnected (presence):', reason);
                        },
                        onError: (_error) => { /* silent */ },
                    }
                );
            }

            debugLog('🟢 [PresenceManager] ✅ Presence system fully configured');
        } catch (error) {
            debugLog('🟢 [PresenceManager] ❌ Error setting up PresenceService:', error);
        }
    }

    /**
     * Wires a ChatUI bridge to receive the PresenceService and offline-banner config.
     * `setShowOfflineBanner` is optional — guarded to avoid TypeError on bridges
     * that don't implement it.
     */
    private wireChatUI(chatUI: PresenceChatUILike, service: PresenceService): void {
        chatUI.setPresenceService(service);
        if (typeof chatUI.setShowOfflineBanner === 'function') {
            chatUI.setShowOfflineBanner(this.config.showOfflineBanner);
        } else {
            debugLog('🟢 [PresenceManager] ⚠️ ChatUI has no setShowOfflineBanner — skipping offline banner config');
        }
        debugLog('🟢 [PresenceManager] ✅ PresenceService wired into ChatUI');
    }

    /** Stops the presence heartbeat and releases the service. */
    cleanup(): void {
        if (this.service) {
            this.service.cleanup();
            this.service = null;
            debugLog('🟢 [PresenceManager] 💓 PresenceService cleaned up (heartbeat stopped)');
        }
    }
}
