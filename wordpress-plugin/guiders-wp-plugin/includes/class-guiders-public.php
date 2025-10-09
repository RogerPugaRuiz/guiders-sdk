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
            'welcomeMessage' => $this->getWelcomeMessageConfig(),
            'activeHours' => $this->getActiveHoursConfig()
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
                        autoFlush: true,
                        flushInterval: 1000,
                        maxRetries: 2,
                        heuristicDetection: {
                            enabled: config.features.heuristicDetection,
                            config: config.heuristicConfig
                        },
                        sessionTracking: config.sessionTracking
                    };
                    
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
     * Get welcome message configuration
     */
    private function getWelcomeMessageConfig() {
        $config = array(
            'enabled' => isset($this->settings['welcome_message_enabled']) ? $this->settings['welcome_message_enabled'] : true,
            'style' => isset($this->settings['welcome_message_style']) ? $this->settings['welcome_message_style'] : 'friendly',
            'language' => isset($this->settings['welcome_message_language']) ? $this->settings['welcome_message_language'] : 'es',
            'includeEmojis' => isset($this->settings['welcome_message_include_emojis']) ? $this->settings['welcome_message_include_emojis'] : true,
            'showTips' => isset($this->settings['welcome_message_show_tips']) ? $this->settings['welcome_message_show_tips'] : true
        );

        // Si hay una plantilla de negocio seleccionada, configurar mensaje personalizado
        if (!empty($this->settings['welcome_message_business_template'])) {
            $config['style'] = 'custom';
            $config['customMessage'] = $this->getBusinessTemplateMessage($this->settings['welcome_message_business_template'], $config['language']);
        }
        // Si hay un mensaje personalizado y el estilo es custom
        elseif (!empty($this->settings['welcome_message_custom']) && $config['style'] === 'custom') {
            $config['customMessage'] = $this->settings['welcome_message_custom'];
        }

        return $config;
    }

    /**
     * Get business template message
     */
    private function getBusinessTemplateMessage($template, $language = 'es') {
        $templates = array(
            'ecommerce' => array(
                'es' => '¡Hola! 🛍️ Bienvenido a nuestra tienda. Estoy aquí para ayudarte con tus compras, seguimiento de pedidos, devoluciones o cualquier pregunta sobre nuestros productos. ¿En qué puedo asistirte?',
                'en' => 'Hello! 🛍️ Welcome to our store. I\'m here to help you with your purchases, order tracking, returns, or any questions about our products. How can I assist you?'
            ),
            'saas' => array(
                'es' => '¡Hola! 💻 Bienvenido al soporte técnico. Estoy aquí para ayudarte con configuración, resolución de problemas, facturación o cualquier duda sobre nuestro software. ¡Cuéntame qué necesitas!',
                'en' => 'Hello! 💻 Welcome to technical support. I\'m here to help you with setup, troubleshooting, billing, or any questions about our software. Tell me what you need!'
            ),
            'healthcare' => array(
                'es' => '¡Hola! 🏥 Bienvenido a nuestro centro de atención. Estoy aquí para ayudarte con citas, información sobre servicios, seguros médicos o consultas generales. ¿Cómo puedo ayudarte hoy?',
                'en' => 'Hello! 🏥 Welcome to our care center. I\'m here to help you with appointments, service information, medical insurance, or general inquiries. How can I help you today?'
            ),
            'education' => array(
                'es' => '¡Hola! 📚 Bienvenido a nuestro centro de aprendizaje. Estoy aquí para ayudarte con cursos, inscripciones, material de estudio o cualquier consulta académica. ¿Qué necesitas saber?',
                'en' => 'Hello! 📚 Welcome to our learning center. I\'m here to help you with courses, enrollments, study materials, or any academic inquiries. What do you need to know?'
            ),
            'finance' => array(
                'es' => '¡Hola! 💰 Bienvenido a nuestros servicios financieros. Estoy aquí para ayudarte con consultas sobre cuentas, transacciones, inversiones o servicios bancarios. ¿En qué puedo asistirte?',
                'en' => 'Hello! 💰 Welcome to our financial services. I\'m here to help you with account inquiries, transactions, investments, or banking services. How can I assist you?'
            )
        );

        if (isset($templates[$template][$language])) {
            return $templates[$template][$language];
        }

        // Fallback al español si no existe el idioma
        if (isset($templates[$template]['es'])) {
            return $templates[$template]['es'];
        }

        return '';
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

        // Set default fallback message if empty
        if (empty($config['fallbackMessage'])) {
            $config['fallbackMessage'] = __('El chat no está disponible en este momento. Por favor, inténtalo más tarde durante nuestros horarios de atención.', 'guiders-wp-plugin');
        }

        return $config;
    }
}