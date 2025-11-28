import { MessagePaginationService } from '../services/message-pagination-service';
import { MessageV2, MessageListResponse } from '../types';
import { MessageRenderer } from './utils/message-renderer';
import { debugLog } from '../utils/debug-logger';
import { TypingIndicator } from './components/typing-indicator';
import { formatDate, createDateSeparator } from './utils/chat-utils';
import { PresenceService } from '../services/presence-service';
import { TypingEvent } from '../types/presence-types';

/**
 * Componente de UI de mensajes con scroll infinito
 * Características:
 * - Scroll automático al bottom al abrir
 * - Scroll infinito hacia arriba para cargar mensajes antiguos
 * - Interfaz simple y fluida
 * - Typing indicator cuando el comercial está escribiendo
 */
export class ChatMessagesUI {
    private container: HTMLElement;
    private messagesContainer!: HTMLElement;
    private messagePaginationService: MessagePaginationService;

    // Estado del scroll infinito
    private chatId: string | null = null;
    private currentCursor: string | null = null;
    private hasMoreMessages: boolean = true;
    private isLoading: boolean = false;
    private isInitialLoad: boolean = true;
    private preventAutoScrollLoad: boolean = false; // Previene carga automática después de scrollToBottom

    // Elementos de loading
    private topLoadingIndicator: HTMLElement | null = null;

    // Typing indicator
    private typingIndicator: TypingIndicator;
    private typingIndicatorContainer: HTMLElement | null = null;

    // Presence service for typing indicators
    private presenceService: PresenceService | null = null;
    private typingUnsubscribe: (() => void) | null = null;

    // Configuración
    private readonly SCROLL_THRESHOLD = 100; // pixels desde el top para activar carga
    private readonly MESSAGE_LIMIT = 20; // mensajes por página

    constructor(container: HTMLElement) {
        this.container = container;
        this.messagePaginationService = MessagePaginationService.getInstance();
        this.typingIndicator = new TypingIndicator();
        this.setupUI();
        this.setupScrollListener();
    }

    /**
     * Configura el servicio de presencia para typing indicators
     * @param presenceService Servicio de presencia
     */
    public setPresenceService(presenceService: PresenceService): void {
        this.presenceService = presenceService;

        // Suscribirse a eventos de typing (solo del comercial)
        this.typingUnsubscribe = this.presenceService.onTypingChanged((event: TypingEvent, isTyping: boolean) => {
            // ✅ Solo mostrar typing del comercial, no del visitante
            if (event.userType === 'commercial') {
                if (isTyping) {
                    debugLog('[ChatMessagesUI] 📝 Comercial está escribiendo:', event);
                    this.showTypingIndicator();
                } else {
                    debugLog('[ChatMessagesUI] 📝 Comercial dejó de escribir:', event);
                    this.hideTypingIndicator();
                }
            }
        });

        debugLog('[ChatMessagesUI] ✅ PresenceService configurado y suscrito a typing events');
    }

    /**
     * Configura la interfaz de usuario
     */
    private setupUI(): void {
        // 🔧 No limpiar el contenedor, usar el contenedor existente como messagesContainer
        // El contenedor ya tiene la clase 'chat-messages' y el contenido de mensajes
        this.messagesContainer = this.container;

        // Aplicar estilos de scroll infinito al contenedor existente
        this.messagesContainer.style.cssText += `
            overflow-y: auto;
            scroll-behavior: smooth;
        `;

        // Agregar typing indicator al final del contenedor
        this.typingIndicatorContainer = this.typingIndicator.render();
        this.messagesContainer.appendChild(this.typingIndicatorContainer);

        debugLog(`📦 [ChatMessagesUI] setupUI: Usando contenedor existente como messagesContainer + typing indicator agregado`);
    }

    /**
     * Configura el listener de scroll para el scroll infinito
     */
    private setupScrollListener(): void {
        this.messagesContainer.addEventListener('scroll', this.handleScroll.bind(this));
    }

    /**
     * Maneja el evento de scroll para activar la carga de mensajes antiguos
     */
    private async handleScroll(): Promise<void> {
        const { scrollTop, scrollHeight, clientHeight } = this.messagesContainer;
        
        debugLog(`🔍 [ChatMessagesUI] handleScroll ejecutándose:`, {
            scrollTop,
            scrollHeight,
            clientHeight,
            threshold: this.SCROLL_THRESHOLD,
            chatId: this.chatId,
            hasMoreMessages: this.hasMoreMessages,
            isLoading: this.isLoading,
            currentCursor: this.currentCursor,
            preventAutoScrollLoad: this.preventAutoScrollLoad
        });

        // Solo activar si tenemos un chat cargado y hay más mensajes
        if (!this.chatId) {
            debugLog(`❌ [ChatMessagesUI] handleScroll: Sin chatId`);
            return;
        }
        
        if (!this.hasMoreMessages) {
            debugLog(`❌ [ChatMessagesUI] handleScroll: hasMoreMessages = false`);
            return;
        }
        
        if (this.isLoading) {
            debugLog(`❌ [ChatMessagesUI] handleScroll: isLoading = true`);
            return;
        }

        // 🛡️ Prevenir carga automática después de scrollToBottom
        if (this.preventAutoScrollLoad) {
            debugLog(`🛡️ [ChatMessagesUI] handleScroll: preventAutoScrollLoad activo - ignorando threshold`);
            
            // Si el usuario hace scroll manual significativo, desactivar la protección
            if (scrollTop > this.SCROLL_THRESHOLD * 2) { // Si se aleja del threshold por 2x
                this.preventAutoScrollLoad = false;
                debugLog(`✅ [ChatMessagesUI] handleScroll: Usuario hizo scroll manual - desactivando preventAutoScrollLoad`);
            }
            return;
        }

        debugLog(`🔍 [ChatMessagesUI] Verificando threshold: scrollTop=${scrollTop} <= ${this.SCROLL_THRESHOLD}?`);
        
        // Si el usuario ha hecho scroll cerca del top, cargar más mensajes
        if (scrollTop <= this.SCROLL_THRESHOLD) {
            debugLog(`🚀 [ChatMessagesUI] THRESHOLD ALCANZADO! Iniciando loadOlderMessages...`);
            await this.loadOlderMessages();
        } else {
            debugLog(`📊 [ChatMessagesUI] Threshold no alcanzado. Necesita scroll más arriba.`);
        }
    }

    /**
     * Inicializa el chat con un ID específico
     * Carga los mensajes iniciales y hace scroll al bottom
     * @param chatId ID del chat
     */
    async initializeChat(chatId: string): Promise<void> {
        debugLog(`💬 [ChatMessagesUI] Inicializando chat: ${chatId}`);
        
        if (this.chatId === chatId && !this.isInitialLoad) {
            debugLog(`💬 [ChatMessagesUI] Chat ${chatId} ya está inicializado`);
            return;
        }

        this.chatId = chatId;
        this.isInitialLoad = true;
        this.currentCursor = null;
        this.hasMoreMessages = true;
        this.isLoading = false;
        this.preventAutoScrollLoad = false; // Reset del flag al inicializar

        // Limpiar mensajes existentes
        this.clearMessages();

        // Cargar mensajes iniciales
        await this.loadInitialMessages();
        
        this.isInitialLoad = false;
    }

    /**
     * Carga los mensajes iniciales (más recientes)
     */
    private async loadInitialMessages(): Promise<void> {
        if (!this.chatId) return;

        try {
            this.isLoading = true;
            debugLog(`📋 [ChatMessagesUI] Cargando mensajes iniciales...`);
            
            const response = await this.messagePaginationService.loadInitialMessages(
                this.chatId, 
                this.MESSAGE_LIMIT
            );

            this.renderInitialMessages(response);
            this.updatePaginationState(response);
            
            // Hacer scroll al bottom automáticamente al abrir
            this.scrollToBottom();
            
            debugLog(`✅ [ChatMessagesUI] Mensajes iniciales cargados y scroll al bottom realizado`);
            
        } catch (error) {
            this.showErrorMessage('Error al cargar mensajes');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Carga mensajes más antiguos (scroll infinito)
     */
    private async loadOlderMessages(): Promise<void> {
        debugLog(`🚀 [ChatMessagesUI] loadOlderMessages INICIADO`);
        debugLog(`🔍 [ChatMessagesUI] Estado antes de validaciones:`, {
            chatId: this.chatId,
            currentCursor: this.currentCursor,
            hasMoreMessages: this.hasMoreMessages,
            isLoading: this.isLoading
        });

        if (!this.chatId) {
            debugLog(`❌ [ChatMessagesUI] loadOlderMessages: Sin chatId`);
            return;
        }
        
        if (!this.currentCursor) {
            debugLog(`❌ [ChatMessagesUI] loadOlderMessages: Sin currentCursor`);
            return;
        }
        
        if (!this.hasMoreMessages) {
            debugLog(`❌ [ChatMessagesUI] loadOlderMessages: hasMoreMessages = false`);
            return;
        }

        try {
            this.isLoading = true;
            this.showTopLoadingIndicator();
            
            debugLog(`📜 [ChatMessagesUI] ✅ LLAMANDO AL BACKEND - Cargando mensajes antiguos...`);
            debugLog(`📋 [ChatMessagesUI] Parámetros de petición:`, {
                chatId: this.chatId,
                cursor: this.currentCursor,
                limit: this.MESSAGE_LIMIT
            });
            
            // Guardar posición de scroll actual
            const scrollHeightBefore = this.messagesContainer.scrollHeight;
            const scrollTopBefore = this.messagesContainer.scrollTop;
            
            const response = await this.messagePaginationService.loadOlderMessages(
                this.chatId,
                this.currentCursor,
                this.MESSAGE_LIMIT
            );

            debugLog(`📦 [ChatMessagesUI] Respuesta del backend:`, response);

            this.renderOlderMessages(response);
            this.updatePaginationState(response);
            
            // Mantener posición de scroll relativa (suave, sin salto)
            const scrollHeightAfter = this.messagesContainer.scrollHeight;
            const heightDifference = scrollHeightAfter - scrollHeightBefore;
            this.messagesContainer.scrollTop = scrollTopBefore + heightDifference;
            
            debugLog(`✅ [ChatMessagesUI] ${response.messages.length} mensajes antiguos cargados`);
            
        } catch (error) {
        } finally {
            this.hideTopLoadingIndicator();
            this.isLoading = false;
        }
    }

    /**
     * Renderiza los mensajes iniciales (más recientes)
     */
    private renderInitialMessages(response: MessageListResponse): void {
        if (!response.messages || response.messages.length === 0) {
            this.showEmptyState();
            return;
        }

        // Los mensajes vienen del más reciente al más antiguo,
        // los renderizamos en orden cronológico (más antiguo primero)
        const messages = [...response.messages].reverse();

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageElement);
        });

        // ✅ Reconstruir separadores de fecha después de renderizar
        this.rebuildDateSeparators();
    }

    /**
     * Renderiza mensajes más antiguos al principio del contenedor
     */
    private renderOlderMessages(response: MessageListResponse): void {
        if (!response.messages || response.messages.length === 0) {
            return;
        }

        // Guardar posición de scroll antes de añadir mensajes
        const previousScrollHeight = this.messagesContainer.scrollHeight;
        const previousScrollTop = this.messagesContainer.scrollTop;

        // Los mensajes antiguos se insertan al principio en orden cronológico
        // reverse() convierte [más reciente, ..., más antiguo] en [más antiguo, ..., más reciente]
        const messages = [...response.messages].reverse();

        // Usar DocumentFragment para insertar todos los mensajes de una vez
        // manteniendo el orden correcto
        const fragment = document.createDocumentFragment();
        messages.forEach((message) => {
            const messageElement = this.createMessageElement(message);
            fragment.appendChild(messageElement);
        });

        // Insertar el fragment completo al principio del contenedor
        const firstExisting = this.messagesContainer.firstChild;
        if (firstExisting) {
            this.messagesContainer.insertBefore(fragment, firstExisting);
        } else {
            this.messagesContainer.appendChild(fragment);
        }

        // ✅ Reconstruir separadores de fecha después de renderizar
        this.rebuildDateSeparators();

        // Restaurar posición de scroll para evitar saltos
        // Desactivar scroll suave temporalmente
        const originalScrollBehavior = this.messagesContainer.style.scrollBehavior;
        this.messagesContainer.style.scrollBehavior = 'auto';

        const newScrollHeight = this.messagesContainer.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeight;
        this.messagesContainer.scrollTop = previousScrollTop + heightDifference;

        // Restaurar scroll suave
        requestAnimationFrame(() => {
            this.messagesContainer.style.scrollBehavior = originalScrollBehavior || 'smooth';
        });
    }

    /**
     * Crea un elemento HTML para un mensaje con diseño moderno
     */
    public createMessageElement(message: MessageV2): HTMLElement {
        // ✅ USAR FUNCIÓN UNIFICADA - Garantiza el mismo estilo que mensajes enviados nuevos
        const messageData = MessageRenderer.fromMessageV2(message);
        return MessageRenderer.createMessageElement(messageData);
    }

    /**
     * Aplica estilos CSS modernos a un mensaje
     */
    private applyModernMessageStyles(messageDiv: HTMLElement, isUserMessage: boolean): void {
        const avatar = messageDiv.querySelector('.message-avatar') as HTMLElement;
        const bubble = messageDiv.querySelector('.message-bubble') as HTMLElement;
        const content = messageDiv.querySelector('.message-content') as HTMLElement;
        const text = messageDiv.querySelector('.message-text') as HTMLElement;
        const metadata = messageDiv.querySelector('.message-metadata') as HTMLElement;
        const time = messageDiv.querySelector('.message-time') as HTMLElement;
        const status = messageDiv.querySelector('.message-status') as HTMLElement;

        // Estilos base del contenedor del mensaje
        messageDiv.style.cssText = `
            display: flex;
            align-items: flex-end;
            margin-bottom: 16px;
            ${isUserMessage ? 'flex-direction: row-reverse; padding-left: 60px;' : 'flex-direction: row; padding-right: 60px;'}
            animation: messageSlideIn 0.3s ease-out;
        `;

        // Avatar (solo para mensajes de otros)
        if (avatar) {
            avatar.style.cssText = `
                margin-right: 12px;
                margin-bottom: 4px;
            `;
            
            const avatarCircle = avatar.querySelector('.avatar-circle') as HTMLElement;
            if (avatarCircle) {
                avatarCircle.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    border: none;
                    box-sizing: border-box;
                    min-width: 32px;
                    min-height: 32px;
                    max-width: 32px;
                    max-height: 32px;
                `;
            }
        }

        // Burbuja del mensaje
        bubble.style.cssText = `
            position: relative;
            max-width: 85%;
            min-width: 120px;
        `;

        // Contenido del mensaje
        content.style.cssText = `
            padding: 12px 16px 8px;
            border-radius: 20px;
            position: relative;
            word-break: break-word;
            ${isUserMessage ? 
                `background: linear-gradient(145deg, #0084ff 60%, #00c6fb 100%);
                 color: white;
                 border-bottom-right-radius: 6px;
                 box-shadow: 0 2px 12px rgba(0, 132, 255, 0.3);` : 
                `background: white;
                 color: #1d1d1f;
                 border: 1px solid rgba(0, 0, 0, 0.08);
                 border-bottom-left-radius: 6px;
                 box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);`
            }
            backdrop-filter: blur(10px);
            transition: all 0.2s ease;
        `;

        // Texto del mensaje
        text.style.cssText = `
            font-size: 15px;
            line-height: 1.4;
            margin: 0;
            font-weight: 400;
            letter-spacing: -0.01em;
        `;

        // Metadatos (tiempo y estado)
        metadata.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: ${isUserMessage ? 'flex-end' : 'flex-start'};
            gap: 6px;
            margin-top: 2px;
            padding: 0 4px;
        `;

        // Tiempo
        time.style.cssText = `
            font-size: 11px;
            color: ${isUserMessage ? 'rgba(0, 0, 0, 0.8)' : 'rgba(60, 60, 67, 0.6)'};
            font-weight: 500;
            letter-spacing: 0.01em;
        `;

        // Estado del mensaje (solo para mensajes del usuario)
        if (status) {
            status.style.cssText = `
                font-size: 12px;
                color: rgba(255, 255, 255, 0.8);
                margin-left: 2px;
            `;
        }

        // Añadir animaciones CSS
        this.addMessageAnimations();

        // Efecto hover deshabilitado por solicitud del usuario
    }

    /**
     * Añade animaciones CSS globales para mensajes
     */
    private addMessageAnimations(): void {
        // Solo añadir una vez
        if (document.getElementById('modern-message-animations')) return;

        const style = document.createElement('style');
        style.id = 'modern-message-animations';
        style.textContent = `
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Efecto hover deshabilitado por solicitud del usuario */

            /* Mejorar tipografía */
            .modern-message .message-text {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Estilos responsivos */
            @media (max-width: 480px) {
                .modern-message {
                    padding-left: 20px !important;
                    padding-right: 20px !important;
                }
                
                .modern-message .message-bubble {
                    max-width: 90% !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Determina si un mensaje es del usuario actual
     */
    private isUserMessage(message: MessageV2): boolean {
        // Obtener el visitorId actual desde localStorage
        try {
            const visitorId = localStorage.getItem('visitorId');
            if (visitorId) {
                // Comparar el senderId del mensaje con el visitorId actual
                return message.senderId === visitorId;
            }
        } catch (error) {
        }
        
        // Fallback: asumir que NO es del usuario si no podemos determinarlo
        return false;
    }

    /**
     * Actualiza el estado de paginación
     */
    private updatePaginationState(response: MessageListResponse): void {
        debugLog(`🔄 [ChatMessagesUI] updatePaginationState ANTES:`, {
            prevHasMore: this.hasMoreMessages,
            prevCursor: this.currentCursor
        });
        
        debugLog(`📥 [ChatMessagesUI] Respuesta recibida:`, {
            hasMore: response.hasMore,
            cursor: response.cursor,
            nextCursor: response.nextCursor,
            messagesCount: response.messages?.length || 0
        });

        this.hasMoreMessages = response.hasMore;
        
        // Extraer cursor de la respuesta (tanto cursor como nextCursor para compatibilidad)
        const extractedCursor = response.cursor || response.nextCursor;
        debugLog(`🔍 [ChatMessagesUI] Cursor extraído:`, { extractedCursor, hasMore: response.hasMore });
        
        if (extractedCursor && response.hasMore) {
            this.currentCursor = extractedCursor;
        } else {
            this.currentCursor = null;
        }

        debugLog(`📊 [ChatMessagesUI] Estado paginación actualizado DESPUÉS:`, {
            hasMore: this.hasMoreMessages,
            hasCursor: !!this.currentCursor,
            cursor: this.currentCursor,
            totalMessages: this.messagesContainer.children.length
        });
    }

    /**
     * Hace scroll al final del contenedor (mensajes más recientes)
     */
    public scrollToBottom(): void {
        // 🛡️ Activar flag para prevenir carga automática
        this.preventAutoScrollLoad = true;
        debugLog(`🛡️ [ChatMessagesUI] scrollToBottom: Activando preventAutoScrollLoad`);
        
        requestAnimationFrame(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            // 🛡️ Desactivar flag después de un breve delay para permitir que el scroll se estabilice
            setTimeout(() => {
                this.preventAutoScrollLoad = false;
                debugLog(`✅ [ChatMessagesUI] scrollToBottom: Desactivando preventAutoScrollLoad después de delay`);
            }, 500); // 500ms debería ser suficiente para que se estabilice el scroll
        });
    }

    /**
     * Agrega un nuevo mensaje al final (para mensajes en tiempo real)
     */
    public addNewMessage(message: MessageV2): void {
        const messageElement = this.createMessageElement(message);
        this.messagesContainer.appendChild(messageElement);
        
        // Hacer scroll automático al nuevo mensaje
        this.scrollToBottom();
    }

    /**
     * Muestra indicador de carga en la parte superior
     */
    private showTopLoadingIndicator(): void {
        if (this.topLoadingIndicator) return;

        this.topLoadingIndicator = document.createElement('div');
        this.topLoadingIndicator.className = 'top-loading-indicator';
        this.topLoadingIndicator.innerHTML = `
            <div style="text-align: center; padding: 12px; color: #666; font-size: 12px;">
                <div style="display: inline-block; width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #0084ff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
                Cargando mensajes anteriores...
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        this.messagesContainer.insertBefore(this.topLoadingIndicator, this.messagesContainer.firstChild);
    }

    /**
     * Oculta el indicador de carga superior
     */
    private hideTopLoadingIndicator(): void {
        if (this.topLoadingIndicator) {
            this.topLoadingIndicator.remove();
            this.topLoadingIndicator = null;
        }
    }

    /**
     * Muestra un mensaje de error
     */
    private showErrorMessage(message: string): void {
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            text-align: center;
            padding: 20px;
            color: #dc3545;
            font-size: 14px;
        `;
        errorElement.textContent = message;
        
        this.messagesContainer.appendChild(errorElement);
    }

    /**
     * Muestra el estado vacío (sin mensajes)
     */
    private showEmptyState(): void {
        const emptyElement = document.createElement('div');
        emptyElement.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: #8a9aa9;
            font-size: 14px;
        `;
        emptyElement.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
            <div>¡Inicia la conversación!</div>
            <div style="font-size: 12px; margin-top: 8px;">Este es el comienzo de tu chat</div>
        `;
        
        this.messagesContainer.appendChild(emptyElement);
    }

    /**
     * Limpia todos los mensajes del contenedor
     * Nota: No elimina el typing indicator, solo lo oculta
     */
    private clearMessages(): void {
        // Guardar referencia al typing indicator
        const typingElement = this.typingIndicator.getElement();

        // Limpiar todo el contenedor
        this.messagesContainer.innerHTML = '';

        // Re-agregar el typing indicator al final
        if (typingElement) {
            this.messagesContainer.appendChild(typingElement);
        }

        // Ocultar typing indicator al limpiar mensajes
        this.typingIndicator.hide();

        this.hideTopLoadingIndicator();
    }

    /**
     * Formatea la hora de un mensaje
     */
    private formatMessageTime(createdAt: string): string {
        const date = new Date(createdAt);
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Muestra el typing indicator cuando el comercial está escribiendo
     */
    public showTypingIndicator(): void {
        debugLog('[ChatMessagesUI] 📝 Mostrando typing indicator');
        this.typingIndicator.show();

        // Auto-scroll al typing indicator si el usuario está cerca del bottom
        const { scrollTop, scrollHeight, clientHeight } = this.messagesContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (isNearBottom) {
            this.scrollToBottom();
        }
    }

    /**
     * Oculta el typing indicator
     */
    public hideTypingIndicator(): void {
        debugLog('[ChatMessagesUI] 📝 Ocultando typing indicator');
        this.typingIndicator.hide();
    }

    /**
     * Verifica si el typing indicator está visible
     */
    public isTypingIndicatorVisible(): boolean {
        return this.typingIndicator.isShown();
    }

    /**
     * Reconstruye los separadores de fecha para todos los mensajes
     * Lee el timestamp desde el atributo data-created-at de cada mensaje
     */
    private rebuildDateSeparators(): void {
        // Eliminar separadores existentes
        const existingSeparators = this.messagesContainer.querySelectorAll('.chat-date-separator');
        existingSeparators.forEach(sep => sep.parentNode?.removeChild(sep));

        // Obtener todos los mensajes (excluyendo typing indicator y loading indicators)
        const messageWrappers = Array.from(
            this.messagesContainer.querySelectorAll('.chat-message-wrapper')
        ) as HTMLElement[];

        if (messageWrappers.length === 0) return;

        let currentDateStr: string | null = null;

        messageWrappers.forEach((wrapper) => {
            // ✅ Leer timestamp del data attribute (agregado por MessageRenderer)
            const createdAtAttr = wrapper.getAttribute('data-created-at');
            const messageDate = createdAtAttr ? new Date(createdAtAttr) : new Date();
            const messageDateStr = formatDate(messageDate);

            if (messageDateStr !== currentDateStr) {
                currentDateStr = messageDateStr;

                const separator = createDateSeparator(messageDateStr);

                // Insertar separador antes del mensaje
                this.messagesContainer.insertBefore(separator, wrapper);
            }
        });

        debugLog('[ChatMessagesUI] ✅ Date separators rebuilt');
    }

    /**
     * Destruye el componente y limpia listeners
     */
    public destroy(): void {
        this.messagesContainer.removeEventListener('scroll', this.handleScroll);
        this.clearMessages();

        // Desuscribirse de typing events
        if (this.typingUnsubscribe) {
            this.typingUnsubscribe();
            this.typingUnsubscribe = null;
        }

        // Destruir typing indicator
        this.typingIndicator.destroy();
        this.typingIndicatorContainer = null;

        // Limpiar referencias
        this.presenceService = null;

        this.chatId = null;
        this.currentCursor = null;
        this.hasMoreMessages = true;
        this.isLoading = false;
        this.preventAutoScrollLoad = false; // Reset del flag
    }

    /**
     * Obtiene el estado actual del scroll infinito
     */
    public getScrollState(): { hasMore: boolean; isLoading: boolean; messageCount: number } {
        return {
            hasMore: this.hasMoreMessages,
            isLoading: this.isLoading,
            messageCount: this.messagesContainer.children.length
        };
    }

    /**
     * Verifica si el chat está inicializado para un chatId específico
     * @param chatId ID del chat a verificar
     * @returns true si el chat está inicializado
     */
    public isChatInitialized(chatId?: string): boolean {
        if (chatId) {
            return this.chatId === chatId && !this.isInitialLoad;
        }
        return this.chatId !== null && !this.isInitialLoad;
    }

    /**
     * Obtiene el ID del chat actual
     * @returns El ID del chat actual o null si no hay chat inicializado
     */
    public getCurrentChatId(): string | null {
        return this.chatId;
    }

    /**
     * Verifica si el sistema está cargando mensajes
     * @returns true si está cargando mensajes
     */
    public isLoadingMessages(): boolean {
        return this.isLoading;
    }
}