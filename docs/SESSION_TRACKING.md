# Session Tracking Implementation

## ¿Qué es una Sesión?

Una **sesión** en el contexto del Guiders SDK representa una unidad de actividad del usuario que:

- **Comienza** cuando se carga el SDK por primera vez
- **Continúa** mientras el usuario permanece activo en el sitio web
- **Termina** cuando se cierra la ventana/pestaña del navegador o cuando se navega fuera del dominio

### Características de una Sesión

- **Persistencia**: La sesión se almacena en `sessionStorage`, lo que significa que persiste durante toda la duración de la ventana/pestaña del navegador
- **Alcance**: Una sesión está limitada a una sola ventana/pestaña del navegador
- **Tiempo Activo**: Solo se cuenta el tiempo cuando la ventana está visible y activa
- **Continuidad**: La sesión continúa automáticamente cuando el usuario navega entre páginas del mismo dominio

## Almacenamiento de Sesión

### sessionStorage
La información de la sesión se almacena en `sessionStorage` con la clave `guiders_session` y contiene:

```javascript
{
    sessionId: "session_1234567890_abc123def",  // Identificador único de la sesión
    tabId: "tab_1234567890_xyz789",            // Identificador único de la ventana
    startTime: 1634567890123,                  // Timestamp de inicio de sesión
    totalActiveTime: 30333                     // Tiempo activo acumulado (ms)
}
```

### Ventajas del sessionStorage
- **Automático**: Se limpia automáticamente al cerrar la ventana/pestaña
- **Aislado**: Cada ventana/pestaña tiene su propia sesión independiente
- **Persistente**: Mantiene los datos durante toda la navegación en el sitio
- **Seguro**: No persiste entre sesiones del navegador (mayor privacidad)

## Eventos de Sesión

### session_start
Se dispara cuando:
- Se carga el SDK por primera vez en una nueva ventana/pestaña
- No existe una sesión previa en sessionStorage

```javascript
{
    event: 'session_start',
    sessionId: 'session_1634567890_abc123def',
    timestamp: 1634567890123,
    isVisible: true
}
```

### session_continue
Se dispara cuando:
- Se carga el SDK y ya existe una sesión en sessionStorage
- El usuario navega entre páginas del mismo sitio

```javascript
{
    event: 'session_continue',
    sessionId: 'session_1634567890_abc123def',
    timestamp: 1634567920456,
    totalActiveTime: 30333
}
```

### session_end
Se dispara cuando:
- Se cierra la ventana/pestaña del navegador
- Se navega a un dominio externo
- Se termina la sesión programáticamente

```javascript
{
    event: 'session_end',
    sessionId: 'session_1634567890_abc123def',
    startTime: 1634567890123,
    endTime: 1634568010999,
    totalSessionTime: 120876,
    totalActiveTime: 90555,
    timestamp: 1634568010999
}
```

### session_heartbeat
Se dispara periódicamente (cada 30 segundos por defecto):
- Solo cuando la sesión está activa
- Permite monitorear sesiones en curso

```javascript
{
    event: 'session_heartbeat',
    sessionId: 'session_1634567890_abc123def',
    timestamp: 1634567950789,
    totalActiveTime: 60666,
    isActive: true
}
```

## Configuración

El tracking de sesiones está habilitado por defecto y se puede configurar:

```javascript
const sdkOptions = {
    // ... otras opciones
    sessionTracking: {
        enabled: true,
        config: {
            enabled: true,
            heartbeatInterval: 30000, // 30 segundos
            trackBackgroundTime: false // solo tiempo activo
        }
    }
};
```

## Métodos de Control de Sesión

### Métodos Públicos

- `sdk.enableSessionTracking()` - Inicia el tracking de sesiones
- `sdk.disableSessionTracking()` - Detiene el tracking de sesiones
- `sdk.getCurrentSession()` - Obtiene los datos de la sesión actual
- `sdk.updateSessionConfig(config)` - Actualiza la configuración
- `sdk.clearGlobalSession()` - Limpia la sesión actual (útil para logout)
- `sdk.getGlobalSessionId()` - Obtiene el ID de la sesión actual

### Estructura de Datos de Sesión

```javascript
{
    sessionId: "session_1234567890_abc123def",  // Identificador único de la sesión
    startTime: 1634567890123,                   // Timestamp de inicio de sesión
    lastActiveTime: 1634567920456,              // Última vez que estuvo activa
    totalActiveTime: 30333,                     // Tiempo activo acumulado (ms)
    isActive: true,                             // Estado de visibilidad actual
    tabId: "tab_1234567890_xyz789"              // Identificador único de ventana
}
```

## Cuándo Termina una Sesión

### Eventos que Terminan una Sesión

1. **Cierre de Ventana/Pestaña**
   - El usuario cierra la ventana del navegador
   - Se activa automáticamente por el evento `beforeunload`

2. **Navegación Externa**
   - El usuario navega a un dominio diferente
   - Se sale del sitio web actual

3. **Terminación Explícita**
   - Llamar a `sdk.disableSessionTracking()` programáticamente
   - Logout del usuario (si se implementa para limpiar la sesión)

4. **Limpieza del SDK**
   - Cuando el SDK se destruye o limpia

### Lo que NO Termina una Sesión

- **Navegación Interna**: Moverse entre páginas del mismo dominio
- **Recarga de Página**: Recargar la página actual (genera `session_continue`)
- **Problemas Temporales de Red**: Desconexiones breves

## Implementación Técnica

### APIs del Navegador Utilizadas

- **Page Visibility API** para detectar cuando la ventana está activa
- **beforeunload event** para detectar cierre de ventana
- **focus/blur events** para tracking adicional de estado

### Gestión de Memoria

- Limpieza automática de event listeners
- Limpieza de timers para prevenir memory leaks
- Gestión segura del SessionTrackingManager

### Compatibilidad con Navegadores

- Page Visibility API (soportada en navegadores modernos)
- beforeunload event (soporte universal)
- focus/blur events (soporte universal)

## Consideraciones de Rendimiento

- **Impacto Mínimo**: Solo event listeners y timers periódicos
- **Sin Polling Continuo**: Eventos basados en APIs del navegador
- **Cálculo Eficiente**: Uso de timestamps para medición de tiempo
- **Heartbeat Configurable**: Intervalo ajustable según necesidades

## Seguridad y Privacidad

- **Sin Datos Sensibles**: No se recopila información personal
- **APIs Estándar**: Solo usa APIs de timing del navegador
- **IDs Locales**: Los IDs de sesión se generan localmente
- **Respeto a la Privacidad**: Solo rastrea tiempo de navegación

## Ejemplos de Uso

### Obtener Estadísticas de Sesión

```javascript
const sessionStats = sdk.getSessionStats();
console.log('Tiempo activo:', sessionStats.totalActiveTime);
console.log('Tiempo total:', sessionStats.totalSessionTime);
```

### Terminar Sesión Manualmente

```javascript
// Al hacer logout
sdk.forceSessionEnd('user_logout');
```

### Limpiar Sesión

```javascript
// Limpiar sessionStorage
sdk.clearGlobalSession();
```