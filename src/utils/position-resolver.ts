/**
 * position-resolver.ts - Utilidad para resolver posiciones del chat widget
 *
 * Responsabilidades:
 * - Detectar tipo de dispositivo (desktop/mobile)
 * - Convertir presets a coordenadas exactas
 * - Calcular posición del toggle button relativa al widget
 * - Aplicar configuraciones específicas por dispositivo
 */

import { ChatPositionConfig, ChatPositionPreset, ChatPositionCoordinates, MobileDetectionConfig, MobileDetectionMode } from '../types';
import { debugLog } from '../utils/debug-logger';

/**
 * Resultado de detección de móvil con detalles
 */
export interface MobileDetectionResult {
	isMobile: boolean;
	detectedBy: string[];
	breakpoint?: number;
	viewport?: { width: number; height: number };
}

/**
 * Configuración de posición resuelta con coordenadas exactas
 */
export interface ResolvedPosition {
	/** Coordenadas del botón toggle */
	button: {
		top?: string;
		bottom?: string;
		left?: string;
		right?: string;
	};
	/** Coordenadas del widget de chat */
	widget: {
		top?: string;
		bottom?: string;
		left?: string;
		right?: string;
	};
}

/**
 * Configuración completa con soporte para desktop/mobile
 */
export interface DeviceSpecificPosition {
	default: ChatPositionConfig;
	mobile?: ChatPositionConfig;
}

/**
 * Mapeo de presets a coordenadas
 */
const PRESET_COORDINATES: Record<ChatPositionPreset, ChatPositionCoordinates> = {
	'bottom-right': {
		bottom: '20px',
		right: '20px',
		widgetBottom: '90px',
		widgetRight: '20px'
	},
	'bottom-left': {
		bottom: '20px',
		left: '20px',
		widgetBottom: '90px',
		widgetLeft: '20px'
	},
	'top-right': {
		top: '20px',
		right: '20px',
		widgetTop: '90px',
		widgetRight: '20px'
	},
	'top-left': {
		top: '20px',
		left: '20px',
		widgetTop: '90px',
		widgetLeft: '20px'
	}
};

/**
 * Offset vertical entre el toggle button y el widget (en píxeles)
 */
const WIDGET_OFFSET = 70;

/**
 * Detecta si el dispositivo actual es móvil con múltiples métodos
 */
export function detectMobileDevice(config?: MobileDetectionConfig): MobileDetectionResult {
	const mode = config?.mode || 'auto';
	const breakpoint = config?.breakpoint || 768;
	const debug = config?.debug || false;

	const detectedBy: string[] = [];
	let isMobile = false;

	// Información del viewport
	const viewport = typeof window !== 'undefined' ? {
		width: window.innerWidth || 0,
		height: window.innerHeight || 0
	} : undefined;

	// Método 1: Media query por ancho de pantalla
	if (mode === 'auto' || mode === 'size-only') {
		if (typeof window !== 'undefined' && window.matchMedia) {
			const mobileMediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
			if (mobileMediaQuery.matches) {
				detectedBy.push(`media-query-width-${breakpoint}px`);
				isMobile = true;
			}
		}
	}

	// Método 2: Touch capability (pointer: coarse indica dispositivo táctil principal)
	if (mode === 'auto' || mode === 'touch-only') {
		if (typeof window !== 'undefined' && window.matchMedia) {
			const touchQuery = window.matchMedia('(pointer: coarse)');
			if (touchQuery.matches) {
				detectedBy.push('touch-capability');
				isMobile = true;
			}
		}
	}

	// Método 3: Orientación de pantalla (portrait común en móviles)
	if (mode === 'auto') {
		if (typeof window !== 'undefined' && window.matchMedia) {
			const orientationQuery = window.matchMedia('(orientation: portrait)');
			const aspectRatioQuery = window.matchMedia('(max-aspect-ratio: 1/1)');
			if (orientationQuery.matches && aspectRatioQuery.matches && viewport && viewport.width < 1024) {
				detectedBy.push('portrait-orientation');
				isMobile = true;
			}
		}
	}

	// Método 4: User Agent
	if (mode === 'auto' || mode === 'user-agent-only') {
		if (typeof navigator !== 'undefined') {
			const userAgent = navigator.userAgent.toLowerCase();
			const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
			if (mobileKeywords.some(keyword => userAgent.includes(keyword))) {
				detectedBy.push('user-agent');
				isMobile = true;
			}
		}
	}

	const result: MobileDetectionResult = {
		isMobile,
		detectedBy,
		breakpoint,
		viewport
	};

	// Debug logging
	if (debug && typeof console !== 'undefined') {
		debugLog('[Position Resolver] Mobile detection:', {
			mode,
			result: isMobile ? 'MOBILE' : 'DESKTOP',
			detectedBy: detectedBy.length > 0 ? detectedBy.join(', ') : 'none',
			viewport,
			breakpoint: `${breakpoint}px`
		});
	}

	return result;
}

/**
 * Versión simplificada que retorna solo boolean (retrocompatibilidad)
 */
export function isMobileDevice(config?: MobileDetectionConfig): boolean {
	return detectMobileDevice(config).isMobile;
}

/**
 * Verifica si una configuración es un preset
 */
function isPreset(config: ChatPositionConfig): config is ChatPositionPreset {
	return typeof config === 'string' &&
		['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config);
}

/**
 * Convierte un preset a coordenadas exactas
 */
function presetToCoordinates(preset: ChatPositionPreset): ChatPositionCoordinates {
	return PRESET_COORDINATES[preset];
}

/**
 * Calcula la posición del widget basándose en la posición del botón
 * Si no se especifican coordenadas del widget, se calculan automáticamente
 */
function calculateWidgetPosition(buttonCoords: ChatPositionCoordinates): ChatPositionCoordinates {
	const result: ChatPositionCoordinates = { ...buttonCoords };

	// Si ya tiene coordenadas del widget especificadas, usarlas
	if (buttonCoords.widgetBottom || buttonCoords.widgetTop ||
		buttonCoords.widgetLeft || buttonCoords.widgetRight) {
		return result;
	}

	// Auto-calcular basándose en la posición del botón
	if (buttonCoords.bottom) {
		// Botón en la parte inferior -> widget arriba del botón
		const bottomValue = parseInt(buttonCoords.bottom);
		result.widgetBottom = `${bottomValue + WIDGET_OFFSET}px`;
	} else if (buttonCoords.top) {
		// Botón en la parte superior -> widget debajo del botón
		const topValue = parseInt(buttonCoords.top);
		result.widgetTop = `${topValue + WIDGET_OFFSET}px`;
	}

	// Mantener alineación horizontal
	if (buttonCoords.right) {
		result.widgetRight = buttonCoords.right;
	}
	if (buttonCoords.left) {
		result.widgetLeft = buttonCoords.left;
	}

	return result;
}

/**
 * Resuelve una configuración de posición a coordenadas exactas
 * @param config Configuración de posicionamiento
 * @param mobileDetectionConfig Configuración para detección de dispositivo móvil
 */
export function resolvePosition(
	config: ChatPositionConfig | DeviceSpecificPosition | undefined,
	mobileDetectionConfig?: MobileDetectionConfig
): ResolvedPosition {
	// Valor por defecto
	const defaultPosition: ResolvedPosition = {
		button: {
			bottom: '20px',
			right: '20px'
		},
		widget: {
			bottom: '90px',
			right: '20px'
		}
	};

	// Si no hay config, usar default
	if (!config) {
		return defaultPosition;
	}

	// Detectar si es configuración específica por dispositivo
	const deviceConfig = config as DeviceSpecificPosition;
	let activeConfig: ChatPositionConfig;

	if (deviceConfig.default !== undefined) {
		// Tiene configuración default, verificar si hay override para mobile
		const isMobile = isMobileDevice(mobileDetectionConfig);

		if (isMobile && deviceConfig.mobile) {
			activeConfig = deviceConfig.mobile;
		} else {
			activeConfig = deviceConfig.default;
		}
	} else {
		// Configuración simple (no device-specific)
		activeConfig = config as ChatPositionConfig;
	}

	// Convertir a coordenadas
	let coords: ChatPositionCoordinates;

	if (isPreset(activeConfig)) {
		coords = presetToCoordinates(activeConfig);
	} else {
		coords = activeConfig as ChatPositionCoordinates;
	}

	// Calcular posición del widget si no está especificada
	const finalCoords = calculateWidgetPosition(coords);

	// Construir resultado
	const resolved: ResolvedPosition = {
		button: {
			top: finalCoords.top,
			bottom: finalCoords.bottom,
			left: finalCoords.left,
			right: finalCoords.right
		},
		widget: {
			top: finalCoords.widgetTop,
			bottom: finalCoords.widgetBottom,
			left: finalCoords.widgetLeft,
			right: finalCoords.widgetRight
		}
	};

	return resolved;
}

/**
 * Genera CSS inline para aplicar posicionamiento
 */
export function generatePositionCSS(position: ResolvedPosition, isWidget: boolean = false): string {
	const coords = isWidget ? position.widget : position.button;
	const styles: string[] = [];

	if (coords.top) styles.push(`top: ${coords.top}`);
	if (coords.bottom) styles.push(`bottom: ${coords.bottom}`);
	if (coords.left) styles.push(`left: ${coords.left}`);
	if (coords.right) styles.push(`right: ${coords.right}`);

	return styles.join('; ');
}

/**
 * Valida que las coordenadas sean válidas
 */
export function validateCoordinates(coords: Partial<ChatPositionCoordinates>): boolean {
	// Debe tener al menos una coordenada vertical (top o bottom)
	if (!coords.top && !coords.bottom && !coords.widgetTop && !coords.widgetBottom) {
		return false;
	}

	// Debe tener al menos una coordenada horizontal (left o right)
	if (!coords.left && !coords.right && !coords.widgetLeft && !coords.widgetRight) {
		return false;
	}

	// Validar formato de valores (deben ser strings con unidades)
	const allValues = [
		coords.top, coords.bottom, coords.left, coords.right,
		coords.widgetTop, coords.widgetBottom, coords.widgetLeft, coords.widgetRight
	].filter(Boolean);

	for (const value of allValues) {
		if (typeof value !== 'string' || !/(px|%|em|rem|vh|vw)$/.test(value)) {
			return false;
		}
	}

	return true;
}
