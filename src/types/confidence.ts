/**
 * Niveles de confianza globales para la detección de elementos y páginas
 * Estas constantes se utilizan en URLPageDetector y HeuristicElementDetector
 */
export enum ConfidenceLevel {
    EXACT_MATCH = 0.95,     // Coincidencia exacta o muy precisa
    HIGH = 0.9,             // Alta confianza
    MEDIUM = 0.7,           // Confianza media
    LOW = 0.5,              // Baja confianza
    FALLBACK = 0.1          // Coincidencia genérica o fallback
}
