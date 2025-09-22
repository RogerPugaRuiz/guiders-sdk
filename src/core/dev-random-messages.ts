/**
 * Dev Random Messages Generator
 * 
 * Script para generar mensajes aleatorios cuando se escribe "#random" en el chat.
 * Solo se activa en modo development y usa el endpoint real de dev.
 * 
 * Funcionalidades:
 * - Intercepta comandos "#random" y "#random:N" antes de enviarlos como mensajes
 * - Genera contenido aleatorio variado (preguntas, comentarios, emojis)
 * - Usa el servicio real de chat para enviar mensajes
 * - Solo funciona en modo dev para evitar spam en producción
 * - Los comandos no aparecen en el historial del chat
 */

import { ChatV2Service } from '../services/chat-v2-service';
import { resolveDefaultEndpoints } from './endpoint-resolver';

export interface RandomMessageConfig {
  enabled: boolean;
  minInterval: number; // Intervalo mínimo entre mensajes (ms)
  maxInterval: number; // Intervalo máximo entre mensajes (ms)
  messageCount: number; // Número de mensajes a generar
}

export class DevRandomMessages {
  private static instance: DevRandomMessages | null = null;
  private config: RandomMessageConfig = {
    enabled: false,
    minInterval: 1000,
    maxInterval: 3000,
    messageCount: 5
  };
  private isActive: boolean = false;
  private chatId: string | null = null;

  // Mensajes aleatorios variados para testing
  private readonly randomMessages = [
    // Preguntas sobre productos
    "¿Tienen descuentos disponibles?",
    "¿Cuál es el tiempo de entrega?",
    "¿Aceptan devoluciones?",
    "¿Tienen garantía los productos?",
    "¿Cuáles son los métodos de pago?",
    "¿Hacen envíos internacionales?",
    "¿Hay stock del producto?",
    "¿Cuándo llega la nueva colección?",
    "¿Tienen tallas más grandes?",
    "¿Puedo cambiar el producto?",
    
    // Comentarios casuales
    "Me gusta mucho este producto",
    "Estoy interesado en más información",
    "¿Hay más colores disponibles?",
    "El precio está bien 👍",
    "Necesito ayuda para elegir",
    "Muy buena calidad",
    "Perfecto para lo que busco",
    "Excelente atención al cliente",
    "Recomendado por un amigo",
    "Primera vez que compro aquí",
    
    // Mensajes técnicos de testing
    "Testing scroll infinito 🧪",
    "Verificando respuestas automáticas",
    "Probando notificaciones",
    "Test de rendimiento del chat",
    "Debug de mensajes largos: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Validando funcionalidad de chat",
    "Prueba de carga de mensajes",
    "Testing de latencia",
    "Verificando persistencia",
    "Test de reconexión",
    
    // Emojis y expresiones
    "😀 ¡Excelente servicio!",
    "🛒 Quiero comprar esto",
    "❓ Tengo una pregunta",
    "⭐ 5 estrellas para esta tienda",
    "🚀 Muy rápido el envío",
    "💝 Perfecto como regalo",
    "🔥 Oferta increíble",
    "👌 Todo perfecto",
    "💯 Recomendado al 100%",
    "🎉 ¡Genial!",
    
    // Mensajes cortos
    "Hola",
    "Gracias",
    "Perfecto",
    "OK",
    "Entendido",
    "Genial",
    "Bien",
    "Claro",
    "Por supuesto",
    "Muchas gracias",
    
    // Casos especiales para testing
    "Mensaje con\nnueva línea",
    "Texto con 'comillas' y \"comillas dobles\"",
    "Caracteres especiales: ñÑáéíóúÁÉÍÓÚ",
    "Números: 123 - 456.78 - $99.99",
    "Enlaces: https://ejemplo.com",
    "Mensaje muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy muy largo para testing",
    "Emojis múltiples: 🎯🚀💬🔥⭐👍🛒💝🎉",
    "TEXTO EN MAYÚSCULAS",
    "texto en minúsculas",
    "CaMeLcAsE tExTo",
    
    // Preguntas específicas de e-commerce
    "¿Cuánto cuesta el envío?",
    "¿Puedo pagar a plazos?",
    "¿Hay descuento por volumen?",
    "¿Cuál es la política de privacidad?",
    "¿Tienen programa de fidelidad?",
    "¿Hacen facturación empresarial?",
    "¿Puedo recoger en tienda?",
    "¿Tienen chat 24/7?",
    "¿Cuál es el horario de atención?",
    "¿Puedo hablar con un humano?",
    
    // Expresiones de satisfacción/insatisfacción
    "Estoy muy contento con la compra",
    "El producto llegó defectuoso",
    "Superó mis expectativas",
    "No es lo que esperaba",
    "Calidad-precio excelente",
    "Tardó más de lo prometido",
    "El empaque fue perfecto",
    "Falta una pieza",
    "Todo como en la descripción",
    "La foto no coincide",
    
    // Mensajes de comparación
    "¿Es mejor que la marca X?",
    "¿Cuál es la diferencia con el modelo anterior?",
    "¿Vale la pena el upgrade?",
    "¿Qué ventajas tiene?",
    "¿Es compatible con mi dispositivo?",
    "¿Incluye accesorios?",
    "¿Viene con garantía extendida?",
    "¿Hay versión premium?",
    "¿Cuál me recomiendan?",
    "¿Es el más vendido?",
    
    // Testing de caracteres especiales
    "Símbolos: @#$%^&*()_+-=[]{}|;:,.<>?",
    "Acentos: àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",
    "Matemáticas: ∑∏∆∇∂∫∞±≠≤≥≈≡√∝∈∉∪∩⊂⊃",
    "Monetario: $€£¥₹₽₩₦₨₡₪₫₱₡",
    "Fracciones: ½⅓⅔¼¾⅛⅜⅝⅞",
    
    // Números y cantidades específicas
    "Quiero 2 unidades",
    "Necesito 10 para mi empresa",
    "¿Hay descuento desde 50 unidades?",
    "Solo 1 por favor",
    "¿Puedo comprar 100?",
    "Máximo 5 unidades",
    "¿Cuántos quedan en stock?",
    "Mínimo pedido 25 piezas",
    "Lote de 12 unidades",
    "Precio por mayoreo 500+",
  ];

  private constructor() {
    // Solo inicializar en modo dev
    this.init();
  }

  public static getInstance(): DevRandomMessages {
    if (!DevRandomMessages.instance) {
      DevRandomMessages.instance = new DevRandomMessages();
    }
    return DevRandomMessages.instance;
  }

  private init(): void {
    const endpoints = resolveDefaultEndpoints();
    
    // Solo habilitar en modo dev
    if (endpoints.isProd) {
      console.log('🎲 [DevRandomMessages] ❌ Deshabilitado en modo producción');
      return;
    }

    this.config.enabled = true;
    console.log('🎲 [DevRandomMessages] ✅ Inicializado en modo desarrollo');
    
    // Interceptar comandos de desarrollo desde el input del chat
    this.interceptChatInput();
  }

  private interceptChatInput(): void {
    // Escuchar eventos de comando de desarrollo desde el chat input
    if (typeof window !== 'undefined') {
      window.addEventListener('guidersDevCommand', ((event: CustomEvent) => {
        this.handleDevCommand(event.detail);
      }) as EventListener);
      
      console.log('🎲 [DevRandomMessages] 🎯 Interceptor de comandos configurado');
    }
  }

  private handleDevCommand(detail: any): void {
    if (!this.config.enabled || this.isActive) {
      return;
    }

    const { command, text, count, chatId } = detail;
    
    if (command === 'random') {
      console.log(`🎲 [DevRandomMessages] 🎯 Comando detectado: ${text}`);
      
      if (count !== null) {
        // Validar límites razonables para evitar spam
        const maxAllowed = 200; // Límite máximo de seguridad
        const finalCount = Math.min(count, maxAllowed);
        
        if (count > maxAllowed) {
          console.warn(`🎲 [DevRandomMessages] ⚠️ Número solicitado (${count}) excede el límite máximo (${maxAllowed}). Usando ${finalCount} mensajes.`);
        }
        
        console.log(`🎲 [DevRandomMessages] 🎯 Comando #random:${count} detectado, generando ${finalCount} mensajes`);
        
        // Guardar configuración temporal
        const originalCount = this.config.messageCount;
        this.config.messageCount = finalCount;
        
        this.chatId = chatId;
        this.startRandomMessages().finally(() => {
          // Restaurar configuración original
          this.config.messageCount = originalCount;
        });
      } else {
        console.log('🎲 [DevRandomMessages] 🎯 Comando #random detectado (cantidad por defecto)');
        this.chatId = chatId;
        this.startRandomMessages();
      }
    }
  }

  private async startRandomMessages(): Promise<void> {
    if (this.isActive || !this.chatId) {
      return;
    }

    this.isActive = true;
    console.log(`🎲 [DevRandomMessages] 🚀 Iniciando generación de ${this.config.messageCount} mensajes aleatorios`);

    try {
      // Ajustar intervalos según la cantidad de mensajes para optimizar rendimiento
      let minInterval = this.config.minInterval;
      let maxInterval = this.config.maxInterval;
      
      if (this.config.messageCount > 50) {
        // Para muchos mensajes, usar intervalos más cortos
        minInterval = Math.max(300, this.config.minInterval / 2);
        maxInterval = Math.max(800, this.config.maxInterval / 2);
        console.log(`🎲 [DevRandomMessages] ⚡ Usando intervalos optimizados para ${this.config.messageCount} mensajes: ${minInterval}-${maxInterval}ms`);
      }

      for (let i = 0; i < this.config.messageCount; i++) {
        // Esperar intervalo aleatorio entre mensajes
        const interval = this.randomBetween(minInterval, maxInterval);
        await this.sleep(interval);

        // Seleccionar mensaje aleatorio
        const message = this.getRandomMessage();
        
        // Enviar mensaje usando el servicio real
        await this.sendRandomMessage(message);
        
        console.log(`🎲 [DevRandomMessages] 📤 Mensaje ${i + 1}/${this.config.messageCount}: "${message}"`);
      }
    } catch (error) {
      console.error('🎲 [DevRandomMessages] ❌ Error generando mensajes:', error);
    } finally {
      this.isActive = false;
      console.log('🎲 [DevRandomMessages] ✅ Generación de mensajes completada');
    }
  }

  private async sendRandomMessage(message: string): Promise<void> {
    if (!this.chatId) {
      throw new Error('No hay chat ID disponible');
    }

    try {
      await ChatV2Service.getInstance().sendMessage(this.chatId, message, 'text');
    } catch (error) {
      console.warn('🎲 [DevRandomMessages] ⚠️ Error enviando mensaje:', error);
      throw error;
    }
  }

  private getRandomMessage(): string {
    const index = Math.floor(Math.random() * this.randomMessages.length);
    return this.randomMessages[index];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos públicos para configuración
  public setConfig(config: Partial<RandomMessageConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🎲 [DevRandomMessages] ⚙️ Configuración actualizada:', this.config);
  }

  public getConfig(): RandomMessageConfig {
    return { ...this.config };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public isGenerating(): boolean {
    return this.isActive;
  }

  // Método para trigger manual (útil para testing)
  public async triggerRandomMessages(chatId: string, count?: number): Promise<void> {
    if (!this.config.enabled) {
      console.warn('🎲 [DevRandomMessages] ⚠️ No está habilitado en este entorno');
      return;
    }

    // Validar límites si se especifica un count
    if (count !== undefined) {
      const maxAllowed = 200;
      const finalCount = Math.min(count, maxAllowed);
      
      if (count > maxAllowed) {
        console.warn(`🎲 [DevRandomMessages] ⚠️ Número solicitado (${count}) excede el límite máximo (${maxAllowed}). Usando ${finalCount} mensajes.`);
      }
      
      // Usar configuración temporal
      const originalCount = this.config.messageCount;
      this.config.messageCount = finalCount;
      
      this.chatId = chatId;
      await this.startRandomMessages().finally(() => {
        this.config.messageCount = originalCount;
      });
    } else {
      this.chatId = chatId;
      await this.startRandomMessages();
    }
  }

  // Método para agregar mensajes personalizados
  public addCustomMessages(messages: string[]): void {
    this.randomMessages.push(...messages);
    console.log(`🎲 [DevRandomMessages] ➕ Agregados ${messages.length} mensajes personalizados`);
  }
}

// Auto-inicializar en modo dev
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      DevRandomMessages.getInstance();
    });
  } else {
    DevRandomMessages.getInstance();
  }
}

export default DevRandomMessages;