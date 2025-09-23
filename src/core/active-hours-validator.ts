import { ActiveHoursConfig, TimeRange } from '../types';

/**
 * 🔍 Active Hours Validator
 * Valida si el chat debe estar activo según los rangos horarios configurados
 */
export class ActiveHoursValidator {
	private config: ActiveHoursConfig;

	constructor(config: ActiveHoursConfig) {
		this.config = config;
	}

	/**
	 * Verifica si el chat debe estar activo en el momento actual
	 */
	  private getEffectiveTimezone(): string {
    // Si timezone es 'auto', detectar automáticamente la zona horaria del navegador
    if (this.config.timezone === 'auto') {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        console.warn('❌ [ActiveHoursValidator] No se pudo detectar timezone automáticamente, usando UTC:', error);
        return 'UTC';
      }
    }
    // Si no hay timezone definido, detectar automáticamente
    if (!this.config.timezone) {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        console.warn('❌ [ActiveHoursValidator] No se pudo detectar timezone automáticamente, usando UTC:', error);
        return 'UTC';
      }
    }
    return this.config.timezone;
  }

  public isChatActive(): boolean {
		if (!this.config.enabled) {
			return true; // Si no está habilitado, el chat siempre está activo
		}

		if (!this.config.ranges || this.config.ranges.length === 0) {
			console.warn('[ActiveHoursValidator] ❌ No hay rangos de horarios configurados');
			return true; // Por defecto activo si no hay configuración
		}

		const now = this.getCurrentTime();
		
		// Verificar si la hora actual está dentro de algún rango
		return this.config.ranges.some(range => this.isTimeInRange(now, range));
	}

	/**
	 * Obtiene la hora actual en la zona horaria configurada
	 */
	private getCurrentTime(): Date {
		const now = new Date();
		const effectiveTimezone = this.getEffectiveTimezone();
		
		try {
			// Crear una fecha en la zona horaria específica
			const timeString = now.toLocaleString('en-US', { 
				timeZone: effectiveTimezone,
				hour12: false,
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
			return new Date(timeString);
		} catch (error) {
			console.warn('[ActiveHoursValidator] ❌ Zona horaria inválida:', effectiveTimezone, error);
		}
		
		return now; // Usar hora local por defecto
	}

	/**
	 * Verifica si una hora específica está dentro de un rango
	 */
	private isTimeInRange(currentTime: Date, range: TimeRange): boolean {
		try {
			const currentMinutes = this.timeToMinutes(currentTime);
			const startMinutes = this.parseTimeString(range.start);
			const endMinutes = this.parseTimeString(range.end);

			// Manejar rangos que cruzan medianoche (ej: 22:00 - 06:00)
			if (startMinutes > endMinutes) {
				return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
			}
			
			// Rango normal dentro del mismo día
			return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
		} catch (error) {
			console.warn('[ActiveHoursValidator] ❌ Error validando rango:', range, error);
			return true; // En caso de error, permitir actividad
		}
	}

	/**
	 * Convierte una hora "HH:MM" a minutos desde medianoche
	 */
	private parseTimeString(timeStr: string): number {
		const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
		if (!match) {
			throw new Error(`Formato de hora inválido: ${timeStr}. Use formato HH:MM`);
		}

		const hours = parseInt(match[1], 10);
		const minutes = parseInt(match[2], 10);

		if (hours < 0 || hours > 23) {
			throw new Error(`Hora inválida: ${hours}. Debe estar entre 0-23`);
		}

		if (minutes < 0 || minutes > 59) {
			throw new Error(`Minutos inválidos: ${minutes}. Debe estar entre 0-59`);
		}

		return hours * 60 + minutes;
	}

	/**
	 * Convierte un objeto Date a minutos desde medianoche
	 */
	private timeToMinutes(date: Date): number {
		return date.getHours() * 60 + date.getMinutes();
	}

	/**
	 * Obtiene el mensaje de fallback cuando el chat no está activo
	 */
	public getFallbackMessage(): string {
		return this.config.fallbackMessage || 
			'El chat no está disponible en este momento. Por favor, inténtalo más tarde.';
	}

	/**
	 * Obtiene información sobre el próximo horario disponible
	 */
	public getNextAvailableTime(): string | null {
		if (!this.config.enabled || !this.config.ranges.length) {
			return null;
		}

		const now = this.getCurrentTime();
		const currentMinutes = this.timeToMinutes(now);
		
		// Buscar el próximo horario de inicio
		let nextStart: number | null = null;
		
		for (const range of this.config.ranges) {
			try {
				const startMinutes = this.parseTimeString(range.start);
				
				// Si el horario es hoy y aún no ha empezado
				if (startMinutes > currentMinutes) {
					if (nextStart === null || startMinutes < nextStart) {
						nextStart = startMinutes;
					}
				}
				// Si no hay horario hoy, usar el primer horario de mañana
				else if (nextStart === null) {
					nextStart = startMinutes; // Para mañana
				}
			} catch (error) {
				console.warn('[ActiveHoursValidator] ❌ Error procesando rango:', range, error);
			}
		}

		if (nextStart !== null) {
			const hours = Math.floor(nextStart / 60);
			const minutes = nextStart % 60;
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		}

		return null;
	}

	/**
	 * Obtiene la configuración actual
	 */
	public getConfig(): ActiveHoursConfig {
		return { ...this.config };
	}

	/**
	 * Valida la configuración de horarios activos
	 */
	public static validateConfig(config: ActiveHoursConfig): string[] {
		const errors: string[] = [];

		if (config.enabled) {
			if (!config.ranges || !Array.isArray(config.ranges)) {
				errors.push('Se requiere un array de rangos horarios cuando activeHours está habilitado');
			} else if (config.ranges.length === 0) {
				errors.push('Se requiere al menos un rango horario');
			} else {
				// Validar cada rango
				config.ranges.forEach((range, index) => {
					if (!range.start || !range.end) {
						errors.push(`Rango ${index + 1}: Se requieren propiedades 'start' y 'end'`);
						return;
					}

					try {
						const validator = new ActiveHoursValidator({ enabled: true, ranges: [] });
						validator.parseTimeString(range.start);
						validator.parseTimeString(range.end);
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						errors.push(`Rango ${index + 1}: ${message}`);
					}
				});
			}

			// Validar zona horaria si está presente
			if (config.timezone) {
				try {
					new Date().toLocaleString('en-US', { timeZone: config.timezone });
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					errors.push(`Zona horaria inválida: ${config.timezone} - ${message}`);
				}
			}
		}

		return errors;
	}
}

/**
 * Función de utilidad para crear una configuración de horarios activos
 */
export function createActiveHoursConfig(
	ranges: { start: string; end: string }[],
	options: {
		timezone?: string;
		fallbackMessage?: string;
	} = {}
): ActiveHoursConfig {
	return {
		enabled: true,
		ranges,
		timezone: options.timezone,
		fallbackMessage: options.fallbackMessage
	};
}

/**
 * Configuraciones predefinidas comunes
 */
export const COMMON_ACTIVE_HOURS = {
	BUSINESS_HOURS: createActiveHoursConfig([
		{ start: '09:00', end: '18:00' }
	]),
	
	SPLIT_SCHEDULE: createActiveHoursConfig([
		{ start: '08:00', end: '14:00' },
		{ start: '15:00', end: '17:00' }
	]),
	
	EXTENDED_HOURS: createActiveHoursConfig([
		{ start: '07:00', end: '22:00' }
	]),
	
	NIGHT_SHIFT: createActiveHoursConfig([
		{ start: '22:00', end: '06:00' }
	])
};