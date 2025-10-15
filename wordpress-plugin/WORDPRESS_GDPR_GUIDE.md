# Guía GDPR para Plugin de WordPress - Guiders SDK

**Versión del SDK**: 1.4.1
**Última actualización**: Octubre 2025

## ⚠️ Importante: ¿Necesitas GDPR?

**Por defecto, el SDK NO requiere consentimiento GDPR** (`requireConsent: false`). Esta guía es solo para sitios que:
- Están dirigidos a usuarios de la Unión Europea
- Necesitan cumplir con GDPR, LOPDGDD o LSSI
- Requieren control explícito de cookies y tracking

Si tu sitio **NO está en la UE**, el SDK funciona automáticamente sin configuración adicional.

## 📋 Índice

1. [¿Cuándo necesitas esta guía?](#cuándo-necesitas-esta-guía)
2. [Configuración Básica](#configuración-básica)
3. [Activar Control GDPR](#activar-control-gdpr)
4. [Control de Consentimiento](#control-de-consentimiento)
5. [Integración con Plugins de Cookies](#integración-con-plugins-de-cookies)
6. [Banners Personalizados](#banners-personalizados)
7. [Derechos del Usuario](#derechos-del-usuario)
8. [Snippets Útiles](#snippets-útiles)
9. [Checklist de Cumplimiento](#checklist-de-cumplimiento)
10. [Preguntas Frecuentes (FAQ)](#preguntas-frecuentes-faq)
11. [Recursos Adicionales](#recursos-adicionales)

---

## ¿Cuándo necesitas esta guía?

### ✅ Necesitas activar GDPR si:
- Tu sitio está dirigido a usuarios en España, UE o EEA
- Tienes usuarios que acceden desde la Unión Europea
- Necesitas cumplir con GDPR/LOPDGDD/LSSI
- Tu política de privacidad requiere consentimiento explícito

### ❌ NO necesitas GDPR si:
- Tu sitio solo opera fuera de la UE
- Tus términos de servicio cubren el uso de tracking
- No tienes usuarios europeos

---

## Configuración Básica

### Paso 1: Instalar el Plugin

1. Sube `guiders-wp-plugin-1.4.x.zip` a WordPress
2. Activa el plugin
3. Ve a **Configuración → Guiders SDK**
4. Ingresa tu API Key

### Paso 2: Decidir si necesitas GDPR

**Por defecto, el SDK funciona sin barreras de consentimiento**. Si necesitas GDPR, continúa con la siguiente sección.

---

## Activar Control GDPR

Para sitios de la UE, necesitas activar explícitamente el control GDPR. Añade este código en `functions.php` de tu tema:

```php
/**
 * Activar control GDPR para Guiders SDK
 * Solo para sitios que necesitan cumplimiento GDPR
 */
function guiders_activate_gdpr_mode() {
    if (is_admin()) return;
    ?>
    <script>
    // Configurar SDK con control GDPR antes de que se inicialice
    window.GUIDERS_CONFIG = window.GUIDERS_CONFIG || {};
    window.GUIDERS_CONFIG.requireConsent = true;  // ⚠️ Activar GDPR
    window.GUIDERS_CONFIG.consent = {
        waitForConsent: true,    // Esperar consentimiento antes de tracking
        defaultStatus: 'pending'  // Estado inicial
    };
    </script>
    <?php
}
add_action('wp_head', 'guiders_activate_gdpr_mode', 5); // Prioridad 5 para ejecutar antes del SDK
```

**Importante**: Este código debe añadirse **antes** de que se cargue el SDK.

---

## Control de Consentimiento

### Acceso a las APIs del SDK

Una vez instalado el plugin, el SDK estará disponible globalmente como `window.guiders`:

```javascript
// Verificar que el SDK está cargado
if (window.guiders) {
  console.log('SDK de Guiders cargado correctamente');
}
```

### Comportamiento por Defecto

**IMPORTANTE**: Por defecto, el SDK NO espera consentimiento:

```javascript
// Comportamiento por defecto del SDK:
// - requireConsent: false (NO requiere consentimiento)
// - authMode: 'session' (cookies HttpOnly seguras)
// - Chat y tracking funcionan inmediatamente
```

Si activaste el modo GDPR en la sección anterior, entonces sí esperará consentimiento:

```javascript
// Con modo GDPR activado (requireConsent: true):
// - waitForConsent: true (espera consentimiento)
// - defaultStatus: 'pending' (estado pendiente)
// - Chat y tracking pausados hasta obtener consentimiento
```

### Otorgar Consentimiento

```javascript
// Consentimiento completo (todas las categorías)
window.guiders.grantConsent();

// Consentimiento con preferencias específicas
window.guiders.grantConsentWithPreferences({
  analytics: true,      // Permitir tracking
  functional: true,     // Permitir chat
  personalization: false // No personalización
});
```

### Denegar o Revocar Consentimiento

```javascript
// Denegar consentimiento
window.guiders.denyConsent();

// Revocar consentimiento previamente otorgado
window.guiders.revokeConsent();
```

### Consultar Estado de Consentimiento

```javascript
// Estado actual: 'pending', 'granted', 'denied'
const status = window.guiders.getConsentStatus();

// Verificar si está otorgado
const isGranted = window.guiders.isConsentGranted();

// Verificar categoría específica
const canTrack = window.guiders.isCategoryAllowed('analytics');
```

---

## Integración con Plugins de Cookies

**Nota previa**: Esta sección solo es relevante si activaste el modo GDPR (`requireConsent: true`). Si no lo activaste, el SDK ya funciona sin necesidad de gestión de consentimiento.

### Método 1: Usando el Hook `wp_footer`

Añade este código al archivo `functions.php` de tu tema:

```php
/**
 * Integración de Guiders SDK con banner de consentimiento
 */
function guiders_consent_integration() {
    // Solo cargar en frontend
    if (is_admin()) {
        return;
    }
    ?>
    <script>
    // Esperar a que el SDK esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar que el SDK está cargado
        if (!window.guiders) {
            console.warn('SDK de Guiders no está cargado');
            return;
        }

        // Aquí va tu código de integración con el banner
        // Ver ejemplos específicos abajo
    });
    </script>
    <?php
}
add_action('wp_footer', 'guiders_consent_integration', 100);
```

### Método 2: Usando Plugin "Code Snippets"

Si prefieres no editar el tema, usa el plugin [Code Snippets](https://wordpress.org/plugins/code-snippets/):

1. Instala y activa "Code Snippets"
2. Ve a **Snippets → Add New**
3. Añade el código JavaScript (ver ejemplos abajo)
4. Marca "Only run on site front-end"
5. Guarda y activa

---

## Integración con Plugins de Cookies Populares

### 1. Complianz (Recomendado para WordPress)

```php
function guiders_complianz_integration() {
    if (is_admin()) return;
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.guiders) return;

        // Escuchar evento de Complianz
        document.addEventListener('cmplz_status_change', function(e) {
            const consentData = e.detail;

            if (consentData.functional === 'allow' || consentData.statistics === 'allow') {
                // Otorgar consentimiento según preferencias
                window.guiders.grantConsentWithPreferences({
                    analytics: consentData.statistics === 'allow',
                    functional: consentData.functional === 'allow',
                    personalization: consentData.marketing === 'allow'
                });
            } else {
                // Denegar consentimiento
                window.guiders.denyConsent();
            }
        });

        // Verificar estado inicial
        if (typeof cmplz_categories !== 'undefined') {
            if (cmplz_categories.functional === 'allow' || cmplz_categories.statistics === 'allow') {
                window.guiders.grantConsentWithPreferences({
                    analytics: cmplz_categories.statistics === 'allow',
                    functional: cmplz_categories.functional === 'allow',
                    personalization: cmplz_categories.marketing === 'allow'
                });
            }
        }
    });
    </script>
    <?php
}
add_action('wp_footer', 'guiders_complianz_integration', 100);
```

### 2. CookieYes

```php
function guiders_cookieyes_integration() {
    if (is_admin()) return;
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.guiders) return;

        // Escuchar evento de CookieYes
        document.addEventListener('cookieyes_consent_update', function(e) {
            const consent = e.detail;

            window.guiders.grantConsentWithPreferences({
                analytics: consent.analytics === 'yes',
                functional: consent.functional === 'yes',
                personalization: consent.advertisement === 'yes'
            });
        });

        // Verificar estado inicial
        if (typeof cookieyes !== 'undefined') {
            const consent = cookieyes.getConsent();
            if (consent) {
                window.guiders.grantConsentWithPreferences({
                    analytics: consent.analytics === 'yes',
                    functional: consent.functional === 'yes',
                    personalization: consent.advertisement === 'yes'
                });
            }
        }
    });
    </script>
    <?php
}
add_action('wp_footer', 'guiders_cookieyes_integration', 100);
```

### 3. Cookie Notice (gratuito)

```php
function guiders_cookie_notice_integration() {
    if (is_admin()) return;
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.guiders) return;

        // Verificar estado de Cookie Notice
        function checkCookieNoticeConsent() {
            // Cookie Notice usa 'cookie_notice_accepted'
            const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith('cookie_notice_accepted='));

            if (cookieValue && cookieValue.split('=')[1] === 'true') {
                window.guiders.grantConsent();
            }
        }

        // Verificar al cargar
        checkCookieNoticeConsent();

        // Escuchar cambios
        document.addEventListener('setCookieNotice', function() {
            checkCookieNoticeConsent();
        });
    });
    </script>
    <?php
}
add_action('wp_footer', 'guiders_cookie_notice_integration', 100);
```

### 4. Cookiebot

```php
function guiders_cookiebot_integration() {
    if (is_admin()) return;
    ?>
    <script>
    window.addEventListener('CookiebotOnAccept', function() {
        if (!window.guiders || !window.Cookiebot) return;

        if (Cookiebot.consent.statistics || Cookiebot.consent.marketing) {
            window.guiders.grantConsentWithPreferences({
                analytics: Cookiebot.consent.statistics,
                functional: Cookiebot.consent.necessary,
                personalization: Cookiebot.consent.marketing
            });
        }
    });

    window.addEventListener('CookiebotOnDecline', function() {
        if (!window.guiders) return;
        window.guiders.denyConsent();
    });
    </script>
    <?php
}
add_action('wp_footer', 'guiders_cookiebot_integration', 100);
```

---

## Banners Personalizados

**Nota previa**: Los banners de consentimiento solo son necesarios si activaste el modo GDPR. Si no lo activaste, el SDK ya funciona sin banner.

### Banner Básico con Shortcode

Añade este código a `functions.php`:

```php
/**
 * Shortcode para banner de consentimiento de Guiders
 * Uso: [guiders_consent_banner]
 */
function guiders_consent_banner_shortcode() {
    // Verificar si ya hay consentimiento
    ob_start();
    ?>
    <div id="guiders-consent-banner" style="display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #2c3e50; color: white; padding: 20px; z-index: 999999; box-shadow: 0 -2px 10px rgba(0,0,0,0.2);">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
            <p style="margin: 0; flex: 1; min-width: 300px;">
                🍪 Usamos cookies para mejorar tu experiencia. Puedes aceptar todas o personalizar tus preferencias.
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="guiders-accept-all" style="background: #27ae60; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                    Aceptar Todo
                </button>
                <button id="guiders-preferences" style="background: #3498db; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px;">
                    Preferencias
                </button>
                <button id="guiders-reject" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px;">
                    Rechazar
                </button>
            </div>
        </div>
    </div>

    <script>
    (function() {
        function initGuidersConsentBanner() {
            if (!window.guiders) {
                setTimeout(initGuidersConsentBanner, 100);
                return;
            }

            const banner = document.getElementById('guiders-consent-banner');
            if (!banner) return;

            // Mostrar banner si el consentimiento está pendiente
            if (window.guiders.getConsentStatus() === 'pending') {
                banner.style.display = 'block';
            }

            // Botón: Aceptar Todo
            document.getElementById('guiders-accept-all').addEventListener('click', function() {
                window.guiders.grantConsent();
                banner.style.display = 'none';
            });

            // Botón: Rechazar
            document.getElementById('guiders-reject').addEventListener('click', function() {
                window.guiders.denyConsent();
                banner.style.display = 'none';
            });

            // Botón: Preferencias
            document.getElementById('guiders-preferences').addEventListener('click', function() {
                // Mostrar modal de preferencias (ver siguiente sección)
                showPreferencesModal();
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initGuidersConsentBanner);
        } else {
            initGuidersConsentBanner();
        }
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('guiders_consent_banner', 'guiders_consent_banner_shortcode');
```

**Uso**: Añade `[guiders_consent_banner]` en cualquier página o en el footer de tu tema.

### Modal de Preferencias

Añade este código adicional para el modal de preferencias:

```php
function guiders_preferences_modal() {
    if (is_admin()) return;
    ?>
    <!-- Modal de Preferencias -->
    <div id="guiders-preferences-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999999; justify-content: center; align-items: center;">
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <h2 style="margin-top: 0; color: #2c3e50;">Preferencias de Cookies</h2>

            <div style="margin: 20px 0;">
                <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer;">
                    <input type="checkbox" id="guiders-pref-analytics" style="margin-right: 10px; width: 20px; height: 20px;">
                    <div>
                        <strong>Cookies Analíticas</strong>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px;">
                            Nos ayudan a entender cómo usas el sitio web
                        </p>
                    </div>
                </label>

                <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer;">
                    <input type="checkbox" id="guiders-pref-functional" style="margin-right: 10px; width: 20px; height: 20px;" checked>
                    <div>
                        <strong>Cookies Funcionales</strong>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px;">
                            Necesarias para el chat en vivo y funcionalidad básica
                        </p>
                    </div>
                </label>

                <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer;">
                    <input type="checkbox" id="guiders-pref-personalization" style="margin-right: 10px; width: 20px; height: 20px;">
                    <div>
                        <strong>Cookies de Personalización</strong>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px;">
                            Personalizan tu experiencia en el chat
                        </p>
                    </div>
                </label>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="guiders-save-preferences" style="background: #27ae60; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                    Guardar Preferencias
                </button>
                <button id="guiders-cancel-preferences" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px;">
                    Cancelar
                </button>
            </div>
        </div>
    </div>

    <script>
    function showPreferencesModal() {
        const modal = document.getElementById('guiders-preferences-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function hidePreferencesModal() {
        const modal = document.getElementById('guiders-preferences-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Guardar preferencias
        const saveBtn = document.getElementById('guiders-save-preferences');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                if (!window.guiders) return;

                const analytics = document.getElementById('guiders-pref-analytics').checked;
                const functional = document.getElementById('guiders-pref-functional').checked;
                const personalization = document.getElementById('guiders-pref-personalization').checked;

                window.guiders.grantConsentWithPreferences({
                    analytics: analytics,
                    functional: functional,
                    personalization: personalization
                });

                hidePreferencesModal();

                // Ocultar banner si está visible
                const banner = document.getElementById('guiders-consent-banner');
                if (banner) {
                    banner.style.display = 'none';
                }
            });
        }

        // Cancelar
        const cancelBtn = document.getElementById('guiders-cancel-preferences');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', hidePreferencesModal);
        }

        // Cerrar al hacer click fuera
        const modal = document.getElementById('guiders-preferences-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    hidePreferencesModal();
                }
            });
        }
    });
    </script>
    <?php
}
add_action('wp_footer', 'guiders_preferences_modal', 99);
```

---

## Derechos del Usuario

**Nota**: Los derechos de eliminación y exportación de datos están disponibles independientemente de si activaste el modo GDPR o no. Son herramientas útiles para cumplimiento legal.

### Botón "Eliminar mis datos"

Añade este shortcode a `functions.php`:

```php
/**
 * Shortcode para botón de eliminación de datos
 * Uso: [guiders_delete_data]
 */
function guiders_delete_data_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'text' => 'Eliminar mis datos',
        'style' => 'default' // default, danger, custom
    ), $atts);

    $button_style = 'background: #e74c3c; color: white; border: none; padding: 12px 24px; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 14px;';

    if ($atts['style'] === 'default') {
        $button_style = 'background: #95a5a6; color: white; border: none; padding: 12px 24px; cursor: pointer; border-radius: 4px; font-size: 14px;';
    }

    ob_start();
    ?>
    <button id="guiders-delete-data-btn" style="<?php echo esc_attr($button_style); ?>">
        <?php echo esc_html($atts['text']); ?>
    </button>

    <script>
    (function() {
        const btn = document.getElementById('guiders-delete-data-btn');
        if (!btn) return;

        btn.addEventListener('click', async function() {
            if (!window.guiders) {
                alert('El SDK de Guiders no está cargado');
                return;
            }

            if (!confirm('¿Estás seguro de que quieres eliminar todos tus datos? Esta acción no se puede deshacer.')) {
                return;
            }

            try {
                btn.disabled = true;
                btn.textContent = 'Eliminando...';

                await window.guiders.deleteVisitorData();

                alert('✅ Tus datos han sido eliminados exitosamente');
                btn.textContent = 'Datos eliminados';
            } catch (error) {
                console.error('Error eliminando datos:', error);
                alert('❌ Error eliminando datos: ' + error.message);
                btn.disabled = false;
                btn.textContent = '<?php echo esc_js($atts['text']); ?>';
            }
        });
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('guiders_delete_data', 'guiders_delete_data_button_shortcode');
```

**Uso**:
```
[guiders_delete_data]
[guiders_delete_data text="Borrar mis datos" style="danger"]
```

### Botón "Descargar mis datos"

```php
/**
 * Shortcode para botón de descarga de datos
 * Uso: [guiders_export_data]
 */
function guiders_export_data_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'text' => 'Descargar mis datos',
    ), $atts);

    ob_start();
    ?>
    <button id="guiders-export-data-btn" style="background: #3498db; color: white; border: none; padding: 12px 24px; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 14px;">
        <?php echo esc_html($atts['text']); ?>
    </button>

    <script>
    (function() {
        const btn = document.getElementById('guiders-export-data-btn');
        if (!btn) return;

        btn.addEventListener('click', async function() {
            if (!window.guiders) {
                alert('El SDK de Guiders no está cargado');
                return;
            }

            try {
                btn.disabled = true;
                btn.textContent = 'Generando...';

                const dataJSON = await window.guiders.exportVisitorData();

                // Crear archivo para descarga
                const blob = new Blob([dataJSON], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'guiders-datos-' + new Date().toISOString() + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                btn.disabled = false;
                btn.textContent = '✅ Descargado';
                setTimeout(() => {
                    btn.textContent = '<?php echo esc_js($atts['text']); ?>';
                }, 2000);
            } catch (error) {
                console.error('Error exportando datos:', error);
                alert('❌ Error exportando datos: ' + error.message);
                btn.disabled = false;
                btn.textContent = '<?php echo esc_js($atts['text']); ?>';
            }
        });
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('guiders_export_data', 'guiders_export_data_button_shortcode');
```

**Uso**:
```
[guiders_export_data]
[guiders_export_data text="Obtener copia de mis datos"]
```

---

## Snippets Útiles

### Verificar Estado de Consentimiento en la Consola

Añade esto temporalmente para debugging:

```javascript
// En la consola del navegador
console.log('Estado:', window.guiders.getConsentStatus());
console.log('Consentimiento completo:', window.guiders.getConsentState());
console.log('¿Analytics permitido?', window.guiders.isCategoryAllowed('analytics'));
```

### Crear Página de Privacidad con Gestión de Cookies

1. Crea una nueva página: **Privacidad → Añadir nueva**
2. Título: "Gestión de Cookies"
3. Contenido:

```
<h2>Tus Preferencias de Cookies</h2>

<p>Puedes gestionar tus preferencias de cookies en cualquier momento:</p>

[guiders_consent_banner]

<h3>Derechos del Usuario (GDPR)</h3>

<p>De acuerdo con el GDPR, tienes derecho a:</p>

<ul>
    <li><strong>Acceder a tus datos</strong>: Descarga una copia de todos los datos que hemos recopilado</li>
    <li><strong>Eliminar tus datos</strong>: Solicita la eliminación completa de tus datos</li>
</ul>

<div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
    [guiders_export_data text="📥 Descargar mis datos"]
    [guiders_delete_data text="🗑️ Eliminar mis datos" style="danger"]
</div>
```

### Hook para Desarrolladores Avanzados

Si necesitas ejecutar código cuando cambia el consentimiento:

```php
function my_custom_consent_tracking() {
    if (is_admin()) return;
    ?>
    <script>
    if (window.guiders) {
        // Suscribirse a cambios de consentimiento
        window.guiders.subscribeToConsentChanges(function(state) {
            console.log('Consentimiento cambiado:', state);

            // Enviar a Google Analytics (ejemplo)
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', {
                    'analytics_storage': state.preferences.analytics ? 'granted' : 'denied'
                });
            }

            // Tu código personalizado aquí
        });
    }
    </script>
    <?php
}
add_action('wp_footer', 'my_custom_consent_tracking', 100);
```

---

## Página de Privacidad Recomendada

Añade esta sección a tu Política de Privacidad:

```
### Cookies y Tracking

Este sitio utiliza el servicio Guiders para:
- Chat en vivo con nuestro equipo de soporte
- Análisis de uso del sitio web
- Mejora de la experiencia del usuario

**Categorías de Cookies:**

1. **Cookies Funcionales** (necesarias):
   - Identificación de visitante
   - Estado de sesión
   - Chat ID

2. **Cookies Analíticas** (opcionales):
   - Eventos de tracking
   - Métricas de uso
   - Comportamiento del usuario

3. **Cookies de Personalización** (opcionales):
   - Preferencias del usuario
   - Configuración del chat
   - Mensajes de bienvenida personalizados

**Tus Derechos:**

Puedes gestionar tus preferencias de cookies en cualquier momento visitando nuestra
[página de gestión de cookies](/gestion-cookies/).

Tienes derecho a:
- Acceder a tus datos
- Solicitar la eliminación de tus datos
- Revocar el consentimiento en cualquier momento

**Proveedor del Servicio:**
Guiders (https://guiders.ancoradual.com)

**Período de Retención:**
Los datos se conservan durante [especificar período] o hasta que solicites su eliminación.
```

---

## Checklist de Cumplimiento

### Para Sitios SIN GDPR (Global)
- [ ] SDK instalado y funcionando
- [ ] Chat operativo
- [ ] Tracking funcionando correctamente
- [ ] Página de privacidad con mención del SDK

### Para Sitios CON GDPR (UE)
- [ ] Modo GDPR activado (`requireConsent: true`)
- [ ] Banner de consentimiento implementado
- [ ] Tracking pausado hasta obtener consentimiento (verificado)
- [ ] Página de privacidad actualizada con detalles de cookies
- [ ] Página de gestión de cookies creada
- [ ] Botones de descarga/eliminación de datos añadidos
- [ ] Integración con plugin de cookies (si usas uno)
- [ ] Probado en diferentes navegadores
- [ ] Verificado que el tracking se pausa correctamente
- [ ] Verificado que los derechos GDPR funcionan
- [ ] Verificado que el chat no se muestra sin consentimiento

---

## Soporte

Si tienes problemas con la implementación:

- 📖 Documentación completa: `GDPR_CONSENT.md`
- 🐛 Reportar issues: GitHub Issues
- 💬 Soporte: support@guiders.com

---

## Preguntas Frecuentes (FAQ)

### ¿El SDK funciona sin activar GDPR?
**Sí**, por defecto el SDK funciona completamente sin requerir consentimiento. Solo necesitas activar GDPR si tu sitio está en la UE.

### ¿Qué pasa si activo GDPR sin implementar un banner?
El SDK esperará consentimiento indefinidamente. El chat y tracking estarán pausados hasta que llames a `window.guiders.grantConsent()`.

### ¿Puedo usar mi propio banner en lugar de los ejemplos?
Sí, puedes usar cualquier banner. Solo necesitas llamar a las APIs del SDK (`grantConsent`, `denyConsent`) cuando el usuario interactúe con tu banner.

### ¿El modo GDPR afecta el rendimiento?
No. El SDK simplemente espera el consentimiento antes de iniciar el tracking. No hay impacto en el rendimiento.

### ¿Necesito un plugin de cookies si activo GDPR?
No es obligatorio. Puedes usar los banners personalizados incluidos en esta guía. Los plugins de cookies son opcionales pero recomendados para gestión centralizada.

### ¿Qué datos guarda el SDK?
- **Fingerprint del navegador**: Para identificar visitantes
- **Historial de chat**: Mensajes entre visitante y comerciales
- **Eventos de tracking**: Interacciones del usuario (clics, vistas, etc.)
- **Estado de consentimiento**: Preferencias del usuario

Ver la política de privacidad para más detalles.

### ¿Puedo desactivar GDPR después de activarlo?
Sí, simplemente elimina el código que establece `requireConsent: true`. El SDK volverá a funcionar sin barreras.

### ¿Los visitantes fuera de la UE ven el banner?
Si activas GDPR, **todos** los visitantes verán el banner. Si quieres mostrar el banner solo a usuarios de la UE, necesitarás implementar detección geográfica (no incluida en esta guía).

---

## Recursos Adicionales

- [Guía GDPR - AEPD](https://www.aepd.es/es/documento/guia-cookies.pdf)
- [GDPR_CONSENT.md](../GDPR_CONSENT.md) - Guía completa del SDK
- [Complianz](https://wordpress.org/plugins/complianz-gdpr/) - Plugin recomendado
- [CookieYes](https://wordpress.org/plugins/cookie-law-info/) - Alternativa gratuita
- [Code Snippets](https://wordpress.org/plugins/code-snippets/) - Para añadir código sin editar tema
