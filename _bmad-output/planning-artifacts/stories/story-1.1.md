# Story 1.1: Configurar toolchain para Preact y TSX

**Epic:** Epic 1 — Preparación del toolchain y fundamentos  
**Status:** Done  
**Implements:** NFR2, NFR3, NFR4

---

## User Story

Como desarrollador del SDK,
quiero que el proyecto compile archivos `.tsx` con Preact correctamente,
para que pueda empezar a escribir componentes Preact sin errores de compilación.

---

## Acceptance Criteria

**Given** el proyecto con su configuración actual de webpack y TypeScript  
**When** se ejecuta `npm install preact @preact/signals` y se actualizan `tsconfig.json` y `webpack.config.js`  
**Then** `npm run build` completa sin errores

**Given** un archivo `.tsx` de prueba con JSX de Preact en `src/presentation/`  
**When** se ejecuta `npm run build`  
**Then** el archivo compila correctamente sin necesidad de importar `h` manualmente (gracias a `jsxImportSource: "preact"`)

**Given** la configuración actualizada  
**When** se ejecuta `npx tsc --noEmit --strict`  
**Then** no hay errores de TypeScript

**Given** los tests E2E  
**When** se ejecutan tras los cambios de configuración  
**Then** todos los tests pasan sin modificaciones

---

## Technical Notes

### package.json
- Añadir a `dependencies`: `"preact": "^10.x"`, `"@preact/signals": "^1.x"`
- Añadir a `devDependencies`: `"@babel/preset-react": "^7.x"`

### tsconfig.json
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "lib": ["ES6", "DOM", "DOM.Iterable"]
  }
}
```

### webpack.config.js
```js
resolve: {
  extensions: ['.tsx', '.ts', '.js'],
  alias: {
    'react': 'preact/compat',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime'
  }
}
// Actualizar la regla ts-loader para incluir /\.(ts|tsx)$/
```

### Smoke test
- Crear `src/presentation/smoke-test.tsx` con un componente Preact mínimo
- Verificar que compila
- Eliminar el archivo antes del commit final

---

## Files to Modify
- `package.json`
- `tsconfig.json`
- `webpack.config.js`

## Files to Create (temporary)
- `src/presentation/smoke-test.tsx` (eliminar antes del commit)

## Definition of Done
- [ ] `npm install` sin errores
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan (requiere servidor PHP en `127.0.0.1:8083`)
- [ ] Smoke test `.tsx` compila y es eliminado
- [ ] No aumenta el bundle size (Preact solo se incluye si se usa en componentes — aún no hay ninguno)
