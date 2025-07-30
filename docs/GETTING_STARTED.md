# 🚀 Guía de Inicio Rápido

Esta guía te ayudará a integrar Guiders SDK en tu sitio web en menos de 5 minutos.

## 📋 Prerrequisitos

- Sitio web (HTML, WordPress, Shopify, etc.)
- API Key de Guiders ([obtener aquí](https://guiders.ancoradual.com))

## ⚡ Instalación Rápida (1 minuto)

### Opción 1: CDN (Recomendada para comenzar)

Simplemente añade esta línea antes del cierre de `</body>`:

```html
<script src="https://cdn.guiders.com/latest/guiders-sdk.js" data-api-key="TU_API_KEY"></script>
```

**¡Eso es todo!** El SDK comenzará a detectar eventos automáticamente.

### Opción 2: NPM (Para proyectos con build)

```bash
npm install guiders-pixel
```

```javascript
import { TrackingPixelSDK } from 'guiders-pixel';

const sdk = new TrackingPixelSDK({
  apiKey: 'TU_API_KEY'
});

await sdk.init();
sdk.enableAutomaticTracking();
```

### Opción 3: WordPress

1. Descargar [plugin de WordPress](../wordpress-plugin/)
2. Instalar desde **Plugins > Subir plugin**
3. Activar y configurar API Key en **Configuración > Guiders SDK**

## 🎯 Verificación de Instalación

1. **Abre tu sitio web**
2. **Abre Developer Tools** (F12)
3. **Ve a la pestaña Console**
4. **Busca el mensaje**: `"Guiders SDK initialized successfully"`

Si ves este mensaje, ¡todo está funcionando!

## 🔍 Primeros Pasos

### Verificar Eventos Automáticos

El SDK detecta automáticamente estos elementos **sin necesidad de modificar HTML**:

- ✅ Botones de "Añadir al carrito"
- ✅ Enlaces de "Contacto"
- ✅ Formularios de búsqueda
- ✅ Botones de compra
- ✅ Enlaces de productos

### Ejemplo de Página de Producto

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Producto</title>
</head>
<body>
    <h1>Producto Ejemplo</h1>
    <p>Precio: €29.99</p>
    
    <!-- ✨ Estos elementos se detectan automáticamente -->
    <button>Añadir al carrito</button>
    <a href="/contact">Contactar vendedor</a>
    <button>Comprar ahora</button>
    
    <!-- SDK de Guiders -->
    <script src="https://cdn.guiders.com/latest/guiders-sdk.js" 
            data-api-key="TU_API_KEY"></script>
</body>
</html>
```

## 🛠️ Configuración Básica

### Ajustar Sensibilidad de Detección

```javascript
// Configuración más estricta (menos falsos positivos)
<script>
window.guidersConfig = {
  heuristicDetection: {
    confidenceThreshold: 0.8 // Default: 0.7
  }
};
</script>
<script src="https://cdn.guiders.com/latest/guiders-sdk.js" data-api-key="TU_API_KEY"></script>
```

### Habilitar Chat en Vivo

```javascript
<script>
window.guidersConfig = {
  chat: {
    enabled: true,
    position: 'bottom-right' // bottom-left, top-right, top-left
  }
};
</script>
```

## 📊 Ver Datos en el Dashboard

1. Ve a [dashboard.guiders.com](https://dashboard.guiders.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto
4. ¡Ve los eventos en tiempo real!

## 🚨 Solución de Problemas Rápidos

### El SDK no se carga

```javascript
// Verificar en consola
console.log('Guiders SDK:', window.guiders);
```

**Si aparece `undefined`:**
- ✅ Verificar que la API Key sea correcta
- ✅ Comprobar conexión a internet
- ✅ Revisar bloqueadores de anuncios

### No se detectan eventos

**En consola, escribir:**
```javascript
// Ver configuración actual
console.log('Config:', window.guiders.getConfig());

// Ver elementos detectados
window.guiders.debug = true; // Habilitar modo debug
```

### Chat no aparece

**El chat está oculto por defecto**. Para mostrarlo:
1. Buscar botón de chat (esquina inferior derecha)
2. Hacer clic para abrir
3. Si no aparece, verificar configuración de chat

## 📞 ¿Necesitas Ayuda?

- 💬 [Chat de Soporte](https://guiders.ancoradual.com/support)
- 📧 Email: support@guiders.com
- 📖 [Documentación Completa](./PIXEL_ES.md)
- 🐛 [Reportar Bug](https://github.com/RogerPugaRuiz/guiders-sdk/issues)

## ➡️ Próximos Pasos

Una vez que tengas el tracking básico funcionando:

1. 📚 [Leer la documentación completa](./PIXEL_ES.md)
2. 🎨 [Personalizar eventos](./API_REFERENCE.md)
3. 📊 [Configurar analytics avanzado](./ADVANCED_CONFIG.md)
4. 🔧 [Integrar con tu CRM](./INTEGRATIONS.md)

---

¿Todo funcionando? 🎉 ¡Perfecto! Ahora tienes tracking inteligente en tu sitio web.