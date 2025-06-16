# 🧠 Detección Heurística Inteligente - Guiders SDK

## Resumen

El Guiders SDK ahora incluye un sistema de **detección heurística inteligente** que identifica automáticamente elementos de tracking sin necesidad de modificar el HTML del cliente. Esta funcionalidad elimina la dependencia de atributos `data-track-event` y permite un tracking completamente automático.

## 🎯 Características Principales

### ✨ Detección Automática
- **Sin modificaciones HTML**: No requiere atributos `data-track-event`
- **Detección por URL**: Las páginas se identifican automáticamente por su URL
- **Selectores inteligentes**: Reconoce elementos por texto, clases CSS y contexto
- **Puntuación de confianza**: Cada detección incluye una puntuación de precisión

### 🛒 Eventos Soportados
- `add_to_cart` - Botones "Añadir al carrito"
- `contact_dealer` - Botones y enlaces de contacto
- `search_submit` - Botones de búsqueda y envío de formularios
- `view_product` - Enlaces a productos
- `filter_by_price` - Controles de filtrado de precio
- `schedule_test_drive` - Botones de prueba de manejo
- `request_quote` - Botones de cotización
- `search_vehicle_type` - Selectores de tipo de vehículo
- `search_brand` - Selectores de marca
- `search_model` - Selectores de modelo
- `calculate_financing` - Botones de financiación

## 🔧 Configuración

### Configuración por Defecto
```javascript
const sdkOptions = {
  apiKey: 'YOUR_API_KEY',
  autoDetection: {
    enabled: true,                    // Detección heurística activada
    confidenceThreshold: 0.6,         // Umbral mínimo de confianza
    urlBasedPageDetection: true,      // Detección de páginas por URL
    fallbackToManual: false           // Sin fallback al sistema anterior
  }
};
```

### Personalización Avanzada
```javascript
// Configurar después de la inicialización
window.guiders.updateAutoDetectionConfig({
  confidenceThreshold: 0.8,  // Aumentar precisión
  enabled: true
});

// Obtener configuración actual
const config = window.guiders.getAutoDetectionConfig();
console.log('Configuración actual:', config);

// Re-ejecutar detección (útil para SPAs)
window.guiders.redetectElements();
```

## 📊 Detección de Páginas por URL

El sistema identifica automáticamente el tipo de página basándose en patrones de URL:

| Patrón de URL | Tipo de Página |
|---------------|----------------|
| `/` | home |
| `/about` | about |
| `/contact` | contact |
| `/ecommerce` | ecommerce |
| `/vehicle-search` | vehicle-search |
| `/vehicle-comparison` | vehicle-comparison |
| `/product/*` | product |

### Añadir Patrones Personalizados
```javascript
// Añadir un nuevo patrón de detección de página
window.guiders.enhancedDomTrackingManager.addPagePattern(
  'checkout', 
  /\/checkout/
);
```

## 🎯 Ejemplos de Detección

### E-commerce
```html
<!-- Estos elementos son detectados automáticamente -->
<button class="add-to-cart-btn">Añadir al carrito</button>
<button>Agregar producto</button>
<a href="/product/123" class="product-link">Ver producto</a>
```

### Contacto
```html
<!-- Detectados como eventos de contacto -->
<button class="contact-btn">Contactar</button>
<a href="/contact">Página de contacto</a>
<button>Contactar dealer</button>
```

### Búsqueda y Filtros
```html
<!-- Detectados como eventos de búsqueda -->
<button type="submit">Buscar</button>
<input type="range" name="price">
<select name="vehicle_type">
```

## 🔍 Sistema de Confianza

Cada elemento detectado incluye una puntuación de confianza (0.0-1.0):

- **0.9-1.0**: Detección muy precisa (texto exacto + contexto correcto)
- **0.7-0.8**: Detección precisa (texto parcial + contexto)
- **0.6-0.7**: Detección moderada (patrones generales)
- **< 0.6**: No se trackea (umbral mínimo)

### Factores que Aumentan la Confianza
- Texto exacto del elemento coincide con patrones
- Elemento está en el contexto correcto (ej: dentro de `.product`)
- Selectores CSS específicos coinciden
- Elemento es visible y interactuable

## 🚀 Migración desde data-track-event

### Antes (Sistema Anterior)
```html
<button data-track-event="add_to_cart" 
        data-product-id="123">
  Añadir al carrito
</button>
<div data-track-event="page_view" 
     data-page="home"></div>
```

### Después (Detección Automática)
```html
<!-- ¡Sin atributos especiales! -->
<button class="add-to-cart-btn">Añadir al carrito</button>
<!-- La página se detecta automáticamente por URL -->
```

## 🧪 Testing y Validación

### Archivo de Test
Utiliza `test-heuristic-detection.html` para probar la detección:

```bash
# Abrir en navegador
open test-heuristic-detection.html
```

### Logs de Depuración
```javascript
// Ver elementos detectados en consola
console.log('Config:', window.guiders.getAutoDetectionConfig());

// Ver logs detallados
// Los logs incluyen: 🔍 para detecciones, ✅ para eventos exitosos
```

## ⚙️ Configuración Avanzada

### Deshabilitar para Casos Específicos
```javascript
// Deshabilitar temporalmente
window.guiders.updateAutoDetectionConfig({ enabled: false });

// Usar sistema legacy si es necesario
window.guiders.enableLegacyDOMTracking();
```

### Eventos Específicos
```javascript
// Configurar eventos específicos a detectar
window.guiders.updateAutoDetectionConfig({
  supportedEvents: ['add_to_cart', 'contact_dealer', 'search_submit']
});
```

## 🔮 Ventajas del Nuevo Sistema

1. **Cero modificaciones HTML**: Funciona con cualquier sitio web existente
2. **Ideal para WordPress**: No requiere modificar templates
3. **Detección inteligente**: Reconoce patrones comunes automáticamente
4. **Escalable**: Fácil añadir nuevos tipos de eventos
5. **Robusto**: Funciona aunque cambien las clases CSS
6. **Configurable**: Ajustable según necesidades específicas

## 📈 Roadmap Futuro

- [ ] **Fase 2**: Optimización para CMS específicos (WordPress, Shopify)
- [ ] **Fase 3**: Dashboard visual para configuración manual
- [ ] **Fase 4**: Aprendizaje adaptivo basado en comportamiento real
- [ ] **Fase 5**: Integración con Machine Learning para detección avanzada

---

**Nota**: El sistema mantiene compatibilidad con el método anterior mediante `enableLegacyDOMTracking()` si es necesario en el futuro.