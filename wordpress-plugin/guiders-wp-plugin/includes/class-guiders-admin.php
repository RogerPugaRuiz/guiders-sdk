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