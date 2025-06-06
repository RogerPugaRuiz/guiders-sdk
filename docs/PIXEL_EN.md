# Guiders SDK Tracking Pixel

## Introduction

The Guiders SDK Tracking Pixel is a comprehensive tool for capturing visitor movement data on websites. It includes event tracking functionality, live chat, bot detection, and automatic DOM tracking.

## Installation

### Via npm

```bash
npm install guiders-pixel
```

### Via direct script

#### Method 1: Using data-api-key attribute

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" data-api-key="YOUR_API_KEY"></script>
```

#### Method 2: Using URL parameter

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js?apiKey=YOUR_API_KEY"></script>
```

## Basic Integration

### Option 1: data-api-key attribute

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" data-api-key="YOUR_API_KEY"></script>
```

### Option 2: URL parameter

```html
<script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js?apiKey=YOUR_API_KEY"></script>
```

### Option 3: Manual initialization

### Option 3: Manual initialization

```javascript
import { TrackingPixelSDK, BotDetector } from 'guiders-pixel';

// SDK configuration
const options = {
  apiKey: 'YOUR_API_KEY',
  autoFlush: true,
  flushInterval: 1000,
  maxRetries: 2,
  endpoint: 'https://your-api-endpoint.com/api',
  webSocketEndpoint: 'wss://your-websocket-endpoint.com'
};

// Bot detection (optional)
const detector = new BotDetector();
detector.detect().then(result => {
  if (!result.isBot) {
    // Initialize only for legitimate users
    const sdk = new TrackingPixelSDK(options);
    sdk.init().then(() => {
      console.log('SDK initialized successfully');
      sdk.enableDOMTracking();
    });
  }
});
```

## Configuration Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | string | Yes | - | API key for authentication |
| `endpoint` | string | No | https://guiders.ancoradual.com/api | API endpoint URL |
| `webSocketEndpoint` | string | No | wss://guiders.ancoradual.com | WebSocket endpoint URL |
| `autoFlush` | boolean | No | true | Automatic event sending |
| `flushInterval` | number | No | 1000 | Send interval in milliseconds |
| `maxRetries` | number | No | 2 | Maximum number of retries |

## Automatic DOM Tracking

The SDK includes automatic tracking for common e-commerce events. Simply add `data-track-event` attributes to your HTML elements:

### Supported Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `page_view` | DOMContentLoaded | Page view |
| `view_product` | mouseenter | Product view |
| `add_to_cart` | click | Add to cart |
| `view_cart` | mouseenter | View cart |
| `purchase` | click | Purchase completed |

### Usage Examples

```html
<!-- Product view -->
<div data-track-event="view_product" 
     data-product-id="12345" 
     data-product-name="Example Product"
     data-price="29.99"
     data-category="Electronics">
  <h3>Example Product</h3>
</div>

<!-- Add to cart button -->
<button data-track-event="add_to_cart"
        data-product-id="12345"
        data-quantity="1">
  Add to Cart
</button>

<!-- Cart view -->
<div data-track-event="view_cart" 
     data-cart-value="89.97"
     data-items-count="3">
  View Cart
</div>

<!-- Purchase button -->
<button data-track-event="purchase"
        data-order-id="ORD-12345"
        data-total="89.97"
        data-currency="EUR">
  Complete Purchase
</button>

<!-- Page view (automatic) -->
<div data-track-event="page_view" 
     data-page-title="Home Page"
     data-page-url="/home">
</div>
```

### Enable DOM Tracking

```javascript
// Tracking is enabled automatically, but you can also activate it manually:
window.guiders.enableDOMTracking();
```

## Custom Tracking

### Sending Custom Events

```javascript
// Basic event
await window.guiders.track({
  event: 'custom_event',
  user_id: '12345',
  action: 'button_click',
  value: 100
});

// Event with additional metadata
await window.guiders.track({
  event: 'newsletter_signup',
  email: 'user@example.com',
  source: 'footer_form',
  timestamp: Date.now()
});
```

### Event Management

```javascript
// Listen to events
window.guiders.on('receive-message', (message) => {
  console.log('Message received:', message);
});

// Listen to event once
window.guiders.once('visitor:open-chat', (event) => {
  console.log('Chat opened for the first time');
});

// Stop listening to events
function messageHandler(msg) {
  console.log('Message handler:', msg);
}
window.guiders.on('receive-message', messageHandler);
window.guiders.off('receive-message', messageHandler);
```

### Data Sending Control

```javascript
// Immediate manual sending
await window.guiders.flush();

// Stop automatic sending
window.guiders.stopAutoFlush();

// Add metadata to specific events
window.guiders.setMetadata('purchase', {
  affiliate_id: 'AFF123',
  campaign: 'black_friday_2024'
});
```

## Bot Detection

The SDK includes automatic bot detection to avoid tracking crawlers and bots. The detection analyzes:

- Browser User Agent
- Browser characteristics (plugins, webdriver, etc.)
- Page load times
- User interaction behavior

### Custom Configuration

```javascript
import { BotDetector } from 'guiders-pixel';

const detector = new BotDetector();
detector.detect().then(result => {
  console.log('Is bot?:', result.isBot);
  console.log('Probability:', result.probability);
  console.log('Details:', result.details);
  
  if (result.probability < 0.3) {
    // More permissive custom threshold
    initializeSDK();
  }
});
```

## Live Chat

The SDK includes integrated live chat functionality:

### Chat Features

- Lazy initialization (no flickering)
- Deferred content loading
- Unread message notifications
- Real-time WebSocket
- Automatic typing detection

### Chat Events

```javascript
// Chat is automatically initialized and hidden by default
// Events are tracked automatically:

// - visitor:open-chat: When user opens chat
// - visitor:close-chat: When user closes chat  
// - visitor:send-message: When user sends a message
// - receive-message: When receiving a message from advisor
```

### Chat Customization

```javascript
// Add system messages
window.addEventListener('add-system-message', (event) => {
  console.log('System message:', event.detail.message);
});

// Listen to chat open/close
window.guiders.on('visitor:open-chat', (event) => {
  console.log('Chat opened:', event.data);
});

window.guiders.on('visitor:close-chat', (event) => {
  console.log('Chat closed:', event.data);
});
```

## Processing Pipeline

The SDK uses a pipeline system to process events:

```javascript
// Add custom stages to the pipeline
window.guiders.addPipelineStage({
  name: 'custom-validator',
  process: (event) => {
    // Custom validation
    if (event.type === 'purchase' && !event.data.order_id) {
      throw new Error('order_id is required for purchase events');
    }
    return event;
  }
});
```

## Complete Examples

### Basic E-commerce

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Store</title>
</head>
<body>
  <!-- Automatic page tracking -->
  <div data-track-event="page_view" 
       data-page-title="Product Catalog"
       data-page-category="shop"></div>

  <!-- Product -->
  <div class="product" 
       data-track-event="view_product"
       data-product-id="PROD-001"
       data-product-name="Smartphone XYZ"
       data-price="299.99"
       data-category="Electronics">
    
    <h2>Smartphone XYZ</h2>
    <p>Price: €299.99</p>
    
    <button data-track-event="add_to_cart"
            data-product-id="PROD-001"
            data-price="299.99"
            data-quantity="1">
      Add to Cart
    </button>
  </div>

  <!-- Cart -->
  <div data-track-event="view_cart"
       data-cart-value="299.99"
       data-items-count="1">
    <h3>Your Cart</h3>
    <p>Total: €299.99</p>
    
    <button data-track-event="purchase"
            data-order-id="ORD-789"
            data-total="299.99"
            data-currency="EUR"
            data-payment-method="credit_card">
      Complete Purchase
    </button>
  </div>

  <!-- SDK Integration -->
  <script src="https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js" 
          data-api-key="your-api-key-here"></script>
</body>
</html>
```

### Advanced Integration

```javascript
// Complete configuration with error handling
async function initializeGuiders() {
  try {
    const options = {
      apiKey: 'YOUR_API_KEY',
      endpoint: 'https://your-api.com/api',
      webSocketEndpoint: 'wss://your-api.com',
      autoFlush: true,
      flushInterval: 2000,
      maxRetries: 3
    };

    // Check if it's a bot
    const detector = new BotDetector();
    const detection = await detector.detect();
    
    if (detection.isBot) {
      console.log('Bot detected, tracking not initialized');
      return;
    }

    // Initialize SDK
    const sdk = new TrackingPixelSDK(options);
    window.guiders = sdk;
    
    await sdk.init();
    sdk.enableDOMTracking();

    // Custom tracking
    await sdk.track({
      event: 'page_load',
      page: window.location.pathname,
      referrer: document.referrer,
      timestamp: Date.now()
    });

    console.log('Guiders SDK initialized successfully');
    
  } catch (error) {
    console.error('Error initializing Guiders SDK:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGuiders);
} else {
  initializeGuiders();
}
```

## Troubleshooting

### Common Issues

1. **SDK doesn't initialize**
   - Verify that the API key is correct
   - Check server connection
   - Review if incorrectly detected as bot

2. **Events don't send**
   - Verify that `autoFlush` is enabled
   - Check `flushInterval` configuration
   - Review browser console for errors

3. **Chat doesn't appear**
   - Chat is hidden by default until user activates it
   - Verify WebSocket connection
   - Check that tokens are valid

### Debugging

```javascript
// Enable detailed logs
console.log('SDK state:', {
  hasValidTokens: TokenManager.hasValidTokens(),
  isConnected: window.guiders.isConnected?.(),
  eventQueue: window.guiders.eventQueue?.length
});

// Verify bot detection
const detector = new BotDetector();
detector.detect().then(result => {
  console.log('Bot detection:', result);
});
```

## Support

For technical support or to report issues:

1. Review the complete documentation
2. Verify API key configuration
3. Check browser console for errors
4. Contact support team with specific problem details

---

## Versioning

Current version: 1.0.5

For more information about changes and updates, check the project's README.md file.