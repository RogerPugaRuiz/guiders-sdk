<?php
/**
 * Public functionality for Guiders WP Plugin with error protection
 *
 * @since 1.0.0
 * @version 1.2.0 - Added error handling
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class GuidersPublic {

    /**
     * Plugin settings
     * @var array
     */
    private $settings;

    /**
     * Constructor with error protection
     */
    public function __construct() {
        try {
            $this->settings = get_option('guiders_wp_plugin_settings', array());
            $this->initHooks();
        } catch (Throwable $e) {
            error_log('[Guiders Public] Error in constructor: ' . $e->getMessage());
            // Don't throw - allow WordPress to continue without frontend functionality
        }
    }
    
    /**
     * Initialize public hooks
     */
    private function initHooks() {
        // Register with WP Consent API (if available)
        $this->registerWithWPConsentAPI();

        // Only load if plugin is enabled and API key is set
        if ($this->isPluginActive()) {
            // Enqueue scripts and styles
            add_action('wp_enqueue_scripts', array($this, 'enqueueAssets'));

            // Add SDK initialization script to footer
            add_action('wp_footer', array($this, 'addSDKScript'), 20);

            // Add preconnect headers for performance
            add_action('wp_head', array($this, 'addPreconnectHeaders'), 1);
        }
    }

    /**
     * Register plugin with WP Consent API
     * This makes the plugin officially compatible with cookie consent plugins
     */
    private function registerWithWPConsentAPI() {
        // Register this plugin as WP Consent API compatible
        $plugin = plugin_basename(GUIDERS_WP_PLUGIN_PLUGIN_FILE);
        add_filter("wp_consent_api_registered_{$plugin}", '__return_true');
    }
    
    /**
     * Check if plugin is active and properly configured
     */
    private function isPluginActive() {
        return !empty($this->settings['enabled']) && !empty($this->settings['api_key']);
    }
    
    /**
     * Enqueue scripts and styles with error protection
     */
    public function enqueueAssets() {
        try {
            $sdk_file = GUIDERS_WP_PLUGIN_PLUGIN_URL . 'assets/js/guiders-sdk.js';

            // Verify SDK file exists
            $sdk_file_path = GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'assets/js/guiders-sdk.js';
            if (!file_exists($sdk_file_path)) {
                error_log('[Guiders Public] SDK file not found: ' . $sdk_file_path);
                // Don't enqueue if file doesn't exist
                return;
            }

            // Enqueue the Guiders SDK
            wp_enqueue_script(
                'guiders-sdk',
                $sdk_file,
                array(),
                GUIDERS_WP_PLUGIN_VERSION,
                true // Load in footer
            );

            // Add SDK configuration (exponer exactamente como GUIDERS_CONFIG porque el bundle lo busca con ese nombre)
            $config = $this->getSDKConfig();
            wp_localize_script('guiders-sdk', 'GUIDERS_CONFIG', $config);

            // Add inline styles for better chat appearance if needed
            $this->addInlineStyles();

        } catch (Throwable $e) {
            error_log('[Guiders Public] Error enqueuing assets: ' . $e->getMessage());
            // Continue without SDK - WordPress still works
        }
    }
    
    /**
     * Get SDK configuration
     */
    private function getSDKConfig() {
        $config = array(
            'apiKey' => $this->settings['api_key'],
            'environment' => isset($this->settings['environment']) ? $this->settings['environment'] : 'production',
            'features' => array(
                'chat' => isset($this->settings['chat_enabled']) ? $this->settings['chat_enabled'] : true,
                'tracking' => isset($this->settings['tracking_enabled']) ? $this->settings['tracking_enabled'] : true,
                'heuristicDetection' => isset($this->settings['heuristic_detection']) ? $this->settings['heuristic_detection'] : true,
            ),
            'heuristicConfig' => array(
                'confidenceThreshold' => isset($this->settings['confidence_threshold']) ? floatval($this->settings['confidence_threshold']) : 0.7,
                'enabled' => isset($this->settings['heuristic_detection']) ? $this->settings['heuristic_detection'] : true,
                'fallbackToManual' => true
            ),
            'sessionTracking' => array(
                'enabled' => true,
                'heartbeatInterval' => 30000,
                'trackBackgroundTime' => false
            ),
            'wordpress' => array(
                'version' => get_bloginfo('version'),
                'theme' => get_template(),
                'isWooCommerce' => class_exists('WooCommerce'),
                'isEDD' => class_exists('Easy_Digital_Downloads'),
                'pageType' => $this->getPageType()
            ),
            'chatConsentMessage' => $this->getChatConsentMessageConfig(),
            'activeHours' => $this->getActiveHoursConfig(),
            'commercialAvailability' => $this->getCommercialAvailabilityConfig(),
            'requireConsent' => isset($this->settings['require_consent']) ? $this->settings['require_consent'] : false,
            'consentBanner' => $this->getConsentBannerConfig(),
            'chatPosition' => $this->getChatPositionConfig(),
            'mobileDetection' => $this->getMobileDetectionConfig(),
            'autoFlush' => isset($this->settings['auto_flush']) ? $this->settings['auto_flush'] : true,
            'flushInterval' => isset($this->settings['flush_interval']) ? intval($this->settings['flush_interval']) : 5000,
            'trackingV2' => $this->getTrackingV2Config(),
            'presence' => $this->getPresenceConfig(),
            'autoOpenChatOnMessage' => isset($this->settings['auto_open_chat_on_message']) ? (bool)$this->settings['auto_open_chat_on_message'] : true
        );

        // Add environment-specific endpoints
        if ($config['environment'] === 'development') {
            $config['endpoint'] = 'http://localhost:3000/api';
            $config['webSocketEndpoint'] = 'ws://localhost:3000';
        } else {
            // Endpoints producción actualizados a dominio (evita mixed-content y facilita TLS)
            $config['endpoint'] = 'https://guiders.es/api';
            $config['webSocketEndpoint'] = 'wss://guiders.es';
        }

    // Auto-init control configurable:
    //  - immediate/domready/delayed: dejamos que el bundle realice su auto init (no bloqueamos) o usamos nuestro script si se desea lógica adicional.
    //  - manual: bloqueamos auto-init interno del bundle y exponemos window.initGuiders() para que el usuario decida cuándo iniciar.
    $settings = get_option('guiders_wp_plugin_settings', array());
    $mode = isset($settings['auto_init_mode']) ? $settings['auto_init_mode'] : 'domready';
    $delay = isset($settings['auto_init_delay']) ? intval($settings['auto_init_delay']) : 500;
    $config['autoInitMode'] = $mode;
    $config['autoInitDelay'] = $delay;
    // Solo establecemos preventAutoInit=true cuando el modo es manual; esto evita confundir al usuario viendo siempre el log de auto-init desactivado.
    $config['preventAutoInit'] = ($mode === 'manual');
        
        return $config;
    }
    
    /**
     * Get current page type for better context
     */
    private function getPageType() {
        if (is_front_page()) {
            return 'home';
        } elseif (function_exists('is_shop') && (is_shop() || is_product_category() || is_product_tag())) {
            return 'ecommerce';
        } elseif (function_exists('is_product') && is_product()) {
            return 'product_detail';
        } elseif (function_exists('is_cart') && is_cart()) {
            return 'cart';
        } elseif (function_exists('is_checkout') && is_checkout()) {
            return 'checkout';
        } elseif (function_exists('is_account_page') && is_account_page()) {
            return 'account';
        } elseif ($this->isContactPage()) {
            return 'contact';
        } elseif (is_search()) {
            return 'search_results';
        } elseif (is_category() || is_tag() || is_archive()) {
            return 'archive';
        } elseif (is_single()) {
            return 'post_detail';
        } elseif (is_page()) {
            return 'page';
        }
        
        return 'unknown';
    }
    
    /**
     * Check if current page is a contact page
     */
    private function isContactPage() {
        global $post;
        
        if (!$post) {
            return false;
        }
        
        // Check common contact page slugs and titles
        $contact_indicators = array('contact', 'contacto', 'contact-us', 'contactanos', 'contactenos');
        
        return in_array($post->post_name, $contact_indicators) || 
               stripos($post->post_title, 'contact') !== false ||
               stripos($post->post_title, 'contacto') !== false;
    }
    
    /**
     * Add SDK initialization script
     */
    public function addSDKScript() {
        ?>
    <script type="text/javascript">
    (function() {
            // Configuración del sistema de cookies desde WordPress
            var cookieConfig = <?php echo json_encode(array(
                'system' => isset($this->settings['cookie_consent_system']) ? $this->settings['cookie_consent_system'] : 'auto',
                'wp_consent_api_enabled' => isset($this->settings['wp_consent_api_sync_enabled']) ? $this->settings['wp_consent_api_sync_enabled'] : true,
                'debug' => isset($this->settings['cookie_consent_debug']) ? $this->settings['cookie_consent_debug'] : false
            )); ?>;

            // Log de configuración (ejecutado inmediatamente al cargar el script)
            console.log('[Guiders WP] 🔧 Configuración inicial:', cookieConfig);

            // Exponer para debugging
            window.guidersCookieConfig = cookieConfig;

            // WP Consent API Integration
            // Sincroniza el consentimiento del plugin de cookies con Guiders SDK
            // Retorna: true si detectó WP Consent API, false si no
            function setupConsentSync() {
                // Verificar si la sincronización está habilitada
                if (!cookieConfig.wp_consent_api_enabled) {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sincronización WP Consent API desactivada en configuración');
                    }
                    return false;
                }

                // Verificar si se debe forzar el sistema interno
                if (cookieConfig.system === 'internal') {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sistema configurado como "interno" - saltando WP Consent API');
                    }
                    return false;
                }

                // Verificar si WP Consent API está disponible
                var hasWPConsentAPI = typeof wp_has_consent !== 'undefined' && typeof wp_set_consent !== 'undefined';

                if (!hasWPConsentAPI) {
                    if (cookieConfig.debug || cookieConfig.system === 'wp_consent_api') {
                        console.log('[Guiders WP] WP Consent API no detectada');
                    }
                    return false;
                }

                // Si el sistema es 'custom', no hacer nada (el usuario debe implementar su lógica)
                if (cookieConfig.system === 'custom') {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sistema configurado como "personalizado" - saltando sincronización automática');
                    }
                    return false;
                }

                if (cookieConfig.debug) {
                    console.log('[Guiders WP] WP Consent API detectada - sincronizando consentimiento');
                    console.log('[Guiders WP] Configuración:', cookieConfig);
                }

                // Mapeo de categorías: WP Consent API → Guiders SDK
                var categoryMap = {
                    'functional': 'functional',           // Cookies funcionales
                    'statistics': 'analytics',            // Estadísticas → Analytics
                    'marketing': 'personalization'        // Marketing → Personalización
                };

                // Función para sincronizar consentimiento inicial desde WP Consent API a Guiders
                function syncInitialConsent() {
                    if (!window.guiders || !window.guiders.grantConsentWithPreferences) {
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] SDK no listo para sincronizar consentimiento');
                        }
                        return;
                    }

                    var guidersConsent = {};
                    var hasAnyConsent = false;

                    // Leer estado de consentimiento de cada categoría
                    Object.keys(categoryMap).forEach(function(wpCategory) {
                        var guidersCategory = categoryMap[wpCategory];
                        var hasConsent = wp_has_consent(wpCategory);
                        guidersConsent[guidersCategory] = hasConsent;
                        if (hasConsent) hasAnyConsent = true;
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] Consentimiento sincronizado: ' + wpCategory + ' → ' + guidersCategory + ' = ' + hasConsent);
                        }
                    });

                    // Actualizar consentimiento en Guiders SDK
                    if (hasAnyConsent) {
                        window.guiders.grantConsentWithPreferences(guidersConsent);
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] Consentimiento inicial sincronizado con Guiders SDK');
                        }
                    }
                }

                // Función para escuchar cambios de consentimiento en tiempo real
                function setupConsentChangeListener() {
                    // Escuchar cambios en cada categoría
                    Object.keys(categoryMap).forEach(function(wpCategory) {
                        var guidersCategory = categoryMap[wpCategory];

                        document.addEventListener('wp_listen_for_consent_change', function(event) {
                            if (!window.guiders || !window.guiders.grantConsentWithPreferences) return;

                            // Verificar si el cambio afecta a esta categoría
                            var newConsent = wp_has_consent(wpCategory);

                            // Actualizar Guiders con el nuevo estado
                            var update = {};
                            update[guidersCategory] = newConsent;
                            window.guiders.grantConsentWithPreferences(update);

                            if (cookieConfig.debug) {
                                console.log('[Guiders WP] Consentimiento actualizado: ' + wpCategory + ' → ' + guidersCategory + ' = ' + newConsent);
                            }
                        });
                    });

                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Listener de cambios de consentimiento activado');
                    }
                }

                // Ejecutar sincronización inicial y configurar listener
                syncInitialConsent();
                setupConsentChangeListener();

                return true; // WP Consent API detectada y configurada
            }

            // Moove GDPR Integration (GDPR Cookie Compliance)
            // Integración con el plugin "GDPR Cookie Compliance" de Moove
            // Retorna: true si detectó Moove GDPR, false si no
            function setupMooveGDPRSync() {
                // Verificar si debe sincronizarse
                if (!cookieConfig.wp_consent_api_enabled) {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sincronización de cookies desactivada');
                    }
                    return false;
                }

                // Verificar si se debe forzar el sistema interno
                if (cookieConfig.system === 'internal') {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sistema configurado como "interno" - saltando Moove GDPR');
                    }
                    return false;
                }

                // Verificar si Moove GDPR está presente
                var hasMooveGDPR = typeof moove_gdpr_popup !== 'undefined' || document.getElementById('moove_gdpr_cookie_modal') !== null;

                if (!hasMooveGDPR) {
                    if (cookieConfig.debug && cookieConfig.system === 'custom') {
                        console.log('[Guiders WP] Moove GDPR no detectado');
                    }
                    return false;
                }

                if (cookieConfig.debug) {
                    console.log('[Guiders WP] Moove GDPR detectado - configurando sincronización');
                }

                // Función helper para leer cookies
                function getCookie(name) {
                    var nameEQ = name + "=";
                    var ca = document.cookie.split(';');
                    for(var i = 0; i < ca.length; i++) {
                        var c = ca[i];
                        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                    }
                    return null;
                }

                // Función para leer el consentimiento de Moove GDPR
                function readMooveConsent() {
                    // MÉTODO 1: Leer cookie moove_gdpr_popup (formato JSON)
                    // Configuración de 3 categorías: {"strict":"1","performance":"1","targeting":"1"}
                    // Configuración de 5 categorías: {"strict":"1","thirdparty":"1","advanced":"1","performance":"1","preference":"1"}
                    var cookieValue = getCookie('moove_gdpr_popup');

                    if (!cookieValue) {
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] 🔍 Cookie moove_gdpr_popup no encontrada - Moove GDPR no instalado o usuario aún no ha interactuado');
                        }
                        return null;
                    }

                    try {
                        // Decodificar URL encoding
                        var decoded = decodeURIComponent(cookieValue);
                        var cookieData = JSON.parse(decoded);

                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] ✅ Moove GDPR detectado - Cookie moove_gdpr_popup:', cookieData);
                        }

                        // MAPEO FLEXIBLE: Detecta automáticamente si usa 3 o 5 categorías
                        //
                        // CATEGORÍAS COMUNES (3 categorías):
                        // - strict (strictly necessary) -> functional
                        // - performance (analytics) -> analytics
                        // - targeting/marketing -> personalization
                        //
                        // CATEGORÍAS EXTENDIDAS (5 categorías):
                        // - strict (strictly necessary) -> functional
                        // - performance (analytics) -> analytics
                        // - thirdparty (third party cookies) -> analytics
                        // - advanced (advanced/marketing) -> personalization
                        // - preference (user preferences) -> personalization

                        var consent = {
                            functional: cookieData.strict === '1',
                            analytics: false,
                            personalization: false
                        };

                        // Analytics: performance, thirdparty
                        if (cookieData.performance === '1') consent.analytics = true;
                        if (cookieData.thirdparty === '1') consent.analytics = true;

                        // Personalization: targeting, marketing, advanced, preference
                        if (cookieData.targeting === '1') consent.personalization = true;
                        if (cookieData.marketing === '1') consent.personalization = true;
                        if (cookieData.advanced === '1') consent.personalization = true;
                        if (cookieData.preference === '1') consent.personalization = true;

                        console.log('[Guiders WP] 📋 Moove GDPR - Categorías detectadas y mapeadas:', {
                            'raw_cookie': cookieData,
                            'mapped': {
                                'functional (strict)': consent.functional,
                                'analytics (performance/thirdparty)': consent.analytics,
                                'personalization (targeting/marketing/advanced/preference)': consent.personalization
                            }
                        });

                        return consent;
                    } catch (e) {
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] Error parsing Moove cookie:', e);
                        }
                    }

                    // MÉTODO 2 (FALLBACK): Leer localStorage (método antiguo)
                    var functional = localStorage.getItem('moove_gdpr_popup') === '1' ||
                                   localStorage.getItem('moove_gdpr_strict') === '1';
                    var analytics = localStorage.getItem('moove_gdpr_performance') === '1' ||
                                  localStorage.getItem('moove_gdpr_thirdparty') === '1';
                    var personalization = localStorage.getItem('moove_gdpr_targeting') === '1' ||
                                        localStorage.getItem('moove_gdpr_marketing') === '1' ||
                                        localStorage.getItem('moove_gdpr_advanced') === '1' ||
                                        localStorage.getItem('moove_gdpr_preference') === '1';

                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Moove localStorage fallback:', {
                            functional: functional,
                            analytics: analytics,
                            personalization: personalization
                        });
                    }

                    return {
                        functional: functional,
                        analytics: analytics,
                        personalization: personalization
                    };
                }

                // Función para sincronizar con Guiders SDK (con reintentos automáticos)
                var syncRetries = 0;
                var maxSyncRetries = 20; // 20 reintentos x 500ms = 10 segundos máximo

                function syncMooveToGuiders() {
                    if (!window.guiders || !window.guiders.grantConsentWithPreferences) {
                        if (syncRetries < maxSyncRetries) {
                            syncRetries++;
                            if (cookieConfig.debug) {
                                console.log('[Guiders WP] SDK no listo, reintentando en 500ms... (intento ' + syncRetries + '/' + maxSyncRetries + ')');
                            }
                            setTimeout(syncMooveToGuiders, 500);
                        } else {
                            console.log('[Guiders WP] ❌ SDK no disponible después de ' + maxSyncRetries + ' reintentos');
                        }
                        return;
                    }

                    var consent = readMooveConsent();

                    if (!consent) {
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] No se pudo leer consentimiento de Moove GDPR');
                        }
                        return;
                    }

                    console.log('[Guiders WP] 🍪 Moove GDPR - Consentimiento leído:', consent);

                    // Actualizar Guiders con el consentimiento usando el método correcto
                    window.guiders.grantConsentWithPreferences(consent);

                    console.log('[Guiders WP] ✅ Consentimiento sincronizado con Guiders SDK');

                    // Resetear contador de reintentos para futuras sincronizaciones
                    syncRetries = 0;
                }

                // Escuchar el evento de cierre del modal de Moove
                document.addEventListener('moove_gdpr_modal_closed', function() {
                    console.log('[Guiders WP] 💾 Evento de cierre de Moove GDPR detectado');
                    setTimeout(syncMooveToGuiders, 100); // Pequeño delay para asegurar que la cookie esté actualizada
                });

                // Polling de cambios en cookie (fallback si no hay evento)
                var lastMooveConsent = getCookie('moove_gdpr_popup');
                setInterval(function() {
                    var currentConsent = getCookie('moove_gdpr_popup');
                    if (currentConsent !== lastMooveConsent) {
                        console.log('[Guiders WP] 💾 Cambio en cookie Moove GDPR detectado:', currentConsent);
                        lastMooveConsent = currentConsent;
                        syncMooveToGuiders();
                    }
                }, 1000); // Verificar cada segundo

                // Sincronizar estado inicial
                syncMooveToGuiders();

                if (cookieConfig.debug) {
                    console.log('[Guiders WP] Integración con Moove GDPR completada');
                }

                return true; // Moove GDPR detectado y configurado
            }

            // Beautiful Cookie Banner Integration
            // Integración con el plugin "Beautiful Cookie Banner" (basado en Osano Cookie Consent 3.1.0)
            // Retorna: true si detectó Beautiful Cookie Banner, false si no
            function setupBeautifulCookieBannerSync() {
                // Verificar si debe sincronizarse
                if (!cookieConfig.wp_consent_api_enabled) {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sincronización de cookies desactivada');
                    }
                    return false;
                }

                // Verificar si se debe forzar el sistema interno
                if (cookieConfig.system === 'internal') {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Sistema configurado como "interno" - saltando Beautiful Cookie Banner');
                    }
                    return false;
                }

                // Helper: Leer cookie por nombre
                function getCookie(name) {
                    var value = '; ' + document.cookie;
                    var parts = value.split('; ' + name + '=');
                    if (parts.length === 2) {
                        return parts.pop().split(';').shift();
                    }
                    return null;
                }

                // Detectar Beautiful Cookie Banner (cookie O elementos DOM)
                var hasBeautifulCookieBanner = document.cookie.indexOf('cookieconsent_status') !== -1 ||
                                              document.querySelector('.cc-window') !== null ||
                                              document.querySelector('.cc-banner') !== null;

                if (!hasBeautifulCookieBanner) {
                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Beautiful Cookie Banner no detectado (ni cookie ni elementos DOM .cc-window/.cc-banner)');
                    }
                    return false;
                }

                if (cookieConfig.debug) {
                    console.log('[Guiders WP] ✅ Beautiful Cookie Banner detectado - configurando sincronización');
                }

                // Función para leer consentimiento de Beautiful Cookie Banner
                function readBeautifulCookieBannerConsent() {
                    var cookieValue = getCookie('cookieconsent_status');

                    if (!cookieValue) {
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] 🔍 Cookie cookieconsent_status no encontrada - Beautiful Cookie Banner no instalado o usuario aún no ha interactuado');
                        }
                        return null;
                    }

                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] ✅ Beautiful Cookie Banner detectado - Cookie cookieconsent_status:', cookieValue);
                    }

                    // Intentar parsear como JSON (modo diferenciado)
                    try {
                        var parsed = JSON.parse(decodeURIComponent(cookieValue));

                        // Modo diferenciado: {"tech":"true","analytics":"false","marketing":"true"}
                        if (typeof parsed === 'object' && parsed !== null) {
                            var consent = {
                                functional: parsed.tech === 'true' || parsed.tech === true,
                                analytics: parsed.analytics === 'true' || parsed.analytics === true,
                                personalization: parsed.marketing === 'true' || parsed.marketing === true
                            };

                            console.log('[Guiders WP] 📋 Modo diferenciado - Categorías detectadas:', {
                                'Technical (functional)': consent.functional,
                                'Analytics': consent.analytics,
                                'Marketing (personalization)': consent.personalization
                            });

                            return consent;
                        }
                    } catch (e) {
                        // No es JSON, es modo simple
                    }

                    // Modo simple: "allow", "deny", "dismiss"
                    // Usar modo ESTRICTO (solo 'allow' = consentimiento)
                    var hasConsent = cookieValue === 'allow';

                    console.log('[Guiders WP] 📋 Modo simple - Valor:', cookieValue, '(todas las categorías:', hasConsent ? 'ACEPTADAS' : 'RECHAZADAS' + ')');

                    return {
                        functional: hasConsent,
                        analytics: hasConsent,
                        personalization: hasConsent
                    };
                }

                // Función para sincronizar con Guiders SDK (con reintentos automáticos)
                var syncRetries = 0;
                var maxSyncRetries = 20; // 20 reintentos x 500ms = 10 segundos máximo

                function syncBeautifulCookieBannerToGuiders() {
                    if (!window.guiders || !window.guiders.grantConsentWithPreferences) {
                        if (syncRetries < maxSyncRetries) {
                            syncRetries++;
                            if (cookieConfig.debug) {
                                console.log('[Guiders WP] SDK no listo, reintentando en 500ms... (intento ' + syncRetries + '/' + maxSyncRetries + ')');
                            }
                            setTimeout(syncBeautifulCookieBannerToGuiders, 500);
                        } else {
                            console.log('[Guiders WP] ❌ SDK no disponible después de ' + maxSyncRetries + ' reintentos');
                        }
                        return;
                    }

                    var consent = readBeautifulCookieBannerConsent();

                    if (!consent) {
                        if (cookieConfig.debug) {
                            console.log('[Guiders WP] No se pudo leer consentimiento de Beautiful Cookie Banner');
                        }
                        return;
                    }

                    console.log('[Guiders WP] 🍪 Beautiful Cookie Banner - Consentimiento leído:', consent);

                    // Actualizar Guiders con el consentimiento usando el método correcto
                    window.guiders.grantConsentWithPreferences(consent);

                    console.log('[Guiders WP] ✅ Consentimiento sincronizado con Guiders SDK');

                    // Resetear contador de reintentos para futuras sincronizaciones
                    syncRetries = 0;
                }

                // Método 1: Escuchar eventos dataLayer (recomendado)
                if (typeof window.dataLayer !== 'undefined') {
                    var originalPush = window.dataLayer.push;
                    window.dataLayer.push = function() {
                        var args = Array.prototype.slice.call(arguments);
                        var data = args[0];

                        if (data && (data.event === 'beautiful_cookie_consent_updated' ||
                                    data.event === 'beautiful_cookie_consent_initialized')) {
                            if (cookieConfig.debug) {
                                console.log('[Guiders WP] Evento dataLayer detectado:', data.event);
                            }
                            setTimeout(syncBeautifulCookieBannerToGuiders, 100);
                        }

                        return originalPush.apply(window.dataLayer, args);
                    };

                    if (cookieConfig.debug) {
                        console.log('[Guiders WP] Listener dataLayer configurado para Beautiful Cookie Banner');
                    }
                }

                // Método 2: Polling de cambios en cookie (fallback)
                var lastConsent = getCookie('cookieconsent_status');
                setInterval(function() {
                    var currentConsent = getCookie('cookieconsent_status');
                    if (currentConsent !== lastConsent) {
                        lastConsent = currentConsent;
                        console.log('[Guiders WP] 💾 Cambio en cookie detectado (Save Settings/Allow/Deny):', currentConsent);
                        syncBeautifulCookieBannerToGuiders();
                    }
                }, 1000);

                // Sincronizar estado inicial
                setTimeout(syncBeautifulCookieBannerToGuiders, 500);

                if (cookieConfig.debug) {
                    console.log('[Guiders WP] Integración con Beautiful Cookie Banner completada');
                }

                return true; // Beautiful Cookie Banner detectado y configurado
            }

            // Wait for DOM to be ready
            function initGuiders() {
                if (typeof window.TrackingPixelSDK === 'undefined') {
                    // SDK not loaded yet, try again in a moment
                    setTimeout(initGuiders, 100);
                    return;
                }
                
                // Prevent multiple initializations
                if (window.guiders) {
                    return;
                }
                
                try {
                    // El bundle busca window.GUIDERS_CONFIG; mantenemos retrocompatibilidad con guidersConfig si existiera
                    var config = window.GUIDERS_CONFIG || window.guidersConfig || {};
                    
                    // Create SDK options
                    var sdkOptions = {
                        apiKey: config.apiKey,
                        autoFlush: config.autoFlush !== undefined ? config.autoFlush : true,
                        flushInterval: config.flushInterval || 5000,
                        maxRetries: 2,
                        heuristicDetection: {
                            enabled: config.features.heuristicDetection,
                            config: config.heuristicConfig
                        },
                        sessionTracking: config.sessionTracking,
                        trackingV2: config.trackingV2
                    };

                    // Add chat position configuration if available
                    if (config.chatPosition) {
                        sdkOptions.chatPosition = config.chatPosition;
                    }

                    // Add mobile detection configuration if available
                    if (config.mobileDetection) {
                        sdkOptions.mobileDetection = config.mobileDetection;
                    }

                    // Add presence configuration if available
                    if (config.presence) {
                        sdkOptions.presence = config.presence;
                    }

                    // Add chat consent message configuration if available
                    if (config.chatConsentMessage) {
                        sdkOptions.chatConsentMessage = config.chatConsentMessage;
                    }

                    // Add auto-open chat on message configuration if available
                    if (config.autoOpenChatOnMessage !== undefined) {
                        sdkOptions.autoOpenChatOnMessage = config.autoOpenChatOnMessage;
                    }

                    // Asignar siempre endpoints explícitos (evita fallback a localhost y doble init)
                    if (config.endpoint) {
                        sdkOptions.endpoint = (config.endpoint + '').replace(/\/+$/,'');
                    }
                    if (config.webSocketEndpoint) {
                        sdkOptions.webSocketEndpoint = (config.webSocketEndpoint + '').replace(/\/+$/,'');
                    }
                    
                    // ⚠️ IMPORTANTE: Sincronizar consentimiento INMEDIATAMENTE
                    // Debe ejecutarse ANTES de cualquier inicialización del SDK (incluso antes del delay)
                    // Si requireConsent=true, el SDK espera consentimiento para inicializarse
                    console.log('[Guiders WP] 🔍 Detectando gestores de cookies...');

                    var hasWPConsent = setupConsentSync();
                    var hasMooveGDPR = setupMooveGDPRSync();
                    var hasBeautifulCookie = setupBeautifulCookieBannerSync();

                    // Resumen de detección (SIEMPRE mostrar, no requiere debug)
                    var detected = [];
                    if (hasWPConsent) detected.push('WP Consent API');
                    if (hasMooveGDPR) detected.push('Moove GDPR');
                    if (hasBeautifulCookie) detected.push('Beautiful Cookie Banner');

                    if (detected.length > 0) {
                        console.log('[Guiders WP] ✅ Gestores de cookies detectados: ' + detected.join(', '));

                        // ⚠️ IMPORTANTE: Si se detecta un gestor externo, FORZAR requireConsent=true
                        // Esto asegura que el chat no se muestre hasta que se otorgue consentimiento
                        if (!sdkOptions.requireConsent) {
                            console.log('[Guiders WP] 🔒 Activando requireConsent automáticamente (gestor externo detectado)');
                            sdkOptions.requireConsent = true;
                        }

                        // ⚠️ CRÍTICO: Limpiar localStorage del ConsentManager para que el SDK inicie con estado 'pending'
                        // Esto evita que el SDK use un consentimiento antiguo cuando hay un gestor externo activo
                        if (typeof localStorage !== 'undefined') {
                            var oldState = localStorage.getItem('guiders_consent_state');
                            if (oldState) {
                                console.log('[Guiders WP] 🗑️ Limpiando consentimiento antiguo del SDK (gestor externo detectado)');
                                localStorage.removeItem('guiders_consent_state');
                            }
                        }
                    } else {
                        console.log('[Guiders WP] ⚠️ No se detectó ningún gestor de cookies externo');
                        console.log('[Guiders WP] ℹ️ El SDK usará su sistema de consentimiento interno');
                        console.log('[Guiders WP] 💡 Gestores soportados: WP Consent API, Moove GDPR, Beautiful Cookie Banner');
                    }

                    function doInit() {
                        if (window.guiders) {
                            console.log('[Guiders WP] ⚠️ SDK ya inicializado, saltando doInit()');
                            return; // safeguard
                        }

                        console.log('[Guiders WP] 🚀 Inicializando SDK...');
                        window.guiders = new window.TrackingPixelSDK(sdkOptions);
                        window.guiders.init().then(function() {
                            console.log('Guiders SDK initialized successfully');

                            if (config.features.tracking) {
                                window.guiders.enableAutomaticTracking();
                            }
                            if (config.wordpress.isWooCommerce) {
                                addWooCommerceTracking();
                            }
                            window.guiders.trackEvent('page_view', {
                                page_type: config.wordpress.pageType,
                                theme: config.wordpress.theme,
                                wp_version: config.wordpress.version,
                                is_woocommerce: config.wordpress.isWooCommerce,
                                url: window.location.href,
                                title: document.title
                            });
                        }).catch(function(error) {
                            console.error('Failed to initialize Guiders SDK:', error);
                        });
                    }

                    // Exponer inicializador manual público (idempotente)
                    if (typeof window.initGuiders === 'undefined') {
                        window.initGuiders = function(force) {
                            if (window.guiders && !force) {
                                console.warn('[Guiders WP] initGuiders() ignorado: instancia existente. Usa force=true para reinicializar.');
                                return window.guiders;
                            }
                            if (force && window.guiders) {
                                try { if (window.guiders.cleanup) { window.guiders.cleanup(); } } catch(e) { /* noop */ }
                                window.guiders = undefined;
                            }
                            doInit();
                            return window.guiders;
                        };
                    }

                    console.log('[Guiders WP] 🚀 Modo de inicialización:', config.autoInitMode, '- readyState:', document.readyState);

                    switch(config.autoInitMode) {
                        case 'immediate':
                            console.log('[Guiders WP] ⚡ Inicialización inmediata');
                            doInit();
                            break;
                        case 'domready':
                            if (document.readyState === 'loading') {
                                console.log('[Guiders WP] ⏳ Esperando DOMContentLoaded');
                                document.addEventListener('DOMContentLoaded', doInit);
                            } else {
                                console.log('[Guiders WP] ✅ DOM ya listo, inicializando');
                                doInit();
                            }
                            break;
                        case 'delayed':
                            var d = parseInt(config.autoInitDelay || 500, 10);
                            console.log('[Guiders WP] ⏱️ Inicialización retrasada:', d + 'ms');
                            setTimeout(doInit, isNaN(d)?500:d);
                            break;
                        case 'manual':
                            // No auto init; el desarrollador puede llamar window.guiders = new TrackingPixelSDK(...)
                            console.log('[Guiders WP] 🔧 Auto-init manual seleccionado; el SDK no se inicializará automáticamente.');
                            break;
                        default:
                            console.log('[Guiders WP] 📋 Fallback a domready');
                            // fallback domready
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', doInit);
                            } else { doInit(); }
                    }
                    
                } catch (error) {
                    console.error('Error initializing Guiders SDK:', error);
                }
            }
            
            // Add WooCommerce-specific tracking
            function addWooCommerceTracking() {
                // Track add to cart via AJAX
                jQuery(document.body).on('added_to_cart', function(event, fragments, cart_hash, button) {
                    if (window.guiders) {
                        var productId = button.attr('data-product_id');
                        var quantity = button.attr('data-quantity') || 1;
                        
                        window.guiders.trackEvent('add_to_cart', {
                            product_id: productId,
                            quantity: parseInt(quantity),
                            source: 'woocommerce_ajax'
                        });
                    }
                });
                
                // Track remove from cart
                jQuery(document.body).on('removed_from_cart', function(event, fragments, cart_hash) {
                    if (window.guiders) {
                        window.guiders.trackEvent('remove_from_cart', {
                            source: 'woocommerce_ajax'
                        });
                    }
                });
            }
            
            // Start initialization
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initGuiders);
            } else {
                initGuiders();
            }
        })();
        </script>
        <?php
    }
    
    /**
     * Add preconnect headers for better performance
     */
    public function addPreconnectHeaders() {
        $environment = isset($this->settings['environment']) ? $this->settings['environment'] : 'production';
        
        if ($environment === 'production') {
            echo '<link rel="preconnect" href="https://guiders.ancoradual.com" crossorigin>' . "\n";
            echo '<link rel="dns-prefetch" href="//guiders.ancoradual.com">' . "\n";
        }
    }
    
    /**
     * Add inline styles for better integration
     */
    private function addInlineStyles() {
        $custom_css = "
        /* Guiders SDK WordPress Integration Styles */
        #guiders-chat-container {
            z-index: 999999;
        }
        
        #guiders-chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000000;
        }
        
        /* Ensure compatibility with common WordPress themes */
        .guiders-overlay {
            z-index: 999998;
        }
        
        /* Hide chat on mobile if needed */
        @media (max-width: 768px) {
            .guiders-hide-mobile {
                display: none !important;
            }
        }
        ";
        
        wp_add_inline_style('guiders-sdk', $custom_css);
    }
    
    /**
     * Get current user data for personalization
     */
    public function getCurrentUserData() {
        $user_data = array();
        
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            $user_data = array(
                'id' => $current_user->ID,
                'email' => $current_user->user_email,
                'name' => $current_user->display_name,
                'role' => implode(', ', $current_user->roles)
            );
        }
        
        return $user_data;
    }

    /**
     * Get chat consent message configuration
     */
    private function getChatConsentMessageConfig() {
        $config = array(
            'enabled' => isset($this->settings['chat_consent_message_enabled']) ? $this->settings['chat_consent_message_enabled'] : false,
            'message' => isset($this->settings['chat_consent_message_text']) ? $this->settings['chat_consent_message_text'] : 'Al unirte al chat, confirmas que has leído y entiendes nuestra',
            'privacyPolicyUrl' => isset($this->settings['chat_consent_privacy_url']) ? $this->settings['chat_consent_privacy_url'] : '',
            'privacyPolicyText' => isset($this->settings['chat_consent_privacy_text']) ? $this->settings['chat_consent_privacy_text'] : 'Política de Privacidad',
            'cookiesPolicyUrl' => isset($this->settings['chat_consent_cookies_url']) ? $this->settings['chat_consent_cookies_url'] : '',
            'cookiesPolicyText' => isset($this->settings['chat_consent_cookies_text']) ? $this->settings['chat_consent_cookies_text'] : 'Política de Cookies',
            'showOnce' => isset($this->settings['chat_consent_show_once']) ? $this->settings['chat_consent_show_once'] : true
        );

        return $config;
    }

    /**
     * Get active hours configuration
     */
    private function getActiveHoursConfig() {
        $config = array(
            'enabled' => isset($this->settings['active_hours_enabled']) ? $this->settings['active_hours_enabled'] : false,
            'timezone' => isset($this->settings['active_hours_timezone']) ? $this->settings['active_hours_timezone'] : '',
            'fallbackMessage' => isset($this->settings['active_hours_fallback_message']) ? $this->settings['active_hours_fallback_message'] : '',
            'ranges' => array()
        );

        // Parse ranges from JSON
        if (!empty($this->settings['active_hours_ranges'])) {
            $ranges = json_decode($this->settings['active_hours_ranges'], true);
            if (is_array($ranges)) {
                $config['ranges'] = $ranges;
            }
        }

        // Add exclude weekends setting
        if (isset($this->settings['active_hours_exclude_weekends']) && $this->settings['active_hours_exclude_weekends']) {
            $config['excludeWeekends'] = true;
        }

        // Parse active days from JSON
        if (!empty($this->settings['active_hours_active_days'])) {
            $active_days = json_decode($this->settings['active_hours_active_days'], true);
            if (is_array($active_days) && count($active_days) > 0) {
                $config['activeDays'] = array_map('intval', $active_days);
            }
        }

        // Set default fallback message if empty
        if (empty($config['fallbackMessage'])) {
            $config['fallbackMessage'] = __('El chat no está disponible en este momento. Por favor, inténtalo más tarde durante nuestros horarios de atención.', 'guiders-wp-plugin');
        }

        return $config;
    }

    /**
     * Get consent banner configuration
     */
    private function getConsentBannerConfig() {
        // IMPORTANTE: El banner solo se muestra si requireConsent está activado
        // Si requireConsent: false, el SDK ignora la configuración del banner
        $requireConsent = isset($this->settings['require_consent']) ? $this->settings['require_consent'] : false;
        $bannerEnabled = isset($this->settings['consent_banner_enabled']) ? $this->settings['consent_banner_enabled'] : false;

        // El banner solo está "enabled" si AMBOS están activados
        $effectiveEnabled = $requireConsent && $bannerEnabled;

        $config = array(
            'enabled' => $effectiveEnabled,
            'style' => isset($this->settings['consent_banner_style']) ? $this->settings['consent_banner_style'] : 'bottom_bar',
            'text' => isset($this->settings['consent_banner_text']) ? $this->settings['consent_banner_text'] : '🍪 Usamos cookies para mejorar tu experiencia y proporcionar chat en vivo.',
            'acceptText' => isset($this->settings['consent_accept_text']) ? $this->settings['consent_accept_text'] : 'Aceptar Todo',
            'denyText' => isset($this->settings['consent_deny_text']) ? $this->settings['consent_deny_text'] : 'Rechazar',
            'preferencesText' => isset($this->settings['consent_preferences_text']) ? $this->settings['consent_preferences_text'] : 'Preferencias',
            'showPreferences' => isset($this->settings['consent_show_preferences']) ? $this->settings['consent_show_preferences'] : true,
            'colors' => array(
                'background' => isset($this->settings['consent_banner_bg_color']) ? $this->settings['consent_banner_bg_color'] : '#2c3e50',
                'text' => isset($this->settings['consent_banner_text_color']) ? $this->settings['consent_banner_text_color'] : '#ffffff',
                'acceptButton' => isset($this->settings['consent_accept_color']) ? $this->settings['consent_accept_color'] : '#27ae60',
                'denyButton' => isset($this->settings['consent_deny_color']) ? $this->settings['consent_deny_color'] : '#95a5a6',
                'preferencesButton' => isset($this->settings['consent_preferences_color']) ? $this->settings['consent_preferences_color'] : '#3498db'
            ),
            'position' => isset($this->settings['consent_banner_position']) ? $this->settings['consent_banner_position'] : 'bottom',
            'autoShow' => isset($this->settings['consent_auto_show']) ? $this->settings['consent_auto_show'] : true
        );

        return $config;
    }

    /**
     * Get chat position configuration
     */
    private function getChatPositionConfig() {
        // Get position data from settings (stored as JSON)
        $positionDataJson = isset($this->settings['chat_position_data']) ? $this->settings['chat_position_data'] : '{}';
        $positionData = json_decode($positionDataJson, true);

        // Return null if no valid data
        if (!is_array($positionData) || empty($positionData)) {
            return null;
        }

        // Extract desktop and mobile configs
        $desktop = isset($positionData['desktop']) ? $positionData['desktop'] : array();
        $mobile = isset($positionData['mobile']) ? $positionData['mobile'] : array();
        $mobileEnabled = isset($mobile['enabled']) ? $mobile['enabled'] : false;

        // Convert desktop config to SDK format
        $desktopConfig = $this->convertPositionToSDKFormat($desktop);

        // If mobile is not enabled or no desktop config, return simple config
        if (!$mobileEnabled || !$desktopConfig) {
            return $desktopConfig;
        }

        // Convert mobile config to SDK format
        $mobileConfig = $this->convertPositionToSDKFormat($mobile);

        // If mobile config exists, return device-specific format
        if ($mobileConfig) {
            return array(
                'default' => $desktopConfig,
                'mobile' => $mobileConfig
            );
        }

        // Fallback to desktop only
        return $desktopConfig;
    }

    /**
     * Convert WordPress position format to SDK format
     *
     * @param array $config Configuration from WordPress (with mode, preset, button, widget)
     * @return mixed Preset string or coordinates object, or null if invalid
     */
    private function convertPositionToSDKFormat($config) {
        if (!is_array($config) || empty($config)) {
            return null;
        }

        $mode = isset($config['mode']) ? $config['mode'] : 'basic';

        // Basic mode: return preset string (e.g., "bottom-right")
        if ($mode === 'basic' && !empty($config['preset'])) {
            return $config['preset'];
        }

        // Advanced mode: return coordinates object
        if ($mode === 'advanced') {
            $button = isset($config['button']) ? $config['button'] : array();
            $widget = isset($config['widget']) ? $config['widget'] : array();

            // Build coordinates object (only include non-empty values)
            $coordinates = array();

            // Button position
            if (!empty($button['top'])) $coordinates['top'] = $button['top'];
            if (!empty($button['bottom'])) $coordinates['bottom'] = $button['bottom'];
            if (!empty($button['left'])) $coordinates['left'] = $button['left'];
            if (!empty($button['right'])) $coordinates['right'] = $button['right'];

            // Widget position (prefixed with 'widget')
            if (!empty($widget['top'])) $coordinates['widgetTop'] = $widget['top'];
            if (!empty($widget['bottom'])) $coordinates['widgetBottom'] = $widget['bottom'];
            if (!empty($widget['left'])) $coordinates['widgetLeft'] = $widget['left'];
            if (!empty($widget['right'])) $coordinates['widgetRight'] = $widget['right'];

            // Return coordinates if we have at least some position data
            if (!empty($coordinates)) {
                return $coordinates;
            }
        }

        return null;
    }

    /**
     * Get mobile detection configuration
     *
     * @return array|null Mobile detection config or null if defaults should be used
     */
    private function getMobileDetectionConfig() {
        // Get mobile detection settings
        $breakpoint = isset($this->settings['mobile_breakpoint']) ? intval($this->settings['mobile_breakpoint']) : 768;
        $mode = isset($this->settings['mobile_detection_mode']) ? $this->settings['mobile_detection_mode'] : 'auto';
        $debug = isset($this->settings['mobile_detection_debug']) ? $this->settings['mobile_detection_debug'] : false;

        // Only return config if non-default values are set
        $config = array(
            'mode' => $mode,
            'breakpoint' => $breakpoint,
            'debug' => $debug
        );

        return $config;
    }

    /**
     * Get commercial availability configuration
     *
     * @return array Commercial availability config
     */
    private function getCommercialAvailabilityConfig() {
        $config = array(
            'enabled' => isset($this->settings['commercial_availability_enabled']) ? $this->settings['commercial_availability_enabled'] : false,
            'pollingInterval' => isset($this->settings['commercial_availability_polling']) ? intval($this->settings['commercial_availability_polling']) : 30,
            'showBadge' => isset($this->settings['commercial_availability_show_badge']) ? $this->settings['commercial_availability_show_badge'] : false,
            'debug' => false // Could be made configurable if needed
        );

        return $config;
    }

    /**
     * Get Tracking V2 configuration
     *
     * @return array Tracking V2 config
     */
    private function getTrackingV2Config() {
        $config = array(
            'enabled' => isset($this->settings['tracking_v2_enabled']) ? $this->settings['tracking_v2_enabled'] : true,
            'batchSize' => isset($this->settings['tracking_v2_batch_size']) ? intval($this->settings['tracking_v2_batch_size']) : 500,
            'flushInterval' => isset($this->settings['tracking_v2_flush_interval']) ? intval($this->settings['tracking_v2_flush_interval']) : 5000,
            'maxQueueSize' => isset($this->settings['tracking_v2_max_queue_size']) ? intval($this->settings['tracking_v2_max_queue_size']) : 10000,
            'persistQueue' => isset($this->settings['tracking_v2_persist_queue']) ? $this->settings['tracking_v2_persist_queue'] : true,
            'bypassConsent' => isset($this->settings['tracking_v2_bypass_consent']) ? $this->settings['tracking_v2_bypass_consent'] : false,
            'throttling' => array(
                'enabled' => isset($this->settings['tracking_v2_throttling_enabled']) ? $this->settings['tracking_v2_throttling_enabled'] : true,
                'rules' => array(
                    'SCROLL' => isset($this->settings['tracking_v2_throttle_scroll']) ? intval($this->settings['tracking_v2_throttle_scroll']) : 100,
                    'MOUSE_MOVE' => isset($this->settings['tracking_v2_throttle_mouse_move']) ? intval($this->settings['tracking_v2_throttle_mouse_move']) : 50,
                    'HOVER' => isset($this->settings['tracking_v2_throttle_hover']) ? intval($this->settings['tracking_v2_throttle_hover']) : 200,
                    'RESIZE' => isset($this->settings['tracking_v2_throttle_resize']) ? intval($this->settings['tracking_v2_throttle_resize']) : 300,
                    'MOUSE_ENTER' => isset($this->settings['tracking_v2_throttle_mouse_enter']) ? intval($this->settings['tracking_v2_throttle_mouse_enter']) : 150,
                    'MOUSE_LEAVE' => isset($this->settings['tracking_v2_throttle_mouse_leave']) ? intval($this->settings['tracking_v2_throttle_mouse_leave']) : 150
                ),
                'debug' => isset($this->settings['tracking_v2_throttling_debug']) ? $this->settings['tracking_v2_throttling_debug'] : false
            ),
            'aggregation' => array(
                'enabled' => isset($this->settings['tracking_v2_aggregation_enabled']) ? $this->settings['tracking_v2_aggregation_enabled'] : true,
                'windowMs' => isset($this->settings['tracking_v2_aggregation_window']) ? intval($this->settings['tracking_v2_aggregation_window']) : 1000,
                'maxBufferSize' => isset($this->settings['tracking_v2_aggregation_buffer_size']) ? intval($this->settings['tracking_v2_aggregation_buffer_size']) : 1000,
                'debug' => isset($this->settings['tracking_v2_aggregation_debug']) ? $this->settings['tracking_v2_aggregation_debug'] : false
            )
        );

        return $config;
    }

    /**
     * Get Presence & Typing Indicators configuration
     *
     * @return array Presence config
     */
    private function getPresenceConfig() {
        $config = array(
            'enabled' => isset($this->settings['presence_enabled']) ? $this->settings['presence_enabled'] : true,
            'showTypingIndicator' => isset($this->settings['presence_show_typing_indicator']) ? $this->settings['presence_show_typing_indicator'] : true,
            'typingDebounce' => isset($this->settings['presence_typing_debounce']) ? intval($this->settings['presence_typing_debounce']) : 300,
            'typingTimeout' => isset($this->settings['presence_typing_timeout']) ? intval($this->settings['presence_typing_timeout']) : 2000,
            'pollingInterval' => isset($this->settings['presence_polling_interval']) ? intval($this->settings['presence_polling_interval']) : 30000,
            'showOfflineBanner' => isset($this->settings['presence_show_offline_banner']) ? $this->settings['presence_show_offline_banner'] : true
        );

        return $config;
    }
}