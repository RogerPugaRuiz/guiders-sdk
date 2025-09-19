/**
 * Configuración y mensajes de bienvenida personalizables para el chat
 */

export interface WelcomeMessageConfig {
  enabled: boolean;
  style: 'friendly' | 'professional' | 'casual' | 'helpful' | 'custom';
  customMessage?: string;
  includeEmojis?: boolean;
  language?: 'es' | 'en';
  showTips?: boolean;
}

export class WelcomeMessageManager {
  private config: WelcomeMessageConfig;

  constructor(config: Partial<WelcomeMessageConfig> = {}) {
    this.config = {
      enabled: true,
      style: 'friendly',
      includeEmojis: true,
      language: 'es',
      showTips: true,
      ...config
    };
  }

  /**
   * Obtiene el mensaje de bienvenida según la configuración
   */
  public getWelcomeMessage(): string {
    if (!this.config.enabled) {
      return '';
    }

    if (this.config.style === 'custom' && this.config.customMessage) {
      return this.config.customMessage;
    }

    return this.getPresetMessage(this.config.style, this.config.language);
  }

  /**
   * Mensajes predefinidos en diferentes estilos y idiomas
   */
  private getPresetMessage(style: string, language: string = 'es'): string {
    const messages = {
      es: {
        friendly: this.config.includeEmojis 
          ? "¡Hola! 👋 Me alegra que estés aquí. Soy tu asistente virtual y estoy listo para ayudarte con cualquier pregunta que tengas. ¿En qué puedo ayudarte hoy? 😊"
          : "¡Hola! Me alegra que estés aquí. Soy tu asistente virtual y estoy listo para ayudarte con cualquier pregunta que tengas. ¿En qué puedo ayudarte hoy?",
        
        professional: this.config.includeEmojis
          ? "Buenos días/tardes. 👔 Bienvenido a nuestro servicio de atención al cliente. Estoy aquí para proporcionarle asistencia especializada. Por favor, describa su consulta y un agente le atenderá a la brevedad."
          : "Buenos días/tardes. Bienvenido a nuestro servicio de atención al cliente. Estoy aquí para proporcionarle asistencia especializada. Por favor, describa su consulta y un agente le atenderá a la brevedad.",
        
        casual: this.config.includeEmojis
          ? "¡Hey! 🤙 ¿Qué tal? Soy tu chat de soporte. Si necesitas algo o tienes alguna duda, solo escríbeme. Estoy aquí para echarte una mano. ¡Dale! 🚀"
          : "¡Hey! ¿Qué tal? Soy tu chat de soporte. Si necesitas algo o tienes alguna duda, solo escríbeme. Estoy aquí para echarte una mano. ¡Dale!",
        
        helpful: this.config.includeEmojis
          ? "¡Hola y bienvenido! 🌟 Estoy aquí para hacer tu experiencia lo más fácil posible. Puedes preguntarme sobre nuestros productos, servicios, o cualquier duda que tengas. ¡Empezamos! 💬"
          : "¡Hola y bienvenido! Estoy aquí para hacer tu experiencia lo más fácil posible. Puedes preguntarme sobre nuestros productos, servicios, o cualquier duda que tengas. ¡Empezamos!"
      },
      en: {
        friendly: this.config.includeEmojis
          ? "Hello! 👋 I'm so glad you're here. I'm your virtual assistant and I'm ready to help you with any questions you might have. How can I help you today? 😊"
          : "Hello! I'm so glad you're here. I'm your virtual assistant and I'm ready to help you with any questions you might have. How can I help you today?",
        
        professional: this.config.includeEmojis
          ? "Good day. 👔 Welcome to our customer service platform. I'm here to provide you with specialized assistance. Please describe your inquiry and an agent will attend to you shortly."
          : "Good day. Welcome to our customer service platform. I'm here to provide you with specialized assistance. Please describe your inquiry and an agent will attend to you shortly.",
        
        casual: this.config.includeEmojis
          ? "Hey there! 🤙 What's up? I'm your support chat. If you need anything or have questions, just drop me a message. I'm here to help you out. Let's go! 🚀"
          : "Hey there! What's up? I'm your support chat. If you need anything or have questions, just drop me a message. I'm here to help you out. Let's go!",
        
        helpful: this.config.includeEmojis
          ? "Hello and welcome! 🌟 I'm here to make your experience as smooth as possible. You can ask me about our products, services, or any questions you might have. Let's get started! 💬"
          : "Hello and welcome! I'm here to make your experience as smooth as possible. You can ask me about our products, services, or any questions you might have. Let's get started!"
      }
    } as const;

    const langMessages = messages[language as keyof typeof messages] || messages.es;
    return (langMessages as any)[style] || messages.es.friendly;
  }

  /**
   * Obtiene consejos adicionales según el estilo
   */
  public getTips(): string[] {
    if (!this.config.showTips) return [];

    const tips = {
      es: [
        "💡 Tip: Sé específico en tu consulta para obtener una respuesta más rápida",
        "⏱️ Tiempo promedio de respuesta: 2-5 minutos",
        "📱 Este chat funciona desde cualquier dispositivo"
      ],
      en: [
        "💡 Tip: Be specific in your query to get a faster response",
        "⏱️ Average response time: 2-5 minutes", 
        "📱 This chat works from any device"
      ]
    };

    const language = this.config.language || 'es';
    return [...(tips[language as keyof typeof tips] || tips.es)];
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(newConfig: Partial<WelcomeMessageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): WelcomeMessageConfig {
    return { ...this.config };
  }
}

/**
 * Mensajes de ejemplo para diferentes tipos de negocio
 */
export const BUSINESS_WELCOME_TEMPLATES = {
  ecommerce: {
    es: "¡Hola! 🛍️ Bienvenido a nuestra tienda. Estoy aquí para ayudarte con tus compras, seguimiento de pedidos, devoluciones o cualquier pregunta sobre nuestros productos. ¿En qué puedo asistirte?",
    en: "Hello! 🛍️ Welcome to our store. I'm here to help you with your purchases, order tracking, returns, or any questions about our products. How can I assist you?"
  },
  saas: {
    es: "¡Hola! 💻 Bienvenido al soporte técnico. Estoy aquí para ayudarte con configuración, resolución de problemas, facturación o cualquier duda sobre nuestro software. ¡Cuéntame qué necesitas!",
    en: "Hello! 💻 Welcome to technical support. I'm here to help you with setup, troubleshooting, billing, or any questions about our software. Tell me what you need!"
  },
  healthcare: {
    es: "¡Hola! 🏥 Bienvenido a nuestro centro de atención. Estoy aquí para ayudarte con citas, información sobre servicios, seguros médicos o consultas generales. ¿Cómo puedo ayudarte hoy?",
    en: "Hello! 🏥 Welcome to our care center. I'm here to help you with appointments, service information, medical insurance, or general inquiries. How can I help you today?"
  },
  education: {
    es: "¡Hola! 📚 Bienvenido a nuestro centro de aprendizaje. Estoy aquí para ayudarte con cursos, inscripciones, material de estudio o cualquier consulta académica. ¿Qué necesitas saber?",
    en: "Hello! 📚 Welcome to our learning center. I'm here to help you with courses, enrollments, study materials, or any academic inquiries. What do you need to know?"
  },
  finance: {
    es: "¡Hola! 💰 Bienvenido a nuestros servicios financieros. Estoy aquí para ayudarte con consultas sobre cuentas, transacciones, inversiones o servicios bancarios. ¿En qué puedo asistirte?",
    en: "Hello! 💰 Welcome to our financial services. I'm here to help you with account inquiries, transactions, investments, or banking services. How can I assist you?"
  }
};