## Guía de Revisión de Código (Selección) – Copilot

Objetivo: Al recibir una selección de código o diff, producir una revisión breve, priorizada y accionable acorde a las normas del proyecto Guiders SDK.

### Principios del Proyecto

- Compatibilidad v1: No romper API pública (`window.GuidersPixel`, eventos tracking básicos, chat v1 adaptado).
- Evolución v2: Heurística + Chat API v2 con fallback silencioso (el branching vive en services, nunca en UI).
- Pureza en pipeline: Stages puros sin IO salvo `side-effect-stage`.
- UI desacoplada: `presentation/` sin lógica de red ni token/heurística.
- Logging estandarizado con prefijos (🚀 📊 💬 🔍 📡 ❌).
- Lean bundle: Evitar dependencias >10KB min+gzip sin justificación.

### Checklist Jerarquizado de Revisión

Evaluar en este orden. Si hay un problema crítico se puede detener tras reportarlo y marcar el resto como "no evaluado".

#### 1. Correctitud / Bugs

- Flujos rotos, condiciones imposibles, fugas (intervalos, listeners, sockets no limpiados en `cleanup()`).
- Uso incorrecto de managers (p.ej. abrir WebSocket antes de BotDetector, duplicar init de sesión).

#### 2. Arquitectura / Reglas internas

- IO o efectos fuera de `side-effect-stage` en pipeline.
- Lógica de compat v1/v2 en UI en vez de en `services/*-v2-service.ts` adaptador.
- Importaciones cruzadas ilegales (`services` importando `presentation`).
- Duplicación de tipos ya en `types/` (debe exportarse en `types/index.ts`).

#### 3. Seguridad

- Inyección directa de valores externos en `innerHTML` sin sanitizar.
- Uso de `eval` / Function dinámica / exponer tokens sensibles.
- Falta de validación de origen en mensajes WebSocket / eventos.

#### 4. Performance

- Bucles u observers sin `disconnect`/`unobserve`.
- Re-cálculos caros dentro de handlers de scroll / resize sin throttling.
- Añadir dependencias pesadas innecesariamente.

#### 5. Gestión de Sesión / Tracking

- Emisión incorrecta de `session_end` (no debe suceder en simple refresh).
- Falta de enriquecimiento ordenado (time-stamp → token → url → session → metadata → validation → side-effect).

#### 6. Heurística

- Nuevas reglas sin usar API (`addCustomRules`, `updateHeuristicConfig`).
- Efectos directos en DOM dentro del detector.

#### 7. Chat / WebSocket

- Reconexión manual duplicada (ya gestionada) o falta de fallback.
- Branching visible en UI para formato v1 vs v2 (no permitido).

#### 8. Tipos / Mantenibilidad

- `any` innecesario bajo `--strict`.
- Tipos repetidos localmente en lugar de reutilizar.

#### 9. Estilo / Consistencia

- Prefijos de log incorrectos.
- Falta de early-return con log ❌ en lugar de `throw` en caminos recuperables.

#### 10. Documentación / Comentarios

- Falta de JSDoc esencial en API pública nueva.
- Cambios arquitectónicos sin reflejar en `copilot-instructions.md` (mencionar si procede).

### Formato de Respuesta Esperado

Producir JSON + texto legible (el JSON primero para herramientas). Si no hay problemas críticos, marcar `criticalIssues: 0`.

Ejemplo:

```json
{
  "summary": "2 issues (1 crítico, 1 menor)",
  "criticalIssues": 1,
  "issues": [
    {"level":"critical","area":"arquitectura","codeRef":"src/pipeline/stages/new-stage.ts:42","message":"Realiza fetch dentro de Stage puro"},
    {"level":"minor","area":"tipos","codeRef":"src/services/chat-v2-service.ts:88","message":"Uso de any reemplazable por ChatMessage"}
  ],
  "suggestedFixOrder": ["arquitectura","tipos"],
  "needsDocUpdate": true
}
```

Luego, en texto:

1. Resumen en 1-2 frases.
2. Lista priorizada con viñetas (críticos primero) + propuestas de solución breves (imperativo, ≤120 chars cada una).
3. Si `needsDocUpdate` true, indicar qué sección (p.ej. pipeline orden, logging, nueva API pública).
4. "Sin hallazgos" si no hay issues (no inventar).

### Clasificación de Severidad

- critical: Rompe runtime, compromete compat v1, seguridad, o violación estructural clave.
- major: Impacto funcional visible o degradación performance significativa.
- minor: Mejora de claridad, estilo, tipado, doc.
- info: Observación futura / oportunidad.

### Heurísticas para Detección Rápida

- Palabras clave IO en Stage (fetch, localStorage, sessionStorage, document.*, window.*, console.*) fuera de `side-effect-stage.ts` → posible violación.
- Múltiples `new WebSocket` → revisar reconexión.
- `setInterval` sin referencia almacenada → posible fuga.
- `any` en archivos `services/` o `core/` → revisar tipado fuerte.

### Reglas de Sugerencias de Fix

- Proveer patch conceptual, no reescribir archivo completo.
- Evitar sugerir nuevas dependencias salvo imprescindible (justificar si >10KB).
- Para logs: formato `<emoji> contexto: mensaje`.

### Palabras a Evitar

"simplemente", "obvio", juicios personales. Enfocar en hechos y acciones.

### Identificador

Al final de la salida añade `[review-style-v1]` para trazar que se usó esta guía.

---

Resumen para el modelo:

1. Analiza selección con el checklist jerarquizado.
2. Genera JSON estructurado + explicación breve.
3. Prioriza problemas críticos; no inventes si no existen.
4. Añade `[review-style-v1]` al final.
