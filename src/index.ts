// src/index.ts

import { TokenManager } from "./core/token-manager";
import { TrackingPixelSDK } from "./core/tracking-pixel-SDK";

export * from "./core/tracking-pixel-SDK";
export * from "./core/token-manager";
export * from "./pipeline/pipeline-stage";
export * from "./pipeline/stages/token-stage";
export * from "./types";
// Se pueden exportar más etapas o servicios según se vayan implementando.


declare global {
	interface Window {
		TrackingPixelSDK: typeof TrackingPixelSDK;
	}
}

// Si estamos en un entorno de navegador, asignamos los módulos al objeto global.
if (typeof window !== "undefined") {
	// Para evitar problemas de módulos, asegúrate de que estas importaciones
	// se correspondan con la salida compilada de tu proyecto.
	window.TrackingPixelSDK = TrackingPixelSDK;

}