<?php
/**
 * Admin functionality for Guiders WP Plugin with error protection
 *
 * @since 1.0.0
 * @version 1.2.0 - Added error handling
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class GuidersAdmin {

    /**
     * Constructor with error protection
     */
    public function __construct() {
        try {
            $this->initHooks();
        } catch (Throwable $e) {
            error_log('[Guiders Admin] Error in constructor: ' . $e->getMessage());
            // Don't throw - allow plugin to continue without admin functionality
        }
    }
    
    /**
     * Initialize admin hooks
     */
    private function initHooks() {
        // Add admin menu
        add_action('admin_menu', array($this, 'addAdminMenu'));
        
        // Register settings
        add_action('admin_init', array($this, 'registerSettings'));
        
        // Add admin styles and scripts
        add_action('admin_enqueue_scripts', array($this, 'enqueueAdminAssets'));
        
        // Add admin notices
        add_action('admin_notices', array($this, 'showAdminNotices'));
    }
    
    /**
     * Add admin menu
     */
    public function addAdminMenu() {
        add_options_page(
            __('Guiders SDK', 'guiders-wp-plugin'),
            __('Guiders SDK', 'guiders-wp-plugin'),
            'manage_options',
            'guiders-settings',
            array($this, 'displaySettingsPage')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function registerSettings() {
        register_setting(
            'guiders_wp_plugin_settings_group',
            'guiders_wp_plugin_settings',
            array($this, 'validateSettings')
        );
        
        // General settings section
        add_settings_section(
            'guiders_general_section',
            __('Configuración General', 'guiders-wp-plugin'),
            array($this, 'generalSectionCallback'),
            'guiders-settings'
        );
        
        // API Key field
        add_settings_field(
            'api_key',
            __('API Key', 'guiders-wp-plugin'),
            array($this, 'apiKeyFieldCallback'),
            'guiders-settings',
            'guiders_general_section'
        );
        
        // Enabled field
        add_settings_field(
            'enabled',
            __('Habilitar Guiders SDK', 'guiders-wp-plugin'),
            array($this, 'enabledFieldCallback'),
            'guiders-settings',
            'guiders_general_section'
        );
        
        // Environment field
        add_settings_field(
            'environment',
            __('Entorno', 'guiders-wp-plugin'),
            array($this, 'environmentFieldCallback'),
            'guiders-settings',
            'guiders_general_section'
        );
        
        // Features section
        add_settings_section(
            'guiders_features_section',
            __('Características', 'guiders-wp-plugin'),
            array($this, 'featuresSectionCallback'),
            'guiders-settings'
        );
        
        // Chat enabled field
        add_settings_field(
            'chat_enabled',
            __('Habilitar Chat en Vivo', 'guiders-wp-plugin'),
            array($this, 'chatEnabledFieldCallback'),
            'guiders-settings',
            'guiders_features_section'
        );
        
        // Tracking enabled field
        add_settings_field(
            'tracking_enabled',
            __('Habilitar Tracking de Eventos', 'guiders-wp-plugin'),
            array($this, 'trackingEnabledFieldCallback'),
            'guiders-settings',
            'guiders_features_section'
        );
        
        // Heuristic detection field
        add_settings_field(
            'heuristic_detection',
            __('Detección Heurística Inteligente', 'guiders-wp-plugin'),
            array($this, 'heuristicDetectionFieldCallback'),
            'guiders-settings',
            'guiders_features_section'
        );
        
        // Confidence threshold field
        add_settings_field(
            'confidence_threshold',
            __('Umbral de Confianza', 'guiders-wp-plugin'),
            array($this, 'confidenceThresholdFieldCallback'),
            'guiders-settings',
            'guiders_features_section'
        );

        // Auto-init mode
        add_settings_field(
            'auto_init_mode',
            __('Modo de Auto-Init', 'guiders-wp-plugin'),
            array($this, 'autoInitModeFieldCallback'),
            'guiders-settings',
            'guiders_general_section'
        );

        // Auto-init delay
        add_settings_field(
            'auto_init_delay',
            __('Delay Auto-Init (ms)', 'guiders-wp-plugin'),
            array($this, 'autoInitDelayFieldCallback'),
            'guiders-settings',
            'guiders_general_section'
        );

        // Welcome Messages section
        add_settings_section(
            'guiders_welcome_messages_section',
            __('Mensajes de Bienvenida del Chat', 'guiders-wp-plugin'),
            array($this, 'welcomeMessagesSectionCallback'),
            'guiders-settings'
        );

        // Welcome message enabled field
        add_settings_field(
            'welcome_message_enabled',
            __('Habilitar Mensajes de Bienvenida', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageEnabledFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Welcome message style field
        add_settings_field(
            'welcome_message_style',
            __('Estilo del Mensaje', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageStyleFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Welcome message language field
        add_settings_field(
            'welcome_message_language',
            __('Idioma', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageLanguageFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Welcome message include emojis field
        add_settings_field(
            'welcome_message_include_emojis',
            __('Incluir Emojis', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageIncludeEmojisFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Welcome message show tips field
        add_settings_field(
            'welcome_message_show_tips',
            __('Mostrar Consejos Adicionales', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageShowTipsFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Custom welcome message field
        add_settings_field(
            'welcome_message_custom',
            __('Mensaje Personalizado', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageCustomFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Business template field
        add_settings_field(
            'welcome_message_business_template',
            __('Plantilla de Negocio', 'guiders-wp-plugin'),
            array($this, 'welcomeMessageBusinessTemplateFieldCallback'),
            'guiders-settings',
            'guiders_welcome_messages_section'
        );

        // Active Hours section
        add_settings_section(
            'guiders_active_hours_section',
            __('Horarios de Activación del Chat', 'guiders-wp-plugin'),
            array($this, 'activeHoursSectionCallback'),
            'guiders-settings'
        );

        // Active hours enabled field
        add_settings_field(
            'active_hours_enabled',
            __('Habilitar Horarios de Activación', 'guiders-wp-plugin'),
            array($this, 'activeHoursEnabledFieldCallback'),
            'guiders-settings',
            'guiders_active_hours_section'
        );

        // Active hours timezone field
        add_settings_field(
            'active_hours_timezone',
            __('Zona Horaria', 'guiders-wp-plugin'),
            array($this, 'activeHoursTimezoneFieldCallback'),
            'guiders-settings',
            'guiders_active_hours_section'
        );

        // Active hours ranges field
        add_settings_field(
            'active_hours_ranges',
            __('Rangos de Horarios', 'guiders-wp-plugin'),
            array($this, 'activeHoursRangesFieldCallback'),
            'guiders-settings',
            'guiders_active_hours_section'
        );

        // Active hours fallback message field
        add_settings_field(
            'active_hours_fallback_message',
            __('Mensaje cuando Chat no está Disponible', 'guiders-wp-plugin'),
            array($this, 'activeHoursFallbackMessageFieldCallback'),
            'guiders-settings',
            'guiders_active_hours_section'
        );

        // GDPR & Consent Banner section
        add_settings_section(
            'guiders_gdpr_section',
            __('GDPR & Banner de Consentimiento', 'guiders-wp-plugin'),
            array($this, 'gdprSectionCallback'),
            'guiders-settings'
        );

        // Consent banner enabled
        add_settings_field(
            'consent_banner_enabled',
            __('Habilitar Banner de Consentimiento', 'guiders-wp-plugin'),
            array($this, 'consentBannerEnabledFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Require consent
        add_settings_field(
            'require_consent',
            __('Requerir Consentimiento GDPR', 'guiders-wp-plugin'),
            array($this, 'requireConsentFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Consent banner style
        add_settings_field(
            'consent_banner_style',
            __('Estilo del Banner', 'guiders-wp-plugin'),
            array($this, 'consentBannerStyleFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Consent banner text
        add_settings_field(
            'consent_banner_text',
            __('Texto del Banner', 'guiders-wp-plugin'),
            array($this, 'consentBannerTextFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Consent accept button text
        add_settings_field(
            'consent_accept_text',
            __('Texto Botón Aceptar', 'guiders-wp-plugin'),
            array($this, 'consentAcceptTextFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Consent deny button text
        add_settings_field(
            'consent_deny_text',
            __('Texto Botón Rechazar', 'guiders-wp-plugin'),
            array($this, 'consentDenyTextFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Show preferences button
        add_settings_field(
            'consent_show_preferences',
            __('Mostrar Botón Preferencias', 'guiders-wp-plugin'),
            array($this, 'consentShowPreferencesFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );

        // Banner colors
        add_settings_field(
            'consent_banner_colors',
            __('Colores del Banner', 'guiders-wp-plugin'),
            array($this, 'consentBannerColorsFieldCallback'),
            'guiders-settings',
            'guiders_gdpr_section'
        );
    }
    
    /**
     * Validate settings
     */
    public function validateSettings($input) {
        $validated = array();
        
        // Validate API key
        if (isset($input['api_key'])) {
            $validated['api_key'] = sanitize_text_field($input['api_key']);
        }
        
        // Validate enabled
        $validated['enabled'] = isset($input['enabled']) ? true : false;
        
        // Validate environment
        if (isset($input['environment']) && in_array($input['environment'], array('production', 'development'))) {
            $validated['environment'] = sanitize_text_field($input['environment']);
        } else {
            $validated['environment'] = 'production';
        }
        
        // Validate chat enabled
        $validated['chat_enabled'] = isset($input['chat_enabled']) ? true : false;
        
        // Validate tracking enabled
        $validated['tracking_enabled'] = isset($input['tracking_enabled']) ? true : false;
        
        // Validate heuristic detection
        $validated['heuristic_detection'] = isset($input['heuristic_detection']) ? true : false;
        
        // Validate confidence threshold
        if (isset($input['confidence_threshold'])) {
            $threshold = floatval($input['confidence_threshold']);
            if ($threshold >= 0 && $threshold <= 1) {
                $validated['confidence_threshold'] = $threshold;
            } else {
                $validated['confidence_threshold'] = 0.7;
                add_settings_error('guiders_wp_plugin_settings', 'confidence_threshold', __('El umbral de confianza debe estar entre 0 y 1.', 'guiders-wp-plugin'));
            }
        } else {
            $validated['confidence_threshold'] = 0.7;
        }

        // Validate auto init mode
        $valid_modes = array('immediate','domready','delayed','manual');
        if (isset($input['auto_init_mode']) && in_array($input['auto_init_mode'], $valid_modes)) {
            $validated['auto_init_mode'] = $input['auto_init_mode'];
        } else {
            $validated['auto_init_mode'] = 'domready';
        }

        // Validate delay
        if (isset($input['auto_init_delay'])) {
            $delay = intval($input['auto_init_delay']);
            if ($delay < 0) { $delay = 0; }
            if ($delay > 60000) { $delay = 60000; }
            $validated['auto_init_delay'] = $delay;
        } else {
            $validated['auto_init_delay'] = 500;
        }

        // Validate welcome message settings
        $validated['welcome_message_enabled'] = isset($input['welcome_message_enabled']) ? true : false;
        
        // Validate welcome message style
        $valid_styles = array('friendly', 'professional', 'casual', 'helpful', 'custom');
        if (isset($input['welcome_message_style']) && in_array($input['welcome_message_style'], $valid_styles)) {
            $validated['welcome_message_style'] = $input['welcome_message_style'];
        } else {
            $validated['welcome_message_style'] = 'friendly';
        }
        
        // Validate welcome message language
        $valid_languages = array('es', 'en');
        if (isset($input['welcome_message_language']) && in_array($input['welcome_message_language'], $valid_languages)) {
            $validated['welcome_message_language'] = $input['welcome_message_language'];
        } else {
            $validated['welcome_message_language'] = 'es';
        }
        
        // Validate welcome message include emojis
        $validated['welcome_message_include_emojis'] = isset($input['welcome_message_include_emojis']) ? true : false;
        
        // Validate welcome message show tips
        $validated['welcome_message_show_tips'] = isset($input['welcome_message_show_tips']) ? true : false;
        
        // Validate custom welcome message
        if (isset($input['welcome_message_custom'])) {
            $validated['welcome_message_custom'] = sanitize_textarea_field($input['welcome_message_custom']);
        }
        
        // Validate business template
        $valid_templates = array('', 'ecommerce', 'saas', 'healthcare', 'education', 'finance');
        if (isset($input['welcome_message_business_template']) && in_array($input['welcome_message_business_template'], $valid_templates)) {
            $validated['welcome_message_business_template'] = $input['welcome_message_business_template'];
        } else {
            $validated['welcome_message_business_template'] = '';
        }

        // Validate active hours settings
        $validated['active_hours_enabled'] = isset($input['active_hours_enabled']) ? true : false;
        
        // Validate timezone
        if (isset($input['active_hours_timezone'])) {
            $validated['active_hours_timezone'] = sanitize_text_field($input['active_hours_timezone']);
        } else {
            $validated['active_hours_timezone'] = '';
        }
        
        // Validate fallback message
        if (isset($input['active_hours_fallback_message'])) {
            $validated['active_hours_fallback_message'] = sanitize_textarea_field($input['active_hours_fallback_message']);
        } else {
            $validated['active_hours_fallback_message'] = '';
        }
        
        // Validate active hours ranges (JSON format)
        if (isset($input['active_hours_ranges'])) {
            $ranges_json = stripslashes($input['active_hours_ranges']);
            $ranges = json_decode($ranges_json, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($ranges)) {
                // Validate each range
                $valid_ranges = array();
                foreach ($ranges as $range) {
                    if (isset($range['start']) && isset($range['end']) && 
                        preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $range['start']) &&
                        preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $range['end'])) {
                        $valid_ranges[] = array(
                            'start' => sanitize_text_field($range['start']),
                            'end' => sanitize_text_field($range['end'])
                        );
                    }
                }
                $validated['active_hours_ranges'] = json_encode($valid_ranges);
            } else {
                $validated['active_hours_ranges'] = '[]';
            }
        } else {
            $validated['active_hours_ranges'] = '[]';
        }

        // Validate GDPR & Consent Banner settings
        $validated['consent_banner_enabled'] = isset($input['consent_banner_enabled']) ? true : false;
        $validated['require_consent'] = isset($input['require_consent']) ? true : false;

        // Add warning if banner is enabled but requireConsent is not
        if ($validated['consent_banner_enabled'] && !$validated['require_consent']) {
            add_settings_error(
                'guiders_wp_plugin_settings',
                'consent_banner_without_require',
                __('⚠️ Advertencia: Has activado el banner de consentimiento pero "Requerir Consentimiento GDPR" está desactivado. El banner NO se mostrará hasta que actives ambas opciones.', 'guiders-wp-plugin'),
                'warning'
            );
        }

        // Validate banner style
        $valid_styles = array('bottom_bar', 'modal', 'corner');
        if (isset($input['consent_banner_style']) && in_array($input['consent_banner_style'], $valid_styles)) {
            $validated['consent_banner_style'] = $input['consent_banner_style'];
        } else {
            $validated['consent_banner_style'] = 'bottom_bar';
        }

        // Validate banner text
        if (isset($input['consent_banner_text'])) {
            $validated['consent_banner_text'] = sanitize_textarea_field($input['consent_banner_text']);
        } else {
            $validated['consent_banner_text'] = '🍪 Usamos cookies para mejorar tu experiencia y proporcionar chat en vivo.';
        }

        // Validate button texts
        $validated['consent_accept_text'] = isset($input['consent_accept_text']) ? sanitize_text_field($input['consent_accept_text']) : 'Aceptar Todo';
        $validated['consent_deny_text'] = isset($input['consent_deny_text']) ? sanitize_text_field($input['consent_deny_text']) : 'Rechazar';
        $validated['consent_preferences_text'] = isset($input['consent_preferences_text']) ? sanitize_text_field($input['consent_preferences_text']) : 'Preferencias';

        // Validate show preferences
        $validated['consent_show_preferences'] = isset($input['consent_show_preferences']) ? true : false;

        // Validate colors
        $validated['consent_banner_bg_color'] = isset($input['consent_banner_bg_color']) ? sanitize_hex_color($input['consent_banner_bg_color']) : '#2c3e50';
        $validated['consent_banner_text_color'] = isset($input['consent_banner_text_color']) ? sanitize_hex_color($input['consent_banner_text_color']) : '#ffffff';
        $validated['consent_accept_color'] = isset($input['consent_accept_color']) ? sanitize_hex_color($input['consent_accept_color']) : '#27ae60';
        $validated['consent_deny_color'] = isset($input['consent_deny_color']) ? sanitize_hex_color($input['consent_deny_color']) : '#95a5a6';
        $validated['consent_preferences_color'] = isset($input['consent_preferences_color']) ? sanitize_hex_color($input['consent_preferences_color']) : '#3498db';

        // Validate position
        $valid_positions = array('bottom', 'top');
        if (isset($input['consent_banner_position']) && in_array($input['consent_banner_position'], $valid_positions)) {
            $validated['consent_banner_position'] = $input['consent_banner_position'];
        } else {
            $validated['consent_banner_position'] = 'bottom';
        }

        // Validate auto show
        $validated['consent_auto_show'] = isset($input['consent_auto_show']) ? true : false;

        return $validated;
    }
    
    /**
     * Display settings page with error protection
     */
    public function displaySettingsPage() {
        if (!current_user_can('manage_options')) {
            wp_die(__('No tienes permisos suficientes para acceder a esta página.', 'guiders-wp-plugin'));
        }

        try {
            $template_file = GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'admin/partials/admin-display.php';

            // Verify template file exists before including
            if (!file_exists($template_file)) {
                echo '<div class="wrap">';
                echo '<h1>' . esc_html__('Guiders SDK - Error', 'guiders-wp-plugin') . '</h1>';
                echo '<div class="notice notice-error">';
                echo '<p><strong>' . esc_html__('Error:', 'guiders-wp-plugin') . '</strong> ';
                echo esc_html__('No se pudo cargar la página de configuración. El archivo de template no existe.', 'guiders-wp-plugin');
                echo '</p>';
                echo '<p>' . esc_html__('Por favor, reinstala el plugin desde GitHub.', 'guiders-wp-plugin') . '</p>';
                echo '</div>';
                echo '</div>';

                error_log('[Guiders Admin] Settings template file not found: ' . $template_file);
                return;
            }

            include $template_file;

        } catch (Throwable $e) {
            echo '<div class="wrap">';
            echo '<h1>' . esc_html__('Guiders SDK - Error', 'guiders-wp-plugin') . '</h1>';
            echo '<div class="notice notice-error">';
            echo '<p><strong>' . esc_html__('Error:', 'guiders-wp-plugin') . '</strong> ';
            echo esc_html__('Ocurrió un error al cargar la página de configuración.', 'guiders-wp-plugin');
            echo '</p>';
            if (defined('WP_DEBUG') && WP_DEBUG) {
                echo '<p><code>' . esc_html($e->getMessage()) . '</code></p>';
            }
            echo '</div>';
            echo '</div>';

            error_log('[Guiders Admin] Error loading settings page: ' . $e->getMessage());
        }
    }
    
    /**
     * General section callback
     */
    public function generalSectionCallback() {
        echo '<p>' . __('Configura las opciones básicas del SDK de Guiders.', 'guiders-wp-plugin') . '</p>';
    }
    
    /**
     * Features section callback
     */
    public function featuresSectionCallback() {
        echo '<p>' . __('Configura las características específicas del SDK.', 'guiders-wp-plugin') . '</p>';
    }
    
    /**
     * API Key field callback
     */
    public function apiKeyFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $api_key = isset($settings['api_key']) ? $settings['api_key'] : '';
        echo '<input type="text" id="api_key" name="guiders_wp_plugin_settings[api_key]" value="' . esc_attr($api_key) . '" class="regular-text" />';
        echo '<p class="description">' . __('Tu API Key de Guiders. Obténla desde tu panel de control de Guiders.', 'guiders-wp-plugin') . '</p>';
    }
    
    /**
     * Enabled field callback
     */
    public function enabledFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $enabled = isset($settings['enabled']) ? $settings['enabled'] : false;
        echo '<input type="checkbox" id="enabled" name="guiders_wp_plugin_settings[enabled]" value="1" ' . checked(1, $enabled, false) . ' />';
        echo '<label for="enabled">' . __('Habilitar el SDK de Guiders en tu sitio web', 'guiders-wp-plugin') . '</label>';
    }
    
    /**
     * Environment field callback
     */
    public function environmentFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $environment = isset($settings['environment']) ? $settings['environment'] : 'production';
        echo '<select id="environment" name="guiders_wp_plugin_settings[environment]">';
        echo '<option value="production" ' . selected('production', $environment, false) . '>' . __('Producción', 'guiders-wp-plugin') . '</option>';
        echo '<option value="development" ' . selected('development', $environment, false) . '>' . __('Desarrollo', 'guiders-wp-plugin') . '</option>';
        echo '</select>';
        echo '<p class="description">' . __('Selecciona el entorno. Usa "Desarrollo" solo para pruebas locales.', 'guiders-wp-plugin') . '</p>';
    }
    
    /**
     * Chat enabled field callback
     */
    public function chatEnabledFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $chat_enabled = isset($settings['chat_enabled']) ? $settings['chat_enabled'] : true;
        echo '<input type="checkbox" id="chat_enabled" name="guiders_wp_plugin_settings[chat_enabled]" value="1" ' . checked(1, $chat_enabled, false) . ' />';
        echo '<label for="chat_enabled">' . __('Habilitar el chat en vivo con carga diferida', 'guiders-wp-plugin') . '</label>';
    }
    
    /**
     * Tracking enabled field callback
     */
    public function trackingEnabledFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $tracking_enabled = isset($settings['tracking_enabled']) ? $settings['tracking_enabled'] : true;
        echo '<input type="checkbox" id="tracking_enabled" name="guiders_wp_plugin_settings[tracking_enabled]" value="1" ' . checked(1, $tracking_enabled, false) . ' />';
        echo '<label for="tracking_enabled">' . __('Habilitar el tracking automático de eventos', 'guiders-wp-plugin') . '</label>';
    }
    
    /**
     * Heuristic detection field callback
     */
    public function heuristicDetectionFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $heuristic_detection = isset($settings['heuristic_detection']) ? $settings['heuristic_detection'] : true;
        echo '<input type="checkbox" id="heuristic_detection" name="guiders_wp_plugin_settings[heuristic_detection]" value="1" ' . checked(1, $heuristic_detection, false) . ' />';
        echo '<label for="heuristic_detection">' . __('Habilitar detección heurística inteligente de elementos', 'guiders-wp-plugin') . '</label>';
        echo '<p class="description">' . __('Detecta automáticamente botones de "agregar al carrito", "contactar", etc. sin modificar el HTML.', 'guiders-wp-plugin') . '</p>';
    }
    
    /**
     * Confidence threshold field callback
     */
    public function confidenceThresholdFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $confidence_threshold = isset($settings['confidence_threshold']) ? $settings['confidence_threshold'] : 0.7;
        echo '<input type="number" id="confidence_threshold" name="guiders_wp_plugin_settings[confidence_threshold]" value="' . esc_attr($confidence_threshold) . '" min="0" max="1" step="0.1" class="small-text" />';
        echo '<p class="description">' . __('Nivel de confianza mínimo para la detección heurística (0.0 - 1.0). Mayor valor = más estricto.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Auto init mode field callback
     */
    public function autoInitModeFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $mode = isset($settings['auto_init_mode']) ? $settings['auto_init_mode'] : 'domready';
        $options = array(
            'immediate' => __('Inmediato (tan pronto cargue el script)', 'guiders-wp-plugin'),
            'domready'  => __('DOM Ready (DOMContentLoaded)', 'guiders-wp-plugin'),
            'delayed'   => __('Delay Personalizado', 'guiders-wp-plugin'),
            'manual'    => __('Manual (lo iniciaré yo)', 'guiders-wp-plugin')
        );
        echo '<select id="auto_init_mode" name="guiders_wp_plugin_settings[auto_init_mode]">';
        foreach ($options as $val => $label) {
            echo '<option value="' . esc_attr($val) . '" ' . selected($val, $mode, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Controla cuándo se inicializa el SDK: inmediato, al estar listo el DOM, con delay o manual.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Auto init delay field callback
     */
    public function autoInitDelayFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $delay = isset($settings['auto_init_delay']) ? intval($settings['auto_init_delay']) : 500;
        echo '<input type="number" id="auto_init_delay" name="guiders_wp_plugin_settings[auto_init_delay]" value="' . esc_attr($delay) . '" min="0" max="60000" step="100" class="small-text" />';
        echo '<p class="description">' . __('Milisegundos de espera si el modo = Delay Personalizado (0 - 60000).', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Welcome messages section callback
     */
    public function welcomeMessagesSectionCallback() {
        echo '<p>' . __('Configura los mensajes de bienvenida automáticos que aparecerán cuando los usuarios abran el chat.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Welcome message enabled field callback
     */
    public function welcomeMessageEnabledFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $enabled = isset($settings['welcome_message_enabled']) ? $settings['welcome_message_enabled'] : true;
        echo '<input type="checkbox" id="welcome_message_enabled" name="guiders_wp_plugin_settings[welcome_message_enabled]" value="1" ' . checked($enabled, true, false) . ' />';
        echo '<label for="welcome_message_enabled">' . __('Mostrar mensajes de bienvenida automáticamente', 'guiders-wp-plugin') . '</label>';
    }

    /**
     * Welcome message style field callback
     */
    public function welcomeMessageStyleFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $style = isset($settings['welcome_message_style']) ? $settings['welcome_message_style'] : 'friendly';
        
        $styles = array(
            'friendly' => __('😊 Amigable - Tono cálido y acogedor', 'guiders-wp-plugin'),
            'professional' => __('👔 Profesional - Formal y confiable', 'guiders-wp-plugin'),
            'casual' => __('🤙 Casual - Relajado y moderno', 'guiders-wp-plugin'),
            'helpful' => __('🌟 Útil - Enfocado en soluciones', 'guiders-wp-plugin'),
            'custom' => __('✏️ Personalizado - Usar mensaje personalizado', 'guiders-wp-plugin')
        );
        
        echo '<select id="welcome_message_style" name="guiders_wp_plugin_settings[welcome_message_style]">';
        foreach ($styles as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($style, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Selecciona el estilo del mensaje de bienvenida.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Welcome message language field callback
     */
    public function welcomeMessageLanguageFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $language = isset($settings['welcome_message_language']) ? $settings['welcome_message_language'] : 'es';
        
        $languages = array(
            'es' => __('🇪🇸 Español', 'guiders-wp-plugin'),
            'en' => __('🇺🇸 English', 'guiders-wp-plugin')
        );
        
        echo '<select id="welcome_message_language" name="guiders_wp_plugin_settings[welcome_message_language]">';
        foreach ($languages as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($language, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
    }

    /**
     * Welcome message include emojis field callback
     */
    public function welcomeMessageIncludeEmojisFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $include_emojis = isset($settings['welcome_message_include_emojis']) ? $settings['welcome_message_include_emojis'] : true;
        echo '<input type="checkbox" id="welcome_message_include_emojis" name="guiders_wp_plugin_settings[welcome_message_include_emojis]" value="1" ' . checked($include_emojis, true, false) . ' />';
        echo '<label for="welcome_message_include_emojis">' . __('Incluir emojis en los mensajes', 'guiders-wp-plugin') . '</label>';
    }

    /**
     * Welcome message show tips field callback
     */
    public function welcomeMessageShowTipsFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $show_tips = isset($settings['welcome_message_show_tips']) ? $settings['welcome_message_show_tips'] : true;
        echo '<input type="checkbox" id="welcome_message_show_tips" name="guiders_wp_plugin_settings[welcome_message_show_tips]" value="1" ' . checked($show_tips, true, false) . ' />';
        echo '<label for="welcome_message_show_tips">' . __('Mostrar consejos adicionales después del mensaje principal', 'guiders-wp-plugin') . '</label>';
    }

    /**
     * Custom welcome message field callback
     */
    public function welcomeMessageCustomFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $custom_message = isset($settings['welcome_message_custom']) ? $settings['welcome_message_custom'] : '';
        echo '<textarea id="welcome_message_custom" name="guiders_wp_plugin_settings[welcome_message_custom]" rows="4" cols="50" class="large-text">' . esc_textarea($custom_message) . '</textarea>';
        echo '<p class="description">' . __('Mensaje personalizado (se usará si seleccionas "Personalizado" como estilo).', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Business template field callback
     */
    public function welcomeMessageBusinessTemplateFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $template = isset($settings['welcome_message_business_template']) ? $settings['welcome_message_business_template'] : '';
        
        $templates = array(
            '' => __('-- Seleccionar plantilla --', 'guiders-wp-plugin'),
            'ecommerce' => __('🛍️ E-commerce - Tiendas online, marketplace', 'guiders-wp-plugin'),
            'saas' => __('💻 SaaS - Software, aplicaciones', 'guiders-wp-plugin'),
            'healthcare' => __('🏥 Salud - Clínicas, hospitales', 'guiders-wp-plugin'),
            'education' => __('📚 Educación - Cursos, academias', 'guiders-wp-plugin'),
            'finance' => __('💰 Finanzas - Bancos, fintech', 'guiders-wp-plugin')
        );
        
        echo '<select id="welcome_message_business_template" name="guiders_wp_plugin_settings[welcome_message_business_template]">';
        foreach ($templates as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($template, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Selecciona una plantilla predefinida según tu tipo de negocio. Esto sobrescribirá el mensaje personalizado.', 'guiders-wp-plugin') . '</p>';
        
        echo '<script>
        jQuery(document).ready(function($) {
            $("#welcome_message_business_template").change(function() {
                if ($(this).val() !== "") {
                    $("#welcome_message_style").val("custom");
                }
            });
        });
        </script>';
    }

    // === Active Hours Field Callbacks ===

    /**
     * Active hours section callback
     */
    public function activeHoursSectionCallback() {
        echo '<p>' . __('Configure los horarios en los que el chat estará disponible para sus visitantes. Fuera de estos horarios, el chat estará oculto.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Active hours enabled field callback
     */
    public function activeHoursEnabledFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $enabled = isset($settings['active_hours_enabled']) ? $settings['active_hours_enabled'] : false;
        
        echo '<input type="checkbox" id="active_hours_enabled" name="guiders_wp_plugin_settings[active_hours_enabled]" value="1" ' . checked($enabled, true, false) . ' />';
        echo '<label for="active_hours_enabled">' . __('Activar restricción por horarios', 'guiders-wp-plugin') . '</label>';
        echo '<p class="description">' . __('Si está desactivado, el chat estará disponible las 24 horas.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Active hours timezone field callback
     */
    public function activeHoursTimezoneFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $timezone = isset($settings['active_hours_timezone']) ? $settings['active_hours_timezone'] : '';
        
        // Get common timezones
        $timezones = array(
            '' => __('-- Usar zona horaria local del navegador --', 'guiders-wp-plugin'),
            'America/New_York' => __('America/New_York (EST/EDT)', 'guiders-wp-plugin'),
            'America/Chicago' => __('America/Chicago (CST/CDT)', 'guiders-wp-plugin'),
            'America/Denver' => __('America/Denver (MST/MDT)', 'guiders-wp-plugin'),
            'America/Los_Angeles' => __('America/Los_Angeles (PST/PDT)', 'guiders-wp-plugin'),
            'America/Mexico_City' => __('America/Mexico_City (México)', 'guiders-wp-plugin'),
            'America/Bogota' => __('America/Bogota (Colombia)', 'guiders-wp-plugin'),
            'America/Lima' => __('America/Lima (Perú)', 'guiders-wp-plugin'),
            'America/Argentina/Buenos_Aires' => __('America/Argentina/Buenos_Aires (Argentina)', 'guiders-wp-plugin'),
            'America/Sao_Paulo' => __('America/Sao_Paulo (Brasil)', 'guiders-wp-plugin'),
            'Europe/Madrid' => __('Europe/Madrid (España)', 'guiders-wp-plugin'),
            'Europe/London' => __('Europe/London (Reino Unido)', 'guiders-wp-plugin'),
            'Europe/Paris' => __('Europe/Paris (Francia)', 'guiders-wp-plugin'),
            'UTC' => __('UTC (Tiempo Universal Coordinado)', 'guiders-wp-plugin')
        );
        
        echo '<select id="active_hours_timezone" name="guiders_wp_plugin_settings[active_hours_timezone]">';
        foreach ($timezones as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($timezone, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Seleccione la zona horaria para interpretar los horarios configurados. Si no se especifica, se usará la zona horaria local del navegador del visitante.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Active hours ranges field callback
     */
    public function activeHoursRangesFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $ranges_json = isset($settings['active_hours_ranges']) ? $settings['active_hours_ranges'] : '[]';
        $ranges = json_decode($ranges_json, true);
        if (!is_array($ranges)) {
            $ranges = array();
        }
        
        echo '<div id="active-hours-ranges-container">';
        echo '<div id="active-hours-ranges">';
        
        if (empty($ranges)) {
            // Default example range
            $ranges = array(array('start' => '09:00', 'end' => '18:00'));
        }
        
        foreach ($ranges as $index => $range) {
            echo '<div class="active-hours-range" data-index="' . $index . '">';
            echo '<label>' . __('Desde:', 'guiders-wp-plugin') . '</label> ';
            echo '<input type="time" class="range-start" value="' . esc_attr($range['start']) . '" /> ';
            echo '<label>' . __('Hasta:', 'guiders-wp-plugin') . '</label> ';
            echo '<input type="time" class="range-end" value="' . esc_attr($range['end']) . '" /> ';
            echo '<button type="button" class="button remove-range">' . __('Eliminar', 'guiders-wp-plugin') . '</button>';
            echo '</div>';
        }
        
        echo '</div>';
        echo '<button type="button" id="add-range" class="button">' . __('+ Agregar horario', 'guiders-wp-plugin') . '</button>';
        echo '</div>';
        
        echo '<input type="hidden" id="active_hours_ranges" name="guiders_wp_plugin_settings[active_hours_ranges]" value="' . esc_attr($ranges_json) . '" />';
        
        echo '<p class="description">' . __('Configure uno o más rangos de horarios. Ejemplo: 08:00-14:00 y 15:00-17:00 para horario partido.', 'guiders-wp-plugin') . '</p>';
        
        // JavaScript for managing ranges
        echo '<script>
        jQuery(document).ready(function($) {
            function updateRangesInput() {
                var ranges = [];
                $("#active-hours-ranges .active-hours-range").each(function() {
                    var start = $(this).find(".range-start").val();
                    var end = $(this).find(".range-end").val();
                    if (start && end) {
                        ranges.push({start: start, end: end});
                    }
                });
                $("#active_hours_ranges").val(JSON.stringify(ranges));
            }
            
            $("#add-range").click(function() {
                var index = $("#active-hours-ranges .active-hours-range").length;
                var rangeHtml = \'<div class="active-hours-range" data-index="\' + index + \'">\' +
                    \'<label>' . __('Desde:', 'guiders-wp-plugin') . '</label> \' +
                    \'<input type="time" class="range-start" value="09:00" /> \' +
                    \'<label>' . __('Hasta:', 'guiders-wp-plugin') . '</label> \' +
                    \'<input type="time" class="range-end" value="18:00" /> \' +
                    \'<button type="button" class="button remove-range">' . __('Eliminar', 'guiders-wp-plugin') . '</button>\' +
                    \'</div>\';
                $("#active-hours-ranges").append(rangeHtml);
                updateRangesInput();
            });
            
            $(document).on("click", ".remove-range", function() {
                $(this).closest(".active-hours-range").remove();
                updateRangesInput();
            });
            
            $(document).on("change", ".range-start, .range-end", function() {
                updateRangesInput();
            });
            
            // Initialize
            updateRangesInput();
        });
        </script>';
        
        echo '<style>
        .active-hours-range {
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f9f9f9;
        }
        .active-hours-range label {
            margin-left: 10px;
            margin-right: 5px;
        }
        .active-hours-range input[type="time"] {
            margin-right: 10px;
        }
        #add-range {
            margin-top: 10px;
        }
        </style>';
    }

    /**
     * Active hours fallback message field callback
     */
    public function activeHoursFallbackMessageFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $message = isset($settings['active_hours_fallback_message']) ? $settings['active_hours_fallback_message'] : '';
        
        echo '<textarea id="active_hours_fallback_message" name="guiders_wp_plugin_settings[active_hours_fallback_message]" rows="3" cols="50" class="large-text">' . esc_textarea($message) . '</textarea>';
        echo '<p class="description">' . __('Mensaje que se mostrará cuando el chat no esté disponible por horarios. Si se deja vacío, se usará un mensaje predeterminado.', 'guiders-wp-plugin') . '</p>';
    }

    // === GDPR & Consent Banner Field Callbacks ===

    /**
     * GDPR section callback
     */
    public function gdprSectionCallback() {
        echo '<div class="notice notice-info inline">';
        echo '<p><strong>⚠️ Importante:</strong> Por defecto, el SDK funciona sin requerir consentimiento GDPR (<code>requireConsent: false</code>).</p>';
        echo '<p>Esta sección es <strong>solo para sitios de la UE</strong> que necesitan cumplimiento GDPR/LOPDGDD.</p>';
        echo '<p>Si no estás en la UE, puedes dejar estas opciones desactivadas y el SDK funcionará inmediatamente.</p>';
        echo '</div>';
        echo '<p>' . __('Configura el banner de consentimiento GDPR integrado. El banner se mostrará automáticamente cuando actives ambas opciones a continuación.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Consent banner enabled field callback
     */
    public function consentBannerEnabledFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $enabled = isset($settings['consent_banner_enabled']) ? $settings['consent_banner_enabled'] : false;
        $requireConsent = isset($settings['require_consent']) ? $settings['require_consent'] : false;

        echo '<input type="checkbox" id="consent_banner_enabled" name="guiders_wp_plugin_settings[consent_banner_enabled]" value="1" ' . checked($enabled, true, false) . ' />';
        echo '<label for="consent_banner_enabled">' . __('Mostrar banner de consentimiento automáticamente', 'guiders-wp-plugin') . '</label>';
        echo '<p class="description">';
        echo '<strong>⚠️ IMPORTANTE:</strong> Este banner solo se mostrará si también activas "Requerir Consentimiento GDPR" abajo. ';
        echo __('Si está desactivado, deberás implementar tu propio banner o usar un plugin de terceros (Complianz, CookieYes, etc.).', 'guiders-wp-plugin');
        echo '</p>';

        // Show warning if banner is enabled but requireConsent is not
        if ($enabled && !$requireConsent) {
            echo '<div class="notice notice-warning inline" style="margin-top:10px; padding: 10px;">';
            echo '<p style="margin:0;"><strong>⚠️ Advertencia:</strong> Has activado el banner pero "Requerir Consentimiento GDPR" está desactivado. El banner NO se mostrará hasta que actives ambas opciones.</p>';
            echo '</div>';
        }
    }

    /**
     * Require consent field callback
     */
    public function requireConsentFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $require_consent = isset($settings['require_consent']) ? $settings['require_consent'] : false;

        echo '<input type="checkbox" id="require_consent" name="guiders_wp_plugin_settings[require_consent]" value="1" ' . checked($require_consent, true, false) . ' />';
        echo '<label for="require_consent">' . __('Requerir consentimiento del usuario antes de inicializar el SDK', 'guiders-wp-plugin') . '</label>';
        echo '<p class="description">';
        echo '<strong>' . __('✅ Activado (recomendado para sitios en EU):', 'guiders-wp-plugin') . '</strong> ';
        echo __('El SDK no se inicializará hasta que el usuario otorgue consentimiento. Cumple con GDPR/LOPDGDD.', 'guiders-wp-plugin');
        echo '<br>';
        echo '<strong>' . __('❌ Desactivado:', 'guiders-wp-plugin') . '</strong> ';
        echo __('El SDK se inicializa inmediatamente sin esperar consentimiento. Útil para sitios fuera de la UE o que usan otro sistema de consentimiento.', 'guiders-wp-plugin');
        echo '</p>';
    }

    /**
     * Consent banner style field callback
     */
    public function consentBannerStyleFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $style = isset($settings['consent_banner_style']) ? $settings['consent_banner_style'] : 'bottom_bar';

        $styles = array(
            'bottom_bar' => __('Barra inferior (recomendado)', 'guiders-wp-plugin'),
            'modal' => __('Modal centrado', 'guiders-wp-plugin'),
            'corner' => __('Esquina inferior derecha', 'guiders-wp-plugin')
        );

        echo '<select id="consent_banner_style" name="guiders_wp_plugin_settings[consent_banner_style]">';
        foreach ($styles as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($style, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Elige el estilo de presentación del banner.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Consent banner text field callback
     */
    public function consentBannerTextFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $text = isset($settings['consent_banner_text']) ? $settings['consent_banner_text'] : '🍪 Usamos cookies para mejorar tu experiencia y proporcionar chat en vivo.';

        echo '<textarea id="consent_banner_text" name="guiders_wp_plugin_settings[consent_banner_text]" rows="3" cols="50" class="large-text">' . esc_textarea($text) . '</textarea>';
        echo '<p class="description">' . __('Texto que se mostrará en el banner de consentimiento.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Consent accept text field callback
     */
    public function consentAcceptTextFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $text = isset($settings['consent_accept_text']) ? $settings['consent_accept_text'] : 'Aceptar Todo';

        echo '<input type="text" id="consent_accept_text" name="guiders_wp_plugin_settings[consent_accept_text]" value="' . esc_attr($text) . '" class="regular-text" />';
        echo '<p class="description">' . __('Texto del botón para aceptar todas las cookies.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Consent deny text field callback
     */
    public function consentDenyTextFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $text = isset($settings['consent_deny_text']) ? $settings['consent_deny_text'] : 'Rechazar';

        echo '<input type="text" id="consent_deny_text" name="guiders_wp_plugin_settings[consent_deny_text]" value="' . esc_attr($text) . '" class="regular-text" />';
        echo '<p class="description">' . __('Texto del botón para rechazar cookies no esenciales.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Consent show preferences field callback
     */
    public function consentShowPreferencesFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        $show = isset($settings['consent_show_preferences']) ? $settings['consent_show_preferences'] : true;

        echo '<input type="checkbox" id="consent_show_preferences" name="guiders_wp_plugin_settings[consent_show_preferences]" value="1" ' . checked($show, true, false) . ' />';
        echo '<label for="consent_show_preferences">' . __('Mostrar botón de preferencias en el banner', 'guiders-wp-plugin') . '</label>';
        echo '<p class="description">' . __('Permite al usuario configurar qué categorías de cookies acepta.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Consent banner colors field callback
     */
    public function consentBannerColorsFieldCallback() {
        $settings = get_option('guiders_wp_plugin_settings', array());

        $bg_color = isset($settings['consent_banner_bg_color']) ? $settings['consent_banner_bg_color'] : '#2c3e50';
        $text_color = isset($settings['consent_banner_text_color']) ? $settings['consent_banner_text_color'] : '#ffffff';
        $accept_color = isset($settings['consent_accept_color']) ? $settings['consent_accept_color'] : '#27ae60';
        $deny_color = isset($settings['consent_deny_color']) ? $settings['consent_deny_color'] : '#95a5a6';
        $preferences_color = isset($settings['consent_preferences_color']) ? $settings['consent_preferences_color'] : '#3498db';

        echo '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 600px;">';

        echo '<div>';
        echo '<label>' . __('Color de fondo:', 'guiders-wp-plugin') . '</label><br>';
        echo '<input type="text" name="guiders_wp_plugin_settings[consent_banner_bg_color]" value="' . esc_attr($bg_color) . '" class="guiders-color-picker" />';
        echo '</div>';

        echo '<div>';
        echo '<label>' . __('Color de texto:', 'guiders-wp-plugin') . '</label><br>';
        echo '<input type="text" name="guiders_wp_plugin_settings[consent_banner_text_color]" value="' . esc_attr($text_color) . '" class="guiders-color-picker" />';
        echo '</div>';

        echo '<div>';
        echo '<label>' . __('Botón Aceptar:', 'guiders-wp-plugin') . '</label><br>';
        echo '<input type="text" name="guiders_wp_plugin_settings[consent_accept_color]" value="' . esc_attr($accept_color) . '" class="guiders-color-picker" />';
        echo '</div>';

        echo '<div>';
        echo '<label>' . __('Botón Rechazar:', 'guiders-wp-plugin') . '</label><br>';
        echo '<input type="text" name="guiders_wp_plugin_settings[consent_deny_color]" value="' . esc_attr($deny_color) . '" class="guiders-color-picker" />';
        echo '</div>';

        echo '<div>';
        echo '<label>' . __('Botón Preferencias:', 'guiders-wp-plugin') . '</label><br>';
        echo '<input type="text" name="guiders_wp_plugin_settings[consent_preferences_color]" value="' . esc_attr($preferences_color) . '" class="guiders-color-picker" />';
        echo '</div>';

        echo '</div>';

        echo '<script>
        jQuery(document).ready(function($) {
            if (typeof $.fn.wpColorPicker !== "undefined") {
                $(".guiders-color-picker").wpColorPicker();
            }
        });
        </script>';

        echo '<p class="description">' . __('Personaliza los colores del banner para que coincidan con tu marca.', 'guiders-wp-plugin') . '</p>';
    }

    /**
     * Enqueue admin assets
     */
    public function enqueueAdminAssets($hook) {
        // Only load on plugin settings page
        if ($hook !== 'settings_page_guiders-settings') {
            return;
        }

        // Add WordPress color picker
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');

        // Add admin styles if needed
        wp_enqueue_style('guiders-admin-style', GUIDERS_WP_PLUGIN_PLUGIN_URL . 'assets/css/admin-style.css', array('wp-color-picker'), GUIDERS_WP_PLUGIN_VERSION);

        // Add inline JavaScript for real-time validation
        $inline_js = "
        jQuery(document).ready(function($) {
            var consentBannerCheckbox = $('#consent_banner_enabled');
            var requireConsentCheckbox = $('#require_consent');

            function checkDependency() {
                var bannerEnabled = consentBannerCheckbox.is(':checked');
                var requireEnabled = requireConsentCheckbox.is(':checked');

                // Remove existing warning
                consentBannerCheckbox.closest('td').find('.guiders-inline-warning').remove();

                // Show warning if banner is enabled but requireConsent is not
                if (bannerEnabled && !requireEnabled) {
                    var warning = $('<div class=\"notice notice-warning inline guiders-inline-warning\" style=\"margin-top:10px; padding: 10px;\">' +
                        '<p style=\"margin:0;\"><strong>⚠️ Advertencia:</strong> Has activado el banner pero \"Requerir Consentimiento GDPR\" está desactivado. ' +
                        'El banner NO se mostrará hasta que actives ambas opciones.</p>' +
                        '</div>');
                    consentBannerCheckbox.closest('td').append(warning);
                }
            }

            // Check on load
            checkDependency();

            // Check on change
            consentBannerCheckbox.on('change', checkDependency);
            requireConsentCheckbox.on('change', checkDependency);
        });
        ";

        wp_add_inline_script('wp-color-picker', $inline_js);
    }
    
    /**
     * Show admin notices
     */
    public function showAdminNotices() {
        $settings = get_option('guiders_wp_plugin_settings', array());
        
        // Show notice if API key is not set but plugin is enabled
        if (!empty($settings['enabled']) && empty($settings['api_key'])) {
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p>' . sprintf(
                __('Guiders SDK está habilitado pero no se ha configurado la API Key. <a href="%s">Configúrala aquí</a>.', 'guiders-wp-plugin'),
                admin_url('admin.php?page=guiders-settings')
            ) . '</p>';
            echo '</div>';
        }
        
        // Show success notice after settings save
        if (isset($_GET['settings-updated']) && $_GET['settings-updated'] === 'true' && isset($_GET['page']) && $_GET['page'] === 'guiders-settings') {
            echo '<div class="notice notice-success is-dismissible">';
            echo '<p>' . __('Configuración de Guiders SDK guardada correctamente.', 'guiders-wp-plugin') . '</p>';
            echo '</div>';
        }
    }
}