/**
 * SessionTrackingManager - Advanced session tracking with Intercom-like features
 * 
 * Core Features:
 * - Track session start/end events with precision
 * - Monitor page visibility changes (tab switching)
 * - Intelligent heartbeat system based on user activity
 * - Real user activity detection (mouse, keyboard, touch, scroll)
 * - Cross-tab session synchronization using BroadcastChannel
 * - Only count active tab time (not background tabs)
 * - Automatic session timeout after real inactivity
 * - Debug mode for development
 * - Cross-URL session persistence within same browser tab
 * - Force session termination for logout scenarios
 * - Reliable session_end tracking using navigator.sendBeacon
 * - Session pause/resume on visibility changes
 * 
 * Advanced Features (Intercom-like):
 * - Debounced activity detection to prevent spam
 * - Smart heartbeat that only sends when user is actually active
 * - Cross-tab communication to avoid duplicate session tracking
 * - Main tab election for coordinated session management
 * - Activity window-based heartbeat filtering
 * - Real-time activity synchronization across tabs
 * 
 * Events:
 * - session_start: When session begins
 * - session_end: When session ends (with detailed reason)
 * - session_pause: When tab becomes hidden (if recently active)
 * - session_resume: When tab becomes visible again
 * - session_heartbeat: Periodic activity confirmation (smart filtering)
 * - session_timeout: When session ends due to real inactivity
 * - session_force_end: When session is manually terminated
 * - page_visibility_change: Tab visibility state changes
 * 
 * Activity Detection:
 * - mousedown, mousemove, keypress, scroll, touchstart, click
 * - Debounced to prevent excessive events
 * - Cross-tab activity synchronization
 * - Smart timeout based on actual user interaction
 * 
 * Beacon Features:
 * - Uses navigator.sendBeacon for reliable data transmission during page unload
 * - Configurable endpoint for beacon requests
 * - Automatic fallback to regular tracking if beacon fails or unavailable
 * - Smart heartbeat delivery via beacon for better reliability
 * 
 * Cross-Tab Features:
 * - BroadcastChannel for inter-tab communication
 * - Main tab election and coordination
 * - Shared session state across tabs
 * - Coordinated session end when last tab closes
 * - Activity synchronization between tabs
 */

import { v4 as uuidv4 } from 'uuid';

export interface SessionTrackingConfig {
	enabled: boolean;
	heartbeatInterval: number; // milliseconds, default 10000 (10 seconds)
	trackBackgroundTime: boolean; // default false - only count active tab time
	maxInactivityTime: number; // milliseconds, default 60000 (1 minute) - max time without user activity
	enableAutoTimeout: boolean; // default true - enable automatic session timeout
	enableCrossTabSync: boolean; // default true - sync sessions across tabs with BroadcastChannel
	debugMode: boolean; // default false - enable debug logging
	beaconEndpoint: string; // endpoint for sendBeacon requests, default '/api/track'
	activityDebounceTime: number; // milliseconds, default 1000 - debounce time for activity detection
	heartbeatActivityWindow: number; // milliseconds, default 120000 (2 minutes) - window for sending heartbeats
	enableRealActivityDetection: boolean; // default true - detect real user activity
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
	private lastHeartbeat: number = 0;
	private isMainTab: boolean = false;
	private broadcastChannel: BroadcastChannel | null = null;
	private activityDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private activityEvents: string[] = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
	private boundActivityHandler: () => void;

	constructor(
		trackCallback: (params: Record<string, unknown>) => void,
		config: Partial<SessionTrackingConfig> = {}
	) {
		this.trackCallback = trackCallback;
		this.config = {
			enabled: true,
			heartbeatInterval: 10000, // 10 seconds
			trackBackgroundTime: false,
			maxInactivityTime: 60000, // 1 minute (más agresivo como Intercom)
			enableAutoTimeout: true, // Habilitado por defecto
			enableCrossTabSync: true, // Habilitado por defecto
			debugMode: false,
			beaconEndpoint: '/api/track',
			activityDebounceTime: 1000, // 1 second
			heartbeatActivityWindow: 120000, // 2 minutes
			enableRealActivityDetection: true,
			...config
		};

		this.lastActivityTime = Date.now();
		this.lastHeartbeat = Date.now();

		// Bind activity handler
		this.boundActivityHandler = this.debounce(() => {
			this.updateUserActivity();
		}, this.config.activityDebounceTime);

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
		this.setupCrossTabCommunication();
		this.bindEventListeners();
		this.setupRealActivityDetection();
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

		// Check if this page load was likely a refresh
		const wasRefresh = this.wasLikelyRefresh();

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

		// Only track session_start if this is a new session (not a refresh or existing session)
		if (sessionInfo.isNew && !wasRefresh) {
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
				existingActiveTime: this.sessionData.totalActiveTime,
				wasRefresh
			});
			
			// Track session continuation for existing session or refresh
			this.trackCallback({
				event: 'session_continue',
				sessionId: this.sessionData.sessionId,
				tabId: this.sessionData.tabId,
				timestamp: now,
				isVisible: this.isTabVisible,
				totalActiveTime: this.sessionData.totalActiveTime,
				reason: wasRefresh ? 'page_refresh' : 'existing_session'
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
	 * Handle page visibility changes (Intercom-like approach)
	 */
	private handleVisibilityChange = (): void => {
		if (!this.sessionData) return;

		const wasVisible = this.isTabVisible;
		this.isTabVisible = !document.hidden;
		const now = Date.now();

		// Update active time when becoming hidden
		if (wasVisible && !this.isTabVisible) {
			this.pauseSession();
		}

		// Start heartbeat and inactivity timer when becoming visible
		if (!wasVisible && this.isTabVisible) {
			this.resumeSession();
		}

		// Track visibility change event
		this.trackCallback({
			event: 'page_visibility_change',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			isVisible: this.isTabVisible,
			wasVisible,
			timestamp: now,
			activeTimeBeforeChange: this.sessionData.totalActiveTime,
			isMainTab: this.isMainTab
		});

		this.sessionData.isActive = this.isTabVisible;
	};

	/**
	 * Pause session when tab becomes hidden
	 */
	private pauseSession(): void {
		if (!this.sessionData) return;

		this.updateActiveTime();
		this.stopHeartbeat();
		this.stopInactivityTimer();

		// Only send session_pause if user has been active recently
		const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
		if (timeSinceLastHeartbeat < this.config.heartbeatActivityWindow) {
			const pauseData = {
				event: 'session_pause',
				sessionId: this.sessionData.sessionId,
				tabId: this.sessionData.tabId,
				timestamp: Date.now(),
				reason: 'tab_hidden',
				totalActiveTime: this.sessionData.totalActiveTime,
				isMainTab: this.isMainTab
			};

			this.sendBeaconData(pauseData);
		}

		this.debugLog('Session paused', {
			sessionId: this.sessionData.sessionId,
			timeSinceLastHeartbeat
		});
	}

	/**
	 * Resume session when tab becomes visible
	 */
	private resumeSession(): void {
		if (!this.sessionData) return;

		const now = Date.now();
		this.sessionData.lastActiveTime = now;
		this.lastActivityTime = now; // Update activity time on resume
		
		this.startHeartbeat();
		this.startInactivityTimer();

		const resumeData = {
			event: 'session_resume',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			timestamp: now,
			isMainTab: this.isMainTab
		};

		this.trackCallback(resumeData);

		this.debugLog('Session resumed', {
			sessionId: this.sessionData.sessionId
		});
	}

	/**
	 * Handle page hide (replaces beforeunload for better tab close detection)
	 */
	private handlePageHide = (event: PageTransitionEvent): void => {
		if (!this.sessionData) return;

		const now = Date.now();
		
		// Store unload timestamp for refresh detection
		this.storeUnloadTimestamp(now);

		// Check if this is likely a refresh/navigation vs actual tab close
		const isLikelyRefresh = this.isLikelyPageRefresh(event);
		
		if (isLikelyRefresh) {
			this.debugLog('Page hide detected as likely refresh/navigation, not sending session_end');
			// Don't send session_end for refresh/navigation
			return;
		}

		// This appears to be an actual tab close
		this.debugLog('Page hide detected as likely tab close, sending session_end');

		// Notify other tabs about this tab closing
		if (this.broadcastChannel) {
			this.broadcastMessage({
				type: 'tab_closed',
				tabId: this.sessionData.tabId,
				timestamp: now,
				isMainTab: this.isMainTab
			});

			// If this is the main tab, notify others to elect new main tab
			if (this.isMainTab) {
				this.broadcastMessage({
					type: 'main_tab_closed',
					timestamp: now
				});
				sessionStorage.removeItem('guiders_main_tab');
			}
		}

		// Prepare session end data
		const sessionEndData = {
			event: 'session_end',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			timestamp: now,
			reason: 'tab_close',
			totalActiveTime: this.sessionData.totalActiveTime,
			startTime: this.sessionData.startTime,
			isMainTab: this.isMainTab
		};

		// Use sendBeacon for reliable data transmission during page unload
		this.sendBeaconData(sessionEndData);

		// Don't clear global session on tab close, only tab session
		this.endSessionTracking(false);
	};

	/**
	 * Handle before unload (fallback for browsers that don't support pagehide well)
	 */
	private handleBeforeUnload = (): void => {
		if (!this.sessionData) return;

		const now = Date.now();
		
		// Store unload timestamp for refresh detection
		this.storeUnloadTimestamp(now);

		// For beforeunload, we're more conservative and assume it's a refresh
		// The pagehide handler will handle actual tab closes
		this.debugLog('Before unload triggered, storing timestamp for refresh detection');
	};

	/**
	 * Send periodic heartbeat for active sessions (Intercom-like approach)
	 */
	private sendHeartbeat = (): void => {
		if (!this.sessionData) return;

		// Check if user has been active recently
		if (!this.shouldSendHeartbeat()) {
			this.debugLog('Skipping heartbeat - user inactive');
			return;
		}

		// Check if user is actually active (not just tab visible)
		if (!this.isUserActive()) {
			this.debugLog('User inactive for too long, ending session');
			this.handleInactivityTimeout();
			return;
		}

		this.updateActiveTime();
		this.lastHeartbeat = Date.now();

		const heartbeatData = {
			event: 'session_heartbeat',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			timestamp: this.lastHeartbeat,
			totalActiveTime: this.sessionData.totalActiveTime,
			isActive: true,
			isMainTab: this.isMainTab,
			timeSinceLastActivity: this.lastHeartbeat - this.lastActivityTime
		};

		// Send heartbeat via beacon for reliability
		this.sendBeaconData(heartbeatData);

		// Also broadcast to other tabs if this is main tab
		if (this.isMainTab && this.broadcastChannel) {
			this.broadcastMessage({
				type: 'session_heartbeat',
				...heartbeatData,
				isMainTab: true
			});
		}
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
		
		// Handle page unload - use pagehide for better tab close detection
		window.addEventListener('pagehide', this.handlePageHide);
		
		// Keep beforeunload as fallback for browsers with poor pagehide support
		window.addEventListener('beforeunload', this.handleBeforeUnload);
		
		// Additional focus/blur events for edge cases where visibilitychange might not fire
		window.addEventListener('focus', this.handleFocus);
		window.addEventListener('blur', this.handleBlur);
	}

	/**
	 * Remove event listeners and cleanup resources
	 */
	public cleanup(): void {
		// Remove visibility and unload event listeners
		document.removeEventListener('visibilitychange', this.handleVisibilityChange);
		window.removeEventListener('pagehide', this.handlePageHide);
		window.removeEventListener('beforeunload', this.handleBeforeUnload);
		window.removeEventListener('focus', this.handleFocus);
		window.removeEventListener('blur', this.handleBlur);
		
		// Remove activity event listeners
		if (this.config.enableRealActivityDetection) {
			this.activityEvents.forEach(eventType => {
				document.removeEventListener(eventType, this.boundActivityHandler);
			});
		}

		// Clean up timers
		this.stopHeartbeat();
		this.stopInactivityTimer();
		
		if (this.activityDebounceTimer) {
			clearTimeout(this.activityDebounceTimer);
			this.activityDebounceTimer = null;
		}

		// Close broadcast channel
		if (this.broadcastChannel) {
			this.broadcastChannel.close();
			this.broadcastChannel = null;
		}

		// Clear main tab marker if this was the main tab
		if (this.isMainTab) {
			sessionStorage.removeItem('guiders_main_tab');
		}
		
		// End session if active
		if (this.sessionData) {
			this.endSessionTracking();
		}

		this.debugLog('SessionTrackingManager cleanup completed');
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
	 * Get session statistics (enhanced with Intercom-like metrics)
	 */
	public getSessionStats(): any {
		if (!this.sessionData) return null;

		const now = Date.now();
		const currentActiveTime = this.isTabVisible ? 
			this.sessionData.totalActiveTime + (now - this.sessionData.lastActiveTime) : 
			this.sessionData.totalActiveTime;

		const timeSinceLastActivity = now - this.lastActivityTime;
		const timeSinceLastHeartbeat = now - this.lastHeartbeat;

		return {
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			startTime: this.sessionData.startTime,
			currentTime: now,
			totalSessionTime: now - this.sessionData.startTime,
			totalActiveTime: currentActiveTime,
			isActive: this.sessionData.isActive,
			isVisible: this.isTabVisible,
			isMainTab: this.isMainTab,
			lastActivityTime: this.lastActivityTime,
			timeSinceLastActivity: timeSinceLastActivity,
			lastHeartbeat: this.lastHeartbeat,
			timeSinceLastHeartbeat: timeSinceLastHeartbeat,
			isUserActive: this.isUserActive(),
			shouldSendHeartbeat: this.shouldSendHeartbeat(),
			inactivityTime: this.config.enableAutoTimeout ? timeSinceLastActivity : null,
			timeUntilTimeout: this.config.enableAutoTimeout ? 
				Math.max(0, this.config.maxInactivityTime - timeSinceLastActivity) : null,
			crossTabSyncEnabled: this.config.enableCrossTabSync,
			realActivityDetectionEnabled: this.config.enableRealActivityDetection,
			activityEventsCount: this.activityEvents.length
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
	 * Send data using navigator.sendBeacon for reliable transmission during page unload
	 */
	private sendBeaconData(data: Record<string, unknown>): void {
		try {
			// Check if sendBeacon is available
			if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
				// Convert data to JSON string with Content-Type header
				const jsonData = JSON.stringify(data);
				const blob = new Blob([jsonData], { type: 'application/json' });
				
				// Use configured endpoint
				const success = navigator.sendBeacon(this.config.beaconEndpoint, blob);
				
				if (this.config.debugMode) {
					this.debugLog('sendBeacon attempt', { 
						success, 
						dataSize: jsonData.length,
						event: data.event,
						endpoint: this.config.beaconEndpoint
					});
				}
				
				// If sendBeacon fails, fallback to regular tracking
				if (!success) {
					this.debugLog('sendBeacon failed, falling back to regular tracking');
					this.trackCallback(data);
				}
			} else {
				// Fallback to regular tracking if sendBeacon is not available
				this.debugLog('sendBeacon not available, using regular tracking');
				this.trackCallback(data);
			}
		} catch (error) {
			this.debugLog('Error in sendBeaconData', { error });
			// Fallback to regular tracking on error
			this.trackCallback(data);
		}
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

	/**
	 * Debounce function to limit the rate of function calls
	 */
	private debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
		let timeout: ReturnType<typeof setTimeout>;
		return function executedFunction(...args: Parameters<T>) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	/**
	 * Setup cross-tab communication using BroadcastChannel
	 */
	private setupCrossTabCommunication(): void {
		if (!this.config.enableCrossTabSync) return;

		try {
			// Check if BroadcastChannel is available
			if (typeof BroadcastChannel === 'undefined') {
				this.debugLog('BroadcastChannel not available, cross-tab sync disabled');
				return;
			}

			this.broadcastChannel = new BroadcastChannel('guiders_session_tracking');
			
			// Determine if this is the main tab
			this.isMainTab = !sessionStorage.getItem('guiders_main_tab');
			if (this.isMainTab) {
				sessionStorage.setItem('guiders_main_tab', 'true');
				this.debugLog('This tab is now the main tab');
			}

			// Listen for messages from other tabs
			this.broadcastChannel.addEventListener('message', (event) => {
				this.handleCrossTabMessage(event.data);
			});

			// Notify other tabs about this tab
			this.broadcastMessage({
				type: 'tab_opened',
				tabId: this.generateTabId(),
				timestamp: Date.now()
			});

		} catch (error) {
			this.debugLog('Error setting up cross-tab communication', { error });
		}
	}

	/**
	 * Handle messages from other tabs
	 */
	private handleCrossTabMessage(data: any): void {
		switch (data.type) {
			case 'tab_opened':
				this.debugLog('New tab opened', { tabId: data.tabId });
				break;
				
			case 'tab_closed':
				this.debugLog('Tab closed', { tabId: data.tabId });
				this.checkIfLastTab();
				break;
				
			case 'session_heartbeat':
				// Update last activity if it's from the main tab
				if (data.isMainTab && data.timestamp > this.lastActivityTime) {
					this.lastActivityTime = data.timestamp;
				}
				break;
				
			case 'main_tab_closed':
				// Become main tab if current main tab closed
				if (!this.isMainTab) {
					this.becomeMainTab();
				}
				break;
		}
	}

	/**
	 * Broadcast message to other tabs
	 */
	private broadcastMessage(data: any): void {
		if (this.broadcastChannel) {
			try {
				this.broadcastChannel.postMessage(data);
			} catch (error) {
				this.debugLog('Error broadcasting message', { error });
			}
		}
	}

	/**
	 * Check if this is the last remaining tab
	 */
	private checkIfLastTab(): void {
		setTimeout(() => {
			if (!document.hidden && this.sessionData) {
				this.debugLog('Checking if last tab - sending session end');
				this.sendSessionEndEvent('last_tab_check');
			}
		}, 100);
	}

	/**
	 * Become the main tab
	 */
	private becomeMainTab(): void {
		this.isMainTab = true;
		sessionStorage.setItem('guiders_main_tab', 'true');
		this.debugLog('Became main tab');
	}

	/**
	 * Setup real user activity detection
	 */
	private setupRealActivityDetection(): void {
		if (!this.config.enableRealActivityDetection) return;

		this.activityEvents.forEach(eventType => {
			document.addEventListener(eventType, this.boundActivityHandler, { 
				passive: true,
				capture: false
			});
		});

		this.debugLog('Real activity detection setup complete', { 
			events: this.activityEvents 
		});
	}

	/**
	 * Update user activity timestamp
	 */
	private updateUserActivity(): void {
		const now = Date.now();
		this.lastActivityTime = now;
		
		if (this.sessionData) {
			this.sessionData.lastActiveTime = now;
		}

		this.debugLog('User activity detected', { timestamp: now });

		// Broadcast activity to other tabs if this is main tab
		if (this.isMainTab && this.broadcastChannel) {
			this.broadcastMessage({
				type: 'user_activity',
				timestamp: now,
				tabId: this.sessionData?.tabId
			});
		}

		// Reset inactivity timer
		if (this.config.enableAutoTimeout) {
			this.startInactivityTimer();
		}
	}

	/**
	 * Check if user has been active recently
	 */
	private isUserActive(): boolean {
		const timeSinceActivity = Date.now() - this.lastActivityTime;
		return timeSinceActivity < this.config.maxInactivityTime;
	}

	/**
	 * Check if should send heartbeat based on recent activity
	 */
	private shouldSendHeartbeat(): boolean {
		const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
		const timeSinceActivity = Date.now() - this.lastActivityTime;
		
		return !!(
			this.isTabVisible && 
			this.sessionData && 
			timeSinceActivity < this.config.heartbeatActivityWindow
		);
	}

	/**
	 * Send session end event with specified reason
	 */
	private sendSessionEndEvent(reason: string): void {
		if (!this.sessionData) return;

		const sessionEndData = {
			event: 'session_end',
			sessionId: this.sessionData.sessionId,
			tabId: this.sessionData.tabId,
			timestamp: Date.now(),
			reason: reason,
			totalActiveTime: this.sessionData.totalActiveTime,
			startTime: this.sessionData.startTime,
			isMainTab: this.isMainTab
		};

		this.sendBeaconData(sessionEndData);
	}

	/**
	 * Store unload timestamp for refresh detection
	 */
	private storeUnloadTimestamp(timestamp: number): void {
		try {
			sessionStorage.setItem('guiders_unload_timestamp', timestamp.toString());
		} catch (error) {
			this.debugLog('Error storing unload timestamp', { error });
		}
	}

	/**
	 * Check if the current page load was likely a refresh based on timing
	 */
	private wasLikelyRefresh(): boolean {
		try {
			const unloadTimestamp = sessionStorage.getItem('guiders_unload_timestamp');
			if (!unloadTimestamp) return false;

			const now = Date.now();
			const timeSinceUnload = now - parseInt(unloadTimestamp, 10);
			
			// If less than 2 seconds since unload, it's likely a refresh
			const isRefresh = timeSinceUnload < 2000;
			
			this.debugLog('Refresh detection', { 
				unloadTimestamp: parseInt(unloadTimestamp, 10),
				currentTime: now,
				timeSinceUnload,
				isRefresh
			});

			// Clean up the timestamp after checking
			sessionStorage.removeItem('guiders_unload_timestamp');
			
			return isRefresh;
		} catch (error) {
			this.debugLog('Error checking refresh status', { error });
			return false;
		}
	}

	/**
	 * Determine if page hide event is likely a refresh/navigation vs tab close
	 */
	private isLikelyPageRefresh(event: PageTransitionEvent): boolean {
		// Check if page is being persisted (back/forward cache)
		if (event.persisted) {
			this.debugLog('Page hide with persisted=true, likely navigation');
			return true;
		}

		// Additional heuristics could be added here:
		// - Check if navigation API indicates a reload
		// - Check performance.navigation.type (though deprecated)
		// - Use timing analysis
		
		// For now, we rely primarily on the timing check during startup
		// and the persisted property. If neither indicates a refresh,
		// we assume it's a tab close.
		return false;
	}
}