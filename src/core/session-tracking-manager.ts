/**
 * SessionTrackingManager - Handles session-based navigation time tracking
 * 
 * Features:
 * - Track session start/end events
 * - Monitor page visibility changes (tab switching)
 * - Periodic heartbeat for active sessions
 * - Only count active tab time (not background tabs)
 */

import { v4 as uuidv4 } from 'uuid';

export interface SessionTrackingConfig {
	enabled: boolean;
	heartbeatInterval: number; // milliseconds, default 30000 (30 seconds)
	trackBackgroundTime: boolean; // default false - only count active tab time
}

export interface SessionData {
	sessionId: string;
	startTime: number;
	lastActiveTime: number;
	totalActiveTime: number;
	isActive: boolean;
	tabId: string;
}

export class SessionTrackingManager {
	private config: SessionTrackingConfig;
	private trackCallback: (params: Record<string, unknown>) => void;
	private sessionData: SessionData | null = null;
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private isTabVisible: boolean = true;
	private sessionStartTime: number = 0;

	constructor(
		trackCallback: (params: Record<string, unknown>) => void,
		config: Partial<SessionTrackingConfig> = {}
	) {
		this.trackCallback = trackCallback;
		this.config = {
			enabled: true,
			heartbeatInterval: 30000, // 30 seconds
			trackBackgroundTime: false,
			...config
		};

		// Validate browser API availability
		if (typeof document === 'undefined') {
			console.warn('[SessionTrackingManager] Document not available - session tracking disabled');
			this.config.enabled = false;
			return;
		}

		if (typeof window === 'undefined') {
			console.warn('[SessionTrackingManager] Window not available - session tracking disabled');
			this.config.enabled = false;
			return;
		}

		// Check Page Visibility API support
		if (typeof document.hidden === 'undefined') {
			console.warn('[SessionTrackingManager] Page Visibility API not supported');
		}

		this.isTabVisible = !document.hidden;
		this.bindEventListeners();
	}

	/**
	 * Start session tracking
	 */
	public startSessionTracking(): void {
		if (!this.config.enabled) return;

		const sessionId = this.generateSessionId();
		const now = Date.now();
		
		this.sessionData = {
			sessionId,
			startTime: now,
			lastActiveTime: now,
			totalActiveTime: 0,
			isActive: this.isTabVisible,
			tabId: this.generateTabId()
		};

		this.sessionStartTime = now;

		// Track session start event
		this.trackCallback({
			event: 'session_start',
			sessionId,
			tabId: this.sessionData.tabId,
			timestamp: now,
			isVisible: this.isTabVisible
		});

		// Start heartbeat if tab is visible
		if (this.isTabVisible) {
			this.startHeartbeat();
		}
	}

	/**
	 * End session tracking
	 */
	public endSessionTracking(): void {
		if (!this.sessionData) return;

		this.stopHeartbeat();
		this.updateActiveTime();

		const sessionEndTime = Date.now();
		const totalSessionTime = sessionEndTime - this.sessionData.startTime;

		// Track session end event
		this.trackCallback({
			event: 'session_end',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			startTime: this.sessionData.startTime,
			endTime: sessionEndTime,
			totalSessionTime,
			totalActiveTime: this.sessionData.totalActiveTime,
			timestamp: sessionEndTime
		});

		this.sessionData = null;
	}

	/**
	 * Handle page visibility changes
	 */
	private handleVisibilityChange = (): void => {
		if (!this.sessionData) return;

		const wasVisible = this.isTabVisible;
		this.isTabVisible = !document.hidden;
		const now = Date.now();

		// Update active time when becoming hidden
		if (wasVisible && !this.isTabVisible) {
			this.updateActiveTime();
			this.stopHeartbeat();
		}

		// Start heartbeat when becoming visible
		if (!wasVisible && this.isTabVisible) {
			this.sessionData.lastActiveTime = now;
			this.startHeartbeat();
		}

		// Track visibility change event
		this.trackCallback({
			event: 'page_visibility_change',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			isVisible: this.isTabVisible,
			wasVisible,
			timestamp: now,
			activeTimeBeforeChange: this.sessionData.totalActiveTime
		});

		this.sessionData.isActive = this.isTabVisible;
	};

	/**
	 * Handle before unload (page/tab closing)
	 */
	private handleBeforeUnload = (): void => {
		this.endSessionTracking();
	};

	/**
	 * Send periodic heartbeat for active sessions
	 */
	private sendHeartbeat = (): void => {
		if (!this.sessionData || !this.isTabVisible) return;

		this.updateActiveTime();

		this.trackCallback({
			event: 'session_heartbeat',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			timestamp: Date.now(),
			totalActiveTime: this.sessionData.totalActiveTime,
			isActive: true
		});
	};

	/**
	 * Update the total active time
	 */
	private updateActiveTime(): void {
		if (!this.sessionData || !this.isTabVisible) return;

		const now = Date.now();
		const timeSinceLastActive = now - this.sessionData.lastActiveTime;
		this.sessionData.totalActiveTime += timeSinceLastActive;
		this.sessionData.lastActiveTime = now;
	}

	/**
	 * Start heartbeat timer
	 */
	private startHeartbeat(): void {
		if (this.heartbeatTimer) return;

		this.heartbeatTimer = setInterval(this.sendHeartbeat, this.config.heartbeatInterval);
	}

	/**
	 * Stop heartbeat timer
	 */
	private stopHeartbeat(): void {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	/**
	 * Bind browser event listeners
	 */
	private bindEventListeners(): void {
		// Page Visibility API
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		
		// Handle page unload
		window.addEventListener('beforeunload', this.handleBeforeUnload);
		
		// Additional focus/blur events for better coverage
		window.addEventListener('focus', () => {
			if (!document.hidden) {
				this.handleVisibilityChange();
			}
		});
		
		window.addEventListener('blur', () => {
			if (document.hidden) {
				this.handleVisibilityChange();
			}
		});
	}

	/**
	 * Remove event listeners
	 */
	public cleanup(): void {
		document.removeEventListener('visibilitychange', this.handleVisibilityChange);
		window.removeEventListener('beforeunload', this.handleBeforeUnload);
		window.removeEventListener('focus', this.handleVisibilityChange);
		window.removeEventListener('blur', this.handleVisibilityChange);
		
		this.stopHeartbeat();
		
		if (this.sessionData) {
			this.endSessionTracking();
		}
	}

	/**
	 * Get current session data
	 */
	public getCurrentSession(): SessionData | null {
		return this.sessionData;
	}

	/**
	 * Update configuration
	 */
	public updateConfig(newConfig: Partial<SessionTrackingConfig>): void {
		this.config = { ...this.config, ...newConfig };
		
		// Restart heartbeat with new interval if changed
		if (newConfig.heartbeatInterval && this.heartbeatTimer) {
			this.stopHeartbeat();
			if (this.isTabVisible && this.sessionData) {
				this.startHeartbeat();
			}
		}
	}

	/**
	 * Generate unique session ID
	 */
	private generateSessionId(): string {
		return `session_${Date.now()}_${uuidv4().substr(0, 8)}`;
	}

	/**
	 * Generate unique tab ID
	 */
	private generateTabId(): string {
		return `tab_${Date.now()}_${uuidv4().substr(0, 8)}`;
	}
}