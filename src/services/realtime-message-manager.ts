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

import { debugLog } from '../utils/debug-logger';
import { WebSocketService } from './websocket-service';
import { ChatV2Service } from './chat-v2-service';
import { RealtimeMessage, ChatStatusUpdate, TypingIndicator, AIMetadata, CommercialAssignedEvent } from '../types/websocket-types';
import { AIConfig } from '../types';
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
	/** Configuración de IA */
	aiConfig?: AIConfig;
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

	// 🤖 Configuración de IA
	private aiConfig: AIConfig = {
		enabled: true,
		showAIIndicator: true,
		aiSenderName: 'Asistente IA',
		showTypingIndicator: true
	};
	// IDs de remitentes que se consideran IA por defecto
	private defaultAISenderIds: string[] = ['ai-assistant', 'ai-bot', 'bot', 'system-ai', 'assistant'];

	private constructor() {
		this.wsService = WebSocketService.getInstance();
		this.chatService = ChatV2Service.getInstance();
		debugLog('💬 [RealtimeMessageManager] Instancia creada');
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
		debugLog('💬 [RealtimeMessageManager] 🚀 Inicializando con:', {
			visitorId: options.visitorId,
			hasChatUI: !!options.chatUI,
			enableTyping: options.enableTypingIndicators,
			aiEnabled: options.aiConfig?.enabled
		});

		this.chatUI = options.chatUI;
		this.visitorId = options.visitorId;
		this.enableTypingIndicators = options.enableTypingIndicators !== false;
		this.typingIndicatorDelay = options.typingIndicatorDelay || 3000;

		// 🤖 Configuración de IA
		if (options.aiConfig) {
			this.aiConfig = { ...this.aiConfig, ...options.aiConfig };
			debugLog('💬 [RealtimeMessageManager] 🤖 Configuración de IA aplicada:', this.aiConfig);
		}

		// Registrar callbacks del WebSocket
		this.wsService.updateCallbacks({
			onConnect: () => this.handleConnect(),
			onDisconnect: (reason) => this.handleDisconnect(reason),
			onError: (error) => this.handleError(error),
			onMessage: (message) => this.handleNewMessage(message),
			onChatStatus: (status) => this.handleChatStatus(status),
			onTyping: (typing) => this.handleTyping(typing),
			onCommercialAssigned: (event) => this.handleCommercialAssigned(event)
		});

		debugLog('💬 [RealtimeMessageManager] ✅ Inicializado correctamente');
	}

	/**
	 * Actualiza la referencia de ChatUI
	 * IMPORTANTE: Debe llamarse cuando se recrea el ChatUI para evitar referencias desactualizadas
	 */
	public setChatUI(chatUI: ChatUI): void {
		if (this.chatUI !== chatUI) {
			debugLog('💬 [RealtimeMessageManager] 🔄 Actualizando referencia de ChatUI');
			this.chatUI = chatUI;
		}
	}

	/**
	 * Establece el chat activo actual
	 * Si chatId está vacío, limpia el chat actual (para crear uno nuevo)
	 */
	public setCurrentChat(chatId: string): void {
		// CASO ESPECIAL: Limpiar chat actual para preparar nuevo chat
		if (!chatId || chatId === '') {
			debugLog('💬 [RealtimeMessageManager] 🧹 Limpiando chat actual para nuevo chat');

			// Salir del chat anterior si existe
			if (this.currentChatId) {
				this.wsService.leaveChatRoom(this.currentChatId);
			}

			// Establecer a null para indicar que no hay chat activo
			this.currentChatId = null;

			// NO actualizar ChatUI aquí - ya fue actualizado por quien nos llamó
			return;
		}

		if (this.currentChatId === chatId) {
			debugLog('💬 [RealtimeMessageManager] Chat ya activo:', chatId);
			return;
		}

		debugLog('💬 [RealtimeMessageManager] 📌 Cambiando chat activo:', {
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
	 * Obtiene el visitorId actual
	 */
	public getVisitorId(): string {
		return this.visitorId;
	}

	/**
	 * Envía un mensaje usando HTTP POST (según arquitectura)
	 */
	public async sendMessage(content: string, type: string = 'text'): Promise<void> {
		if (!this.currentChatId) {
			throw new Error('No hay chat activo');
		}

		debugLog('💬 [RealtimeMessageManager] 📤 Enviando mensaje via HTTP:', {
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

			debugLog('💬 [RealtimeMessageManager] ✅ Mensaje enviado (HTTP):', result.messageId || result.id);
			
			// Nota: NO renderizamos aquí - esperamos el evento WebSocket 'message:new'
			// que disparará handleNewMessage() y renderizará en la UI
			
		} catch (error) {
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

	// ========== AI Detection ==========

	/**
	 * 🤖 Detecta si un mensaje fue generado por IA
	 * Usa múltiples señales para determinar el origen del mensaje
	 */
	private isAIMessage(message: RealtimeMessage): boolean {
		// Si la IA está deshabilitada, nunca detectamos mensajes de IA
		if (this.aiConfig.enabled === false) {
			return false;
		}

		// 1. Flag explícito del backend (más fiable)
		if (message.isAI === true) {
			debugLog('💬 [RealtimeMessageManager] 🤖 Mensaje de IA detectado (flag isAI)');
			return true;
		}

		// 2. Tipo de mensaje 'ai'
		if (message.type === 'ai') {
			debugLog('💬 [RealtimeMessageManager] 🤖 Mensaje de IA detectado (type=ai)');
			return true;
		}

		// 3. SenderId conocido de IA
		const allAISenderIds = [
			...this.defaultAISenderIds,
			...(this.aiConfig.aiSenderIds || [])
		];
		if (allAISenderIds.includes(message.senderId)) {
			debugLog('💬 [RealtimeMessageManager] 🤖 Mensaje de IA detectado (senderId conocido):', message.senderId);
			return true;
		}

		// 4. Metadatos de IA presentes
		if (message.aiMetadata && (message.aiMetadata.model || message.aiMetadata.confidence !== undefined)) {
			debugLog('💬 [RealtimeMessageManager] 🤖 Mensaje de IA detectado (aiMetadata presente)');
			return true;
		}

		return false;
	}

	/**
	 * Actualiza la configuración de IA en runtime
	 */
	public setAIConfig(config: Partial<AIConfig>): void {
		this.aiConfig = { ...this.aiConfig, ...config };
		debugLog('💬 [RealtimeMessageManager] 🤖 Configuración de IA actualizada:', this.aiConfig);
	}

	/**
	 * Obtiene la configuración de IA actual
	 */
	public getAIConfig(): AIConfig {
		return { ...this.aiConfig };
	}

	// ========== Event Handlers ==========

	private handleConnect(): void {
		debugLog('💬 [RealtimeMessageManager] ✅ WebSocket conectado');

		// Re-unirse al chat actual si existe
		if (this.currentChatId) {
			this.wsService.joinChatRoom(this.currentChatId);
		}
	}

	private handleDisconnect(reason: string): void {
		debugLog('💬 [RealtimeMessageManager] ⚠️ WebSocket desconectado:', reason);
		
		// Opcional: Mostrar notificación en UI
		if (this.chatUI && reason !== 'io client disconnect') {
			// Solo mostrar si no fue desconexión intencional
		}
	}

	private handleError(error: Error): void {
	}

	/**
	 * Maneja la llegada de un nuevo mensaje via WebSocket
	 * CRÍTICO: Este es el único punto donde se renderizan mensajes en tiempo real
	 */
	private handleNewMessage(message: RealtimeMessage): void {
		debugLog('💬 [RealtimeMessageManager] 📨 Procesando mensaje nuevo:', {
			messageId: message.messageId,
			chatId: message.chatId,
			senderId: message.senderId,
			senderName: message.senderName,
			isInternal: message.isInternal
		});

		// Verificar que el mensaje pertenece al chat actual
		if (message.chatId !== this.currentChatId) {
			debugLog('💬 [RealtimeMessageManager] ⚠️ Mensaje de otro chat, ignorando');
			return;
		}

		// Filtrar mensajes internos si el visitante no es comercial
		if (message.isInternal) {
			debugLog('💬 [RealtimeMessageManager] 🔒 Mensaje interno, no visible para visitante');
			return;
		}

		// FILTRO CRÍTICO: Ignorar mensajes propios que vienen del WebSocket
		// El visitante ya ve su mensaje renderizado instantáneamente al enviarlo
		// Solo procesamos mensajes de otros participantes (comerciales, bots, etc.)
		if (message.senderId === this.visitorId) {
			debugLog('💬 [RealtimeMessageManager] 🚫 Mensaje propio ignorado (ya renderizado):', {
				messageId: message.messageId,
				visitorId: this.visitorId
			});
			return;
		}

		// Renderizar en ChatUI
		if (!this.chatUI) {
			return;
		}

		try {
			// El mensaje es de otro participante (comercial, bot, IA, etc.)
			const sender = 'other';

			// 🤖 Detectar si es mensaje de IA
			const isAI = this.isAIMessage(message);

			// Renderizar usando la API de ChatUI
			this.chatUI.renderChatMessage({
				text: message.content,
				sender: sender,
				timestamp: new Date(message.sentAt).getTime(),
				senderId: message.senderId,
				// 🤖 Información de IA
				isAI: isAI,
				aiMetadata: message.aiMetadata
			});

			// Scroll al fondo
			this.chatUI.scrollToBottom(true);

			debugLog('💬 [RealtimeMessageManager] ✅ Mensaje renderizado en UI', {
				isAI: isAI,
				aiModel: message.aiMetadata?.model
			});

			// Verificar si necesitamos refrescar el header porque el chat estaba PENDING
			// y ahora tenemos un comercial asignado (primer mensaje del comercial)
			this.checkAndRefreshHeaderOnCommercialAssignment();
		} catch (error) {
		}
	}

	/**
	 * Verifica si el chat estaba en estado PENDING sin comercial asignado
	 * y dispara un refresh asíncrono del header para obtener datos del comercial
	 */
	private checkAndRefreshHeaderOnCommercialAssignment(): void {
		if (!this.chatUI) return;

		// Obtener el estado actual del chat desde ChatUI
		const chatStatus = this.chatUI.getLastKnownChatStatus();
		const hasCommercial = this.chatUI.hasAssignedCommercial();

		debugLog('💬 [RealtimeMessageManager] 🔍 Verificando asignación de comercial:', {
			chatStatus,
			hasCommercial
		});

		// Solo refrescar si:
		// 1. El chat estaba en estado PENDING, o
		// 2. No tenía comercial asignado previamente
		const shouldRefresh =
			chatStatus === 'PENDING' ||
			chatStatus === 'pending' ||
			!hasCommercial;

		if (!shouldRefresh) {
			debugLog('💬 [RealtimeMessageManager] ℹ️ No es necesario refrescar header (ya tiene comercial asignado)');
			return;
		}

		debugLog('💬 [RealtimeMessageManager] 🔄 Refrescando header del chat - primer mensaje de comercial detectado');

		// Refresh asíncrono - no bloqueamos el renderizado del mensaje
		// Usamos setTimeout(0) para ejecutar en el próximo tick del event loop
		setTimeout(async () => {
			try {
				await this.chatUI?.refreshChatDetailsForced();
				debugLog('💬 [RealtimeMessageManager] ✅ Header actualizado con datos del comercial');
			} catch (error) {
				debugLog('💬 [RealtimeMessageManager] ⚠️ Error al refrescar header:', error);
			}
		}, 0);
	}

	/**
	 * Maneja cambios de estado del chat
	 */
	private handleChatStatus(status: ChatStatusUpdate): void {
		debugLog('💬 [RealtimeMessageManager] 📊 Estado del chat actualizado:', status);

		// Verificar que pertenece al chat actual
		if (status.chatId !== this.currentChatId) {
			return;
		}

		// Opcional: Actualizar UI según el estado
		// Por ejemplo, mostrar "El asesor ha cerrado el chat" si status === 'CLOSED'
		if (this.chatUI) {
			switch (status.status) {
				case 'IN_PROGRESS':
					debugLog('💬 Chat en progreso - primera respuesta del comercial');
					// Opcional: Ocultar mensaje de "esperando respuesta"
					break;
				case 'RESOLVED':
					debugLog('💬 Chat resuelto');
					// Opcional: Mostrar mensaje de "Chat resuelto"
					break;
				case 'CLOSED':
					debugLog('💬 Chat cerrado');
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

		debugLog('💬 [RealtimeMessageManager] ✍️ Typing indicator:', {
			user: typing.userName,
			isTyping: typing.isTyping
		});

		// TODO: Implementar indicador visual de "X está escribiendo..."
		// Esto requeriría añadir método showTypingIndicator() en ChatUI
	}

	/**
	 * Maneja el evento de comercial asignado al chat
	 * Cuando un comercial es asignado, actualizamos los datos del chat para mostrar su info
	 */
	private handleCommercialAssigned(event: CommercialAssignedEvent): void {
		console.log('💬 [RealtimeMessageManager] 👤 handleCommercialAssigned LLAMADO:', {
			eventChatId: event.chatId,
			currentChatId: this.currentChatId,
			hasChatUI: !!this.chatUI,
			commercialId: event.commercialId,
			status: event.status,
			hasCommercialInfo: !!event.commercial,
			commercial: event.commercial
		});

		// Verificar que el evento pertenece al chat actual
		if (event.chatId !== this.currentChatId) {
			console.log('💬 [RealtimeMessageManager] ⚠️ Evento de otro chat, ignorando');
			return;
		}

		if (!this.chatUI) {
			console.log('💬 [RealtimeMessageManager] ⚠️ chatUI es null, no se puede actualizar header');
			return;
		}

		// Si el evento incluye info del comercial, actualizar header directamente
		if (event.commercial) {
			console.log('💬 [RealtimeMessageManager] ✅ Llamando updateHeaderWithCommercial con:', event.commercial);
			this.chatUI.updateHeaderWithCommercial(event.commercial, event.status);
			console.log('💬 [RealtimeMessageManager] ✅ updateHeaderWithCommercial completado');
		} else {
			// Fallback: si no hay info del comercial, intentar refrescar del backend
			console.log('💬 [RealtimeMessageManager] ⚠️ No hay info de comercial en evento, usando refreshChatDetailsForced');
			setTimeout(async () => {
				try {
					await this.chatUI?.refreshChatDetailsForced();
				} catch (error) {
					console.log('💬 [RealtimeMessageManager] ❌ Error al refrescar datos del chat:', error);
				}
			}, 0);
		}
	}

	/**
	 * Limpia recursos
	 */
	public cleanup(): void {
		debugLog('💬 [RealtimeMessageManager] 🧹 Limpiando recursos...');

		// Limpiar timeouts de typing
		this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
		this.typingTimeouts.clear();

		// Salir del chat actual
		if (this.currentChatId) {
			this.wsService.leaveChatRoom(this.currentChatId);
			this.currentChatId = null;
		}

		debugLog('💬 [RealtimeMessageManager] ✅ Recursos limpiados');
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
