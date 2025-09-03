import { ChatV2Service } from './chat-v2-service';
import { ChatSessionStore } from './chat-session-store';

/**
 * startChat (solo versión moderna V2)
 * Crea (o reutiliza) un chat usando únicamente la API /api/v2/chats.
 * Elimina definitivamente el soporte y fallback a la versión legacy /chats.
 * Retorna un objeto { id } para mantener compatibilidad con la UI existente.
 */
export async function startChat(): Promise<{ id: string }> {
	const accessToken = localStorage.getItem('accessToken');
	if (!accessToken) {
		console.warn('[ChatService] ❌ No hay accessToken disponible antes de crear el chat V2');
	}

	// Intento de reutilizar un chat previamente creado (guardado en localStorage)
	try {
		const existingId = localStorage.getItem('chatV2Id');
		const cachedListRaw = localStorage.getItem('guiders_recent_chats');
		let cached: any[] = [];
		if (cachedListRaw) {
			try { cached = JSON.parse(cachedListRaw); } catch { /* ignore */ }
		}
		if (existingId) {
			// Intentar encontrarlo en cache primero
			const cachedChat = cached.find(c => c.id === existingId);
			if (cachedChat) {
				console.log('[ChatService] ♻️ Reutilizando chat V2 existente desde cache:', existingId);
				ChatSessionStore.getInstance().setCurrent(existingId);
				return { id: existingId };
			}
			// Si no está en cache, opcionalmente podríamos intentar GET, pero se ha indicado que no es necesario
		}
		// Si no hay existingId pero tenemos lista cacheada, tomar el primero
		if (!existingId && cached.length > 0) {
			const first = cached[0];
			if (first?.id) {
				localStorage.setItem('chatV2Id', first.id);
				ChatSessionStore.getInstance().setCurrent(first.id);
				console.log('[ChatService] ♻️ Adoptado primer chat cacheado:', first.id);
				return { id: first.id };
			}
		}
	} catch (e) {
		console.warn('[ChatService] Error reutilizando chat V2 cacheado:', e);
	}

		// Extraer visitorId desde el token (campo sub) si existe
	let visitorId = 'anonymous';
	try {
		if (accessToken) {
			const payload = JSON.parse(atob(accessToken.split('.')[1]));
			if (payload && payload.sub) visitorId = payload.sub;
		}
	} catch { /* continuar con anonymous */ }

			// Construir visitorInfo enriquecido (ejemplo dado). Si hubiera datos previos guardados, podríamos fusionarlos aquí.
			const visitorInfo = {
				// name: 'Juan Pérez', // Placeholder; en un futuro se puede inferir de un perfil almacenado
				// email: 'juan.perez@example.com', // Placeholder
				// phone: '+34 612 345 678', // Placeholder
				currentPage: window.location.pathname,
				userAgent: navigator.userAgent
			};

			const metadata = {
				source: 'website',
				department: 'ventas',
				priority: 'medium', // Nota: la API puede normalizar a enum/uppercase
				tags: ['producto-interes', 'primera-visita'],
				notes: 'Cliente interesado en sillas ergonómicas para oficina',
				initialUrl: window.location.href,
				referrer: document.referrer || ''
			};

			const payload = {
				visitorInfo,
				metadata
			};

		try {
			const chat = await ChatV2Service.getInstance().createChatAuto(payload);
			localStorage.setItem('chatV2Id', chat.id);
			ChatSessionStore.getInstance().setCurrent(chat.id);
			console.log('[ChatService] ✅ Chat V2 creado (POST):', chat.id);
			return { id: chat.id };
	} catch (error) {
		console.error('[ChatService] ❌ Error al crear chat V2:', error);
		throw error;
	}
}