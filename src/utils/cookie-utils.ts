/**
 * Cookie Utilities
 *
 * Helper functions for reading browser cookies safely.
 */

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side safe
  }

  const cookies = document.cookie.split('; ');
  const cookie = cookies.find(c => c.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return cookie.substring(name.length + 1); // Skip "name="
}

/**
 * Get user type from guiders_user_type cookie
 * @returns 'commercial' if cookie is set to 'commercial', otherwise 'visitor'
 */
export function getUserTypeFromCookie(): 'visitor' | 'commercial' {
  const userType = getCookie('guiders_user_type');

  if (userType === 'commercial') {
    return 'commercial';
  }

  return 'visitor'; // Default
}
