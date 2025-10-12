/**
 * Consent Banner UI - Renderiza banner GDPR automático
 *
 * Este componente crea y gestiona un banner de consentimiento de cookies
 * totalmente configurable, sin necesidad de código adicional por parte del cliente.
 */

export interface ConsentBannerConfig {
  enabled?: boolean;
  style?: 'bottom_bar' | 'modal' | 'corner' | 'none';
  text?: string;
  acceptText?: string;
  denyText?: string;
  preferencesText?: string;
  showPreferences?: boolean;
  colors?: {
    background?: string;
    text?: string;
    acceptButton?: string;
    denyButton?: string;
    preferencesButton?: string;
  };
  position?: 'bottom' | 'top';
  showCloseButton?: boolean;
  autoShow?: boolean; // Si true, muestra automáticamente si consent = pending
  className?: string; // Clase CSS personalizada para el banner
}

/**
 * Config interna con todos los campos requeridos
 */
interface InternalConsentBannerConfig {
  enabled: boolean;
  style: 'bottom_bar' | 'modal' | 'corner' | 'none';
  text: string;
  acceptText: string;
  denyText: string;
  preferencesText: string;
  showPreferences: boolean;
  colors: {
    background: string;
    text: string;
    acceptButton: string;
    denyButton: string;
    preferencesButton: string;
  };
  position: 'bottom' | 'top';
  showCloseButton: boolean;
  autoShow: boolean;
  className: string;
}

/**
 * UI del banner de consentimiento GDPR
 */
export class ConsentBannerUI {
  private config: InternalConsentBannerConfig;
  private bannerElement: HTMLElement | null = null;

  constructor(config: ConsentBannerConfig = {}) {
    const defaultColors = {
      background: '#2c3e50',
      text: '#ffffff',
      acceptButton: '#27ae60',
      denyButton: '#95a5a6',
      preferencesButton: '#3498db'
    };

    this.config = {
      enabled: config.enabled ?? true,
      style: config.style ?? 'bottom_bar',
      text: config.text ?? '🍪 Usamos cookies para mejorar tu experiencia y proporcionar chat en vivo.',
      acceptText: config.acceptText ?? 'Aceptar Todo',
      denyText: config.denyText ?? 'Rechazar',
      preferencesText: config.preferencesText ?? 'Preferencias',
      showPreferences: config.showPreferences ?? true,
      colors: {
        background: config.colors?.background ?? defaultColors.background,
        text: config.colors?.text ?? defaultColors.text,
        acceptButton: config.colors?.acceptButton ?? defaultColors.acceptButton,
        denyButton: config.colors?.denyButton ?? defaultColors.denyButton,
        preferencesButton: config.colors?.preferencesButton ?? defaultColors.preferencesButton
      },
      position: config.position ?? 'bottom',
      showCloseButton: config.showCloseButton ?? false,
      autoShow: config.autoShow ?? true,
      className: config.className ?? ''
    };

    console.log('[ConsentBannerUI] 🎨 Inicializado con config:', this.config);
  }

  /**
   * Renderiza el banner en el DOM
   */
  public render(): void {
    if (!this.config.enabled || this.config.style === 'none') {
      console.log('[ConsentBannerUI] ⚠️ Banner deshabilitado');
      return;
    }

    // Remover banner existente si hay
    this.remove();

    // Crear banner según estilo
    switch (this.config.style) {
      case 'bottom_bar':
        this.bannerElement = this.createBottomBar();
        break;
      case 'modal':
        this.bannerElement = this.createModal();
        break;
      case 'corner':
        this.bannerElement = this.createCorner();
        break;
    }

    if (this.bannerElement) {
      // Agregar clase personalizada si existe
      if (this.config.className) {
        this.bannerElement.classList.add(this.config.className);
      }

      document.body.appendChild(this.bannerElement);
      console.log('[ConsentBannerUI] ✅ Banner renderizado (estilo: ' + this.config.style + ')');
    }
  }

  /**
   * Muestra el banner
   */
  public show(): void {
    if (this.bannerElement) {
      this.bannerElement.style.display = 'block';
      console.log('[ConsentBannerUI] 👁️ Banner mostrado');
    }
  }

  /**
   * Oculta el banner
   */
  public hide(): void {
    if (this.bannerElement) {
      this.bannerElement.style.display = 'none';
      console.log('[ConsentBannerUI] 🙈 Banner oculto');
    }
  }

  /**
   * Remueve el banner del DOM
   */
  public remove(): void {
    if (this.bannerElement && this.bannerElement.parentNode) {
      this.bannerElement.parentNode.removeChild(this.bannerElement);
      this.bannerElement = null;
      console.log('[ConsentBannerUI] 🗑️ Banner removido');
    }
  }

  /**
   * Verifica si el banner está visible
   */
  public isVisible(): boolean {
    return this.bannerElement !== null &&
           this.bannerElement.style.display !== 'none';
  }

  /**
   * Crea banner estilo barra inferior
   */
  private createBottomBar(): HTMLElement {
    const banner = document.createElement('div');
    banner.id = 'guiders-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentimiento de cookies');
    banner.style.cssText = `
      position: fixed;
      ${this.config.position}: 0;
      left: 0;
      right: 0;
      background: ${this.config.colors.background};
      color: ${this.config.colors.text};
      padding: 20px;
      z-index: 999999;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      animation: slideUp 0.3s ease-out;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 15px;
    `;

    // Texto
    const text = document.createElement('p');
    text.textContent = this.config.text;
    text.style.cssText = `
      margin: 0;
      flex: 1;
      min-width: 300px;
      font-size: 14px;
      line-height: 1.5;
    `;
    container.appendChild(text);

    // Botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;

    // Botón Aceptar
    const acceptButton = this.createButton(
      this.config.acceptText,
      this.config.colors.acceptButton,
      () => this.onAccept()
    );
    acceptButton.setAttribute('aria-label', 'Aceptar todas las cookies');
    buttonsContainer.appendChild(acceptButton);

    // Botón Preferencias
    if (this.config.showPreferences) {
      const preferencesButton = this.createButton(
        this.config.preferencesText,
        this.config.colors.preferencesButton,
        () => this.onPreferences()
      );
      preferencesButton.setAttribute('aria-label', 'Configurar preferencias de cookies');
      buttonsContainer.appendChild(preferencesButton);
    }

    // Botón Rechazar
    const denyButton = this.createButton(
      this.config.denyText,
      this.config.colors.denyButton,
      () => this.onDeny()
    );
    denyButton.setAttribute('aria-label', 'Rechazar cookies no esenciales');
    buttonsContainer.appendChild(denyButton);

    container.appendChild(buttonsContainer);
    banner.appendChild(container);

    // Agregar animación CSS
    this.injectStyles();

    return banner;
  }

  /**
   * Crea banner estilo modal centrado
   */
  private createModal(): HTMLElement {
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'guiders-consent-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Consentimiento de cookies');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease-out;
    `;

    // Modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: scaleIn 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    const title = document.createElement('h2');
    title.textContent = '🍪 Gestión de Cookies';
    title.style.cssText = `
      margin-top: 0;
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
    `;
    modal.appendChild(title);

    const text = document.createElement('p');
    text.textContent = this.config.text;
    text.style.cssText = `
      color: #555;
      line-height: 1.6;
      margin-bottom: 20px;
      font-size: 14px;
    `;
    modal.appendChild(text);

    // Botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      flex-wrap: wrap;
    `;

    const acceptButton = this.createButton(
      this.config.acceptText,
      this.config.colors.acceptButton,
      () => this.onAccept()
    );
    buttonsContainer.appendChild(acceptButton);

    if (this.config.showPreferences) {
      const preferencesButton = this.createButton(
        this.config.preferencesText,
        this.config.colors.preferencesButton,
        () => this.onPreferences()
      );
      buttonsContainer.appendChild(preferencesButton);
    }

    const denyButton = this.createButton(
      this.config.denyText,
      this.config.colors.denyButton,
      () => this.onDeny()
    );
    buttonsContainer.appendChild(denyButton);

    modal.appendChild(buttonsContainer);
    overlay.appendChild(modal);

    // Agregar animaciones CSS
    this.injectStyles();

    return overlay;
  }

  /**
   * Crea banner estilo esquina (pequeño)
   */
  private createCorner(): HTMLElement {
    const banner = document.createElement('div');
    banner.id = 'guiders-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentimiento de cookies');
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${this.config.colors.background};
      color: ${this.config.colors.text};
      padding: 20px;
      border-radius: 8px;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      animation: slideInRight 0.3s ease-out;
    `;

    const text = document.createElement('p');
    text.textContent = this.config.text;
    text.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 13px;
      line-height: 1.5;
    `;
    banner.appendChild(text);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      flex-direction: column;
    `;

    const acceptButton = this.createButton(
      this.config.acceptText,
      this.config.colors.acceptButton,
      () => this.onAccept()
    );
    acceptButton.style.width = '100%';
    buttonsContainer.appendChild(acceptButton);

    if (this.config.showPreferences) {
      const preferencesButton = this.createButton(
        this.config.preferencesText,
        this.config.colors.preferencesButton,
        () => this.onPreferences()
      );
      preferencesButton.style.width = '100%';
      buttonsContainer.appendChild(preferencesButton);
    }

    const denyButton = this.createButton(
      this.config.denyText,
      this.config.colors.denyButton,
      () => this.onDeny()
    );
    denyButton.style.width = '100%';
    buttonsContainer.appendChild(denyButton);

    banner.appendChild(buttonsContainer);

    // Agregar animaciones CSS
    this.injectStyles();

    return banner;
  }

  /**
   * Crea un botón estilizado
   */
  private createButton(text: string, color: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      background: ${color};
      color: white;
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      font-family: inherit;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', onClick);

    return button;
  }

  /**
   * Inyecta estilos CSS para animaciones
   */
  private injectStyles(): void {
    // Verificar si los estilos ya fueron inyectados
    if (document.getElementById('guiders-consent-banner-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'guiders-consent-banner-styles';
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scaleIn {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Responsive para móviles */
      @media (max-width: 768px) {
        #guiders-consent-banner {
          padding: 15px !important;
        }

        #guiders-consent-banner > div {
          flex-direction: column !important;
          align-items: flex-start !important;
        }

        #guiders-consent-banner button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Callbacks para acciones (serán sobrescritos desde fuera)
   */
  public onAccept = () => {
    console.log('[ConsentBannerUI] 🟢 Callback onAccept (no configurado)');
  };

  public onDeny = () => {
    console.log('[ConsentBannerUI] 🔴 Callback onDeny (no configurado)');
  };

  public onPreferences = () => {
    console.log('[ConsentBannerUI] ⚙️ Callback onPreferences (no configurado)');
  };

  /**
   * Actualiza la configuración del banner
   */
  public updateConfig(config: Partial<ConsentBannerConfig>): void {
    // Merge colors carefully
    if (config.colors) {
      this.config.colors = {
        ...this.config.colors,
        ...config.colors
      };
    }

    // Update other properties
    if (config.enabled !== undefined) this.config.enabled = config.enabled;
    if (config.style) this.config.style = config.style;
    if (config.text) this.config.text = config.text;
    if (config.acceptText) this.config.acceptText = config.acceptText;
    if (config.denyText) this.config.denyText = config.denyText;
    if (config.preferencesText) this.config.preferencesText = config.preferencesText;
    if (config.showPreferences !== undefined) this.config.showPreferences = config.showPreferences;
    if (config.position) this.config.position = config.position;
    if (config.showCloseButton !== undefined) this.config.showCloseButton = config.showCloseButton;
    if (config.autoShow !== undefined) this.config.autoShow = config.autoShow;
    if (config.className) this.config.className = config.className;

    console.log('[ConsentBannerUI] 🔄 Configuración actualizada');

    // Re-renderizar si el banner ya existe
    if (this.bannerElement) {
      this.remove();
      this.render();
    }
  }
}
