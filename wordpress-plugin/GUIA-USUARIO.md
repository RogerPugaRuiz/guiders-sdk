# Plugin de WordPress para Guiders SDK - Guía de Usuario

## 🎯 ¿Qué es este plugin?

El **Plugin de WordPress para Guiders SDK** te permite integrar fácilmente el poderoso sistema de tracking, chat en vivo y notificaciones de Guiders en tu sitio WordPress sin necesidad de conocimientos técnicos.

### ✨ Principales Beneficios

- **🔧 Cero configuración técnica**: No necesitas tocar código ni modificar tu tema
- **🎯 Detección automática**: Encuentra botones de "Añadir al carrito", formularios de contacto, etc. automáticamente
- **💬 Chat profesional**: Chat en vivo optimizado que se carga solo cuando se necesita
- **📊 Analytics avanzados**: Tracking inteligente de todas las interacciones importantes
- **🛒 WooCommerce Ready**: Perfecta integración con tiendas online

---

## 🚀 Instalación Rápida

### Paso 1: Instalar el Plugin

**Opción A - Desde el Admin de WordPress:**
1. Ve a **Plugins > Añadir nuevo**
2. Haz clic en **Subir plugin**
3. Selecciona el archivo `guiders-wp-plugin.zip`
4. Haz clic en **Instalar ahora**
5. **Activa** el plugin

**Opción B - Instalación Manual:**
1. Extrae el archivo ZIP
2. Sube la carpeta `guiders-wp-plugin` a `/wp-content/plugins/`
3. Ve a **Plugins** y activa **Guiders SDK**

### Paso 2: Obtener tu API Key

1. Ve a [Guiders](https://guiders.ancoradual.com)
2. Regístrate o inicia sesión
3. Crea un nuevo proyecto
4. Copia la **API Key** que aparece en el dashboard

### Paso 3: Configurar el Plugin

1. En tu WordPress, ve a **Configuración > Guiders SDK**
2. Pega tu **API Key** en el campo correspondiente
3. Habilita **"Habilitar Guiders SDK"**
4. Configura las opciones según tus necesidades
5. Haz clic en **Guardar Configuración**

¡Listo! Tu sitio ya está usando Guiders SDK.

---

## ⚙️ Configuración Detallada

### Configuración General

| Opción | Descripción | Recomendado |
|--------|-------------|-------------|
| **API Key** | Tu clave única de Guiders | Obligatorio |
| **Habilitar Guiders SDK** | Activa/desactiva el plugin | ✅ Habilitado |
| **Entorno** | Producción o desarrollo | Producción |

### Características

| Característica | Qué hace | Recomendado |
|---------------|----------|-------------|
| **Chat en Vivo** | Muestra el widget de chat | ✅ Para sitios con ventas |
| **Tracking de Eventos** | Rastrea clics y conversiones | ✅ Siempre |
| **Detección Heurística** | Encuentra elementos automáticamente | ✅ Muy recomendado |
| **Umbral de Confianza** | Qué tan estricto es el detector | 0.7 (moderado) |

### Configuraciones Recomendadas por Tipo de Sitio

#### 🛒 Tienda Online (WooCommerce)
```
✅ Chat en Vivo: Habilitado
✅ Tracking de Eventos: Habilitado  
✅ Detección Heurística: Habilitado
🎯 Umbral de Confianza: 0.7
```

#### 🏢 Sitio Corporativo
```
✅ Chat en Vivo: Habilitado
✅ Tracking de Eventos: Habilitado
✅ Detección Heurística: Habilitado  
🎯 Umbral de Confianza: 0.6
```

#### 📝 Blog/Revista
```
⚪ Chat en Vivo: Opcional
✅ Tracking de Eventos: Habilitado
✅ Detección Heurística: Habilitado
🎯 Umbral de Confianza: 0.8
```

---

## 🎯 ¿Qué Detecta Automáticamente?

### 🛒 Ecommerce (WooCommerce)
- ✅ Botones "Añadir al carrito"
- ✅ Proceso de checkout
- ✅ Visualización de productos
- ✅ Búsquedas en la tienda
- ✅ Wishlist y comparaciones

### 📞 Contacto y Leads
- ✅ Formularios de contacto
- ✅ Botones "Contactar" / "Llamar ahora"
- ✅ Solicitudes de cotización
- ✅ Descargas de catálogos

### 🔍 Navegación y Engagement
- ✅ Búsquedas en el sitio
- ✅ Tiempo en página
- ✅ Scroll depth
- ✅ Clics en enlaces externos

### 🚗 Automotriz (si aplica)
- ✅ "Agendar prueba de manejo"
- ✅ "Contactar concesionario"
- ✅ Cotizadores de vehículos

---

## 💬 Chat en Vivo

### Características del Chat

- **Carga inteligente**: Solo se activa cuando el usuario lo necesita
- **Sin slowdown**: No afecta la velocidad de tu sitio
- **Totalmente responsivo**: Funciona perfecto en móviles
- **Integración nativa**: Se ve como parte de tu sitio

### Personalización

El chat se adapta automáticamente a tu tema, pero puedes personalizarlo desde tu panel de Guiders.

---

## 📊 Analytics y Reportes

### Dashboard de Guiders

En tu panel de Guiders verás:

- **📈 Conversiones en tiempo real**: Ventas, leads, descargas
- **👥 Visitantes activos**: Quién está navegando ahora
- **🔥 Páginas más vistas**: Contenido que más atrae
- **💬 Conversaciones del chat**: Historial completo
- **📱 Estadísticas móvil vs desktop**: Comportamiento por dispositivo

### Eventos Trackados Automáticamente

| Evento | Cuándo se dispara | Información incluida |
|--------|-------------------|---------------------|
| `page_view` | Usuario ve una página | URL, título, tipo de página |
| `add_to_cart` | Producto añadido al carrito | ID producto, cantidad |
| `contact_form` | Envío de formulario contacto | Tipo de formulario |
| `search` | Búsqueda en el sitio | Término buscado |
| `download` | Descarga de archivo | Nombre del archivo |

---

## 🔧 Solución de Problemas

### ❌ El plugin no aparece en el admin

**Causa**: Error en la instalación
**Solución**:
1. Verifica que subiste toda la carpeta `guiders-wp-plugin`
2. Asegúrate de que los permisos sean correctos (755)
3. Revisa el error log de WordPress

### ❌ "API Key no válida"

**Causa**: API Key incorrecta o no configurada
**Solución**:
1. Ve a tu dashboard de Guiders
2. Copia de nuevo la API Key
3. Pégala sin espacios extra

### ❌ El chat no aparece

**Causa**: Configuración o conflicto con tema
**Solución**:
1. Verifica que "Chat en Vivo" esté habilitado
2. Revisa la consola del navegador para errores
3. Prueba desactivando otros plugins temporalmente

### ❌ WooCommerce no funciona

**Causa**: Conflicto con tema o plugin
**Solución**:
1. Asegúrate de que WooCommerce esté actualizado
2. Verifica que tu tema sea compatible con WooCommerce
3. Prueba con un tema default (Storefront)

---

## 🛡️ Seguridad y Privacidad

### Datos que se Envían

- **NO se envían**: Datos personales sensibles, passwords, información de pago
- **SÍ se envían**: URLs visitadas, eventos de interacción, datos de chat (si el usuario acepta)

### GDPR y Privacidad

- El plugin respeta las configuraciones de cookies de WordPress
- Los usuarios pueden optar por no usar el chat
- Todos los datos se procesan según GDPR

---

## 🚀 Optimización de Rendimiento

### El Plugin es Ligero

- **Tamaño**: ~80KB comprimido
- **Carga**: Asíncrona, no bloquea la página
- **Cache**: Compatible con todos los plugins de caché
- **CDN**: Funciona con Cloudflare, MaxCDN, etc.

### Mejores Prácticas

1. **Usa un plugin de caché** (WP Rocket, W3 Total Cache)
2. **Optimiza imágenes** con WebP
3. **Usa un CDN** para mejor velocidad global
4. **Mantén WordPress actualizado**

---

## 📞 Soporte y Ayuda

### 📚 Documentación

- **GitHub**: [Repositorio oficial](https://github.com/RogerPugaRuiz/guiders-sdk)
- **Docs completas**: [Documentación técnica](https://github.com/RogerPugaRuiz/guiders-sdk/blob/main/README.md)

### 🐛 Reportar Problemas

1. **GitHub Issues**: [Reportar bug](https://github.com/RogerPugaRuiz/guiders-sdk/issues)
2. **Incluye**: Versión de WordPress, tema usado, otros plugins activos
3. **Screenshots**: Si es un problema visual

### 💬 Comunidad

- **Soporte**: A través de GitHub Issues
- **Features**: Solicitudes en GitHub
- **Actualizaciones**: Sigue el repositorio para novedades

---

## 🎉 ¡Felicidades!

Ya tienes Guiders SDK funcionando en tu WordPress. Ahora podrás:

- 📊 **Ver analytics detallados** en tu dashboard de Guiders
- 💬 **Chatear con visitantes** en tiempo real
- 🎯 **Optimizar conversiones** con datos precisos
- 🚀 **Hacer crecer tu negocio** con mejor engagement

### Próximos Pasos

1. **Explora tu dashboard** de Guiders para familiarizarte con los reportes
2. **Personaliza el chat** con tu branding
3. **Configura notificaciones** para no perderte ningún lead
4. **Revisa las métricas semanalmente** para optimizar tu sitio

¿Preguntas? ¡Estamos aquí para ayudarte! 🚀