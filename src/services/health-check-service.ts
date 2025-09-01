/**
 * Verifica la conexión con el servidor.
 * @param url Endpoint de salud del servidor (por ejemplo, https://api.example.com/health).
 * @returns Una promesa que resuelve a `true` si la conexión es exitosa, o `false` en caso contrario.
 */
export async function checkServerConnection(url: string): Promise<boolean> {
	try {
		// Normalizar URL para evitar dobles slashes (e.g. .../api//health)
		const base = url.replace(/\/+$/,'');
		// Usamos HEAD para minimizar la carga de la petición
		const response = await fetch(`${base}/health`,
			{ method: 'HEAD', cache: 'no-cache' });
		return response.ok;
	} catch (error) {
		console.error("Error al conectar con el servidor:", error);
		return false;
	}
}