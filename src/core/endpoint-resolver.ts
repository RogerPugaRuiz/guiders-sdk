// Centraliza la resolución de endpoints (HTTP y WebSocket)
// Prioridad:
// 1. window.GUIDERS_CONFIG (si existe en runtime navegador)
// 2. Variables de entorno (GUIDERS_SDK_ENDPOINT / GUIDERS_SDK_WS_ENDPOINT / VITE_* )
// 3. Fallback según entorno (production vs no production)

export interface ResolvedEndpoints {
  endpoint: string;
  webSocketEndpoint: string;
  isProd: boolean;
}

function normalize(val: string): string {
  return val.replace(/\s+/g, '').replace(/\/+$/, '');
}

export function resolveDefaultEndpoints(): ResolvedEndpoints {
  const winCfg: any = (typeof window !== 'undefined' && (window as any).GUIDERS_CONFIG) ? (window as any).GUIDERS_CONFIG : {};
  // NODE_ENV puede venir de bundlers; fallback a winCfg.environment
  const nodeEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || winCfg.environment || 'production';
  const isProd = nodeEnv === 'production';

  const envEndpoint = (typeof process !== 'undefined' && process.env) ? (process.env.GUIDERS_SDK_ENDPOINT || process.env.VITE_GUIDERS_SDK_ENDPOINT) : undefined;
  const envWs = (typeof process !== 'undefined' && process.env) ? (process.env.GUIDERS_SDK_WS_ENDPOINT || process.env.VITE_GUIDERS_SDK_WS_ENDPOINT) : undefined;

  // Fallbacks producción actualizados a dominio oficial (evitar mixed-content y dependencia de IP pública)
  let endpoint = winCfg.endpoint || envEndpoint || (isProd ? 'https://guiders.es/api' : 'http://localhost:3000');
  let webSocketEndpoint = winCfg.webSocketEndpoint || envWs || (isProd ? 'wss://guiders.es' : 'ws://localhost:3000');

  endpoint = normalize(endpoint);
  webSocketEndpoint = normalize(webSocketEndpoint);

  return { endpoint, webSocketEndpoint, isProd };
}
