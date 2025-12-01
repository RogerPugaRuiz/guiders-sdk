import { MessageV2, AIConfig } from '../../types';
import { AIMetadata } from '../../types/websocket-types';

export type Sender = 'user' | 'agent' | 'system' | 'ai';

export interface MessageRenderData {
    id?: string;
    content: string;
    sender: Sender;
    timestamp?: number | string;
    senderId?: string;
    // 🤖 Campos para mensajes de IA
    isAI?: boolean;
    aiMetadata?: AIMetadata;
}

// 🤖 Configuración de IA para el renderer (singleton)
let aiRenderConfig: AIConfig = {
    enabled: true,
    showAIIndicator: true,
    aiAvatarEmoji: '🤖',
    aiSenderName: 'Asistente IA',
    showTypingIndicator: true
};

/**
 * Utilidad unificada para renderizar mensajes de chat
 * Esta función garantiza que todos los mensajes (enviados nuevos, cargados dinámicamente, etc.)
 * tengan exactamente el mismo estilo y estructura visual.
 */
export class MessageRenderer {

    /**
     * 🤖 Actualiza la configuración de IA para el renderer
     */
    public static setAIConfig(config: Partial<AIConfig>): void {
        aiRenderConfig = { ...aiRenderConfig, ...config };
    }

    /**
     * 🤖 Obtiene la configuración de IA actual
     */
    public static getAIConfig(): AIConfig {
        return { ...aiRenderConfig };
    }

    /**
     * Crea un elemento de mensaje unificado
     * @param data - Datos del mensaje para renderizar
     * @returns HTMLElement con el mensaje renderizado con estilos modernos
     */
    public static createMessageElement(data: MessageRenderData): HTMLDivElement {
        const messageDiv = document.createElement('div');
        const isUserMessage = data.sender === 'user';
        const isAIMessage = data.isAI === true || data.sender === 'ai';

        // ✅ USAR CLASES COMPATIBLES CON ChatUI - estructura esperada
        let wrapperClasses = isUserMessage
            ? 'chat-message-wrapper chat-message-user-wrapper'
            : 'chat-message-wrapper chat-message-other-wrapper';

        // 🤖 Añadir clase de IA si corresponde
        if (isAIMessage) {
            wrapperClasses += ' chat-message-ai-wrapper';
        }

        messageDiv.className = wrapperClasses;

        // Agregar ID si está disponible
        if (data.id) {
            messageDiv.setAttribute('data-message-id', data.id);
        }

        // 🤖 Marcar como mensaje de IA
        if (isAIMessage) {
            messageDiv.setAttribute('data-ai-message', 'true');
            if (data.aiMetadata?.model) {
                messageDiv.setAttribute('data-ai-model', data.aiMetadata.model);
            }
        }

        // ✅ Agregar timestamp para date separators
        if (data.timestamp) {
            const timestamp = typeof data.timestamp === 'string'
                ? data.timestamp
                : new Date(data.timestamp).toISOString();
            messageDiv.setAttribute('data-created-at', timestamp);
        }

        // Crear estructura compatible con ChatUI pero con estilos modernos
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';

        const chatMessage = document.createElement('div');
        let messageClasses = isUserMessage ? 'chat-message chat-message-user' : 'chat-message chat-message-other';
        if (isAIMessage) {
            messageClasses += ' chat-message-ai';
        }
        chatMessage.className = messageClasses;

        // 🤖 Header de IA (solo si está habilitado)
        if (isAIMessage && aiRenderConfig.showAIIndicator !== false) {
            const aiHeader = this.createAIHeader();
            chatMessage.appendChild(aiHeader);
        }

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        // Limpiar saltos de línea y espacios múltiples del contenido
        const cleanContent = data.content
            .replace(/\r\n/g, ' ')  // Reemplazar saltos de línea Windows
            .replace(/\n/g, ' ')     // Reemplazar saltos de línea Unix
            .replace(/\r/g, ' ')     // Reemplazar retornos de carro
            .replace(/\s+/g, ' ')    // Reemplazar múltiples espacios con uno solo
            .trim();                 // Eliminar espacios al inicio/final
        messageText.textContent = cleanContent;

        const messageTime = document.createElement('div');
        messageTime.className = 'chat-message-time';
        messageTime.textContent = isUserMessage ? `${this.formatTime(data.timestamp)} ✓` : this.formatTime(data.timestamp);

        chatMessage.appendChild(messageText);
        chatMessage.appendChild(messageTime);
        contentWrapper.appendChild(chatMessage);
        messageDiv.appendChild(contentWrapper);

        // Aplicar estilos modernos formales
        this.applyModernMessageStyles(messageDiv, isUserMessage, isAIMessage);

        return messageDiv;
    }

    /**
     * 🤖 Crea el header de IA con avatar, nombre y badge
     */
    private static createAIHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'ai-message-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(66, 133, 244, 0.15);
        `;

        // Avatar emoji
        const avatar = document.createElement('span');
        avatar.className = 'ai-avatar';
        avatar.textContent = aiRenderConfig.aiAvatarEmoji || '🤖';
        avatar.style.cssText = `
            font-size: 14px;
        `;

        // Nombre
        const name = document.createElement('span');
        name.className = 'ai-sender-name';
        name.textContent = aiRenderConfig.aiSenderName || 'Asistente IA';
        name.style.cssText = `
            font-size: 12px;
            font-weight: 500;
            color: #4285f4;
        `;

        // Badge
        const badge = document.createElement('span');
        badge.className = 'ai-badge';
        badge.textContent = 'IA';
        badge.style.cssText = `
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            font-size: 9px;
            font-weight: 600;
            padding: 2px 5px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        header.appendChild(avatar);
        header.appendChild(name);
        header.appendChild(badge);

        return header;
    }
    
    /**
     * Convierte MessageV2 (de API) a MessageRenderData
     */
    public static fromMessageV2(message: MessageV2): MessageRenderData {
        return {
            id: message.id,
            content: message.content,
            sender: this.determineSender(message),
            timestamp: message.createdAt,
            senderId: message.senderId
        };
    }
    
    /**
     * Determina el tipo de sender basado en MessageV2
     */
    private static determineSender(message: MessageV2): Sender {
        // Lógica idéntica a ChatMessagesUI.isUserMessage
        try {
            const visitorId = localStorage.getItem('visitorId');
            if (visitorId && message.senderId === visitorId) {
                return 'user';
            }
        } catch (error) {
        }
        
        // Determinar por tipo si está disponible
        if (message.type === 'user') {
            return 'user';
        }
        if (message.type === 'system') {
            return 'system';
        }
        
        // Fallback: es un agente/asistente
        return 'agent';
    }
    
    /**
     * Obtiene las iniciales del participante para el avatar
     */
    private static getParticipantInitials(senderId: string): string {
        if (!senderId) {
            return 'BOT';
        }
        
        // Si es un ID simple, usar las primeras letras
        if (senderId.length <= 3) {
            return senderId.toUpperCase();
        }
        
        // Extraer iniciales de nombre si está presente
        const words = senderId.split(/[\s_-]+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        
        return senderId.substring(0, 2).toUpperCase();
    }
    
    /**
     * Escapa HTML para prevenir XSS
     */
    private static escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Formatea timestamp a hora legible
     */
    private static formatTime(timestamp?: number | string): string {
        let date: Date;
        
        if (!timestamp) {
            date = new Date();
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            date = new Date(timestamp);
        }
        
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    /**
     * Aplica estilos CSS modernos a un mensaje
     * Esta es la función clave que define el aspecto visual unificado
     */
    private static applyModernMessageStyles(messageDiv: HTMLElement, isUserMessage: boolean, isAIMessage: boolean = false): void {
        const avatar = messageDiv.querySelector('.chat-avatar') as HTMLElement;
        const messageEl = messageDiv.querySelector('.chat-message') as HTMLElement;
        const text = messageDiv.querySelector('.message-text') as HTMLElement;
        const time = messageDiv.querySelector('.chat-message-time') as HTMLElement;
        const contentWrapper = messageDiv.querySelector('.message-content-wrapper') as HTMLElement;

        // ✅ ESTILOS WRAPPER - Compatible con ChatUI
        messageDiv.style.cssText = `
            display: flex;
            align-items: flex-end;
            margin-bottom: 3px;
            ${isUserMessage ? 'flex-direction: row-reverse; margin-left: 30%;' : 'flex-direction: row; margin-right: 30%;'}
            opacity: 1;
            transform: translateY(0);
        `;

        // ✅ AVATAR (solo para mensajes de otros) - Diseño profesional
        if (avatar) {
            avatar.style.cssText = `
                margin-right: 12px;
                margin-bottom: 4px;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
            `;
            
            const avatarCircle = avatar.querySelector('.avatar-circle') as HTMLElement;
            if (avatarCircle) {
                avatarCircle.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    border: none;
                    box-sizing: border-box;
                    min-width: 32px;
                    min-height: 32px;
                    max-width: 32px;
                    max-height: 32px;
                `;
            }
        }

        // ✅ WRAPPER DE CONTENIDO - Unificado para ambos tipos de mensaje
        if (contentWrapper) {
            contentWrapper.style.cssText = `
                display: flex;
                flex-direction: column;
                ${isUserMessage ? 'align-items: flex-end;' : 'align-items: flex-start;'}
                max-width: 100%;
            `;
        }

        // ✅ MENSAJE PRINCIPAL - Con layout en fila para texto + hora
        if (messageEl) {
            // 🤖 Estilos específicos para mensajes de IA
            let messageBackground: string;
            let messageBorder: string = '';

            if (isUserMessage) {
                messageBackground = `background: #D1E7FF;`;
                messageBorder = `border-bottom-right-radius: 2px;`;
            } else if (isAIMessage) {
                // Estilo distintivo para mensajes de IA: gradiente azul claro con borde lateral
                messageBackground = `background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fe 100%);`;
                messageBorder = `border-bottom-left-radius: 2px; border-left: 3px solid #4285f4;`;
            } else {
                messageBackground = `background: #FFFFFF;`;
                messageBorder = `border-bottom-left-radius: 2px;`;
            }

            messageEl.style.cssText = `
                padding: 8px 12px;
                border-radius: 10px;
                position: relative;
                overflow-wrap: break-word;
                word-wrap: break-word;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                display: inline-flex;
                flex-direction: ${isAIMessage ? 'column' : 'row'};
                flex-wrap: nowrap;
                align-items: ${isAIMessage ? 'stretch' : 'flex-end'};
                gap: 6px;
                max-width: 100%;
                ${messageBackground}
                color: #2c3e50;
                ${messageBorder}
                transition: all 0.2s ease;
            `;
        }

                // ✅ TEXTO DEL MENSAJE - TIPOGRAFÍA OPTIMIZADA
        if (text) {
            text.style.cssText = `
                font-size: 14px;
                line-height: 1.4;
                margin: 0;
                overflow-wrap: break-word;
                word-wrap: break-word;
                white-space: normal;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                color: #2c3e50;
            `;
        }

        // ✅ TIEMPO - Dentro de la burbuja del mensaje
        if (time) {
            time.style.cssText = `
                font-size: 10px;
                color: rgba(44, 62, 80, 0.5);
                font-weight: 400;
                letter-spacing: 0.01em;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                white-space: nowrap;
                flex-shrink: 0;
                opacity: 0.9;
            `;
        }

        // ✅ EFECTOS HOVER - CONSISTENTE CON COLORES DEL HEADER
        if (messageEl) {
            // Efecto hover deshabilitado por solicitud del usuario
        }
        
        // Añadir animación CSS si no existe
        this.ensureAnimationStyles();
    }
    
    /**
     * Asegura que las animaciones CSS estén disponibles
     */
    private static ensureAnimationStyles(): void {
        const existingStyle = document.getElementById('guiders-message-animations');
        if (existingStyle) return;
        
        const style = document.createElement('style');
        style.id = 'guiders-message-animations';
        style.innerHTML = `
            @keyframes messageSlideIn {
                0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                    filter: blur(4px);
                }
                50% {
                    opacity: 0.7;
                    transform: translateY(8px) scale(0.98);
                    filter: blur(2px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    filter: blur(0);
                }
            }
            
            .modern-message {
                will-change: transform, opacity;
            }
            
            .modern-message .message-content {
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            .modern-message .message-avatar {
                transition: transform 0.2s ease;
            }
            
            /* Efecto hover del avatar deshabilitado por solicitud del usuario */
        `;
        document.head.appendChild(style);
    }
}