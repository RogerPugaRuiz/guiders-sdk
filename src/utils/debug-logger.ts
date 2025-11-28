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
 * Log informativo (COMPLETAMENTE DESHABILITADO)
 *
 * USO: Esta función no hace nada, todos los logs informativos están suprimidos
 */
export function debugLog(...args: any[]): void {
  // Completamente deshabilitado - no hacer nada
  return;
}

/**
 * Log de inicialización (COMPLETAMENTE DESHABILITADO)
 *
 * USO: Esta función no hace nada, todos los logs de inicialización están suprimidos
 */
export function debugInit(...args: any[]): void {
  // Completamente deshabilitado - no hacer nada
  return;
}

/**
 * Log de advertencia (COMPLETAMENTE DESHABILITADO)
 *
 * USO: Esta función no hace nada, todos los warnings están suprimidos
 */
export function debugWarn(...args: any[]): void {
  // Completamente deshabilitado - no hacer nada
  return;
}

/**
 * Log de error (COMPLETAMENTE DESHABILITADO)
 *
 * USO: Esta función no hace nada, todos los errores están suprimidos
 */
export function debugError(...args: any[]): void {
  // Completamente deshabilitado - no hacer nada
  return;
}

/**
 * Habilita el modo debug globalmente (DESHABILITADO)
 */
export function enableDebug(): void {
  // No hacer nada - debug completamente deshabilitado
  return;
}

/**
 * Deshabilita el modo debug globalmente (DESHABILITADO)
 */
export function disableDebug(): void {
  // No hacer nada - debug completamente deshabilitado
  return;
}
