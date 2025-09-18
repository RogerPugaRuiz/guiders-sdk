# Guiders SDK

SDK para la integración del sistema de guías y chat en sitios web.

## Índice

1. [Instalación](#instalación)
1. [Uso básico](#uso-básico)
1. [Características](#características)
1. [🎯 Detección Heurística Inteligente (Nuevo)](#-detección-heurística-inteligente-nuevo)
1. [Chat en vivo](#chat-en-vivo)
1. [API Chat V2 (Nuevo)](#api-chat-v2-nuevo)
1. [Detección de bots](#detección-de-bots)
1. [Cambios recientes](#cambios-recientes)
1. [Ejemplos / Demos](#ejemplos--demos)
1. [v2.0.0 - Detección Heurística Inteligente (BREAKING CHANGES)](#v200---detección-heurística-inteligente-breaking-changes)
1. [Migración v1.x → v2.0](#migración-v1x--v20)
1. [v1.1.0 - Mejoras en la inicialización del chat](#v110---mejoras-en-la-inicialización-del-chat)
1. [Detalles técnicos](#detalles-técnicos)
1. [Licencia](#licencia)
1. [📦 Flujo de Release / Sincronización Plugin WordPress](#-flujo-de-release--sincronización-plugin-wordpress)
 1. [Autenticación de Tokens](#autenticación-de-tokens)

## Instalación

### Opción 1: NPM / Bundlers

```bash
npm install guiders-pixel
```

Importa luego en tu código (TypeScript / ES Modules):

```javascript
import { TrackingPixelSDK } from 'guiders-pixel';
```

### Opción 2: Script Tag Directo / CDN

Incluye el bundle (local, CDN propio o distribuido por tu infraestructura) y pasa la API key vía atributo, query param o `window.GUIDERS_CONFIG`.

Ejemplos:

```html
<!-- Método A: atributo data-api-key -->
<script src="https://cdn.tu-dominio.com/guiders-sdk.js" data-api-key="YOUR_API_KEY"></script>

<!-- Método B: query param apiKey (útil si se inyecta dinámicamente) -->
<script src="https://cdn.tu-dominio.com/guiders-sdk.js?apiKey=YOUR_API_KEY"></script>

<!-- Método C: configuración global antes de cargar el script -->
<script>
  window.GUIDERS_CONFIG = {
    apiKey: 'YOUR_API_KEY',
    endpoint: 'https://api.tu-backend.com',          // opcional
    webSocketEndpoint: 'wss://api.tu-backend.com',   // opcional
    heuristicDetection: { enabled: true },
    sessionTracking: { enabled: true }
  };
</script>
<script src="https://cdn.tu-dominio.com/guiders-sdk.js" defer></script>

<!-- Activación opcional al cargar (si necesitas forzar heurística tras load diferido) -->
<script>
  window.addEventListener('guiders:ready', () => {
    // El SDK expone window.guiders
    window.guiders.enableAutomaticTracking();
  });
  // Fallback simple si no se emite el evento (versiones antiguas)
  window.addEventListener('load', () => {
    if (window.guiders && !window.guiders.__AUTO_ENABLED__) {
      try { window.guiders.enableAutomaticTracking(); } catch(e) { console.warn('Guiders init fallback', e); }
    }
  });
</script>
```

Carga asíncrona avanzada (lazy) manteniendo orden lógico:

```html
<script>
  window.GUIDERS_CONFIG = { apiKey: 'YOUR_API_KEY', heuristicDetection: { enabled: true } };
  (function(){
    var s=document.createElement('script');
    s.src='https://cdn.tu-dominio.com/guiders-sdk.js';
    s.async=true; s.crossOrigin='anonymous';
    s.onload=function(){
      if (window.guiders) window.guiders.enableAutomaticTracking();
    };
    document.head.appendChild(s);
  })();
</script>
```

Notas:

- Usa `defer` si el script está en `<head>` y no necesitas ejecución antes de `DOMContentLoaded`.
- Con caché agresiva (WP Rocket / Cloudflare) el método C evita tener que tocar HTML cada rotación de clave.
- No mezcles simultáneamente atributo y `window.GUIDERS_CONFIG` con API keys distintas.

### Opción 3: Plugin WordPress (sin tocar código)

Si tu sitio es WordPress instala el plugin incluido en este repo (`wordpress-plugin/`). El plugin:

- Inserta automáticamente el script del SDK en el frontend
- Expone `window.GUIDERS_CONFIG` con tu API Key y configuración
- Permite activar/desactivar chat, tracking y heurística desde el panel
- Evita duplicar inicializaciones (protección contra cachés / minificadores)

Pasos rápidos (instalación manual desde este repositorio):

1. Genera / usa el ZIP existente en `wordpress-plugin/guiders-wp-plugin-<version>.zip` (o ejecuta `npm run release:wp:publish` para crear uno nuevo).
1. En tu admin WP: Plugins → Añadir nuevo → Subir plugin → Selecciona el ZIP → Instalar → Activar.
1. Ve a Ajustes → Guiders SDK, pega tu API Key y habilita las características.

Publicación en un entorno con acceso al sistema de archivos (sin ZIP):

1. Copia la carpeta `wordpress-plugin/guiders-wp-plugin` dentro de `wp-content/plugins/`.
1. Activa el plugin desde el listado de plugins.
1. Configura tu API Key.

Nota: Cuando uses el plugin NO necesitas añadir manualmente el `<script>`; sólo asegúrate de que el plugin esté activo y configurado.

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
- **API Chat V2** con paginación por cursor, filtros avanzados y métricas
- **Fallback transparente a API v1** (sin branching en tu código)
- **ChatV2Service** para operaciones avanzadas (asignar, métricas, cola, response time)
- **Tracking de sesión robusto** (evita falsos `session_end` en refresh, heartbeat configurable)
- **Toggles runtime** para heurística (`updateHeuristicConfig`, `setHeuristicEnabled`)
- **Workflow de release WordPress** automatizable (scripts y GitHub Actions)
- **Autenticación simplificada** (sin endpoints legacy /register ni /token/refresh)

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

## API Chat V2 (Nuevo)

La versión 2 incorpora endpoints optimizados (`/api/v2/chats`) con:

- Paginación por cursor
- Filtros avanzados (estado, prioridad, departamento, etc.)
- Métricas y estadísticas integradas (tiempos de respuesta, rendimiento comercial)
- Operaciones idempotentes (creación por PUT `{chatId}`)
- Cola de chats pendientes y asignación directa a comerciales
- Cierre de chats y métricas agregadas

### Uso rápido `ChatV2Service`

```javascript
import { ChatV2Service } from 'guiders-pixel';
const chatService = ChatV2Service.getInstance();

// Obtener un chat

// Lista de chats de visitante (cursor pagination)
const { chats, nextCursor, hasMore } = await chatService.getVisitorChats('visitor-123');

// Lista de chats de un comercial con filtros
const result = await chatService.getCommercialChats('commercial-999', null, 20, {
  status: ['ACTIVE','PENDING'],
  priority: ['HIGH','URGENT']
});

// Métricas y tiempos de respuesta
const metrics = await chatService.getCommercialMetrics('commercial-999');
const stats = await chatService.getResponseTimeStats();

// Asignar y cerrar
await chatService.assignChat('chat-id','commercial-999');
await chatService.closeChat('chat-id');
```

### Fallback Automático

Si la API v2 no está disponible el SDK usa silenciosamente la API v1 adaptando formatos (no necesitas condicionales). Para detectar disponibilidad:

```javascript
catch { console.log('Usando fallback v1'); }
```

### Migración y Detalles Ampliados

Consulta `MIGRATION_GUIDE_V2.md` y `README_V2.md` para una explicación profunda de tipos, rendimiento y roadmap de migración gradual.

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

### Novedades Clave (últimas iteraciones)

- 🚀 **API Chat V2**: Endpoints `/api/v2/chats` (cursor, filtros, métricas, asignación, cola, tiempos de respuesta)
- 🔄 **Fallback transparente**: Intento v2 → adaptación v1 sin branching en UI
- 🛠 **ChatV2Service**: Nuevo servicio centralizado para operaciones avanzadas de chat
- 📊 **Métricas y estadísticas**: `getCommercialMetrics`, `getResponseTimeStats`
- ✅ **Tracking de sesión robusto**: Previene `session_end` en refresh / navegación interna (ver demo `examples/quick-test.html`)
- 🎯 **Toggles heurísticos runtime**: `updateHeuristicConfig()` y `setHeuristicEnabled()` para tuning dinámico
- ♻️ **Creación idempotente de chats**: `createChat(chatId, payload)` por PUT
- 🧪 **Modo desarrollo heurístico**: Visualización opcional de elementos detectados (solo dev)
- 📦 **Flujo release plugin WordPress**: Scripts y Actions alineados con nueva guía de publicación
- 🧱 **Documentación de migración**: `MIGRATION_GUIDE_V2.md` y `README_V2.md` añadidos
- 🔐 **Simplificación flujo tokens**: Eliminados endpoints legacy `/pixel/register` y `/pixel/token/refresh`. Renovación completa ahora usa un único endpoint `/pixel/token`.

> Para un changelog detallado consulta la sección v2 más abajo o el archivo de migración.

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

## Autenticación de Tokens

El SDK usa un modelo simplificado de obtención y renovación de tokens.

### Antes (legacy, eliminado)

- Registro explícito vía `POST /api/pixel/register` devolvía `access_token` y `refresh_token`.
- Renovación incremental vía `POST /api/pixel/token/refresh` usando `refresh_token`.

### Ahora (modelo unificado / transición a sesión)

1. Se obtiene siempre un par de tokens llamando a `POST /api/pixel/token` pasando el fingerprint del visitante.
2. Al detectar que el `access_token` está por expirar, el SDK solicita un nuevo par completo al mismo endpoint (no se usa refresh incremental).
3. Se conservan los campos `access_token` y `refresh_token` sólo por compatibilidad de formato; el `refresh_token` ya no se envía a ningún endpoint.
4. (Nuevo) Modo `authMode: 'session'` evita por completo pedir el JWT y se basa únicamente en la cookie HttpOnly emitida por `/api/visitors/identify`.

### API interna relevante

```ts
import { TrackingPixelSDK } from 'guiders-pixel';

// Modo por defecto ahora: session (no solicitar JWT)
const sdk = new TrackingPixelSDK({
  apiKey: 'YOUR_API_KEY',
  authMode: 'session', // 'jwt' para compat si el backend aún requiere token
});
await sdk.init();
```

`TokenManager` (sólo activo en `authMode='jwt'`):

- Detecta expiración decodificando el JWT (`exp`).
- Si faltan <60s, llama de nuevo a `/pixel/token` y reemplaza ambos tokens.
- Ya no invoca endpoints de refresh ni register.

### Razones del cambio

- Menor complejidad cliente/servidor.
- Evita estados inconsistentes si el registro era inválido o la cuenta se eliminaba.
- Reduce latencia: una sola operación para renovar.

### Impacto para integradores

- Si usas `authMode='session'`: no se descarga ni decodifica ningún JWT, se omite el `TokenInjectionStage` en la pipeline.
- Si usas `authMode='jwt'`: se mantiene el ciclo de renovación completa vía `/pixel/token`.
- Logs: verás `[TrackingPixelSDK] 🔐 authMode=session` cuando esté activo el modo de sesión.
- No existían métodos públicos `registerClient` ni `refreshToken` (sólo internos), por lo que integradores no necesitan cambios.

### Futuras simplificaciones potenciales

- El backend podría dejar de enviar `refresh_token`; cuando ocurra, se limpiará el almacenamiento y tipos.
- Futuro: eliminación completa de `TokenManager` y `authMode='jwt'` una vez todos los clientes estén migrados.

---
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
