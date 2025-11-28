/**
 * 📡 Commercial Availability Service
 *
 * Consulta la disponibilidad de comerciales en tiempo real
 * para mostrar/ocultar el chat widget dinámicamente
 */

import { debugLog } from '../utils/debug-logger';

export interface CommercialAvailabilityConfig {
	/** Dominio del sitio web */
	domain: string;
	/** API Key del sitio */
	apiKey: string;
	/** Base URL del API (default: desde endpoint manager) */
	apiBaseUrl?: string;
	/** Intervalo de polling en segundos (default: 30) */
	pollingInterval?: number;
	/** Habilitar logging de debug */
	debug?: boolean;
}

export interface AvailabilityResponse {
	/** Si hay comerciales disponibles */
	available: boolean;
	/** Número de comerciales online */
	onlineCount: number;
	/** Timestamp de la respuesta */
	timestamp: string;
	/** ID del sitio */
	siteId: string;
}

export interface AvailabilityError {
	error: string;
	status: number;
	timestamp: string;
}

/**
 * Servicio para verificar disponibilidad de comerciales
 */
export class CommercialAvailabilityService {
	private config: CommercialAvailabilityConfig;
	private pollingInterval: NodeJS.Timeout | null = null;
	private onAvailabilityChangeCallback: ((available: boolean, count: number) => void) | null = null;
	private lastAvailability: boolean | null = null;
	private lastOnlineCount: number = 0;
	private isPolling: boolean = false;
	private errorCount: number = 0;

	constructor(config: CommercialAvailabilityConfig) {
		this.config = {
			pollingInterval: 30,
			debug: false,
			...config
		};

		this.log('📡 [CommercialAvailability] Servicio inicializado', this.config);
	}

	/**
	 * Verifica si hay comerciales disponibles
	 */
	async checkAvailability(): Promise<AvailabilityResponse> {
		const endpoint = `${this.config.apiBaseUrl || ''}/v2/commercials/availability`;

		try {
			this.log('📡 [CommercialAvailability] Consultando disponibilidad...', endpoint);

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					domain: this.config.domain,
					apiKey: this.config.apiKey
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}

			const data: AvailabilityResponse = await response.json();
			this.log('📡 [CommercialAvailability] Respuesta recibida:', data);

			// Resetear contador de errores en caso de éxito
			this.errorCount = 0;

			// Notificar si cambió el estado
			if (data.available !== this.lastAvailability || data.onlineCount !== this.lastOnlineCount) {
				this.log(`📡 [CommercialAvailability] 🔄 Estado cambió: ${data.available} (${data.onlineCount} online)`);
				this.lastAvailability = data.available;
				this.lastOnlineCount = data.onlineCount;
				this.onAvailabilityChangeCallback?.(data.available, data.onlineCount);
			}

			return data;
		} catch (error) {
			this.errorCount++;

			// Si hay muchos errores consecutivos, pausar polling temporalmente
			if (this.errorCount >= 3) {
			}

			throw error;
		}
	}

	/**
	 * Registra callback para cambios de disponibilidad
	 */
	onAvailabilityChanged(callback: (available: boolean, count: number) => void): void {
		this.onAvailabilityChangeCallback = callback;
		this.log('📡 [CommercialAvailability] Callback registrado para cambios de disponibilidad');
	}

	/**
	 * Inicia polling de disponibilidad
	 */
	startPolling(): void {
		if (this.isPolling) {
			this.log('📡 [CommercialAvailability] Polling ya está activo');
			return;
		}

		this.isPolling = true;
		this.errorCount = 0;

		// Consultar inmediatamente
		this.checkAvailability().catch(err => {
		});

		// Configurar polling
		const intervalMs = (this.config.pollingInterval || 30) * 1000;
		this.pollingInterval = setInterval(async () => {
			// Si hay demasiados errores, usar backoff
			if (this.errorCount >= 3) {
				const backoffMs = Math.min(60000, intervalMs * Math.pow(2, this.errorCount - 3));
				this.log(`📡 [CommercialAvailability] Usando backoff de ${backoffMs}ms debido a errores`);
				return;
			}

			try {
				await this.checkAvailability();
			} catch (error) {
				// Error ya logueado en checkAvailability
			}
		}, intervalMs);

		this.log(`⏰ [CommercialAvailability] Polling iniciado (cada ${this.config.pollingInterval}s)`);
	}

	/**
	 * Detiene el polling
	 */
	stopPolling(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
			this.isPolling = false;
			this.log('⏹️ [CommercialAvailability] Polling detenido');
		}
	}

	/**
	 * Verifica si el polling está activo
	 */
	isPollingActive(): boolean {
		return this.isPolling;
	}

	/**
	 * Obtiene el último estado conocido
	 */
	getLastKnownState(): { available: boolean | null; onlineCount: number } {
		return {
			available: this.lastAvailability,
			onlineCount: this.lastOnlineCount
		};
	}

	/**
	 * Limpia el servicio y detiene polling
	 */
	cleanup(): void {
		this.stopPolling();
		this.onAvailabilityChangeCallback = null;
		this.lastAvailability = null;
		this.lastOnlineCount = 0;
		this.errorCount = 0;
		this.log('🧹 [CommercialAvailability] Servicio limpiado');
	}

	/**
	 * Logger interno
	 */
	private log(message: string, ...args: any[]): void {
		if (this.config.debug) {
			debugLog(message, ...args);
		}
	}
}
