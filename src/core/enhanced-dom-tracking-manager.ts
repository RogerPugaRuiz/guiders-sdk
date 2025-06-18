import { DomTrackingManager, TrackDataExtractor, DefaultTrackDataExtractor } from './dom-tracking-manager';
import { HeuristicElementDetector, HeuristicDetectionConfig, DetectionResult } from './heuristic-element-detector';
import { URLPageDetector } from './url-page-detector';

/**
 * Enhanced DOM tracking manager with intelligent heuristic detection
 * Extends the original DomTrackingManager to support automatic element detection
 */
export class EnhancedDomTrackingManager extends DomTrackingManager {
    private heuristicDetector: HeuristicElementDetector;
    private urlDetector: URLPageDetector;
    private heuristicEnabled: boolean = true;
    private registeredListeners: Map<HTMLElement, Map<string, () => void>> = new Map();

    constructor(
        trackCallback: (params: Record<string, unknown>) => void,
        extractor: TrackDataExtractor = new DefaultTrackDataExtractor(),
        heuristicConfig: Partial<HeuristicDetectionConfig> = {}
    ) {
        super(trackCallback, extractor);
        this.heuristicDetector = new HeuristicElementDetector(heuristicConfig);
        this.urlDetector = new URLPageDetector();
    }

    /**
     * Enable heuristic-based DOM tracking (new default method)
     */
    public enableAutomaticTracking(): void {
        if (!this.heuristicEnabled) {
            console.log('[EnhancedDomTrackingManager] Heuristic detection is disabled');
            return;
        }

        console.log('[EnhancedDomTrackingManager] 🚀 Enabling automatic heuristic tracking');

        // Handle page_view with URL-based detection
        this.handlePageViewTracking();

        // Set up heuristic detection for all other events
        this.setupHeuristicEventListeners();

        // Monitor DOM changes for dynamic content
        this.observeDOMChanges();
    }

    /**
     * Handle page_view tracking using URL detection instead of HTML elements
     */
    private handlePageViewTracking(): void {
        const executePageView = () => {
            const pageData = this.urlDetector.detectCurrentPage();
            
            console.log('[EnhancedDomTrackingManager] 📄 Page detected:', pageData.pageType, 'confidence:', pageData.confidence);

            // Create page_view event data
            const eventData = {
                event: 'page_view',
            };

            this.trackCallback(eventData);
        };

        // Execute immediately if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', executePageView);
        } else {
            executePageView();
        }
    }

    /**
     * Set up heuristic-based event listeners for all tracked events
     */
    private setupHeuristicEventListeners(): void {
        // Get all event types from the parent class domEventMap
        const eventTypes = Object.keys(this.getDomEventMap());
        
        eventTypes.forEach(eventType => {
            if (eventType === 'page_view') return; // Handled separately with URL detection
            
            this.setupEventTypeListeners(eventType);
        });
    }

    /**
     * Set up listeners for a specific event type using heuristic detection
     */
    private setupEventTypeListeners(eventType: string): void {
        const domEvent = this.getDomEventMap()[eventType];
        if (!domEvent) return;

        const detectionResults = this.heuristicDetector.detectElements(eventType);
        
        console.log(`[EnhancedDomTrackingManager] 🎯 Found ${detectionResults.length} elements for "${eventType}"`);

        detectionResults.forEach((result: DetectionResult) => {
            this.attachEventListener(result.element, eventType, domEvent, result);
        });
    }

    /**
     * Attach event listener to an element with proper tracking
     */
    private attachEventListener(
        element: HTMLElement, 
        eventType: string, 
        domEvent: string, 
        result: DetectionResult
    ): void {
        // Check if listener already exists for this element and event
        if (!this.registeredListeners.has(element)) {
            this.registeredListeners.set(element, new Map());
        }

        const elementListeners = this.registeredListeners.get(element)!;
        const listenerKey = `${eventType}_${domEvent}`;
        
        if (elementListeners.has(listenerKey)) {
            return; // Already has listener
        }

        const handler = () => {
            console.log(`[EnhancedDomTrackingManager] 📊 Tracking "${eventType}" (confidence: ${result.confidence.toFixed(2)})`);
            
            // Extract data using the configured extractor, but enhance with heuristic metadata
            const baseData = this.createHeuristicEventData(element, eventType, result);
            this.trackCallback(baseData);
        };

        element.addEventListener(domEvent, handler);
        elementListeners.set(listenerKey, handler);

        // Add visual indicator for detected elements (in development)
        if (process.env.NODE_ENV === 'development') {
            this.addVisualIndicator(element, eventType, result.confidence);
        }
    }

    /**
     * Create event data for heuristic-detected elements
     */
    private createHeuristicEventData(
        element: HTMLElement, 
        eventType: string, 
        result: DetectionResult
    ): Record<string, unknown> {
        return {
            event: eventType,
            detection_method: 'heuristic',
            confidence: result.confidence,
            matched_selector: result.matchedRule.selector,
            element_text: element.textContent?.trim() || '',
            element_tag: element.tagName.toLowerCase(),
            element_class: element.className || '',
            element_id: element.id || '',
            timestamp: Date.now(),
            // Include page context
            ...this.urlDetector.extractPageMetadata()
        };
    }

    /**
     * Add visual indicator for detected elements (development only)
     */
    private addVisualIndicator(element: HTMLElement, eventType: string, confidence: number): void {
        const indicator = document.createElement('div');
        indicator.innerHTML = `🎯 ${eventType} (${Math.round(confidence * 100)}%)`;
        indicator.style.cssText = `
            position: absolute;
            background: rgba(30, 58, 138, 0.9);
            color: white;
            padding: 2px 6px;
            font-size: 10px;
            border-radius: 3px;
            z-index: 10000;
            pointer-events: none;
            font-family: monospace;
        `;
        
        const rect = element.getBoundingClientRect();
        indicator.style.top = (rect.top + window.scrollY - 20) + 'px';
        indicator.style.left = (rect.left + window.scrollX) + 'px';
        
        document.body.appendChild(indicator);
        
        // Remove indicator after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 3000);
    }

    /**
     * Observe DOM changes to detect dynamically added elements
     */
    private observeDOMChanges(): void {
        const observer = new MutationObserver((mutations) => {
            let hasRelevantChanges = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes are relevant elements
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            hasRelevantChanges = true;
                        }
                    });
                }
            });

            if (hasRelevantChanges) {
                // Debounce re-scanning
                setTimeout(() => this.rescanForNewElements(), 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Rescan for new elements after DOM changes
     */
    private rescanForNewElements(): void {
        console.log('[EnhancedDomTrackingManager] 🔄 Rescanning for new elements');
        
        const eventTypes = Object.keys(this.getDomEventMap());
        eventTypes.forEach(eventType => {
            if (eventType !== 'page_view') {
                this.setupEventTypeListeners(eventType);
            }
        });
    }

    /**
     * Enable or disable heuristic detection
     */
    public setHeuristicEnabled(enabled: boolean): void {
        this.heuristicEnabled = enabled;
        console.log(`[EnhancedDomTrackingManager] Heuristic detection ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get heuristic detection configuration
     */
    public getHeuristicConfig(): HeuristicDetectionConfig {
        return this.heuristicDetector.getConfig();
    }

    /**
     * Update heuristic detection configuration
     */
    public updateHeuristicConfig(config: Partial<HeuristicDetectionConfig>): void {
        this.heuristicDetector.updateConfig(config);
    }

    /**
     * Get URL detector instance for external use
     */
    public getURLDetector(): URLPageDetector {
        return this.urlDetector;
    }

    /**
     * Get heuristic detector instance for external use
     */
    public getHeuristicDetector(): HeuristicElementDetector {
        return this.heuristicDetector;
    }

    /**
     * Access parent class domEventMap (now protected)
     */
    private getDomEventMap(): Record<string, string> {
        return this.domEventMap;
    }

    /**
     * Legacy method - now delegates to automatic tracking
     * @deprecated Use enableAutomaticTracking() instead
     */
    public enableDOMTracking(): void {
        console.warn('[EnhancedDomTrackingManager] enableDOMTracking() is deprecated. Use enableAutomaticTracking() instead.');
        this.enableAutomaticTracking();
    }
}