# Integración con WP Consent API

Esta guía explica cómo configurar el plugin Guiders SDK para sincronizarse automáticamente con plugins de gestión de cookies que usan **WP Consent API**.

## ¿Qué es WP Consent API?

[WP Consent API](https://wordpress.org/plugins/wp-consent-api/) es un estándar de WordPress que permite la comunicación entre plugins de gestión de consentimiento de cookies y plugins que rastrean usuarios.

## Plugins de Cookies Compatibles

Los siguientes plugins de gestión de cookies son compatibles con WP Consent API:

- ✅ **Beautiful and responsive cookie consent**
- ✅ **CookieFirst**
- ✅ **CookieYes**
- ✅ **WP Cookie Consent (GDPR Cookie Consent)**
- ✅ **Complianz**
- ✅ **Cookiebot**
- ✅ Y otros plugins que soporten WP Consent API

## Configuración Paso a Paso

### 1. Instalar el Plugin de Cookies

Instala uno de los plugins compatibles, por ejemplo **Beautiful and responsive cookie consent**:

```
WordPress Admin → Plugins → Add New → Buscar "Beautiful and responsive cookie consent" → Instalar → Activar
```

### 2. Configurar el Plugin de Cookies

Configura las categorías de cookies según tus necesidades:

- **Functional** (Funcionales): Cookies necesarias para el funcionamiento básico
- **Statistics** (Estadísticas): Analytics y métricas de uso
- **Marketing** (Marketing): Personalización y remarketing

### 3. Instalar WP Consent API (si no está incluido)

Algunos plugins ya incluyen WP Consent API. Si no está incluido, instálalo:

```
WordPress Admin → Plugins → Add New → Buscar "WP Consent API" → Instalar → Activar
```

### 4. Configurar Guiders SDK

En la configuración del plugin Guiders:

**Opción A: Con banner de Guiders desactivado (recomendado)**

```
WordPress Admin → Guiders SDK → Configuración

✅ Plugin Activado: Sí
✅ API Key: [tu-api-key]

GDPR y Consentimiento:
❌ Requerir Consentimiento: No (el plugin de cookies se encarga)
❌ Banner de Consentimiento: No (usar el plugin de cookies)
```

**Opción B: Con banner de Guiders como fallback**

```
GDPR y Consentimiento:
✅ Requerir Consentimiento: Sí
✅ Banner de Consentimiento: Sí (se mostrará si no hay otro plugin)
```

### 5. Verificar Sincronización

Una vez configurado, abre la consola del navegador (F12) y busca estos mensajes:

```
[Guiders WP] WP Consent API detectada - sincronizando consentimiento
[Guiders WP] Consentimiento sincronizado: functional → functional = true
[Guiders WP] Consentimiento sincronizado: statistics → analytics = true
[Guiders WP] Consentimiento sincronizado: marketing → personalization = true
[Guiders WP] Consentimiento inicial sincronizado con Guiders SDK
[Guiders WP] Listener de cambios de consentimiento activado
```

Si ves `[Guiders WP] WP Consent API no detectada`, verifica que:
- El plugin de cookies está activado
- WP Consent API está instalado (algunos plugins lo incluyen automáticamente)

## Mapeo de Categorías

El plugin sincroniza automáticamente las categorías de consentimiento:

| WP Consent API | Guiders SDK | Descripción |
|----------------|-------------|-------------|
| `functional` | `functional` | Cookies funcionales necesarias |
| `statistics` | `analytics` | Analytics y seguimiento de uso |
| `marketing` | `personalization` | Personalización y remarketing |

## Comportamiento de Sincronización

### Sincronización Inicial

Al cargar la página:
1. El plugin de cookies muestra el banner
2. El usuario acepta/rechaza categorías
3. Guiders SDK lee el estado y lo aplica automáticamente

### Sincronización en Tiempo Real

Si el usuario cambia las preferencias:
1. El plugin de cookies actualiza el estado
2. WP Consent API dispara el evento `wp_listen_for_consent_change`
3. Guiders SDK detecta el cambio y actualiza inmediatamente
4. El tracking se activa/desactiva según las nuevas preferencias

## Casos de Uso

### Caso 1: Sitio con GDPR estricto

```
Plugin de cookies: "Beautiful and responsive cookie consent"
Configuración: Opt-in (usuario debe aceptar explícitamente)

Guiders SDK:
- Requerir Consentimiento: No (lo maneja el plugin de cookies)
- Banner de Consentimiento: No

Resultado: Solo el banner del plugin de cookies, sincronización automática con Guiders
```

### Caso 2: Sitio global con consentimiento opcional

```
Plugin de cookies: Ninguno

Guiders SDK:
- Requerir Consentimiento: No (consentimiento automático)
- Banner de Consentimiento: No

Resultado: Guiders funciona inmediatamente sin barreras de consentimiento
```

### Caso 3: Sitio con doble capa de consentimiento

```
Plugin de cookies: "Beautiful and responsive cookie consent"
Configuración: Opt-out (preseleccionado, usuario puede rechazar)

Guiders SDK:
- Requerir Consentimiento: Sí
- Banner de Consentimiento: Sí (fallback si falla el plugin de cookies)

Resultado: Banner del plugin de cookies primero, banner de Guiders como backup
```

## Verificación de Integración

### Test 1: Verificar Detección de WP Consent API

```javascript
// En la consola del navegador:
typeof wp_has_consent
// Debe retornar: "function"
```

### Test 2: Verificar Estado de Consentimiento

```javascript
// Verificar cada categoría:
console.log('Functional:', wp_has_consent('functional'));
console.log('Statistics:', wp_has_consent('statistics'));
console.log('Marketing:', wp_has_consent('marketing'));
```

### Test 3: Verificar Sincronización con Guiders

```javascript
// Ver estado de consentimiento en Guiders:
window.guiders.getConsentStatus()

// Debe retornar algo como:
// {
//   functional: true,
//   analytics: true,
//   personalization: false
// }
```

### Test 4: Cambiar Consentimiento en Tiempo Real

1. Abre el sitio web
2. Abre la consola (F12)
3. Acepta todas las cookies en el banner
4. Verifica en consola: `[Guiders WP] Consentimiento actualizado...`
5. Cambia las preferencias (solo aceptar funcionales)
6. Verifica que los mensajes de cambio aparecen
7. Ejecuta `window.guiders.getConsentStatus()` para confirmar

## Troubleshooting

### Problema: "WP Consent API no detectada"

**Solución:**
1. Verifica que el plugin de cookies está activado
2. Instala "WP Consent API" manualmente si no está incluido
3. Limpia caché del sitio y del navegador
4. Recarga la página

### Problema: Consentimiento no se sincroniza

**Solución:**
1. Verifica que el plugin de cookies usa WP Consent API (ver lista de compatibles)
2. Abre consola y busca errores JavaScript
3. Verifica que `window.guiders.updateConsent` existe:
   ```javascript
   typeof window.guiders.updateConsent
   // Debe retornar: "function"
   ```

### Problema: Banner de Guiders y banner de cookies se muestran juntos

**Solución:**
Desactiva el banner de Guiders:
```
WordPress Admin → Guiders SDK → GDPR y Consentimiento
→ Banner de Consentimiento: No
```

### Problema: Tracking no se activa después de aceptar cookies

**Solución:**
1. Verifica en consola: `window.guiders.getConsentStatus()`
2. Si el consentimiento está correcto pero no trackea, verifica:
   ```javascript
   // Debe retornar true si tracking está activado:
   window.guiders.isTrackingEnabled()
   ```
3. Recarga la página completamente (Ctrl+Shift+R)

## Desactivar Integración con WP Consent API

Si quieres usar solo el sistema de consentimiento interno de Guiders:

1. Desactiva el plugin de cookies
2. Desactiva WP Consent API
3. Configura Guiders SDK:
   ```
   Requerir Consentimiento: Sí
   Banner de Consentimiento: Sí
   ```

El plugin detectará automáticamente que WP Consent API no está disponible y usará su propio sistema.

## Soporte

Para más información:
- Documentación de Guiders: https://github.com/RogerPugaRuiz/guiders-sdk
- WP Consent API: https://wordpress.org/plugins/wp-consent-api/
- Beautiful Cookie Consent: https://wordpress.org/plugins/beautiful-and-responsive-cookie-consent/

## Notas Técnicas

### Implementación

La integración usa:
- **JavaScript**: Eventos `wp_listen_for_consent_change` y funciones `wp_has_consent()`, `wp_set_consent()`
- **PHP**: Filtro `wp_consent_api_registered_{$plugin}` para registrar compatibilidad
- **Sincronización bidireccional**: Cambios en cookies → Guiders (automático), Guiders → cookies (manual si es necesario)

### Prioridad de Carga

El script de sincronización se ejecuta:
1. Después de que el SDK de Guiders esté inicializado
2. En el callback `.then()` de `window.guiders.init()`
3. Antes de activar el tracking automático

### Logs de Debug

Para ver todos los logs de sincronización, abre la consola y filtra por `[Guiders WP]`:

```javascript
// Ver solo logs de Guiders WP:
// En Chrome DevTools: Filter → "[Guiders WP]"
```

---

**Última actualización**: 2025-01-24
**Versión del plugin**: 2.0.11+
