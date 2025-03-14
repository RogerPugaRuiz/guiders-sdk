import { FingerprintPort } from "../interfaces/fingerprint.interface";
import { TokenPort } from "../interfaces/token.interface";
import { WebSocketPort } from "../interfaces/websocket.interface";
import { LiveChatComponent } from "../presentation/live-chat/live-chat.component";

export class GuidersPixel {
	private apiKey: string | null = null;
	private tokenService: TokenPort;
	private socketService: WebSocketPort;
	private fingerprintService: FingerprintPort;

	constructor(
		providers: {
			tokenService: TokenPort,
			socketService: WebSocketPort,
			fingerprintService: FingerprintPort
		},
	) {
		this.tokenService = providers.tokenService;
		this.socketService = providers.socketService;
		this.fingerprintService = providers.fingerprintService;
	}

	public async init(apiKey: string, options: Record<string, any> = {}): Promise<void> {
		this.apiKey = apiKey;

		// Primero, registrar el visitante antes de obtener el token
		await this.registerVisitor();

		// Luego, obtener el token y conectar el socket
		await this.tokenService.getValidAccessToken();
		await this.socketService.connectSocket();

		// Finalmente, inicializar el componente de chat
		const chatComponent = new LiveChatComponent({
			container: options.container || document.body,
		});
	}

	private async registerVisitor(): Promise<void> {
		const clientFingerprint = this.fingerprintService.getClientFingerprint();
		const userAgent = navigator.userAgent;

		console.log("Registrando visitante...");
		try {
			const response = await fetch('http://localhost:3000/pixel/register', {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apiKey: this.apiKey,
					client: clientFingerprint,
					userAgent: userAgent
				})
			});

			if (!response.ok) throw new Error('Error al registrar visitante');
			console.log('✅ Visitante registrado exitosamente');
		} catch (error) {
			console.error("❌ Error en el registro del visitante:", error);
		}
	}
}