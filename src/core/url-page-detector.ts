import { ConfidenceLevel } from '../types/confidence';

// Page detection result interface
export interface PageDetectionResult {
    pageType: string;
    confidence: number;
    url: string;
    path: string;
    metadata: Record<string, unknown>;
}

// URL pattern for page detection
export interface URLPattern {
    pattern: string | RegExp;
    pageType: string;
    confidence: number;
    metadata?: Record<string, unknown>;
}

/**
 * URL-based page detector for automatic page identification
 * Replaces HTML element-based page_view detection
 */
export class URLPageDetector {
    private urlPatterns: URLPattern[] = [
        // Home/Landing pages
        {
            pattern: /^\/?(index\.(php|html?)?)?$/i,
            pageType: 'home',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'main' }
        },
        {
            pattern: /^\/?(home|inicio)$/i,
            pageType: 'home',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'main' }
        },

        // E-commerce pages
        {
            pattern: /\/?(shop|tienda|ecommerce|store)/i,
            pageType: 'ecommerce',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'ecommerce' }
        },
        {
            pattern: /\/?(product|producto)[\/-]?(\d+|[^\/]+)?/i,
            pageType: 'product_detail',
            confidence: ConfidenceLevel.EXACT_MATCH,
            metadata: { pageCategory: 'ecommerce' }
        },
        {
            pattern: /\/?(cart|carrito|basket)/i,
            pageType: 'cart',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'ecommerce' }
        },
        {
            pattern: /\/?(checkout|pago|payment)/i,
            pageType: 'checkout',
            confidence: ConfidenceLevel.EXACT_MATCH,
            metadata: { pageCategory: 'ecommerce' }
        },

        // Vehicle/Automotive pages
        {
            pattern: /\/?(vehicle|vehiculo|car|auto)[\/-]?(search|busqueda|buscar)?/i,
            pageType: 'vehicle_search',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'automotive' }
        },
        
        // Patrones específicos para páginas de vehículos en español
        {
            pattern: /\/?(vehiculos-ocasion|coches-ocasion|vehiculos-segunda-mano|coches-usados)/i,
            pageType: 'used_vehicles',
            confidence: ConfidenceLevel.EXACT_MATCH,
            metadata: { pageCategory: 'automotive', vehicleType: 'used' }
        },
        {
            pattern: /\/?(vehiculos-nuevos|coches-nuevos)/i,
            pageType: 'new_vehicles',
            confidence: ConfidenceLevel.EXACT_MATCH,
            metadata: { pageCategory: 'automotive', vehicleType: 'new' }
        },
        {
            pattern: /\/?(coches-km0|vehiculos-km0|km-0)/i,
            pageType: 'km0_vehicles',
            confidence: ConfidenceLevel.EXACT_MATCH,
            metadata: { pageCategory: 'automotive', vehicleType: 'km0' }
        },
        {
            pattern: /\/?(ofertas-vehiculos|ofertas-coches|promociones-coches)/i,
            pageType: 'vehicle_offers',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'automotive', vehicleType: 'offers' }
        },
        
        {
            pattern: /\/?(vehicle|vehiculo|car|auto)[\/-]?(detail|detalle)[\/-]?(\d+|[^\/]+)?/i,
            pageType: 'vehicle_detail',
            confidence: ConfidenceLevel.EXACT_MATCH,
            metadata: { pageCategory: 'automotive' }
        },
        {
            pattern: /\/?(comparison|comparar|compare)/i,
            pageType: 'vehicle_comparison',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'automotive' }
        },
        {
            pattern: /\/?(financing|financiacion|finance)/i,
            pageType: 'financing',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'automotive' }
        },

        // Contact and Information pages
        {
            pattern: /\/?(contact|contacto|contact-us)/i,
            pageType: 'contact',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'information' }
        },
        {
            pattern: /\/?(about|nosotros|acerca|about-us)/i,
            pageType: 'about',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'information' }
        },

        // Analytics and Dashboard
        {
            pattern: /\/?(analytics|dashboard|admin)/i,
            pageType: 'analytics_dashboard',
            confidence: ConfidenceLevel.HIGH,
            metadata: { pageCategory: 'analytics' }
        },

        // Search pages
        {
            pattern: /\/?(search|buscar|busqueda)/i,
            pageType: 'search_results',
            confidence: ConfidenceLevel.MEDIUM,
            metadata: { pageCategory: 'search' }
        },

        // Generic fallback patterns
        {
            pattern: /.*/,
            pageType: 'other',
            confidence: ConfidenceLevel.FALLBACK,
            metadata: { pageCategory: 'unknown' }
        }
    ];

    /**
     * Detect current page type based on URL
     */
    public detectCurrentPage(): PageDetectionResult {
        const url = window.location.href;
        const path = window.location.pathname;
        
        // Find the best matching pattern
        for (const pattern of this.urlPatterns) {
            if (this.matchesPattern(path, pattern.pattern)) {
                return {
                    pageType: pattern.pageType,
                    confidence: pattern.confidence,
                    url,
                    path,
                    metadata: {
                        ...pattern.metadata,
                        title: document.title,
                        host: window.location.host,
                        search: window.location.search,
                        hash: window.location.hash,
                        referrer: document.referrer || '',
                        timestamp: Date.now()
                    }
                };
            }
        }

        // Fallback to generic "other" page type
        return {
            pageType: 'other',
            confidence: ConfidenceLevel.FALLBACK,
            url,
            path,
            metadata: {
                pageCategory: 'unknown',
                title: document.title,
                host: window.location.host,
                search: window.location.search,
                hash: window.location.hash,
                referrer: document.referrer || '',
                timestamp: Date.now()
            }
        };
    }

    /**
     * Check if a path matches a pattern
     */
    private matchesPattern(path: string, pattern: string | RegExp): boolean {
        if (pattern instanceof RegExp) {
            return pattern.test(path);
        }
        return path.toLowerCase().includes(pattern.toLowerCase());
    }

    /**
     * Add custom URL patterns
     */
    public addURLPattern(pattern: URLPattern): void {
        // Insert before the generic fallback (last pattern)
        this.urlPatterns.splice(-1, 0, pattern);
    }

    /**
     * Get all URL patterns
     */
    public getURLPatterns(): URLPattern[] {
        return [...this.urlPatterns];
    }

    /**
     * Extract metadata from current page
     */
    public extractPageMetadata(): Record<string, unknown> {
        const pageDetection = this.detectCurrentPage();
        
        return {
            ...pageDetection.metadata,
            // Additional extracted metadata
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            userAgent: navigator.userAgent,
            language: navigator.language,
            // URL components
            page_url: window.location.href,
            page_path: window.location.pathname,
            page_search: window.location.search,
            page_host: window.location.host,
            page_protocol: window.location.protocol,
            page_hash: window.location.hash,
            // Page-specific
            page_type: pageDetection.pageType,
            page_confidence: pageDetection.confidence,
            page_category: pageDetection.metadata?.pageCategory
        };
    }
}