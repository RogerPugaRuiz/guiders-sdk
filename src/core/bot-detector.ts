// src/core/bot-detector.ts

/**
 * A class that detects if the visitor is likely a bot by performing various checks.
 */
export class BotDetector {
    private score: number;
    private checks: Array<{ name: string; result: boolean }>;
    
    constructor() {
        this.score = 0;
        this.checks = [];
    }
    
    /**
     * Runs bot detection checks and returns the result.
     * @returns An object with bot detection results.
     */
    public async detect(): Promise<{ 
        isBot: boolean; 
        probability: number;
        details: Array<{ name: string; result: boolean }>;
    }> {
        // Ejecutar todas las verificaciones
        this.checkUserAgent();
        this.checkBrowserFeatures();
        this.checkTiming();
        await this.checkBehavior();
        
        // Calcular probabilidad
        const botProbability = this.score / this.checks.length;
        return {
            isBot: botProbability > 0.6,
            probability: botProbability,
            details: this.checks
        };
    }
    
    /**
     * Checks the user agent string for bot identifiers.
     */
    private checkUserAgent(): void {
        const isBot = /bot|crawler|spider|scraper/i.test(navigator.userAgent);
        this.addCheck('userAgent', isBot, isBot ? 1 : 0);
    }
    
    /**
     * Checks for suspicious browser features that might indicate a bot.
     */
    private checkBrowserFeatures(): void {
        const suspicious = 
            navigator.webdriver ||
            !navigator.plugins.length ||
            !window.MouseEvent;
        this.addCheck('browserFeatures', suspicious, suspicious ? 1 : 0);
    }
    
    /**
     * Checks for suspiciously fast page load times.
     */
    private checkTiming(): void {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        const tooFast = loadTime < 100; // Carga sospechosamente rápida
        this.addCheck('timing', tooFast, tooFast ? 0.8 : 0);
    }
    
    /**
     * Checks for user interactions within a short timeframe.
     * @returns A promise that resolves after checking for interactions.
     */
    private checkBehavior(): Promise<void> {
        return new Promise(resolve => {
            let hasInteraction = false;
            
            const events = ['click', 'mousemove', 'keypress'];
            events.forEach(event => {
                document.addEventListener(event, () => {
                    hasInteraction = true;
                }, { once: true });
            });
            
            setTimeout(() => {
                this.addCheck('behavior', !hasInteraction, hasInteraction ? 0 : 1);
                resolve();
            }, 5000);
        });
    }
    
    /**
     * Adds a check result to the checks array and updates the score.
     * @param name The name of the check.
     * @param result The result of the check (true if suspicious).
     * @param score The score to add for this check.
     */
    private addCheck(name: string, result: boolean, score: number): void {
        this.checks.push({ name, result });
        this.score += score;
    }
}