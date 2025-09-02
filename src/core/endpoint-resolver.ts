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

  // --- Detección de modo dev via query param ?dev ---
  // Requerimiento: default a producción salvo que exista ?dev en la URL de la página
  // o en el propio <script src="...index.js?dev=..."> que carga el SDK.
  let devParam: string | null = null;
  try {
    if (typeof window !== 'undefined') {
      // 1) Query del documento
      devParam = new URL(window.location.href).searchParams.get('dev');
      // 2) Query del script actual si no encontrado en la página
      if (!devParam && typeof document !== 'undefined') {
        let scriptEl: HTMLScriptElement | null = (document.currentScript as HTMLScriptElement) || null;
        if (!scriptEl) {
          const candidates = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
          scriptEl = candidates.find(s => /index\.js/.test(s.src)) || null;
        }
        if (scriptEl && scriptEl.src) {
          try {
            const scriptUrl = new URL(scriptEl.src, window.location.origin);
            devParam = scriptUrl.searchParams.get('dev');
          } catch (_) { /* noop */ }
        }
      }
    }
  } catch (_) {
    // Silencioso: no bloqueamos la resolución por errores de parsing
  }

  // Interpretación: cualquier valor distinto de "false" o "0" activa dev.
  const devExplicit = !!devParam && !/^0|false$/i.test(devParam);

  // Precedencia de isProd:
  // - Si winCfg.environment define explícitamente 'production' o 'development', lo respetamos.
  // - Luego, si hay query ?dev forzamos dev.
  // - Si nada: producción por defecto (requerimiento nuevo).
  let isProd: boolean;
  if (winCfg.environment === 'production') {
    isProd = true;
  } else if (winCfg.environment === 'development') {
    isProd = false;
  } else if (devExplicit) {
    isProd = false;
  } else {
    isProd = true; // default ahora siempre prod salvo override
  }

  const envEndpoint = (typeof process !== 'undefined' && process.env) ? (process.env.GUIDERS_SDK_ENDPOINT || process.env.VITE_GUIDERS_SDK_ENDPOINT) : undefined;
  const envWs = (typeof process !== 'undefined' && process.env) ? (process.env.GUIDERS_SDK_WS_ENDPOINT || process.env.VITE_GUIDERS_SDK_WS_ENDPOINT) : undefined;

  // Fallbacks producción (o dev si forzado) actualizados a dominio oficial / localhost (dev ahora fuerza /api como en prod)
  let endpoint = winCfg.endpoint || envEndpoint || (isProd ? 'https://guiders.es/api' : 'http://localhost:3000/api');
  let webSocketEndpoint = winCfg.webSocketEndpoint || envWs || (isProd ? 'wss://guiders.es' : 'ws://localhost:3000');

  endpoint = normalize(endpoint);
  webSocketEndpoint = normalize(webSocketEndpoint);

  return { endpoint, webSocketEndpoint, isProd };
}
