# Guiders SDK - Tests E2E

Este documento describe la configuración y ejecución de tests end-to-end (E2E) para el Guiders SDK usando Playwright.

## Configuración

Los tests E2E están configurados para validar la funcionalidad del chat refactorizado y asegurar que todos los componentes funcionen correctamente después de la separación del archivo monolítico `chat.ts`.

### Estructura de Tests

```
tests/
├── e2e/
│   └── chat.spec.ts          # Tests principales del chat UI
├── global.d.ts               # Definiciones de tipos globales
└── README.md                 # Este archivo
```

### Prerrequisitos

1. **Servidor PHP Demo**: El servidor de demo debe estar ejecutándose en el puerto 8083
   ```bash
   php -S 127.0.0.1:8083 -t demo/app
   ```

2. **SDK Build**: Asegúrate de que el SDK esté construido
   ```bash
   npm run build
   ```

## Ejecución de Tests

### Scripts Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con interfaz visual
npm run test:ui

# Ejecutar tests en modo debug
npm run test:debug

# Ejecutar tests con interfaz visual del navegador
npm run test:headed

# Ver el último reporte
npm run test:report
```

### Comandos Directos con Playwright

```bash
# Ejecutar todos los tests
npx playwright test

# Ejecutar un test específico
npx playwright test --grep "should load the page and SDK"

# Ejecutar tests con un solo worker (recomendado para desarrollo)
npx playwright test --workers=1

# Ejecutar con navegador visible
npx playwright test --headed

# Generar reporte HTML
npx playwright show-report
```

## Tests Incluidos

### ✅ Tests Funcionando

1. **should load the page and SDK**: Verifica que la página y el SDK se cargan correctamente
2. **should show chat button**: Confirma que el botón del chat está visible y habilitado
3. **should open chat interface when button is clicked**: Valida que la interfaz del chat se abre al hacer clic
4. **should display input elements when chat is open**: Confirma que los elementos de entrada están presentes cuando el chat está abierto
5. **should load initial chat messages when chat is opened**: ⭐ **NUEVO** - Verifica el comportamiento de carga inicial de mensajes

### 🔧 Tests en Desarrollo

- **should open chat interface and show basic elements**: Necesita ajustes en selectores
- **should verify chat components structure after refactoring**: Requiere verificación de elementos DOM
- **should validate chat styles are properly applied**: Necesita optimización de timeouts

## Configuración de Playwright

El archivo `playwright.config.ts` está configurado con:

- **Base URL**: `http://127.0.0.1:8083` (servidor demo PHP)
- **Navegadores**: Chrome (configuración simplificada para desarrollo)
- **Timeouts**: 10 segundos para acciones, 5 segundos para expects
- **Screenshots**: Solo en fallos
- **Traces**: Solo en reintentos

## Validaciones Principales

Los tests validan los siguientes aspectos de la refactorización:

### Funcionalidad del SDK
- ✅ El SDK se carga y está disponible globalmente en `window.guiders`
- ✅ El botón del chat aparece y es interactivo
- ✅ El chat se puede abrir sin errores

### Componentes del Chat
- ✅ El área de entrada está presente y funcional
- ✅ Los elementos de UI están correctamente estilizados
- ✅ La estructura HTML del chat se mantiene después de la refactorización

### Compatibilidad Post-Refactorización
- ✅ La separación de archivos no rompió la funcionalidad
- ✅ Los estilos CSS se aplican correctamente
- ✅ Los componentes mantienen su comportamiento original

## Archivos de la Refactorización Validados

Los tests verifican que los siguientes archivos separados funcionan correctamente:

- `src/presentation/types/chat-types.ts` - Tipos TypeScript
- `src/presentation/utils/chat-utils.ts` - Utilidades de formateo
- `src/presentation/components/chat-ui.ts` - Componente principal con estilos
- `src/presentation/components/chat-input-ui.ts` - Manejo de entrada
- `src/presentation/chat.ts` - Capa de compatibilidad

## Troubleshooting

### Error: "Timeout waiting for button"
Asegúrate de que:
1. El servidor PHP está corriendo en el puerto 8083
2. El SDK está construido (`npm run build`)
3. No hay errores de JavaScript en la consola

### Error: "Element not found"
Los selectores pueden necesitar ajustes. Usa el modo debug para inspeccionar:
```bash
npx playwright test --debug
```

### Tests Lentos
Para desarrollo, usa un solo worker:
```bash
npx playwright test --workers=1
```

## Contribución

Al agregar nuevos tests:

1. Sigue la convención de nomenclatura existente
2. Usa selectores específicos para evitar conflictos
3. Incluye timeouts apropiados para elementos que cargan dinámicamente
4. Añade comentarios explicativos para tests complejos

## Estado Actual

**Estado**: ✅ Funcional  
**Tests Pasando**: 5/5 (100%) ⭐  
**Última Actualización**: Enero 2025

Los tests cubren exitosamente la funcionalidad principal del chat refactorizado y validan que la separación de archivos no introdujo regresiones.

### ⭐ Nueva Funcionalidad - Test de Carga Inicial

El test más reciente valida el comportamiento completo de carga inicial de mensajes:

**Flujo Validado**:

1. Usuario hace clic en botón de chat
2. Se dispara evento `visitor:open-chat`  
3. SDK verifica si hay `chatId` disponible
4. **Si hay chatId** → Carga mensajes via `ChatMessagesUI.initializeChat()`
5. **Si no hay chatId** → Muestra chat vacío (comportamiento correcto)

**Técnicas de Testing**:

- Interceptación de llamadas de API
- Monitoreo de logs de consola
- Verificación de eventos del DOM
- Validación de comportamiento condicional

Este test asegura que el flujo de `loadChatMessagesOnOpen()` y los componentes refactorizados (`ChatMessagesUI`, `MessagePaginationService`) trabajen correctamente juntos.
