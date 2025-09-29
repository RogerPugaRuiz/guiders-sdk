<?php
/**
 * Admin settings page template
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="guiders-admin-header">
        <h2><?php _e('Configuración del SDK de Guiders', 'guiders-wp-plugin'); ?></h2>
        <p><?php _e('Configura el SDK de Guiders para habilitar tracking inteligente, chat en vivo y notificaciones en tu sitio WordPress.', 'guiders-wp-plugin'); ?></p>
    </div>
    
    <div class="guiders-admin-content">
        <div class="guiders-main-settings">
            <form method="post" action="options.php">
                <?php
                settings_fields('guiders_wp_plugin_settings_group');
                do_settings_sections('guiders-settings');
                submit_button(__('Guardar Configuración', 'guiders-wp-plugin'));
                ?>
            </form>
        </div>
        
        <div class="guiders-sidebar">
            <div class="guiders-info-box">
                <h3><?php _e('Acerca de Guiders SDK', 'guiders-wp-plugin'); ?></h3>
                <p><?php _e('El SDK de Guiders proporciona:', 'guiders-wp-plugin'); ?></p>
                <ul>
                    <li><?php _e('🎯 Detección heurística inteligente de elementos', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('💬 Chat en vivo con carga diferida', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('📊 Tracking automático de eventos', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('🔔 Notificaciones en tiempo real', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('🤖 Detección automática de bots', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('🛡️ Seguimiento de sesiones', 'guiders-wp-plugin'); ?></li>
                </ul>
            </div>
            
            <div class="guiders-info-box">
                <h3><?php _e('Características Principales', 'guiders-wp-plugin'); ?></h3>
                <h4><?php _e('Detección Heurística Inteligente', 'guiders-wp-plugin'); ?></h4>
                <p><?php _e('El sistema detecta automáticamente elementos como:', 'guiders-wp-plugin'); ?></p>
                <ul>
                    <li><?php _e('Botones "Añadir al carrito"', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('Enlaces "Contactar"', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('Formularios de búsqueda', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('Botones de compra y checkout', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('Enlaces de descarga', 'guiders-wp-plugin'); ?></li>
                </ul>
                <p><strong><?php _e('¡Sin necesidad de modificar el HTML!', 'guiders-wp-plugin'); ?></strong></p>
            </div>
            
            <div class="guiders-info-box">
                <h3><?php _e('Compatibilidad', 'guiders-wp-plugin'); ?></h3>
                <p><?php _e('Compatible con:', 'guiders-wp-plugin'); ?></p>
                <ul>
                    <li><?php _e('✅ WooCommerce', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('✅ Easy Digital Downloads', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('✅ WP Rocket y plugins de caché', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('✅ Temas populares de WordPress', 'guiders-wp-plugin'); ?></li>
                    <li><?php _e('✅ Constructores de páginas', 'guiders-wp-plugin'); ?></li>
                </ul>
            </div>
            
            <div class="guiders-info-box">
                <h3><?php _e('Información del Plugin', 'guiders-wp-plugin'); ?></h3>
                <p><strong><?php _e('Versión actual:', 'guiders-wp-plugin'); ?></strong> v<?php echo GUIDERS_WP_PLUGIN_VERSION; ?></p>
                
                <?php 
                // Check if there's an update available
                $update_plugins = get_site_transient('update_plugins');
                $plugin_basename = plugin_basename(GUIDERS_WP_PLUGIN_PLUGIN_FILE);
                $has_update = isset($update_plugins->response[$plugin_basename]);
                
                if ($has_update) {
                    $update_info = $update_plugins->response[$plugin_basename];
                    echo '<div class="notice notice-warning inline" style="margin: 10px 0; padding: 8px 12px;">';
                    printf(
                        __('🔄 <strong>Nueva versión disponible:</strong> v%s', 'guiders-wp-plugin'),
                        esc_html($update_info->new_version)
                    );
                    echo '<br><a href="' . admin_url('plugins.php') . '">' . __('Ir a actualizaciones', 'guiders-wp-plugin') . '</a>';
                    echo '</div>';
                } else {
                    echo '<p style="color: #46b450;">✅ ' . __('Plugin actualizado', 'guiders-wp-plugin') . '</p>';
                }
                ?>
                
                <p>
                    <a href="<?php echo admin_url('plugins.php?force-check=1'); ?>" class="button button-secondary">
                        <?php _e('🔍 Verificar actualizaciones', 'guiders-wp-plugin'); ?>
                    </a>
                </p>
                
                <hr style="margin: 15px 0;">
                
                <p><strong><?php _e('Actualizaciones automáticas:', 'guiders-wp-plugin'); ?></strong></p>
                <p class="description">
                    <?php _e('Este plugin se actualiza automáticamente desde GitHub. Cuando haya una nueva versión disponible, aparecerá una notificación en tu panel de WordPress y podrás actualizar con un clic.', 'guiders-wp-plugin'); ?>
                </p>
            </div>
            
            <div class="guiders-info-box">
                <h3><?php _e('Soporte y Documentación', 'guiders-wp-plugin'); ?></h3>
                <p><?php _e('¿Necesitas ayuda?', 'guiders-wp-plugin'); ?></p>
                <ul>
                    <li><a href="https://github.com/RogerPugaRuiz/guiders-sdk" target="_blank"><?php _e('📚 Documentación completa', 'guiders-wp-plugin'); ?></a></li>
                    <li><a href="https://guiders.ancoradual.com" target="_blank"><?php _e('🌐 Sitio web oficial', 'guiders-wp-plugin'); ?></a></li>
                    <li><a href="https://github.com/RogerPugaRuiz/guiders-sdk/issues" target="_blank"><?php _e('🐛 Reportar problemas', 'guiders-wp-plugin'); ?></a></li>
                    <li><a href="https://github.com/RogerPugaRuiz/guiders-sdk/releases" target="_blank"><?php _e('📋 Ver versiones y cambios', 'guiders-wp-plugin'); ?></a></li>
                </ul>
            </div>
        </div>
    </div>
</div>

<style>
.guiders-admin-content {
    display: flex;
    gap: 20px;
    margin-top: 20px;
}

.guiders-main-settings {
    flex: 2;
}

.guiders-sidebar {
    flex: 1;
    max-width: 350px;
}

.guiders-info-box {
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
}

.guiders-info-box h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
}

.guiders-info-box h4 {
    color: #444;
    margin-bottom: 8px;
}

.guiders-info-box ul {
    margin: 10px 0;
    padding-left: 20px;
}

.guiders-info-box li {
    margin-bottom: 5px;
    line-height: 1.4;
}

.guiders-info-box a {
    text-decoration: none;
    color: #0073aa;
}

.guiders-info-box a:hover {
    text-decoration: underline;
}

.guiders-admin-header {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
}

.guiders-admin-header h2 {
    margin-top: 0;
    color: #333;
}

.guiders-admin-header p {
    color: #666;
    font-size: 14px;
}

@media (max-width: 980px) {
    .guiders-admin-content {
        flex-direction: column;
    }
    
    .guiders-sidebar {
        max-width: none;
    }
}

/* Style form fields */
.form-table th {
    width: 200px;
}

.form-table td input[type="text"],
.form-table td input[type="number"],
.form-table td select {
    min-width: 300px;
}

.form-table td .description {
    font-style: italic;
    color: #666;
    margin-top: 5px;
}

/* Status indicators */
.guiders-status-enabled {
    color: #46b450;
    font-weight: bold;
}

.guiders-status-disabled {
    color: #dc3232;
    font-weight: bold;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Show/hide confidence threshold based on heuristic detection
    function toggleConfidenceThreshold() {
        var isEnabled = $('#heuristic_detection').is(':checked');
        var row = $('#confidence_threshold').closest('tr');
        
        if (isEnabled) {
            row.show();
        } else {
            row.hide();
        }
    }
    
    // Initial check
    toggleConfidenceThreshold();
    
    // Listen for changes
    $('#heuristic_detection').change(toggleConfidenceThreshold);
    
    // Validate API key format
    $('#api_key').on('blur', function() {
        var apiKey = $(this).val().trim();
        var feedback = $(this).next('.api-key-feedback');
        
        if (feedback.length === 0) {
            $(this).after('<div class="api-key-feedback"></div>');
            feedback = $(this).next('.api-key-feedback');
        }
        
        if (apiKey === '') {
            feedback.html('<span style="color: #dc3232;">⚠️ API Key es requerida</span>');
        } else if (apiKey.length < 10) {
            feedback.html('<span style="color: #dc3232;">⚠️ API Key parece demasiado corta</span>');
        } else {
            feedback.html('<span style="color: #46b450;">✅ API Key válida</span>');
        }
    });
});
</script>