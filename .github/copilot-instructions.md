## Guiders SDK – Guía para Agentes IA

SDK de tracking + chat en tiempo real. TypeScript → UMD bundle (`dist/index.js`, global `GuidersPixel`). Mantener compatibilidad v1 mientras evoluciona v2 (heurística + Chat API v2).

### Arquitectura

**Separación de responsabilidades (crítico mantener):**
- `core/` → Orquestación, state, managers (tokens, sesión, bot, heurística, horarios). **Minimizar side effects**.
- `pipeline/` → **Procesamiento inmutable** de eventos. Orden fijo: time-stamp → token → url → session → metadata → validation → **side-effect**.
  - Solo `side-effect-stage.ts` hace IO (red, console, localStorage)
  - Implementar `PipelineStage<I,O>` con `process(input: I): O`
  - Stage retorna `null` = corta flujo (log motivo)
- `services/` → Red + WebSocket. **Nunca importar `presentation/`**.
  - `chat-v2-service.ts`: intenta v2, fallback silencioso a v1 (adaptar shape en service, no en UI)
  - `WebSocketService`: Singleton Socket.IO, salas, reconexión, auth dual (JWT/cookies)
  - Híbrido: **envío HTTP POST** → **recepción WebSocket** `message:new`
- `presentation/` → UI lazy (carga al interactuar). Sin lógica de tokens/sesión.
- `types/` → Centralizar tipos, exportar en `types/index.ts`


### Patrones No Obvios (requieren conocer múltiples archivos)

**1. Endpoint Resolution** (`core/endpoint-resolver.ts`)
- Triple discovery: `window.GUIDERS_CONFIG` > env vars (`GUIDERS_SDK_ENDPOINT`, `VITE_*`) > fallback
- Query param `?dev` fuerza modo dev (en URL página o `<script src="...?dev">`). Default: **producción**.
- Dev fallback: `http://localhost:3000/api` (misma estructura `/api` que prod)
- **Usar siempre** `EndpointManager.getInstance().getEndpoint()`. Nunca hardcodear IPs.

**2. API Key Discovery** (orden de prioridad)
- Script tag: `<script data-api-key="...">`
- Query param: `?apiKey=...`
- Global: `window.GUIDERS_CONFIG.apiKey`

**3. Bot Gating** (`core/bot-detector.ts`)
- Ejecutar `BotDetector` **antes** de UI/sockets. Early exit si `isBot` (sin excepciones).
- Log prefijo ❌ para bots detectados.

**4. Session Tracking** (`session-tracking-manager.ts`)
- **Evita `session_end` falso** en refresh/navegación interna.
- Validar cambios con `examples/quick-test.html`.

**5. Heurística v2** (`heuristic-element-detector.ts`)
- Usar `enableAutomaticTracking()` (no `enableDOMTracking`).
- Runtime tuning: `updateHeuristicConfig()`, `setHeuristicEnabled()`.
- Fallback a `data-track-event` manual si falla.

**6. Active Hours** (`core/active-hours-validator.ts`)
- Timezone `'auto'` → detecta `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Rangos cruzan medianoche OK (ej: `22:00-06:00`).
- Validar **antes** de inicializar chat UI.

**7. Filtrado WebSocket** (`realtime-message-manager.ts`)
- Ignora automáticamente mensajes cuyo `senderId === visitorId` (evita duplicados optimistic UI).

**8. Auth Modes** (`core/token-manager.ts`)
- Default: `authMode: 'session'` (cookie HttpOnly via `/api/visitors/identify`).
- Legacy: `authMode: 'jwt'` usa `/pixel/token` (renovación completa, sin refresh incremental).

**9. Init Protection**
- Guard `window.__GUIDERS_INITIALIZING__` previene race conditions.
- Compatible WP Rocket events (`rocket-script-loaded`, `rocket-loaded`).
- Config `preventAutoInit` desactiva auto-inicio.


### Ejemplos de Código (patrones específicos del proyecto)

**Nuevo Pipeline Stage:**
```ts
class GeoEnrichmentStage implements PipelineStage {
  process(evt) { 
    // Pura: sin fetch/localStorage/DOM
    return { ...evt, geo: { country: 'ES' } }; 
  }
}
// Registrar antes de validation, después de url/session
```

**Custom Heuristic Rule:**
```ts
heuristicDetector.addCustomRules('compra', [
  { selector: 'button.checkout', confidence: 0.9, textPatterns: ['comprar', 'buy'] }
]);
```

**Configurar Active Hours con timezone auto:**
```ts
window.GUIDERS_CONFIG = {
  activeHours: {
    enabled: true,
    timezone: 'auto', // detecta Intl timezone
    ranges: [{ start: '08:00', end: '17:00' }]
  }
};
```

### Comandos Esenciales (no obvios del package.json)

```bash
# Dev (webpack hot reload :8081)
npm start

# Build prod (genera dist/index.js UMD)
npm run build

# E2E Tests (requiere PHP demo :8083)
php -S 127.0.0.1:8083 -t demo/app  # terminal 1
npm test                            # terminal 2

# Tests interactivos
npm run test:ui
npm run test:debug

# Validación estricta de tipos
npx tsc --noEmit --strict

# WordPress plugin release (completo: build→zip→git tag→push)
npm run release:wp:publish

# Quick tests (validar sesión/tracking sin servidor)
open examples/quick-test.html
```

### Logging

Prefijos emoji estandarizados: 🚀 init, 📊 tracking, 💬 chat, 🔍 heurística, 📡 socket, 🕐 active hours, ❌ warn/error. Documentar aquí si añades nuevos.

### Anti‑Patrones (rechazar en review)

- IO dentro de Stages no side-effect.
- Lógica de red dentro de `presentation/`.
- Duplicar tipos ya definidos.
- Branching de compatibilidad v1/v2 en UI (debe vivir en services adaptadores).
- Bloquear inicialización por error recuperable (tokens, socket, heurística).
- Hardcodear timezones en lugar de usar detección automática cuando sea apropiado.
- Validar horarios activos en UI (debe validarse en `ActiveHoursValidator`).
- Múltiples instancias de WebSocket o Singleton managers (usar `.getInstance()`).
- Importar `presentation/` desde `services/` o `core/` (violación separación capas).

### Debug Rápido

```ts
console.log({
  tokens: TokenManager.hasValidTokens(),
  ws: window.guiders.webSocket?.isConnected(),
  chatVisible: window.guiders.chatUI?.isVisible(),
  heuristic: window.guiders.heuristicEnabled,
  activeHours: window.guiders.trackingPixelSDK.getActiveHoursConfig(),
  chatActive: window.guiders.trackingPixelSDK.isChatActive()
});
new BotDetector().detect().then(r=>console.log(r));
// Consultar endpoints efectivos
import { resolveDefaultEndpoints } from '@/core/endpoint-resolver';
console.log(resolveDefaultEndpoints());
// Probar diferentes timezones
window.guiders.trackingPixelSDK.updateActiveHoursConfig({
  enabled: true, timezone: 'Asia/Tokyo', ranges: [{ start: '09:00', end: '17:00' }]
});
```

Actualiza este archivo si: cambias orden del pipeline, añades Stage global, agregas eventos WebSocket nuevos (definir en `websocket-service.ts`), amplías API pública, o modificas lógica de horarios activos.

¿Sección confusa o faltante? Pide aclaración concreta y se iterará.

---
### Workflow Release Plugin WordPress (sincronizar SDK → plugin)

**Sistema de Actualizaciones**: El plugin usa **[Plugin Update Checker v5.6](https://github.com/YahnisElsts/plugin-update-checker)** (estándar de la industria) para detectar y aplicar actualizaciones automáticamente desde GitHub Releases. Ver documentación completa en `wordpress-plugin/PLUGIN_UPDATES.md`.

**Filosofía SemVer**: alpha → beta → rc → stable. Cada fase con misma base de versión (ej: 1.0.8-alpha.1 → 1.0.8-beta.1 → 1.0.8-rc.1 → 1.0.8). No saltar de 1.0.8-beta.X a 1.0.9-rc.1 sin justificación explícita.

**Fases de pre-release**:
- **Alpha** (`-alpha.N`): Features nuevas experimentales, API inestable, cambios frecuentes permitidos
- **Beta** (`-beta.N`): Features completas, API casi estable, testing más amplio, solo bug fixes moderados
- **RC** (`-rc.N`): Feature freeze total, solo critical bug fixes, preparación final para stable

**Prompts especializados**: El directorio `.github/prompts/` contiene guías paso a paso:
- `alpha-release.prompt.md`: Para crear nuevas versiones alpha (features en desarrollo)
- `beta-release.prompt.md`: Para transicionar de alpha a beta (features completas, testing amplio)
- `rc-release.prompt.md`: Para crear Release Candidates (feature freeze, solo fixes)
- `release.prompt.md`: Para publicar versión stable final

Usa estos prompts con agentes IA para asegurar proceso correcto y evitar errores comunes de versionado.

**Detección automática de actualizaciones**:
- **Stable releases** (sin sufijo `-alpha/-beta/-rc`): Plugin Update Checker las detecta automáticamente cada 12h. WordPress muestra notificación y permite actualización con 1 clic.
- **Pre-releases** (con sufijo): NO se detectan automáticamente (filtradas). Solo disponibles para descarga manual desde GitHub Releases.
- Configuración en `wordpress-plugin/guiders-wp-plugin/includes/class-guiders-updater.php`.

Ruta rápida (automatizada):
1. Actualiza versión:
  - Editar cabecera + constante en `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php` (Version / GUIDERS_WP_PLUGIN_VERSION).
  - Editar `Stable tag:` y añadir bloque nuevo arriba del changelog en `wordpress-plugin/guiders-wp-plugin/readme.txt`.
  - Formato changelog: `= X.Y.Z-alpha.N =` con prefijo `[ALPHA]` en items, `[BETA]` para beta, sin prefijo en stable.
2. Ejecutar script completo:
  - `bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release X.Y.Z-alpha.N"` (hace build → copia bundle → genera ZIP → git add → commit → tag → push).
  - Script acepta mensaje custom o genera por defecto basado en versión.
3. GitHub Actions (automático al push tag):
  - Workflow `Pre-Release WordPress Plugin` para tags con sufijo (`-alpha`, `-beta`, `-rc`).
  - Workflow `Release WordPress Plugin` para tags stable (sin sufijo).
  - Validación: el tag debe coincidir exactamente con `Version:` en header del plugin (falla si difiere).
4. Release automático:
  - Genera notas desde el bloque del changelog o fallback genérico.
  - Adjunta `guiders-wp-plugin-<version>.zip` al Release (OBLIGATORIO para Plugin Update Checker).
  - Pre-releases marcados con flag `prerelease: true` en GitHub.
  - **Importante**: Plugin Update Checker busca automáticamente el asset `.zip` que coincida con el patrón `/guiders-wp-plugin.*\.zip$/i`.

Ruta manual (fallback / debug):
1. Build SDK: `npm run build`.
2. Copiar bundle: `cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js`.
3. Generar ZIP: `bash wordpress-plugin/build-plugin.sh --skip-build` (o sin `--skip-build` para reconstruir).
4. Commit + tag + push manuales (ver pasos anteriores, deben alinear versión y tag).

Scripts disponibles:
- `release:wp` → build + zip (sin commit/tag).
- `release:wp:skip` → zip reutilizando build existente.
- `release:wp:publish` → flujo completo (build/zip/commit/tag/push) usado para releases normales.

Reglas importantes:
- Nunca retaggear versiones publicadas salvo caso excepcional documentado; preferir nueva versión (ej. 1.0.2 → 1.0.3).
- CI fallará si el tag no coincide con `Version:` (y `Stable tag:` debe estar alineado o el flujo humano se considera incorrecto incluso si CI no lo valida explícitamente).
- Pre-releases siempre deben tener la misma versión exacta (incluyendo sufijo) en header si queremos pasar la validación; actualmente sólo validamos coincidencia exacta tag/header (no se edita auto).
- **CRÍTICO**: El workflow DEBE adjuntar el ZIP al Release. Sin asset, Plugin Update Checker no puede descargar la actualización. Verificar que GitHub Actions adjunta `guiders-wp-plugin-<version>.zip` correctamente.

Cuándo actualizar este bloque:
- Añades/renombras scripts de release.
- Cambias lógica de validación en workflows.
- Modificas nombre/ubicación del ZIP o archivos añadidos al commit.
- Introduces un paso adicional (firma, checksum, etc.).
- Modificas configuración de Plugin Update Checker (periodo verificación, filtros, etc.).

