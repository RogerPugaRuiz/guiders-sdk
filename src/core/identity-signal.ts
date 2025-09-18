import { AsyncSignal, Signal } from './signal';
import { VisitorsV2Service, IdentifyVisitorResponse } from '../services/visitors-v2-service';
import { ChatV2Service } from '../services/chat-v2-service';
import { ChatListV2 } from '../types';

/**
 * Estado combinado de identity + chats
 */
export interface IdentityWithChatsData {
  identity: IdentifyVisitorResponse;
  chats: ChatListV2 | null;
}

/**
 * Signal especializado para chats que expone métodos de estado
 */
class ChatsSignal extends Signal<ChatListV2> {
  public setLoading(): void {
    super.setLoading();
  }

  public setSuccess(data: ChatListV2): void {
    super.setSuccess(data);
  }

  public setError(error: Error): void {
    super.setError(error);
  }
}

/**
 * Signal especializado para manejar la identificación del visitante
 * y automáticamente cargar sus chats cuando la identificación sea exitosa
 */
export class IdentitySignal extends AsyncSignal<IdentityWithChatsData> {
  private static instance: IdentitySignal;
  private chatsSignal: ChatsSignal;

  private constructor() {
    super();
    this.chatsSignal = new ChatsSignal();
  }

  /**
   * Obtiene la instancia singleton del IdentitySignal
   */
  public static getInstance(): IdentitySignal {
    if (!IdentitySignal.instance) {
      IdentitySignal.instance = new IdentitySignal();
    }
    return IdentitySignal.instance;
  }

  /**
   * Obtiene el signal de chats para poder suscribirse por separado
   */
  public getChatsSignal(): ChatsSignal {
    return this.chatsSignal;
  }

  /**
   * Ejecuta la identificación del visitante y automáticamente carga sus chats
   */
  public async identify(fingerprint: string, apiKey?: string): Promise<IdentityWithChatsData> {
    console.log('[IdentitySignal] 🚀 Iniciando identificación del visitante...');

    return this.execute(async () => {
      // 1. Identificar visitante
      const identity = await VisitorsV2Service.getInstance().identify(fingerprint, apiKey);
      
      if (!identity) {
        throw new Error('Failed to identify visitor');
      }

      console.log('[IdentitySignal] ✅ Visitante identificado:', identity.visitorId);

      // 2. Cargar chats automáticamente si se obtuvo visitorId
      let chats: ChatListV2 | null = null;
      
      if (identity.visitorId) {
        try {
          console.log('[IdentitySignal] 💬 Cargando chats del visitante...');
          this.chatsSignal.setLoading();
          
          chats = await ChatV2Service.getInstance().getVisitorChats(
            identity.visitorId, 
            undefined, 
            20
          );
          
          this.chatsSignal.setSuccess(chats);
          console.log('[IdentitySignal] ✅ Chats cargados:', chats.chats.length, 'chats encontrados');
        } catch (chatsError) {
          console.warn('[IdentitySignal] ⚠️ Error cargando chats:', chatsError);
          this.chatsSignal.setError(chatsError instanceof Error ? chatsError : new Error(String(chatsError)));
          // No lanzamos el error aquí para que identity siga siendo exitoso
        }
      } else {
        console.warn('[IdentitySignal] ⚠️ No se obtuvo visitorId, saltando carga de chats');
      }

      const result: IdentityWithChatsData = {
        identity,
        chats
      };

      return result;
    });
  }

  /**
   * Fuerza la recarga de chats para el visitante actual
   */
  public async reloadChats(): Promise<ChatListV2 | null> {
    const currentState = this.getState();
    
    if (!currentState.data?.identity?.visitorId) {
      console.warn('[IdentitySignal] ❌ No hay visitorId disponible para recargar chats');
      return null;
    }

    try {
      console.log('[IdentitySignal] 🔄 Recargando chats...');
      this.chatsSignal.setLoading();
      
      const chats = await ChatV2Service.getInstance().getVisitorChats(
        currentState.data.identity.visitorId, 
        undefined, 
        20
      );
      
      this.chatsSignal.setSuccess(chats);
      
      // Actualizar también el estado principal
      this.setSuccess({
        ...currentState.data,
        chats
      });
      
      console.log('[IdentitySignal] ✅ Chats recargados exitosamente');
      return chats;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('[IdentitySignal] ❌ Error recargando chats:', errorObj);
      this.chatsSignal.setError(errorObj);
      throw errorObj;
    }
  }

  /**
   * Obtiene solo los datos de identity del estado actual
   */
  public getIdentity(): IdentifyVisitorResponse | null {
    return this.getState().data?.identity || null;
  }

  /**
   * Obtiene solo los chats del estado actual
   */
  public getChats(): ChatListV2 | null {
    return this.getState().data?.chats || null;
  }

  /**
   * Verifica si el visitante está identificado
   */
  public isIdentified(): boolean {
    const identity = this.getIdentity();
    return !!(identity?.visitorId);
  }

  /**
   * Obtiene el visitorId actual
   */
  public getVisitorId(): string | null {
    return this.getIdentity()?.visitorId || null;
  }

  /**
   * Obtiene el sessionId actual
   */
  public getSessionId(): string | null {
    return this.getIdentity()?.sessionId || null;
  }

  /**
   * Resetea tanto el estado principal como el signal de chats
   */
  public reset(): void {
    super.reset();
    this.chatsSignal.reset();
  }

  /**
   * Limpia todas las suscripciones de ambos signals
   */
  public dispose(): void {
    super.dispose();
    this.chatsSignal.dispose();
  }
}

/**
 * Hook de conveniencia para usar el IdentitySignal
 */
export function useIdentitySignal() {
  const signal = IdentitySignal.getInstance();
  
  return {
    signal,
    identify: (fingerprint: string, apiKey?: string) => signal.identify(fingerprint, apiKey),
    reloadChats: () => signal.reloadChats(),
    getState: () => signal.getState(),
    getIdentity: () => signal.getIdentity(),
    getChats: () => signal.getChats(),
    getVisitorId: () => signal.getVisitorId(),
    getSessionId: () => signal.getSessionId(),
    isIdentified: () => signal.isIdentified(),
    isLoading: () => signal.isLoading(),
    hasError: () => signal.hasError(),
    subscribe: (callback: (state: any) => void) => signal.subscribe(callback),
    subscribeToChats: (callback: (state: any) => void) => signal.getChatsSignal().subscribe(callback),
    reset: () => signal.reset()
  };
}