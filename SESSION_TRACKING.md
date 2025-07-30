# 📊 Session Tracking

Documentación completa del sistema de tracking de sesiones de Guiders SDK.

## 🎯 Visión General

El sistema de Session Tracking de Guiders SDK proporciona seguimiento detallado de las sesiones de usuario, permitiendo analytics avanzados y insights sobre el comportamiento del usuario en tu sitio web.

## 🔄 Lifecycle de Sesión

### Inicio de Sesión

Una nueva sesión se inicia cuando:
- Usuario visita el sitio por primera vez
- Sesión anterior expiró (>30 minutos inactividad)
- Usuario regresa después de cerrar el navegador
- Se detecta cambio de dispositivo/navegador

```javascript
// La sesión se inicia automáticamente
sdk.on('session:started', (data) => {
  console.log('Nueva sesión iniciada:', data.sessionId);
  console.log('Datos de sesión:', data);
});
```

### Datos de Sesión

Cada sesión incluye:

```typescript
interface SessionData {
  sessionId: string;           // ID único de sesión
  userId?: string;             // ID de usuario (si está logueado)
  startTime: number;           // Timestamp de inicio
  lastActivity: number;        // Última actividad
  pageViews: number;           // Número de páginas vistas
  events: number;              // Número de eventos tracked
  referrer: string;            // Referrer de la sesión
  utmSource?: string;          // UTM source
  utmMedium?: string;          // UTM medium
  utmCampaign?: string;        // UTM campaign
  device: DeviceInfo;          // Información del dispositivo
  browser: BrowserInfo;        // Información del navegador
  location: LocationInfo;      // Información geográfica
}
```

## 📈 Métricas de Sesión

### Métricas Automáticas

El SDK trackea automáticamente:

| Métrica | Descripción | Cálculo |
|---------|-------------|---------|
| `session_duration` | Duración total de la sesión | `endTime - startTime` |
| `page_views` | Páginas vistas en la sesión | Contador automático |
| `bounce_rate` | Tasa de rebote | Una sola página vista |
| `engagement_score` | Puntuación de engagement | Basado en interacciones |
| `scroll_depth` | Profundidad de scroll | Porcentaje máximo |
| `time_on_page` | Tiempo en cada página | Por página individual |
| `exit_page` | Página de salida | Última página vista |
| `conversion_events` | Eventos de conversión | Eventos marcados como conversión |

### Ejemplo de Datos de Sesión

```javascript
{
  sessionId: "sess_1234567890abcdef",
  userId: "user_987654321",
  startTime: 1699123456789,
  lastActivity: 1699123756789,
  duration: 300000, // 5 minutos
  pageViews: 5,
  events: 12,
  bounced: false,
  referrer: "https://google.com/search?q=guiders",
  utmSource: "google",
  utmMedium: "organic",
  utmCampaign: null,
  device: {
    type: "desktop",
    os: "Windows",
    browser: "Chrome"
  },
  pages: [
    {
      url: "/",
      title: "Home",
      timeOnPage: 120000,
      scrollDepth: 0.85
    },
    {
      url: "/products",
      title: "Products",
      timeOnPage: 180000,
      scrollDepth: 1.0
    }
  ],
  conversions: [
    {
      event: "add_to_cart",
      timestamp: 1699123600000,
      value: 99.99
    }
  ]
}
```

## 🛠️ Configuración

### Configuración Básica

```javascript
const sdk = new TrackingPixelSDK({
  apiKey: 'your-api-key',
  sessionTracking: {
    enabled: true,
    timeout: 1800000,        // 30 minutos (ms)
    trackScrollDepth: true,
    trackTimeOnPage: true,
    trackClickHeatmap: true,
    enableSessionReplay: false
  }
});
```

### Configuración Avanzada

```javascript
sdk.configure({
  sessionTracking: {
    enabled: true,
    timeout: 1800000,           // Timeout de sesión (ms)
    trackScrollDepth: true,     // Trackear profundidad de scroll
    trackTimeOnPage: true,      // Trackear tiempo en página
    trackClickHeatmap: true,    // Trackear clicks para heatmap
    enableSessionReplay: false, // Session replay (cuidado con privacidad)
    
    // Configuración de engagement
    engagement: {
      scrollThreshold: 0.5,     // 50% scroll = engaged
      timeThreshold: 30000,     // 30s en página = engaged
      clickThreshold: 3         // 3 clicks = engaged
    },
    
    // Eventos de conversión
    conversionEvents: [
      'purchase',
      'add_to_cart',
      'contact_form_submit',
      'newsletter_signup'
    ],
    
    // Configuración de sampling
    sampling: {
      rate: 1.0,                // 100% de sesiones
      excludeBots: true,
      excludeInternalTraffic: true
    }
  }
});
```

## 📊 APIs de Session Tracking

### Obtener Sesión Actual

```javascript
const currentSession = sdk.getCurrentSession();
console.log('Sesión actual:', currentSession);
```

### Establecer ID de Usuario

```javascript
// Asociar sesión con usuario logueado
sdk.setUserId('user_12345');

// Con datos adicionales
sdk.setUserData({
  userId: 'user_12345',
  email: 'user@example.com',
  plan: 'premium',
  registrationDate: '2023-01-15'
});
```

### Marcar Eventos de Conversión

```javascript
// Marcar evento como conversión
await sdk.track({
  event: 'purchase',
  isConversion: true,
  value: 99.99,
  currency: 'EUR',
  data: {
    orderId: 'ORD-123',
    products: ['PROD-1', 'PROD-2']
  }
});
```

## 📈 Analytics de Sesión

### Métricas Calculadas

```javascript
// Obtener métricas de la sesión actual
const metrics = sdk.getSessionMetrics();

console.log('Métricas de sesión:', {
  duration: metrics.duration,           // Duración en ms
  pageViews: metrics.pageViews,         // Número de páginas
  engagementScore: metrics.engagement,  // 0-100
  bounced: metrics.bounced,             // true/false
  converted: metrics.converted          // true/false
});
```

### Eventos de Sesión

```javascript
// Escuchar eventos de sesión
sdk.on('session:started', (session) => {
  console.log('Sesión iniciada:', session.sessionId);
});

sdk.on('session:ended', (session) => {
  console.log('Sesión finalizada:', {
    duration: session.duration,
    pageViews: session.pageViews,
    converted: session.converted
  });
});

sdk.on('session:page-view', (data) => {
  console.log('Nueva página vista:', data.url);
});

sdk.on('session:conversion', (conversion) => {
  console.log('Conversión detectada:', conversion.event);
});
```

## 🎯 Casos de Uso Avanzados

### E-commerce Session Analytics

```javascript
// Configuración específica para e-commerce
sdk.configure({
  sessionTracking: {
    enabled: true,
    conversionEvents: [
      'view_product',
      'add_to_cart',
      'begin_checkout',
      'purchase'
    ],
    ecommerce: {
      trackCartValue: true,
      trackProductViews: true,
      trackCategoryNavigation: true
    }
  }
});

// Trackear funnel de conversión
sdk.on('session:conversion', (conversion) => {
  const funnel = sdk.getConversionFunnel();
  console.log('Progreso del funnel:', funnel);
});
```

### Lead Generation Tracking

```javascript
// Para sitios de generación de leads
sdk.configure({
  sessionTracking: {
    conversionEvents: [
      'contact_form_submit',
      'download_whitepaper',
      'request_demo',
      'newsletter_signup'
    ],
    leadScoring: {
      enabled: true,
      pageViewScore: 1,
      timeOnSiteScore: 0.1,  // Por segundo
      conversionScore: 50
    }
  }
});

// Obtener puntuación de lead
const leadScore = sdk.getLeadScore();
console.log('Lead score:', leadScore);
```

## 🔒 Privacidad y GDPR

### Configuración de Privacidad

```javascript
sdk.configure({
  privacy: {
    respectDoNotTrack: true,
    anonymizeIP: true,
    cookieConsent: true,
    dataRetentionDays: 365
  },
  sessionTracking: {
    excludePersonalData: true,
    hashUserIds: true,
    anonymizeReferrers: false
  }
});
```

---

El session tracking proporciona insights valiosos sobre el comportamiento del usuario y es fundamental para optimizar la experiencia y las conversiones en tu sitio web.