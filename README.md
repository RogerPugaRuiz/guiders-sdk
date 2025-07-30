# Guiders SDK

[![npm version](https://badge.fury.io/js/guiders-pixel.svg)](https://badge.fury.io/js/guiders-pixel)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> SDK completo para integración de tracking inteligente, analytics y chat en vivo en sitios web.

Guiders SDK es una solución integral que permite implementar tracking de eventos, analytics en tiempo real y chat en vivo en tu sitio web con **detección heurística inteligente** que funciona automáticamente sin modificar tu HTML existente.

## ✨ Características Principales

- 🎯 **Detección Heurística Inteligente** - Localiza automáticamente elementos sin modificar HTML
- 💬 **Chat en Vivo** - Sistema de chat integrado con carga lazy optimizada  
- 📊 **Analytics en Tiempo Real** - Seguimiento y métricas automáticas
- 🛡️ **Detección de Bots** - Filtrado inteligente de tráfico no humano
- 🏪 **E-commerce Ready** - Compatible con WooCommerce, Shopify y más
- 🚀 **Fácil Integración** - Una línea de código para empezar
- 🔧 **Altamente Configurable** - Personalización avanzada disponible

## 🚀 Inicio Rápido

### Instalación por NPM

```bash
npm install guiders-pixel
```

### Instalación por CDN

```html
<!-- Opción 1: Usando atributo data-api-key -->
<script src="https://cdn.guiders.com/latest/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>

<!-- Opción 2: Usando parámetro URL -->
<script src="https://cdn.guiders.com/latest/guiders-sdk.js?apiKey=YOUR_API_KEY"></script>
```

### Uso Básico

```javascript
import { TrackingPixelSDK } from 'guiders-pixel';

const sdk = new TrackingPixelSDK({
  apiKey: 'YOUR_API_KEY'
});

await sdk.init();
sdk.enableAutomaticTracking(); // ✨ Nueva detección heurística
```

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [📋 **Índice Completo**](./docs/INDEX.md) | **Navegación completa de toda la documentación** |
| [🚀 Guía de Inicio](./docs/GETTING_STARTED.md) | Instalación y configuración básica - **¡Empieza aquí!** |
| [📚 Documentación Completa (ES)](./docs/PIXEL_ES.md) | Documentación técnica detallada en español |
| [📚 Full Documentation (EN)](./docs/PIXEL_EN.md) | Complete technical documentation in English |
| [🔗 Guía de Integraciones](./docs/INTEGRATIONS.md) | WordPress, Shopify, React, Vue, Angular y más |
| [🔌 Plugin WordPress](./wordpress-plugin/README.md) | Integración específica para WordPress/WooCommerce |
| [🛠️ API Reference](./docs/API_REFERENCE.md) | Referencia completa de la API y métodos |
| [❓ FAQ & Troubleshooting](./docs/TROUBLESHOOTING.md) | Solución de problemas comunes |
| [📊 Session Tracking](./SESSION_TRACKING.md) | Sistema de seguimiento de sesiones |
| [👥 Participant Integration](./PARTICIPANT_INTEGRATION_COMPLETED.md) | Integración de sistema de participantes |
| [💼 Ejemplos Prácticos](./examples/README.md) | Código de ejemplo para diferentes casos de uso |

## 💡 Ejemplos Rápidos

### E-commerce Automático (Sin modificar HTML)

```html
<!-- ✅ Detección automática - NO necesitas atributos especiales -->
<button>Añadir al carrito</button>
<button>Contactar</button>
<button>Comprar ahora</button>

<!-- El SDK detecta automáticamente estos elementos -->
<script src="https://cdn.guiders.com/latest/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>
```

### WordPress/WooCommerce

```php
// Solo instala el plugin y configura tu API Key
// ¡Todo funciona automáticamente!
```

### Tracking Personalizado

```javascript
// Eventos personalizados
await window.guiders.track({
  event: 'newsletter_signup',
  email: 'user@example.com',
  source: 'footer'
});
```

## 🎯 Detección Heurística Inteligente

> **Nuevo en v2.0** - El SDK ahora detecta automáticamente elementos relevantes sin necesidad de modificar HTML

### ¿Qué detecta automáticamente?

| Evento | Detecta elementos que... | Ejemplo |
|--------|--------------------------|---------|
| `add_to_cart` | Contienen texto "añadir", "carrito", "cart" | `<button>Añadir al carrito</button>` |
| `contact_dealer` | Contienen "contactar", "contact" | `<a href="/contact">Contactar</a>` |
| `purchase` | Contienen "comprar", "buy", "checkout" | `<button>Comprar ahora</button>` |
| `search_submit` | Botones en formularios de búsqueda | `<button type="submit">Buscar</button>` |
| `view_product` | Enlaces en contexto de productos | Automático en páginas de producto |

### Detección por URL

```javascript
// Estas URLs se detectan automáticamente:
'/' → 'home'
'/product/123' → 'product_detail'  
'/cart' → 'cart'
'/contact' → 'contact'
'/search' → 'search'
// Y muchas más...
```

### Configuración Avanzada

```javascript
const sdk = new TrackingPixelSDK({
  apiKey: 'YOUR_API_KEY',
  heuristicDetection: {
    enabled: true,
    confidenceThreshold: 0.7, // Confianza mínima (0-1)
    fallbackToManual: true     // Usar sistema manual si falla
  }
});
```

## 💬 Chat en Vivo

Sistema de chat integrado con inicialización optimizada y sin parpadeo visual.

### Características

- 🔄 **Inicialización Lazy** - Se carga solo cuando el usuario lo necesita
- ⚡ **Sin Parpadeo** - Permanece oculto hasta activación manual
- 🔌 **WebSocket en Tiempo Real** - Mensajes instantáneos
- 📱 **Responsive** - Optimizado para móvil y desktop
- 🤖 **Detección de Bots** - Evita cargas innecesarias

```javascript
// El chat se inicializa automáticamente y permanece oculto
// hasta que el usuario haga clic en el botón toggle
```

## 🤖 Detección de Bots

Sistema inteligente para filtrar tráfico no humano y mejorar la calidad de datos.

### Cómo Funciona

1. **User Agent** - Identifica bots conocidos (Google, Bing, etc.)
2. **Comportamiento** - Analiza patrones de interacción humana
3. **Características del Navegador** - Detecta herramientas de automatización
4. **Tiempos de Carga** - Identifica velocidades sospechosas

```javascript
import { BotDetector } from 'guiders-pixel';

const detector = new BotDetector();
const result = await detector.detect();

if (!result.isBot) {
  // Inicializar solo para usuarios legítimos
  initSDK();
}
```

## 🔄 Historial de Versiones

### v2.0.0 - Detección Heurística Inteligente ⚠️ BREAKING CHANGES

- 🎯 **Nueva funcionalidad**: Sistema de detección heurística inteligente
  - Localización automática de elementos sin modificar HTML del cliente
  - Compatible con WordPress, WooCommerce, Shopify y otros CMS
  - Detección basada en patrones CSS, texto y contexto
- 📄 **Detección de página por URL**: Reemplaza la detección basada en elementos HTML
- ⚠️ **BREAKING CHANGE**: Nuevo método `enableAutomaticTracking()` reemplaza `enableDOMTracking()`
- 🔧 **Configuración avanzada**: Umbrales de confianza y reglas personalizables
- 🚀 **Habilitado por defecto**: La detección heurística está activa automáticamente

#### Migración v1.x → v2.0

```javascript
// ❌ Antes
sdk.enableDOMTracking();

// ✅ Ahora (recomendado)
sdk.enableAutomaticTracking();

// ℹ️ Los atributos data-track-event siguen funcionando para compatibilidad
```

### v1.1.0 - Mejoras en Chat

- **Solucionado**: El chat ya no se muestra brevemente durante la inicialización
- **Optimización**: Sistema de carga lazy para el contenido del chat
- **Mejora UX**: El chat permanece completamente oculto hasta activación explícita
- **Rendimiento**: Tiempo de inicialización reducido

## 🛠️ Desarrollo y Contribución

### Requisitos

- Node.js 16+
- TypeScript 4.5+
- Webpack 5+

### Setup Local

```bash
git clone https://github.com/RogerPugaRuiz/guiders-sdk.git
cd guiders-sdk
npm install
npm run build
npm run start # Servidor de desarrollo
```

### Scripts Disponibles

```bash
npm run build      # Construir para producción
npm run start      # Servidor de desarrollo
npm run test       # Ejecutar tests (próximamente)
```

## 📞 Soporte

### Recursos

- 📖 [Documentación Completa](./docs/)
- 💬 [Soporte por Chat](https://guiders.ancoradual.com/support)
- 🐛 [Reportar Bug](https://github.com/RogerPugaRuiz/guiders-sdk/issues)
- ✨ [Solicitar Feature](https://github.com/RogerPugaRuiz/guiders-sdk/issues/new)

### FAQ Rápida

**¿El SDK funciona con mi CMS?**  
✅ Sí, funciona con WordPress, Shopify, WooCommerce, Drupal y sitios HTML estáticos.

**¿Necesito modificar mi HTML existente?**  
❌ No, la detección heurística funciona automáticamente sin modificaciones.

**¿Es compatible con GDPR?**  
✅ Sí, incluye configuraciones para cumplimiento de privacidad.

---

## 📄 Licencia

[ISC License](LICENSE) - Ver archivo de licencia para más detalles.

---

<p align="center">
  Desarrollado con ❤️ por el equipo de <a href="https://guiders.ancoradual.com">Guiders</a>
</p>