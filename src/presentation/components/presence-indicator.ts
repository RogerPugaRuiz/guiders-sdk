/**
 * PresenceIndicator Component
 *
 * Muestra el estado de presencia del comercial en el header del chat.
 * Incluye un dot de color y texto descriptivo del estado.
 *
 * Estados soportados:
 * - online: Verde - "Disponible"
 * - busy: Amarillo - "Ocupado"
 * - away: Amarillo - "Ausente"
 * - offline: Gris - "Sin conexión"
 *
 * Uso:
 * const indicator = new PresenceIndicator('online');
 * header.appendChild(indicator.render());
 * indicator.updateStatus('away'); // Cambiar estado
 */

import {
  PresenceStatus,
  PresenceStatusText,
  PresenceStatusColor
} from '../../types/presence-types';

export class PresenceIndicator {
  private container: HTMLDivElement | null = null;
  private statusDot: HTMLSpanElement | null = null;
  private statusText: HTMLSpanElement | null = null;
  private currentStatus: PresenceStatus;

  constructor(initialStatus: PresenceStatus = 'offline') {
    this.currentStatus = initialStatus;
  }

  /**
   * Renderiza el componente en el DOM
   * @returns Elemento HTML del indicador
   */
  public render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'guiders-presence-indicator';

    // Dot de estado
    this.statusDot = document.createElement('span');
    this.statusDot.className = 'guiders-status-dot';

    // Texto de estado
    this.statusText = document.createElement('span');
    this.statusText.className = 'guiders-status-text';

    // Aplicar estado inicial
    this.applyStatus(this.currentStatus);

    // Ensamblar componente
    this.container.appendChild(this.statusDot);
    this.container.appendChild(this.statusText);

    return this.container;
  }

  /**
   * Actualiza el estado de presencia
   * @param status Nuevo estado de presencia
   */
  public updateStatus(status: PresenceStatus): void {
    if (this.currentStatus === status) {
      return; // No cambiar si es el mismo estado
    }

    this.currentStatus = status;
    this.applyStatus(status);
  }

  /**
   * Aplica visualmente el estado de presencia
   * @param status Estado a aplicar
   */
  private applyStatus(status: PresenceStatus): void {
    if (!this.statusDot || !this.statusText) {
      return;
    }

    // Limpiar clases anteriores de estado
    this.statusDot.className = 'guiders-status-dot';

    // Aplicar clase de estado
    this.statusDot.classList.add(`guiders-status-${status}`);

    // Aplicar color del dot
    const color = PresenceStatusColor[status];
    this.statusDot.style.backgroundColor = color;

    // Aplicar texto del estado
    const text = PresenceStatusText[status];
    this.statusText.textContent = text;

    // Animación sutil al cambiar estado
    this.container?.classList.add('guiders-status-changing');
    setTimeout(() => {
      this.container?.classList.remove('guiders-status-changing');
    }, 300);
  }

  /**
   * Obtiene el estado actual
   */
  public getStatus(): PresenceStatus {
    return this.currentStatus;
  }

  /**
   * Oculta el indicador
   */
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Muestra el indicador
   */
  public show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  /**
   * Verifica si el indicador está visible
   */
  public isVisible(): boolean {
    return this.container ? this.container.style.display !== 'none' : false;
  }

  /**
   * Actualiza el texto personalizado del estado (opcional)
   * @param customText Texto personalizado a mostrar
   */
  public setCustomText(customText: string): void {
    if (this.statusText) {
      this.statusText.textContent = customText;
    }
  }

  /**
   * Obtiene el elemento HTML del indicador
   */
  public getElement(): HTMLElement | null {
    return this.container;
  }

  /**
   * Elimina el componente del DOM
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.statusDot = null;
    this.statusText = null;
  }
}
