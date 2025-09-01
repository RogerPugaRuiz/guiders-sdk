# Guiders SDK

SDK para la integración del sistema de guías y chat en sitios web.

## Instalación

```bash
npm install guiders-pixel
```

## Uso básico

```html
<script src="path/to/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>
```

O bien, pasando la API key como parámetro:

```html
<script src="path/to/guiders-sdk.js?apiKey=YOUR_API_KEY"></script>
```

## Características

- **Detección heurística inteligente** - Localización automática de elementos sin modificar HTML
- **Detección de página por URL** - Identificación automática del tipo de página basada en la URL  
- Tracking de eventos
- Chat en vivo con inicialización optimizada
- Notificaciones
- Tracking DOM

## 🎯 Detección Heurística Inteligente (Nuevo)

El SDK ahora incluye un sistema de **detección heurística inteligente** que localiza automáticamente elementos relevantes en las páginas sin necesidad de modificar el HTML del cliente. Esto facilita enormemente la integración en WordPress, Shopify y otros CMS.

### Ventajas principales

- ✅ **Sin modificaciones HTML** - No es necesario añadir atributos `data-track-event`
- ✅ **Fácil integración** - Funciona automáticamente en WordPress, WooCommerce, Shopify
- ✅ **Detección inteligente** - Usa patrones CSS, texto y contexto para identificar elementos
- ✅ **Detección por URL** - El tipo de página se detecta automáticamente por la URL
- ✅ **Altamente configurable** - Umbrales de confianza y reglas personalizables

### Uso básico (automático)

```html
<!-- Simplemente incluye el SDK, sin necesidad de atributos especiales -->
<script src="path/to/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>

<!-- Elementos que se detectan automáticamente -->
<button>Añadir al carrito</button>
<button>Contactar concesionario</button>
<button type="submit">Buscar</button>
<a href="/cart">Ver carrito</a>
```

### Eventos detectados automáticamente

El sistema detecta automáticamente estos tipos de eventos:

| Evento | Detecta elementos que... |
|--------|--------------------------|
| `add_to_cart` | Contienen texto "añadir", "agregar", "add cart" o clases relacionadas con "cart" |
| `contact_dealer` | Contienen texto "contactar", "concesionario", "dealer" o están en contexto de contacto |
| `purchase` | Contienen texto "comprar", "buy", "checkout", "pagar" |
| `search_submit` | Son botones de envío en formularios de búsqueda |
| `schedule_test_drive` | Contienen texto "prueba", "test drive", "cita" en contexto automotriz |
| `request_quote` | Contienen texto "cotizar", "presupuesto", "quote", "solicitar" |
| `view_product` | Enlaces o elementos en contexto de productos |
| `view_cart` | Enlaces o elementos relacionados con carrito |
| `download_brochure` | Enlaces a PDFs o con texto "descargar", "brochure", "folleto" |

### Detección de página por URL

El sistema detecta automáticamente el tipo de página basándose en la URL:

```javascript
// Estas URLs se detectan automáticamente:
'/' → 'home'
'/ecommerce' → 'ecommerce'  
'/product/123' → 'product_detail'
'/vehicle-search' → 'vehicle_search'
'/contact' → 'contact'
// ... y muchas más
```

### Configuración avanzada

```javascript
import { TrackingPixelSDK } from 'guiders-pixel';

const sdk = new TrackingPixelSDK({
  apiKey: 'YOUR_API_KEY',
  // Configuración de detección heurística
  heuristicDetection: {
    enabled: true,
    config: {
      enabled: true,
      confidenceThreshold: 0.7, // Confianza mínima (0-1)
      fallbackToManual: true     // Usar sistema manual si falla
    }
  }
});

await sdk.init();
sdk.enableAutomaticTracking(); // Usar el nuevo método
```

### Personalización de reglas

```javascript
// Añadir reglas personalizadas
const heuristicDetector = sdk.getHeuristicDetector();
heuristicDetector.addCustomRules('mi_evento_custom', [
  {
    selector: 'button',
    confidence: 0.9,
    textPatterns: ['mi_texto_especial'],
    contextSelectors: ['.mi-contexto']
  }
]);
```

### Configuración de umbral de confianza

```javascript
// Ajustar configuración en tiempo real
sdk.updateHeuristicConfig({
  confidenceThreshold: 0.8, // Más estricto
  enabled: true
});
```

### Migración desde el sistema anterior

**Antes (sistema data-track-event):**
```html
<button data-track-event="add_to_cart" data-product-id="123">
  Añadir al carrito
</button>
```

**Ahora (detección automática):**
```html
<!-- ¡No necesitas atributos especiales! -->
<button>Añadir al carrito</button>
```

### Demo en vivo

Visita la página `/heuristic-demo` en la aplicación demo para ver la detección heurística en acción con ejemplos interactivos.

## Chat en vivo

El chat utiliza un sistema de inicialización lazy que garantiza que permanezca completamente oculto hasta que el usuario haga clic en el botón toggle. 

### Funcionamiento de la inicialización

1. **Inicialización silenciosa**: El chat se inicializa en segundo plano sin mostrarse
2. **Carga diferida**: El contenido del chat (mensajes de bienvenida e iniciales) solo se carga cuando el usuario abre el chat por primera vez
3. **Sin parpadeo**: Elimina el problema donde el chat se mostraba brevemente antes de ocultarse

### Personalización del chat

```javascript
// El chat se inicializa automáticamente y permanece oculto
// hasta que el usuario interactúe con el botón toggle
```

## Detección de bots

El SDK incluye un sistema de detección de bots para evitar que se inicialice en visitantes que probablemente sean bots o crawlers. La detección se realiza automáticamente y, si se identifica un bot, el SDK no se iniciará.

### Cómo funciona la detección

La detección de bots realiza varias comprobaciones:

1. **User Agent**: Comprueba si el User Agent contiene palabras clave típicas de bots (como "bot", "crawler", "spider", etc.)
2. **Características del navegador**: Detecta anomalías en las características del navegador (como webdriver activo, falta de plugins, etc.)
3. **Tiempos de carga**: Identifica cargas de página sospechosamente rápidas
4. **Comportamiento**: Monitoriza interacciones del usuario durante el primer segundo

El resultado se calcula como una probabilidad. Si la probabilidad es superior al 60%, se considera un bot y el SDK no se inicia. La detección se realiza rápidamente (en 1 segundo) para no retrasar la aparición del chat.

### Personalización de la detección

Si necesitas personalizar la detección de bots, puedes crear tu propia instancia del `BotDetector` y utilizarla antes de inicializar manualmente el SDK:

```javascript
import { BotDetector, TrackingPixelSDK } from 'guiders-pixel';

// Opciones del SDK
const options = {
  apiKey: 'YOUR_API_KEY',
  // Otras opciones...
};

// Comprobar si es un bot antes de inicializar
const detector = new BotDetector();
detector.detect().then(result => {
  if (!result.isBot) {
    // Solo inicializar para usuarios legítimos
    const sdk = new TrackingPixelSDK(options);
    sdk.init().then(() => {
      // SDK inicializado correctamente
    });
  } else {
    console.log('Bot detectado. No se inicializa el SDK.');
  }
});
```

## Cambios recientes

## Ejemplos / Demos

Se han movido los archivos de prueba a la carpeta `examples/` para mantener la raíz limpia.

Ejemplo rápido de verificación de eventos de sesión:

1. Inicia el servidor de pruebas estático:

  ```bash
  npx http-server -p 8080 -o
  ```

1. Abre: <http://localhost:8080/examples/quick-test.html>

1. Sigue las instrucciones en pantalla para validar que no se emite `session_end` en refrescos o navegación.

También puedes usar la task de VS Code "Open Test Demo" que abre automáticamente la página.

---

### v2.0.0 - Detección Heurística Inteligente (BREAKING CHANGES)

- **🎯 Nueva funcionalidad**: Sistema de detección heurística inteligente
  - Localización automática de elementos sin modificar HTML del cliente
  - Compatible con WordPress, WooCommerce, Shopify y otros CMS
  - Detección basada en patrones CSS, texto y contexto
- **📄 Detección de página por URL**: Reemplaza la detección basada en elementos HTML
  - Identificación automática del tipo de página por URL
  - Metadatos enriquecidos automáticamente
- **⚠️ BREAKING CHANGE**: Nuevo método `enableAutomaticTracking()` reemplaza `enableDOMTracking()`
- **🔧 Configuración avanzada**: Umbrales de confianza y reglas personalizables
- **👁️ Modo desarrollo**: Indicadores visuales para elementos detectados
- **🚀 Habilitado por defecto**: La detección heurística está activa automáticamente

### Migración v1.x → v2.0

1. **Método de activación (recomendado)**:
   ```javascript
   // Antes
   sdk.enableDOMTracking();
   
   // Ahora (recomendado)
   sdk.enableAutomaticTracking();
   ```

2. **Eliminación de atributos data-track-event** (opcional):
   ```html
   <!-- Antes -->
   <button data-track-event="add_to_cart">Añadir</button>
   
   <!-- Ahora (funciona automáticamente) -->
   <button>Añadir al carrito</button>
   ```

3. **Los atributos data-track-event siguen funcionando** para compatibilidad, pero no son necesarios.

### v1.1.0 - Mejoras en la inicialización del chat

- **Solucionado**: El chat ya no se muestra brevemente durante la inicialización
- **Optimización**: Implementado sistema de carga lazy para el contenido del chat
- **Mejora UX**: El chat permanece completamente oculto hasta que el usuario lo active explícitamente
- **Rendimiento**: Reducido el tiempo de inicialización al diferir la carga de mensajes hasta que sea necesario

### Detalles técnicos

La solución implementa:
1. Inicialización en dos fases: estructura del chat + contenido diferido
2. Carga de mensajes solo cuando el chat se muestra por primera vez
3. Eliminación del parpadeo visual durante la inicialización
4. Mantiene la funcionalidad completa del chat sin afectar la experiencia del usuario

## Licencia

ISC

## 📦 Flujo de Release / Sincronización Plugin WordPress

Cuando se actualiza el bundle `dist/index.js` (nueva versión interna del SDK) y se desea publicar la actualización en el plugin de WordPress, seguir este proceso ordenado:

### 1. Verificar / Ajustar versión

1. Determina el nuevo número de versión del plugin (semver). Si solo cambió el bundle sin cambios funcionales de interfaz pública del plugin, usar patch (ej: 1.0.0 → 1.0.1).

2. Edita `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php`:

- Cabecera: `Version: 1.0.x`
- Constante: `GUIDERS_WP_PLUGIN_VERSION`

3. Edita `wordpress-plugin/guiders-wp-plugin/readme.txt`:

- `Stable tag: 1.0.x`
- Añade entrada en `== Changelog ==` al inicio.

### 2. Construir y sincronizar bundle

```bash
npm run build
cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js
```

### 3. Generar ZIP distribuible

Desde la carpeta `wordpress-plugin/` (o en raíz ajustando ruta):

```bash
cd wordpress-plugin
zip -r guiders-wp-plugin-<version>.zip guiders-wp-plugin -x "*.DS_Store"
```

Archivo resultante recomendado: `wordpress-plugin/guiders-wp-plugin-<version>.zip`.

### 4. Commit y tag

```bash
git add wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php \
      wordpress-plugin/guiders-wp-plugin/readme.txt \
      wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js
git commit -m "chore(wordpress-plugin): bump plugin version to <version> and sync SDK bundle"

# (opcional) incluir el ZIP en el repo
git add wordpress-plugin/guiders-wp-plugin-<version>.zip
git commit -m "chore(wordpress-plugin): add distribution zip for <version>"

git tag v<version>
git push origin main
git push origin v<version>
```

Sugerencia: en lugar de commitear el ZIP, también puedes adjuntarlo como asset en un *GitHub Release* (más limpio del historial git). El flujo actual admite ambas modalidades.

### 5. Publicar / Actualizar en WordPress

Lista rápida:

- Subir el ZIP a un sitio WordPress (Plugins → Añadir nuevo → Subir) para validar.
- Para WordPress.org (cuando proceda) sincronizar `readme.txt` y tag.

### 6. Checklist rápida

- [ ] Versión actualizada en cabecera y constante
- [ ] Stable tag actualizado
- [ ] Changelog con entrada nueva arriba
- [ ] Bundle copiado a `assets/js/guiders-sdk.js`
- [ ] ZIP generado
- [ ] Tag git creado y pusheado

### 7. Automatización futura (ideas)

- Script `npm run release:wp <version>` que ejecute los pasos 2–4.
- GitHub Action que genere el ZIP y cree el Release al pushear un tag `v*`.

---
