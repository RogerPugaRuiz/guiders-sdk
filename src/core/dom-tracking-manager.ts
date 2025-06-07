export interface TrackDataExtractor {
    extract(el: HTMLElement): Record<string, unknown>;
}

export class DefaultTrackDataExtractor implements TrackDataExtractor {
    extract(el: HTMLElement): Record<string, unknown> {
        const dataset = el.dataset;
        const event = dataset.trackEvent;
        const data: Record<string, unknown> = { event };
        Object.keys(dataset).forEach((key) => {
            if (key === "trackEvent") return;
            const prop = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
            data[prop] = dataset[key];
        });
        return data;
    }
}

export class DomTrackingManager {
    private domEventMap: Record<string, string> = {
        "view_product": "mouseenter",
        "add_to_cart": "click",
        "view_cart": "mouseenter",
        "purchase": "click",
        "page_view": "DOMContentLoaded",
        // Eventos específicos de vehículos
        "search_vehicle_type": "change",
        "search_brand": "change",
        "search_model": "change",
        "search_fuel": "change",
        "search_price_type": "change",
        "sort_vehicles": "change",
        "calculate_financing": "click",
        "add_to_favorites": "click",
        "view_vehicle_location": "mouseenter",
        "filter_by_price": "change",
        "filter_by_payment": "change",
        "search_submit": "click",
        "search_input": "input",
        // Eventos avanzados de comparación
        "add_to_comparison": "click",
        "remove_from_comparison": "click",
        "select_comparison_vehicle": "click",
        "view_vehicle_comparison": "mouseenter",
        "save_comparison": "click",
        "export_comparison": "click",
        "share_comparison": "click",
        "clear_comparison": "click",
        // Eventos de filtros avanzados
        "filter_by_year": "change",
        "filter_by_transmission": "change",
        "filter_by_doors": "change",
        "filter_by_mileage": "change",
        "filter_by_condition": "change",
        "toggle_advanced_filters": "click",
        // Eventos de interacción de usuario
        "contact_dealer": "click",
        "schedule_test_drive": "click",
        "request_quote": "click",
        "view_vehicle_details": "click",
        "view_vehicle_gallery": "click",
        "view_vehicle_specs": "click",
        "view_vehicle_history": "click",
        "download_brochure": "click",
        // Eventos de analytics y seguimiento
        "analytics_dashboard_view": "mouseenter",
        "export_analytics": "click",
        "share_analytics": "click",
        // Eventos de chat específicos para vehículos
        "chat_ask_about_vehicle": "click",
        "chat_request_financing": "click",
        "chat_schedule_viewing": "click"
    };
    private trackCallback: (params: Record<string, unknown>) => void;
    private extractor: TrackDataExtractor;

    constructor(
        trackCallback: (params: Record<string, unknown>) => void,
        extractor: TrackDataExtractor = new DefaultTrackDataExtractor()
    ) {
        this.trackCallback = trackCallback;
        this.extractor = extractor;
    }

    public enableDOMTracking(): void {
        // page_view: se lanza en window.onload si existe el elemento
        const pageViewElem = document.querySelector('[data-track-event="page_view"]');
        if (pageViewElem && this.domEventMap["page_view"] === "DOMContentLoaded") {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => {
                    this.trackCallback(this.extractor.extract(pageViewElem as HTMLElement));
                });
            } else {
                // DOM ya cargado, lanza el track directamente
                this.trackCallback(this.extractor.extract(pageViewElem as HTMLElement));
            }
        }

        // Para el resto de eventos
        Object.entries(this.domEventMap).forEach(([eventName, domEvent]) => {
            if (eventName === "page_view") return;
            const elements = document.querySelectorAll(`[data-track-event="${eventName}"]`);
            elements.forEach((el) => {
                const listenerKey = `__track_listener_${eventName}`;
                if ((el as any)[listenerKey]) return;
                const handler = () => {
                    this.trackCallback(this.extractor.extract(el as HTMLElement));
                };
                el.addEventListener(domEvent, handler);
                (el as any)[listenerKey] = true;
            });
        });
    }
}