=== Guiders SDK ===
Contributors: guiders
Tags: analytics, chat, tracking, ecommerce, woocommerce, live-chat, heuristic-detection, gdpr, consent-banner, cookies
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.4.1
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