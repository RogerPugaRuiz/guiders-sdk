import { TrackDataExtractor } from './dom-tracking-manager';
import { HeuristicElementDetector, DetectionResult } from './heuristic-element-detector';

export interface HeuristicTrackDataExtractor extends TrackDataExtractor {
    extractFromHeuristic(element: HTMLElement, eventType: string, confidence: number): Record<string, unknown>;
}

export class HeuristicTrackDataExtractor implements HeuristicTrackDataExtractor {
    extract(el: HTMLElement): Record<string, unknown> {
        // Fallback to basic extraction for compatibility
        const data: Record<string, unknown> = {};
        
        // Extract basic element information
        data.element_tag = el.tagName.toLowerCase();
        data.element_text = el.textContent?.trim() || '';
        data.element_id = el.id || '';
        data.element_classes = el.className || '';
        
        // Extract link information if applicable
        if (el.tagName.toLowerCase() === 'a') {
            data.link_href = (el as HTMLAnchorElement).href;
        }
        
        // Extract form information if applicable
        if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'button') {
            data.form_name = (el as HTMLInputElement).name || '';
            data.form_value = (el as HTMLInputElement).value || '';
        }

        return data;
    }

    extractFromHeuristic(element: HTMLElement, eventType: string, confidence: number): Record<string, unknown> {
        const data = this.extract(element);
        
        // Add heuristic-specific data
        data.event = eventType;
        data.detection_method = 'heuristic';
        data.confidence_score = confidence;
        data.detected_at = Date.now();
        
        // Add page context
        data.page_url = window.location.href;
        data.page_path = window.location.pathname;
        data.page_title = document.title;
        
        return data;
    }
}

export interface AutoDetectionConfig {
    enabled: boolean;
    confidenceThreshold: number;
    fallbackToManual: boolean;
    urlBasedPageDetection: boolean;
    supportedEvents?: string[];
}

export class EnhancedDomTrackingManager {
    private trackCallback: (params: Record<string, unknown>) => void;
    private extractor: HeuristicTrackDataExtractor;
    private heuristicDetector: HeuristicElementDetector;
    private config: AutoDetectionConfig;
    private trackedElements = new WeakSet<HTMLElement>();
    private pageDetectionPatterns: Record<string, RegExp> = {
        'home': /^\/(index\.php)?(\?.*)?$/,
        'about': /\/about/,
        'contact': /\/contact/,
        'ecommerce': /\/ecommerce/,
        'vehicle-search': /\/vehicle-search/,
        'vehicle-comparison': /\/vehicle-comparison/,
        'product': /\/product/,
        'category': /\/category/
    };

    constructor(
        trackCallback: (params: Record<string, unknown>) => void,
        extractor: HeuristicTrackDataExtractor = new HeuristicTrackDataExtractor(),
        config: Partial<AutoDetectionConfig> = {}
    ) {
        this.trackCallback = trackCallback;
        this.extractor = extractor;
        this.heuristicDetector = new HeuristicElementDetector();
        this.config = {
            enabled: true,
            confidenceThreshold: 0.6,
            fallbackToManual: false,
            urlBasedPageDetection: true,
            ...config
        };
    }

    public enableAutomaticTracking(): void {
        if (!this.config.enabled) {
            console.log('[EnhancedDomTrackingManager] Automatic tracking is disabled');
            return;
        }

        // 1. Handle page view with URL-based detection
        this.handlePageViewDetection();
        
        // 2. Enable heuristic detection for other events
        this.enableHeuristicDetection();
        
        console.log('[EnhancedDomTrackingManager] ✅ Automatic tracking enabled with heuristic detection');
    }

    /**
     * Legacy method for backward compatibility (when needed)
     */
    public enableDOMTracking(): void {
        console.warn('[EnhancedDomTrackingManager] enableDOMTracking() is deprecated. Use enableAutomaticTracking() instead.');
        this.enableAutomaticTracking();
    }

    private handlePageViewDetection(): void {
        if (!this.config.urlBasedPageDetection) {
            return;
        }

        // Detect page type based on URL
        const currentPath = window.location.pathname;
        const detectedPageType = this.detectPageType(currentPath);
        
        // Create page view event data
        const pageViewData = {
            event: 'page_view',
            page_type: detectedPageType,
            page_url: window.location.href,
            page_path: currentPath,
            page_title: document.title,
            page_search: window.location.search,
            page_hash: window.location.hash,
            referrer: document.referrer || '',
            detection_method: 'url_pattern',
            detected_at: Date.now()
        };

        // Fire page view event
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                this.trackCallback(pageViewData);
                console.log(`[EnhancedDomTrackingManager] 📄 Page view detected: ${detectedPageType} (${currentPath})`);
            });
        } else {
            this.trackCallback(pageViewData);
            console.log(`[EnhancedDomTrackingManager] 📄 Page view detected: ${detectedPageType} (${currentPath})`);
        }
    }

    private detectPageType(path: string): string {
        for (const [pageType, pattern] of Object.entries(this.pageDetectionPatterns)) {
            if (pattern.test(path)) {
                return pageType;
            }
        }
        return 'unknown';
    }

    private enableHeuristicDetection(): void {
        // Wait for DOM to be ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                this.setupHeuristicTracking();
            });
        } else {
            this.setupHeuristicTracking();
        }
    }

    private setupHeuristicTracking(): void {
        const supportedEvents = this.config.supportedEvents || this.heuristicDetector.getSupportedEventTypes();
        
        for (const eventType of supportedEvents) {
            if (eventType === 'page_view') continue; // Already handled
            
            const detectionResults = this.heuristicDetector.detect(eventType);
            
            for (const result of detectionResults) {
                if (result.confidence >= this.config.confidenceThreshold) {
                    this.attachEventListener(result);
                }
            }
        }

        // Set up mutation observer to detect dynamically added elements
        this.setupMutationObserver();
    }

    private attachEventListener(result: DetectionResult): void {
        if (this.trackedElements.has(result.element)) {
            return; // Already tracked
        }

        const eventType = this.getEventTypeForElement(result.eventType);
        const element = result.element;
        
        const handler = () => {
            const eventData = this.extractor.extractFromHeuristic(
                element,
                result.eventType,
                result.confidence
            );
            this.trackCallback(eventData);
            console.log(`[EnhancedDomTrackingManager] 🎯 Event tracked: ${result.eventType} (confidence: ${result.confidence.toFixed(2)})`);
        };

        element.addEventListener(eventType, handler);
        this.trackedElements.add(element);
        
        console.log(`[EnhancedDomTrackingManager] 🔍 Auto-detected ${result.eventType} element (confidence: ${result.confidence.toFixed(2)}):`, element);
    }

    private getEventTypeForElement(eventName: string): string {
        // Map event names to DOM event types
        const eventMap: Record<string, string> = {
            'add_to_cart': 'click',
            'contact_dealer': 'click',
            'search_submit': 'click',
            'view_product': 'mouseenter',
            'filter_by_price': 'change',
            'schedule_test_drive': 'click',
            'request_quote': 'click',
            'view_cart': 'mouseenter',
            'purchase': 'click'
        };
        
        return eventMap[eventName] || 'click';
    }

    private setupMutationObserver(): void {
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any of the added nodes might contain trackable elements
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldRecheck = true;
                            break;
                        }
                    }
                }
            }
            
            if (shouldRecheck) {
                // Debounce re-detection to avoid excessive processing
                setTimeout(() => this.recheckForNewElements(), 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    private recheckForNewElements(): void {
        const supportedEvents = this.config.supportedEvents || this.heuristicDetector.getSupportedEventTypes();
        
        for (const eventType of supportedEvents) {
            if (eventType === 'page_view') continue;
            
            const detectionResults = this.heuristicDetector.detect(eventType);
            
            for (const result of detectionResults) {
                if (result.confidence >= this.config.confidenceThreshold && 
                    !this.trackedElements.has(result.element)) {
                    this.attachEventListener(result);
                }
            }
        }
    }

    /**
     * Add custom page detection pattern
     */
    public addPagePattern(pageType: string, pattern: RegExp): void {
        this.pageDetectionPatterns[pageType] = pattern;
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<AutoDetectionConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get current configuration
     */
    public getConfig(): AutoDetectionConfig {
        return { ...this.config };
    }

    /**
     * Manual method to re-run detection (useful for SPAs)
     */
    public redetectElements(): void {
        this.setupHeuristicTracking();
    }
}