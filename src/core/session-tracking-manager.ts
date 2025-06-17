/**
 * SessionTrackingManager - Handles session-based navigation time tracking
 * 
 * Features:
 * - Track session start/end events
 * - Monitor page visibility changes (tab switching)
 * - Periodic heartbeat for active sessions
 * - Only count active tab time (not background tabs)
 * - Automatic session timeout after inactivity
 * - Debug mode for development
 * - Cross-URL session persistence within same browser tab
 * - Force session termination for logout scenarios
 * 
 * New Events:
 * - session_timeout: When session ends due to inactivity
 * - session_force_end: When session is manually terminated
 */

import { v4 as uuidv4 } from 'uuid';

export interface SessionTrackingConfig {
	enabled: boolean;
	heartbeatInterval: number; // milliseconds, default 30000 (30 seconds)
	trackBackgroundTime: boolean; // default false - only count active tab time
	maxInactivityTime: number; // milliseconds, default 30 minutes - auto-end session after inactivity
	enableAutoTimeout: boolean; // default false - enable automatic session timeout
	enableCrossTabSync: boolean; // default false - sync sessions across tabs (future feature)
	debugMode: boolean; // default false - enable debug logging
}

export interface SessionData {
	sessionId: string; // Session ID (único por sesión)
	startTime: number;
	lastActiveTime: number;
	totalActiveTime: number;
	isActive: boolean;
	tabId: string; // Tab ID (único por tab)
}

export class SessionTrackingManager {
	private config: SessionTrackingConfig;
	private trackCallback: (params: Record<string, unknown>) => void;
	private sessionData: SessionData | null = null;
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
	private isTabVisible: boolean = true;
	private sessionStartTime: number = 0;
	private lastActivityTime: number = 0;

	constructor(
		trackCallback: (params: Record<string, unknown>) => void,
		config: Partial<SessionTrackingConfig> = {}
	) {
		this.trackCallback = trackCallback;
		this.config = {
			enabled: true,
			heartbeatInterval: 30000, // 30 seconds
			trackBackgroundTime: false,
			maxInactivityTime: 30 * 60 * 1000, // 30 minutes
			enableAutoTimeout: false,
			enableCrossTabSync: false,
			debugMode: false,
			...config
		};

		this.lastActivityTime = Date.now();

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
		
		// Check if session tracking is already active
		if (this.sessionData) {
			this.debugLog('Session tracking already active', { sessionId: this.sessionData.sessionId });
			return;
		}

		// Try to restore existing session from sessionStorage
		console.debug('[SessionTrackingManager] Starting session tracking...');
		const sessionInfo = this.getOrCreateSession();
		const now = Date.now();
		
		this.sessionData = {
			sessionId: sessionInfo.sessionId,
			startTime: sessionInfo.startTime,
			lastActiveTime: now,
			totalActiveTime: sessionInfo.totalActiveTime || 0,
			isActive: this.isTabVisible,
			tabId: sessionInfo.tabId
		};

		this.sessionStartTime = sessionInfo.startTime;
		this.updateLastActivity();

		// Only track session_start if this is a new session
		if (sessionInfo.isNew) {
			this.debugLog('Starting new session', { 
				sessionId: this.sessionData.sessionId, 
				tabId: this.sessionData.tabId 
			});
			
			this.trackCallback({
				event: 'session_start',
				sessionId: this.sessionData.sessionId,
				tabId: this.sessionData.tabId,
				timestamp: this.sessionData.startTime,
				isVisible: this.isTabVisible
			});
		} else {
			this.debugLog('Continuing existing session', { 
				sessionId: this.sessionData.sessionId,
				tabId: this.sessionData.tabId,
				existingActiveTime: this.sessionData.totalActiveTime
			});
			
			// Track session continuation for existing session
			this.trackCallback({
				event: 'session_continue',
				sessionId: this.sessionData.sessionId,
				tabId: this.sessionData.tabId,
				timestamp: now,
				isVisible: this.isTabVisible,
				totalActiveTime: this.sessionData.totalActiveTime
			});
		}

		// Start heartbeat if tab is visible
		if (this.isTabVisible) {
			this.startHeartbeat();
		}

		// Start inactivity timer
		this.startInactivityTimer();
	}

	/**
	 * End session tracking
	 */
	public endSessionTracking(clearGlobalSession: boolean = false): void {
		if (!this.sessionData) return;

		this.stopHeartbeat();
		this.stopInactivityTimer();
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
			this.stopInactivityTimer();
		}

		// Start heartbeat and inactivity timer when becoming visible
		if (!wasVisible && this.isTabVisible) {
			this.sessionData.lastActiveTime = now;
			this.startHeartbeat();
			this.startInactivityTimer();
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
		// No borrar global session en refresh, solo la sesión del tab
		this.endSessionTracking(false);
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

		// Update last activity time for inactivity tracking
		this.updateLastActivity();

		// Persist updated session data to sessionStorage
		this.persistSession();
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
	 * Start inactivity timer
	 */
	private startInactivityTimer(): void {
		if (!this.config.enableAutoTimeout) return;
		
		this.stopInactivityTimer();
		this.inactivityTimer = setTimeout(() => {
			this.handleInactivityTimeout();
		}, this.config.maxInactivityTime);
		
		if (this.config.debugMode) {
			this.debugLog('Inactivity timer started', {
				maxInactivityTime: this.config.maxInactivityTime
			});
		}
	}

	/**
	 * Stop inactivity timer
	 */
	private stopInactivityTimer(): void {
		if (this.inactivityTimer) {
			clearTimeout(this.inactivityTimer);
			this.inactivityTimer = null;
			
			if (this.config.debugMode) {
				this.debugLog('Inactivity timer stopped');
			}
		}
	}

	/**
	 * Handle inactivity timeout
	 */
	private handleInactivityTimeout(): void {
		if (!this.sessionData) return;

		if (this.config.debugMode) {
			this.debugLog('Session inactivity timeout reached', {
				sessionId: this.sessionData.sessionId,
				tabId: this.sessionData.tabId,
				inactivityDuration: this.config.maxInactivityTime,
				lastActivityTime: this.lastActivityTime
			});
		}

		// Track session timeout event
		this.trackCallback({
			event: 'session_timeout',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			reason: 'inactivity',
			inactivityDuration: this.config.maxInactivityTime,
			lastActivityTime: this.lastActivityTime,
			timestamp: Date.now()
		});

		this.endSessionTracking();
	}

	/**
	 * Update last activity time and reset inactivity timer
	 */
	private updateLastActivity(): void {
		this.lastActivityTime = Date.now();
		
		if (this.config.enableAutoTimeout) {
			this.startInactivityTimer();
		}
	}

	/**
	 * Log debug information if debug mode is enabled
	 */
	private debugLog(message: string, data?: any): void {
		if (this.config.debugMode) {
			console.log(`[SessionTrackingManager] ${message}`, data || '');
		}
	}

	/**
	 * Handle window focus events
	 */
	private handleFocus = (): void => {
		// Only handle focus if visibilitychange didn't already handle it
		if (!document.hidden && !this.isTabVisible) {
			this.handleVisibilityChange();
		}
	};

	/**
	 * Handle window blur events
	 */
	private handleBlur = (): void => {
		// Only handle blur if visibilitychange didn't already handle it  
		if (document.hidden && this.isTabVisible) {
			this.handleVisibilityChange();
		}
	};

	/**
	 * Bind browser event listeners
	 */
	private bindEventListeners(): void {
		// Page Visibility API
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		
		// Handle page unload
		window.addEventListener('beforeunload', this.handleBeforeUnload);
		
		// Additional focus/blur events for edge cases where visibilitychange might not fire
		window.addEventListener('focus', this.handleFocus);
		window.addEventListener('blur', this.handleBlur);
	}

	/**
	 * Remove event listeners
	 */
	public cleanup(): void {
		document.removeEventListener('visibilitychange', this.handleVisibilityChange);
		window.removeEventListener('beforeunload', this.handleBeforeUnload);
		window.removeEventListener('focus', this.handleFocus);
		window.removeEventListener('blur', this.handleBlur);
		
		this.stopHeartbeat();
		this.stopInactivityTimer();
		
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

		// Restart inactivity timer if settings changed
		if (newConfig.enableAutoTimeout !== undefined || newConfig.maxInactivityTime) {
			this.stopInactivityTimer();
			if (this.config.enableAutoTimeout && this.sessionData) {
				this.startInactivityTimer();
			}
		}

		this.debugLog('Configuration updated', newConfig);
	}

	/**
	 * Get session statistics
	 */
	public getSessionStats(): any {
		if (!this.sessionData) return null;

		const now = Date.now();
		const currentActiveTime = this.isTabVisible ? 
			this.sessionData.totalActiveTime + (now - this.sessionData.lastActiveTime) : 
			this.sessionData.totalActiveTime;

		return {
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			startTime: this.sessionData.startTime,
			currentTime: now,
			totalSessionTime: now - this.sessionData.startTime,
			totalActiveTime: currentActiveTime,
			isActive: this.sessionData.isActive,
			isVisible: this.isTabVisible,
			lastActivityTime: this.lastActivityTime,
			inactivityTime: this.config.enableAutoTimeout ? now - this.lastActivityTime : null,
			timeUntilTimeout: this.config.enableAutoTimeout ? 
				Math.max(0, this.config.maxInactivityTime - (now - this.lastActivityTime)) : null
		};
	}

	/**
	 * Force session end (for explicit logout or user action)
	 */
	public forceSessionEnd(reason: string = 'user_action'): void {
		if (!this.sessionData) return;

		this.debugLog('Force ending session', { reason });

		// Track forced session end event
		this.trackCallback({
			event: 'session_force_end',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			reason: reason,
			timestamp: Date.now(),
			totalActiveTime: this.sessionData.totalActiveTime
		});

		// En logout sí borrar la sesión global
		this.endSessionTracking(true);
	}

	/**
	 * Get or create session using sessionStorage
	 */
	private getOrCreateSession(): { 
		sessionId: string; 
		tabId: string; 
		startTime: number; 
		totalActiveTime: number; 
		isNew: boolean 
	} {
		const STORAGE_KEY = 'guiders_session';
		
		// Check if global session already exists first
		console.log('[SessionTrackingManager] Retrieving or creating global session ID...');
		const GLOBAL_SESSION_KEY = 'guiders_global_session_id';
		let globalSessionId: string;
		let isNewGlobalSession = false;
		
		try {
			const existingGlobalSessionId = sessionStorage.getItem(GLOBAL_SESSION_KEY);
			if (existingGlobalSessionId) {
				console.log('[SessionTrackingManager] Found existing global session ID:', existingGlobalSessionId);
				globalSessionId = existingGlobalSessionId;
				isNewGlobalSession = false;
			} else {
				console.log('[SessionTrackingManager] No existing global session ID found, creating a new one...');
				globalSessionId = this.generateGlobalSessionId();
				sessionStorage.setItem(GLOBAL_SESSION_KEY, globalSessionId);
				isNewGlobalSession = true;
			}
		} catch (error) {
			console.warn('[SessionTrackingManager] Error handling global session ID:', error);
			globalSessionId = this.generateGlobalSessionId();
			isNewGlobalSession = true;
		}
		
		try {
			const existingData = sessionStorage.getItem(STORAGE_KEY);
			if (existingData) {
				const sessionInfo = JSON.parse(existingData);
				// Validate the session data
				if (sessionInfo.tabId && sessionInfo.startTime) {
					return {
						sessionId: globalSessionId,
						tabId: sessionInfo.tabId,
						startTime: sessionInfo.startTime,
						totalActiveTime: sessionInfo.totalActiveTime || 0,
						isNew: isNewGlobalSession // Only new if global session is new
					};
				}
			}
		} catch (error) {
			console.warn('[SessionTrackingManager] Error reading session from storage:', error);
		}

		// Create new session if none exists or is invalid
		const now = Date.now();
		const newSession = {
			sessionId: globalSessionId,
			tabId: this.generateTabId(),
			startTime: now,
			totalActiveTime: 0,
			isNew: isNewGlobalSession // Only new if global session is new
		};

		// Persist the new session (without sessionId since it's stored separately)
		try {
			const sessionDataToStore = {
				tabId: newSession.tabId,
				startTime: newSession.startTime,
				totalActiveTime: newSession.totalActiveTime
			};
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionDataToStore));
		} catch (error) {
			console.warn('[SessionTrackingManager] Error saving session to storage:', error);
		}

		return newSession;
	}

	/**
	 * Persist current session data to sessionStorage
	 */
	private persistSession(): void {
		if (!this.sessionData) return;

		const STORAGE_KEY = 'guiders_session';
		// Store session data without sessionId (sessionId is stored separately)
		const sessionInfo = {
			tabId: this.sessionData.tabId,
			startTime: this.sessionData.startTime,
			totalActiveTime: this.sessionData.totalActiveTime
		};

		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionInfo));
		} catch (error) {
			console.warn('[SessionTrackingManager] Error persisting session:', error);
		}
	}

	/**
	 * Clear session data from sessionStorage
	 */
	private clearSession(): void {
		const STORAGE_KEY = 'guiders_session';
		const GLOBAL_SESSION_KEY = 'guiders_global_session_id';
		try {
			sessionStorage.removeItem(STORAGE_KEY);
			sessionStorage.removeItem(GLOBAL_SESSION_KEY);
		} catch (error) {
			console.warn('[SessionTrackingManager] Error clearing session:', error);
		}
	}

	/**
	 * Clear only tab session data (preserves global session ID)
	 */
	private clearTabSession(): void {
		const STORAGE_KEY = 'guiders_session';
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.warn('[SessionTrackingManager] Error clearing tab session:', error);
		}
	}

	/**
	 * Clear global session data from sessionStorage (useful for logout)
	 */
	public clearGlobalSession(): void {
		this.clearSession();
		this.debugLog('Global session cleared from sessionStorage');
	}

	/**
	 * Get current global session ID
	 */
	public getGlobalSessionId(): string | null {
		const GLOBAL_SESSION_KEY = 'guiders_global_session_id';
		try {
			return sessionStorage.getItem(GLOBAL_SESSION_KEY);
		} catch (error) {
			console.warn('[SessionTrackingManager] Error reading global session ID:', error);
			return null;
		}
	}

	/**
	 * Generate unique global session ID (persists across tabs)
	 */
	private generateGlobalSessionId(): string {
		return `session_${Date.now()}_${uuidv4().substr(0, 8)}`;
	}

	/**
	 * Generate unique tab ID (specific to each tab)
	 */
	private generateTabId(): string {
		return `tab_${Date.now()}_${uuidv4().substr(0, 8)}`;
	}
}