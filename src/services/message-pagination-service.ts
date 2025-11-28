import { EndpointManager } from '../core/tracking-pixel-SDK';
import { MessageV2, MessageListResponse } from '../types';
import { ChatV2Service } from './chat-v2-service';
import { getCommonHeaders, getCommonFetchOptions } from '../utils/http-headers';
import { debugLog } from '../utils/debug-logger';

/**
 * Servicio para cargar mensajes con paginación cursor-based
 * Maneja la carga inicial y el scroll infinito
 */
export class MessagePaginationService {
    private static instance: MessagePaginationService;

    private constructor() { }

    public static getInstance(): MessagePaginationService {
        if (!MessagePaginationService.instance) {
            MessagePaginationService.instance = new MessagePaginationService();
        }
        return MessagePaginationService.instance;
    }

    /**
     * Obtiene los headers de autorización para las peticiones
     */
    private getAuthHeaders(): Record<string, string> {
        return getCommonHeaders();
    }

    /**
     * Obtiene las opciones de fetch con autenticación
     */
    private getFetchOptions(): RequestInit {
        return getCommonFetchOptions('GET');
    }

    /**
     * Ejecuta una petición fetch con manejo automático de errores 401
     * Si recibe 401, intenta re-autenticar y reintentar la petición
     */
    private async fetchWithReauth(url: string, options: RequestInit): Promise<Response> {
        let response = await fetch(url, options);

        if (response.status === 401) {
            debugLog('[MessagePaginationService] ⚠️ Error 401 - Intentando re-autenticación...');

            // Intentar re-autenticar usando ChatV2Service
            const chatService = ChatV2Service.getInstance();
            const reauthed = await chatService.reAuthenticate();

            if (reauthed) {
                debugLog('[MessagePaginationService] ✅ Re-autenticación exitosa, reintentando petición...');
                // Reintentar la petición con las nuevas credenciales
                response = await fetch(url, {
                    ...options,
                    headers: this.getAuthHeaders()
                });
            } else {
                debugLog('[MessagePaginationService] ❌ Re-autenticación fallida');
            }
        }

        return response;
    }

    /**
     * Construye la URL base para mensajes
     */
    private getMessagesEndpoint(): string {
        const endpoints = EndpointManager.getInstance();
        const baseEndpoint = (localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint());
        const apiRoot = baseEndpoint.endsWith('/api') ? baseEndpoint : `${baseEndpoint}/api`;
        return `${apiRoot}/v2/messages`;
    }

    /**
     * Carga los mensajes más recientes de un chat (primera página)
     * @param chatId ID del chat
     * @param limit Número de mensajes a cargar (default: 20)
     * @returns Promise con la lista de mensajes
     */
    async loadInitialMessages(chatId: string, limit: number = 20): Promise<MessageListResponse> {
        debugLog(`📋 [MessagePagination] Cargando mensajes iniciales del chat: ${chatId}`);

        const url = `${this.getMessagesEndpoint()}/chat/${chatId}?limit=${limit}`;

        try {
            const response = await this.fetchWithReauth(url, this.getFetchOptions());
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al cargar mensajes iniciales (${response.status}): ${errorText}`);
            }

            const messageList = await response.json() as MessageListResponse;
            
            // 🔧 Mapear nextCursor a cursor para compatibilidad con scroll infinito
            if (messageList.nextCursor && !messageList.cursor) {
                messageList.cursor = messageList.nextCursor;
            }
            
            debugLog(`✅ [MessagePagination] Mensajes iniciales cargados:`, {
                count: messageList.messages?.length || 0,
                total: messageList.total,
                hasMore: messageList.hasMore,
                hasCursor: !!messageList.cursor
            });

            return messageList;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Carga mensajes más antiguos usando cursor-based pagination
     * @param chatId ID del chat
     * @param cursor Cursor para la siguiente página
     * @param limit Número de mensajes a cargar (default: 20)
     * @returns Promise con la lista de mensajes antiguos
     */
    async loadOlderMessages(chatId: string, cursor: string, limit: number = 20): Promise<MessageListResponse> {
        debugLog(`📜 [MessagePagination] Cargando mensajes antiguos del chat: ${chatId} con cursor: ${cursor.substring(0, 20)}...`);
        
        const encodedCursor = encodeURIComponent(cursor);
        const url = `${this.getMessagesEndpoint()}/chat/${chatId}?limit=${limit}&cursor=${encodedCursor}`;
        
        try {
            const response = await this.fetchWithReauth(url, this.getFetchOptions());

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al cargar mensajes antiguos (${response.status}): ${errorText}`);
            }

            const messageList = await response.json() as MessageListResponse;
            
            // 🔧 Mapear nextCursor a cursor para compatibilidad con scroll infinito
            if (messageList.nextCursor && !messageList.cursor) {
                messageList.cursor = messageList.nextCursor;
            }
            
            debugLog(`✅ [MessagePagination] Mensajes antiguos cargados:`, {
                count: messageList.messages?.length || 0,
                total: messageList.total,
                hasMore: messageList.hasMore,
                hasCursor: !!messageList.cursor
            });

            return messageList;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Valida si un cursor es válido
     * @param cursor Cursor a validar
     * @returns true si el cursor es válido
     */
    isValidCursor(cursor: string): boolean {
        if (!cursor || cursor.trim() === '') {
            return false;
        }
        
        try {
            // El cursor debe ser un string base64 válido
            atob(cursor);
            return true;
        } catch (error) {
            return false;
        }
    }
}