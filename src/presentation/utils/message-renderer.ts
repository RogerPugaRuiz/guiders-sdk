import { MessageV2 } from '../../types';

export type Sender = 'user' | 'agent' | 'system';

export interface MessageRenderData {
    id?: string;
    content: string;
    sender: Sender;
    timestamp?: number | string;
    senderId?: string;
}

/**
 * Utilidad unificada para renderizar mensajes de chat
 * Esta función garantiza que todos los mensajes (enviados nuevos, cargados dinámicamente, etc.)
 * tengan exactamente el mismo estilo y estructura visual.
 */
export class MessageRenderer {
    
    /**
     * Crea un elemento de mensaje unificado
     * @param data - Datos del mensaje para renderizar
     * @returns HTMLElement con el mensaje renderizado con estilos modernos
     */
    public static createMessageElement(data: MessageRenderData): HTMLDivElement {
        const messageDiv = document.createElement('div');
        const isUserMessage = data.sender === 'user';
        
        // ✅ USAR CLASES COMPATIBLES CON ChatUI - estructura esperada
        const wrapperClasses = isUserMessage 
            ? 'chat-message-wrapper chat-message-user-wrapper' 
            : 'chat-message-wrapper chat-message-other-wrapper';
        
        messageDiv.className = wrapperClasses;
        
        // Agregar ID si está disponible
        if (data.id) {
            messageDiv.setAttribute('data-message-id', data.id);
        }
        
        // Crear estructura compatible con ChatUI pero con estilos modernos
        if (isUserMessage) {
            // Estructura para mensajes del usuario - hora dentro de la burbuja
            messageDiv.innerHTML = `
                <div class="message-content-wrapper">
                    <div class="chat-message chat-message-user">
                        <div class="message-text">${this.escapeHtml(data.content)}</div>
                        <div class="chat-message-time">${this.formatTime(data.timestamp)} ✓</div>
                    </div>
                </div>
            `;
        } else {
            // Estructura para mensajes de otros con avatar - hora dentro de la burbuja
            messageDiv.innerHTML = `
                <div class="chat-avatar">
                    <div class="avatar-circle">
                        <span class="avatar-text">${this.getParticipantInitials(data.senderId || '')}</span>
                    </div>
                </div>
                <div class="message-content-wrapper">
                    <div class="chat-message chat-message-other">
                        <div class="message-text">${this.escapeHtml(data.content)}</div>
                        <div class="chat-message-time">${this.formatTime(data.timestamp)}</div>
                    </div>
                </div>
            `;
        }
        
        // Aplicar estilos modernos formales
        this.applyModernMessageStyles(messageDiv, isUserMessage);
        
        return messageDiv;
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
            console.warn('No se pudo determinar el visitor ID actual:', error);
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
    private static applyModernMessageStyles(messageDiv: HTMLElement, isUserMessage: boolean): void {
        const avatar = messageDiv.querySelector('.chat-avatar') as HTMLElement;
        const messageEl = messageDiv.querySelector('.chat-message') as HTMLElement;
        const text = messageDiv.querySelector('.message-text') as HTMLElement;
        const time = messageDiv.querySelector('.chat-message-time') as HTMLElement;
        const contentWrapper = messageDiv.querySelector('.message-content-wrapper') as HTMLElement;

        // ✅ ESTILOS WRAPPER - Compatible con ChatUI (MÁRGENES ULTRA MÍNIMOS)
        messageDiv.style.cssText = `
            display: flex;
            align-items: flex-end;
            margin-bottom: 3px;
            ${isUserMessage ? 'flex-direction: row-reverse; padding-left: 8px;' : 'flex-direction: row; padding-right: 8px;'}
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
                ${isUserMessage ? 'align-items: flex-end; max-width: 70%;' : 'align-items: flex-start; max-width: 65%;'}
                min-width: 120px;
            `;
        }

        // ✅ MENSAJE PRINCIPAL - Con layout en columna para texto + hora
        if (messageEl) {
            messageEl.style.cssText = `
                padding: 8px 12px;
                border-radius: 10px;
                position: relative;
                word-break: break-word;
                white-space: normal;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                display: flex;
                flex-direction: column;
                ${isUserMessage ? 
                    `background: linear-gradient(145deg, #0084ff 60%, #00c6fb 100%);
                     color: white;
                     border-bottom-right-radius: 3px;
                     box-shadow: 0 1px 2px rgba(0, 132, 255, 0.15);
                     max-width: 70%;
                     margin-left: auto;` : 
                    `background: white;
                     color: #1f2937;
                     border-bottom-left-radius: 3px;
                     box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
                     max-width: 85%;`
                }
                transition: all 0.2s ease;
            `;
        }

                // ✅ TEXTO DEL MENSAJE - TIPOGRAFÍA OPTIMIZADA
        if (text) {
            text.style.cssText = `
                font-size: 14px;
                line-height: 1.4;
                margin: 0;
                word-break: break-word;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                flex: 1;
                ${isUserMessage ? 
                    'color: rgba(255, 255, 255, 0.95);' : 
                    'color: #374151;'
                }
            `;
        }

        // ✅ TIEMPO - Dentro de la burbuja del mensaje
        if (time) {
            time.style.cssText = `
                font-size: 10px;
                color: ${isUserMessage ? 'rgba(255, 255, 255, 0.8)' : 'rgba(60, 60, 67, 0.5)'};
                font-weight: 400;
                letter-spacing: 0.01em;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                margin-top: 4px;
                text-align: right;
                display: block;
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