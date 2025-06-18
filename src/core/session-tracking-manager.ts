import { v4 as uuidv4 } from 'uuid';

export interface SessionTrackingConfig {
	enabled: boolean;
	heartbeatInterval: number; // milliseconds, default 30000 (30 seconds)
	maxInactivityTime: number; // milliseconds, default 60000 (1 minute) - max time without user activity
}

export interface SessionData {
	sessionId: string; // Session ID (único por sesión)
	startTime: number;
	lastActiveTime: number;
	totalActiveTime: number;
	isActive: boolean;
	isIdle: boolean;
	isNew?: boolean; // Indica si es una sesión nueva
}

export class SessionTrackingManager {
	private config: SessionTrackingConfig;
	private trackCallback: (params: Record<string, unknown>) => void;
	private sessionData: SessionData | null = null;
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

	constructor(
		trackCallback: (params: Record<string, unknown>) => void,
		config: Partial<SessionTrackingConfig> = {}
	) {
		this.trackCallback = trackCallback;
		this.config = {
			enabled: true,
			heartbeatInterval: 10000, // 10 seconds
			maxInactivityTime: 60000, // 1 minute (más agresivo como Intercom)
			...config
		};


		if (this.config.enabled) {
			this.startSession();
		}
	}

	public startSession() {
		this.sessionData = sessionStorage.getItem('guiders_session')
			? JSON.parse(sessionStorage.getItem('guiders_session') as string)
			: {
				sessionId: uuidv4(),
				startTime: Date.now(),
				lastActiveTime: Date.now(),
				totalActiveTime: 0,
				isActive: true,
				isIdle: false,
				isNew: true
			};

		if (this.sessionData && this.sessionData.isNew) {
			this.trackCallback({
				event: 'session_start',
				sessionId: this.sessionData.sessionId,
				startTime: this.sessionData.startTime,
				isNew: this.sessionData.isNew
			});

			this.sessionData.isNew = false; // Marcar como no nueva después del primer inicio
		}
		
		this.saveSessionData();

	}

	public endSession() {
		if (this.sessionData) {
			this.sessionData.isActive = false;
			this.sessionData.totalActiveTime += Date.now() - this.sessionData.lastActiveTime;
			this.trackCallback({
				event: 'session_end',
				sessionId: this.sessionData.sessionId,
				totalActiveTime: this.sessionData.totalActiveTime
			});
			sessionStorage.removeItem('guiders_session');
		}
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	private saveSessionData() {
		if (this.sessionData) {
			sessionStorage.setItem('guiders_session', JSON.stringify(this.sessionData));
		}
	}

	public getCurrentSession(): SessionData | null {
		return this.sessionData;
	}
}