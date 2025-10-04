<?php
/**
 * Plugin Name: Guiders SDK
 * Plugin URI: https://github.com/RogerPugaRuiz/guiders-sdk
 * Description: Integra el SDK de Guiders para tracking inteligente, chat en vivo y notificaciones en tu sitio WordPress. Con detección heurística automática de elementos sin necesidad de modificar el HTML.
 * Version: 1.2.1
 * Author: Guiders
 * Author URI: https://guiders.ancoradual.com
 * License: ISC
 * Text Domain: guiders-wp-plugin
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GUIDERS_WP_PLUGIN_VERSION', '1.2.1');

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GUIDERS_WP_PLUGIN_VERSION', '1.1.0');
define('GUIDERS_WP_PLUGIN_PLUGIN_FILE', __FILE__);
define('GUIDERS_WP_PLUGIN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GUIDERS_WP_PLUGIN_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GUIDERS_WP_PLUGIN_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
class GuidersWPPlugin {
    
    /**
     * Plugin instance
     * @var GuidersWPPlugin
     */
    private static $instance = null;
    
    /**
     * Get plugin instance
     */
    public static function getInstance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * Initialize plugin
     */
    private function init() {
        // Load dependencies
        $this->loadDependencies();
        
        // Initialize hooks
        $this->initHooks();
        
        // Initialize admin
        if (is_admin()) {
            new GuidersAdmin();
            // Initialize updater
            new GuidersUpdater();
        }
        
        // Initialize public
        if (!is_admin()) {
            new GuidersPublic();
        }
    }
    
    /**
     * Load plugin dependencies
     */
    private function loadDependencies() {
        require_once GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'includes/class-guiders-admin.php';
        require_once GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'includes/class-guiders-public.php';
        require_once GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'includes/class-guiders-updater.php';
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function initHooks() {
        // Activation hook
        register_activation_hook(__FILE__, array($this, 'activate'));
        
        // Deactivation hook
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Add settings link to plugin page
        add_filter('plugin_action_links_' . GUIDERS_WP_PLUGIN_PLUGIN_BASENAME, array($this, 'addSettingsLink'));
        
        // Load text domain
        add_action('plugins_loaded', array($this, 'loadTextDomain'));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options
        if (!get_option('guiders_wp_plugin_settings')) {
            add_option('guiders_wp_plugin_settings', array(
                'api_key' => '',
                'enabled' => false,
                'environment' => 'production',
                'chat_enabled' => true,
                'tracking_enabled' => true,
                'heuristic_detection' => true,
                'confidence_threshold' => 0.7,
                'active_hours_enabled' => false,
                'active_hours_timezone' => '',
                'active_hours_ranges' => '[{"start":"09:00","end":"18:00"}]',
                'active_hours_fallback_message' => 'El chat no está disponible en este momento. Por favor, inténtalo más tarde durante nuestros horarios de atención.'
            ));
        }
        
        // Create custom database tables if needed (for future features)
        $this->createTables();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up any scheduled events
        wp_clear_scheduled_hook('guiders_wp_plugin_cleanup');
    }
    
    /**
     * Create database tables
     */
    private function createTables() {
        global $wpdb;
        
        // Future: Create tables for storing analytics data locally if needed
        // For now, all data is sent to Guiders API
    }
    
    /**
     * Add settings link to plugin actions
     */
    public function addSettingsLink($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=guiders-settings') . '">' . __('Configuración', 'guiders-wp-plugin') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
    
    /**
     * Load text domain for translations
     */
    public function loadTextDomain() {
        load_plugin_textdomain('guiders-wp-plugin', false, dirname(GUIDERS_WP_PLUGIN_PLUGIN_BASENAME) . '/languages');
    }
}

/**
 * Initialize plugin
 */
function guidersWPPlugin() {
    return GuidersWPPlugin::getInstance();
}

// Start the plugin
guidersWPPlugin();

/**
 * Uninstall hook
 */
register_uninstall_hook(__FILE__, 'guiders_wp_plugin_uninstall');

function guiders_wp_plugin_uninstall() {
    // Remove plugin options
    delete_option('guiders_wp_plugin_settings');
    
    // Remove any custom tables or data if created in future versions
}