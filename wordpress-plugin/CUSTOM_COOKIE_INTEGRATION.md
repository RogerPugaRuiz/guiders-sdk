# Integración con Sistema de Cookies Personalizado

Esta guía explica cómo integrar Guiders SDK con un sistema de gestión de cookies personalizado que no usa WP Consent API.

## Escenarios

### Escenario 1: Sistema de Cookies Personalizado Existente

Tu web ya tiene un sistema de cookies propio (JavaScript personalizado, librería custom, etc.) y quieres que Guiders respete esas preferencias.

### Escenario 2: Integración con Librería Externa

Estás usando una librería de cookies específica que no soporta WP Consent API (ej: Osano, OneTrust, Termly, etc.)

## Métodos de Integración

### Método 1: Sincronización Manual con JavaScript

El método más directo es sincronizar manualmente las preferencias después de inicializar Guiders.

#### Paso 1: Desactivar Banner de Guiders

```
WordPress Admin → Guiders SDK → Configuración

GDPR y Consentimiento:
❌ Requerir Consentimiento: No
❌ Banner de Consentimiento: No
```

#### Paso 2: Agregar Script de Sincronización

Agrega este código en tu tema (en `footer.php` o mediante el hook `wp_footer`):

```javascript
// Esperar a que Guiders esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que Guiders SDK esté inicializado
    function waitForGuiders() {
        if (typeof window.guiders === 'undefined' || !window.guiders.updateConsent) {
            setTimeout(waitForGuiders, 100);
            return;
        }

        // PASO 1: Leer estado de TU sistema de cookies
        // Reemplaza esto con tu lógica real
        var miSistemaCookies = {
            funcionales: true,      // Usuario aceptó cookies funcionales
            analytics: false,       // Usuario rechazó analytics
            marketing: true         // Usuario aceptó marketing
        };

        // PASO 2: Mapear a formato de Guiders
        var guidersConsent = {
            functional: miSistemaCookies.funcionales,
            analytics: miSistemaCookies.analytics,
            personalization: miSistemaCookies.marketing
        };

        // PASO 3: Sincronizar con Guiders
        window.guiders.updateConsent(guidersConsent);
        console.log('[Custom Integration] Consentimiento sincronizado:', guidersConsent);

        // PASO 4: Escuchar cambios en TU sistema
        // Reemplaza esto con tu método real de escuchar cambios
        document.addEventListener('cookiePreferencesChanged', function(event) {
            var newConsent = {
                functional: event.detail.funcionales,
                analytics: event.detail.analytics,
                personalization: event.detail.marketing
            };
            window.guiders.updateConsent(newConsent);
            console.log('[Custom Integration] Consentimiento actualizado:', newConsent);
        });
    }

    waitForGuiders();
});
```

### Método 2: Integración con Osano

Si usas Osano Cookie Consent:

```javascript
// En tu tema o en Appearance → Customize → Additional CSS (sección JS)
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que Guiders esté listo
    function waitForGuiders() {
        if (!window.guiders || !window.guiders.updateConsent) {
            setTimeout(waitForGuiders, 100);
            return;
        }

        // Escuchar eventos de Osano
        Osano.cm.addEventListener('osano-cm-consent-saved', function(consent) {
            var guidersConsent = {
                functional: consent.ESSENTIAL || false,
                analytics: consent.ANALYTICS || false,
                personalization: consent.MARKETING || false
            };

            window.guiders.updateConsent(guidersConsent);
            console.log('[Osano → Guiders] Consentimiento sincronizado:', guidersConsent);
        });

        // Sincronización inicial
        var currentConsent = Osano.cm.getConsent();
        if (currentConsent) {
            var guidersConsent = {
                functional: currentConsent.ESSENTIAL || false,
                analytics: currentConsent.ANALYTICS || false,
                personalization: currentConsent.MARKETING || false
            };
            window.guiders.updateConsent(guidersConsent);
        }
    }

    waitForGuiders();
});
```

### Método 3: Integración con OneTrust

Si usas OneTrust:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    function waitForGuiders() {
        if (!window.guiders || !window.guiders.updateConsent) {
            setTimeout(waitForGuiders, 100);
            return;
        }

        // Función para leer grupos de OneTrust
        function getOneTrustConsent() {
            if (typeof OptanonActiveGroups === 'undefined') {
                return null;
            }

            return {
                functional: OptanonActiveGroups.indexOf('C0003') >= 0, // Strictly Necessary
                analytics: OptanonActiveGroups.indexOf('C0002') >= 0,  // Performance Cookies
                personalization: OptanonActiveGroups.indexOf('C0004') >= 0 // Targeting Cookies
            };
        }

        // Escuchar eventos de OneTrust
        function OnConsentChanged() {
            var consent = getOneTrustConsent();
            if (consent) {
                window.guiders.updateConsent(consent);
                console.log('[OneTrust → Guiders] Consentimiento actualizado:', consent);
            }
        }

        // Registrar callback
        if (typeof OneTrust !== 'undefined' && OneTrust.OnConsentChanged) {
            OneTrust.OnConsentChanged(OnConsentChanged);
        }

        // Sincronización inicial
        var initialConsent = getOneTrustConsent();
        if (initialConsent) {
            window.guiders.updateConsent(initialConsent);
        }
    }

    waitForGuiders();
});
```

### Método 4: Integración con Cookiebot

Si usas Cookiebot:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    function waitForGuiders() {
        if (!window.guiders || !window.guiders.updateConsent) {
            setTimeout(waitForGuiders, 100);
            return;
        }

        // Función para leer consentimiento de Cookiebot
        function getCookiebotConsent() {
            if (typeof Cookiebot === 'undefined') {
                return null;
            }

            return {
                functional: Cookiebot.consent.preferences,
                analytics: Cookiebot.consent.statistics,
                personalization: Cookiebot.consent.marketing
            };
        }

        // Escuchar eventos de Cookiebot
        window.addEventListener('CookiebotOnAccept', function() {
            var consent = getCookiebotConsent();
            if (consent) {
                window.guiders.updateConsent(consent);
                console.log('[Cookiebot → Guiders] Consentimiento aceptado:', consent);
            }
        });

        window.addEventListener('CookiebotOnDecline', function() {
            window.guiders.updateConsent({
                functional: false,
                analytics: false,
                personalization: false
            });
            console.log('[Cookiebot → Guiders] Consentimiento rechazado');
        });

        // Sincronización inicial
        var initialConsent = getCookiebotConsent();
        if (initialConsent) {
            window.guiders.updateConsent(initialConsent);
        }
    }

    waitForGuiders();
});
```

### Método 5: Sistema de Cookies con LocalStorage

Si tu sistema guarda preferencias en `localStorage`:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    function waitForGuiders() {
        if (!window.guiders || !window.guiders.updateConsent) {
            setTimeout(waitForGuiders, 100);
            return;
        }

        // Leer de localStorage (adapta las claves a tu sistema)
        function getLocalStorageConsent() {
            try {
                var cookiePreferences = JSON.parse(localStorage.getItem('cookie_preferences'));

                return {
                    functional: cookiePreferences?.functional ?? true,
                    analytics: cookiePreferences?.analytics ?? false,
                    personalization: cookiePreferences?.marketing ?? false
                };
            } catch (e) {
                console.error('[Custom Integration] Error leyendo localStorage:', e);
                return null;
            }
        }

        // Sincronización inicial
        var consent = getLocalStorageConsent();
        if (consent) {
            window.guiders.updateConsent(consent);
            console.log('[LocalStorage → Guiders] Consentimiento inicial:', consent);
        }

        // Escuchar cambios en localStorage
        window.addEventListener('storage', function(event) {
            if (event.key === 'cookie_preferences') {
                var newConsent = getLocalStorageConsent();
                if (newConsent) {
                    window.guiders.updateConsent(newConsent);
                    console.log('[LocalStorage → Guiders] Consentimiento actualizado:', newConsent);
                }
            }
        });

        // Escuchar evento custom (si tu sistema lo dispara)
        document.addEventListener('cookiePreferencesUpdated', function() {
            var newConsent = getLocalStorageConsent();
            if (newConsent) {
                window.guiders.updateConsent(newConsent);
            }
        });
    }

    waitForGuiders();
});
```

## Integración mediante Hook de WordPress

Si prefieres agregar el código mediante un hook de WordPress en lugar de editar archivos del tema:

### Opción 1: En functions.php del tema

```php
// En tu tema: functions.php
add_action('wp_footer', function() {
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        function waitForGuiders() {
            if (!window.guiders || !window.guiders.updateConsent) {
                setTimeout(waitForGuiders, 100);
                return;
            }

            // TU CÓDIGO DE SINCRONIZACIÓN AQUÍ
            // (usar cualquiera de los métodos de arriba)
        }

        waitForGuiders();
    });
    </script>
    <?php
}, 30); // Prioridad 30 para cargar después de Guiders
```

### Opción 2: Plugin personalizado

Crea un pequeño plugin para la integración:

```php
<?php
/**
 * Plugin Name: Guiders Cookie Sync
 * Description: Sincroniza sistema de cookies personalizado con Guiders SDK
 * Version: 1.0.0
 */

add_action('wp_footer', 'guiders_custom_cookie_sync', 30);

function guiders_custom_cookie_sync() {
    ?>
    <script>
    (function() {
        'use strict';

        function syncCookieConsent() {
            if (!window.guiders || !window.guiders.updateConsent) {
                setTimeout(syncCookieConsent, 100);
                return;
            }

            // ADAPTA ESTO A TU SISTEMA
            var myCustomCookieSystem = window.YourCookieSystem || {};

            var guidersConsent = {
                functional: myCustomCookieSystem.acceptedFunctional || false,
                analytics: myCustomCookieSystem.acceptedAnalytics || false,
                personalization: myCustomCookieSystem.acceptedMarketing || false
            };

            window.guiders.updateConsent(guidersConsent);
            console.log('[Custom Sync] Consentimiento sincronizado:', guidersConsent);

            // Escuchar cambios
            if (typeof myCustomCookieSystem.onChange === 'function') {
                myCustomCookieSystem.onChange(function(newPreferences) {
                    var newConsent = {
                        functional: newPreferences.functional || false,
                        analytics: newPreferences.analytics || false,
                        personalization: newPreferences.marketing || false
                    };
                    window.guiders.updateConsent(newConsent);
                    console.log('[Custom Sync] Consentimiento actualizado:', newConsent);
                });
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', syncCookieConsent);
        } else {
            syncCookieConsent();
        }
    })();
    </script>
    <?php
}
```

## API de Guiders para Gestión de Consentimiento

### Métodos disponibles

```javascript
// 1. Actualizar consentimiento (parcial o completo)
window.guiders.updateConsent({
    functional: true,
    analytics: false,
    personalization: true
});

// 2. Obtener estado actual
var currentConsent = window.guiders.getConsentStatus();
console.log(currentConsent);
// Retorna: { functional: true, analytics: false, personalization: true }

// 3. Verificar si tiene consentimiento para categoría específica
if (window.guiders.hasConsent('analytics')) {
    console.log('Usuario aceptó analytics');
}

// 4. Revocar todo el consentimiento
window.guiders.updateConsent({
    functional: false,
    analytics: false,
    personalization: false
});
```

### Categorías de Guiders

| Categoría | Descripción | Afecta a |
|-----------|-------------|----------|
| `functional` | Cookies funcionales necesarias | Chat en vivo, sesión básica |
| `analytics` | Análisis y métricas | Tracking de eventos, heatmaps |
| `personalization` | Personalización y marketing | Personalización de contenido, remarketing |

## Verificación de Integración

### Test 1: Verificar sincronización inicial

```javascript
// En consola del navegador:
window.guiders.getConsentStatus()

// Debe coincidir con tu sistema de cookies
```

### Test 2: Verificar sincronización en tiempo real

1. Abre consola del navegador
2. Cambia preferencias de cookies en tu sistema
3. Ejecuta: `window.guiders.getConsentStatus()`
4. Verifica que el estado se actualizó

### Test 3: Verificar que el tracking respeta el consentimiento

```javascript
// Desactivar analytics:
window.guiders.updateConsent({ analytics: false });

// Intentar trackear evento:
window.guiders.trackEvent('test_event');

// En consola debe aparecer: "Evento bloqueado por falta de consentimiento"
```

## Troubleshooting

### Problema: Guiders no respeta las preferencias de cookies

**Causa**: El script de sincronización no se está ejecutando o se ejecuta antes de que Guiders esté listo.

**Solución**:
```javascript
// Verifica que waitForGuiders() está esperando correctamente:
function waitForGuiders() {
    console.log('Esperando Guiders...', {
        guidersExists: typeof window.guiders !== 'undefined',
        hasUpdateConsent: window.guiders?.updateConsent !== undefined
    });

    if (!window.guiders || !window.guiders.updateConsent) {
        setTimeout(waitForGuiders, 100);
        return;
    }

    console.log('✅ Guiders listo para sincronización');
    // Tu código aquí
}
```

### Problema: El consentimiento se resetea al recargar página

**Causa**: La sincronización inicial no está leyendo correctamente el estado guardado.

**Solución**:
1. Verifica que tu sistema de cookies guarda las preferencias correctamente
2. Añade logs para debug:
```javascript
console.log('Estado leído de mi sistema:', miSistemaCookies);
console.log('Estado enviado a Guiders:', guidersConsent);
```

### Problema: Los cambios no se aplican inmediatamente

**Causa**: El listener de cambios no está registrado correctamente.

**Solución**:
1. Verifica que tu sistema de cookies dispara eventos cuando cambian las preferencias
2. Si no dispara eventos, implementa polling:
```javascript
var lastConsent = JSON.stringify(window.guiders.getConsentStatus());

setInterval(function() {
    var currentConsent = getMySystemConsent();
    var currentConsentStr = JSON.stringify(currentConsent);

    if (currentConsentStr !== lastConsent) {
        window.guiders.updateConsent(currentConsent);
        lastConsent = currentConsentStr;
        console.log('Consentimiento actualizado:', currentConsent);
    }
}, 1000); // Revisar cada segundo
```

## Ejemplos de Sistemas Comunes

### Sistema con Cookie Simple

```javascript
// Si usas una cookie simple como: cookie_consent=functional:1,analytics:0,marketing:1
function parseCookieConsent() {
    var cookie = document.cookie.split(';')
        .find(c => c.trim().startsWith('cookie_consent='));

    if (!cookie) return null;

    var value = cookie.split('=')[1];
    var parts = value.split(',');

    var consent = {};
    parts.forEach(function(part) {
        var [key, val] = part.split(':');
        consent[key] = val === '1';
    });

    return {
        functional: consent.functional ?? true,
        analytics: consent.analytics ?? false,
        personalization: consent.marketing ?? false
    };
}

// Usar:
var consent = parseCookieConsent();
if (consent) {
    window.guiders.updateConsent(consent);
}
```

### Sistema con Atributos data-*

```javascript
// Si tu banner guarda el estado en data attributes:
// <div id="cookie-banner" data-functional="true" data-analytics="false" data-marketing="true">
function getDataAttributeConsent() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return null;

    return {
        functional: banner.getAttribute('data-functional') === 'true',
        analytics: banner.getAttribute('data-analytics') === 'true',
        personalization: banner.getAttribute('data-marketing') === 'true'
    };
}

// Usar:
var consent = getDataAttributeConsent();
if (consent) {
    window.guiders.updateConsent(consent);
}
```

## Mejores Prácticas

1. **Sincronización inicial**: Siempre sincroniza el estado al cargar la página
2. **Listeners de cambios**: Implementa listeners para actualizaciones en tiempo real
3. **Logs de debug**: Usa console.log para verificar que funciona durante desarrollo
4. **Fallback seguro**: Si no hay consentimiento guardado, usa valores conservadores (todo false excepto functional)
5. **Prioridad de carga**: Asegúrate que tu script carga DESPUÉS de que Guiders esté inicializado (prioridad 30+ en wp_footer)

## Soporte

Si tu sistema de cookies es muy específico y necesitas ayuda:
1. Identifica cómo tu sistema guarda las preferencias (cookie, localStorage, atributo, etc.)
2. Identifica cómo tu sistema notifica cambios (evento, callback, etc.)
3. Adapta uno de los ejemplos de arriba a tu caso

---

**Última actualización**: 2025-01-24
**Versión mínima de Guiders**: 2.0.11+
