import { MessagePaginationService } from '../services/message-pagination-service';
import { MessageV2, MessageListResponse } from '../types';

/**
 * Componente de UI de mensajes con scroll infinito
 * Características:
 * - Scroll automático al bottom al abrir
 * - Scroll infinito hacia arriba para cargar mensajes antiguos
 * - Interfaz simple y fluida
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
    
    // Elementos de loading
    private topLoadingIndicator: HTMLElement | null = null;
    
    // Configuración
    private readonly SCROLL_THRESHOLD = 100; // pixels desde el top para activar carga
    private readonly MESSAGE_LIMIT = 20; // mensajes por página

    constructor(container: HTMLElement) {
        this.container = container;
        this.messagePaginationService = MessagePaginationService.getInstance();
        this.setupUI();
        this.setupScrollListener();
    }

    /**
     * Configura la interfaz de usuario
     */
    private setupUI(): void {
        // Limpiar contenedor
        this.container.innerHTML = '';
        
        // Crear contenedor de mensajes
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'chat-messages-container';
        this.messagesContainer.style.cssText = `
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            padding: 16px;
            scroll-behavior: smooth;
        `;
        
        this.container.appendChild(this.messagesContainer);
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
        // Solo activar si tenemos un chat cargado y hay más mensajes
        if (!this.chatId || !this.hasMoreMessages || this.isLoading) {
            return;
        }

        const { scrollTop } = this.messagesContainer;
        
        // Si el usuario ha hecho scroll cerca del top, cargar más mensajes
        if (scrollTop <= this.SCROLL_THRESHOLD) {
            await this.loadOlderMessages();
        }
    }

    /**
     * Inicializa el chat con un ID específico
     * Carga los mensajes iniciales y hace scroll al bottom
     * @param chatId ID del chat
     */
    async initializeChat(chatId: string): Promise<void> {
        console.log(`💬 [ChatMessagesUI] Inicializando chat: ${chatId}`);
        
        if (this.chatId === chatId && !this.isInitialLoad) {
            console.log(`💬 [ChatMessagesUI] Chat ${chatId} ya está inicializado`);
            return;
        }

        this.chatId = chatId;
        this.isInitialLoad = true;
        this.currentCursor = null;
        this.hasMoreMessages = true;
        this.isLoading = false;

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
            console.log(`📋 [ChatMessagesUI] Cargando mensajes iniciales...`);
            
            const response = await this.messagePaginationService.loadInitialMessages(
                this.chatId, 
                this.MESSAGE_LIMIT
            );

            this.renderInitialMessages(response);
            this.updatePaginationState(response);
            
            // Hacer scroll al bottom automáticamente al abrir
            this.scrollToBottom();
            
            console.log(`✅ [ChatMessagesUI] Mensajes iniciales cargados y scroll al bottom realizado`);
            
        } catch (error) {
            console.error('❌ [ChatMessagesUI] Error cargando mensajes iniciales:', error);
            this.showErrorMessage('Error al cargar mensajes');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Carga mensajes más antiguos (scroll infinito)
     */
    private async loadOlderMessages(): Promise<void> {
        if (!this.chatId || !this.currentCursor || !this.hasMoreMessages) {
            return;
        }

        try {
            this.isLoading = true;
            this.showTopLoadingIndicator();
            
            console.log(`📜 [ChatMessagesUI] Cargando mensajes antiguos...`);
            
            // Guardar posición de scroll actual
            const scrollHeightBefore = this.messagesContainer.scrollHeight;
            const scrollTopBefore = this.messagesContainer.scrollTop;
            
            const response = await this.messagePaginationService.loadOlderMessages(
                this.chatId,
                this.currentCursor,
                this.MESSAGE_LIMIT
            );

            this.renderOlderMessages(response);
            this.updatePaginationState(response);
            
            // Mantener posición de scroll relativa (suave, sin salto)
            const scrollHeightAfter = this.messagesContainer.scrollHeight;
            const heightDifference = scrollHeightAfter - scrollHeightBefore;
            this.messagesContainer.scrollTop = scrollTopBefore + heightDifference;
            
            console.log(`✅ [ChatMessagesUI] ${response.messages.length} mensajes antiguos cargados`);
            
        } catch (error) {
            console.error('❌ [ChatMessagesUI] Error cargando mensajes antiguos:', error);
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
    }

    /**
     * Renderiza mensajes más antiguos al principio del contenedor
     */
    private renderOlderMessages(response: MessageListResponse): void {
        if (!response.messages || response.messages.length === 0) {
            return;
        }

        // Los mensajes antiguos se insertan al principio en orden cronológico
        const messages = [...response.messages].reverse();
        
        messages.forEach((message, index) => {
            const messageElement = this.createMessageElement(message);
            
            // Insertar al principio del contenedor
            const firstMessage = this.messagesContainer.firstChild;
            if (firstMessage) {
                this.messagesContainer.insertBefore(messageElement, firstMessage);
            } else {
                this.messagesContainer.appendChild(messageElement);
            }
        });
    }

    /**
     * Crea un elemento HTML para un mensaje
     */
    private createMessageElement(message: MessageV2): HTMLElement {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.setAttribute('data-message-id', message.id);
        
        // Determinar si es mensaje del usuario o de otro
        const isUserMessage = this.isUserMessage(message);
        const messageClass = isUserMessage ? 'user-message' : 'other-message';
        
        messageDiv.innerHTML = `
            <div class="message-wrapper ${messageClass}">
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                    <div class="message-time">${this.formatMessageTime(message.createdAt)}</div>
                </div>
            </div>
        `;

        // Aplicar estilos inline para garantizar consistencia
        this.applyMessageStyles(messageDiv, isUserMessage);
        
        return messageDiv;
    }

    /**
     * Aplica estilos CSS inline a un mensaje
     */
    private applyMessageStyles(messageDiv: HTMLElement, isUserMessage: boolean): void {
        const wrapper = messageDiv.querySelector('.message-wrapper') as HTMLElement;
        const content = messageDiv.querySelector('.message-content') as HTMLElement;
        const text = messageDiv.querySelector('.message-text') as HTMLElement;
        const time = messageDiv.querySelector('.message-time') as HTMLElement;

        // Estilos base del mensaje
        messageDiv.style.cssText = `
            margin-bottom: 12px;
            display: flex;
            ${isUserMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        `;

        wrapper.style.cssText = `
            max-width: 80%;
            display: flex;
            flex-direction: column;
        `;

        content.style.cssText = `
            padding: 12px 16px;
            border-radius: 18px;
            word-break: break-word;
            ${isUserMessage ? 
                'background: linear-gradient(145deg, #0084ff, #0062cc); color: white; border-bottom-right-radius: 4px;' : 
                'background: white; color: #333; border: 1px solid #e1e9f1; border-bottom-left-radius: 4px;'
            }
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        `;

        text.style.cssText = `
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        `;

        time.style.cssText = `
            font-size: 11px;
            color: ${isUserMessage ? 'rgba(255,255,255,0.8)' : '#8a9aa9'};
            margin-top: 4px;
            ${isUserMessage ? 'text-align: right;' : 'text-align: left;'}
        `;
    }

    /**
     * Determina si un mensaje es del usuario actual
     */
    private isUserMessage(message: MessageV2): boolean {
        // Obtener el ID del usuario actual desde el token de acceso
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                return message.senderId === payload.sub;
            }
        } catch (error) {
            console.warn('No se pudo determinar el usuario actual:', error);
        }
        
        // Fallback: asumir que es del usuario si no podemos determinarlo
        return false;
    }

    /**
     * Actualiza el estado de paginación
     */
    private updatePaginationState(response: MessageListResponse): void {
        this.hasMoreMessages = response.hasMore;
        
        // Actualizar cursor si está disponible
        if (response.cursor && response.hasMore) {
            this.currentCursor = response.cursor;
        } else {
            this.currentCursor = null;
        }

        console.log(`📊 [ChatMessagesUI] Estado paginación actualizado:`, {
            hasMore: this.hasMoreMessages,
            hasCursor: !!this.currentCursor,
            totalMessages: this.messagesContainer.children.length
        });
    }

    /**
     * Hace scroll al final del contenedor (mensajes más recientes)
     */
    public scrollToBottom(): void {
        requestAnimationFrame(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
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
     */
    private clearMessages(): void {
        this.messagesContainer.innerHTML = '';
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
     * Destruye el componente y limpia listeners
     */
    public destroy(): void {
        this.messagesContainer.removeEventListener('scroll', this.handleScroll);
        this.clearMessages();
        this.chatId = null;
        this.currentCursor = null;
        this.hasMoreMessages = true;
        this.isLoading = false;
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
}