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
            $config['endpoint'] = 'http://localhost:3000';
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
                    
                    function doInit() {
                        if (window.guiders) return; // safeguard
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

                    switch(config.autoInitMode) {
                        case 'immediate':
                            doInit();
                            break;
                        case 'domready':
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', doInit);
                            } else { doInit(); }
                            break;
                        case 'delayed':
                            var d = parseInt(config.autoInitDelay || 500, 10);
                            setTimeout(doInit, isNaN(d)?500:d);
                            break;
                        case 'manual':
                            // No auto init; el desarrollador puede llamar window.guiders = new TrackingPixelSDK(...)
                            console.log('[Guiders WP] Auto-init manual seleccionado; el SDK no se inicializará automáticamente.');
                            break;
                        default:
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