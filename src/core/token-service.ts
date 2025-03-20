// src/core/token-service.ts
const URL = 'http://localhost:3000/pixel';
/**
 * Obtiene los tokens iniciales usando el apiKey.
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
 */
export async function refreshTokens(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
	const response = await fetch(`${URL}/token/refresh`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ "refresh_token": refreshToken })
	});

	if (!response.ok) {
		throw new Error(`Error al refrescar tokens: ${response.statusText}`);
	}

	const data = await response.json();
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token
	};
}
