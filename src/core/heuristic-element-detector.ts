export interface HeuristicRule {
    selector: string;
    confidence: number;
    contextSelectors?: string[];
    textPatterns?: string[];
}

export interface DetectionResult {
    element: HTMLElement;
    eventType: string;
    confidence: number;
    selector: string;
}

export class HeuristicElementDetector {
    private heuristicRules: Record<string, HeuristicRule[]> = {
        "add_to_cart": [
            {
                selector: 'button:contains("añadir"), button:contains("agregar"), button[class*="cart"], button[id*="cart"]',
                confidence: 0.9,
                contextSelectors: ['[class*="product"]', '[class*="item"]'],
                textPatterns: ['añadir', 'agregar', 'carrito', 'cart']
            },
            {
                selector: 'input[type="submit"][value*="carrito"], a[href*="cart"][class*="add"]',
                confidence: 0.8,
                textPatterns: ['carrito', 'cart']
            },
            {
                selector: 'button[class*="add"][class*="cart"], .add-to-cart, .btn-add-cart',
                confidence: 0.85
            }
        ],
        "contact_dealer": [
            {
                selector: 'button:contains("contactar"), a:contains("concesionario"), form[class*="contact"]',
                confidence: 0.85,
                contextSelectors: ['[class*="dealer"]', '[class*="contact"]'],
                textPatterns: ['contactar', 'concesionario', 'dealer', 'contact']
            },
            {
                selector: 'a[href*="contact"], button[class*="contact"], .contact-btn',
                confidence: 0.75
            }
        ],
        "search_submit": [
            {
                selector: 'button[type="submit"], input[type="submit"], button:contains("buscar")',
                confidence: 0.9,
                contextSelectors: ['form[class*="search"]', '[class*="filter"]'],
                textPatterns: ['buscar', 'search', 'filtrar', 'filter']
            },
            {
                selector: '.search-btn, .btn-search, button[class*="search"]',
                confidence: 0.8
            }
        ],
        "view_product": [
            {
                selector: 'a[href*="product"], .product-link, [class*="product"][class*="link"]',
                confidence: 0.8,
                contextSelectors: ['[class*="product"]', '[class*="item"]']
            }
        ],
        "filter_by_price": [
            {
                selector: 'input[type="range"], select[name*="price"], input[name*="price"]',
                confidence: 0.9,
                contextSelectors: ['[class*="filter"]', 'form'],
                textPatterns: ['precio', 'price']
            }
        ],
        "schedule_test_drive": [
            {
                selector: 'button:contains("prueba"), a:contains("test drive"), .test-drive-btn',
                confidence: 0.85,
                textPatterns: ['prueba', 'test drive', 'probar']
            }
        ],
        "request_quote": [
            {
                selector: 'button:contains("cotizar"), a:contains("quote"), .quote-btn',
                confidence: 0.85,
                textPatterns: ['cotizar', 'quote', 'presupuesto']
            }
        ]
    };

    public detect(eventType: string): DetectionResult[] {
        const rules = this.heuristicRules[eventType];
        if (!rules) {
            return [];
        }

        const results: DetectionResult[] = [];
        
        for (const rule of rules) {
            const elements = this.findElementsByRule(rule);
            for (const element of elements) {
                const confidence = this.calculateConfidence(element, rule);
                if (confidence > 0.5) { // Minimum confidence threshold
                    results.push({
                        element,
                        eventType,
                        confidence,
                        selector: rule.selector
                    });
                }
            }
        }

        // Sort by confidence (highest first) and remove duplicates
        return this.deduplicateResults(results);
    }

    public detectAll(): Record<string, DetectionResult[]> {
        const allResults: Record<string, DetectionResult[]> = {};
        
        for (const eventType of Object.keys(this.heuristicRules)) {
            allResults[eventType] = this.detect(eventType);
        }
        
        return allResults;
    }

    private findElementsByRule(rule: HeuristicRule): HTMLElement[] {
        const elements: HTMLElement[] = [];
        
        // Handle text-based selectors (CSS doesn't support :contains natively)
        if (rule.selector.includes(':contains(')) {
            elements.push(...this.findElementsByText(rule));
        } else {
            try {
                const found = document.querySelectorAll(rule.selector);
                elements.push(...Array.from(found) as HTMLElement[]);
            } catch (e) {
                console.warn(`Invalid selector: ${rule.selector}`, e);
            }
        }

        return elements;
    }

    private findElementsByText(rule: HeuristicRule): HTMLElement[] {
        const elements: HTMLElement[] = [];
        const textPatterns = rule.textPatterns || [];
        
        // Extract text patterns from selector if available
        const selectorPatterns = rule.selector.match(/:contains\("([^"]+)"\)/g);
        if (selectorPatterns) {
            for (const match of selectorPatterns) {
                const text = match.match(/"([^"]+)"/)?.[1];
                if (text && !textPatterns.includes(text)) {
                    textPatterns.push(text);
                }
            }
        }

        // Get base selector without :contains()
        const baseSelector = rule.selector.replace(/:contains\("[^"]*"\)/g, '').replace(/,\s*$/g, '');
        
        if (textPatterns.length > 0) {
            for (const pattern of textPatterns) {
                const allElements = baseSelector ? 
                    document.querySelectorAll(baseSelector) : 
                    document.querySelectorAll('button, a, input[type="submit"], div, span');
                
                for (const el of allElements) {
                    const element = el as HTMLElement;
                    const text = element.textContent?.toLowerCase() || '';
                    const value = (element as HTMLInputElement).value?.toLowerCase() || '';
                    
                    if (text.includes(pattern.toLowerCase()) || value.includes(pattern.toLowerCase())) {
                        elements.push(element);
                    }
                }
            }
        }

        return elements;
    }

    private calculateConfidence(element: HTMLElement, rule: HeuristicRule): number {
        let confidence = rule.confidence;
        
        // Boost confidence if element is in the right context
        if (rule.contextSelectors) {
            const inContext = rule.contextSelectors.some(contextSelector => {
                return element.closest(contextSelector) !== null;
            });
            
            if (inContext) {
                confidence = Math.min(confidence + 0.1, 1.0);
            } else {
                confidence = Math.max(confidence - 0.2, 0.1);
            }
        }

        // Boost confidence for exact text matches
        if (rule.textPatterns) {
            const text = element.textContent?.toLowerCase() || '';
            const exactMatch = rule.textPatterns.some(pattern => 
                text.trim() === pattern.toLowerCase()
            );
            
            if (exactMatch) {
                confidence = Math.min(confidence + 0.15, 1.0);
            }
        }

        // Reduce confidence for hidden elements
        if (element.offsetParent === null && element.style.display !== 'none') {
            confidence = Math.max(confidence - 0.3, 0.1);
        }

        return confidence;
    }

    private deduplicateResults(results: DetectionResult[]): DetectionResult[] {
        const seen = new Set<HTMLElement>();
        const deduped: DetectionResult[] = [];
        
        // Sort by confidence first
        results.sort((a, b) => b.confidence - a.confidence);
        
        for (const result of results) {
            if (!seen.has(result.element)) {
                seen.add(result.element);
                deduped.push(result);
            }
        }
        
        return deduped;
    }

    /**
     * Add custom heuristic rules at runtime
     */
    public addRule(eventType: string, rule: HeuristicRule): void {
        if (!this.heuristicRules[eventType]) {
            this.heuristicRules[eventType] = [];
        }
        this.heuristicRules[eventType].push(rule);
    }

    /**
     * Get all supported event types
     */
    public getSupportedEventTypes(): string[] {
        return Object.keys(this.heuristicRules);
    }
}