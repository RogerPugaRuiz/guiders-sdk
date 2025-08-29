## Guiders SDK – Instrucciones para Agentes IA
Objetivo: asistir en desarrollo de un SDK (tracking + chat tiempo real) en TypeScript empaquetado UMD (`dist/index.js`, lib global `GuidersPixel`). Mantén cambios enfocados, sin romper compatibilidad v1.

### Panorama Arquitectura
Capas clave en `src/`:
- core/: orquestación ( `tracking-pixel-SDK.ts` entry principal, `token-manager.ts`, `bot-detector.ts`, `heuristic-element-detector.ts`, `session-tracking-manager.ts`, `dom-tracking-manager.ts`, `enhanced-dom-tracking-manager.ts` ).
- pipeline/: `pipeline-processor.ts` + stages (orden típico: time-stamp → token → url → session → metadata → validation → side-effect). Usa patrón Stage (clases en `stages/`). Cuando añadas una transformación crea Stage aislado; no mezclar efectos secundarios con enriquecimiento (usa `side-effect-stage.ts`).
- services/: acceso red (REST + WebSocket). `chat-v2-service.ts` debe intentar v2 y proveer fallback a v1 manteniendo shape legacy (ver adaptadores existentes). Mantén idempotencia de llamadas y evita lógica de UI aquí.
- presentation/: componentes UI chat (`chat.ts`, `chat-toggle-button.ts`, etc.) inicializan lazy y permanecen ocultos hasta interacción/estado comercial; no meter lógica de negocio de tokens aquí.
- types/: contratos compartidos (reutiliza antes de crear nuevos tipos).

### Patrones Cruciales
1. Inicialización automática: SDK detecta apiKey vía (a) atributo script `data-api-key`, (b) query param `?apiKey=`, (c) `window.GUIDERS_CONFIG`. Cualquier cambio debe preservar las 3. Detecta entorno (localhost → dev endpoints). Evita hardcode repetido: centraliza en (o añade) un EndpointManager si se expande.
2. Detección heurística: preferir `enableAutomaticTracking()` (v2) sobre métodos legacy. Nuevas reglas van en `heuristic-element-detector.ts`; provee configuración runtime vía `updateHeuristicConfig()`; no exigir atributos HTML al usuario.
3. Bot gating: antes de inicializar chat/tracking se usa `BotDetector`. No añadas side effects antes de su resultado; si introduces nuevos inicios paralelos, respeta early exit cuando `isBot`.
4. Pipeline: cada Stage debe ser pura (sin IO) salvo `side-effect-stage`. Añade tests unitarios mínimos si alteras orden. Validación final ocurre en `validation-stage.ts`; coloca ahí nuevas reglas de consistencia.
5. Sesión: `session-tracking-manager.ts` maneja heartbeat e inactividad; cualquier cambio debe evitar emitir `session_end` en refresh navegado (ver ejemplo `examples/quick-test.html`). Considera tests manuales con archivo example.
6. Chat lazy: nunca mostrar `chat.ts` visual antes de acción o disponibilidad comercial (usa estado de servicios + WebSocket). Mantén reconexión automática y evita throw: usar `console.warn` y retornar temprano.
7. Fallback API: siempre capturar errores de v2 y traducir a shape legacy para compatibilidad. Añade conversores en servicio, no en UI.

### Flujo de Desarrollo
- Instalar deps: npm install (o task VS Code "Install Dependencies").
- Dev server: `npm start` (task: Start SDK Server). Genera bundle con hot reload en 8081.
- Build prod: `npm run build` (task: Build Production) -> output UMD `dist/index.js`.
- Ver quick tests: abrir `examples/quick-test.html` (task: Open Test Demo) o demos PHP (`demo/app`).
- Type-check estricto: task "Validate Types" (`tsc --noEmit --strict`).
- Linter/format: tasks "Lint Code" / "Format Code" antes de commits significativos.

### Convenciones de Código
- Logging con emojis: 🚀 init, 📊 tracking, 💬 chat, 🔍 heurística, 📡 socket, ❌ advertencias/errores. Usa mismo prefijo para nuevas áreas (no inventes otros sin documentar aquí).
- No lanzar excepciones en flujo interactivo de visitante; preferir retorno silencioso + log prefijado.
- Recursos: asegúrate de llamar a `cleanup()` en nuevos objetos de larga vida (seguir patrón de `tracking-pixel-SDK.ts`).
- Mantén API pública estable: métodos ya expuestos en `window.guiders` deben conservar firma; envolver nuevas capacidades bajo métodos opt-in.
- Evitar dependencias pesadas: prioriza utilidades internas antes de añadir libs (impacto tamaño bundle ver task "Analyze Bundle").

### Extensión / Ejemplos
Añadir Stage nuevo:
```ts
class GeoEnrichmentStage implements PipelineStage { /* implement process(data) pura */ }
// Registrar manteniendo orden antes de validation pero después de url/session.
```
Agregar regla heurística personalizada:
```ts
heuristicDetector.addCustomRules('mi_evento', [{ selector:'button', confidence:0.9, textPatterns:['comprar'] }]);
```

### Debug Rápido
```ts
console.log({
  tokens: TokenManager.hasValidTokens(),
  ws: window.guiders.webSocket?.isConnected(),
  chatVisible: window.guiders.chatUI?.isVisible(),
  heuristic: window.guiders.heuristicEnabled
});
```
Para detección de bots: `new BotDetector().detect().then(r=>console.log(r))`.

### Revisión Antes de PR
1. Build prod limpio sin warnings críticos.
2. `tsc --noEmit` sin errores.
3. Linter limpio (sin cambios pendientes tras --fix).
4. Bundle size razonable (usar task "Check Bundle Size" si configurada).
5. Compatibilidad v1 no rota (probar tracking manual y chat básico sin heurística).

### Anti-Patrones (Evitar)
- Mezclar lógica de red en componentes UI.
- Añadir side effects dentro de stages de enriquecimiento.
- Bloquear ejecución con throw ante fallos recuperables (tokens, socket, heurística).
- Introducir dependencias que inflen +10KB min+gzip sin justificación.

Actualiza este archivo si introduces: nuevo Stage global, cambio orden pipeline, nuevos eventos WebSocket, o método público en `window.guiders`.

¿Algo ambiguo o faltante? Indica la sección y el caso concreto para refinar.
