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

	/**
	 * Constructor del SessionTrackingManager
	 * @param trackCallback Función a la que se envían los eventos de sesión
	 * @param config Configuración opcional para el tracking de sesión
	 */
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
			this.registerActivityListeners();
		}
	}

	private saveSessionData() {
		if (this.sessionData) {
			sessionStorage.setItem('guiders_session', JSON.stringify(this.sessionData));
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
				startTime: this.sessionData.startTime,
				isNew: this.sessionData.isNew
			});

			this.sessionData.isNew = false; // Marcar como no nueva después del primer inicio
		}
		
		this.saveSessionData();
		this.initializeHeartbeat();

	}

	/**
	 * Finaliza la sesión actual, detiene todos los timers y listeners, y envía el evento session_end
	 */
	public endSession() {
		if (this.sessionData) {
			// Solo actualizar el tiempo total si la sesión estaba activa y no en idle
			if (this.sessionData.isActive && !this.sessionData.isIdle) {
				this.sessionData.totalActiveTime += Date.now() - this.sessionData.lastActiveTime;
			}
			
			this.sessionData.isActive = false;
			this.sessionData.isIdle = false;
			
			// Enviar evento de fin de sesión
			this.trackCallback({
				event: 'session_end',
				endTime: Date.now(),
				startTime: this.sessionData.startTime,
				totalActiveTime: this.sessionData.totalActiveTime,
				totalSessionTime: Date.now() - this.sessionData.startTime
			});
			
			// Eliminar datos de la sesión
			sessionStorage.removeItem('guiders_session');
			this.sessionData = null;
		}
		
		// Limpiar timers y listeners
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
		
		// Remover los event listeners
		this.removeActivityListeners();
		
		// Limpiar el timeout de throttle si existe
		if (this._throttleTimeout) {
			clearTimeout(this._throttleTimeout);
			this._throttleTimeout = null;
		}
	}

	/**
	 * Actualiza la información de actividad de la sesión actual
	 * - Actualiza el tiempo de última actividad y tiempo total activo
	 * - Reactiva la sesión si estaba inactiva o en idle
	 * - Registra la transición de estado idle->active si corresponde
	 * - Envía eventos adecuados según los cambios de estado
	 * - Guarda los cambios en sessionStorage
	 * 
	 * @param forceActive Si es true, fuerza el estado activo y envía eventos aunque no haya cambios de estado
	 * @returns La sesión actualizada o null si no hay sesión
	 */
	public updateActivity(forceActive: boolean = false): SessionData | null {
		if (!this.sessionData) {
			return null;
		}

		const now = Date.now();
		const wasIdle = this.sessionData.isIdle;
		const wasInactive = !this.sessionData.isActive;
		const previousLastActiveTime = this.sessionData.lastActiveTime;

		// Actualizar tiempo de actividad si la sesión estaba activa
		if (this.sessionData.isActive && !this.sessionData.isIdle) {
			// Calcular el tiempo activo desde la última actualización
			const activeTimeSinceLastUpdate = now - this.sessionData.lastActiveTime;
			this.sessionData.totalActiveTime += activeTimeSinceLastUpdate;
		}

		// Actualizar estado de la sesión
		this.sessionData.lastActiveTime = now;
		this.sessionData.isActive = true;
		
		// Si estaba en idle o se fuerza el estado activo, registrar la reactivación
		if (wasIdle || forceActive) {
			this.sessionData.isIdle = false;
			
			// Enviar evento de reactivación
			this.trackCallback({
				event: 'user_resume',
				resumeTime: now,
				previousIdleTime: wasIdle ? (now - previousLastActiveTime) : 0,
				totalActiveTime: this.sessionData.totalActiveTime
			});
		}
		
		// Si estaba inactiva (no solo idle sino completamente inactiva), registrar la reactivación
		if (wasInactive) {
			this.trackCallback({
				event: 'session_reactivate',
				reactivateTime: now,
				totalActiveTime: this.sessionData.totalActiveTime
			});
		}

		// Guardar los cambios
		this.saveSessionData();
		
		return this.sessionData;
	}

	/**
	 * Obtiene la información de la sesión actual
	 * @returns La información de la sesión actual o null si no hay sesión
	 */
	public getCurrentSession(): SessionData | null {
		return this.sessionData;
	}

	private initializeHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
		}
		this.heartbeatTimer = setInterval(() => {
			this.checkUserActivity();
		}, this.config.heartbeatInterval);
	}

	/**
	 * Verifica si el usuario ha estado inactivo más tiempo que el configurado en maxInactivityTime.
	 * Si es así, marca la sesión como 'idle' y emite un evento 'user_idle'.
	 */
	public checkUserActivity(): void {
		if (!this.sessionData || !this.sessionData.isActive) {
			return;
		}

		const now = Date.now();
		const timeSinceLastActivity = now - this.sessionData.lastActiveTime;

		// Si ha estado inactivo más tiempo que el máximo configurado y no está ya marcado como idle
		if (timeSinceLastActivity > this.config.maxInactivityTime && !this.sessionData.isIdle) {
			// Marcar como idle
			this.sessionData.isIdle = true;

			// Calcular tiempo activo antes del idle
			const activeTimeSinceLastUpdate = this.config.maxInactivityTime;
			this.sessionData.totalActiveTime += activeTimeSinceLastUpdate;

			// Enviar evento de idle
			this.trackCallback({
				event: 'user_idle',
				sessionId: this.sessionData.sessionId,
				idleStartTime: now,
				lastActiveTime: this.sessionData.lastActiveTime,
				totalActiveTime: this.sessionData.totalActiveTime
			});

			// Guardar cambios
			this.saveSessionData();
		}
	}

	/**
	 * Registra los eventos del navegador para detectar actividad del usuario.
	 * Se llama al inicializar la instancia de SessionTrackingManager.
	 */
	public registerActivityListeners(): void {
		if (typeof window === 'undefined') return;

		// Eventos que indican actividad del usuario
		const activityEvents = [
			'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
		];

		// Handler de eventos de actividad
		const activityHandler = this.handleUserActivity.bind(this);
		
		// Registrar todos los eventos
		activityEvents.forEach(eventType => {
			window.addEventListener(eventType, activityHandler, { passive: true });
		});

		// También registrar visibilitychange para detectar cuando la página se vuelve visible/invisible
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') {
				this.updateActivity(true); // Forzar actualización al volver a la página
			} else {
				this.checkUserActivity(); // Verificar si debería marcarse como idle al salir
			}
		});
	}

	/**
	 * Elimina los event listeners de actividad del usuario
	 * Útil al destruir la instancia
	 */
	public removeActivityListeners(): void {
		if (typeof window === 'undefined') return;

		const activityEvents = [
			'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
		];

		// Handler de eventos de actividad
		const activityHandler = this.handleUserActivity.bind(this);
		
		// Remover todos los eventos
		activityEvents.forEach(eventType => {
			window.removeEventListener(eventType, activityHandler);
		});

		// Remover visibilitychange
		document.removeEventListener('visibilitychange', () => {});
	}

	/**
	 * Maneja eventos de actividad del usuario
	 * @param event El evento DOM que desencadenó la actividad
	 */
	private handleUserActivity(event: Event): void {
		// Throttle para evitar múltiples actualizaciones en poco tiempo
		if (this._throttleTimeout) {
			return;
		}

		this._throttleTimeout = setTimeout(() => {
			this._throttleTimeout = null;
		}, 1000); // Throttle de 1 segundo

		this.updateActivity();
	}

	// Variable para controlar el throttling de eventos
	private _throttleTimeout: ReturnType<typeof setTimeout> | null = null;
}