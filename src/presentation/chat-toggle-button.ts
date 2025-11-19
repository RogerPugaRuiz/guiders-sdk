import { ChatUI } from "./chat";
import { UnreadMessagesService } from "../services/unread-messages-service";
import { ResolvedPosition } from "../utils/position-resolver";

interface ChatToggleButtonOptions {
	label?: string;            // Texto o ícono a mostrar en el botón
	buttonSize?: string;       // Tamaño (width/height) del botón (ej. '50px')
	backgroundColor?: string;  // Color de fondo del botón
	textColor?: string;        // Color del texto/ícono del botón
	positionRight?: string;    // Distancia del botón respecto a la parte derecha de la ventana
	positionBottom?: string;   // Distancia del botón respecto a la parte inferior de la ventana
	borderRadius?: string;     // Radio de la esquina (para un look "circular" o "pill")
}

export class ChatToggleButtonUI {
	private chatUI: ChatUI;
	private button: HTMLButtonElement;
	private badgeElement: HTMLElement | null = null;
	private options: ChatToggleButtonOptions;
	private isVisible: boolean = false;
	private unreadService: UnreadMessagesService;
	private resolvedPosition: ResolvedPosition;

	private toggleCallback: Array<(visible: boolean) => void> = [];

	constructor(chatUI: ChatUI, options: ChatToggleButtonOptions = {}) {
		this.chatUI = chatUI;

		// Obtener la posición resuelta del ChatUI
		this.resolvedPosition = this.chatUI.getResolvedPosition();
		console.log('🔘 [ChatToggleButton] Posición resuelta del botón:', this.resolvedPosition.button);

		const chatWidth = this.chatUI.getOptions().widgetWidth || '300px';
		const num = parseInt(chatWidth.replace('px', ''));
		this.options = {
			label: 'Chat',
			buttonSize: '50px',
			backgroundColor: '#007bff',
			textColor: '#ffffff',
			positionRight: `20px`, // Centrar respecto al eje X
			positionBottom: '20px',
			borderRadius: '50%',
			...options
		};

		this.button = document.createElement('button');
		this.button.className = 'chat-toggle-btn';

		// Inicializar servicio de mensajes no leídos
		this.unreadService = UnreadMessagesService.getInstance();

		// Inicializar como oculto (no visible)
		this.isVisible = false;
	}

	/**
	 * Genera el CSS de posicionamiento dinámico para el botón
	 */
	private getButtonPositionCSS(): string {
		const pos = this.resolvedPosition.button;
		const styles: string[] = [];

		if (pos.top) styles.push(`top: ${pos.top};`);
		if (pos.bottom) styles.push(`bottom: ${pos.bottom};`);
		if (pos.left) styles.push(`left: ${pos.left};`);
		if (pos.right) styles.push(`right: ${pos.right};`);

		return styles.join(' ');
	}

	/**
	 * Calcula la posición del badge basándose en la posición del botón
	 */
	private getBadgePositionCSS(): string {
		const pos = this.resolvedPosition.button;
		const styles: string[] = [];

		// El badge se posiciona en la esquina superior derecha del botón
		if (pos.bottom) {
			// Botón en la parte inferior -> badge arriba del botón
			const bottomValue = parseInt(pos.bottom);
			styles.push(`bottom: calc(${pos.bottom} + 43px);`); // 56px (button) - 13px offset
		} else if (pos.top) {
			// Botón en la parte superior -> badge debajo del botón
			const topValue = parseInt(pos.top);
			styles.push(`top: calc(${pos.top} + 13px);`);
		}

		if (pos.right) {
			styles.push(`right: calc(${pos.right} + 13px);`);
		} else if (pos.left) {
			styles.push(`left: calc(${pos.left} + 43px);`); // 56px (button) - 13px offset
		}

		return styles.join(' ');
	}

	/**
	 * Crea y muestra el botón flotante en el DOM, asociando el evento de toggle del chat.
	 */
	public init(): void {
		if (!this.button) {
			this.button = document.createElement('button');
			this.button.className = 'chat-toggle-btn';
		}

		// Asegurar que el estado inicial sea coherente con el estado del chat
		// Inicialmente el botón no debe mostrar el estado 'open'
		this.isVisible = false;
		this.button.classList.remove('open');

		// AHORA: Añadir el botón al DOM (después de que el ChatUI ya se haya inicializado)
		this.addButtonToDOM();

		this.applyStyles();
		this.addEventListeners();
		this.initializeStyles(); // Inicializar estilos inline además de CSS

		// Configurar callback para actualizar badge cuando cambia el contador
		console.log("💬 Inicializando sistema de notificaciones");
	}

	/**
	 * Añade el botón al DOM, intentando primero añadirlo al shadow DOM del chat
	 * y si no existe, lo añade al body del documento.
	 */
	private addButtonToDOM(): void {
		// Buscar el host del Shadow DOM del chat
		const shadowHost = document.querySelector('.chat-widget-host') as HTMLElement;
		if (shadowHost && shadowHost.shadowRoot) {
			// Eliminar botones existentes antes de añadir uno nuevo (evitar duplicados)
			const existingButtons = shadowHost.shadowRoot.querySelectorAll('.chat-toggle-btn');
			existingButtons.forEach(btn => btn.remove());
			const existingBadges = shadowHost.shadowRoot.querySelectorAll('.chat-unread-badge');
			existingBadges.forEach(badge => badge.remove());

			// Insertar el botón flotante dentro del shadowRoot, pero antes del chat-widget para que quede visible
			shadowHost.shadowRoot.insertBefore(this.button, shadowHost.shadowRoot.firstChild);
			
			// Crear el badge para los mensajes no leídos
			this.badgeElement = document.createElement('div');
			this.badgeElement.className = 'chat-unread-badge';
			this.badgeElement.setAttribute('id', 'chat-unread-badge');
			shadowHost.shadowRoot.appendChild(this.badgeElement);
			
			// Ocultar el badge inicialmente (sin mensajes no leídos)
			this.hideBadge();
			console.log("💬 Badge inicializado y oculto (0 mensajes no leídos)");
			
			// Inyectar estilos específicos del botón si no existen
			if (!shadowHost.shadowRoot.querySelector('style[data-chat-toggle-btn]')) {
				const buttonPositionCSS = this.getButtonPositionCSS();
				const badgePositionCSS = this.getBadgePositionCSS();

				const style = document.createElement('style');
				style.setAttribute('data-chat-toggle-btn', 'true');
				style.textContent = `
					@keyframes gradientRotate {
						0% { background-position: 0% 50%; }
						50% { background-position: 100% 50%; }
						100% { background-position: 0% 50%; }
					}

					.chat-toggle-btn {
						position: fixed;
						${buttonPositionCSS}
						width: 56px;
						height: 56px;
						border-radius: 50%;
						background: linear-gradient(135deg, #0062cc 0%, #0084ff 20%, #00a8ff 40%, #00c6fb 60%, #0084ff 80%, #0062cc 100%);
						background-size: 300% 300%;
						animation: gradientRotate 4s ease-in-out infinite;
						color: #fff !important;
						border: none;
						cursor: pointer;
						z-index: 2147483647;
						display: flex;
						align-items: center;
						justify-content: center;
						font-weight: bold;
						box-shadow: 0 4px 16px rgba(0, 132, 255, 0.5);
						transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
						position: relative; /* Asegurar que el badge se posicione correctamente */
						overflow: hidden;
					}
					.chat-toggle-btn::before {
						content: '';
						display: block;
						width: 24px;
						height: 24px;
						background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 3C6.5 3 2 6.58 2 11C2.05 13.15 3.06 15.17 4.75 16.5C4.75 17.1 4.33 18.67 2 21C4.37 20.89 6.64 20 8.47 18.5C9.61 18.83 10.81 19 12 19C17.5 19 22 15.42 22 11C22 6.58 17.5 3 12 3ZM12 17C7.58 17 4 14.31 4 11C4 7.69 7.58 5 12 5C16.42 5 20 7.69 20 11C20 14.31 16.42 17 12 17Z' fill='white'/%3E%3C/svg%3E");
						background-repeat: no-repeat;
						background-position: center;
						transition: transform 0.3s ease;
					}
					.chat-toggle-btn.open::before {
						background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z' fill='white'/%3E%3C/svg%3E");
					}
					.chat-toggle-btn:hover {
						transform: translateY(-3px) scale(1.05);
						box-shadow: 0 8px 24px rgba(0, 132, 255, 0.6), 0 0 20px rgba(0, 198, 251, 0.4);
					}
					.chat-toggle-btn:active {
						transform: translateY(0) scale(0.95);
						box-shadow: 0 2px 10px rgba(0, 132, 255, 0.5);
					}
					.chat-unread-badge {
						position: fixed;
						${badgePositionCSS}
						min-width: 22px;
						height: 22px;
						background: linear-gradient(145deg, #ff5146, #e53a30);
						color: white;
						border-radius: 12px;
						font-size: 12px;
						font-weight: bold;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 0 5px;
						box-sizing: border-box;
						border: 2px solid white;
						z-index: 2147483647;
						box-shadow: 0 2px 8px rgba(255,65,54,0.3);
						pointer-events: none; /* Evitar que el badge interfiera con el botón */
						transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
					}
					.chat-unread-badge.hidden {
						transform: scale(0);
						opacity: 0;
						display: flex !important;
					}
					@keyframes pulse {
						0% { transform: scale(0.8); opacity: 0.7; }
						50% { transform: scale(1.3); opacity: 1; }
						80% { transform: scale(0.95); opacity: 1; }
						100% { transform: scale(1); opacity: 1; }
					}
				`;
				shadowHost.shadowRoot.appendChild(style);
			}
			console.log("💬 Botón añadido al shadow DOM del chat");
		} else {
			document.body.appendChild(this.button);
			
			// Crear el badge para los mensajes no leídos
			this.badgeElement = document.createElement('div');
			this.badgeElement.className = 'chat-unread-badge';
			this.badgeElement.setAttribute('id', 'chat-unread-badge');
			document.body.appendChild(this.badgeElement);
			
			// Ocultar el badge inicialmente (sin mensajes no leídos)
			this.hideBadge();
			console.log("💬 Botón añadido al body (sin shadow DOM)");
		}
	}

	/**
	 * Subscribe a un evento de toggle del chat.
	 * @param callback Función a ejecutar cuando el chat cambia de estado.
	 * @returns void
	 */
	public onToggle(callback: (visible: boolean) => void): void {
		this.toggleCallback.push(callback);
	}

	/**
	 * Configura estilos y contenido del botón.
	 */
	private applyStyles(): void {
				// Para el estilo Intercom, usamos SVG directamente en CSS con ::before
				// Eliminamos cualquier texto o elemento span dentro del botón
				Array.from(this.button.childNodes).forEach(child => {
					if (child.nodeType === Node.TEXT_NODE || (child as Element).tagName === 'SPAN') {
						this.button.removeChild(child);
					}
				});
				
				// Aplicar estilos adicionales si es necesario
				const baseColor = this.options.backgroundColor || '#0084ff';
				this.button.style.background = `linear-gradient(135deg, #0062cc 0%, #0084ff 20%, #00a8ff 40%, #00c6fb 60%, #0084ff 80%, #0062cc 100%)`;
				this.button.style.backgroundSize = '300% 300%';
				this.button.style.animation = 'gradientRotate 4s ease-in-out infinite';
				this.button.style.color = this.options.textColor || '#ffffff';
	}

	/**
	 * Asocia los eventos (click para hacer toggle del chat).
	 */
	private addEventListeners(): void {
		this.button.addEventListener('click', () => {
			// Invierte el estado actual
			this.isVisible = !this.isVisible;
			
			console.log("Toggle button clicked, new state:", this.isVisible ? "visible" : "hidden");
			
			// Aplicar/quitar clase para animar icono
			if (this.isVisible) {
				this.button.classList.add('open');
			} else {
				this.button.classList.remove('open');
			}
			
			// Notificar a todos los callbacks sobre el cambio de estado
			this.toggleCallback.forEach(callback => {
				callback(this.isVisible);
			});
		});
	}

	/**
	 * Oculta el badge de mensajes no leídos
	 */
	private hideBadge(): void {
		if (!this.badgeElement) return;
		
		this.badgeElement.classList.add('hidden');
		this.badgeElement.style.opacity = '0';
		this.badgeElement.style.transform = 'scale(0)';
		this.badgeElement.style.display = 'none';
		this.badgeElement.textContent = '';
		console.log("🚫 Badge oculto - sin mensajes no leídos");
	}

	/**
	 * Actualiza el badge con el número de mensajes no leídos
	 * @param count Número de mensajes no leídos
	 */
	private updateUnreadBadge(count: number): void {
		if (!this.badgeElement) {
			console.error("Badge element no encontrado");
			return;
		}

		// ✅ NO mostrar el badge si el botón está oculto
		if (this.button && this.button.style.display === 'none') {
			console.log('🚫 Badge no se mostrará porque el botón está oculto');
			this.hideBadge();
			return;
		}

		console.log(`📬 Actualizando badge: ${count} mensajes no leídos`);

		if (count <= 0) {
			this.hideBadge();
		} else {
			this.badgeElement.classList.remove('hidden');
			this.badgeElement.style.opacity = '1';
			this.badgeElement.textContent = count > 99 ? '99+' : count.toString();
			console.log(`🔴 Badge visible - ${count} mensajes no leídos`);

			// Asegurar que el badge sea visible con estilo explícito
			this.badgeElement.style.display = 'flex';
			this.badgeElement.style.opacity = '1';
			this.badgeElement.style.transform = 'scale(1)';

			// Aplicar animación de pulso cuando se actualizan los mensajes
			if (this.badgeElement) {
				this.badgeElement.style.animation = 'none';
				setTimeout(() => {
					if (this.badgeElement) {
						this.badgeElement.style.animation = 'pulse 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
					}
				}, 10);
			}
		}
	}

	/**
	 * Inicializa el botón y añade estilos CSS inline para evitar problemas de ShadowDOM
	 */
	private initializeStyles(): void {
		const pos = this.resolvedPosition.button;

		// Estilos inline para el botón
		const buttonStyles: any = {
			position: 'fixed',
			width: '56px',
			height: '56px',
			borderRadius: '50%',
			background: 'linear-gradient(135deg, #0062cc 0%, #0084ff 20%, #00a8ff 40%, #00c6fb 60%, #0084ff 80%, #0062cc 100%)',
			backgroundSize: '300% 300%',
			animation: 'gradientRotate 4s ease-in-out infinite',
			color: this.options.textColor || '#ffffff',
			border: 'none',
			cursor: 'pointer',
			zIndex: '2147483647',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontWeight: 'bold',
			boxShadow: '0 4px 16px rgba(0, 132, 255, 0.5)',
			transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
			overflow: 'hidden'
		};

		// Aplicar posicionamiento dinámico
		if (pos.top) buttonStyles.top = pos.top;
		if (pos.bottom) buttonStyles.bottom = pos.bottom;
		if (pos.left) buttonStyles.left = pos.left;
		if (pos.right) buttonStyles.right = pos.right;

		Object.assign(this.button.style, buttonStyles);

		// Si existe el badge, aplicar estilos inline
		if (this.badgeElement) {
			const badgeStyles: any = {
				position: 'fixed',
				minWidth: '22px',
				height: '22px',
				background: 'linear-gradient(145deg, #ff5146, #e53a30)',
				color: 'white',
				borderRadius: '12px',
				fontSize: '12px',
				fontWeight: 'bold',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '0 5px',
				boxSizing: 'border-box',
				border: '2px solid white',
				zIndex: '2147483647',
				boxShadow: '0 2px 8px rgba(255,65,54,0.3)',
				pointerEvents: 'none',
				transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
			};

			// Calcular posición del badge basado en la posición del botón
			if (pos.bottom) {
				badgeStyles.bottom = `calc(${pos.bottom} + 43px)`;
			} else if (pos.top) {
				badgeStyles.top = `calc(${pos.top} + 13px)`;
			}

			if (pos.right) {
				badgeStyles.right = `calc(${pos.right} + 13px)`;
			} else if (pos.left) {
				badgeStyles.left = `calc(${pos.left} + 43px)`;
			}

			Object.assign(this.badgeElement.style, badgeStyles);
		}
	}

	/**
	 * Muestra el botón del chat
	 */
	public show(): void {
		if (this.button) {
			this.button.style.display = 'flex';
		}

		// Restaurar el badge si hay mensajes no leídos
		const unreadCount = this.unreadService.getUnreadCount();
		if (this.badgeElement && unreadCount > 0) {
			this.badgeElement.style.display = 'flex';
		}
	}

	/**
	 * Oculta el botón del chat
	 */
	public hide(): void {
		if (this.button) {
			this.button.style.display = 'none';
		}

		// También ocultar el badge cuando se oculta el botón
		if (this.badgeElement) {
			this.badgeElement.style.display = 'none';
		}
	}

	/**
	 * Verifica si el botón está visible
	 */
	public isButtonVisible(): boolean {
		const isVisible = this.button && this.button.style.display !== 'none';
		console.log("🔘 isButtonVisible() - Elemento existe:", !!this.button);
		if (this.button) {
			console.log("🔘 isButtonVisible() - Display style:", this.button.style.display);
		}
		console.log("🔘 isButtonVisible() - Resultado:", isVisible);
		return isVisible;
	}

	/**
	 * Oculta el badge de mensajes no leídos (método público)
	 */
	public hideUnreadBadge(): void {
		this.hideBadge();
	}

	/**
	 * Actualiza el badge con el número de mensajes no leídos (método público)
	 * @param count Número de mensajes no leídos (0, null o undefined para ocultar)
	 */
	public updateUnreadCount(count: number | null | undefined): void {
		const safeCount = count ?? 0;
		this.updateUnreadBadge(safeCount);
	}

	/**
	 * Actualiza el estado visual del botón para reflejar si el chat está abierto o cerrado
	 * @param isOpen true si el chat está abierto, false si está cerrado
	 */
	public updateState(isOpen: boolean): void {
		this.isVisible = isOpen;

		if (isOpen) {
			this.button.classList.add('open');
		} else {
			this.button.classList.remove('open');
		}

		console.log(`🔘 Estado del toggle button actualizado: ${isOpen ? 'abierto' : 'cerrado'}`);
	}

	/**
	 * Conecta el servicio de mensajes no leídos con el badge
	 * @param visitorId ID del visitante actual
	 * @param onMessageReceived Callback opcional para cuando se recibe un mensaje (con chat cerrado) - recibe chatId
	 * @param autoOpenChatOnMessage Si es true, el chat se abre automáticamente al recibir un mensaje
	 */
	public connectUnreadService(
		visitorId: string,
		onMessageReceived?: (chatId: string) => void,
		autoOpenChatOnMessage?: boolean
	): void {
		console.log('🔌 Conectando servicio de mensajes no leídos con visitorId:', visitorId);
		console.log('📬 Auto-apertura de chat:', autoOpenChatOnMessage ? 'habilitada' : 'deshabilitada');

		// Inicializar el servicio con el callback para actualizar el badge
		this.unreadService.initialize({
			visitorId,
			onCountChange: (count) => {
				console.log('📬 Contador de mensajes no leídos actualizado:', count);
				this.updateUnreadCount(count);
			},
			onMessageReceived,
			autoOpenChatOnMessage,
			debug: true // Habilitar logs de debug para troubleshooting
		});

		console.log('✅ Servicio de mensajes no leídos conectado');
	}

	/**
	 * Establece el chat activo en el servicio de mensajes no leídos
	 * @param chatId ID del chat
	 */
	public setActiveChatForUnread(chatId: string): void {
		console.log('📌 Estableciendo chat activo para mensajes no leídos:', chatId);
		this.unreadService.setCurrentChat(chatId);
	}

	/**
	 * Marca todos los mensajes no leídos como leídos
	 */
	public async markAllMessagesAsRead(): Promise<void> {
		console.log('✅ Marcando todos los mensajes como leídos...');
		await this.unreadService.markAllAsRead();
	}

	/**
	 * Notifica al servicio de mensajes no leídos sobre el estado del chat
	 * Cuando el chat está abierto, las notificaciones de badge se pausan automáticamente
	 * @param isOpen true si el chat está abierto, false si está cerrado
	 */
	public notifyChatOpenState(isOpen: boolean): void {
		console.log(`💬 Notificando estado del chat al UnreadMessagesService: ${isOpen ? 'abierto' : 'cerrado'}`);
		this.unreadService.setChatOpenState(isOpen);

		// Si el chat se abre, ocultar el badge inmediatamente
		if (isOpen) {
			this.hideBadge();
			console.log('🚫 Badge ocultado porque el chat está abierto');
		}
	}

	/**
	 * Obtiene el servicio de mensajes no leídos (para uso avanzado)
	 */
	public getUnreadService(): UnreadMessagesService {
		return this.unreadService;
	}

	/**
	 * Obtiene el elemento del botón para manipulación directa
	 */
	public getButtonElement(): HTMLButtonElement {
		return this.button;
	}
}
