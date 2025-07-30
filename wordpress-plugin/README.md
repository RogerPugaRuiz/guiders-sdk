# 🔌 Plugin de WordPress para Guiders SDK

[![WordPress Compatible](https://img.shields.io/badge/WordPress-5.0%2B-blue.svg)](https://wordpress.org/)
[![WooCommerce Compatible](https://img.shields.io/badge/WooCommerce-3.0%2B-purple.svg)](https://woocommerce.com/)
[![PHP Version](https://img.shields.io/badge/PHP-7.4%2B-green.svg)](https://php.net/)

Plugin completo de WordPress que integra Guiders SDK para proporcionar tracking inteligente, chat en vivo y analytics en sitios WordPress y WooCommerce.

## ✨ Características Principales

- 🎯 **Detección Heurística Inteligente**: Detecta automáticamente elementos como botones "Añadir al carrito", formularios de contacto, etc. sin modificar HTML
- 💬 **Chat en Vivo**: Chat integrado con carga diferida y optimizado para WordPress
- 🛒 **Integración WooCommerce**: Tracking automático de eventos de e-commerce
- ⚙️ **Panel de Administración**: Configuración completa desde el admin de WordPress
- 🚀 **Compatible con Caché**: Funciona con WP Rocket, W3 Total Cache y otros plugins de optimización
- 🤖 **Detección de Bots**: Evita cargas innecesarias en bots y crawlers
- 📱 **Responsive**: Optimizado para móvil y desktop

## 🚀 Instalación Rápida

### Método 1: Instalación Manual

1. **Descargar el plugin**
   ```bash
   git clone https://github.com/RogerPugaRuiz/guiders-sdk.git
   cd guiders-sdk/wordpress-plugin
   ```

2. **Copiar a WordPress**
   ```bash
   cp -r guiders-wp-plugin /path/to/wordpress/wp-content/plugins/
   ```

3. **Activar desde Admin**
   - Ve a **Plugins** en el admin de WordPress
   - Busca **Guiders SDK**
   - Haz clic en **Activar**

### Método 2: Subida ZIP

1. **Comprimir el plugin**
   ```bash
   cd wordpress-plugin
   zip -r guiders-wp-plugin.zip guiders-wp-plugin/
   ```

2. **Subir a WordPress**
   - Ve a **Plugins > Añadir nuevo > Subir plugin**
   - Selecciona el archivo ZIP
   - Haz clic en **Instalar ahora**
   - Activa el plugin

## ⚙️ Configuración

### 1. Obtener API Key

1. Regístrate en [Guiders Dashboard](https://dashboard.guiders.com)
2. Crea un nuevo proyecto
3. Copia la API Key de tu proyecto

### 2. Configurar Plugin

1. Ve a **Configuración > Guiders SDK** en tu admin de WordPress
2. Pega tu API Key
3. Configura las opciones según tus necesidades:

| Opción | Descripción | Recomendado |
|--------|-------------|-------------|
| **API Key** | Tu clave API de Guiders | Requerido |
| **Habilitar Tracking** | Activar/desactivar tracking | ✅ Activado |
| **Habilitar Chat** | Mostrar widget de chat | ✅ Activado |
| **Detección Heurística** | Detección automática de elementos | ✅ Activado |
| **Umbral de Confianza** | Nivel de precisión (0.1-1.0) | 0.7 |
| **Detección de Bots** | Filtrar tráfico de bots | ✅ Activado |
| **Modo Debug** | Logs detallados en consola | ❌ Solo desarrollo |

### 3. Verificar Instalación

1. **Frontend**: Ve a tu sitio web y abre Developer Tools (F12)
2. **Console**: Busca el mensaje "Guiders SDK initialized successfully"
3. **Network**: Verifica requests a `api.guiders.com`

Si ves estos elementos, ¡la instalación es exitosa! 🎉

## 🛒 Integración con WooCommerce

### Eventos Detectados Automáticamente

El plugin detecta automáticamente estos eventos de WooCommerce:

| Evento | Página | Elemento Detectado |
|--------|--------|--------------------|
| `view_product` | Producto | Vista automática de página de producto |
| `add_to_cart` | Producto/Shop | Botones "Añadir al carrito" |
| `view_cart` | Carrito | Vista de página de carrito |
| `begin_checkout` | Checkout | Inicio del proceso de checkout |
| `purchase` | Thank You | Confirmación de compra |
| `remove_from_cart` | Carrito | Botones de eliminar producto |

### Configuración WooCommerce

```php
// En functions.php o plugin personalizado
add_filter('guiders_woocommerce_events', function($events) {
    // Personalizar eventos de WooCommerce
    $events['custom_event'] = [
        'selector' => '.custom-button',
        'trigger' => 'click',
        'data' => function($element) {
            return [
                'product_id' => get_the_ID(),
                'category' => get_the_category()
            ];
        }
    ];
    return $events;
});
```

## 🎨 Personalización

### Hooks y Filtros Disponibles

#### Filtros de Configuración

```php
// Modificar configuración global del SDK
add_filter('guiders_sdk_config', function($config) {
    $config['endpoint'] = 'https://tu-api-personalizada.com';
    $config['flushInterval'] = 2000;
    return $config;
});

// Modificar datos del usuario
add_filter('guiders_user_data', function($user_data) {
    $user_data['wordpress_role'] = wp_get_current_user()->roles[0];
    $user_data['membership_level'] = get_user_meta(get_current_user_id(), 'membership_level', true);
    return $user_data;
});

// Personalizar detección heurística
add_filter('guiders_heuristic_config', function($config) {
    $config['confidenceThreshold'] = 0.8; // Más estricto
    $config['customSelectors'] = [
        '.mi-boton-especial' => 'custom_event'
    ];
    return $config;
});
```

#### Actions Disponibles

```php
// Ejecutar código cuando el SDK se inicializa
add_action('guiders_sdk_initialized', function() {
    error_log('Guiders SDK inicializado en WordPress');
});

// Modificar antes de enviar evento
add_action('guiders_before_track_event', function($event_data) {
    // Añadir datos personalizados a todos los eventos
    $event_data['site_language'] = get_locale();
    $event_data['theme'] = get_template();
});

// Ejecutar después de enviar evento
add_action('guiders_after_track_event', function($event_data, $success) {
    if (!$success) {
        error_log('Error enviando evento Guiders: ' . json_encode($event_data));
    }
}, 10, 2);
```

### Configuración Programática

```php
// Configurar via código (en functions.php)
add_action('init', function() {
    if (function_exists('guiders_set_config')) {
        guiders_set_config([
            'api_key' => 'tu-api-key',
            'enabled' => true,
            'chat_enabled' => true,
            'confidence_threshold' => 0.7,
            'bot_detection' => true,
            'debug' => WP_DEBUG
        ]);
    }
});

// Configuración condicional
add_action('wp_head', function() {
    if (is_admin() || is_user_logged_in() && current_user_can('administrator')) {
        // No trackear administradores
        echo '<script>window.guidersConfig = { enabled: false };</script>';
    }
});
```

## 🔧 Funcionalidades Avanzadas

### Tracking de Formularios

```php
// Detectar automáticamente formularios de contacto
add_filter('guiders_form_selectors', function($selectors) {
    return array_merge($selectors, [
        // Contact Form 7
        '.wpcf7-form' => 'contact_form_submit',
        
        // Gravity Forms
        '.gform_wrapper form' => 'contact_form_submit',
        
        // WPForms
        '.wpforms-form' => 'contact_form_submit',
        
        // Formularios personalizados
        '.mi-formulario-personalizado' => 'custom_form_submit'
    ]);
});
```

### Integración con Membership Plugins

```php
// Tracking de eventos de membresía
add_action('wp_login', function($user_login, $user) {
    if (function_exists('guiders_track_event')) {
        guiders_track_event([
            'event' => 'user_login',
            'user_id' => $user->ID,
            'data' => [
                'login_method' => 'wordpress',
                'user_role' => $user->roles[0] ?? 'subscriber'
            ]
        ]);
    }
}, 10, 2);

// WooCommerce Memberships
add_action('wc_memberships_user_membership_saved', function($membership_plan, $args) {
    guiders_track_event([
        'event' => 'membership_activated',
        'user_id' => $args['user_id'],
        'data' => [
            'plan_name' => $membership_plan->get_name(),
            'plan_id' => $membership_plan->get_id()
        ]
    ]);
}, 10, 2);
```

### Chat Contextual

```php
// Chat específico por página
add_action('wp_footer', function() {
    if (is_product()) {
        global $product;
        ?>
        <script>
        window.guidersConfig = window.guidersConfig || {};
        window.guidersConfig.chat = {
            welcomeMessage: '¡Hola! ¿Necesitas ayuda con <?php echo $product->get_name(); ?>?',
            context: {
                page_type: 'product',
                product_id: <?php echo $product->get_id(); ?>,
                product_name: '<?php echo addslashes($product->get_name()); ?>'
            }
        };
        </script>
        <?php
    }
});
```

## 📊 Analytics y Reporting

### Dashboard Personalizado

```php
// Añadir página de analytics en admin
add_action('admin_menu', function() {
    add_menu_page(
        'Guiders Analytics',
        'Analytics',
        'manage_options',
        'guiders-analytics',
        'guiders_analytics_page',
        'dashicons-chart-line',
        30
    );
});

function guiders_analytics_page() {
    // Obtener datos de la API
    $analytics = guiders_get_analytics([
        'range' => 'last_30_days',
        'metrics' => ['page_views', 'events', 'conversions']
    ]);
    
    include plugin_dir_path(__FILE__) . 'admin/analytics-page.php';
}
```

### Shortcodes para Analytics

```php
// Shortcode para mostrar métricas
add_shortcode('guiders_metrics', function($atts) {
    $atts = shortcode_atts([
        'metric' => 'page_views',
        'range' => '7_days',
        'format' => 'number'
    ], $atts);
    
    $value = guiders_get_metric($atts['metric'], $atts['range']);
    
    if ($atts['format'] === 'chart') {
        return guiders_render_chart($value);
    }
    
    return number_format($value);
});

// Uso: [guiders_metrics metric="conversions" range="30_days"]
```

## 🚨 Troubleshooting

### Problemas Comunes

#### ❌ Plugin no aparece en lista

**Síntomas:** No se ve en Plugins > Plugins instalados

**Soluciones:**
1. Verificar estructura de carpetas:
   ```
   wp-content/plugins/guiders-wp-plugin/
   ├── guiders-wp-plugin.php
   ├── readme.txt
   └── ...
   ```

2. Verificar permisos de archivos:
   ```bash
   chmod 755 wp-content/plugins/guiders-wp-plugin/
   chmod 644 wp-content/plugins/guiders-wp-plugin/*.php
   ```

3. Revisar errores PHP en logs de WordPress

#### ❌ SDK no se carga en frontend

**Síntomas:** No hay tracking, no aparece chat

**Soluciones:**
1. **Verificar API Key**
   ```php
   // En functions.php temporal
   add_action('wp_footer', function() {
       $options = get_option('guiders_wp_plugin_settings');
       echo '<!-- Guiders API Key: ' . (isset($options['api_key']) ? 'SET' : 'NOT_SET') . ' -->';
   });
   ```

2. **Verificar conflictos de plugins**
   ```php
   // Desactivar otros plugins de analytics temporalmente
   // Verificar si hay conflictos con plugins de optimización
   ```

3. **Verificar tema compatibility**
   ```php
   // Asegurar que wp_footer() se llama en el tema
   grep -r "wp_footer" /path/to/theme/
   ```

#### ❌ WooCommerce no trackea

**Síntomas:** Eventos de e-commerce no se registran

**Soluciones:**
1. **Verificar versión de WooCommerce**
   ```php
   if (function_exists('WC')) {
       echo 'WooCommerce version: ' . WC()->version;
   }
   ```

2. **Verificar AJAX de WooCommerce**
   ```javascript
   // En consola del navegador
   console.log('WC AJAX:', typeof wc_add_to_cart_params);
   ```

3. **Forzar re-detección**
   ```javascript
   // En consola
   if (window.guiders) {
       window.guiders.refreshDetection();
   }
   ```

### Debug Avanzado

#### Habilitar Logs Detallados

```php
// En wp-config.php
define('GUIDERS_DEBUG', true);

// En functions.php
add_action('guiders_debug', function($message) {
    if (defined('GUIDERS_DEBUG') && GUIDERS_DEBUG) {
        error_log('[Guiders] ' . $message);
    }
});
```

#### Verificar Configuración

```php
// Shortcode para debug
add_shortcode('guiders_debug', function() {
    if (!current_user_can('administrator')) {
        return 'No autorizado';
    }
    
    $config = get_option('guiders_wp_plugin_settings');
    $status = [
        'Plugin Version' => GUIDERS_WP_PLUGIN_VERSION,
        'API Key Set' => !empty($config['api_key']) ? 'Yes' : 'No',
        'Tracking Enabled' => !empty($config['enable_tracking']) ? 'Yes' : 'No',
        'WordPress Version' => get_bloginfo('version'),
        'WooCommerce Active' => class_exists('WooCommerce') ? 'Yes' : 'No'
    ];
    
    $output = '<h3>Guiders Debug Info</h3><ul>';
    foreach ($status as $key => $value) {
        $output .= "<li><strong>$key:</strong> $value</li>";
    }
    $output .= '</ul>';
    
    return $output;
});
```

## 📁 Estructura del Plugin

```
guiders-wp-plugin/
├── guiders-wp-plugin.php          # Archivo principal del plugin
├── readme.txt                     # Documentación para WordPress.org
├── includes/                      # Clases principales
│   ├── class-guiders-admin.php    # Funcionalidad del admin
│   ├── class-guiders-public.php   # Funcionalidad del frontend
│   ├── class-guiders-woocommerce.php # Integración WooCommerce
│   └── class-guiders-ajax.php     # Manejo de AJAX
├── admin/                         # Archivos del admin
│   ├── partials/
│   │   ├── admin-display.php      # Template de configuración
│   │   └── analytics-display.php  # Template de analytics
│   └── js/
│       └── admin-script.js        # JavaScript del admin
├── public/                        # Archivos del frontend
│   ├── js/
│   │   └── guiders-public.js      # JavaScript del frontend
│   └── css/
│       └── guiders-public.css     # Estilos del frontend
├── assets/                        # Assets externos
│   ├── js/
│   │   └── guiders-sdk.js         # SDK compilado
│   └── css/
│       └── admin-style.css        # Estilos del admin
└── languages/                     # Archivos de traducción
    ├── guiders-wp-plugin-es_ES.po
    └── guiders-wp-plugin-en_US.po
```

## 🌐 Traducciones

### Idiomas Soportados

- 🇪🇸 Español (Completo)
- 🇺🇸 English (Completo)
- 🇫🇷 Français (En progreso)
- 🇩🇪 Deutsch (Planeado)

### Añadir Nuevas Traducciones

```bash
# Generar archivo POT
wp i18n make-pot . languages/guiders-wp-plugin.pot

# Crear traducción
msginit -l es_ES -i languages/guiders-wp-plugin.pot -o languages/guiders-wp-plugin-es_ES.po

# Compilar traducción
msgfmt languages/guiders-wp-plugin-es_ES.po -o languages/guiders-wp-plugin-es_ES.mo
```

## 📞 Soporte

### Recursos

- 📖 [Documentación Completa](../docs/)
- 💬 [Soporte WordPress](https://wordpress.org/support/plugin/guiders-wp-plugin/)
- 🐛 [Reportar Bug](https://github.com/RogerPugaRuiz/guiders-sdk/issues)
- ✨ [Solicitar Feature](https://github.com/RogerPugaRuiz/guiders-sdk/issues/new)

### Información para Soporte

Al reportar un problema, incluye:

- **Versión de WordPress**: `<?php echo get_bloginfo('version'); ?>`
- **Versión del Plugin**: Se muestra en Plugins > Plugins instalados
- **Versión de WooCommerce**: Si aplica
- **Tema activo**: `<?php echo get_template(); ?>`
- **Plugins activos**: Lista de plugins instalados
- **Mensajes de error**: Copia exacta del error
- **Pasos para reproducir**: Cómo recrear el problema

---

## 📄 Licencia

[ISC License](../LICENSE) - La misma licencia que el SDK de Guiders.

---

<p align="center">
  Desarrollado con ❤️ por el equipo de <a href="https://guiders.ancoradual.com">Guiders</a>
</p>