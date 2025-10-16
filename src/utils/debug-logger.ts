/**
 * Sistema de logging configurable para producción
 * Los logs informativos solo se muestran si GUIDERS_DEBUG está habilitado
 * Los logs críticos (warn, error) siempre se muestran
 */

declare global {
  interface Window {
    GUIDERS_DEBUG?: boolean;
  }
}

/**
 * Verifica si el modo debug está habilitado
 */
function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.GUIDERS_DEBUG === true;
}

/**
 * Log informativo (solo se muestra si GUIDERS_DEBUG=true)
 */
export function debugLog(...args: any[]): void {
  if (isDebugEnabled()) {
    console.log(...args);
  }
}

/**
 * Log de advertencia (siempre se muestra)
 */
export function debugWarn(...args: any[]): void {
  console.warn(...args);
}

/**
 * Log de error (siempre se muestra)
 */
export function debugError(...args: any[]): void {
  console.error(...args);
}

/**
 * Habilita el modo debug globalmente
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
