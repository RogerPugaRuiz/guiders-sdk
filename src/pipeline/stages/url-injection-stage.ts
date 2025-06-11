import { PixelEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class URLInjectionStage implements PipelineStage<PixelEvent, PixelEvent> {
	process(event: PixelEvent): PixelEvent {
		// Solo procesar eventos de tipo 'tracking:tracking-event' que contengan page_view
		if (event.type === 'tracking:tracking-event' && 
			event.data && 
			typeof event.data === 'object' && 
			'eventType' in event.data && 
			event.data.eventType === 'page_view') {

			// Verificar si ya existe información de URL en metadata
			const metadata = event.data.metadata as Record<string, any>;
			if (!metadata || !metadata.page_url) {
				// Solo agregar URL automáticamente si estamos en un entorno de navegador
				if (typeof window !== 'undefined' && window.location) {
					// Asegurar que metadata existe
					if (!event.data.metadata) {
						event.data.metadata = {};
					}

					// Agregar información de URL completa automáticamente
					(event.data.metadata as Record<string, any>).page_url = window.location.href;
					(event.data.metadata as Record<string, any>).page_path = window.location.pathname;
					(event.data.metadata as Record<string, any>).page_search = window.location.search;
					(event.data.metadata as Record<string, any>).page_host = window.location.host;
					(event.data.metadata as Record<string, any>).page_protocol = window.location.protocol;
					(event.data.metadata as Record<string, any>).page_hash = window.location.hash;
					(event.data.metadata as Record<string, any>).referrer = document.referrer || '';
					(event.data.metadata as Record<string, any>).timestamp_url_injection = Date.now();

					console.log(`[URLInjectionStage] 🌐 URL generada automáticamente para page_view:`, {
						page_url: (event.data.metadata as Record<string, any>).page_url,
						page_path: (event.data.metadata as Record<string, any>).page_path,
						page_search: (event.data.metadata as Record<string, any>).page_search
					});
				} else {
					console.warn('[URLInjectionStage] ⚠️ No se puede acceder a window.location - entorno no es navegador');
				}
			} else {
				console.log(`[URLInjectionStage] ✅ URL ya presente en metadata, omitiendo inyección automática`);
			}
		}

		return event;
	}
}