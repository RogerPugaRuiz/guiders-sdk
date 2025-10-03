/**
 * 💬 RealtimeMessageManager - Gestión de mensajes en tiempo real
 * 
 * Responsabilidades:
 * - Coordinar WebSocketService con ChatUI
 * - Transformar eventos WebSocket a formato UI
 * - Gestionar typing indicators
 * - Mantener sincronización entre mensajes HTTP y WebSocket
 * - Caché local de mensajes recientes
 */

import { WebSocketService } from './websocket-service';
import { ChatV2Service } from './chat-v2-service';
import { RealtimeMessage, ChatStatusUpdate, TypingIndicator } from '../types/websocket-types';
import { ChatUI } from '../presentation/components/chat-ui';
import { MessageRenderer } from '../presentation/utils/message-renderer';

export interface RealtimeMessageManagerOptions {
	/** Instancia de ChatUI para renderizar mensajes */
	chatUI: ChatUI;
	/** ID del visitante actual */
	visitorId: string;
	/** Habilitar typing indicators */
	enableTypingIndicators?: boolean;
	/** Delay para typing indicators (ms) */
	typingIndicatorDelay?: number;
}

export class RealtimeMessageManager {
	private static instance: RealtimeMessageManager | null = null;
	private wsService: WebSocketService;
	private chatService: ChatV2Service;
	private chatUI: ChatUI | null = null;
	private visitorId: string = '';
	private currentChatId: string | null = null;
	
	// Typing indicators
	private enableTypingIndicators: boolean = true;
	private typingIndicatorDelay: number = 3000;
	private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

	private constructor() {
		this.wsService = WebSocketService.getInstance();
		this.chatService = ChatV2Service.getInstance();
		console.log('💬 [RealtimeMessageManager] Instancia creada');
	}

	public static getInstance(): RealtimeMessageManager {
		if (!RealtimeMessageManager.instance) {
			RealtimeMessageManager.instance = new RealtimeMessageManager();
		}
		return RealtimeMessageManager.instance;
	}

	/**
	 * Inicializa el gestor con opciones
	 */
	public initialize(options: RealtimeMessageManagerOptions): void {
		console.log('💬 [RealtimeMessageManager] 🚀 Inicializando con:', {
			visitorId: options.visitorId,
			hasChatUI: !!options.chatUI,
			enableTyping: options.enableTypingIndicators
		});

		this.chatUI = options.chatUI;
		this.visitorId = options.visitorId;
		this.enableTypingIndicators = options.enableTypingIndicators !== false;
		this.typingIndicatorDelay = options.typingIndicatorDelay || 3000;

		// Registrar callbacks del WebSocket
		this.wsService.updateCallbacks({
			onConnect: () => this.handleConnect(),
			onDisconnect: (reason) => this.handleDisconnect(reason),
			onError: (error) => this.handleError(error),
			onMessage: (message) => this.handleNewMessage(message),
			onChatStatus: (status) => this.handleChatStatus(status),
			onTyping: (typing) => this.handleTyping(typing)
		});

		console.log('💬 [RealtimeMessageManager] ✅ Inicializado correctamente');
	}

	/**
	 * Establece el chat activo actual
	 */
	public setCurrentChat(chatId: string): void {
		if (this.currentChatId === chatId) {
			console.log('💬 [RealtimeMessageManager] Chat ya activo:', chatId);
			return;
		}

		console.log('💬 [RealtimeMessageManager] 📌 Cambiando chat activo:', {
			anterior: this.currentChatId,
			nuevo: chatId
		});

		// Salir del chat anterior si existe
		if (this.currentChatId) {
			this.wsService.leaveChatRoom(this.currentChatId);
		}

		// Unirse al nuevo chat
		this.currentChatId = chatId;
		this.wsService.joinChatRoom(chatId);

		// Actualizar ChatUI si existe
		if (this.chatUI) {
			this.chatUI.setChatId(chatId);
		}
	}

	/**
	 * Envía un mensaje usando HTTP POST (según arquitectura)
	 */
	public async sendMessage(content: string, type: string = 'text'): Promise<void> {
		if (!this.currentChatId) {
			console.error('💬 [RealtimeMessageManager] ❌ No hay chat activo');
			throw new Error('No hay chat activo');
		}

		console.log('💬 [RealtimeMessageManager] 📤 Enviando mensaje via HTTP:', {
			chatId: this.currentChatId,
			contentLength: content.length,
			type
		});

		try {
			// IMPORTANTE: El envío se hace via HTTP POST
			// La notificación llegará automáticamente via WebSocket
			const result = await this.chatService.sendMessage(
				this.currentChatId,
				content,
				type
			);

			console.log('💬 [RealtimeMessageManager] ✅ Mensaje enviado (HTTP):', result.messageId || result.id);
			
			// Nota: NO renderizamos aquí - esperamos el evento WebSocket 'message:new'
			// que disparará handleNewMessage() y renderizará en la UI
			
		} catch (error) {
			console.error('💬 [RealtimeMessageManager] ❌ Error enviando mensaje:', error);
			throw error;
		}
	}

	/**
	 * Emite typing indicator
	 */
	public emitTyping(isTyping: boolean): void {
		if (!this.currentChatId || !this.enableTypingIndicators) return;

		this.wsService.emitTyping(this.currentChatId, isTyping);

		// Auto-clear después del delay
		if (isTyping) {
			const existingTimeout = this.typingTimeouts.get(this.visitorId);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			const timeout = setTimeout(() => {
				this.wsService.emitTyping(this.currentChatId!, false);
				this.typingTimeouts.delete(this.visitorId);
			}, this.typingIndicatorDelay);

			this.typingTimeouts.set(this.visitorId, timeout);
		}
	}

	// ========== Event Handlers ==========

	private handleConnect(): void {
		console.log('💬 [RealtimeMessageManager] ✅ WebSocket conectado');

		// Re-unirse al chat actual si existe
		if (this.currentChatId) {
			this.wsService.joinChatRoom(this.currentChatId);
		}
	}

	private handleDisconnect(reason: string): void {
		console.log('💬 [RealtimeMessageManager] ⚠️ WebSocket desconectado:', reason);
		
		// Opcional: Mostrar notificación en UI
		if (this.chatUI && reason !== 'io client disconnect') {
			// Solo mostrar si no fue desconexión intencional
			console.warn('⚠️ Conexión perdida, intentando reconectar...');
		}
	}

	private handleError(error: Error): void {
		console.error('💬 [RealtimeMessageManager] ❌ Error WebSocket:', error.message);
	}

	/**
	 * Maneja la llegada de un nuevo mensaje via WebSocket
	 * CRÍTICO: Este es el único punto donde se renderizan mensajes en tiempo real
	 */
	private handleNewMessage(message: RealtimeMessage): void {
		console.log('💬 [RealtimeMessageManager] 📨 Procesando mensaje nuevo:', {
			messageId: message.messageId,
			chatId: message.chatId,
			senderId: message.senderId,
			senderName: message.senderName,
			isInternal: message.isInternal
		});

		// Verificar que el mensaje pertenece al chat actual
		if (message.chatId !== this.currentChatId) {
			console.log('💬 [RealtimeMessageManager] ⚠️ Mensaje de otro chat, ignorando');
			return;
		}

		// Filtrar mensajes internos si el visitante no es comercial
		if (message.isInternal) {
			console.log('💬 [RealtimeMessageManager] 🔒 Mensaje interno, no visible para visitante');
			return;
		}

		// FILTRO CRÍTICO: Ignorar mensajes propios que vienen del WebSocket
		// El visitante ya ve su mensaje renderizado instantáneamente al enviarlo
		// Solo procesamos mensajes de otros participantes (comerciales, bots, etc.)
		if (message.senderId === this.visitorId) {
			console.log('💬 [RealtimeMessageManager] 🚫 Mensaje propio ignorado (ya renderizado):', {
				messageId: message.messageId,
				visitorId: this.visitorId
			});
			return;
		}

		// Renderizar en ChatUI
		if (!this.chatUI) {
			console.warn('💬 [RealtimeMessageManager] ⚠️ ChatUI no disponible');
			return;
		}

		try {
			// El mensaje es de otro participante (comercial, bot, etc.)
			const sender = 'other';

			// Renderizar usando la API de ChatUI
			this.chatUI.renderChatMessage({
				text: message.content,
				sender: sender,
				timestamp: new Date(message.sentAt).getTime(),
				senderId: message.senderId
			});

			// Scroll al fondo
			this.chatUI.scrollToBottom(true);

			console.log('💬 [RealtimeMessageManager] ✅ Mensaje renderizado en UI');
		} catch (error) {
			console.error('💬 [RealtimeMessageManager] ❌ Error renderizando mensaje:', error);
		}
	}

	/**
	 * Maneja cambios de estado del chat
	 */
	private handleChatStatus(status: ChatStatusUpdate): void {
		console.log('💬 [RealtimeMessageManager] 📊 Estado del chat actualizado:', status);

		// Verificar que pertenece al chat actual
		if (status.chatId !== this.currentChatId) {
			return;
		}

		// Opcional: Actualizar UI según el estado
		// Por ejemplo, mostrar "El asesor ha cerrado el chat" si status === 'CLOSED'
		if (this.chatUI) {
			switch (status.status) {
				case 'IN_PROGRESS':
					console.log('💬 Chat en progreso - primera respuesta del comercial');
					// Opcional: Ocultar mensaje de "esperando respuesta"
					break;
				case 'RESOLVED':
					console.log('💬 Chat resuelto');
					// Opcional: Mostrar mensaje de "Chat resuelto"
					break;
				case 'CLOSED':
					console.log('💬 Chat cerrado');
					// Opcional: Mostrar mensaje de "Chat cerrado"
					if (this.chatUI) {
						this.chatUI.addSystemMessage('El chat ha sido cerrado.');
					}
					break;
			}
		}
	}

	/**
	 * Maneja typing indicators
	 */
	private handleTyping(typing: TypingIndicator): void {
		if (!this.enableTypingIndicators || typing.userId === this.visitorId) {
			return; // No mostrar nuestro propio typing
		}

		console.log('💬 [RealtimeMessageManager] ✍️ Typing indicator:', {
			user: typing.userName,
			isTyping: typing.isTyping
		});

		// TODO: Implementar indicador visual de "X está escribiendo..."
		// Esto requeriría añadir método showTypingIndicator() en ChatUI
	}

	/**
	 * Limpia recursos
	 */
	public cleanup(): void {
		console.log('💬 [RealtimeMessageManager] 🧹 Limpiando recursos...');

		// Limpiar timeouts de typing
		this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
		this.typingTimeouts.clear();

		// Salir del chat actual
		if (this.currentChatId) {
			this.wsService.leaveChatRoom(this.currentChatId);
			this.currentChatId = null;
		}

		console.log('💬 [RealtimeMessageManager] ✅ Recursos limpiados');
	}

	/**
	 * Obtiene el chat ID actual
	 */
	public getCurrentChatId(): string | null {
		return this.currentChatId;
	}

	/**
	 * Verifica si está conectado
	 */
	public isConnected(): boolean {
		return this.wsService.isConnected();
	}
}
