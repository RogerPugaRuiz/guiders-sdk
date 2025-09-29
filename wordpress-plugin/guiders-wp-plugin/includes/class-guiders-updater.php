<?php
/**
 * Guiders Plugin Updater
 * 
 * Handles automatic updates from GitHub releases
 * 
 * @package GuidersWPPlugin
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class GuidersUpdater {
    
    /**
     * GitHub repository information
     */
    private const GITHUB_REPO = 'RogerPugaRuiz/guiders-sdk';
    private const GITHUB_API_URL = 'https://api.github.com/repos/' . self::GITHUB_REPO . '/releases';
    
    /**
     * Plugin information
     */
    private $plugin_file;
    private $plugin_basename;
    private $plugin_data;
    private $update_transient_key;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->plugin_file = GUIDERS_WP_PLUGIN_PLUGIN_FILE;
        $this->plugin_basename = GUIDERS_WP_PLUGIN_PLUGIN_BASENAME;
        $this->update_transient_key = 'guiders_wp_plugin_update_check';
        
        $this->initHooks();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function initHooks() {
        // Check for updates
        add_filter('pre_set_site_transient_update_plugins', array($this, 'checkForUpdate'));
        
        // Plugin information popup
        add_filter('plugins_api', array($this, 'pluginInfoPopup'), 10, 3);
        
        // After plugin update
        add_action('upgrader_process_complete', array($this, 'afterUpdate'), 10, 2);
        
        // Clear update transient when checking manually
        add_action('load-update-plugins.php', array($this, 'clearUpdateTransient'));
        add_action('load-plugins.php', array($this, 'clearUpdateTransient'));
    }
    
    /**
     * Clear the update transient when needed
     */
    public function clearUpdateTransient() {
        if (isset($_GET['force-check'])) {
            delete_transient($this->update_transient_key);
        }
    }
    
    /**
     * Check for plugin updates
     */
    public function checkForUpdate($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }
        
        // Get plugin data
        if (!function_exists('get_plugin_data')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $this->plugin_data = get_plugin_data($this->plugin_file);
        $current_version = $this->plugin_data['Version'];
        
        // Check cached version info
        $version_info = get_transient($this->update_transient_key);
        
        if ($version_info === false) {
            $version_info = $this->getLatestVersionInfo();
            
            if ($version_info) {
                // Cache for 6 hours
                set_transient($this->update_transient_key, $version_info, 6 * HOUR_IN_SECONDS);
            }
        }
        
        // Compare versions
        if ($version_info && version_compare($current_version, $version_info['version'], '<')) {
            $transient->response[$this->plugin_basename] = (object) array(
                'slug'          => dirname($this->plugin_basename),
                'plugin'        => $this->plugin_basename,
                'new_version'   => $version_info['version'],
                'url'           => $this->plugin_data['PluginURI'],
                'package'       => $version_info['download_url'],
                'tested'        => $version_info['tested'] ?? '6.4',
                'requires_php'  => $version_info['requires_php'] ?? '7.4',
                'compatibility' => new stdClass(),
                'icons'         => array(
                    '1x' => 'https://github.com/RogerPugaRuiz/guiders-sdk/raw/main/wordpress-plugin/icon-128x128.png',
                    '2x' => 'https://github.com/RogerPugaRuiz/guiders-sdk/raw/main/wordpress-plugin/icon-256x256.png'
                ),
                'banners'       => array(
                    'low'  => 'https://github.com/RogerPugaRuiz/guiders-sdk/raw/main/wordpress-plugin/banner-772x250.png',
                    'high' => 'https://github.com/RogerPugaRuiz/guiders-sdk/raw/main/wordpress-plugin/banner-1544x500.png'
                )
            );
            
            // Log update available
            error_log(sprintf(
                '[Guiders Plugin] Update available: %s -> %s', 
                $current_version, 
                $version_info['version']
            ));
        }
        
        return $transient;
    }
    
    /**
     * Get latest version information from GitHub
     */
    private function getLatestVersionInfo() {
        $response = wp_remote_get(self::GITHUB_API_URL, array(
            'timeout' => 15,
            'headers' => array(
                'Accept' => 'application/vnd.github+json',
                'User-Agent' => 'WordPress/' . get_bloginfo('version') . '; ' . get_bloginfo('url')
            )
        ));
        
        if (is_wp_error($response)) {
            error_log('[Guiders Plugin] Failed to check for updates: ' . $response->get_error_message());
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $releases = json_decode($body, true);
        
        if (!is_array($releases) || empty($releases)) {
            error_log('[Guiders Plugin] No releases found in GitHub API response');
            return false;
        }
        
        // Find the latest stable release (non-prerelease)
        $latest_release = null;
        foreach ($releases as $release) {
            if (!$release['draft'] && !$release['prerelease']) {
                $latest_release = $release;
                break;
            }
        }
        
        if (!$latest_release) {
            error_log('[Guiders Plugin] No stable releases found');
            return false;
        }
        
        // Find the plugin ZIP asset
        $download_url = null;
        foreach ($latest_release['assets'] as $asset) {
            if (preg_match('/guiders-wp-plugin.*\.zip$/', $asset['name'])) {
                $download_url = $asset['browser_download_url'];
                break;
            }
        }
        
        if (!$download_url) {
            error_log('[Guiders Plugin] No plugin ZIP found in release assets');
            return false;
        }
        
        $version = ltrim($latest_release['tag_name'], 'v');
        
        return array(
            'version'      => $version,
            'download_url' => $download_url,
            'details_url'  => $latest_release['html_url'],
            'changelog'    => $latest_release['body'],
            'tested'       => '6.4',
            'requires_php' => '7.4'
        );
    }
    
    /**
     * Plugin information popup
     */
    public function pluginInfoPopup($result, $action, $args) {
        if ($action !== 'plugin_information') {
            return $result;
        }
        
        if (!isset($args->slug) || $args->slug !== dirname($this->plugin_basename)) {
            return $result;
        }
        
        $version_info = get_transient($this->update_transient_key);
        
        if (!$version_info) {
            $version_info = $this->getLatestVersionInfo();
        }
        
        if (!$version_info) {
            return $result;
        }
        
        return (object) array(
            'slug'          => dirname($this->plugin_basename),
            'plugin_name'   => $this->plugin_data['Name'],
            'version'       => $version_info['version'],
            'author'        => $this->plugin_data['Author'],
            'homepage'      => $this->plugin_data['PluginURI'],
            'requires'      => '5.0',
            'tested'        => '6.4',
            'requires_php'  => '7.4',
            'downloaded'    => 0,
            'last_updated'  => date('Y-m-d'),
            'sections'      => array(
                'description' => $this->plugin_data['Description'],
                'changelog'   => $version_info['changelog'] ?? 'Ver cambios en GitHub'
            ),
            'download_link' => $version_info['download_url'],
            'banners'       => array(
                'low'  => 'https://github.com/RogerPugaRuiz/guiders-sdk/raw/main/wordpress-plugin/banner-772x250.png',
                'high' => 'https://github.com/RogerPugaRuiz/guiders-sdk/raw/main/wordpress-plugin/banner-1544x500.png'
            )
        );
    }
    
    /**
     * Actions after plugin update
     */
    public function afterUpdate($upgrader_object, $options) {
        if ($options['action'] === 'update' && $options['type'] === 'plugin') {
            foreach ($options['plugins'] as $plugin) {
                if ($plugin === $this->plugin_basename) {
                    delete_transient($this->update_transient_key);
                    
                    // Log successful update
                    error_log(sprintf(
                        '[Guiders Plugin] Successfully updated to version %s',
                        GUIDERS_WP_PLUGIN_VERSION
                    ));
                    
                    break;
                }
            }
        }
    }
    
    /**
     * Force update check (for debugging)
     */
    public function forceUpdateCheck() {
        delete_transient($this->update_transient_key);
        wp_update_plugins();
    }
}