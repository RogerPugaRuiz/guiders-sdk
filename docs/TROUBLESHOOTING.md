# ❓ FAQ & Troubleshooting

Soluciones a los problemas más comunes con Guiders SDK.

## 🚨 Problemas de Instalación

### ❌ "SDK no se carga/inicializa"

**Síntomas:**
- No aparece mensaje "SDK initialized" en consola
- `window.guiders` es `undefined`
- No se detectan eventos

**Soluciones:**

1. **Verificar API Key**
   ```javascript
   // En consola del navegador
   console.log('API Key configurada:', document.querySelector('script[data-api-key]')?.getAttribute('data-api-key'));
   ```

2. **Verificar URL del script**
   ```html
   <!-- ✅ Correcto -->
   <script src="https://cdn.guiders.com/latest/guiders-sdk.js" data-api-key="tu-api-key"></script>
   
   <!-- ❌ URLs incorrectas comunes -->
   <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js"></script>
   ```

3. **Verificar bloqueadores de anuncios**
   - Deshabilitar temporalmente AdBlock/uBlock
   - Añadir excepción para tu dominio

4. **Verificar CORS**
   ```javascript
   // Error típico de CORS en consola
   "Access to script at 'https://cdn.guiders.com/...' from origin 'http://localhost' has been blocked by CORS policy"
   ```
   **Solución:** Usar HTTPS o configurar excepción local

### ❌ "API Key inválida"

**Síntomas:**
- Error 401 en Network tab
- Mensaje "Invalid API Key" en consola

**Soluciones:**

1. **Verificar API Key en dashboard**
   - Ve a [dashboard.guiders.com](https://dashboard.guiders.com)
   - Navega a tu proyecto
   - Copia la API Key exacta

2. **Verificar formato**
   ```html
   <!-- ✅ Correcto -->
   <script src="..." data-api-key="gsk_1234567890abcdef"></script>
   
   <!-- ❌ Incorrecto -->
   <script src="..." data-api-key="1234567890abcdef"></script>
   ```

### ❌ "Error de red / Timeout"

**Síntomas:**
- Errores de conexión en Network tab
- SDK se inicializa pero no envía eventos

**Soluciones:**

1. **Verificar conectividad**
   ```bash
   # En terminal/comando
   ping api.guiders.com
   ```

2. **Verificar firewall corporativo**
   - Whitelist: `*.guiders.com`
   - Puertos: 443 (HTTPS), 80 (HTTP)

3. **Configurar endpoint personalizado**
   ```javascript
   window.guidersConfig = {
     endpoint: 'https://tu-proxy.com/api'
   };
   ```

## 🎯 Problemas de Detección

### ❌ "No se detectan eventos automáticamente"

**Síntomas:**
- Clicks en botones no generan eventos
- Chat habilitado pero no tracking

**Soluciones:**

1. **Habilitar modo debug**
   ```javascript
   // En consola
   window.guiders.debug = true;
   
   // O al inicializar
   window.guidersConfig = { debug: true };
   ```

2. **Verificar elementos HTML**
   ```html
   <!-- ✅ Se detecta automáticamente -->
   <button>Añadir al carrito</button>
   <button>Comprar ahora</button>
   <a href="/contact">Contactar</a>
   
   <!-- ❌ Puede no detectarse -->
   <div onclick="addToCart()">Añadir</div>
   <span class="btn">Comprar</span>
   ```

3. **Ajustar umbral de confianza**
   ```javascript
   window.guidersConfig = {
     heuristicDetection: {
       confidenceThreshold: 0.5 // Reducir para más detecciones
     }
   };
   ```

4. **Verificar timing de carga**
   ```javascript
   // Si añades elementos dinámicamente
   sdk.refreshDetection(); // Re-escanear elementos
   ```

### ❌ "Detecta elementos incorrectos"

**Síntomas:**
- Elementos no relacionados generan eventos
- Demasiados falsos positivos

**Soluciones:**

1. **Aumentar umbral de confianza**
   ```javascript
   window.guidersConfig = {
     heuristicDetection: {
       confidenceThreshold: 0.8 // Más estricto
     }
   };
   ```

2. **Excluir elementos específicos**
   ```javascript
   sdk.getHeuristicDetector().addExclusionRules([
     '.menu-button',
     '#navigation',
     '.social-links'
   ]);
   ```

3. **Usar tracking manual para elementos problemáticos**
   ```html
   <!-- Combinar automático + manual -->
   <button data-track-event="add_to_cart" data-product-id="123">
     Añadir al carrito
   </button>
   ```

## 💬 Problemas de Chat

### ❌ "Chat no aparece"

**Síntomas:**
- No hay botón de chat visible
- Error al abrir chat

**Soluciones:**

1. **Verificar configuración**
   ```javascript
   // En consola
   console.log('Chat config:', window.guiders.getChatConfig());
   ```

2. **Habilitar chat explícitamente**
   ```javascript
   window.guidersConfig = {
     chat: {
       enabled: true,
       position: 'bottom-right'
     }
   };
   ```

3. **Verificar z-index conflicts**
   ```css
   /* En DevTools, verificar si el chat está oculto */
   .guiders-chat-widget {
     z-index: 999999 !important;
   }
   ```

4. **Verificar WebSocket**
   ```javascript
   // En consola
   console.log('WebSocket status:', window.guiders.getChatStatus());
   ```

### ❌ "Chat se abre pero no hay mensajes"

**Síntomas:**
- Chat visible pero vacío
- No se pueden enviar mensajes

**Soluciones:**

1. **Verificar conexión WebSocket**
   ```javascript
   // En Network tab, buscar conexión WebSocket
   // Estado debería ser "101 Switching Protocols"
   ```

2. **Verificar autenticación**
   ```javascript
   // En consola
   console.log('Chat auth:', window.guiders.getChatAuth());
   ```

3. **Reiniciar conexión**
   ```javascript
   window.guiders.reconnectChat();
   ```

## 🤖 Problemas de Detección de Bots

### ❌ "SDK no se carga en usuarios legítimos"

**Síntomas:**
- Algunos usuarios reales no pueden usar el sitio
- SDK se inicializa inconsistentemente

**Soluciones:**

1. **Reducir umbral de detección**
   ```javascript
   window.guidersConfig = {
     botDetection: {
       threshold: 0.4 // Menos estricto (default: 0.6)
     }
   };
   ```

2. **Deshabilitar detección temporalmente**
   ```javascript
   window.guidersConfig = {
     botDetection: {
       enabled: false
     }
   };
   ```

3. **Verificar user agents problemáticos**
   ```javascript
   // En consola
   console.log('User Agent:', navigator.userAgent);
   console.log('Bot detection result:', await new BotDetector().detect());
   ```

### ❌ "Bots pasan la detección"

**Síntomas:**
- Tráfico sospechoso en analytics
- Eventos de bots conocidos

**Soluciones:**

1. **Aumentar umbral**
   ```javascript
   window.guidersConfig = {
     botDetection: {
       threshold: 0.8 // Más estricto
     }
   };
   ```

2. **Añadir reglas personalizadas**
   ```javascript
   sdk.addBotDetectionRule({
     name: 'custom_ua_check',
     check: (context) => {
       return context.userAgent.includes('MyBot');
     },
     weight: 0.9
   });
   ```

## 🏗️ Problemas de Integración

### ❌ "Conflicto con otros scripts"

**Síntomas:**
- Errores de JavaScript después de cargar SDK
- Funcionalidades del sitio dejan de funcionar

**Soluciones:**

1. **Verificar orden de carga**
   ```html
   <!-- ✅ Cargar Guiders al final -->
   <script src="jquery.js"></script>
   <script src="tu-script.js"></script>
   <script src="guiders-sdk.js" data-api-key="..."></script>
   ```

2. **Usar modo no-conflict**
   ```javascript
   window.guidersConfig = {
     noConflict: true
   };
   ```

3. **Verificar dependencias**
   ```javascript
   // Verificar que jQuery esté disponible si es necesario
   console.log('jQuery:', typeof $);
   ```

### ❌ "No funciona con SPA (React/Vue/Angular)"

**Síntomas:**
- Solo funciona en página inicial
- No detecta navegación por rutas

**Soluciones:**

1. **Re-inicializar en cambios de ruta**
   ```javascript
   // React
   useEffect(() => {
     window.guiders?.refreshDetection();
   }, [location.pathname]);
   
   // Vue
   watch(() => route.path, () => {
     window.guiders?.refreshDetection();
   });
   
   // Angular
   router.events.subscribe(() => {
     window.guiders?.refreshDetection();
   });
   ```

2. **Usar modo SPA**
   ```javascript
   window.guidersConfig = {
     spa: {
       enabled: true,
       trackRouteChanges: true
     }
   };
   ```

### ❌ "No funciona con WordPress/WooCommerce"

**Síntomas:**
- Plugin instalado pero no trackea
- Conflictos con tema/otros plugins

**Soluciones:**

1. **Usar plugin oficial**
   - Descargar [plugin WordPress](../wordpress-plugin/)
   - No usar integración manual si usas el plugin

2. **Verificar compatibilidad de tema**
   ```php
   // En functions.php, verificar si jQuery está cargado
   wp_enqueue_script('jquery');
   ```

3. **Configurar exclusiones**
   ```php
   // En configuración del plugin
   add_filter('guiders_exclude_pages', function($pages) {
     return array_merge($pages, ['/wp-admin', '/wp-login.php']);
   });
   ```

## 📊 Problemas de Datos

### ❌ "Eventos duplicados"

**Síntomas:**
- Mismo evento se envía múltiples veces
- Analytics inflados

**Soluciones:**

1. **Verificar múltiples inicializaciones**
   ```javascript
   // Solo inicializar una vez
   if (!window.guidersInitialized) {
     window.guidersInitialized = true;
     // Inicializar SDK aquí
   }
   ```

2. **Configurar deduplicación**
   ```javascript
   window.guidersConfig = {
     deduplication: {
       enabled: true,
       window: 1000 // ms
     }
   };
   ```

### ❌ "Faltan datos en eventos"

**Síntomas:**
- Eventos llegan sin metadatos
- Información de usuario incompleta

**Soluciones:**

1. **Configurar datos de usuario**
   ```javascript
   sdk.setUserId('user-123');
   sdk.setUserData({
     email: 'user@example.com',
     plan: 'premium'
   });
   ```

2. **Añadir metadatos automáticos**
   ```javascript
   sdk.setMetadata('*', { // Para todos los eventos
     site_version: '2.1.0',
     environment: 'production'
   });
   ```

## 🔧 Herramientas de Debug

### Debug en Consola

```javascript
// Habilitar debug completo
window.guiders.debug = true;

// Ver configuración actual
console.log('Config:', window.guiders.getConfig());

// Ver estado del SDK
console.log('Status:', {
  initialized: window.guiders.isInitialized(),
  chatEnabled: window.guiders.isChatEnabled(),
  trackingEnabled: window.guiders.isTrackingEnabled()
});

// Ver elementos detectados
window.guiders.getDetectedElements().forEach(el => {
  console.log('Detected:', el.element, 'Event:', el.event, 'Confidence:', el.confidence);
});

// Forzar detección manual
window.guiders.refreshDetection();

// Test de evento manual
window.guiders.track({
  event: 'debug_test',
  data: { timestamp: Date.now() }
});
```

### Debug de Red

1. **Network Tab (F12)**
   - Buscar requests a `guiders.com` o tu endpoint
   - Verificar status codes (200 = OK, 401 = API Key inválida, etc.)

2. **Console Tab**
   - Buscar errores en rojo
   - Habilitar verbose logging

3. **Application Tab**
   - LocalStorage → Verificar tokens guardados
   - SessionStorage → Verificar datos de sesión

### Bookmarklet de Debug

```javascript
// Crear bookmark con este código para debug rápido
javascript:(function(){
  if(window.guiders) {
    window.guiders.debug = true;
    console.log('Guiders Debug Enabled');
    console.log('Config:', window.guiders.getConfig());
    console.log('Status:', window.guiders.getStatus());
  } else {
    alert('Guiders SDK not found');
  }
})();
```

## 📞 Obtener Ayuda

Si ninguna de estas soluciones resuelve tu problema:

1. **📧 Email:** support@guiders.com
2. **💬 Chat:** [support.guiders.com](https://support.guiders.com)
3. **🐛 GitHub Issues:** [Reportar bug](https://github.com/RogerPugaRuiz/guiders-sdk/issues)
4. **📚 Documentación:** [docs.guiders.com](https://docs.guiders.com)

### Información a incluir en tu reporte

- **URL del sitio web**
- **Versión del SDK** (`window.guiders.getVersion()`)
- **Navegador y versión**
- **Mensaje de error completo**
- **Pasos para reproducir**
- **Screenshots/video si es relevante**

---

## 🔍 Problemas Específicos por Plataforma

### WordPress

**Plugin no aparece en admin:**
- Verificar permisos de archivo (755 para carpetas, 644 para archivos)
- Verificar estructura de carpetas correcta

**No trackea WooCommerce:**
```php
// Verificar en functions.php
add_action('wp_footer', function() {
  if (function_exists('is_shop') && is_shop()) {
    echo '<script>console.log("WooCommerce shop detected");</script>';
  }
});
```

### Shopify

**Theme integration:**
```liquid
<!-- En theme.liquid, antes de </body> -->
{% unless request.design_mode %}
<script src="https://cdn.guiders.com/latest/guiders-sdk.js" 
        data-api-key="{{ settings.guiders_api_key }}"></script>
{% endunless %}
```

### Magento

**Module conflict:**
- Deshabilitar otros módulos de tracking temporalmente
- Verificar order de load en `app/etc/modules/`

La mayoría de problemas se resuelven con configuración correcta y debug adecuado. ¡No dudes en contactarnos si necesitas ayuda!