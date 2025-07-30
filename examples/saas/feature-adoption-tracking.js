// ================================
// SAAS FEATURE ADOPTION TRACKING
// Sistema completo para trackear adopción de features en SaaS
// ================================

/**
 * Sistema de tracking para adopción de features en aplicaciones SaaS
 * Incluye: Onboarding, feature usage, engagement scoring, churn prediction
 */
class SaaSFeatureTracking {
    constructor(apiKey, config = {}) {
        this.apiKey = apiKey;
        this.config = {
            enableOnboarding: true,
            enableFeatureTracking: true,
            enableEngagementScoring: true,
            enableChurnPrediction: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutos
            ...config
        };
        
        this.sdk = null;
        this.userData = null;
        this.sessionData = {
            startTime: Date.now(),
            featuresUsed: new Set(),
            actions: [],
            engagementScore: 0
        };
        
        this.featureDefinitions = new Map();
        this.onboardingSteps = [];
        this.engagementRules = [];
        
        this.init();
    }

    async init() {
        try {
            const { TrackingPixelSDK } = await import('guiders-pixel');
            
            this.sdk = new TrackingPixelSDK({
                apiKey: this.apiKey,
                saas: {
                    enabled: true,
                    trackFeatureUsage: true,
                    trackOnboarding: true,
                    calculateEngagement: true
                },
                sessionTracking: {
                    enabled: true,
                    timeout: this.config.sessionTimeout
                }
            });

            await this.sdk.init();
            
            // Configurar definiciones de features
            this.setupFeatureDefinitions();
            
            // Configurar flujo de onboarding
            this.setupOnboardingFlow();
            
            // Configurar reglas de engagement
            this.setupEngagementRules();
            
            // Inicializar tracking
            this.startTracking();

            console.log('✅ SaaS Feature Tracking inicializado');

        } catch (error) {
            console.error('❌ Error inicializando SaaS Feature Tracking:', error);
        }
    }

    setupFeatureDefinitions() {
        // Definir features y su importancia para el negocio
        this.featureDefinitions.set('dashboard_view', {
            name: 'Dashboard View',
            category: 'core',
            importance: 'high',
            valueScore: 10,
            description: 'Usuario visualiza el dashboard principal'
        });

        this.featureDefinitions.set('create_project', {
            name: 'Create Project',
            category: 'core',
            importance: 'critical',
            valueScore: 50,
            description: 'Usuario crea un nuevo proyecto',
            onboardingStep: true
        });

        this.featureDefinitions.set('invite_teammate', {
            name: 'Invite Teammate',
            category: 'collaboration',
            importance: 'high',
            valueScore: 30,
            description: 'Usuario invita a un compañero de equipo'
        });

        this.featureDefinitions.set('export_report', {
            name: 'Export Report',
            category: 'advanced',
            importance: 'medium',
            valueScore: 20,
            description: 'Usuario exporta un reporte'
        });

        this.featureDefinitions.set('api_integration', {
            name: 'API Integration',
            category: 'advanced',
            importance: 'high',
            valueScore: 40,
            description: 'Usuario configura integración API'
        });

        this.featureDefinitions.set('billing_setup', {
            name: 'Billing Setup',
            category: 'monetization',
            importance: 'critical',
            valueScore: 100,
            description: 'Usuario configura facturación',
            conversionEvent: true
        });
    }

    setupOnboardingFlow() {
        this.onboardingSteps = [
            {
                id: 'welcome',
                name: 'Welcome Screen',
                description: 'Usuario ve pantalla de bienvenida',
                required: true,
                order: 1
            },
            {
                id: 'profile_setup',
                name: 'Profile Setup',
                description: 'Usuario completa perfil',
                required: true,
                order: 2
            },
            {
                id: 'first_project',
                name: 'First Project',
                description: 'Usuario crea primer proyecto',
                required: true,
                order: 3,
                feature: 'create_project'
            },
            {
                id: 'invite_team',
                name: 'Invite Team',
                description: 'Usuario invita equipo',
                required: false,
                order: 4,
                feature: 'invite_teammate'
            },
            {
                id: 'first_action',
                name: 'First Action',
                description: 'Usuario realiza primera acción en proyecto',
                required: true,
                order: 5
            }
        ];
    }

    setupEngagementRules() {
        this.engagementRules = [
            {
                name: 'daily_login',
                description: 'Login diario',
                score: 5,
                frequency: 'daily'
            },
            {
                name: 'feature_exploration',
                description: 'Uso de múltiples features',
                score: 10,
                condition: (session) => session.featuresUsed.size >= 3
            },
            {
                name: 'deep_engagement',
                description: 'Sesión larga (>15 min)',
                score: 15,
                condition: (session) => Date.now() - session.startTime > 15 * 60 * 1000
            },
            {
                name: 'collaboration',
                description: 'Uso de features colaborativas',
                score: 20,
                condition: (session) => session.featuresUsed.has('invite_teammate')
            }
        ];
    }

    startTracking() {
        // Trackear carga inicial de la aplicación
        this.trackAppLoad();
        
        // Configurar auto-tracking de features
        this.setupFeatureAutoTracking();
        
        // Configurar tracking de navegación
        this.setupNavigationTracking();
        
        // Iniciar monitoring de engagement
        this.startEngagementMonitoring();
        
        // Configurar eventos de salida
        this.setupExitTracking();
    }

    async trackAppLoad() {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'app_load',
            data: {
                app_version: this.getAppVersion(),
                user_plan: await this.getUserPlan(),
                session_id: this.generateSessionId(),
                load_time: Date.now(),
                referrer: document.referrer,
                
                // Datos del contexto
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                user_agent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        });

        console.log('📱 Carga de app trackeada');
    }

    setupFeatureAutoTracking() {
        // Auto-detectar uso de features basado en selectores
        const featureSelectors = {
            'dashboard_view': '.dashboard, [data-feature="dashboard"]',
            'create_project': '.create-project, [data-action="create-project"]',
            'invite_teammate': '.invite-user, [data-action="invite"]',
            'export_report': '.export-btn, [data-action="export"]',
            'api_integration': '.api-settings, [data-feature="api"]',
            'billing_setup': '.billing, [data-feature="billing"]'
        };

        Object.entries(featureSelectors).forEach(([featureId, selector]) => {
            document.addEventListener('click', async (e) => {
                if (e.target.matches(selector)) {
                    await this.trackFeatureUsage(featureId, {
                        trigger: 'click',
                        element: e.target.tagName.toLowerCase(),
                        context: this.getElementContext(e.target)
                    });
                }
            });
        });

        // Trackear views de páginas como features
        this.trackPageViews();
    }

    trackPageViews() {
        // Mapear rutas a features
        const routeFeatures = {
            '/dashboard': 'dashboard_view',
            '/projects/new': 'create_project',
            '/team': 'invite_teammate',
            '/reports': 'export_report',
            '/integrations': 'api_integration',
            '/billing': 'billing_setup'
        };

        // Trackear cambios de ruta (para SPAs)
        let currentPath = window.location.pathname;
        
        const trackRoute = (path) => {
            const feature = Object.entries(routeFeatures).find(([route]) => 
                path.startsWith(route)
            );
            
            if (feature) {
                this.trackFeatureUsage(feature[1], {
                    trigger: 'navigation',
                    route: path
                });
            }
        };

        // Trackear ruta inicial
        trackRoute(currentPath);

        // Observar cambios de ruta
        const observer = new MutationObserver(() => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                trackRoute(currentPath);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    async trackFeatureUsage(featureId, additionalData = {}) {
        if (!this.sdk || !this.featureDefinitions.has(featureId)) return;

        const feature = this.featureDefinitions.get(featureId);
        const now = Date.now();
        
        // Evitar duplicados recientes (debounce de 1 segundo)
        const lastUsage = this.sessionData.actions.find(a => 
            a.feature === featureId && now - a.timestamp < 1000
        );
        if (lastUsage) return;

        // Registrar en sesión
        this.sessionData.featuresUsed.add(featureId);
        this.sessionData.actions.push({
            feature: featureId,
            timestamp: now,
            ...additionalData
        });

        // Calcular métricas
        const usageCount = this.getUserFeatureUsageCount(featureId);
        const isFirstTime = usageCount === 0;
        const timeToFirstUse = isFirstTime ? this.getTimeToFirstUse(featureId) : null;

        // Trackear evento
        await this.sdk.track({
            event: 'feature_used',
            data: {
                feature_id: featureId,
                feature_name: feature.name,
                feature_category: feature.category,
                feature_importance: feature.importance,
                
                // Métricas de adopción
                is_first_time: isFirstTime,
                usage_count: usageCount + 1,
                time_to_first_use: timeToFirstUse,
                
                // Contexto de sesión
                session_duration: now - this.sessionData.startTime,
                features_used_in_session: this.sessionData.featuresUsed.size,
                
                // Datos adicionales
                ...additionalData,
                
                // Engagement scoring
                value_score: feature.valueScore,
                engagement_contribution: this.calculateFeatureEngagement(feature)
            }
        });

        console.log(`🎯 Feature usado: ${feature.name}`);

        // Actualizar engagement score
        this.updateEngagementScore(feature);

        // Verificar si es paso de onboarding
        if (feature.onboardingStep || this.isOnboardingStep(featureId)) {
            await this.trackOnboardingProgress(featureId);
        }

        // Verificar si es evento de conversión
        if (feature.conversionEvent) {
            await this.trackConversion(featureId, feature);
        }

        // Verificar achievement unlock
        this.checkAchievements(featureId);
    }

    async trackOnboardingProgress(featureId) {
        if (!this.sdk) return;

        const step = this.onboardingSteps.find(s => s.feature === featureId || s.id === featureId);
        if (!step) return;

        const completedSteps = this.getCompletedOnboardingSteps();
        const totalSteps = this.onboardingSteps.filter(s => s.required).length;
        const progress = (completedSteps.length / totalSteps) * 100;

        await this.sdk.track({
            event: 'onboarding_step_completed',
            data: {
                step_id: step.id,
                step_name: step.name,
                step_order: step.order,
                step_required: step.required,
                
                // Progress metrics
                steps_completed: completedSteps.length,
                total_steps: totalSteps,
                progress_percentage: progress,
                
                // Timing
                time_to_complete_step: this.getTimeToCompleteStep(step.id),
                total_onboarding_time: this.getTotalOnboardingTime()
            }
        });

        // Verificar si onboarding está completo
        if (progress >= 100) {
            await this.trackOnboardingCompleted();
        }

        console.log(`📋 Paso de onboarding completado: ${step.name} (${progress}%)`);
    }

    async trackOnboardingCompleted() {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'onboarding_completed',
            data: {
                completion_time: this.getTotalOnboardingTime(),
                steps_completed: this.getCompletedOnboardingSteps().length,
                optional_steps_completed: this.getCompletedOptionalSteps().length,
                completion_rate: this.getOnboardingCompletionRate()
            }
        });

        console.log('🎉 Onboarding completado');
    }

    async trackConversion(featureId, feature) {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'feature_conversion',
            isConversion: true,
            data: {
                feature_id: featureId,
                feature_name: feature.name,
                conversion_type: 'feature_adoption',
                conversion_value: feature.valueScore,
                
                // Context
                time_to_convert: this.getTimeToFirstUse(featureId),
                session_actions_before_conversion: this.sessionData.actions.length,
                features_explored_before_conversion: this.sessionData.featuresUsed.size
            }
        });

        console.log(`💰 Conversión de feature: ${feature.name}`);
    }

    setupNavigationTracking() {
        // Trackear patrones de navegación
        let navigationPath = [];
        
        const trackNavigation = (action, details = {}) => {
            navigationPath.push({
                action,
                timestamp: Date.now(),
                path: window.location.pathname,
                ...details
            });

            // Mantener solo últimas 50 navegaciones
            if (navigationPath.length > 50) {
                navigationPath = navigationPath.slice(-50);
            }
        };

        // Trackear clicks en navegación
        document.addEventListener('click', (e) => {
            if (e.target.matches('nav a, .nav-link, [data-navigation]')) {
                trackNavigation('nav_click', {
                    link_text: e.target.textContent.trim(),
                    destination: e.target.href
                });
            }
        });

        // Trackear uso del back button
        window.addEventListener('popstate', () => {
            trackNavigation('back_button');
        });

        // Enviar patrones de navegación periódicamente
        setInterval(async () => {
            if (navigationPath.length > 0) {
                await this.trackNavigationPattern(navigationPath);
                navigationPath = [];
            }
        }, 60000); // Cada minuto
    }

    async trackNavigationPattern(pattern) {
        if (!this.sdk) return;

        const summary = this.analyzeNavigationPattern(pattern);

        await this.sdk.track({
            event: 'navigation_pattern',
            data: {
                pattern_length: pattern.length,
                unique_pages: summary.uniquePages,
                back_button_usage: summary.backButtonCount,
                navigation_efficiency: summary.efficiency,
                most_visited_section: summary.mostVisited,
                session_id: this.generateSessionId()
            }
        });
    }

    startEngagementMonitoring() {
        // Calcular engagement score cada 30 segundos
        setInterval(() => {
            this.updateSessionEngagement();
        }, 30000);

        // Trackear idle time
        this.setupIdleTracking();
        
        // Trackear mouse movement y keyboard activity
        this.setupActivityTracking();
    }

    setupIdleTracking() {
        let idleTime = 0;
        let idleTimer;

        const resetIdleTime = () => {
            idleTime = 0;
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                this.trackIdleSession();
            }, 5 * 60 * 1000); // 5 minutos de idle
        };

        document.addEventListener('mousemove', resetIdleTime);
        document.addEventListener('keypress', resetIdleTime);
        document.addEventListener('click', resetIdleTime);
        document.addEventListener('scroll', resetIdleTime);

        resetIdleTime();
    }

    async trackIdleSession() {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'user_idle',
            data: {
                session_duration: Date.now() - this.sessionData.startTime,
                features_used: this.sessionData.featuresUsed.size,
                actions_count: this.sessionData.actions.length,
                engagement_score: this.sessionData.engagementScore
            }
        });

        console.log('😴 Usuario inactivo detectado');
    }

    setupActivityTracking() {
        let activityScore = 0;
        let lastActivity = Date.now();

        const trackActivity = (type, intensity = 1) => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;
            
            // Penalizar actividad muy frecuente (posible bot)
            if (timeSinceLastActivity < 100) return;
            
            activityScore += intensity;
            lastActivity = now;
        };

        document.addEventListener('mousemove', () => trackActivity('mouse', 0.1));
        document.addEventListener('keydown', () => trackActivity('keyboard', 0.5));
        document.addEventListener('click', () => trackActivity('click', 1));
        document.addEventListener('scroll', () => trackActivity('scroll', 0.3));

        // Reportar actividad cada minuto
        setInterval(async () => {
            if (activityScore > 0) {
                await this.trackUserActivity(activityScore);
                activityScore = 0;
            }
        }, 60000);
    }

    async trackUserActivity(score) {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'user_activity',
            data: {
                activity_score: score,
                session_duration: Date.now() - this.sessionData.startTime,
                activity_level: this.categorizeActivityLevel(score)
            }
        });
    }

    setupExitTracking() {
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Detectar exit intent (mouse sale de viewport)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 0) {
                this.trackExitIntent();
            }
        });
    }

    async trackSessionEnd() {
        if (!this.sdk) return;

        const sessionDuration = Date.now() - this.sessionData.startTime;
        const features = Array.from(this.sessionData.featuresUsed);

        // Usar sendBeacon para asegurar envío
        navigator.sendBeacon('/api/guiders/track', JSON.stringify({
            event: 'session_end',
            data: {
                session_duration: sessionDuration,
                features_used: features,
                features_count: features.length,
                actions_count: this.sessionData.actions.length,
                engagement_score: this.sessionData.engagementScore,
                
                // Insights de la sesión
                most_used_category: this.getMostUsedCategory(),
                feature_adoption_rate: this.calculateFeatureAdoptionRate(),
                session_value_score: this.calculateSessionValue(),
                
                // Predicción de churn
                churn_risk_score: this.calculateChurnRisk()
            }
        }));
    }

    async trackExitIntent() {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'exit_intent',
            data: {
                session_duration: Date.now() - this.sessionData.startTime,
                features_used: this.sessionData.featuresUsed.size,
                current_page: window.location.pathname,
                engagement_score: this.sessionData.engagementScore
            }
        });
    }

    // ================================
    // MÉTODOS DE CÁLCULO Y ANÁLISIS
    // ================================

    updateEngagementScore(feature) {
        const baseScore = feature.valueScore || 10;
        const categoryMultiplier = this.getCategoryMultiplier(feature.category);
        const firstTimeBonus = this.sessionData.featuresUsed.has(feature.id) ? 0 : 10;
        
        const scoreIncrease = (baseScore * categoryMultiplier) + firstTimeBonus;
        this.sessionData.engagementScore += scoreIncrease;
    }

    calculateFeatureEngagement(feature) {
        const usageFrequency = this.getUserFeatureUsageCount(feature.id);
        const timeToFirstUse = this.getTimeToFirstUse(feature.id);
        const categoryImportance = this.getCategoryMultiplier(feature.category);
        
        return Math.round(
            (feature.valueScore * categoryImportance * Math.log(usageFrequency + 1)) / 
            Math.max(timeToFirstUse / 1000 / 60, 1) // Normalizar por minutos
        );
    }

    calculateChurnRisk() {
        let riskScore = 0;
        
        // Factor 1: Tiempo desde último uso de feature crítica
        const criticalFeatures = Array.from(this.featureDefinitions.entries())
            .filter(([_, feature]) => feature.importance === 'critical');
        
        if (criticalFeatures.length === 0) {
            riskScore += 30;
        }
        
        // Factor 2: Engagement score bajo
        if (this.sessionData.engagementScore < 50) {
            riskScore += 25;
        }
        
        // Factor 3: Pocas features usadas
        if (this.sessionData.featuresUsed.size < 3) {
            riskScore += 20;
        }
        
        // Factor 4: Sesión corta
        const sessionMinutes = (Date.now() - this.sessionData.startTime) / 60000;
        if (sessionMinutes < 2) {
            riskScore += 15;
        }
        
        // Factor 5: No completó onboarding
        if (!this.isOnboardingComplete()) {
            riskScore += 10;
        }
        
        return Math.min(riskScore, 100);
    }

    getMostUsedCategory() {
        const categoryCount = {};
        
        this.sessionData.featuresUsed.forEach(featureId => {
            const feature = this.featureDefinitions.get(featureId);
            if (feature) {
                categoryCount[feature.category] = (categoryCount[feature.category] || 0) + 1;
            }
        });
        
        return Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    }

    calculateFeatureAdoptionRate() {
        const totalFeatures = this.featureDefinitions.size;
        const usedFeatures = this.sessionData.featuresUsed.size;
        
        return Math.round((usedFeatures / totalFeatures) * 100);
    }

    calculateSessionValue() {
        let totalValue = 0;
        
        this.sessionData.featuresUsed.forEach(featureId => {
            const feature = this.featureDefinitions.get(featureId);
            if (feature) {
                totalValue += feature.valueScore;
            }
        });
        
        return totalValue;
    }

    // ================================
    // MÉTODOS UTILITARIOS
    // ================================

    getCategoryMultiplier(category) {
        const multipliers = {
            'core': 1.5,
            'collaboration': 1.3,
            'advanced': 1.1,
            'monetization': 2.0
        };
        return multipliers[category] || 1.0;
    }

    categorizeActivityLevel(score) {
        if (score > 50) return 'high';
        if (score > 20) return 'medium';
        if (score > 5) return 'low';
        return 'minimal';
    }

    getUserFeatureUsageCount(featureId) {
        // En implementación real, obtener de localStorage o API
        const usage = localStorage.getItem(`feature_usage_${featureId}`);
        return usage ? parseInt(usage) : 0;
    }

    getTimeToFirstUse(featureId) {
        // Calcular tiempo desde registro hasta primer uso
        const userRegistration = this.getUserRegistrationTime();
        const now = Date.now();
        return now - userRegistration;
    }

    getUserRegistrationTime() {
        // En implementación real, obtener de API
        return parseInt(localStorage.getItem('user_registration_time')) || Date.now();
    }

    isOnboardingStep(featureId) {
        return this.onboardingSteps.some(step => step.feature === featureId);
    }

    getCompletedOnboardingSteps() {
        // En implementación real, obtener de localStorage o API
        const completed = localStorage.getItem('completed_onboarding_steps');
        return completed ? JSON.parse(completed) : [];
    }

    getCompletedOptionalSteps() {
        const completedSteps = this.getCompletedOnboardingSteps();
        return completedSteps.filter(stepId => {
            const step = this.onboardingSteps.find(s => s.id === stepId);
            return step && !step.required;
        });
    }

    isOnboardingComplete() {
        const completedSteps = this.getCompletedOnboardingSteps();
        const requiredSteps = this.onboardingSteps.filter(s => s.required);
        return requiredSteps.every(step => completedSteps.includes(step.id));
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getAppVersion() {
        return document.querySelector('meta[name="app-version"]')?.content || '1.0.0';
    }

    async getUserPlan() {
        // En implementación real, obtener de API
        return localStorage.getItem('user_plan') || 'free';
    }

    getElementContext(element) {
        const context = {
            tag: element.tagName.toLowerCase(),
            classes: Array.from(element.classList),
            id: element.id,
            text: element.textContent?.trim().substring(0, 50)
        };
        
        // Añadir contexto del parent
        if (element.parentElement) {
            context.parent = {
                tag: element.parentElement.tagName.toLowerCase(),
                classes: Array.from(element.parentElement.classList),
                id: element.parentElement.id
            };
        }
        
        return context;
    }

    checkAchievements(featureId) {
        // Sistema simple de achievements
        const achievements = {
            'first_project': {
                condition: () => this.sessionData.featuresUsed.has('create_project'),
                name: 'First Project Created'
            },
            'collaborator': {
                condition: () => this.sessionData.featuresUsed.has('invite_teammate'),
                name: 'Team Collaborator'
            },
            'power_user': {
                condition: () => this.sessionData.featuresUsed.size >= 5,
                name: 'Power User'
            }
        };

        Object.entries(achievements).forEach(([id, achievement]) => {
            if (achievement.condition() && !this.hasAchievement(id)) {
                this.unlockAchievement(id, achievement.name);
            }
        });
    }

    hasAchievement(achievementId) {
        const achievements = JSON.parse(localStorage.getItem('user_achievements') || '[]');
        return achievements.includes(achievementId);
    }

    async unlockAchievement(achievementId, name) {
        // Guardar achievement
        const achievements = JSON.parse(localStorage.getItem('user_achievements') || '[]');
        achievements.push(achievementId);
        localStorage.setItem('user_achievements', JSON.stringify(achievements));

        // Trackear achievement
        if (this.sdk) {
            await this.sdk.track({
                event: 'achievement_unlocked',
                data: {
                    achievement_id: achievementId,
                    achievement_name: name,
                    session_features: Array.from(this.sessionData.featuresUsed),
                    unlock_time: Date.now()
                }
            });
        }

        console.log(`🏆 Achievement desbloqueado: ${name}`);
    }
}

// ================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Auto-inicializar para aplicaciones SaaS
    const isSaaSApp = (
        document.querySelector('[data-app-type="saas"]') ||
        document.querySelector('.saas-app') ||
        window.location.pathname.includes('/app/') ||
        document.title.includes('Dashboard')
    );

    if (isSaaSApp) {
        const apiKey = window.guidersConfig?.apiKey || 
                      document.querySelector('[data-guiders-api-key]')?.dataset.guidersApiKey ||
                      'YOUR_API_KEY_HERE';

        if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
            window.saasTracker = new SaaSFeatureTracking(apiKey);
            console.log('🚀 SaaS Feature Tracking inicializado automáticamente');
        } else {
            console.warn('⚠️ API Key de Guiders no configurada para SaaS Feature Tracking');
        }
    }
});

// Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaaSFeatureTracking;
} else if (typeof window !== 'undefined') {
    window.SaaSFeatureTracking = SaaSFeatureTracking;
}

// ================================
// EJEMPLO DE USO MANUAL
// ================================

/*
// Inicializar manualmente:
const tracker = new SaaSFeatureTracking('tu-api-key', {
    enableChurnPrediction: true,
    sessionTimeout: 45 * 60 * 1000 // 45 minutos
});

// Trackear features específicas:
await tracker.trackFeatureUsage('create_project', {
    project_type: 'web_app',
    template_used: 'react'
});

// Obtener métricas:
console.log('Engagement Score:', tracker.sessionData.engagementScore);
console.log('Churn Risk:', tracker.calculateChurnRisk());
console.log('Features Used:', Array.from(tracker.sessionData.featuresUsed));

// Verificar onboarding:
console.log('Onboarding Complete:', tracker.isOnboardingComplete());
*/