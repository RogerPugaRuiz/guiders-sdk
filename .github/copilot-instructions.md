## Guiders SDK – Guía Rápida para Agentes IA
Objetivo: evolucionar un SDK de tracking + chat tiempo real (TypeScript, bundle UMD `dist/index.js`, global `GuidersPixel`) manteniendo compatibilidad v1 mientras se impulsa v2 (heurística + Chat API v2).

### Arquitectura (mapa mental)
- `core/`: orquestación y estado runtime (`tracking-pixel-SDK.ts` punto de entrada; managers: tokens, sesión, bot, heurística, DOM). Mantener side effects mínimos aquí y centralizar limpieza vía `cleanup()`.
- `pipeline/`: procesamiento inmutable de eventos. Orden fijo: time-stamp → token → url → session → metadata → validation → side-effect. Sólo `side-effect-stage.ts` puede hacer IO. Nuevos enriquecimientos = nuevo Stage puro antes de `validation`.
- `services/`: acceso red + WebSocket. `chat-v2-service.ts` intenta `/api/v2/...` y hace fallback silencioso a v1 adaptando al shape legacy (no filtrar en UI). Nunca importar componentes de `presentation/` aquí.
- `presentation/`: UI del chat (lazy, oculta hasta interacción o disponibilidad comercial). No lógica de tokens / heurística.
- `types/`: reutilizar tipos; agregar nuevos exportándolos en `types/index.ts` y evitando duplicados.

### Patrones Clave
1. Descubrimiento de apiKey: script `data-api-key` → query `?apiKey=` → `window.GUIDERS_CONFIG`. Cualquier refactor preserva los 3. Endpoints ahora se resuelven centralmente en `core/endpoint-resolver.ts` (orden: `window.GUIDERS_CONFIG` > env (`GUIDERS_SDK_ENDPOINT`, `GUIDERS_SDK_WS_ENDPOINT`, variantes `VITE_`) > fallback prod/dev). Desde la actualización X soporta query `?dev` (en la URL de la página o en el `<script src>` del SDK) para forzar modo desarrollo; por defecto (sin `?dev`) se asume producción aunque `NODE_ENV` no venga definido. Cualquier valor distinto de `0` o `false` activa dev. El fallback dev ahora es `http://localhost:3000/api` (manteniendo simetría con producción que siempre incluye `/api`). No hardcodear `localhost:3000` / IPs directamente en servicios: usar `EndpointManager.getInstance().getEndpoint()` o `resolveDefaultEndpoints()`. El plugin WP pasa `preventAutoInit` para evitar doble inicialización.
2. Heurística: usar `enableAutomaticTracking()` (v2). Nuevas reglas en `heuristic-element-detector.ts`; runtime tuning con `updateHeuristicConfig()` / `setHeuristicEnabled()`. No exigir `data-track-event` salvo fallback.
3. Bot gating: ejecutar `BotDetector` antes de instanciar UI o abrir sockets. Early exit si `isBot` sin lanzar excepciones (log prefijado ❌).
4. Sesión: `session-tracking-manager.ts` evita `session_end` en refresh. Verificar cambios con `examples/quick-test.html` tras modificar heartbeat/inactividad.
5. Chat lazy: nunca mostrar `chat.ts` antes de interacción; retrasar carga pesada hasta primer open. Reconexión WebSocket silenciosa (`console.warn` en fallos recuperables).
6. Fallback API Chat: atrapar errores v2; mapear a formato v1 en el service (ej. normalizar `participants`, `messages`, `unread`). No hacer branching en UI.
7. Pipeline purity: cualquier necesidad de llamar red / console / storage va en `side-effect-stage`. Si un Stage retorna `null` se corta el flujo (documentar motivo en log 📊/❌).

### Contratos & Ejemplos
Nuevo Stage:
```ts
class GeoEnrichmentStage implements PipelineStage {
  process(evt) { /* pura: sin fetch/localStorage/DOM */ return { ...evt, geo: {/*...*/} }; }
}
// Registrar antes de validation y después de url/session.
```
Regla heurística custom:
```ts
heuristicDetector.addCustomRules('mi_evento', [
  { selector:'button', confidence:0.9, textPatterns:['comprar'] }
]);
```
Uso fallback chat (implícito):
```ts
const chat = await ChatV2Service.getInstance().getChatById(id); // Interno: try v2 → adapt v1
```

### Desarrollo Diario
- Instalar deps: `npm install` (task: Install Dependencies).
- Dev server: `npm start` (hot reload :8081).
- Build prod: `npm run build` (genera `dist/index.js`).
- Tests unitarios: task "Run Unit Tests"; cobertura: "Test Coverage".
- Tipos estrictos: "Validate Types" (`tsc --noEmit --strict`).
- Lint & format: tasks "Lint Code" / "Format Code" antes de PR.
- Tamaño bundle: "Check Bundle Size" o "Analyze Bundle" tras cambios de dependencias.
- Validar sesión: abrir `examples/quick-test.html` o demo PHP `demo/app`.

### Logging & Estilo
- Prefijos emoji: 🚀 init, 📊 tracking, 💬 chat, 🔍 heurística, 📡 socket, ❌ warn/error. Añadir nuevos sólo si se documentan aquí.
- No `throw` en flujo usuario; devolver temprano + log ❌. Excepciones sólo en paths internos imposibles.
- Evitar dependencias >10KB min+gzip salvo justificación (añadir nota en PR). Reutilizar utilidades existentes.
- Siempre exponer nuevas capacidades como opt‑in (no romper `window.guiders.*`).

### Checklist Pre-PR
1. `npm run build` sin warnings críticos.
2. `npx tsc --noEmit --strict` limpio.
3. ESLint sin errores tras `--fix`.
4. Tests verdes (incluye cobertura si tocaste lógica core/pipeline).
5. Bundle size dentro de presupuesto (ver tarea analyzer).
6. Chat y tracking básico funcionan sin heurística (compat v1).

### Anti‑Patrones (rechazar en review)
- IO dentro de Stages no side-effect.
- Lógica de red dentro de `presentation/`.
- Duplicar tipos ya definidos.
- Branching de compatibilidad v1/v2 en UI (debe vivir en services adaptadores).
- Bloquear inicialización por error recuperable (tokens, socket, heurística).

### Debug Rápido
```ts
console.log({
  tokens: TokenManager.hasValidTokens(),
  ws: window.guiders.webSocket?.isConnected(),
  chatVisible: window.guiders.chatUI?.isVisible(),
  heuristic: window.guiders.heuristicEnabled
});
new BotDetector().detect().then(r=>console.log(r));
// Consultar endpoints efectivos
import { resolveDefaultEndpoints } from '@/core/endpoint-resolver';
console.log(resolveDefaultEndpoints());
```

Actualiza este archivo si: cambias orden del pipeline, añades Stage global, agregas eventos WebSocket nuevos (definir en `websocket-service.ts`), o amplías API pública.

¿Sección confusa o faltante? Pide aclaración concreta y se iterará.

---
### Workflow Release Plugin WordPress (sincronizar SDK → plugin)
Ruta rápida (automatizada):
1. Actualiza versión:
  - Editar cabecera + constante en `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php` (Version / GUIDERS_WP_PLUGIN_VERSION).
  - Editar `Stable tag:` y añadir bloque nuevo arriba del changelog en `wordpress-plugin/guiders-wp-plugin/readme.txt`.
2. Ejecutar script completo:
  - `npm run release:wp:publish` (hace build → copia bundle → genera ZIP → git add (plugin.php, readme, bundle, ZIP) → commit → crea tag `v<version>` si no existe → push main + tag).
3. GitHub Actions:
  - Workflow `Release WordPress Plugin` se dispara con tags `v*` (stable) y valida que el tag == header `Version:`; si difiere falla.
  - Pre-releases (`vX.Y.Z-alpha.N`, `-beta.N`, `-rc.N`) disparan `Pre-Release WordPress Plugin` (misma validación + marca prerelease true).
4. Release automático:
  - Genera notas desde el bloque del changelog detectado o fallback genérico.
  - Adjunta `guiders-wp-plugin-<version>.zip` al Release.

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

Cuándo actualizar este bloque:
- Añades/renombras scripts de release.
- Cambias lógica de validación en workflows.
- Modificas nombre/ubicación del ZIP o archivos añadidos al commit.
- Introduces un paso adicional (firma, checksum, etc.).

---
### Context7 (cuándo leer docs externas)
Usar solo si falta en repo y afecta decisión (APIs Angular 20, signals avanzados, DI tree-shakable, Jest timers). Proceso: buscar local → si falta `resolve-library-id` → `get-library-docs(topic)` tokens ≤6000 → resumir y aplicar citando ("Context7: signals"). No para sintaxis básica.

### Playwright MCP
Mantener prompts concisos (≤8 líneas). Incluir: Objetivo, URL inicial, pasos clave, selectores críticos, datos a capturar, criterio de éxito, límites.