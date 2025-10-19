/**
 * TypingIndicator Component
 *
 * Muestra un indicador animado cuando el comercial está escribiendo.
 * Diseño: Burbuja con 3 dots animados + texto "El agente está escribiendo..."
 *
 * Uso:
 * const indicator = new TypingIndicator();
 * container.appendChild(indicator.render());
 * indicator.show(); // Muestra el indicador con fade-in
 * indicator.hide(); // Oculta el indicador con fade-out
 */

export class TypingIndicator {
  private container: HTMLDivElement | null = null;
  private isVisible: boolean = false;

  constructor() {
    // El componente se renderiza bajo demanda
  }

  /**
   * Renderiza el componente en el DOM
   * @returns Elemento HTML del indicador
   */
  public render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'guiders-typing-indicator';
    this.container.style.display = 'none'; // Oculto por defecto
    this.container.style.opacity = '0';

    // Contenedor de la burbuja animada
    const bubble = document.createElement('div');
    bubble.className = 'guiders-typing-bubble';

    // Crear 3 dots animados
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'guiders-typing-dot';
      // Delay escalonado para efecto de onda
      dot.style.animationDelay = `${i * 0.15}s`;
      bubble.appendChild(dot);
    }

    // Texto descriptivo
    const text = document.createElement('span');
    text.className = 'guiders-typing-text';
    text.textContent = 'El agente está escribiendo...';

    // Ensamblar el componente
    this.container.appendChild(bubble);
    this.container.appendChild(text);

    return this.container;
  }

  /**
   * Muestra el indicador con animación fade-in
   */
  public show(): void {
    if (!this.container || this.isVisible) {
      return;
    }

    this.isVisible = true;
    this.container.style.display = 'flex';

    // Forzar reflow para que la transición funcione
    void this.container.offsetHeight;

    // Aplicar fade-in
    requestAnimationFrame(() => {
      if (this.container) {
        this.container.style.opacity = '1';
      }
    });
  }

  /**
   * Oculta el indicador con animación fade-out
   */
  public hide(): void {
    if (!this.container || !this.isVisible) {
      return;
    }

    this.isVisible = false;

    // Aplicar fade-out
    this.container.style.opacity = '0';

    // Ocultar elemento después de la transición (200ms)
    setTimeout(() => {
      if (this.container) {
        this.container.style.display = 'none';
      }
    }, 200);
  }

  /**
   * Verifica si el indicador está visible
   */
  public isShown(): boolean {
    return this.isVisible;
  }

  /**
   * Actualiza el texto del indicador
   * @param text Nuevo texto a mostrar
   */
  public updateText(text: string): void {
    if (!this.container) {
      return;
    }

    const textElement = this.container.querySelector('.guiders-typing-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }

  /**
   * Elimina el componente del DOM
   */
  public destroy(): void {
    if (this.container) {
      this.hide();
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
      }, 200);
    }
  }

  /**
   * Obtiene el elemento HTML del indicador
   */
  public getElement(): HTMLElement | null {
    return this.container;
  }
}
