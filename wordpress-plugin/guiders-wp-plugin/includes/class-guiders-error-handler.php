<?php
/**
 * Guiders Error Handler
 *
 * Provides robust error handling to prevent fatal errors from breaking WordPress.
 * This class ensures graceful degradation: if the plugin fails, WordPress continues working.
 *
 * @package GuidersWPPlugin
 * @since 1.2.0
 * @version 1.2.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Guiders_Error_Handler {

    /**
     * Collection of errors encountered during plugin initialization
     * @var array
     */
    private static $errors = array();

    /**
     * Whether the plugin is functional
     * @var bool
     */
    private static $plugin_functional = true;

    /**
     * Whether admin notice has been registered
     * @var bool
     */
    private static $notice_registered = false;

    /**
     * Safely require a file with error protection
     *
     * @param string $file Full path to the file to require
     * @param bool $critical Whether this file is critical for plugin functionality
     * @return bool True if file was loaded successfully, false otherwise
     */
    public static function safeRequire($file, $critical = true) {
        // Validate file exists
        if (!file_exists($file)) {
            $error_msg = sprintf('Missing required file: %s', basename($file));
            self::logError($error_msg, $critical);

            if ($critical) {
                self::$plugin_functional = false;
                self::registerAdminNotice();
            }

            return false;
        }

        // Try to require the file
        try {
            require_once $file;
            return true;
        } catch (Throwable $e) {
            $error_msg = sprintf(
                'Error loading file %s: %s',
                basename($file),
                $e->getMessage()
            );
            self::logError($error_msg, $critical);

            if ($critical) {
                self::$plugin_functional = false;
                self::registerAdminNotice();
            }

            return false;
        }
    }

    /**
     * Safely instantiate a class with error protection
     *
     * @param string $class Class name to instantiate
     * @param bool $critical Whether this class is critical for plugin functionality
     * @param array $args Constructor arguments (optional)
     * @return object|null Instance of the class or null if failed
     */
    public static function safeInstantiate($class, $critical = false, $args = array()) {
        // Validate class exists
        if (!class_exists($class)) {
            $error_msg = sprintf('Class not found: %s', $class);
            self::logError($error_msg, $critical);

            if ($critical) {
                self::$plugin_functional = false;
                self::registerAdminNotice();
            }

            return null;
        }

        // Try to instantiate the class
        try {
            if (empty($args)) {
                return new $class();
            } else {
                // Use reflection for constructor with arguments
                $reflection = new ReflectionClass($class);
                return $reflection->newInstanceArgs($args);
            }
        } catch (Throwable $e) {
            $error_msg = sprintf(
                'Error instantiating class %s: %s',
                $class,
                $e->getMessage()
            );
            self::logError($error_msg, $critical);

            if ($critical) {
                self::$plugin_functional = false;
                self::registerAdminNotice();
            }

            return null;
        }
    }

    /**
     * Safely execute a callable with error protection
     *
     * @param callable $callback Function or method to execute
     * @param array $args Arguments to pass to the callable
     * @param mixed $default Default value to return on error
     * @return mixed Result of the callable or default value on error
     */
    public static function safeExecute($callback, $args = array(), $default = null) {
        try {
            return call_user_func_array($callback, $args);
        } catch (Throwable $e) {
            $error_msg = sprintf(
                'Error executing callable: %s',
                $e->getMessage()
            );
            self::logError($error_msg, false);

            return $default;
        }
    }

    /**
     * Log an error message
     *
     * @param string $message Error message
     * @param bool $critical Whether this is a critical error
     * @return void
     */
    private static function logError($message, $critical = false) {
        $prefix = $critical ? '❌ [CRITICAL]' : '⚠️ [WARNING]';
        $full_message = sprintf('%s %s', $prefix, $message);

        // Store error for display in admin notice
        self::$errors[] = array(
            'message' => $message,
            'critical' => $critical,
            'time' => current_time('mysql')
        );

        // Log to WordPress error log
        error_log('[Guiders Plugin] ' . $full_message);
    }

    /**
     * Register admin notice to be displayed
     *
     * @return void
     */
    private static function registerAdminNotice() {
        if (!self::$notice_registered) {
            add_action('admin_notices', array(__CLASS__, 'showAdminNotice'));
            self::$notice_registered = true;
        }
    }

    /**
     * Display admin notice about plugin errors
     *
     * @return void
     */
    public static function showAdminNotice() {
        if (empty(self::$errors)) {
            return;
        }

        $has_critical = false;
        foreach (self::$errors as $error) {
            if ($error['critical']) {
                $has_critical = true;
                break;
            }
        }

        $notice_class = $has_critical ? 'notice-error' : 'notice-warning';

        echo '<div class="notice ' . esc_attr($notice_class) . '">';
        echo '<p><strong>Guiders SDK Plugin:</strong> ';

        if ($has_critical) {
            echo 'El plugin no pudo cargarse correctamente debido a errores críticos. ';
            echo 'WordPress sigue funcionando normalmente, pero el plugin Guiders SDK está desactivado parcialmente.';
        } else {
            echo 'Se encontraron algunos problemas durante la carga del plugin. ';
            echo 'Algunas funcionalidades pueden no estar disponibles.';
        }

        echo '</p>';

        // Show details if WP_DEBUG is enabled
        if (defined('WP_DEBUG') && WP_DEBUG) {
            echo '<details style="margin-top: 10px;">';
            echo '<summary style="cursor: pointer; font-weight: bold;">📋 Detalles técnicos (WP_DEBUG activado)</summary>';
            echo '<ul style="margin-top: 10px; list-style: disc; padding-left: 20px;">';

            foreach (self::$errors as $error) {
                $icon = $error['critical'] ? '❌' : '⚠️';
                echo '<li>' . esc_html($icon . ' ' . $error['message']) . '</li>';
            }

            echo '</ul>';
            echo '<p style="margin-top: 10px;"><strong>Soluciones sugeridas:</strong></p>';
            echo '<ul style="list-style: disc; padding-left: 20px;">';
            echo '<li>Verifica que todos los archivos del plugin estén presentes</li>';
            echo '<li>Reinstala el plugin desde GitHub</li>';
            echo '<li>Verifica los permisos de archivos (deben ser legibles)</li>';
            echo '<li>Revisa el error_log de WordPress para más detalles</li>';
            echo '</ul>';
            echo '</details>';
        } else {
            echo '<p style="margin-top: 5px;"><em>Para ver detalles técnicos, activa WP_DEBUG en wp-config.php</em></p>';
        }

        echo '</div>';
    }

    /**
     * Check if the plugin is functional
     *
     * @return bool True if plugin loaded successfully, false otherwise
     */
    public static function isPluginFunctional() {
        return self::$plugin_functional;
    }

    /**
     * Get all errors encountered
     *
     * @return array Array of error information
     */
    public static function getErrors() {
        return self::$errors;
    }

    /**
     * Check if there are any errors
     *
     * @return bool True if errors exist, false otherwise
     */
    public static function hasErrors() {
        return !empty(self::$errors);
    }

    /**
     * Check if there are any critical errors
     *
     * @return bool True if critical errors exist, false otherwise
     */
    public static function hasCriticalErrors() {
        foreach (self::$errors as $error) {
            if ($error['critical']) {
                return true;
            }
        }
        return false;
    }

    /**
     * Clear all errors (useful for testing)
     *
     * @return void
     */
    public static function clearErrors() {
        self::$errors = array();
        self::$plugin_functional = true;
        self::$notice_registered = false;
    }

    /**
     * Validate array key exists before accessing
     *
     * @param array $array Array to check
     * @param string|int $key Key to validate
     * @param mixed $default Default value if key doesn't exist
     * @return mixed Value at key or default
     */
    public static function getArrayValue($array, $key, $default = null) {
        return isset($array[$key]) ? $array[$key] : $default;
    }

    /**
     * Validate nested array keys exist before accessing
     *
     * @param array $array Array to check
     * @param array $keys Array of keys to traverse (e.g., ['user', 'profile', 'name'])
     * @param mixed $default Default value if path doesn't exist
     * @return mixed Value at path or default
     */
    public static function getNestedValue($array, $keys, $default = null) {
        $current = $array;

        foreach ($keys as $key) {
            if (!is_array($current) || !isset($current[$key])) {
                return $default;
            }
            $current = $current[$key];
        }

        return $current;
    }
}
