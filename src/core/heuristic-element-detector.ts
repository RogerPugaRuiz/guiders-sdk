import { ConfidenceLevel } from '../types/confidence';

// Heuristic rule interface for element detection
export interface HeuristicRule {
    selector: string;
    confidence: number;
    contextSelectors?: string[];
    textPatterns?: string[];
    attributePatterns?: Record<string, string>;
}

// Detection result with confidence score
export interface DetectionResult {
    element: HTMLElement;
    eventType: string;
    confidence: number;
    matchedRule: HeuristicRule;
}

// Configuration for heuristic detection
export interface HeuristicDetectionConfig {
    enabled: boolean;
    confidenceThreshold: number;
    fallbackToManual: boolean;
    customRules?: Record<string, HeuristicRule[]>;
}

/**
 * Intelligent heuristic element detector for automatic tracking
 * Based on the strategy defined in docs/ESTRATEGIA_LOCALIZACION_ELEMENTOS.md
 */
export class HeuristicElementDetector {
    private heuristicRules: Record<string, HeuristicRule[]> = {
        "add_to_cart": [
            {
                selector: 'button, input[type="submit"], a',
                confidence: ConfidenceLevel.HIGH,
                textPatterns: ['añadir', 'agregar', 'add to cart', 'add cart', 'comprar', 'buy'],
                attributePatterns: {
                    'class': 'cart',
                    'id': 'cart'
                },
                contextSelectors: ['[class*="product"]', '[class*="item"]', '[class*="cart"]']
            },
            {
                selector: 'input[type="submit"]',
                confidence: ConfidenceLevel.MEDIUM,
                attributePatterns: {
                    'value': 'carrito'
                }
            },
            {
                selector: 'a[href*="cart"]',
                confidence: ConfidenceLevel.MEDIUM,
                textPatterns: ['add', 'añadir']
            }
        ],
        "contact_dealer": [
            {
                selector: 'button, a, input[type="submit"]',
                confidence: ConfidenceLevel.HIGH,
                textPatterns: ['contactar', 'contact', 'concesionario', 'dealer'],
                contextSelectors: ['[class*="dealer"]', '[class*="contact"]', 'form[class*="contact"]']
            },
            {
                selector: 'form input[type="submit"]',
                confidence: ConfidenceLevel.MEDIUM,
                contextSelectors: ['form[class*="contact"]', 'form[id*="contact"]']
            }
        ],
        "search_submit": [
            {
                selector: 'button[type="submit"], input[type="submit"]',
                confidence: ConfidenceLevel.HIGH,
                contextSelectors: ['form[class*="search"]', '[class*="filter"]', '[class*="search"]']
            },
            {
                selector: 'button, input[type="submit"]',
                confidence: ConfidenceLevel.MEDIUM,
                textPatterns: ['buscar', 'search', 'filtrar', 'filter']
            }
        ],
        "schedule_test_drive": [
            {
                selector: 'button, a, input[type="submit"]',
                confidence: ConfidenceLevel.HIGH,
                textPatterns: ['test drive', 'prueba', 'conducir', 'probar', 'cita'],
                contextSelectors: ['[class*="vehicle"]', '[class*="car"]', '[class*="auto"]']
            }
        ],
        "request_quote": [
            {
                selector: 'button, a, input[type="submit"]',
                confidence: ConfidenceLevel.HIGH,
                textPatterns: ['cotizar', 'quote', 'presupuesto', 'precio', 'solicitar'],
                contextSelectors: ['[class*="vehicle"]', '[class*="product"]', '[class*="price"]']
            }
        ],
        "view_product": [
            {
                selector: 'a, div, article',
                confidence: ConfidenceLevel.MEDIUM,
                contextSelectors: ['[class*="product"]', '[class*="item"]', '[class*="card"]'],
                attributePatterns: {
                    'href': 'product'
                }
            }
        ],
        "purchase": [
            {
                selector: 'button, input[type="submit"]',
                confidence: ConfidenceLevel.HIGH,
                textPatterns: ['comprar', 'buy', 'purchase', 'pagar', 'pay', 'checkout'],
                contextSelectors: ['[class*="checkout"]', '[class*="payment"]', '[class*="buy"]']
            }
        ],
        "view_cart": [
            {
                selector: 'a, button, div',
                confidence: ConfidenceLevel.MEDIUM,
                textPatterns: ['carrito', 'cart', 'basket'],
                attributePatterns: {
                    'href': 'cart',
                    'class': 'cart'
                }
            }
        ],
        "download_brochure": [
            {
                selector: 'a, button',
                confidence: ConfidenceLevel.HIGH,
                textPatterns: ['descargar', 'download', 'brochure', 'folleto', 'catálogo', 'pdf'],
                attributePatterns: {
                    'href': '.pdf'
                }
            }
        ]
    };

    private config: HeuristicDetectionConfig;

    constructor(config: Partial<HeuristicDetectionConfig> = {}) {
        this.config = {
            enabled: true,
            confidenceThreshold: ConfidenceLevel.MEDIUM,
            fallbackToManual: true,
            ...config
        };

        // Merge custom rules if provided
        if (config.customRules) {
            this.heuristicRules = { ...this.heuristicRules, ...config.customRules };
        }
    }

    /**
     * Detect elements for a specific event type
     */
    public detectElements(eventType: string): DetectionResult[] {
        if (!this.config.enabled) {
            return [];
        }

        const rules = this.heuristicRules[eventType];
        if (!rules || rules.length === 0) {
            return [];
        }

        const results: DetectionResult[] = [];

        for (const rule of rules) {
            const elements = this.findElementsByRule(rule);
            for (const element of elements) {
                const confidence = this.calculateConfidence(element, rule);
                if (confidence >= this.config.confidenceThreshold) {
                    results.push({
                        element,
                        eventType,
                        confidence,
                        matchedRule: rule
                    });
                }
            }
        }

        // Sort by confidence (highest first) and remove duplicates
        return this.deduplicateResults(results)
            .sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Find all elements matching a specific rule
     */
    private findElementsByRule(rule: HeuristicRule): HTMLElement[] {
        // Get all elements matching the base selector
        const elements = Array.from(document.querySelectorAll(rule.selector)) as HTMLElement[];
        
        // Filter elements that match all conditions of the rule
        return elements.filter(element => this.elementMatchesRule(element, rule));
    }

    /**
     * Check if an element matches all conditions of a rule
     */
    private elementMatchesRule(element: HTMLElement, rule: HeuristicRule): boolean {
        // Check text patterns
        if (rule.textPatterns) {
            const text = element.textContent?.toLowerCase() || '';
            const hasMatchingText = rule.textPatterns.some(pattern => 
                text.includes(pattern.toLowerCase())
            );
            if (!hasMatchingText) {
                return false;
            }
        }

        // Check attribute patterns
        if (rule.attributePatterns) {
            for (const [attr, pattern] of Object.entries(rule.attributePatterns)) {
                const attrValue = element.getAttribute(attr)?.toLowerCase() || '';
                if (!attrValue.includes(pattern.toLowerCase())) {
                    return false;
                }
            }
        }

        // Check context selectors (parent or ancestor matching)
        if (rule.contextSelectors) {
            const hasMatchingContext = rule.contextSelectors.some(contextSelector => {
                return element.closest(contextSelector) !== null ||
                       element.querySelector(contextSelector) !== null;
            });
            if (!hasMatchingContext) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate confidence score for an element-rule match
     */
    private calculateConfidence(element: HTMLElement, rule: HeuristicRule): number {
        let confidence = rule.confidence;

        // Boost confidence for exact text matches
        if (rule.textPatterns) {
            const text = element.textContent?.toLowerCase() || '';
            const exactMatches = rule.textPatterns.filter(pattern => 
                text === pattern.toLowerCase()
            ).length;
            confidence += exactMatches * 0.1;
        }

        // Boost confidence for multiple attribute matches
        if (rule.attributePatterns) {
            const matchingAttrs = Object.entries(rule.attributePatterns).filter(([attr, pattern]) => {
                const attrValue = element.getAttribute(attr)?.toLowerCase() || '';
                return attrValue.includes(pattern.toLowerCase());
            }).length;
            confidence += matchingAttrs * 0.05;
        }

        // Ensure confidence doesn't exceed 1.0
        return Math.min(confidence, 1.0);
    }

    /**
     * Remove duplicate elements from results
     */
    private deduplicateResults(results: DetectionResult[]): DetectionResult[] {
        const seen = new Set<HTMLElement>();
        return results.filter(result => {
            if (seen.has(result.element)) {
                return false;
            }
            seen.add(result.element);
            return true;
        });
    }

    /**
     * Get configuration
     */
    public getConfig(): HeuristicDetectionConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<HeuristicDetectionConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Add custom rules for specific event types
     */
    public addCustomRules(eventType: string, rules: HeuristicRule[]): void {
        if (!this.heuristicRules[eventType]) {
            this.heuristicRules[eventType] = [];
        }
        this.heuristicRules[eventType].push(...rules);
    }
}