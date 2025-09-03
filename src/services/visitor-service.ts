import { EndpointManager } from '../core/tracking-pixel-SDK';

export interface VisitorMeResponse {
  id: string;
  name?: string | null;
  email?: string | null;
  tel?: string | null;
}

export class VisitorService {
  private static instance: VisitorService;
  private constructor() {}

  public static getInstance(): VisitorService {
    if (!VisitorService.instance) VisitorService.instance = new VisitorService();
    return VisitorService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const accessToken = localStorage.getItem('accessToken') || '';
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  private getVisitorMeUrl(): string {
    const endpoint = localStorage.getItem('pixelEndpoint') || EndpointManager.getInstance().getEndpoint();
    const apiRoot = endpoint.endsWith('/api') ? endpoint : `${endpoint}/api`;
    return `${apiRoot}/visitor/me`;
  }

  public async getMe(): Promise<VisitorMeResponse | null> {
    try {
      const url = this.getVisitorMeUrl();
      const res = await fetch(url, { headers: this.getAuthHeaders() });
      if (!res.ok) {
        const txt = await res.text();
        console.warn('[VisitorService] ❌ Error al obtener visitor/me:', res.status, txt);
        return null;
      }
      const data = await res.json() as VisitorMeResponse;
      if (data?.id) {
        localStorage.setItem('visitorId', data.id);
      }
      console.log('[VisitorService] ✅ visitor/me cargado:', data?.id);
      return data;
    } catch (e) {
      console.warn('[VisitorService] ❌ Excepción en getMe:', e);
      return null;
    }
  }
}
