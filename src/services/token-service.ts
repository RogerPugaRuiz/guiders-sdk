// src/core/token-service.ts
const URL = 'http://localhost:3000/pixel';


/**
 * Obtiene los tokens iniciales usando el apiKey.
 * @param client fingerprint del cliente
 * @returns tokens de acceso y refresco
 */
export async function fetchTokens(client: string): Promise<{ access_token: string; refresh_token: string }> {
	const response = await fetch(`${URL}/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ client })
	});

	if (!response.ok) {
		throw new Error(`Error al obtener tokens: ${response.statusText}`);
	}

	const data = await response.json();
	// Se espera que el endpoint devuelva ambos tokens
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token
	};
}

/**
 * Refresca el access token usando el refresh token.
 * @param refreshToken token de refresco
 * @returns nuevo access token
 */
export async function refreshToken(refreshToken: string): Promise<{ access_token: string }> {
	const response = await fetch(`${URL}/token/refresh`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ refresh_token: refreshToken })
	});
	const data = await response.json();

	if (!response.ok) {
		throw new Error(`${data.message}`);
	}

	
	return {
		access_token: data.access_token
	};
}

/**
 * Registra un nuevo cliente en el sistema.
 * @param client fingerprint del cliente
 * @param apiKey clave de la API
 * @returns new access token and refresh token
 */
export async function registerClient(client: string, apiKey: string): Promise<{ access_token: string; refresh_token: string }> {
	const userAgent = navigator.userAgent;
	const response = await fetch(`${URL}/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ client, apiKey, userAgent })
	});

	if (!response.ok) {
		throw new Error(`Error al registrar cliente: ${response.statusText}`);
	}

	const data = await response.json();
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token
	};
}


/**
 * Intenta registrar al cliente y obtener tokens.
 * Si se produce algún error, lo lanza para ser gestionado por el llamador.
 * @param client fingerprint del cliente
 * @param apiKey clave de la API
 * @returns tokens de acceso y refresco
 */
export async function ensureTokens(client: string, apiKey: string): Promise<{ access_token: string; refresh_token: string }> {
	try {
		// Aquí podrías incluir lógica para verificar si ya existen tokens persistidos.
		// Por simplicidad, se registra siempre y se obtienen nuevos tokens.
		return await registerClient(client, apiKey);
	} catch (error) {
		throw new Error(`Error al intentar registrar y obtener tokens: ${error}`);
	}
}

/**
 * Verifica si un access token (en formato JWT) está próximo a expirar.
 * @param token Access token en formato JWT.
 * @param threshold Umbral en segundos para considerar que el token está próximo a expirar (por defecto 60 segundos).
 * @returns true si el token expira en menos de threshold segundos, false en caso contrario.
 */
export function isAccessTokenExpiring(token: string, threshold: number = 60): boolean {
	try {
		// Se asume que el token es un JWT con tres partes separadas por '.'
		const payloadBase64 = token.split('.')[1];
		const payloadJson = atob(payloadBase64);
		const payload = JSON.parse(payloadJson);
		// 'exp' es la fecha de expiración en segundos (epoch)
		const currentTime = Math.floor(Date.now() / 1000);
		return (payload.exp - currentTime) < threshold;
	} catch (error) {
		console.error("Error al decodificar el token:", error);
		// Si hay error decodificando, es mejor asumir que el token está próximo a expirar.
		return true;
	}
}



