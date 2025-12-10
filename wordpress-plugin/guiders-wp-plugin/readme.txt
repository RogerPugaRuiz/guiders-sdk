=== Guiders SDK ===
Contributors: guiders
Tags: analytics, chat, tracking, ecommerce, woocommerce, live-chat, heuristic-detection, gdpr, consent-banner, cookies
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 2.10.11
License: ISC
License URI: https://opensource.org/licenses/ISC

Integra el SDK de Guiders para tracking inteligente, chat en vivo y notificaciones en tu sitio WordPress. Incluye banner de consentimiento GDPR integrado sin necesidad de código.

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

= 2.10.11 =
* 🔧 **Fix invalidación de caché**: Renombrado archivo JS de `guiders-sdk.js` a `guiders-sdk.min.js`
  * Algunos CDN/proxies cachean por nombre de archivo ignorando query strings
  * El nuevo nombre fuerza a todos los sistemas a cargar el archivo actualizado
  * Incluye todas las correcciones de v2.10.8 (fix flash offline)
* 🧹 **Limpieza de código**: Eliminados logs de debug del sistema de presencia

= 2.10.10 =
* 🐛 **Fix cache busting con MD5**: Cambiado de `filemtime()` a `md5_file()` para generar hash único
  * El hash se basa en el contenido del archivo, no en el timestamp
  * Versión resultante: `ver=2.10.10.a1b2c3d4` (8 caracteres de hash)
  * Más robusto contra cachés agresivos

= 2.10.9 =
* 🐛 **Fix cache busting agresivo**: Añadido `filemtime()` al versionado del script
  * Algunos CDNs ignoran el parámetro `ver=X.Y.Z`, ahora usa `ver=X.Y.Z.timestamp`
  * El timestamp cambia cada vez que el archivo SDK se actualiza
  * Fuerza que CDNs/caches sirvan la versión correcta del archivo

= 2.10.8 =
* 🐛 **Fix estado inicial de presencia**: Corregido el flash de "offline" cuando el comercial está online
  * Ahora usa el estado `isOnline` del chatDetail como estado inicial en lugar de asumir siempre offline
  * Elimina el banner offline innecesario que aparecía brevemente al abrir el chat
  * WebSocket sigue actualizando si el estado cambia después

= 2.10.7 =
* 🔍 **Debug: Logs de presencia para investigación**: Añadidos logs detallados para diagnosticar el problema de sincronización online/offline en producción
  * Logs con prefijo `🔍 [PRESENCE DEBUG]` en consola del navegador
  * Tracking de: updateChatHeader, updateAvatarStatus, activatePresence, WebSocket eventos, deactivatePresence
  * Esta versión es temporal para investigación - los logs se eliminarán en la próxima versión estable

= 2.10.6 =
* 🐛 **Fix sincronización de estado de presencia**: Corregido bug donde el indicador online/offline mostraba estado incorrecto al reabrir el chat
  * El estado persistido podía estar obsoleto si el comercial cambió de estado mientras el chat estaba cerrado
  * Ahora siempre muestra "offline" inicialmente hasta que API o WebSocket confirmen el estado real
  * Solo persiste estados confirmados por API/WebSocket, no estados temporales de espera
  * Eliminada la dependencia del estado persistido para el renderizado inicial
* 🐛 **Fix doble carga del SDK**: Añadida protección contra carga duplicada del script
  * Nuevo guard `__GUIDERS_SCRIPT_LOADED__` previene que el script se ejecute dos veces
  * Útil cuando hay plugins de caché, optimizadores o configuraciones que duplican scripts
  * Muestra advertencia en consola si se detecta segunda carga

= 2.10.5 =
* 🐛 **Fix definitivo re-apertura ultra-rápida**: Añadida capa de protección adicional a nivel de ChatUI
  * Nuevo sistema de timestamp de cierre manual con bloqueo de 5 segundos
  * Método `canAutoOpen()` verificado antes de cualquier auto-apertura
  * Protección dual: cooldown en UnreadMessagesService (5s) + bloqueo en ChatUI (5s) - **SINCRONIZADOS**
  * Corrige el bug donde el chat aún se reabría con clicks muy rápidos antes de que el SDK terminara de cargar
* 🐛 **Fix estado de presencia al reabrir chat**: El indicador online/offline ahora se mantiene correctamente al cerrar y abrir el chat
  * Uso de estado persistido en sessionStorage al mostrar el header del chat
  * Reset del flag `hasReceivedPresenceEvent` al cerrar para usar estado persistido al reabrir
  * El sistema de presencia confirma el estado real después de activarse
  * **Validación de commercialId**: Solo usa estado persistido si el ID del comercial está disponible, evitando estados inconsistentes durante carga async
* 🐛 **Fix race condition en toggle rápido**: Corregido bug donde clicks rápidos en el botón del chat causaban que el chat no apareciera
  * El setTimeout de la animación de cierre (300ms) podía ejecutarse después de una nueva apertura
  * Ahora se cancela cualquier timeout de cierre pendiente al abrir el chat
  * Múltiples clicks rápidos ya no corrompen el estado de visibilidad

= 2.10.4 =
* 🐛 **Fix timing de cooldown**: El callback de cierre ahora se ejecuta inmediatamente al cerrar el chat, no después de 300ms de animación
  * Esto asegura que el cooldown de anti-auto-apertura se active antes de cualquier inicialización tardía
  * Corrige el bug donde el chat se reabría si se cerraba muy rápido antes de que terminara de cargar

= 2.10.3 =
* 🐛 **Fix re-apertura automática al cerrar chat**: Corregido bug crítico donde el chat se volvía a abrir automáticamente inmediatamente después de cerrarlo
  * El problema ocurría porque al cerrar el chat, se refrescaban los mensajes no leídos y, si había mensajes, se disparaba la auto-apertura
  * Implementado sistema de cooldown de 3 segundos tras cierre manual para bloquear la auto-apertura
  * El cooldown aplica tanto a `refreshUnreadMessages()` como a `handleNewMessage()` del WebSocket

= 2.10.2 =
* 🐛 **Fix estado online incorrecto al reabrir chat**: Corregido bug donde el indicador de presencia mostraba "online" incorrectamente cuando el comercial estaba offline
  * Añadida verificación de consistencia entre `connectionStatus` y contadores de presencia de la API
  * Si la API devuelve `{online: 0, offline: 1}`, el comercial se marca como offline independientemente de otros valores
* 🐛 **Fix múltiples solicitudes de presencia**: Añadido guard para evitar múltiples llamadas `getChatPresence` en vuelo
* 🐛 **Fix race condition en cambio de chat**: Añadida verificación de que el chatId no haya cambiado durante la solicitud async
* 🔧 **Limpieza de estado de presencia**: Reset correcto de `pendingPresenceRequest` al desactivar presencia

= 2.10.1 =
* 🐛 **Fix banner offline al reabrir chat**: Corregido bug donde el banner de "agente desconectado" no reaparecía tras cerrar y abrir el chat
* 🐛 **Fix múltiples instancias de ChatUI**: Solucionado problema donde se creaban 3 instancias del chat, perdiendo la configuración del selector
* 🐛 **Fix botón de retroceso**: El botón de volver ahora aparece correctamente cuando el selector de chats está habilitado
* 🐛 **Fix avatar círculo blanco**: Restaurado correctamente el avatar por defecto cuando la imagen del comercial falla al cargar
* 🔧 **Mejora inicialización WordPress**: `window.TrackingPixelSDK` ahora siempre está disponible para inicialización manual

= 2.10.0 =
* ✨ **Mejora en detección de mensajes IA**: Mejor identificación y estilizado de mensajes del asistente de IA
* 🐛 **Fix de condición de carrera en presencia**: Resuelto problema donde el estado online/offline del comercial se sobrescribía incorrectamente después de recargar la página

= 2.9.0 =
* ✨ **Selector de Conversaciones en Admin**: Nueva sección de configuración para personalizar el selector de chats
  * Habilitar/deshabilitar el selector de conversaciones
  * Personalizar texto y emoji del botón "Nueva conversación"
  * Configurar máximo de chats a mostrar
  * Mensaje personalizado cuando no hay conversaciones
* ✨ **Configuración de IA en Admin**: Sección de ajustes para el asistente de IA
  * Habilitar/deshabilitar funcionalidades de IA
  * Mostrar indicador de IA en mensajes
  * Personalizar emoji y nombre del avatar de IA
  * Configurar indicador de escritura de IA
* 🔧 **Mejoras Técnicas del SDK**:
  * Extracción de EndpointManager para mejor mantenibilidad
  * Consolidación de tipos (ChatDetailV2, ChatParticipant)
  * Utilidades compartidas para componentes de lista de chats
  * Optimizaciones de webpack (tree-shaking, TerserPlugin)

= 2.8.0 =
* **✨ Quick Actions**: Sistema de acciones rápidas configurables al abrir el chat
  * **Configuración en Admin**: Nueva sección "Quick Actions" en el panel de WordPress
  * **Botones Personalizables**: Define botones con emoji, etiqueta y acción (mensaje, solicitar agente, URL, custom)
  * **Mensaje de Bienvenida**: Configura el mensaje que aparece con los botones
  * **Tipos de Acción**: send_message, request_agent, open_url, custom
  * **Integración Backend**: Notifica al comercial cuando se solicita agente humano
* **✨ Soporte Mensajes IA**: Detección y renderizado diferenciado de mensajes de IA
  * **Indicador Visual**: Los mensajes de IA muestran emoji 🤖 y estilo diferenciado
  * **Detección Automática**: Por flag isAI, type=ai, senderId conocido o aiMetadata
  * **Configurable**: Personaliza emoji, nombre del asistente y comportamiento
* **🔧 Validación JavaScript en PHP**: Validación automática de objetos JS en archivos PHP
  * **Pre-commit Hook**: Detecta errores de sintaxis antes de commitear
  * **Prevención de Bugs**: Evita JavaScript malformado en integraciones de cookies
* **🐛 Fix Chat en Tiempo Real**: Corrección crítica de mensajes comercial → visitante
  * **Problema Resuelto**: Mensajes no aparecían sin recargar página
  * **Causa**: Referencia desactualizada de ChatUI en RealtimeMessageManager
  * **Solución**: Método setChatUI() para mantener referencia sincronizada
* **🐛 Fix Autenticación Same-Domain**: Elimina credentials:include
  * **Problema Resuelto**: Error HTTP 400 cuando panel y web están en mismo dominio
  * **Solución**: Autenticación via header X-Guiders-Sid en lugar de cookies include

= 2.7.1 =
* **🐛 Corrección Crítica**: Eliminación completa de console logs en producción
  * **SDK**: Suprimidos todos los logs informativos del SDK en producción
  * **Plugin WordPress**: Eliminados 66 console logs del archivo class-guiders-public.php
  * **Admin Panel**: Removidos console.error del panel de administración
  * **Beneficios**:
    - Consola del navegador completamente limpia en producción
    - Mejor rendimiento (sin overhead de logging)
    - Cumplimiento estricto con mejores prácticas de producción
    - Reducción del tamaño del bundle (417KB vs 429KB anterior)

= 2.7.0 =
* **✨ Sistema de Logging Optimizado**: Control inteligente de logs por entorno
  * **Consola limpia en producción**: Solo logs esenciales (init, warnings, errores)
  * **Debug automático en desarrollo**: Logs completos para debugging sin configuración
  * **Control manual**: Los usuarios pueden activar logs en producción con `window.GUIDERS_DEBUG = true`
  * **Mejoras técnicas**:
    - Detección automática de entorno (production/development) via `__PRODUCTION__` flag
    - Nueva función `debugInit()` para logs de inicialización siempre visibles
    - Refactorización de 100+ console.log a sistema de debug helpers
    - Eliminación de código obsoleto (src/logger.ts)
  * **Beneficios**:
    - Mejor experiencia de usuario: consola del navegador más limpia
    - Debugging más fácil durante desarrollo
    - Menor ruido en herramientas de monitoreo de errores
    - Cumplimiento con mejores prácticas de logging en producción

= 2.6.4 =
* **🔒 GDPR Fix Crítico**: Validación de consentimiento antes de mostrar chat
  * **Problema resuelto**: Chat se mostraba sin validar consentimiento con `dom_ready` o delays pequeños (<1000ms)
  * **Validación en init()**: Bloquea llamadas manuales a `init()` si `status !== 'granted'`
  * **Validación en initializeChatComponents()**: Verifica consentimiento antes de mostrar botón
  * **Escenarios protegidos**:
    - WordPress con Moove GDPR + `auto_init_mode: 'dom_ready'`
    - Delays personalizados menores a 500ms
    - Race condition entre sincronización de cookies y inicialización del SDK
  * **Impacto**: Previene violaciones GDPR cuando gestores de cookies externos no han sincronizado aún

= 2.6.3 =
* **🐛 Bug Fixes Críticos**: Corrección completa del sistema de guardado multi-pestaña en admin
  * **Prioridad de sessionStorage**: Ahora se preservan correctamente los cambios temporales de otras pestañas al guardar
  * **Conversión de booleanos**: Los checkboxes desmarcados ahora se convierten correctamente a '0' en lugar de string "false"
  * **Escenario corregido**: Desmarcar checkbox en pestaña A → cambiar a pestaña B → guardar → el checkbox permanece desmarcado
  * **Impacto**: Resuelto problema donde cambios en checkboxes se perdían al cambiar de pestaña antes de guardar

= 2.6.2 =
* **🐛 Bug Fixes**: Corrección adicional del sistema de guardado en panel de administración
  * Solucionado problema donde "Auto-abrir Chat al Recibir Mensaje" no se guardaba
  * Faltaba validación en validateSettings() para el campo auto_open_chat_on_message
  * Corregido valor por defecto (ahora true, consistente con el SDK)
  * Completada auditoría de todos los campos del admin (47 campos verificados)

= 2.6.1 =
* **🐛 Bug Fixes**: Corrección crítica del sistema de guardado en panel de administración
  * Solucionado problema donde los checkboxes desmarcados no se guardaban correctamente
  * Los valores de otras pestañas ahora se preservan al guardar desde una pestaña específica
  * Implementada validación robusta de checkboxes con función helper $validateCheckbox()
  * JavaScript mejorado para detectar campos de pestaña actual vs otras pestañas
  * Afecta a 20+ checkboxes: enabled, chat_enabled, tracking_v2_bypass_consent, consent_banner_enabled, etc.

= 2.6.0 =
* **🐛 Bug Fixes**:
  * Corregido problema al preservar cambios temporales al cambiar de pestaña en configuración del plugin
  * Revertida lógica de detección de tipo de usuario commercial (simplificado a solo visitantes)
* **🔧 Mejoras Técnicas**:
  * Refactorización del WebSocket Service para eliminar detección de tipo de usuario
  * Eliminado cookie-utils.ts innecesario
  * Simplificados métodos de typing indicators en el SDK

= 2.5.2 =
* **🐛 Bug Fixes**: Corrección crítica del sistema de pestañas en el admin
  * Solucionado problema donde al guardar desde una pestaña se perdían los valores de las otras pestañas
  * Los settings ahora se preservan correctamente entre todas las pestañas (General, Chat, Tracking, Cookies & GDPR)
  * JavaScript inteligente agrega campos hidden antes del submit para incluir todos los valores

= 2.5.1 =
* **🐛 Bug Fixes**: Corrección crítica del panel de administración
  * Solucionado problema que impedía guardar la configuración del plugin
  * Actualizado register_setting() para WordPress 5.0+ (formato correcto con 'sanitize_callback')
  * Los cambios en el admin panel ahora se guardan correctamente en la base de datos

= 2.5.0 =
* **✨ Integración Mejorada con Moove GDPR Cookie Compliance**:
  * **Soporte flexible**: Compatible con configuraciones de 3 y 5 categorías
  * **Lectura directa de cookies**: Lee cookie `moove_gdpr_popup` con decodificación URL automática
  * **Mapeo automático**: Detecta y mapea categorías correctamente (strict, performance, thirdparty, advanced, preference)
  * **Lógica de reintentos**: 20 intentos × 500ms para garantizar sincronización con SDK
  * **Polling de cambios**: Detecta cambios en cookies cada 1000ms
  * **Fallback inteligente**: Usa localStorage si la cookie no está disponible
  * **Logs mejorados**: Mensajes de debugging claros con emojis
  * **Fix**: Chat ahora aparece correctamente después de aceptar cookies en Moove GDPR

* **✨ Panel de Administración Reorganizado con Interfaz Profesional**:
  * **Navegación por pestañas**: 50+ configuraciones organizadas en 4 pestañas lógicas (General, Chat, Tracking, Cookies & GDPR)
  * **Interfaz moderna**: Header con gradiente, iconos dashicons, transiciones suaves
  * **Sidebar contextual**: Ayuda y documentación que cambia según la pestaña activa
  * **Diseño responsive**: Optimizado para dispositivos móviles
  * **Mejor experiencia**: Validación de formularios mejorada, indicadores visuales para campos requeridos
  * **Fix**: Eliminados mensajes confusos sobre detección de plugins de cookies

* **🐛 Corrección de Integración con Beautiful Cookie Banner**:
  * **Sincronización corregida**: Usa método `grantConsentWithPreferences()` en lugar de `updateConsent()`
  * **Ejecución inmediata**: Sincronización ejecutada antes del delay de inicialización del SDK
  * **requireConsent automático**: Se activa automáticamente cuando se detecta gestor externo
  * **Limpieza de localStorage**: Elimina datos antiguos del SDK cuando hay gestor externo
  * **Reintentos automáticos**: Hasta 20 intentos para garantizar sincronización
  * **Fix**: Chat respeta consentimiento del gestor externo correctamente

= 2.5.0-beta.1 =
* **[BETA] ✨ Integración Mejorada con Moove GDPR Cookie Compliance**:
  * **Soporte flexible**: Compatible con configuraciones de 3 y 5 categorías
  * **Lectura directa de cookies**: Lee cookie `moove_gdpr_popup` con decodificación URL automática
  * **Mapeo automático**: Detecta y mapea categorías correctamente (strict, performance, thirdparty, advanced, preference)
  * **Lógica de reintentos**: 20 intentos × 500ms para garantizar sincronización con SDK
  * **Polling de cambios**: Detecta cambios en cookies cada 1000ms
  * **Fallback inteligente**: Usa localStorage si la cookie no está disponible
  * **Logs mejorados**: Mensajes de debugging claros con emojis
  * **Fix**: Chat ahora aparece correctamente después de aceptar cookies en Moove GDPR

* **[BETA] ✨ Panel de Administración Reorganizado con Interfaz Profesional**:
  * **Navegación por pestañas**: 50+ configuraciones organizadas en 4 pestañas lógicas (General, Chat, Tracking, Cookies & GDPR)
  * **Interfaz moderna**: Header con gradiente, iconos dashicons, transiciones suaves
  * **Sidebar contextual**: Ayuda y documentación que cambia según la pestaña activa
  * **Diseño responsive**: Optimizado para dispositivos móviles
  * **Mejor experiencia**: Validación de formularios mejorada, indicadores visuales para campos requeridos
  * **Fix**: Eliminados mensajes confusos sobre detección de plugins de cookies

* **[BETA] 🐛 Corrección de Integración con Beautiful Cookie Banner**:
  * **Sincronización corregida**: Usa método `grantConsentWithPreferences()` en lugar de `updateConsent()`
  * **Ejecución inmediata**: Sincronización ejecutada antes del delay de inicialización del SDK
  * **requireConsent automático**: Se activa automáticamente cuando se detecta gestor externo
  * **Limpieza de localStorage**: Elimina datos antiguos del SDK cuando hay gestor externo
  * **Reintentos automáticos**: Hasta 20 intentos para garantizar sincronización
  * **Fix**: Chat respeta consentimiento del gestor externo correctamente

= 2.5.0-alpha.2 =
[ALPHA] Mejoras en integración con gestores de cookies externos
* **✨ Nuevas Funcionalidades**:
  * **Resumen de gestores de cookies detectados**: Ahora el plugin muestra en consola qué gestores de cookies externos fueron detectados (WP Consent API, Moove GDPR, Beautiful Cookie Banner)
  * **Logs siempre visibles**: Los logs de detección de gestores ahora se muestran sin necesidad de activar el modo debug
* **🐛 Correcciones - Beautiful Cookie Banner**:
  * Corregida integración completa siguiendo la guía oficial de Osano Cookie Consent 3.1.0
  * Corregido nombre de cookie: `cookieconsent_status` (antes usaba `bcb_consent` incorrecto)
  * Corregidos eventos: `beautiful_cookie_consent_updated/initialized` (antes `bcb_consent_changed`)
  * Añadida detección por elementos DOM (`.cc-window`, `.cc-banner`)
  * Mejorado soporte para modo simple (allow/deny/dismiss) y diferenciado (JSON con categorías)
  * **Timing de sincronización**: Las funciones de sincronización ahora se ejecutan ANTES de `init()` para evitar deadlock donde el SDK esperaba consentimiento
  * **Detección temprana**: Los gestores de cookies ahora se detectan incluso antes de que el usuario interactúe con el banner
* **🔧 Mejoras Técnicas - SDK**:
  * **Estandarización de headers HTTP**: Todos los servicios ahora usan `X-Guiders-Sid` de forma consistente mediante helper centralizado
  * Reducción de ~50 líneas de código duplicado en lógica de autenticación
  * Servicios actualizados: `chat-v2-service`, `tracking-v2-service`, `message-pagination-service`, `unread-messages-service`

= 2.5.0-alpha.1 =
[ALPHA] Versión experimental con herramientas de desarrollo
* **✨ Entorno de Desarrollo**: Nuevo entorno WordPress completo con Docker
  * Docker Compose con WordPress, MySQL, phpMyAdmin y WP-CLI
  * Script helper `wp-docker.sh` con más de 20 comandos útiles
  * Documentación completa en `DOCKER_WORDPRESS.md`
  * Puertos configurables para evitar conflictos (8090/8091)
* **🐛 Correcciones**:
  * Endpoint de desarrollo ahora usa `/api` correctamente (http://localhost:3000/api)
  * Soluciona problemas de CORS con el backend en modo desarrollo
* **📚 Documentación**:
  * Clarificación sobre uso de localStorage y requisitos de consentimiento GDPR
  * Actualización de todas las guías con información de almacenamiento local

= 2.4.0 =
* **✨ Nueva Funcionalidad: Integración Automática con Plugins de Cookies sin WP Consent API**:
  * **Soporte para Moove GDPR (GDPR Cookie Compliance)**: Integración automática que lee las preferencias de localStorage y sincroniza en tiempo real
    - Lee automáticamente: `moove_gdpr_popup`, `moove_gdpr_performance`, `moove_gdpr_targeting`
    - Escucha el evento `moove_gdpr_modal_closed` para detectar cambios
    - Mapeo: functional → functional, performance → analytics, targeting/marketing → personalization
  * **Soporte para Beautiful Cookie Banner**: Integración automática con lectura de cookie y localStorage
    - Lee automáticamente: cookie `bcb_consent` o localStorage `bcb_consent`
    - Escucha el evento `bcb_consent_changed` para sincronización en tiempo real
    - Mapeo: necessary/functional → functional, analytics/statistics → analytics, marketing/personalization → personalization
  * **Detección automática de plugins**: El sistema identifica automáticamente qué plugin de cookies está activo y aplica la integración correspondiente
  * **Funcionamiento conjunto con WP Consent API**: Las nuevas integraciones trabajan en paralelo con el sistema WP Consent API existente
* **📚 Documentación Ampliada**:
  * **Nueva sección "Integraciones Automáticas Disponibles"** en `CUSTOM_COOKIE_INTEGRATION.md`
  * **Guías paso a paso** para configurar Moove GDPR y Beautiful Cookie Banner
  * **Ejemplos de logs de consola** para verificar la sincronización correcta
  * **Instrucciones de verificación** con comandos JavaScript para debugging
* **🔧 Mejoras Técnicas**:
  * Detección de plugins mejorada en el panel de administración
  * Scripts de sincronización ejecutados en orden de prioridad (WP Consent API → Moove GDPR → Beautiful Cookie Banner)
  * Logs de debug detallados para troubleshooting de integraciones

= 2.2.1 =
* **🐛 Bug Fixes**: Corrección en detección de plugins de cookies
  * Corregida la detección de "Beautiful and Responsive Cookie Consent" - ahora se identifica correctamente como plugin incompatible con WP Consent API
  * El panel de administración ahora muestra el mensaje apropiado con enlace a la documentación de integración personalizada

= 2.2.0 =
* **✨ Nueva Funcionalidad: Panel de Administración de Cookies**:
  * **Sección completa "🍪 Gestión de Consentimiento de Cookies"** en el panel de administración
  * **Detección automática de plugins de cookies**: Identifica Beautiful Cookie Consent, CookieFirst, CookieYes, Complianz, Cookiebot y otros instalados
  * **4 sistemas de cookies configurables**:
    - Automático (recomendado): Detecta y usa WP Consent API si está disponible
    - Sistema interno: Usa el banner de consentimiento propio de Guiders
    - WP Consent API (forzado): Siempre usa WP Consent API
    - Sistema personalizado: Permite integración manual con código custom
  * **Control de sincronización WP Consent API**: Toggle para activar/desactivar la sincronización automática
  * **Logs de debug configurables**: Opción para mostrar/ocultar logs de sincronización en consola del navegador (útil para testing)
  * **Indicadores visuales inteligentes**:
    - ✅ Plugin compatible detectado (con WP Consent API)
    - ⚠️ Plugin sin WP Consent API (con enlace a guía de integración)
    - ℹ️ Sin plugin detectado
  * **Mapeo de categorías visible**: Muestra cómo se mapean las categorías (functional → functional, statistics → analytics, marketing → personalization)
  * **Enlaces directos a documentación**: Botones a guías de WP Consent API y sistemas personalizados
* **🔧 Mejoras Técnicas**:
  * Lógica de sincronización actualizada para respetar configuración del admin
  * Logs solo se muestran si debug está activado
  * Sincronización se salta automáticamente si sistema es 'internal' o 'custom'
  * Detección automática con fallback inteligente

= 2.1.0 =
* **✨ Nueva Funcionalidad: Integración con WP Consent API**:
  * **Sincronización automática con plugins de cookies**: Guiders ahora se sincroniza automáticamente con plugins de gestión de cookies compatibles con WP Consent API
  * **Compatible con "Beautiful and responsive cookie consent"** y otros plugins populares: CookieFirst, CookieYes, Complianz, Cookiebot
  * **Sincronización bidireccional en tiempo real**: Los cambios en las preferencias de cookies se reflejan inmediatamente en Guiders
  * **Mapeo automático de categorías**: functional → functional, statistics → analytics, marketing → personalization
  * **Detección automática**: Si no hay WP Consent API disponible, usa el sistema interno de Guiders como fallback
  * **Logs detallados**: Mensajes en consola para debugging y verificación de sincronización
* **📚 Documentación**:
  * **Guía completa de integración con WP Consent API**: Instrucciones paso a paso para configurar la sincronización (`WP_CONSENT_API_INTEGRATION.md`)
  * **Guía de integración con sistemas personalizados**: Ejemplos de código para Osano, OneTrust, Cookiebot y sistemas custom (`CUSTOM_COOKIE_INTEGRATION.md`)
  * **Tests de verificación**: Cómo comprobar que la sincronización funciona correctamente

= 2.0.10 =
* **🐛 Bug Fixes**:
  * **Re-autenticación automática en paginación de mensajes**: Soluciona errores 500 al cargar mensajes del chat después de suspender el portátil o cerrar la laptop. El sistema ahora detecta automáticamente cuando la sesión ha expirado y se re-autentica antes de cargar los mensajes
  * Agrega método `fetchWithReauth()` que detecta errores 401 y reintenta la petición después de renovar la sesión
  * Actualiza `loadInitialMessages()` y `loadOlderMessages()` para usar el nuevo sistema de re-autenticación automática

= 2.0.9 =
* **🐛 Corrección visual del chat**:
  * El avatar y estado de conexión ahora se ocultan cuando no hay comercial asignado
  * Evita mostrar avatar vacío al abrir el chat

= 2.0.8 =
* **🐛 Corrección de sesión expirada**:
  * Re-autenticación automática en PresenceService cuando la sesión expira (error 401)
  * Soluciona errores al volver a la página después de un tiempo de inactividad

= 2.0.7 =
* **🔧 Optimización del sistema de presencia**:
  * Centralización de emisión de actividad en WebSocketService
  * Eliminación de listeners duplicados para mejor rendimiento
  * Corrección de identificación cuando la página carga en segundo plano
  * Limpieza de memoria en listeners de visibilidad
  * Reducción del tamaño del bundle (~5 KiB)

= 2.0.6 =
* **🐛 Mejora en reconexión WebSocket**:
  * Sistema de backoff exponencial para reintentos de conexión
  * Mayor estabilidad en conexiones intermitentes
  * Previene saturación del servidor con intentos rápidos

= 2.0.5 =
* **🔧 Mejoras de Rendimiento y Estabilidad**:
  * Simplificación de la gestión de sesiones - siempre sincroniza con backend
  * Mejora en reconexión WebSocket al volver a la pestaña
  * Reemplazo de heartbeat HTTP por eventos WebSocket user:activity
  * Limpieza de código obsoleto en PresenceService
  * Retry automático con re-autenticación en ConsentBackendService

= 2.0.4 =
* 🐛 **Corrección de reconexión automática de sesión**: Soluciona el problema donde las peticiones fallaban con error 401 después de estar desconectado por un tiempo prolongado
  * Reconexión automática al volver a la pestaña (visibility handler)
  * Keepalive de sesión cada 4 minutos para prevenir timeout
  * Retry automático en peticiones con error 401
  * Corrección de URLs de endpoints (identify, heartbeat)

= 2.0.3 =
* 🐛 **Corrección de desconexión en refresh rápido**: Soluciona el problema donde el visitante aparecía como desconectado para el comercial cuando se refrescaba la página rápidamente
  * Detección de refresh usando Navigation API y timestamps
  * Período de gracia de 3 segundos para evitar desconexiones falsas
  * Mantiene el estado del chat durante refreshes rápidos

= 2.0.2 =
* **🐛 Correcciones**:
  * **Auto-apertura de chat para chats nuevos**: El chat ahora se abre automáticamente cuando un comercial inicia una conversación completamente nueva, no solo para mensajes en chats existentes
  * **Información del comercial visible**: El visitante ahora puede ver el nombre, avatar y estado de conexión del comercial desde el primer mensaje
  * **Obtención robusta de datos**: Usa GET /api/v2/chats/visitor/{id} en lugar de GET /api/v2/chats/{id} que fallaba con error 500 para chats nuevos
  * **Conversión de fechas corregida**: Solucionado error "toISOString is not a function" al convertir fechas de la API
* **🔧 Mejoras técnicas**:
  * Nuevo método refreshChatDetailsFromVisitorList() para obtener datos del comercial
  * Propiedad visitorId almacenada en ChatUI para uso en métodos
  * Fallback automático al método tradicional si falla la obtención desde lista
  * Debug logging habilitado en UnreadMessagesService

= 2.0.1 =
* **🐛 Correcciones**:
  * **Auto-apertura de chat mejorada**: El chat ahora se abre automáticamente cuando un comercial inicia una conversación nueva, incluso si es el primer mensaje
  * **Mensajes previos**: Si hay mensajes no leídos al cargar la página (y autoOpenChatOnMessage está habilitado), el chat se abre automáticamente
  * **Identificación del comercial**: Mejora en la visualización del nombre y avatar del comercial en el header del chat
  * **Asignación de chatId**: Asignación automática de chatId cuando el comercial inicia un chat nuevo
* **🔧 Mejoras técnicas**:
  * Logs de debug habilitados en UnreadMessagesService para facilitar troubleshooting
  * Callback actualizado para recibir chatId dinámicamente
  * Simplificación de lógica de auto-apertura en handleNewMessage()

= 2.0.0 =
* **💥 CAMBIO IMPORTANTE - Breaking Change**
  * **Eliminación de Mensajes de Bienvenida**: Se ha eliminado completamente la funcionalidad de mensajes de bienvenida del chat tanto del SDK como del plugin
  * Esta versión no es compatible con configuraciones anteriores que usaban mensajes de bienvenida personalizados
  * **NOTA**: Los mensajes de consentimiento del chat (GDPR) siguen funcionando normalmente

* **✨ Simplificación del Plugin**
  * Eliminada la sección "Mensajes de Bienvenida del Chat" del panel de administración
  * Interfaz más limpia y enfocada en funcionalidades esenciales
  * Reducción del tamaño del código (593 líneas eliminadas)

* **🐛 Correcciones**
  * **Configuración de Mensajes de Consentimiento**: Corregidos problemas con URLs de política de privacidad y cookies
  * Las URLs ahora se guardan correctamente entre sesiones
  * Eliminados valores por defecto inválidos ('/privacy-policy', '/cookies-policy')
  * Agregados ejemplos válidos en los placeholders de los campos
  * Sanitización mejorada usando esc_url_raw() para seguridad

* **🔧 Mejoras Técnicas**
  * SDK reconstruido con optimizaciones (419 KB)
  * Métodos internos renombrados para mayor claridad (checkAndAddInitialMessages)
  * Validación mejorada de campos en el panel de administración

= 1.7.0 =
* **⚡ Optimización de Rendimiento - Throttling Inteligente**: Sistema mejorado para reducir peticiones al servidor
  * **Throttling Diferenciado**: Eventos de baja frecuencia (clicks, teclas) con throttle de 10s
  * **Control de Alta Frecuencia**: Eventos de scroll/mousemove con throttle de 30s para evitar saturación
  * **Reducción de Peticiones**: Disminución drástica de 100+ peticiones/min a solo 6-8 peticiones/min
  * **Configuración Flexible**: Nuevos parámetros `userInteractionThrottle` y `highFrequencyThrottle`
  * **Flag de Throttling**: Previene ejecuciones redundantes durante períodos de throttle activo
* **👤 Avatar de Comerciales en Chat**: Visualización de fotos de perfil de comerciales asignados
  * **Integración con API v2**: Usa el campo `avatarUrl` del endpoint `/api/v2/chats/visitor/{id}`
  * **Fallback Automático**: Si la imagen falla, muestra ícono SVG por defecto
  * **Estilo Profesional**: Avatares circulares de 44x44px con `object-fit: cover`
  * **Sin Duplicación**: Sistema mejorado que evita superposición de imagen y fondo
* **🔔 Auto-apertura de Chat**: Nueva funcionalidad para mejorar engagement
  * **Apertura Automática**: Chat se abre automáticamente al recibir mensaje de comercial
  * **Configurable**: Habilitado por defecto, se puede desactivar desde configuración
  * **Sincronización con Backend**: Nuevo endpoint `/open` para estado consistente
* **✍️ Detección Automática de Actividad**: Sistema inteligente para gestión de presencia
  * **Listeners Optimizados**: Detecta clicks, teclas, toques, scroll y cambios de pestaña
  * **Throttling Incorporado**: 10s para eventos normales, 30s para alta frecuencia
  * **Reactivación Inteligente**: Usuario vuelve a estado "online" al interactuar
  * **Gestión de Visibilidad**: Heartbeat inmediato al volver a la pestaña
* **📬 Marcado Automático de Mensajes Leídos**: Mejora en experiencia de usuario
  * **Auto-mark as Read**: Mensajes se marcan como leídos automáticamente al abrir chat
  * **Sincronización**: Sistema coordinado entre badge, chat UI y backend
  * **Sin Intervención Manual**: No requiere acción del usuario
* **🐛 Correcciones Importantes**:
  * **Endpoints Opcionales**: `/open` y `/close` ahora son opcionales y no bloqueantes
  * **Notificaciones**: Sistema de pausa/resume para badge cuando chat está cerrado
  * **WebSocket Persistente**: Conexión se mantiene activa incluso con chat cerrado
  * **Ancho de Mensajes**: Corregido a 70% para mensajes de usuario
  * **Servicio de No Leídos**: Fix al reabrir chat con conexión WebSocket existente
* **📚 Documentación**:
  * Guías completas del sistema de presencia y endpoints opcionales
  * Documentación de throttling y detección de actividad
* **📦 Bundle Size**: ~427 KB (incremento por nuevas funcionalidades)
* **🔗 Compatibilidad**: 100% retrocompatible, todas las nuevas features son opcionales

= 1.6.0 =
* **✨ Sistema Completo de Presencia en Tiempo Real**: Indicadores avanzados de estado y actividad de usuarios
  * **Presence System**: Sistema completo para mostrar estado online/offline de visitantes y comerciales
  * **Typing Indicators**: Indicadores de escritura en tiempo real con debounce inteligente
  * **Smart Debounce**: Detección automática cuando el visitante está escribiendo sin saturar el servidor
  * **Real-time Updates**: Actualización instantánea del estado de presencia vía WebSocket
  * **WordPress Integration**: Nueva sección de configuración en admin para activar/desactivar indicadores de presencia
  * **Visual Feedback**: Indicadores visuales de "escribiendo..." tanto para visitantes como comerciales
  * Implementación completa: `presence-service.ts`, integración en `ChatUI` y `SDK core`
* **🚀 Tracking V2 con Event Aggregation**: Sistema optimizado de tracking con batching inteligente
  * **EventThrottler**: Control de frecuencia de eventos para reducir carga del servidor
  * **EventAggregator**: Agregación y batching de eventos antes de envío
  * **Event Transformation**: Pipeline para transformar eventos antes de persistir
  * **UUID Validation**: Validación automática de UUIDs, filtrado de eventos inválidos en queue
  * **Callback Preservation**: Fix para preservar callback `onFlush` en configuración de EventAggregator
  * **Demo Interactivo**: Guías completas de Tracking V2 con ejemplos prácticos
  * Configurado por defecto en demo: requiere opt-in para activar en producción
* **💬 Mensaje de Consentimiento en Chat**: Nueva funcionalidad estilo Zara para mejor UX
  * Mensaje informativo sobre consentimiento integrado directamente en el chat
  * Permite a usuarios gestionar preferencias sin salir del flujo de conversación
  * Diseño no intrusivo y profesional
* **🐛 Correcciones Críticas**:
  * **Date Separators**: Separadores de fecha ahora usan timestamp real (`createdAt`) de mensajes
  * **Identity Version**: Uso de versión actual del SDK para consentimiento en lugar de versión cacheada
  * **Badge Notifications**: Fix para prevenir badge visible cuando botón de chat está oculto
  * **Demo Configuration**: Actualización de configuración de presencia y rebuild de bundle SDK
* **📚 Documentación Mejorada**:
  * Guías completas de Tracking V2 con arquitectura y ejemplos de uso
  * Demo interactivo para testing de nuevas funcionalidades
  * Documentación de sistema de presencia y configuración
* **📦 Bundle Size**: ~355 KB (incremento por nuevas funcionalidades de presencia y tracking)
* **🔗 Compatibilidad**: 100% retrocompatible, nuevas features son opcionales

= 1.5.2 =
* **🐛 Fix Crítico**: Badge de notificaciones ahora se oculta correctamente junto con el botón de chat
  * Problema: Cuando el chat se ocultaba por falta de comerciales disponibles, el badge quedaba flotando solo
  * Solución: Métodos `hide()` y `show()` ahora sincronizan la visibilidad del badge con el botón
  * Mejora UX: El badge se restaura automáticamente si hay mensajes no leídos al mostrar el botón
* **🔍 Mejoras de Debugging**: Logs más visibles para diagnosticar problemas de disponibilidad de comerciales
  * `CommercialAvailabilityService`: Logs ahora usan `console.log()` directo cuando `debug: true`
  * `TrackingPixelSDK`: Nuevos logs de diagnóstico para verificar configuración de `commercialAvailability`
  * Facilita troubleshooting del sistema de ocultar/mostrar chat según disponibilidad
* **📦 Bundle**: 355 KB (sin cambios)
* **🔗 Compatibilidad**: 100% retrocompatible, solo bug fixes

= 1.5.1 =
* **🔧 Mejoras en Sistema de Detección de Dispositivos Móviles**: Sistema de detección ahora es completamente configurable
  * Nueva configuración `mobileDetection` con parámetros opcionales
  * Breakpoint configurable (640/768/992/1024px) - default: 768px
  * Modos de detección seleccionables: 'auto', 'size-only', 'touch-only', 'user-agent-only'
  * Métodos mejorados: Media queries, detección táctil (pointer: coarse), orientación, user agent
  * Nueva función `detectMobileDevice()` retorna detalles completos de detección
  * Debug logging opcional para diagnosticar detección en tiempo real
  * Integración en WordPress: nuevos campos en panel de administración
  * Validación y configuración automática desde admin de WordPress
* **🔍 Mejoras Técnicas**:
  * Nueva interfaz TypeScript: `MobileDetectionConfig`, `MobileDetectionResult`
  * Resultado estructurado con `isMobile`, `detectedBy`, `breakpoint`, `viewport`
  * Retrocompatibilidad completa: función `isMobileDevice()` preservada
  * Comportamiento por defecto sin cambios (breakpoint 768px, modo 'auto')
* **📦 Bundle**: 347 KB (sin cambios)
* **🔗 Compatibilidad**: 100% retrocompatible, todas las mejoras son opt-in

= 1.5.0 =
* **✨ Nueva Funcionalidad: Display de Nombre de Comercial**: El chat ahora muestra el nombre real del comercial asignado en lugar del ID genérico
  * Integración con campo `assignedCommercial` del backend (incluye id y name)
  * Mejora UX: Los usuarios ven nombres legibles como "Test User 1" en lugar de IDs UUID
  * Fallback automático: Si no hay nombre disponible, se muestra "Comercial {id}"
  * Actualizado `ChatMetadataV2` interface con campo `assignedCommercial?: AssignedCommercial`
  * Cambios aplicados en servicios de chat detail y SDK core
* **🎨 Sistema Completo de Posicionamiento Configurable**: Control total sobre la posición del chat widget
  * Nueva sección en Admin de WordPress: "Posición del Widget de Chat"
  * **Tabs Desktop/Mobile**: Configuraciones separadas para escritorio y dispositivos móviles
  * **Modo Basic**: 4 presets visuales (bottom-right, bottom-left, top-right, top-left) con cards clicables
  * **Modo Advanced**: Control pixel-perfect con inputs para coordenadas exactas (top, bottom, left, right)
  * **Auto-calculate Widget Position**: Checkbox para calcular automáticamente la posición del widget respecto al botón
  * **Preview en Tiempo Real**: Visualización instantánea de cambios en el panel de administración
  * **Detección de Dispositivo**: El SDK detecta automáticamente si es móvil o desktop y aplica la configuración correcta
  * **Device-Specific Config**: Soporte para configuraciones diferentes por dispositivo (`default` + `mobile`)
  * Nuevas interfaces TypeScript: `ChatPositionConfig`, `ChatPositionPreset`, `ChatPositionCoordinates`, `DeviceSpecificPosition`
  * Nueva utilidad `position-resolver.ts` con lógica de resolución de coordenadas y detección de dispositivo
  * Actualizado `ChatUI` y `ChatToggleButton` para posicionamiento dinámico con Shadow DOM
  * Almacenamiento en JSON con validación y transformadores en WordPress
  * Totalmente opcional: si no se configura, usa el posicionamiento por defecto (bottom-right)
* **🔧 Mejoras Técnicas**:
  * Pattern de transformación de datos en dos capas (WordPress format ↔ SDK format)
  * Configuración opcional con fallback gracioso (no rompe si falta configuración)
  * CSS dinámico generado en tiempo real basado en resolución de coordenadas
  * Media queries y user agent detection para mobile
  * Sistema de offsets automáticos entre botón y widget (70px default)
* **📦 Bundle Size**: 347 KB (incremento mínimo por nueva funcionalidad)
* **🔗 Compatibilidad**: 100% retrocompatible, todas las features son opcionales

= 1.4.4 =
* **🐛 Fix Crítico**: Resueltos errores de inicialización del SDK en producción (50% de fallos)
  * **Error #1 - trackEvent() no definido**: Agregado método `trackEvent()` como wrapper de `track()` para compatibilidad con WordPress plugin
  * El plugin llamaba a `window.guiders.trackEvent()` pero el SDK solo exponía `track()` → TypeError
  * Solución: Método `trackEvent(eventType, data)` que delega a `track({ event: eventType, ...data })`
  * Deprecation warning agregado para migración futura
  * **Error #2 - Race conditions en identify()**: Múltiples llamadas paralelas causaban "Operation was superseded"
  * Problema: AsyncSignal lanzaba error cuando operaciones eran canceladas por versiones más recientes
  * Solución: Cambio de comportamiento para retornar resultado parcial sin lanzar error
  * Agregado sistema de IDs de promesa (`promiseId`) para rastreo de operaciones
  * **Error #3 - Múltiples ejecuciones de identify()**: Prevenida duplicación de llamadas en misma sesión
  * Agregado flag `identifyExecuted` para prevenir race conditions en setupTabOpenListener
  * Flag se marca ANTES de la llamada async para prevenir window races
  * Flag se resetea solo en errores reales, NO en operaciones canceladas
* **✨ Mejoras en Manejo de Errores**: Mensajes más descriptivos y manejo graceful
  * AsyncSignal ahora diferencia entre errores reales y operaciones superseded
  * Logs mejorados con IDs de operación para debugging
  * Recovery automático: flag se resetea en errores para permitir reintentos
* **📦 Bundle**: 341 KB (sin cambios)
* **🔗 Compatibilidad**: 100% retrocompatible, solo bugfixes internos

= 1.4.3 =
* **🐛 Fix Crítico GDPR**: Rechazo de consentimiento ahora se registra correctamente en el backend
  * Problema: Cuando el usuario pulsaba "Rechazar" en el banner, el rechazo NO se enviaba al backend
  * Causa raíz: `denyConsent()` llamaba a `init()`, pero `init()` asume consentimiento `granted` y no registra rechazos
  * `init()` escribe en localStorage, inicializa UI completa, etc. - inapropiado para rechazos
  * **Fix aplicado**: `denyConsent()` ahora llama DIRECTAMENTE a `identitySignal.identify()` sin pasar por `init()`
  * `identify()` lee el estado `denied` del ConsentManager desde localStorage
  * Envía `hasAcceptedPrivacyPolicy: false` al backend para compliance GDPR
  * Backend registra el rechazo explícito en el audit trail (HTTP 400 esperado)
  * Mejora crítica: Ahora el backend tiene registro completo de todos los rechazos de consentimiento
* **📝 Mejora de Documentación**: Actualizado método `init()` con comentarios claros
  * Clarifica que `init()` solo debe usarse con consentimiento `granted`
  * Documenta uso de `identitySignal.identify()` para registrar rechazos
  * Previene confusión futura sobre cuándo usar cada método
* **🧪 Herramientas de Prueba**: Archivo de demo `demo/test-consent-denial.html`
  * Demo interactiva para probar flujo completo de rechazo
  * Consola visual para ver eventos en tiempo real
  * Instrucciones paso a paso para verificar peticiones de red
  * Permite validar compliance GDPR sin backend de producción
* **🔗 Sin Cambios en API**: Actualización 100% retrocompatible, solo fix interno

= 1.4.2 =
* **🐛 Fix Crítico WordPress**: Configuración del banner de consentimiento corregida
  * Problema: El checkbox "Habilitar Banner de Consentimiento" mostraba "enabled" en UI pero el banner nunca aparecía
  * Causa raíz: `consent_banner_enabled` tenía default `true` mientras `require_consent` tenía default `false`
  * SDK requiere AMBOS flags activos para mostrar el banner (`requireConsent: true` Y `consentBanner.enabled: true`)
  * **Fix aplicado**: Método `getConsentBannerConfig()` ahora computa `$effectiveEnabled = $requireConsent && $bannerEnabled`
  * Añadidas validaciones múltiples para prevenir confusión del usuario:
    - Advertencia inline en sección GDPR explicando comportamiento por defecto
    - Warning visual cuando banner está activo pero requireConsent desactivado
    - Validación al guardar configuración con mensaje de advertencia
    - JavaScript en tiempo real para feedback inmediato en el admin
  * Cambio de default: `consent_banner_enabled` ahora es `false` por defecto (consistente con `require_consent: false`)
  * Mejora UX: Usuarios ahora entienden claramente que necesitan activar ambas opciones
  * Documentación mejorada: Descripciones de campos actualizadas con advertencias explícitas
* **📚 Mejora de Documentación**: Clarificación del comportamiento GDPR opcional
  * README.md actualizado con tabla de configuración por defecto
  * WORDPRESS_GDPR_GUIDE.md con nueva sección "¿Cuándo necesitas esta guía?"
  * FAQ extendido con 8 preguntas comunes sobre GDPR
* **🔗 Sin Cambios en API**: Actualización 100% retrocompatible, solo fixes de configuración

= 1.4.1 =
* **🔧 Sincronización Automática de Versión**: La versión de consentimiento ahora se sincroniza automáticamente desde package.json
  * Implementado webpack DefinePlugin para inyectar `__SDK_VERSION__` en tiempo de build
  * Eliminada versión hardcodeada en `ConsentManager` (era 1.2.2-alpha.1, ahora auto-actualiza)
  * Mejora en audit trail GDPR: versión de consentimiento siempre coincide con versión del SDK
* **🐛 Fix Crítico GDPR**: Registro de rechazos de consentimiento en el backend
  * Corregido bug donde el método `denyConsent()` no registraba el rechazo en el backend
  * Ahora ambos flujos (aceptar/rechazar) llaman a `identify()` para registrar la decisión del usuario
  * Asegura compliance GDPR completo con audit trail de todos los rechazos explícitos
  * Backend recibe `hasAcceptedPrivacyPolicy: false` y responde con HTTP 400 + `consentStatus: "denied"`
* **📝 Mejora de Compliance**: Documentación actualizada sobre flujo de consentimiento
* **🔍 Sin Cambios en API**: Actualización 100% retrocompatible

= 1.4.0 =
* **🎨 Rediseño Visual del Chat**: Interfaz minimalista y moderna
  * Header con fondo azul sólido (#0084ff) y texto blanco para mejor legibilidad
  * Bordes reducidos de 20px a 8px para aspecto más limpio y profesional
  * Mensajes del usuario con fondo azul claro (#D1E7FF) y texto oscuro
  * Mensajes del agente con fondo blanco y texto oscuro
  * Ambos tipos de mensajes con estilo consistente y máximo 70% de ancho
  * Hora del mensaje mostrada inline a la derecha del texto
  * Border-radius de 2px en esquinas características para mejor definición
* **✨ Simplificación de la Interfaz**:
  * Eliminado footer "Equipo de atención al cliente" para más espacio
  * Eliminado botón de adjuntar archivos (temporalmente)
  * Input area unificada con gradiente del área de mensajes
  * Nuevo ícono de botón enviar con diseño mejorado
* **📦 Bundle Size**: ~340 KB (sin cambios significativos)
* **🔗 Compatibilidad**: Sin cambios en API, actualización visual solamente

= 1.3.0 =
* **📬 Sistema de Notificaciones de Mensajes No Leídos**: Badge en tiempo real en el botón de chat
  * Nuevo servicio `UnreadMessagesService` para gestión de mensajes no leídos
  * Badge numérico visible en el ChatToggleButton con contador actualizado en tiempo real
  * Integración completa con API v2 (`/v2/messages/chat/{id}/unread`, `/v2/messages/mark-as-read`)
  * Actualización automática vía WebSocket cuando llega un mensaje nuevo
  * Auto-limpieza del badge al abrir el chat (marca mensajes como leídos después de 1 segundo)
  * Filtrado inteligente: ignora mensajes propios del visitante
  * Persistencia entre sesiones: badge visible tras refresh si hay mensajes no leídos
* **🚀 Salas de Visitante en WebSocket**: Notificaciones proactivas para visitantes
  * Métodos `joinVisitorRoom()` y `leaveVisitorRoom()` en `WebSocketService`
  * Reconexión automática a sala de visitante tras desconexión
  * Evento `chat:created` para chats creados proactivamente por comerciales
  * Nuevos tipos TypeScript: `JoinVisitorRoomPayload`, `ChatCreatedEvent`, `ChatPriority`
* **🧪 Tests E2E Completos**: Suite de Playwright para validar badge
  * Tests de badge visible antes/después de refresh
  * Tests de actualización en tiempo real cuando llega mensaje
  * Tests de limpieza del badge al abrir chat
  * Screenshots automáticos para validación visual
* **⚙️ Mejoras Técnicas**:
  * Callback system para propagación de contador de mensajes no leídos
  * Método `updateCallbacks()` mejorado en WebSocketService con merge inteligente
  * Sistema de autenticación dual (session + JWT) en UnreadMessagesService
  * Logs de debug configurables para troubleshooting
* **🎯 Casos de Uso**:
  * Visitantes ven cuántos mensajes nuevos tienen sin abrir el chat
  * Comerciales pueden crear chats proactivamente y el visitante lo sabe
  * Badge persiste entre sesiones para no perder notificaciones
  * Experiencia UX similar a WhatsApp/Telegram con contador visible
* **📦 Bundle Size**: ~340 KB (incremento de 10 KB por nueva funcionalidad)
* **🔗 Integración**: Sin cambios en API pública, funciona automáticamente

= 1.2.3-beta.1 =
* **🎉 Primera versión Beta**: Promoción desde alpha.4 tras pruebas exitosas
* **✅ Probado y Estable**: Todas las funcionalidades validadas en entornos reales
* **🚀 Listo para Staging**: Recomendado para entornos de staging antes de producción
* **Incluye todas las características de 1.2.3-alpha.4**:
  * Banner de consentimiento GDPR integrado
  * Opción requireConsent con control total de comportamiento GDPR
  * SDK se inicializa sin barreras por defecto (requireConsent: false)
  * Eliminación completa del placeholder que tapaba el banner
  * Placeholder del chat simplificado
* **📦 Bundle optimizado**: 330 KB (reducción desde 335 KB)
* **⚙️ Configuración flexible**: Activar GDPR solo cuando se necesite
* **🌍 Universal**: Funciona para sitios dentro y fuera de la UE

= 1.2.3-alpha.4 =
* **⚙️ Nueva Opción: Requerir Consentimiento (requireConsent)**: Control total sobre el comportamiento GDPR
  * Nuevo campo en la sección GDPR del panel de administración
  * **Desactivado (por defecto)**: El SDK se inicializa inmediatamente sin esperar consentimiento
  * **Activado**: El SDK espera consentimiento antes de inicializar (cumplimiento GDPR)
  * Útil para sitios fuera de la UE o que usan otros sistemas de consentimiento
  * Se pasa automáticamente desde WordPress al SDK como `requireConsent: true/false`
  * El banner de consentimiento solo se muestra si requireConsent está activado
* **🔧 Mejoras en la API del SDK**: Nueva opción pública `requireConsent` en SDKOptions
  * Más fácil de entender que `consent.waitForConsent`
  * Controla el comportamiento global del consentimiento de forma clara
  * Si `requireConsent: false`, el SDK actúa como si el consentimiento estuviera siempre granted
  * Documentación inline mejorada para desarrolladores
* **📝 Mejoras en la UX del Admin**: Campo con descripción detallada
  * Explicación clara de cuándo activar/desactivar el requisito de consentimiento
  * Recomendaciones específicas para sitios en la UE vs fuera de la UE
  * Checkbox intuitivo con íconos visuales (✅ Activado / ❌ Desactivado)

= 1.2.3-alpha.3 =
* **🗑️ Eliminación Completa del ConsentPlaceholder**: Removido componente que tapaba el banner
  * Eliminado archivo `consent-placeholder.ts` y todas sus referencias
  * El banner de consentimiento ahora se muestra sin obstrucciones
  * Removidas 4 referencias en `tracking-pixel-SDK.ts`
  * Eliminada exportación en `presentation/index.ts`
  * Simplificación de la lógica de inicialización del SDK
* **📉 Bundle Size Optimizado**: Reducción de tamaño del SDK
  * De 335 KB → 330 KB (reducción de ~5 KB)
  * Código más limpio sin componente innecesario
  * Mejor rendimiento de carga
* **✨ Mejor UX**: Sin elementos que interfieran con el banner GDPR
  * Banner de consentimiento visible sin bloqueos
  * Experiencia de usuario más directa
  * Sin elementos redundantes en la interfaz

= 1.2.3-alpha.2 =
* **🎨 Placeholder del Chat Simplificado**: Removido mensaje innecesario del placeholder
  * Eliminado texto "Chat disponible" y "Acepta cookies para chatear con nosotros"
  * Ahora solo muestra el ícono y el botón "Gestionar cookies"
  * Interfaz más limpia y directa
  * Menor distracción visual para el usuario
  * Mantiene misma funcionalidad con diseño más minimalista
* **🧹 Limpieza de Código**: Removidos estilos CSS no utilizados
  * Eliminadas clases `.guiders-placeholder-text` y sus variantes
  * Código más limpio y mantenible
  * Reducción de CSS innecesario

= 1.2.3-alpha.1 =
* **🎨 Banner de Consentimiento GDPR Integrado**: Sistema completo sin necesidad de escribir código
  * Nuevo componente `ConsentBannerUI` renderizado automáticamente por el SDK
  * 3 estilos diferentes: Barra inferior (recomendado), Modal centrado, Esquina inferior
  * Totalmente personalizable desde el panel de administración
  * Responsive con animaciones CSS suaves y accesibilidad completa (ARIA labels)
  * Auto-show cuando el consentimiento está pendiente
* **⚙️ Nueva Sección en Admin de WordPress**: "GDPR & Banner de Consentimiento"
  * Habilitar/deshabilitar banner integrado
  * Selección de estilo visual (dropdown)
  * Personalización de textos: banner, botones Aceptar/Rechazar/Preferencias
  * Color picker nativo de WordPress para 5 colores personalizables
  * Mostrar/ocultar botón de preferencias (checkbox)
  * Configuración guardada automáticamente en `guiders_wp_plugin_settings`
* **🔌 Integración Automática con SDK**: El plugin pasa la configuración al SDK
  * Método `getConsentBannerConfig()` en `class-guiders-public.php`
  * Banner se renderiza automáticamente en frontend sin código adicional
  * Callbacks conectados con `ConsentManager` del SDK
  * `onAccept()` → `sdk.grantConsent()`, `onDeny()` → `sdk.denyConsent()`
* **🌐 Universal**: Funciona en cualquier contexto, no solo WordPress
  * API pública `ConsentBannerConfig` para uso en HTML/React/Vue/Angular
  * Configuración vía `SDKOptions.consentBanner`
  * Componente TypeScript 100% tipado (~550 líneas)
* **✅ Sin Código Necesario para Clientes**: Plug & Play completo
  * Instalar plugin → Ir a Configuración → GDPR → Personalizar (opcional) → Guardar
  * Banner aparece automáticamente y gestiona consentimiento
  * Cumplimiento GDPR sin contratar desarrollador
* **📚 Documentación Completa**: Nueva guía `CONSENT_BANNER_IMPLEMENTATION.md`
  * Arquitectura técnica del sistema
  * Ejemplos de uso para WordPress y otros contextos
  * Checklist de testing
  * Métricas de implementación
* **🔧 Mejoras Técnicas**:
  * Validación de colores con `sanitize_hex_color()` en admin
  * Color picker de WordPress con `wp_enqueue_style('wp-color-picker')`
  * Valores por defecto sólidos en todos los campos
  * Código mantenible y extensible para futuras mejoras

= 1.2.2-alpha.1 =
* **🔐 Sistema Completo de Consentimiento GDPR/LOPDGDD**: Control total del consentimiento del usuario
  * Nuevo `ConsentManager` para gestión centralizada del estado de consentimiento
  * Tres estados de consentimiento: `pending`, `granted`, `denied`
  * Control granular por categorías: `analytics`, `functional`, `personalization`
  * Persistencia automática del estado de consentimiento en localStorage
  * Verificación de consentimiento antes de iniciar tracking
* **📋 APIs Públicas de Consentimiento**: Control completo desde el código del sitio web
  * `grantConsent()`: Otorga consentimiento completo
  * `grantConsentWithPreferences()`: Otorga consentimiento con preferencias específicas
  * `denyConsent()`: Deniega consentimiento
  * `revokeConsent()`: Revoca consentimiento previamente otorgado
  * `getConsentStatus()`: Obtiene estado actual (`pending`|`granted`|`denied`)
  * `getConsentState()`: Obtiene estado completo con preferencias y timestamp
  * `isConsentGranted()`: Verifica si hay consentimiento
  * `isCategoryAllowed()`: Verifica si una categoría está permitida
  * `subscribeToConsentChanges()`: Suscribe a cambios de consentimiento
* **⚖️ Derechos GDPR Implementados**: Cumplimiento total con derechos del usuario
  * `deleteVisitorData()`: Elimina todos los datos del visitante (Right to Erasure)
  * `exportVisitorData()`: Exporta datos del visitante en formato JSON (Right to Access)
  * Limpieza completa de localStorage
  * Solicitud de eliminación en el servidor
* **🎯 Tracking Condicional**: El tracking solo funciona con consentimiento
  * Verificación de consentimiento en `captureEvent()` y `track()`
  * Verificación de categorías específicas (analytics para eventos)
  * Modo sin tracking: inicializa solo chat UI sin recolección de datos
  * Reinicio automático del tracking al otorgar consentimiento
* **🔌 Integración con Gestores de Consentimiento**: Ejemplos completos para:
  * Cookiebot
  * OneTrust
  * Google Consent Mode API
  * Banners personalizados
* **📚 Documentación Completa**: Nueva guía `GDPR_CONSENT.md`
  * Explicación de responsabilidades legales
  * Ejemplos de implementación paso a paso
  * Integración con gestores de consentimiento populares
  * FAQ sobre GDPR y cumplimiento legal
  * Casos de uso reales

= 1.2.1-alpha.3 =
* **✨ Mensajes de Bienvenida Automáticos**: Los mensajes de bienvenida ahora se muestran automáticamente
  * Se muestran al entrar a la web por primera vez sin necesidad de abrir el chat
  * Solo aparecen cuando el visitante no tiene chats previos
  * Mejora la experiencia de usuario para nuevos visitantes
  * Eliminado el requisito de abrir manualmente el chat para ver el mensaje de bienvenida
  * Timeout de 500ms para asegurar que el chat esté completamente inicializado

= 1.2.1-alpha.2 =
* **🐛 Fix Critical**: Resuelto race condition en mensajes de bienvenida del chat
  * Añadido flag `isLoadingInitialMessages` para prevenir condiciones de carrera
  * Eliminado timeout arbitrario de 100ms en método `show()`
  * Consolidada lógica de mensajes de bienvenida después de carga asíncrona
  * Los mensajes de bienvenida ahora solo aparecen cuando el chat está realmente vacío
  * Fix: Los mensajes de bienvenida ya no aparecen cuando existen mensajes previos
  * Mejora en timing y sincronización de carga de mensajes

= 1.2.0-alpha.1 =
* **🛡️ Protección Robusta contra Errores Fatales**: El plugin ahora maneja gracefully todos los errores críticos
  * Sistema completo de try-catch en puntos críticos del código
  * Verificación defensiva de archivos antes de require_once
  * Validación de datos de arrays externos (GitHub API) antes de acceder
  * El admin de WordPress NUNCA se bloqueará por errores del plugin
  * Degradación graceful: funcionalidades no críticas pueden fallar sin afectar WordPress
* **📝 Sistema de Logging Mejorado**: Logs descriptivos con emojis para debugging rápido
  * Mensajes claros cuando falta un archivo
  * Información detallada sobre errores en constructores
  * Logs específicos por componente ([Guiders Admin], [Guiders Updater], etc.)
* **🔧 Nueva Clase Guiders_Error_Handler**: Gestión centralizada de errores
  * Métodos safeRequire() y safeInstantiate() para carga segura
  * Admin notices informativos (no bloquean WordPress)
  * Detalles técnicos visibles solo con WP_DEBUG activo
* **✅ Garantía de Estabilidad**: Múltiples capas de protección contra escenarios de fallo
  * Validación de existencia de archivos antes de cargarlos
  * Protección en constructores de todas las clases
  * Acceso seguro a arrays con isset() siempre
  * Templates verificados antes de incluir
* **🔒 Seguridad Mejorada**: Nunca bloquea WordPress
  * Si falta un archivo → Admin notice + WordPress funciona
  * Si falla un componente → Ese componente se desactiva + resto funciona
  * Si API GitHub falla → Updater falla silenciosamente + plugin funciona
  * Errores siempre logueados para troubleshooting
* **📊 Acceso Seguro a API GitHub**: Validación completa de respuestas
  * Verificación de estructura de datos antes de acceder
  * Protección contra cambios en formato de API
  * Manejo de errores de red sin afectar el plugin
* **🎯 Compatible con WordPress Recovery Mode**: Funciona con el modo de recuperación de WordPress 5.2+

= 1.1.0 =
* **📱 Chat Pantalla Completa en Móviles**: El chat ahora ocupa el 100% del viewport en dispositivos ≤768px para una experiencia inmersiva
* **❌ Botón de Cierre Mejorado**: Añadido icono SVG de cruz (X) visible en el header, más grande y destacado en móvil (36x36px)
* **🔄 Sincronización Toggle Button**: Corregido bug crítico donde el botón toggle flotante no se sincronizaba al cerrar el chat desde el botón X
* **📐 Diseño Responsivo Optimizado**: Sin border-radius en móvil para aprovechar toda la pantalla, manteniendo diseño widget en desktop
* **🛠️ Mejoras Técnicas**: Media query automática, callbacks mejorados, arquitectura de sincronización bidireccional
* **♿ Accesibilidad Mejorada**: Animaciones hover/active optimizadas, aria-label para navegación por teclado
* **🧪 Archivos de Prueba**: Demos específicos para móvil y sincronización (mobile-fullscreen-demo.html, test-toggle-sync.html)

= 1.0.8-beta.1 =
* **[BETA] Filtrado de Mensajes Propios en WebSocket**: Eliminada la duplicación de mensajes del visitante en el chat
  * Problema resuelto: Los mensajes del visitante aparecían dos veces (optimistic UI + eco WebSocket)
  * Implementación: Filtro automático en `RealtimeMessageManager.handleNewMessage()`
  * Mensajes cuyo `senderId` coincide con `visitorId` se ignoran automáticamente
  * Solo se renderizan mensajes de comerciales, bots y otros participantes
  * Renderizado instantáneo de mensajes propios mantenido (optimistic UI)
  * Recepción en tiempo real de mensajes de comerciales mejorada
  * Arquitectura limpia: HTTP para envío, WebSocket para recepción
* **[BETA] Logs Detallados de Conexión WebSocket**: Añadida visibilidad completa del ciclo de vida WebSocket
  * Logs exhaustivos en todas las fases de conexión
  * Inicio: URL completa, path, transports, credentials
  * Conexión exitosa: Socket ID, URL conectada, transporte usado (websocket/polling)
  * Errores: URL intentada, mensaje detallado, stack trace completo
  * Desconexión: Razón específica, URL que estaba conectada
  * Reintentos: Número de intento, URL de reconexión
  * Debugging simplificado con información necesaria en consola
  * Verificación inmediata de endpoints correctos (prod: `wss://guiders.es`)
  * Identificación rápida de errores de red, CORS, autenticación
  * Documentación completa en `WEBSOCKET_LOGS_GUIDE.md`
* **Nota**: Esta versión está en fase beta; las características están maduras, se recomienda realizar pruebas antes de usar en producción.

= 1.0.8-alpha.1 =
* **[ALPHA] Sistema de Comunicación Bidireccional en Tiempo Real (WebSocket)**
  * Arquitectura híbrida implementada: envío HTTP POST + recepción WebSocket
  * `WebSocketService`: Gestión centralizada de conexiones Socket.IO con patrón Singleton
  * `RealtimeMessageManager`: Coordinador entre WebSocket y ChatUI
  * Reconexión automática tras desconexiones
  * Eventos soportados: `message:new`, `chat:status`, `user:typing`
  * Integración automática en TrackingPixelSDK
  * API pública: `isWebSocketConnected()`, `getWebSocketState()`, `sendRealtimeMessage()`
  * Demo completa: `examples/websocket-realtime-chat-demo.html`
  * Documentación: `docs/WEBSOCKET_REALTIME_CHAT.md`
* **[ALPHA] Mejoras en el Avatar del Bot**
  * Avatar del bot ahora muestra "BOT" en lugar de "AI" para mayor claridad
  * Diseño refinado: eliminado box-shadow para aspecto más limpio
  * Esfera perfecta: dimensiones exactas (32x32px) con `box-sizing: border-box`
  * Bordes optimizados: removido border para acabado más suave
* **[ALPHA] Rediseño de la Visualización de Hora**
  * La hora ahora aparece dentro de la burbuja del mensaje
  * En mensajes propios: texto blanco semitransparente dentro del área azul
  * En mensajes de otros: texto gris sutil dentro del área blanca
  * Tipografía unificada: 10px, font-weight 400, opacity 0.9
  * Layout optimizado con estructura en columna (texto + hora)
  * Alineación consistente a la derecha con margin-top de 4px
* **[ALPHA] Mejoras Técnicas del Sistema de Mensajes**
  * Estructura HTML unificada: `message-content-wrapper` consistente
  * CSS optimizado: layout flexbox para mejor control
  * Padding ajustado: 8x12px para mejor respiración del contenido
  * Cambios aplicados en `message-renderer.ts` (sistema unificado)
* **Nota**: Esta es una versión alpha experimental. Las características pueden cambiar en futuras versiones. No recomendada para producción.

= 1.0.7 =
* **Mejoras en el Avatar del Bot**: Avatar del bot ahora muestra "BOT" en lugar de "AI" para mayor claridad
* **Diseño refinado**: Eliminado el box-shadow del avatar para un aspecto más limpio y profesional
* **Rediseño de Timestamps**: La hora ahora aparece dentro de la burbuja del mensaje para mejor integración visual
* **Layout optimizado**: Estructura unificada en mensajes con mejor espaciado y tipografía
* **Mejoras técnicas**: Sistema de renderizado unificado y CSS optimizado con flexbox

= 1.0.6 =
* **Release técnico**: Actualización de versión por conveniencia técnica
* Sin cambios funcionales respecto a 1.0.5
* Preparación de infrastructure para futuras mejoras

= 1.0.5 =
* **Fix crítico**: Corregido sistema de mensajes de bienvenida que no aparecía en chats vacíos
* **Mejora UX**: Eliminadas animaciones de hover en mensajes del chat para experiencia más estable
* Los mensajes de bienvenida ahora aparecen automáticamente al abrir el chat por primera vez
* Funciona correctamente tanto para nuevos visitantes como para chats existentes sin mensajes
* Mensajes del chat ya no tienen efectos visuales distractores al pasar el mouse por encima
* Mejora en la profesionalidad y estabilidad visual del sistema de chat
* Compatibilidad total con todas las configuraciones de mensajes de bienvenida existentes
* Actualización del SDK core para soporte mejorado de welcome messages

= 1.0.4-alpha.12 =
* Continúa desarrollo alpha de base 1.0.4
* Nuevas experimentaciones y refinamientos antes de transición a beta
* Funcionalidades experimentales que pueden cambiar en futuras versiones
* Release exploratorio para validación continua de características

= 1.0.4-alpha.11 =
* Continúa desarrollo alpha de base 1.0.4
* Nuevas experimentaciones y refinamientos antes de transición a beta
* Funcionalidades experimentales que pueden cambiar en futuras versiones
* Release exploratorio para validación continua de características

= 1.0.4-alpha.10 =
* Continúa desarrollo alpha de base 1.0.4
* Experimentación y refinamiento de funcionalidades antes de transición a beta
* Permite cambios de API y ajustes experimentales
* Release exploratorio para validación temprana de características

= 1.0.4-alpha.9 =
* Continúa desarrollo alpha de base 1.0.4
* Experimentación y refinamiento de funcionalidades antes de transición a beta
* Permite cambios de API y ajustes experimentales
* Release exploratorio para validación temprana de características

= 1.0.4-alpha.8 =
* Continúa desarrollo alpha de base 1.0.4
* Experimentación y refinamiento de funcionalidades antes de transición a beta
* Permite cambios de API y ajustes experimentales
* Release exploratorio para validación temprana de características

= 1.0.5 =
* **Nueva funcionalidad**: Mensajes de bienvenida personalizables para el chat
* Agregados 5 estilos predefinidos: Amigable, Profesional, Casual, Útil y Personalizado
* Soporte multiidioma para mensajes (Español e Inglés)
* Plantillas de negocio predefinidas (E-commerce, SaaS, Salud, Educación, Finanzas)
* Control de emojis y consejos adicionales
* Nueva sección en configuración: "Mensajes de Bienvenida del Chat"
* Mejora en la experiencia de usuario del chat
* Actualización del SDK core para soporte de welcome messages

= 1.0.4-alpha.7 =
* Ajuste menor de documentación y preparación final antes de consolidar cambios de endpoints y auto-inicialización en release estable.
* Verificación adicional del script de publicación automatizada.
* Sin cambios funcionales en runtime respecto a alpha.6 (solo metadata de versión y empaquetado).

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