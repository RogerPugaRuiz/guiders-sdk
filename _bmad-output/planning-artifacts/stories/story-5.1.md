# Story 5.1: Eliminar archivos legados y finalizar migración

**Epic:** Epic 5 — Limpieza y eliminación del código legado  
**Status:** Done  
**Depends on:** Story 4.2  
**Implements:** FR12, NFR1, NFR5

---

## User Story

Como desarrollador del SDK,
quiero eliminar los archivos de presentación DOM vanilla que han sido reemplazados,
para que el codebase no tenga código muerto y la arquitectura sea coherente.

---

## Acceptance Criteria

**Given** que todos los epics anteriores están completados y los tests E2E pasan  
**When** se ejecuta la limpieza  
**Then** los siguientes archivos son eliminados sin que ningún archivo del proyecto los importe:
- `src/presentation/components/chat-ui.ts`
- `src/presentation/components/quick-actions-ui.ts`
- `src/presentation/components/typing-indicator.ts`
- `src/presentation/chat-input.ts`
- `src/presentation/chat-fixed.ts`

**Given** que `ChatUIBridge` ya no delega en `ChatUI` original  
**When** se elimina la propiedad interna `_chatUI`  
**Then** `ChatUIBridge` compila sin referencias a `ChatUI` original

**Given** que `src/presentation/index.ts` se actualiza  
**When** se verifica  
**Then** no exporta ninguno de los archivos eliminados

**Given** que se ejecuta `npm run build`  
**When** completa  
**Then** no hay warnings de módulos no usados ni referencias rotas

**Given** que se ejecuta `npx tsc --noEmit --strict`  
**When** completa  
**Then** no hay errores TypeScript

**Given** que se ejecutan los tests E2E  
**When** completan  
**Then** todos los tests pasan

**Given** el bundle final  
**When** se compara con el bundle pre-migración  
**Then** el overhead no supera 10 KB gzip (NFR1)

---

## Technical Notes

### Pre-deletion checklist
Antes de eliminar cada archivo, verificar que no queda ninguna referencia:
```bash
# Verificar que no quedan imports de los archivos a eliminar
grep -r "chat-ui" src/ --include="*.ts" --include="*.tsx"
grep -r "quick-actions-ui" src/ --include="*.ts" --include="*.tsx"
grep -r "typing-indicator" src/ --include="*.ts" --include="*.tsx"
grep -r "chat-input" src/ --include="*.ts" --include="*.tsx"
grep -r "chat-fixed" src/ --include="*.ts" --include="*.tsx"
```

### Archivos a eliminar
```
src/presentation/components/chat-ui.ts         ← monolito principal (3.484 líneas)
src/presentation/components/quick-actions-ui.ts
src/presentation/components/typing-indicator.ts
src/presentation/chat-input.ts
src/presentation/chat-fixed.ts                 ← si existe y fue reemplazado
```

### `ChatUIBridge.ts` cleanup
- Eliminar `private _chatUI: ChatUI` y su inicialización en el constructor
- Eliminar la importación de `ChatUI` original
- Verificar que ningún método sigue delegando en `_chatUI` (todos deberían usar signals)

### `src/presentation/index.ts` cleanup
- Eliminar `export { ChatUI as ChatUIOriginal }` si existía
- Asegurarse de que solo exporta `ChatUIBridge as ChatUI` y los signals

### Bundle size verification
```bash
# Pre-migration baseline (guardado en commit de inicio de migración)
# Post-migration
npm run build
ls -lh dist/index.js
# Comparar con gzip: gzip -c dist/index.js | wc -c
```

### Manual verification
Antes de marcar como completado, verificar manualmente en el navegador con el servidor PHP demo:
1. Widget abre y cierra
2. Se envían y reciben mensajes
3. Typing indicator funciona
4. Header muestra comercial asignado con presencia
5. Quick Actions funcionan
6. Chat List View funciona (si está configurado)
7. Consent Banner aparece y responde a los callbacks
8. La consola no muestra errores

---

## Files to Delete
- `src/presentation/components/chat-ui.ts`
- `src/presentation/components/quick-actions-ui.ts`
- `src/presentation/components/typing-indicator.ts`
- `src/presentation/chat-input.ts`
- `src/presentation/chat-fixed.ts` (verificar si existe)

## Files to Modify
- `src/presentation/bridge/ChatUIBridge.ts` — eliminar `_chatUI` y su uso
- `src/presentation/index.ts` — limpiar exports

## Definition of Done
- [ ] Archivos legados eliminados sin referencias rotas
- [ ] `ChatUIBridge` sin dependencia de `ChatUI` original
- [ ] `src/presentation/index.ts` limpio
- [ ] `npm run build` sin errores ni warnings de módulos no usados
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
- [ ] Bundle overhead ≤ 10 KB gzip respecto al baseline pre-migración
- [ ] Verificación manual completa del widget en el navegador
- [ ] Bundle size pre/post documentado en el commit de cierre
