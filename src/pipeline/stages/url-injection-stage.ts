import { PixelEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";
import { debugLog } from '../../utils/debug-logger';

/**
 * URLInjectionStage
 * 
 * Esta etapa de pipeline añade automáticamente información de URL a los eventos de tipo page_view,
 * organizándola en un objeto semántico dentro de event.metadata.
 * 
 * La información se agrupa en un objeto 'page' que contiene:
 * - url: URL completa de la página
 * - path: Ruta de la página
 * - search: Parámetros de búsqueda (query string)
 * - host: Dominio del sitio
 * - protocol: Protocolo utilizado (http/https)
 * - hash: Fragmento de la URL (después de #)
 * - referrer: URL de referencia
 * - timestamp: Momento de la captura de la URL
 */
export class URLInjectionStage implements PipelineStage<PixelEvent, PixelEvent> {
	process(event: PixelEvent): PixelEvent {
			// Verificar si ya existe información de URL en event.metadata
			const hasExistingPageUrl = event.metadata && 
				typeof event.metadata === 'object' && 
				'page' in event.metadata && 
				typeof event.metadata.page === 'object' &&
				event.metadata.page && 
				'url' in event.metadata.page;
			
			if (!hasExistingPageUrl) {
				// Solo agregar URL automáticamente si estamos en un entorno de navegador
				if (typeof window !== 'undefined' && window.location) {
					// Asegurar que metadata existe
					if (!event.metadata) {
						event.metadata = {};
					}

					// Crear objeto semántico para información de página
					const pageInfo = {
						url: window.location.href,
						path: window.location.pathname,
						search: window.location.search,
						host: window.location.host,
						protocol: window.location.protocol,
						hash: window.location.hash,
						referrer: document.referrer || '',
						timestamp: Date.now()
					};
					
					// Asignar al metadata
					event.metadata.page = pageInfo;

					// También añadir una versión simplificada al data del evento
					// para mantener compatibilidad con código existente
					if (event.data) {
						(event.data as Record<string, any>).pageUrl = window.location.href;
						(event.data as Record<string, any>).pagePath = window.location.pathname;
					}

					debugLog(`[URLInjectionStage] 🌐 URL generada automáticamente para page_view:`, {
						url: pageInfo.url,
						path: pageInfo.path,
						search: pageInfo.search
					});
				} else {
				}
			} else {
				debugLog(`[URLInjectionStage] ✅ URL ya presente en metadata, omitiendo inyección automática`);
			}
		return event;
	}
}