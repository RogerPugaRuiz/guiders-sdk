=== Guiders SDK ===
Contributors: guiders
Tags: analytics, chat, tracking, ecommerce, woocommerce, live-chat, heuristic-detection
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.4
License: ISC
License URI: https://opensource.org/licenses/ISC

Integra el SDK de Guiders para tracking inteligente, chat en vivo y notificaciones en tu sitio WordPress con detección heurística automática.

== Description ==

**Guiders SDK** es un plugin de WordPress que integra el poderoso SDK de Guiders para proporcionar tracking inteligente, chat en vivo y notificaciones en tiempo real en tu sitio web.

### 🎯 Características Principales

#### Detección Heurística Inteligente
- **Sin modificaciones HTML**: Detecta automáticamente elementos como botones "Añadir al carrito", "Contactar", formularios de búsqueda, etc.
- **Compatible con cualquier tema**: Funciona con WordPress, WooCommerce, Shopify y otros CMS sin configuración adicional
- **Detección basada en patrones**: Usa CSS, texto y contexto para identificar elementos relevantes
- **Configuración de confianza**: Umbral ajustable para mayor o menor precisión

#### Chat en Vivo Optimizado
- **Carga diferida**: El chat se inicializa en segundo plano y se muestra solo cuando el usuario lo necesita
- **Sin parpadeo**: Eliminación completa del problema de contenido flash durante la carga
- **Totalmente responsivo**: Funciona perfectamente en dispositivos móviles y desktop

#### Tracking Automático de Eventos
- **Eventos detectados automáticamente**:
  - `add_to_cart` - Botones de añadir al carrito
  - `contact_dealer` - Enlaces y botones de contacto
  - `purchase` - Procesos de compra y checkout
  - `search_submit` - Envío de formularios de búsqueda
  - `view_product` - Visualización de productos
  - `download_brochure` - Descargas de archivos

#### Compatibilidad Total
- ✅ **WooCommerce**: Tracking automático de eventos de ecommerce
- ✅ **Easy Digital Downloads**: Soporte completo para descargas digitales
- ✅ **WP Rocket**: Compatible con plugins de caché y optimización
- ✅ **Constructores de páginas**: Elementor, Divi, Gutenberg, etc.
- ✅ **Temas populares**: Funciona con cualquier tema de WordPress

#### Características Técnicas
- **Detección de bots**: Evita que se inicialice en visitantes que sean bots o crawlers
- **Seguimiento de sesiones**: Tracking avanzado de comportamiento del usuario
- **Optimización de rendimiento**: Carga asíncrona y minimal impact en velocidad
- **Notificaciones en tiempo real**: WebSocket para comunicación instantánea

### 🚀 Fácil Configuración

1. Instala el plugin
2. Ve a **Configuración > Guiders SDK**
3. Ingresa tu API Key de Guiders
4. ¡Activa el plugin y listo!

### 🛠️ Configuración Avanzada

El plugin ofrece múltiples opciones de configuración:

- **Habilitar/Deshabilitar características específicas**
- **Configurar umbrales de confianza** para detección heurística
- **Seleccionar entorno** (producción/desarrollo)
- **Personalizar configuraciones** de chat y tracking

### 🔧 Para Desarrolladores

El plugin sigue las mejores prácticas de WordPress:

- Hooks y filtros estándar de WordPress
- Carga segura de scripts y estilos
- Compatibilidad con caching plugins
- Código limpio y bien documentado

### 📊 Casos de Uso Ideales

- **Tiendas online** - Tracking automático de conversiones sin configurar nada
- **Sitios corporativos** - Chat en vivo y tracking de leads
- **Blogs y medios** - Seguimiento de engagement y retención
- **Servicios profesionales** - Formularios de contacto y seguimiento de clientes

== Installation ==

### Instalación Automática

1. Ve a **Plugins > Añadir nuevo** en tu admin de WordPress
2. Busca "Guiders SDK"
3. Haz clic en "Instalar ahora"
4. Activa el plugin

### Instalación Manual

1. Descarga el archivo del plugin
2. Sube la carpeta `guiders-wp-plugin` a `/wp-content/plugins/`
3. Activa el plugin desde el menú **Plugins** en WordPress

### Configuración Inicial

1. Ve a **Configuración > Guiders SDK**
2. Ingresa tu **API Key** de Guiders (obténla desde tu panel de Guiders)
3. Habilita las características que desees usar
4. Guarda los cambios

### Obtener API Key

1. Regístrate en [Guiders](https://guiders.ancoradual.com)
2. Crea un nuevo proyecto
3. Copia la API Key desde el dashboard
4. Pégala en la configuración del plugin

== Frequently Asked Questions ==

= ¿Necesito una cuenta de Guiders? =

Sí, necesitas registrarte en Guiders para obtener una API Key. El servicio ofrece un plan gratuito para empezar.

= ¿Funciona con WooCommerce? =

¡Absolutamente! El plugin tiene soporte específico para WooCommerce y detecta automáticamente eventos como "añadir al carrito", "checkout", etc.

= ¿Afecta la velocidad de mi sitio? =

No, el plugin está optimizado para carga asíncrona y tiene un impacto mínimo en el rendimiento. Además, incluye detección de bots para evitar cargas innecesarias.

= ¿Funciona con plugins de caché como WP Rocket? =

Sí, el plugin es totalmente compatible con WP Rocket y otros plugins de caché populares.

= ¿Necesito modificar mi tema o HTML? =

¡No! Esa es la principal ventaja de la detección heurística. El plugin detecta automáticamente elementos relevantes sin necesidad de modificar código.

= ¿Puedo personalizar qué eventos se detectan? =

Sí, puedes ajustar el umbral de confianza y habilitar/deshabilitar características específicas desde la configuración del plugin.

= ¿Es compatible con GDPR? =

El plugin respeta las configuraciones de privacidad. Consulta la documentación de Guiders para información específica sobre GDPR.

== Screenshots ==

1. Página de configuración principal del plugin
2. Configuración de características y umbrales
3. Chat en vivo integrado en el frontend
4. Detección automática de elementos en WooCommerce
5. Dashboard de analytics en Guiders

== Changelog ==

= 1.0.4-alpha.6 =
* Cambio endpoints producción a dominio `https://guiders.es` y WebSocket `wss://guiders.es` (elimina mixed-content y dependencia de IP pública).
* Limpieza: retirada de hardcodes IP en SDK y plugin.
* Preparación para release estable 1.0.4 con dominio canonical.
* Documentación: actualizado default `endpoint` en guías PIXEL_EN/ES.

= 1.0.4-alpha.5 =
* Bump de versión preliminar para preparar ajustes sobre auto-inicialización flexible (próximo cambio: permitir que el modo seleccionado controle `preventAutoInit` sin bloquear inicialización cuando no es manual).

= 1.0.4-alpha.4 =
* Nueva API global: `window.initGuiders(force?: boolean)` para inicialización manual o reinicialización forzada (modo manual o debugging avanzado).
* Documentación separada de alpha.3 para aislar la nueva capacidad.

= 1.0.4-alpha.3 =
* Nueva configuración: modos de auto-inicialización (immediate, domready, delayed, manual).
* Añadido delay configurable (0-60000 ms) para modo delayed.
* Siempre se fuerza `preventAutoInit` y el plugin controla el inicio según configuración para evitar dobles instancias.
* Refactor: encapsulado `doInit()` y salvaguarda si `window.guiders` ya existe.
* Mejora DX: facilita pruebas de performance y compatibilidad con plugins de caché.

= 1.0.4-alpha.2 =
* Pre-release: centralización de resolución de endpoints (`core/endpoint-resolver.ts`).
* Mejora: eliminación de hardcodes `localhost:3000` / IP directa en SDK; ahora todos los servicios usan `EndpointManager` / resolver unificado.
* Integración WP: el plugin siempre inyecta `endpoint` / `webSocketEndpoint` y añade `preventAutoInit` para evitar doble inicialización y peticiones duplicadas (localhost → prod).
* Fix: evita primer lote de fetch a localhost en entornos producción.
* Nota: valida ruta hacia 1.0.4 estable con configuración consistente de endpoints y menor ruido en logs.

= 1.0.4-alpha.1 =
* Pre-release: validación de inicialización única del SDK para evitar múltiples health checks a endpoints distintos.
* Fix: normalización de endpoint y eliminación de doble slash en `/health`.
* Mejora: resolución unificada de `endpoint`/`webSocketEndpoint` basada en `GUIDERS_CONFIG.environment` o `NODE_ENV`.
* Interno: guard `__GUIDERS_INITIALIZING__` para prevenir condiciones de carrera con WP Rocket.
* Nota: esta versión es para pruebas internas antes de 1.0.4 estable.

= 1.0.4 =
* Fix: Exposición correcta de configuración global como `window.GUIDERS_CONFIG` (antes `guidersConfig`) para que el SDK detecte `apiKey` sin requerir `data-api-key` en el script.
* Mejora: Fallback retrocompatible a `window.guidersConfig` en inicialización (evita roturas en instalaciones cacheadas).
* Refactor menor: comentarios clarificando por qué se usa `GUIDERS_CONFIG`.
* Preparación: listo para migrar a wss:// cuando TLS esté disponible en la IP pública.

= 1.0.3 =
* Validación extendida de CI también para pre-releases (alpha/beta/rc)
* Sincronización de dependencias: lockfile actualizado (uuid 10.x) para builds reproducibles
* Refactor menor de documentación para reflejar nuevas validaciones
* Preparativo para futuras mejoras de heurística (sin cambios funcionales aún)

= 1.0.2 =
* Ajustes de documentación y scripts de release automatizado
* Nuevo script `release:wp:publish` para empaquetado + tag + push
* Normalización de formato Markdown en README
* Validación CI: el workflow ahora falla si el tag `vX.Y.Z` no coincide con la cabecera `Version:` del plugin, evitando releases desalineados

= 1.0.1 =
* Actualización del SDK a 1.0.1 (index.js)
* Mejora de mantenimiento: sincronización de versión entre SDK y plugin
* Preparativos para futuras optimizaciones de heurística

= 1.0.0 =
* Lanzamiento inicial del plugin
* Integración completa del SDK de Guiders v2.0
* Detección heurística inteligente
* Soporte para WooCommerce y EDD
* Chat en vivo con carga diferida
* Configuración avanzada en admin de WordPress
* Compatibilidad con plugins de caché
* Detección automática de bots
* Seguimiento de sesiones
* Notificaciones en tiempo real

== Upgrade Notice ==

= 1.0.0 =
Primera versión del plugin. Incluye todas las características principales del SDK de Guiders optimizadas para WordPress.

== Additional Info ==

### Soporte Técnico

- **Documentación**: [GitHub Repository](https://github.com/RogerPugaRuiz/guiders-sdk)
- **Issues**: [GitHub Issues](https://github.com/RogerPugaRuiz/guiders-sdk/issues)
- **Sitio oficial**: [Guiders](https://guiders.ancoradual.com)

### Desarrollado por

Este plugin integra el SDK oficial de Guiders desarrollado por el equipo de Guiders.

### Licencia

Este plugin está licenciado bajo la licencia ISC, la misma que el SDK de Guiders.