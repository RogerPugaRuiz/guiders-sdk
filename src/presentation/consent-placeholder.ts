import { debugLog } from '../utils/debug-logger';

/**
 * Consent Placeholder
 *
 * Componente estático que se muestra cuando no hay consentimiento.
 * GDPR Compliant: Solo HTML/CSS, sin procesamiento de datos.
 */

export class ConsentPlaceholder {
  private container: HTMLDivElement | null = null;
  private onConsentRequest?: () => void;

  constructor(options: { onConsentRequest?: () => void } = {}) {
    this.onConsentRequest = options.onConsentRequest;
  }

  /**
   * Muestra el placeholder
   */
  public show(): void {
    if (this.container) {
      debugLog('[ConsentPlaceholder] ⚠️ Placeholder ya existe');
      return;
    }

    debugLog('[ConsentPlaceholder] 📝 Mostrando placeholder (sin consentimiento)');

    this.container = document.createElement('div');
    this.container.id = 'guiders-consent-placeholder';
    this.container.className = 'guiders-placeholder';

    this.container.innerHTML = `
      <div class="guiders-placeholder-content">
        <div class="guiders-placeholder-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor" opacity="0.3"/>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" fill="currentColor"/>
          </svg>
        </div>
        <button id="guiders-placeholder-button" class="guiders-placeholder-button">
          Gestionar cookies
        </button>
      </div>
    `;

    // Agregar estilos
    this.injectStyles();

    // Agregar al DOM
    document.body.appendChild(this.container);

    // Configurar event listener
    this.setupEventListeners();
  }

  /**
   * Oculta y remueve el placeholder
   */
  public hide(): void {
    if (!this.container) return;

    debugLog('[ConsentPlaceholder] ✅ Ocultando placeholder (consentimiento otorgado)');

    // Animación de salida
    this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(20px)';

    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;

      // Remover estilos inyectados
      const styleElement = document.getElementById('guiders-placeholder-styles');
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    }, 300);
  }

  /**
   * Verifica si el placeholder está visible
   */
  public isVisible(): boolean {
    return this.container !== null && document.body.contains(this.container);
  }

  /**
   * Inyecta los estilos CSS del placeholder
   */
  private injectStyles(): void {
    // Evitar duplicar estilos
    if (document.getElementById('guiders-placeholder-styles')) return;

    const style = document.createElement('style');
    style.id = 'guiders-placeholder-styles';
    style.textContent = `
      .guiders-placeholder {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 20px;
        max-width: 320px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        animation: guiders-placeholder-fadeIn 0.3s ease;
      }

      @keyframes guiders-placeholder-fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .guiders-placeholder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
      }

      .guiders-placeholder-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
        border-radius: 50%;
        color: #666;
      }

      .guiders-placeholder-button {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease;
        width: 100%;
        margin-top: 4px;
      }

      .guiders-placeholder-button:hover {
        background: #0056b3;
      }

      .guiders-placeholder-button:active {
        transform: scale(0.98);
      }

      /* Responsive */
      @media (max-width: 480px) {
        .guiders-placeholder {
          bottom: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Configura los event listeners del placeholder
   */
  private setupEventListeners(): void {
    const button = document.getElementById('guiders-placeholder-button');
    if (!button) return;

    button.addEventListener('click', () => {
      debugLog('[ConsentPlaceholder] 🔔 Usuario solicitó gestionar cookies');

      // Emitir evento personalizado para que el banner GDPR se muestre
      window.dispatchEvent(new CustomEvent('guiders:show-consent-banner'));

      // Llamar al callback si existe
      if (this.onConsentRequest) {
        this.onConsentRequest();
      }
    });
  }

  /**
   * Destruye completamente el placeholder
   */
  public destroy(): void {
    this.hide();
    this.onConsentRequest = undefined;
  }
}
