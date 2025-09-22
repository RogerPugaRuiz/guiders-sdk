import { ChatMessagesUI } from '../src/presentation/chat-messages-ui';
import { MessageV2 } from '../src/types';

/**
 * Ejemplo de integración del nuevo sistema de chat con scroll infinito
 * 
 * Características implementadas:
 * ✅ Scroll automático al bottom al abrir el chat
 * ✅ Scroll infinito hacia arriba para cargar mensajes antiguos
 * ✅ Carga suave sin afectar la experiencia del usuario
 * ✅ API cursor-based pagination compatible con la estructura especificada
 */

// Configuración del endpoint para pruebas
if (typeof window !== 'undefined') {
    (window as any).GUIDERS_CONFIG = {
        endpoint: 'http://localhost:3000/api',
        wsEndpoint: 'ws://localhost:3000'
    };
}

/**
 * Clase de ejemplo que demuestra cómo integrar el chat con scroll infinito
 */
export class ChatScrollInfinitoExample {
    private chatUI: ChatMessagesUI | null = null;
    private container: HTMLElement;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`No se encontró el contenedor con ID: ${containerId}`);
        }
        this.container = container;
    }

    /**
     * Inicializa el chat con un ID específico
     */
    async inicializarChat(chatId: string): Promise<void> {
        console.log(`🚀 [Example] Inicializando chat: ${chatId}`);
        
        try {
            // Crear instancia del chat UI
            this.chatUI = new ChatMessagesUI(this.container);
            
            // Inicializar con el chat ID
            // Esto automáticamente:
            // 1. Carga los mensajes iniciales (20 por defecto)
            // 2. Hace scroll al bottom para mostrar los más recientes
            // 3. Configura el scroll infinito para cargar mensajes antiguos
            await this.chatUI.initializeChat(chatId);
            
            console.log(`✅ [Example] Chat inicializado exitosamente`);
            
            // Mostrar estado del scroll infinito
            const estado = this.chatUI.getScrollState();
            console.log(`📊 [Example] Estado inicial:`, estado);
            
        } catch (error) {
            console.error(`❌ [Example] Error inicializando chat:`, error);
            throw error;
        }
    }

    /**
     * Agrega un nuevo mensaje en tiempo real
     * Útil para integrar con WebSocket o nuevos mensajes de la API
     */
    agregarNuevoMensaje(contenido: string, esDelUsuario: boolean = false): void {
        if (!this.chatUI) {
            console.warn('⚠️ [Example] Chat no inicializado');
            return;
        }

        const mensaje: MessageV2 = {
            id: `msg-${Date.now()}`,
            chatId: 'chat-example',
            senderId: esDelUsuario ? 'usuario-actual' : 'asesor-123',
            content: contenido,
            type: 'TEXT',
            isInternal: false,
            isFirstResponse: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Agregar el mensaje automáticamente hace scroll al bottom
        this.chatUI.addNewMessage(mensaje);
        
        console.log(`💬 [Example] Mensaje agregado: ${contenido.substring(0, 30)}...`);
    }

    /**
     * Fuerza scroll al bottom manualmente
     * Útil si el usuario quiere ir al final rápidamente
     */
    irAlFinal(): void {
        if (!this.chatUI) {
            console.warn('⚠️ [Example] Chat no inicializado');
            return;
        }

        this.chatUI.scrollToBottom();
        console.log(`⬇️ [Example] Scroll al bottom realizado`);
    }

    /**
     * Obtiene el estado actual del scroll infinito
     */
    obtenerEstado(): { hasMore: boolean; isLoading: boolean; messageCount: number } {
        if (!this.chatUI) {
            return { hasMore: false, isLoading: false, messageCount: 0 };
        }

        return this.chatUI.getScrollState();
    }

    /**
     * Destruye el chat y limpia recursos
     */
    destruir(): void {
        if (this.chatUI) {
            this.chatUI.destroy();
            this.chatUI = null;
            console.log(`🧹 [Example] Chat destruido y limpiado`);
        }
    }
}

/**
 * Función de utilidad para configurar tokens de prueba
 */
export function configurarTokenDePrueba(userId: string = 'usuario-test'): void {
    // Simular token JWT para pruebas
    const fakeToken = btoa(JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: { 
            sub: userId, 
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora
        },
        signature: 'test-signature'
    }));

    localStorage.setItem('accessToken', fakeToken);
    console.log(`🔑 [Example] Token de prueba configurado para usuario: ${userId}`);
}

/**
 * Ejemplo de uso básico
 */
export async function ejemploUsoBasico(): Promise<void> {
    console.log(`📖 [Example] Iniciando ejemplo de uso básico`);

    // 1. Configurar token de prueba
    configurarTokenDePrueba('usuario-123');

    // 2. Crear contenedor HTML
    const contenedor = document.createElement('div');
    contenedor.id = 'chat-container-example';
    contenedor.style.cssText = `
        width: 400px;
        height: 600px;
        margin: 20px auto;
        border: 1px solid #ccc;
        border-radius: 8px;
        overflow: hidden;
        background: #f9f9f9;
    `;
    document.body.appendChild(contenedor);

    // 3. Crear instancia del chat
    const chatExample = new ChatScrollInfinitoExample('chat-container-example');

    // 4. Inicializar con un chat ID de ejemplo
    try {
        await chatExample.inicializarChat('9efcc62d-fb34-42e1-8414-62f3bc55180f');
        
        // 5. Simular algunos mensajes adicionales después de un delay
        setTimeout(() => {
            chatExample.agregarNuevoMensaje('¡Hola! Este es un mensaje de prueba del asesor', false);
        }, 2000);

        setTimeout(() => {
            chatExample.agregarNuevoMensaje('Respuesta del usuario simulada', true);
        }, 4000);

        console.log(`✅ [Example] Ejemplo completado exitosamente`);
        
    } catch (error) {
        console.error(`❌ [Example] Error en el ejemplo:`, error);
    }
}

// Auto-ejecutar ejemplo si este archivo se carga directamente
if (typeof window !== 'undefined' && window.location.pathname.includes('example')) {
    document.addEventListener('DOMContentLoaded', ejemploUsoBasico);
}