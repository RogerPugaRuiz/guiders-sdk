# 🔗 Integrations Guide

Guía completa de integraciones de Guiders SDK con plataformas populares.

## 🌐 Plataformas Soportadas

| Plataforma | Soporte | Guía | Plugin/Extensión |
|------------|---------|------|------------------|
| WordPress | ✅ Completo | [Ver guía](#wordpress) | ✅ [Plugin oficial](../wordpress-plugin/) |
| WooCommerce | ✅ Completo | [Ver guía](#woocommerce) | ✅ Incluido en plugin WP |
| Shopify | ✅ Beta | [Ver guía](#shopify) | ⚠️ En desarrollo |
| Magento | ⚠️ Básico | [Ver guía](#magento) | ❌ Manual |
| Drupal | ⚠️ Básico | [Ver guía](#drupal) | ❌ Manual |
| React/Next.js | ✅ Completo | [Ver guía](#react-nextjs) | ➖ NPM Package |
| Vue.js/Nuxt | ✅ Completo | [Ver guía](#vuejs-nuxt) | ➖ NPM Package |
| Angular | ✅ Completo | [Ver guía](#angular) | ➖ NPM Package |
| HTML Estático | ✅ Completo | [Ver guía](#html-estatico) | ➖ CDN |

---

## 🔌 WordPress

### Instalación Rápida

1. **Descargar plugin oficial**
   ```bash
   wget https://github.com/RogerPugaRuiz/guiders-sdk/releases/latest/download/guiders-wp-plugin.zip
   ```

2. **Instalar en WordPress**
   - **Admin > Plugins > Añadir nuevo > Subir plugin**
   - Subir archivo ZIP
   - Activar plugin

3. **Configurar**
   - **Configuración > Guiders SDK**
   - Añadir API Key
   - Guardar cambios

### Personalización Avanzada

```php
// functions.php del tema
add_filter('guiders_sdk_config', function($config) {
    // Configuración personalizada por tipo de página
    if (is_front_page()) {
        $config['chat']['welcomeMessage'] = '¡Bienvenido! ¿En qué podemos ayudarte?';
    } elseif (is_shop()) {
        $config['chat']['welcomeMessage'] = '¿Buscas algo específico en nuestra tienda?';
    }
    
    return $config;
});

// Tracking de eventos personalizados
add_action('wp_footer', function() {
    if (is_single() && get_post_type() === 'product') {
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Trackear tiempo en página de producto
            let startTime = Date.now();
            window.addEventListener('beforeunload', function() {
                if (window.guiders) {
                    window.guiders.track({
                        event: 'product_page_time',
                        data: {
                            product_id: <?php echo get_the_ID(); ?>,
                            time_spent: Date.now() - startTime
                        }
                    });
                }
            });
        });
        </script>
        <?php
    }
});
```

---

## 🛒 WooCommerce

### Eventos Automáticos

El plugin detecta automáticamente estos eventos:

```php
// Eventos tracked automáticamente
$wc_events = [
    'view_item' => 'Página de producto visitada',
    'add_to_cart' => 'Producto añadido al carrito',
    'view_cart' => 'Carrito visualizado',
    'begin_checkout' => 'Checkout iniciado',
    'purchase' => 'Compra completada',
    'remove_from_cart' => 'Producto eliminado del carrito'
];
```

### Enhanced E-commerce Tracking

```php
// Tracking avanzado de e-commerce
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    
    // Trackear compra con detalles completos
    if (function_exists('guiders_track_event')) {
        guiders_track_event([
            'event' => 'purchase',
            'data' => [
                'transaction_id' => $order->get_order_number(),
                'value' => $order->get_total(),
                'currency' => $order->get_currency(),
                'coupon' => $order->get_coupon_codes(),
                'payment_method' => $order->get_payment_method(),
                'shipping_method' => $order->get_shipping_method(),
                'items' => array_map(function($item) {
                    $product = $item->get_product();
                    return [
                        'product_id' => $product->get_id(),
                        'product_name' => $product->get_name(),
                        'category' => implode(', ', wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'names'])),
                        'quantity' => $item->get_quantity(),
                        'price' => $item->get_total()
                    ];
                }, $order->get_items())
            ]
        ]);
    }
});

// Trackear abandono de carrito
add_action('wp_footer', function() {
    if (is_cart() && !WC()->cart->is_empty()) {
        ?>
        <script>
        // Detectar abandono después de 5 minutos
        setTimeout(function() {
            if (window.guiders) {
                window.guiders.track({
                    event: 'cart_abandonment',
                    data: {
                        cart_value: <?php echo WC()->cart->get_total('edit'); ?>,
                        cart_items: <?php echo WC()->cart->get_cart_contents_count(); ?>,
                        time_on_cart: 300 // 5 minutos
                    }
                });
            }
        }, 300000);
        </script>
        <?php
    }
});
```

---

## 🏪 Shopify

### Instalación Manual

1. **Añadir script en tema**
   ```liquid
   <!-- En theme.liquid, antes de </head> -->
   <script>
   window.guidersConfig = {
     apiKey: '{{ settings.guiders_api_key }}',
     platform: 'shopify',
     shop: '{{ shop.domain }}'
   };
   </script>
   
   <!-- Antes de </body> -->
   <script src="https://cdn.guiders.com/latest/guiders-sdk.js"></script>
   ```

2. **Configurar en Theme Settings**
   ```json
   // config/settings_schema.json
   [
     {
       "name": "Guiders SDK",
       "settings": [
         {
           "type": "text",
           "id": "guiders_api_key",
           "label": "Guiders API Key",
           "info": "Obtén tu API key en dashboard.guiders.com"
         }
       ]
     }
   ]
   ```

### Tracking de E-commerce

```liquid
<!-- En product.liquid -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Trackear vista de producto
  if (window.guiders) {
    window.guiders.track({
      event: 'view_item',
      data: {
        item_id: '{{ product.id }}',
        item_name: '{{ product.title | escape }}',
        currency: '{{ cart.currency.iso_code }}',
        value: {{ product.price | money_without_currency }},
        item_category: '{{ product.type | escape }}',
        item_variant: '{{ product.selected_or_first_available_variant.title | escape }}'
      }
    });
  }
});
</script>

<!-- En cart.liquid -->
<script>
// Trackear cambios en carrito
document.addEventListener('DOMContentLoaded', function() {
  if (window.guiders) {
    window.guiders.track({
      event: 'view_cart',
      data: {
        currency: '{{ cart.currency.iso_code }}',
        value: {{ cart.total_price | money_without_currency }},
        items: [
          {% for item in cart.items %}
          {
            item_id: '{{ item.product_id }}',
            item_name: '{{ item.title | escape }}',
            quantity: {{ item.quantity }},
            price: {{ item.price | money_without_currency }}
          }{% unless forloop.last %},{% endunless %}
          {% endfor %}
        ]
      }
    });
  }
});
</script>
```

---

## 🅰️ React/Next.js

### Instalación

```bash
npm install guiders-pixel
```

### Setup en React

```tsx
// hooks/useGuiders.ts
import { useEffect, useState } from 'react';
import { TrackingPixelSDK } from 'guiders-pixel';

export const useGuiders = (apiKey: string) => {
  const [sdk, setSdk] = useState<TrackingPixelSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      try {
        const guidersSDK = new TrackingPixelSDK({
          apiKey,
          spa: { enabled: true }
        });
        
        await guidersSDK.init();
        guidersSDK.enableAutomaticTracking();
        
        setSdk(guidersSDK);
        setIsInitialized(true);
        
        // Hacer SDK globalmente disponible
        (window as any).guiders = guidersSDK;
        
      } catch (error) {
        console.error('Error inicializando Guiders SDK:', error);
      }
    };

    initSDK();
  }, [apiKey]);

  return { sdk, isInitialized };
};
```

### Componente Provider

```tsx
// contexts/GuidersContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useGuiders } from '../hooks/useGuiders';
import { TrackingPixelSDK } from 'guiders-pixel';

interface GuidersContextType {
  sdk: TrackingPixelSDK | null;
  isInitialized: boolean;
  track: (event: any) => Promise<void>;
}

const GuidersContext = createContext<GuidersContextType | undefined>(undefined);

export const GuidersProvider: React.FC<{ 
  children: ReactNode; 
  apiKey: string; 
}> = ({ children, apiKey }) => {
  const { sdk, isInitialized } = useGuiders(apiKey);

  const track = async (event: any) => {
    if (sdk && isInitialized) {
      await sdk.track(event);
    }
  };

  return (
    <GuidersContext.Provider value={{ sdk, isInitialized, track }}>
      {children}
    </GuidersContext.Provider>
  );
};

export const useGuidersContext = () => {
  const context = useContext(GuidersContext);
  if (!context) {
    throw new Error('useGuidersContext must be used within a GuidersProvider');
  }
  return context;
};
```

### Uso en Componentes

```tsx
// components/ProductCard.tsx
import React from 'react';
import { useGuidersContext } from '../contexts/GuidersContext';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { track } = useGuidersContext();

  const handleAddToCart = async () => {
    // Lógica de añadir al carrito
    await addToCart(product.id);
    
    // Trackear evento
    await track({
      event: 'add_to_cart',
      data: {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        category: product.category
      }
    });
  };

  const handleViewProduct = async () => {
    await track({
      event: 'view_item',
      data: {
        product_id: product.id,
        product_name: product.name,
        category: product.category
      }
    });
  };

  return (
    <div className="product-card" onMouseEnter={handleViewProduct}>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>
        Añadir al Carrito
      </button>
    </div>
  );
};
```

### Next.js App Router

```tsx
// app/layout.tsx
import { GuidersProvider } from '../contexts/GuidersContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <GuidersProvider apiKey={process.env.NEXT_PUBLIC_GUIDERS_API_KEY!}>
          {children}
        </GuidersProvider>
      </body>
    </html>
  );
}
```

### Hook de Page Tracking

```tsx
// hooks/usePageTracking.ts
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useGuidersContext } from '../contexts/GuidersContext';

export const usePageTracking = () => {
  const pathname = usePathname();
  const { track, isInitialized } = useGuidersContext();

  useEffect(() => {
    if (isInitialized) {
      track({
        event: 'page_view',
        data: {
          page_url: pathname,
          page_title: document.title
        }
      });
    }
  }, [pathname, isInitialized, track]);
};
```

---

## 🌟 Vue.js/Nuxt

### Plugin para Vue

```typescript
// plugins/guiders.client.ts (Nuxt 3)
import { TrackingPixelSDK } from 'guiders-pixel';

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  
  const sdk = new TrackingPixelSDK({
    apiKey: config.public.guidersApiKey,
    spa: { enabled: true }
  });

  await sdk.init();
  sdk.enableAutomaticTracking();

  return {
    provide: {
      guiders: sdk
    }
  };
});
```

### Composable

```typescript
// composables/useGuiders.ts
export const useGuiders = () => {
  const { $guiders } = useNuxtApp();

  const track = async (event: any) => {
    if ($guiders) {
      await $guiders.track(event);
    }
  };

  return {
    track,
    sdk: $guiders
  };
};
```

### Middleware de Page Tracking

```typescript
// middleware/guiders.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const { track } = useGuiders();
  
  track({
    event: 'page_view',
    data: {
      page_url: to.path,
      page_title: to.meta.title || 'Unknown'
    }
  });
});
```

---

## 🅰️ Angular

### Service

```typescript
// services/guiders.service.ts
import { Injectable } from '@angular/core';
import { TrackingPixelSDK } from 'guiders-pixel';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GuidersService {
  private sdk: TrackingPixelSDK | null = null;
  private initialized = false;

  async init(): Promise<void> {
    try {
      this.sdk = new TrackingPixelSDK({
        apiKey: environment.guidersApiKey,
        spa: { enabled: true }
      });

      await this.sdk.init();
      this.sdk.enableAutomaticTracking();
      
      this.initialized = true;
      (window as any).guiders = this.sdk;
      
    } catch (error) {
      console.error('Error inicializando Guiders SDK:', error);
    }
  }

  async track(event: any): Promise<void> {
    if (this.sdk && this.initialized) {
      await this.sdk.track(event);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
```

### Module Setup

```typescript
// app.module.ts
import { APP_INITIALIZER } from '@angular/core';
import { GuidersService } from './services/guiders.service';

function initializeGuiders(guidersService: GuidersService) {
  return (): Promise<void> => guidersService.init();
}

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeGuiders,
      deps: [GuidersService],
      multi: true
    }
  ]
})
export class AppModule { }
```

### Router Events

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { GuidersService } from './services/guiders.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  
  constructor(
    private router: Router,
    private guiders: GuidersService
  ) {}

  ngOnInit() {
    // Trackear cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.guiders.track({
          event: 'page_view',
          data: {
            page_url: event.url,
            page_title: document.title
          }
        });
      });
  }
}
```

---

## 📄 HTML Estático

### Integración Básica

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi Sitio Web</title>
</head>
<body>
    <!-- Tu contenido aquí -->
    <h1>Bienvenido</h1>
    
    <button onclick="contactUs()">Contactar</button>
    <button onclick="addToCart('product-123')">Añadir al Carrito</button>
    
    <!-- Guiders SDK -->
    <script src="https://cdn.guiders.com/latest/guiders-sdk.js" 
            data-api-key="tu-api-key"></script>
    
    <script>
    // Funciones personalizadas
    async function contactUs() {
        // Lógica de contacto
        
        // Trackear evento
        if (window.guiders) {
            await window.guiders.track({
                event: 'contact_form_open',
                data: {
                    page: window.location.pathname
                }
            });
        }
    }
    
    async function addToCart(productId) {
        // Lógica de añadir al carrito
        
        // Trackear evento
        if (window.guiders) {
            await window.guiders.track({
                event: 'add_to_cart',
                data: {
                    product_id: productId,
                    page: window.location.pathname
                }
            });
        }
    }
    </script>
</body>
</html>
```

### Con Configuración Avanzada

```html
<script>
// Configuración antes de cargar el SDK
window.guidersConfig = {
  apiKey: 'tu-api-key',
  debug: false,
  heuristicDetection: {
    enabled: true,
    confidenceThreshold: 0.7
  },
  chat: {
    enabled: true,
    position: 'bottom-right',
    welcomeMessage: '¡Hola! ¿En qué podemos ayudarte?'
  },
  botDetection: {
    enabled: true,
    threshold: 0.6
  }
};
</script>
<script src="https://cdn.guiders.com/latest/guiders-sdk.js"></script>
```

---

## 🔧 Integraciones Personalizadas

### API REST

```javascript
// Enviar eventos via API REST
async function sendCustomEvent(eventData) {
  try {
    const response = await fetch('https://api.guiders.com/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer tu-api-key'
      },
      body: JSON.stringify({
        event: eventData.event,
        timestamp: Date.now(),
        user_id: getCurrentUserId(),
        session_id: getSessionId(),
        data: eventData.data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error enviando evento:', error);
  }
}
```

### WebHooks

```javascript
// Configurar webhooks para eventos
const webhookConfig = {
  events: ['purchase', 'signup', 'high_value_action'],
  url: 'https://tu-servidor.com/webhook/guiders',
  secret: 'tu-secret-key'
};

// Procesar webhook en tu servidor
app.post('/webhook/guiders', (req, res) => {
  const signature = req.headers['x-guiders-signature'];
  const payload = req.body;
  
  // Verificar signature
  if (verifySignature(payload, signature, webhookConfig.secret)) {
    // Procesar evento
    processGuidersEvent(payload);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Unauthorized');
  }
});
```

---

## 📞 Soporte para Integraciones

### Recursos

- 📖 [Documentación de API](./API_REFERENCE.md)
- 💬 [Chat de Soporte](https://support.guiders.com)
- 🐛 [Reportar Problemas](https://github.com/RogerPugaRuiz/guiders-sdk/issues)
- ✨ [Solicitar Nueva Integración](https://github.com/RogerPugaRuiz/guiders-sdk/issues/new)

### Integraciones Personalizadas

¿Necesitas integración con una plataforma no listada? ¡Contáctanos!

- **Email**: integrations@guiders.com
- **Discord**: [Unirse al servidor](https://discord.gg/guiders)
- **Slack**: [Canal de integraciones](https://guiders.slack.com/channels/integrations)

---

¿Tu plataforma no está listada? ¡Contribuye con una nueva integración o solicítala en nuestro repositorio!