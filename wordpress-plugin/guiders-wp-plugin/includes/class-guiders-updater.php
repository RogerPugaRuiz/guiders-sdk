<?php
/**
 * Guiders Plugin Updater
 * 
 * Handles automatic updates from GitHub releases using Plugin Update Checker library
 * @link https://github.com/YahnisElsts/plugin-update-checker
 * 
 * @package GuidersWPPlugin
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Load Plugin Update Checker library (with safety check)
$puc_path = GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'vendor/plugin-update-checker/plugin-update-checker.php';
$puc_available = false;
if (file_exists($puc_path)) {
    require_once $puc_path;
    $puc_available = true;
} else {
    // Log error but don't break the plugin
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('❌ [Guiders Plugin] Plugin Update Checker library not found at: ' . $puc_path);
        error_log('⚠️ [Guiders Plugin] Automatic updates will not be available. Please reinstall the plugin.');
    }
}

class GuidersUpdater {
    
    /**
     * GitHub repository information
     */
    private const GITHUB_REPO_URL = 'https://github.com/RogerPugaRuiz/guiders-sdk/';
    
    /**
     * Plugin update checker instance
     * @var \YahnisElsts\PluginUpdateChecker\v5p6\Vcs\PluginUpdateChecker
     */
    private $updateChecker;
    
    /**
     * Constructor - Initialize Plugin Update Checker
     */
    public function __construct() {
        // Only initialize if PUC library is available
        global $puc_available;
        if ($puc_available && class_exists('YahnisElsts\PluginUpdateChecker\v5\PucFactory')) {
            $this->initUpdateChecker();
            $this->setupCustomizations();
        } else {
            // PUC not available - disable automatic updates
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('⚠️ [Guiders Plugin] Updater initialized but Plugin Update Checker library not available');
            }
        }
    }
    
    /**
     * Initialize the update checker using Plugin Update Checker library
     */
    private function initUpdateChecker() {
        // Use fully qualified class name to avoid use statement
        $this->updateChecker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
            self::GITHUB_REPO_URL,
            GUIDERS_WP_PLUGIN_PLUGIN_FILE,
            'guiders-wp-plugin'
        );
        
        // Enable release assets (search for .zip files in GitHub releases)
        $this->updateChecker->getVcsApi()->enableReleaseAssets(
            '/guiders-wp-plugin.*\.zip$/i'
        );
        
        // Only check stable releases (skip pre-releases)
        $this->updateChecker->getVcsApi()->setReleaseFilter(function($versionNumber, $release) {
            // Skip pre-releases (alpha, beta, rc)
            if (!empty($release->prerelease)) {
                return false;
            }
            
            // Skip draft releases
            if (!empty($release->draft)) {
                return false;
            }
            
            return true;
        });
        
        // Set update check period (12 hours by default)
        $this->updateChecker->setCheckPeriod(12);
        
        // Log update checks for debugging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            add_action('puc_api_error', array($this, 'logApiError'), 10, 4);
        }
    }
    
    /**
     * Setup customizations for the update info display
     */
    private function setupCustomizations() {
        // Add custom icons and banners
        add_filter('puc_request_info_result-guiders-wp-plugin', array($this, 'customizePluginInfo'), 10, 2);
        
        // Log successful updates
        add_action('upgrader_process_complete', array($this, 'logSuccessfulUpdate'), 10, 2);
    }
    
    /**
     * Customize plugin information display
     * 
     * @param object $pluginInfo Plugin information object
     * @param array $result API result
     * @return object Modified plugin information
     */
    public function customizePluginInfo($pluginInfo, $result) {
        // Add custom icons
        if (!isset($pluginInfo->icons) || empty($pluginInfo->icons)) {
            $pluginInfo->icons = array(
                '1x' => 'https://raw.githubusercontent.com/RogerPugaRuiz/guiders-sdk/main/wordpress-plugin/icon-128x128.png',
                '2x' => 'https://raw.githubusercontent.com/RogerPugaRuiz/guiders-sdk/main/wordpress-plugin/icon-256x256.png'
            );
        }
        
        // Add custom banners
        if (!isset($pluginInfo->banners) || empty($pluginInfo->banners)) {
            $pluginInfo->banners = array(
                'low'  => 'https://raw.githubusercontent.com/RogerPugaRuiz/guiders-sdk/main/wordpress-plugin/banner-772x250.png',
                'high' => 'https://raw.githubusercontent.com/RogerPugaRuiz/guiders-sdk/main/wordpress-plugin/banner-1544x500.png'
            );
        }
        
        return $pluginInfo;
    }
    
    /**
     * Log API errors for debugging
     * 
     * @param WP_Error $error Error object
     * @param mixed $httpResponse HTTP response
     * @param string $url Request URL
     * @param string $slug Plugin slug
     */
    public function logApiError($error, $httpResponse, $url, $slug) {
        if ($slug === 'guiders-wp-plugin') {
            error_log(sprintf(
                '❌ [Guiders Plugin Update] API Error: %s (URL: %s)',
                $error->get_error_message(),
                $url
            ));
        }
    }
    
    /**
     * Log successful plugin updates
     * 
     * @param object $upgrader_object Upgrader object
     * @param array $options Update options
     */
    public function logSuccessfulUpdate($upgrader_object, $options) {
        if ($options['action'] === 'update' && $options['type'] === 'plugin') {
            foreach ($options['plugins'] as $plugin) {
                if ($plugin === GUIDERS_WP_PLUGIN_PLUGIN_BASENAME) {
                    error_log(sprintf(
                        '🚀 [Guiders Plugin] Successfully updated to version %s',
                        GUIDERS_WP_PLUGIN_VERSION
                    ));
                    break;
                }
            }
        }
    }
    
    /**
     * Force update check (for debugging)
     * Useful for testing without waiting for the scheduled check
     * 
     * @return void
     */
    public function forceUpdateCheck() {
        if ($this->updateChecker) {
            $this->updateChecker->checkForUpdates();
        }
    }
    
    /**
     * Get the update checker instance
     * Useful for external customizations
     * 
     * @return \YahnisElsts\PluginUpdateChecker\v5p6\Vcs\PluginUpdateChecker|null
     */
    public function getUpdateChecker() {
        return $this->updateChecker;
    }
}