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
            // Estructura para mensajes del usuario
            messageDiv.innerHTML = `
                <div class="chat-message chat-message-user">
                    <div class="message-text">${this.escapeHtml(data.content)}</div>
                </div>
                <div class="chat-message-time">${this.formatTime(data.timestamp)} ✓</div>
            `;
        } else {
            // Estructura para mensajes de otros con avatar
            messageDiv.innerHTML = `
                <div class="chat-avatar">
                    <div class="avatar-circle">
                        <span class="avatar-text">${this.getParticipantInitials(data.senderId || '')}</span>
                    </div>
                </div>
                <div class="message-content-wrapper">
                    <div class="chat-message chat-message-other">
                        <div class="message-text">${this.escapeHtml(data.content)}</div>
                    </div>
                    <div class="chat-message-time">${this.formatTime(data.timestamp)}</div>
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
            return 'AI';
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
                    font-size: 12px;
                    font-weight: 600;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                `;
            }
        }

        // ✅ WRAPPER DE CONTENIDO (para mensajes de otros)
        if (contentWrapper) {
            contentWrapper.style.cssText = `
                display: flex;
                flex-direction: column;
                max-width: 65%;
            `;
        }

        // ✅ MENSAJE PRINCIPAL - ESTILO ULTRA COMPACTO ADAPTADO AL CONTENIDO
        if (messageEl) {
            messageEl.style.cssText = `
                padding: 6px 10px;
                border-radius: 10px;
                position: relative;
                word-break: break-word;
                white-space: normal;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                display: inline-block;
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
                     box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);`
                }
                transition: all 0.2s ease;
            `;
        }

        // ✅ TEXTO DEL MENSAJE - TIPOGRAFÍA ULTRA COMPACTA
        if (text) {
            text.style.cssText = `
                font-size: 13px;
                line-height: 1.2;
                margin: 0;
                padding: 0;
                font-weight: 400;
                letter-spacing: -0.01em;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                ${isUserMessage ? 
                    'color: rgba(255, 255, 255, 0.95);' : 
                    'color: #374151;'
                }
            `;
        }

                // ✅ TIEMPO - Diseño minimalista
        if (time) {
            time.style.cssText = `
                font-size: 10px;
                color: ${isUserMessage ? 'rgba(0, 132, 255, 0.7)' : '#9ca3af'};
                font-weight: 400;
                letter-spacing: 0.02em;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                margin-top: 2px;
                ${isUserMessage ? 'text-align: right;' : 'text-align: left;'}
            `;
        }

        // ✅ EFECTOS HOVER - CONSISTENTE CON COLORES DEL HEADER
        if (messageEl) {
            messageEl.addEventListener('mouseenter', () => {
                if (isUserMessage) {
                    messageEl.style.background = 'linear-gradient(145deg, #0070e6 60%, #00b8e6 100%)';
                    messageEl.style.transform = 'translateY(-1px) scale(1.02)';
                    messageEl.style.boxShadow = '0 4px 20px rgba(0, 132, 255, 0.4)';
                } else {
                    messageEl.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
                    messageEl.style.transform = 'translateY(-1px) scale(1.02)';
                    messageEl.style.borderLeft = '3px solid #0084ff';
                }
            });
            
            messageEl.addEventListener('mouseleave', () => {
                if (isUserMessage) {
                    messageEl.style.background = 'linear-gradient(145deg, #0084ff 60%, #00c6fb 100%)';
                    messageEl.style.transform = 'translateY(0) scale(1)';
                    messageEl.style.boxShadow = '0 2px 8px rgba(0, 132, 255, 0.3)';
                } else {
                    messageEl.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
                    messageEl.style.transform = 'translateY(0) scale(1)';
                    messageEl.style.borderLeft = '3px solid #e5e7eb';
                }
            });
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
            
            .modern-message:hover .message-avatar {
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }
}