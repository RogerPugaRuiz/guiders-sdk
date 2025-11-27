/**
 * Declaraciones de variables globales inyectadas por Webpack en tiempo de build
 */

/**
 * Versión del SDK inyectada desde package.json
 * Se actualiza automáticamente en cada build
 */
declare const __SDK_VERSION__: string;

/**
 * Flag de producción inyectado por Webpack
 * true = production (process.env.NODE_ENV === 'production')
 * false = development
 */
declare const __PRODUCTION__: boolean;
