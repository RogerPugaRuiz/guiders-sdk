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
        "page_view": "DOMContentLoaded"
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