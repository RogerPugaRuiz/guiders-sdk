// src/core/token-service.ts

/**
 * Realiza una petición para obtener el token utilizando el apiKey.
 * @param apiKey La llave de autenticación para el API.
 * @returns Una promesa que resuelve con el token.
 */
export async function fetchToken(apiKey: string): Promise<string> {
	const response = await fetch('https://api.example.com/auth/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ apiKey })
	});

	if (!response.ok) {
		throw new Error(`Error al obtener token: ${response.statusText}`);
	}

	const data = await response.json();
	// Se asume que el token viene en data.token
	return data.token;
}
