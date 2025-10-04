<?php
/**
 * Automatic plugin updater using Plugin Update Checker library
 * 
 * This class manages automatic updates from GitHub releases using the
 * Plugin Update Checker library (v5.6) by Yahnis Elsts.
 * 
 * SAFETY FEATURES (v1.2.1):
 * - No global variables (uses private class property)
 * - Full try-catch protection to prevent fatal errors
 * - All methods verify library loaded before execution
 * - Graceful degradation: plugin works even if PUC unavailable
 * - Defensive null checks throughout
 * 
 * @link https://github.com/YahnisElsts/plugin-update-checker Plugin Update Checker
 * @since 1.2.0
 * @version 1.2.1
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Guiders_Updater class
 * Handles automatic plugin updates from GitHub releases
 * 
 * @since 1.2.0
 */
class Guiders_Updater {
    
    /**
     * GitHub repository URL for updates
     */
    const GITHUB_REPO_URL = 'https://github.com/RogerPugaRuiz/guiders-sdk';
    
    /**
     * Update checker instance (null if PUC not available)
     * @var \YahnisElsts\PluginUpdateChecker\v5\Plugin\UpdateChecker|null
     */
    private $updateChecker = null;
    
    /**
     * Whether Plugin Update Checker library is available
     * @var bool
     */
    private $libraryAvailable = false;
    
    /**
     * Constructor - Initialize update checker with full error protection
     */
    public function __construct() {
        // Try to load PUC library safely
        $this->loadLibrary();
        
        // Initialize only if library loaded successfully
        if ($this->libraryAvailable) {
            try {
                $this->initUpdateChecker();
                $this->setupCustomizations();
            } catch (Exception $e) {
                // Catch any errors during initialization
                $this->libraryAvailable = false;
                $this->updateChecker = null;
                $this->logError('Failed to initialize updater: ' . $e->getMessage());
            }
        }
    }
    
    /**
     * Load Plugin Update Checker library safely
     * Sets $this->libraryAvailable flag based on success
     * 
     * @return void
     */
    private function loadLibrary() {
        $puc_path = GUIDERS_WP_PLUGIN_PLUGIN_DIR . 'vendor/plugin-update-checker/plugin-update-checker.php';
        
        // Check file exists
        if (!file_exists($puc_path)) {
            $this->logError('Plugin Update Checker library not found at: ' . $puc_path);
            return;
        }
        
        // Try to require the library
        try {
            require_once $puc_path;
            
            // Verify the class exists after loading
            if (!class_exists('YahnisElsts\PluginUpdateChecker\v5\PucFactory')) {
                $this->logError('Plugin Update Checker loaded but PucFactory class not found');
                return;
            }
            
            // Success - library available
            $this->libraryAvailable = true;
            $this->logDebug('Plugin Update Checker library loaded successfully');
            
        } catch (Exception $e) {
            $this->logError('Error loading Plugin Update Checker: ' . $e->getMessage());
        }
    }
    
    /**
     * Initialize the update checker using Plugin Update Checker library
     * 
     * @throws Exception If initialization fails
     * @return void
     */
    private function initUpdateChecker() {
        // Double-check library is available
        if (!$this->libraryAvailable) {
            throw new Exception('Cannot initialize: PUC library not available');
        }
        
        // Use fully qualified class name to avoid use statement
        $this->updateChecker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
            self::GITHUB_REPO_URL,
            GUIDERS_WP_PLUGIN_PLUGIN_FILE,
            'guiders-wp-plugin'
        );
        
        // Verify we got a valid instance
        if (!$this->updateChecker) {
            throw new Exception('PucFactory returned null instance');
        }
        
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
        
        // Set update check period (12 hours)
        $this->updateChecker->setCheckPeriod(12);
        
        // Log successful initialization
        $this->logDebug('Update checker initialized successfully for: ' . self::GITHUB_REPO_URL);
        
        // Setup error logging if WP_DEBUG enabled
        if (defined('WP_DEBUG') && WP_DEBUG) {
            add_action('puc_api_error', array($this, 'logApiError'), 10, 4);
        }
    }
    
    /**
     * Setup customizations for the update info display
     * PROTECTED: Only runs if updateChecker initialized successfully
     * 
     * @return void
     */
    private function setupCustomizations() {
        // Verify updateChecker is available
        if (!$this->updateChecker) {
            $this->logError('Cannot setup customizations: updateChecker is null');
            return;
        }
        
        // Add custom icons and banners
        add_filter('puc_request_info_result-guiders-wp-plugin', array($this, 'customizePluginInfo'), 10, 2);
        
        // Log successful updates
        add_action('upgrader_process_complete', array($this, 'logSuccessfulUpdate'), 10, 2);
        
        $this->logDebug('Update customizations configured');
    }
    
    /**
     * Customize plugin information display
     * 
     * @param object $pluginInfo Plugin information object
     * @param array $result API result
     * @return object Modified plugin information
     */
    public function customizePluginInfo($pluginInfo, $result) {
        // Add custom icons/banners if needed
        // For now, use defaults from GitHub repository
        
        // You can customize these later:
        // $pluginInfo->icons = array(
        //     '1x' => 'https://example.com/icon-128x128.png',
        //     '2x' => 'https://example.com/icon-256x256.png',
        // );
        
        return $pluginInfo;
    }
    
    /**
     * Log API errors for debugging
     * 
     * @param WP_Error $error WordPress error object
     * @param array $httpResponse HTTP response array
     * @param string $url Request URL
     * @param string $slug Plugin slug
     */
    public function logApiError($error, $httpResponse, $url, $slug) {
        if ($slug === 'guiders-wp-plugin') {
            $this->logError(sprintf(
                'Update check failed for %s: %s (URL: %s)',
                $slug,
                $error->get_error_message(),
                $url
            ));
        }
    }
    
    /**
     * Log successful plugin updates
     * 
     * @param WP_Upgrader $upgrader Upgrader instance
     * @param array $options Update options
     */
    public function logSuccessfulUpdate($upgrader, $options) {
        if ($options['action'] === 'update' && $options['type'] === 'plugin') {
            if (isset($options['plugins'])) {
                foreach ($options['plugins'] as $plugin) {
                    if ($plugin === GUIDERS_WP_PLUGIN_PLUGIN_BASENAME) {
                        $this->logDebug('Plugin updated successfully to version: ' . GUIDERS_WP_PLUGIN_VERSION);
                    }
                }
            }
        }
    }
    
    /**
     * Force check for updates now (for manual testing)
     * PROTECTED: Verifies updateChecker available before execution
     * 
     * @return object|null Update info or null if check fails
     */
    public function forceUpdateCheck() {
        if (!$this->libraryAvailable || !$this->updateChecker) {
            $this->logError('Cannot force update check: library not available');
            return null;
        }
        
        try {
            $this->logDebug('Forcing manual update check...');
            return $this->updateChecker->checkForUpdates();
        } catch (Exception $e) {
            $this->logError('Error during forced update check: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get the update checker instance (for advanced use)
     * PROTECTED: Returns null if not initialized
     * 
     * @return \YahnisElsts\PluginUpdateChecker\v5\Plugin\UpdateChecker|null
     */
    public function getUpdateChecker() {
        return $this->updateChecker;
    }
    
    /**
     * Check if automatic updates are available
     * 
     * @return bool True if PUC library loaded and working
     */
    public function isAvailable() {
        return $this->libraryAvailable && ($this->updateChecker !== null);
    }
    
    /**
     * Log error message (always logged, regardless of WP_DEBUG)
     * 
     * @param string $message Error message
     * @return void
     */
    private function logError($message) {
        error_log('❌ [Guiders Plugin Updater] ' . $message);
    }
    
    /**
     * Log debug message (only if WP_DEBUG enabled)
     * 
     * @param string $message Debug message
     * @return void
     */
    private function logDebug($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('🔄 [Guiders Plugin Updater] ' . $message);
        }
    }
}
