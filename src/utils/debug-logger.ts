/**
 * Sistema de logging configurable para producción
 *
 * Comportamiento:
 * - PRODUCTION (webpack mode='production'):
 *   - debugLog: Solo si window.GUIDERS_DEBUG = true (manual)
 *   - debugInit/Warn/Error: Siempre se muestran
 *
 * - DEVELOPMENT (webpack mode='development'):
 *   - debugLog: Siempre se muestra (a menos que GUIDERS_DEBUG = false)
 *   - debugInit/Warn/Error: Siempre se muestran
 */

declare global {
  interface Window {
    GUIDERS_DEBUG?: boolean;
  }
}

/**
 * Verifica si el modo debug está habilitado
 *
 * En producción, el debug está desactivado por defecto (solo si usuario activa manualmente)
 * En desarrollo, el debug está activado por defecto (para facilitar debugging)
 */
function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  // En producción, respetar el flag explícito del usuario
  if (__PRODUCTION__) {
    return window.GUIDERS_DEBUG === true;
  }

  // En desarrollo, activar debug por defecto (a menos que se desactive explícitamente)
  return window.GUIDERS_DEBUG !== false;
}

/**
 * Log informativo (SUPRIMIDO EN PRODUCCIÓN)
 *
 * USO: Para info detallada, debug de flujo interno, sincronización
 * En producción, estos logs están completamente suprimidos.
 *
 * @example
 * debugLog('[Service] Procesando datos:', data);
 * debugLog('[WebSocket] Conexión establecida');
 */
export function debugLog(...args: any[]): void {
  // En producción, NO mostrar NADA (completamente silencioso)
  if (__PRODUCTION__) {
    return; // Salir inmediatamente sin hacer nada
  }

  // En desarrollo, mostrar siempre (a menos que GUIDERS_DEBUG = false)
  if (typeof window !== 'undefined' && window.GUIDERS_DEBUG === false) {
    return;
  }

  console.log(...args);
}

/**
 * Log de inicialización (SUPRIMIDO EN PRODUCCIÓN)
 *
 * USO: Para confirmar que el SDK se inicializó correctamente
 * En producción, estos logs están suprimidos para mantener consola limpia.
 *
 * @example
 * debugInit('[Guiders SDK] v1.4.1 - Inicializado correctamente');
 */
export function debugInit(...args: any[]): void {
  // En producción, NO mostrar logs de inicialización
  if (__PRODUCTION__) {
    return;
  }

  console.log(...args);
}

/**
 * Log de advertencia (SIEMPRE se muestra)
 *
 * USO: Para warnings importantes, fallbacks, retries, situaciones anormales
 *
 * @example
 * debugWarn('[Service] API no disponible, usando fallback');
 * debugWarn('[WebSocket] Reconexión en progreso');
 */
export function debugWarn(...args: any[]): void {
  console.warn(...args);
}

/**
 * Log de error (SIEMPRE se muestra)
 *
 * USO: Para errores críticos, excepciones, fallos de red
 *
 * @example
 * debugError('[Service] Error crítico:', error);
 * debugError('[API] Request fallida:', response.status);
 */
export function debugError(...args: any[]): void {
  console.error(...args);
}

/**
 * Habilita el modo debug globalmente
 * Útil para debugging en producción
 */
export function enableDebug(): void {
  if (typeof window !== 'undefined') {
    window.GUIDERS_DEBUG = true;
    console.log('[Guiders SDK] 🐛 Modo debug habilitado');
  }
}

/**
 * Deshabilita el modo debug globalmente
 */
export function disableDebug(): void {
  if (typeof window !== 'undefined') {
    window.GUIDERS_DEBUG = false;
    console.log('[Guiders SDK] 🐛 Modo debug deshabilitado');
  }
}

/**
 * Suprimir console.log en producción
 * Esto asegura que NINGÚN console.log() se muestre en producción,
 * solo console.warn() y console.error()
 */
export function suppressConsoleLogs(): void {
  if (typeof window !== 'undefined' && __PRODUCTION__) {
    // Guardar referencia original por si acaso
    const originalLog = console.log;

    // Sobrescribir console.log para que no haga nada en producción
    console.log = function() {
      // No hacer nada - completamente silencioso
    };

    // Permitir que usuarios activen logs manualmente si necesitan debug
    if (window.GUIDERS_DEBUG === true) {
      console.log = originalLog; // Restaurar si usuario quiere debug
    }
  }
}

// Auto-ejecutar supresión en producción
if (typeof window !== 'undefined') {
  suppressConsoleLogs();
}
