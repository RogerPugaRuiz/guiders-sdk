# Integración con Plugins de Cookies

Esta guía explica cómo configurar el plugin Guiders SDK para sincronizarse automáticamente con plugins de gestión de cookies, tanto los que usan **WP Consent API** como otros populares.

## Sistemas Soportados

Guiders SDK soporta **dos tipos de integración**:

### 1. WP Consent API (Estándar)

[WP Consent API](https://wordpress.org/plugins/wp-consent-api/) es un estándar de WordPress que permite la comunicación entre plugins de gestión de consentimiento de cookies y plugins que rastrean usuarios.

### 2. Adaptadores Específicos de Guiders

Para plugins populares que **no** soportan WP Consent API, Guiders incluye adaptadores personalizados que sincronizan directamente con cada sistema.

## Plugins de Cookies Compatibles

### Con WP Consent API (sincronización estándar):

- ✅ **CookieFirst**
- ✅ **CookieYes**
- ✅ **WP Cookie Consent (GDPR Cookie Consent)**
- ✅ **Complianz**
- ✅ Y otros plugins que soporten WP Consent API

### Con Adaptador de Guiders (sincronización directa):

- ✨ **Moove GDPR / GDPR Cookie Compliance** - Adaptador personalizado que lee desde localStorage
- ✨ **Cookiebot** - Adaptador que usa la API nativa de Cookiebot
- ✨ **OneTrust** - Adaptador que usa la API nativa de OneTrust

### No soportados (requieren integración manual):

- ⚠️ **Beautiful and responsive cookie consent** - No tiene API de sincronización
- ⚠️ **Cookie Notice** - API limitada
- ⚠️ **Termly** - Requiere configuración personalizada

## Configuración Paso a Paso

### 1. Instalar el Plugin de Cookies

Instala uno de los plugins compatibles. Ejemplos recomendados:

**Con WP Consent API:**
```
WordPress Admin → Plugins → Add New → Buscar "CookieYes" → Instalar → Activar
```

**Con Adaptador de Guiders:**
```
WordPress Admin → Plugins → Add New → Buscar "Moove GDPR" → Instalar → Activar
```

### 2. Configurar el Plugin de Cookies

Configura las categorías de cookies según tus necesidades:

- **Functional** (Funcionales): Cookies necesarias para el funcionamiento básico
- **Statistics/Analytics** (Estadísticas): Analytics y métricas de uso
- **Marketing/Personalization** (Marketing): Personalización y remarketing

### 3. Instalar WP Consent API (solo si es necesario)

**Solo para plugins con WP Consent API:** Algunos plugins ya incluyen WP Consent API. Si no está incluido, instálalo:

```
WordPress Admin → Plugins → Add New → Buscar "WP Consent API" → Instalar → Activar
```

**Plugins con Adaptador de Guiders:** NO necesitas instalar WP Consent API, la sincronización funciona directamente.

### 4. Configurar Guiders SDK

En la configuración del plugin Guiders:

```
WordPress Admin → Guiders SDK → Configuración

✅ Plugin Activado: Sí
✅ API Key: [tu-api-key]

GDPR y Consentimiento:
✅ Requerir Consentimiento: Sí (por defecto desde v2.3.0)
❌ Banner de Consentimiento: No (usar el plugin de cookies externo)
✅ Sincronización Automática de Cookies: Sí
```

**Nota importante**: Desde la versión 2.3.0, el plugin requiere consentimiento por defecto (GDPR Article 25: Privacy by Default). Si usas un plugin de cookies externo, desactiva el banner interno de Guiders para evitar duplicados.

### 5. Verificar Sincronización

Una vez configurado, abre la consola del navegador (F12) y busca estos mensajes:

**Para plugins con WP Consent API:**
```
[Guiders WP] ✅ WP Consent API detectada - sincronizando consentimiento
[Guiders WP] Consentimiento sincronizado: functional → functional = true
[Guiders WP] Consentimiento sincronizado: statistics → analytics = true
[Guiders WP] Consentimiento sincronizado: marketing → personalization = true
[Guiders WP] Consentimiento inicial sincronizado con Guiders SDK
[Guiders WP] Listener de cambios de consentimiento activado
```

**Para Moove GDPR:**
```
[Guiders WP] ✅ Moove GDPR detectado - sincronizando
[Guiders WP] Moove GDPR: functional=true, analytics=true, personalization=false
```

**Para Cookiebot:**
```
[Guiders WP] ✅ Cookiebot detectado - sincronizando
[Guiders WP] Cookiebot: functional=true, analytics=true, personalization=true
```

**Para OneTrust:**
```
[Guiders WP] ✅ OneTrust detectado - sincronizando
[Guiders WP] OneTrust: functional=true, analytics=true, personalization=false
```

Si ves `[Guiders WP] No se detectó ningún plugin de cookies compatible`, verifica que:
- El plugin de cookies está activado
- Es uno de los plugins soportados (ver lista arriba)
- Si usa WP Consent API: verifica que WP Consent API está instalado

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

## Adaptadores Específicos

### Moove GDPR (GDPR Cookie Compliance)

**Cómo funciona:**
- Lee el consentimiento desde `localStorage` (cookies `moove_gdpr_popup*`)
- Sincroniza en tiempo real con eventos `moove_gdpr_modal_closed` y `storage`
- NO requiere WP Consent API

**Mapeo de categorías:**
```
localStorage['moove_gdpr_popup'] === '1'           → functional: true
localStorage['moove_gdpr_popup_analytics'] === '1' → analytics: true
localStorage['moove_gdpr_popup_marketing'] === '1' → personalization: true
```

**Plugin URL:** https://wordpress.org/plugins/gdpr-cookie-compliance/

### Cookiebot

**Cómo funciona:**
- Usa la API JavaScript nativa de Cookiebot (`window.Cookiebot.consent`)
- Sincroniza con eventos `CookiebotOnAccept` y `CookiebotOnDecline`
- NO requiere WP Consent API

**Mapeo de categorías:**
```
Cookiebot.consent.preferences → functional: true/false
Cookiebot.consent.statistics  → analytics: true/false
Cookiebot.consent.marketing   → personalization: true/false
```

**Plugin URL:** https://wordpress.org/plugins/cookiebot/

### OneTrust

**Cómo funciona:**
- Lee los grupos de consentimiento desde `OnetrustActiveGroups`
- Sincroniza con evento `OneTrust.OnConsentChanged()`
- NO requiere WP Consent API

**Mapeo de categorías (IAB TCF v2.0):**
```
Group 'C0003' o '2' en OnetrustActiveGroups → functional: true
Group 'C0002' o '3' en OnetrustActiveGroups → analytics: true
Group 'C0004' o '4' en OnetrustActiveGroups → personalization: true
```

**Sitio oficial:** https://www.onetrust.com/

## Casos de Uso

### Caso 1: Sitio con GDPR estricto (Europa)

```
Plugin de cookies: "Moove GDPR"
Configuración: Opt-in (usuario debe aceptar explícitamente)

Guiders SDK:
- Requerir Consentimiento: Sí (por defecto desde v2.3.0)
- Banner de Consentimiento: No (lo maneja Moove GDPR)
- Sincronización Automática: Sí

Resultado: Solo el banner de Moove GDPR, sincronización automática con Guiders
```

### Caso 2: Sitio global sin cookies externas

```
Plugin de cookies: Ninguno

Guiders SDK:
- Requerir Consentimiento: No
- Banner de Consentimiento: No

Resultado: Guiders funciona inmediatamente sin barreras de consentimiento
```

### Caso 3: Sitio con WP Consent API

```
Plugin de cookies: "CookieYes" (soporta WP Consent API)

Guiders SDK:
- Requerir Consentimiento: Sí
- Banner de Consentimiento: No (lo maneja CookieYes)
- Sincronización Automática: Sí

Resultado: Banner de CookieYes, sincronización vía WP Consent API
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

## Desactivar Sincronización Automática

Si quieres usar solo el sistema de consentimiento interno de Guiders:

**Opción 1: Desactivar sincronización (mantener plugin de cookies)**
```
WordPress Admin → Guiders SDK → GDPR y Consentimiento
→ Sincronización Automática de Cookies: No
→ Banner de Consentimiento: Sí (usar banner interno de Guiders)
```

**Opción 2: Desinstalar plugins de cookies**
1. Desactiva el plugin de cookies
2. Desactiva WP Consent API (si está instalado)
3. Configura Guiders SDK:
   ```
   Requerir Consentimiento: Sí
   Banner de Consentimiento: Sí
   Sincronización Automática: No
   ```

El plugin detectará automáticamente que no hay plugins de cookies y usará su sistema interno.

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
**Versión del plugin**: 2.3.0+
**Nuevas características**:
- ✨ Soporte para Moove GDPR (adaptador personalizado)
- ✨ Soporte para Cookiebot (adaptador personalizado)
- ✨ Soporte para OneTrust (adaptador personalizado)
- 🔒 Consentimiento requerido por defecto (GDPR Article 25: Privacy by Default)
- 🔍 Detección automática multi-plugin con prioridad
