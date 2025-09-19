<?php
/**
 * Admin functionality for Guiders WP Plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class GuidersAdmin {
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->initHooks();
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
        
        return $validated;
    }
    
    /**
     * Display settings page
     */
    public function displaySettingsPage() {
        if (!current_user_can('manage_options')) {
            wp_die(__('No tienes permisos suficientes para acceder a esta página.', 'guiders-wp-plugin'));
        }
        
        include GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'admin/partials/admin-display.php';
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
    
    /**
     * Enqueue admin assets
     */
    public function enqueueAdminAssets($hook) {
        // Only load on plugin settings page
        if ($hook !== 'settings_page_guiders-settings') {
            return;
        }
        
        // Add admin styles if needed
        wp_enqueue_style('guiders-admin-style', GUIDERS_WP_PLUGIN_PLUGIN_URL . 'assets/css/admin-style.css', array(), GUIDERS_WP_PLUGIN_VERSION);
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