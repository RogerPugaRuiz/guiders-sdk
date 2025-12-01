/**
 * HTTP Headers Helper
 *
 * Proporciona funciones helper para construir headers HTTP consistentes
 * en todas las peticiones al backend de Guiders.
 *
 * Autenticación: Este proyecto usa cookies HttpOnly (NO JWT)
 */

/**
 * Obtiene el sessionId almacenado en sessionStorage
 */
export function getSessionId(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem('guiders_backend_session_id');
}

/**
 * Construye headers base para peticiones al backend
 * Incluye:
 * - Content-Type: application/json
 * - X-Guiders-Sid: sessionId (si existe)
 *
 * @returns Headers object
 */
export function getCommonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Agregar sessionId como header X-Guiders-Sid
  const sessionId = getSessionId();
  if (sessionId) {
    headers['X-Guiders-Sid'] = sessionId;
  }

  return headers;
}

/**
 * Opciones de fetch base para peticiones al backend
 * Incluye:
 * - headers comunes (X-Guiders-Sid)
 *
 * NOTA: NO usamos credentials: 'include' porque causa conflictos cuando
 * el panel comercial y la web del visitante están en el mismo dominio (ej: localhost).
 * Las cookies se envían automáticamente para el mismo origen sin necesidad de 'include'.
 * La autenticación se maneja mediante el header X-Guiders-Sid.
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @returns RequestInit object
 */
export function getCommonFetchOptions(method: string = 'GET'): RequestInit {
  return {
    method,
    headers: getCommonHeaders()
  };
}
