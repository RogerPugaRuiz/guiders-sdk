# 🔐 GDPR Consent Placeholder - Guía de Implementación

## ✅ Implementado - v1.2.2-alpha.1

## 🔄 Actualización - Enero 2025 (v1.3.0)

**Cambios importantes en el flujo de consentimientos:**

- ✅ **Backend ahora registra automáticamente TODOS los consentimientos** cuando se llama a `identify()`
- ✅ **Eliminado flujo híbrido manual** - Ya no es necesario registrar `analytics` y `marketing` manualmente
- ✅ **HTTP 400 manejado correctamente** - Cuando el usuario rechaza, se crea visitante anónimo sin sesión
- ✅ **Añadido `currentUrl`** al payload de identify para mejor audit trail
- ✅ **Sincronización simplificada** - Solo para visitantes recurrentes (consentimiento > 5s)

**Detalles técnicos**:
- `VisitorsV2Service.identify()` ahora retorna información completa incluso cuando el consentimiento es rechazado
- El backend maneja atomicamente: creación de visitante + registro de consentimiento + gestión de sesión
- HTTP 200 (aceptado) vs HTTP 400 (rechazado) distinguen claramente los outcomes

Ver más detalles en la [Guía de Integración Frontend-Backend](./FRONTEND_BACKEND_INTEGRATION_GUIDE.md)

---

## 📋 Descripción

Sistema de **placeholder GDPR-compliant** que se muestra cuando el usuario **no ha otorgado consentimiento** para cookies/tracking.

### Cumple con:
- ✅ **GDPR Artículo 6** - No procesamiento sin base legal
- ✅ **GDPR Artículo 7** - Consentimiento explícito
- ✅ **Consideración 32** - No consentimiento implícito

---

## 🎯 Enfoque Implementado

### **Placeholder Informativo** (Similar a Drift/LiveChat)

```
┌─────────────────────────────────────────┐
│  Estado: pending                         │
│  ↓                                       │
│  PLACEHOLDER VISIBLE                     │
│  (HTML/CSS estático, sin JS del SDK)    │
│                                          │
│  [Icono Chat] 💬                         │
│  Chat disponible                         │
│  Acepta cookies para chatear            │
│  [Botón: Gestionar cookies]              │
└─────────────────────────────────────────┘
            ↓ Usuario acepta
┌─────────────────────────────────────────┐
│  Estado: granted                         │
│  ↓                                       │
│  PLACEHOLDER REMOVIDO (con animación)    │
│  SDK INICIALIZADO COMPLETO               │
│                                          │
│  [Chat Widget Completo] 💬               │
│  ✅ Tracking habilitado                   │
│  ✅ Backend conectado                     │
│  ✅ Mensajería funcional                  │
└─────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura

### **Archivos Creados**

#### 1. `src/presentation/consent-placeholder.ts`

```typescript
export class ConsentPlaceholder {
  private container: HTMLDivElement | null = null;
  private onConsentRequest?: () => void;

  // Muestra el placeholder (solo HTML/CSS)
  public show(): void

  // Oculta y remueve el placeholder
  public hide(): void

  // Verifica si está visible
  public isVisible(): boolean

  // Inyecta estilos CSS
  private injectStyles(): void

  // Configura event listeners
  private setupEventListeners(): void
}
```

**Características**:
- ✅ Solo HTML/CSS estático
- ✅ NO ejecuta JavaScript del SDK
- ✅ NO procesa datos personales
- ✅ NO crea cookies
- ✅ NO contacta el backend

#### 2. Modificaciones en `src/core/tracking-pixel-SDK.ts`

**Constructor** (líneas 322-345):
```typescript
// Verificar estado de consentimiento inicial
const initialState = this.consentManager.getState();

if (initialState.status === 'pending') {
  // Mostrar placeholder, NO inicializar SDK
  this.consentPlaceholder = new ConsentPlaceholder({
    onConsentRequest: () => {
      console.log('[TrackingPixelSDK] 👆 Usuario solicitó gestionar cookies');
    }
  });
  this.consentPlaceholder.show();
  console.log('[TrackingPixelSDK] ⏸️ SDK pausado hasta que se otorgue consentimiento');
} else if (initialState.status === 'granted') {
  // Inicializar inmediatamente
  this.init().catch(...);
} else {
  // Estado denied - no hacer nada
  console.log('[TrackingPixelSDK] 🔐 Estado inicial: denied - SDK no se inicializará');
}
```

**Callback onConsentChange** (líneas 217-247):
```typescript
if (state.status === 'granted') {
  // Ocultar placeholder si estaba visible
  if (this.consentPlaceholder && this.consentPlaceholder.isVisible()) {
    this.consentPlaceholder.hide();
    console.log('[TrackingPixelSDK] 🔄 Placeholder removido, inicializando SDK completo...');
  }

  // Inicializar el SDK completo
  this.init().catch(error => {
    console.error('[TrackingPixelSDK] ❌ Error inicializando SDK después de consentimiento:', error);
  });
}
```

---

## 📊 Flujo Completo

### **Caso 1: Primera Visita (Sin Consentimiento Previo)**

```
1. Usuario carga la página
   ↓
2. SDK constructor se ejecuta
   ↓
3. ConsentManager estado: 'pending'
   ↓
4. ✅ ConsentPlaceholder.show()
   - Placeholder visible en esquina inferior derecha
   - Mensaje: "Acepta cookies para chatear"
   - Botón: "Gestionar cookies"
   ↓
5. ❌ SDK.init() NO se ejecuta
   - No fingerprinting
   - No cookies
   - No backend calls
   - No tracking
   ↓
6. Usuario ve placeholder
   └─> Opción A: Ignora → Placeholder permanece visible
   └─> Opción B: Click "Gestionar cookies"
       ↓
       Banner GDPR se muestra
       ↓
       Usuario acepta
       ↓
7. ConsentManager.grantConsent()
   - localStorage: {status: 'granted', ...}
   - onConsentChange callback se dispara
   ↓
8. ✅ Placeholder.hide() (animación de salida)
   ↓
9. ✅ SDK.init() se ejecuta
   - Genera fingerprint
   - Llama identify()
   - Registra consentimientos (híbrido)
   - Inicializa chat completo
   ↓
10. Chat widget completamente funcional
```

### **Caso 2: Visita Recurrente (Con Consentimiento Previo)**

```
1. Usuario carga la página
   ↓
2. SDK constructor se ejecuta
   ↓
3. ConsentManager lee localStorage
   - Estado: 'granted' (de visita anterior)
   ↓
4. ❌ Placeholder NO se muestra
   ↓
5. ✅ SDK.init() se ejecuta inmediatamente
   - Genera fingerprint
   - Llama identify()
   - Sincroniza con backend (si consentimiento > 5s)
   - Inicializa chat
   ↓
6. Chat widget funcional desde el inicio
```

### **Caso 3: Consentimiento Denegado**

```
1. Usuario carga la página
   ↓
2. SDK constructor se ejecuta
   ↓
3. ConsentManager estado: 'denied'
   ↓
4. ❌ Placeholder NO se muestra
   ↓
5. ❌ SDK.init() NO se ejecuta
   ↓
6. Nada visible (modo degradado)
```

---

## 🎨 Diseño del Placeholder

### **HTML Generado**

```html
<div id="guiders-consent-placeholder" class="guiders-placeholder">
  <div class="guiders-placeholder-content">
    <div class="guiders-placeholder-icon">
      <svg><!-- Icono de chat --></svg>
    </div>
    <div class="guiders-placeholder-text">
      <strong>Chat disponible</strong>
      <p>Acepta cookies para chatear con nosotros</p>
    </div>
    <button id="guiders-placeholder-button" class="guiders-placeholder-button">
      Gestionar cookies
    </button>
  </div>
</div>
```

### **CSS**

```css
.guiders-placeholder {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-width: 320px;
  animation: guiders-placeholder-fadeIn 0.3s ease;
}
```

### **Responsive**

```css
@media (max-width: 480px) {
  .guiders-placeholder {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
```

---

## 🧪 Testing

### **1. Limpiar Estado**

```javascript
// En la consola del navegador
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **2. Verificar Placeholder**

```javascript
// Debe aparecer el placeholder en esquina inferior derecha
// Debe tener:
// - Icono de chat
// - Texto: "Chat disponible"
// - Botón: "Gestionar cookies"

// Verificar que NO se ejecutó JavaScript del SDK:
console.log('Fingerprint:', localStorage.getItem('fingerprint')); // null ✅
console.log('VisitorId:', localStorage.getItem('visitorId'));     // null ✅
console.log('API Key:', localStorage.getItem('guidersApiKey'));   // null ✅
```

### **3. Aceptar Consentimiento**

```javascript
// Click en "Gestionar cookies"
// -> Banner GDPR aparece

// Click en "Aceptar todas"
// -> Placeholder desaparece (animación)
// -> Chat widget aparece

// Verificar logs:
[TrackingPixelSDK] 🔐 Estado de consentimiento cambiado: {status: 'granted'}
[TrackingPixelSDK] 🔄 Placeholder removido, inicializando SDK completo...
[TrackingPixelSDK] 🚀 Inicializando SDK con consentimiento otorgado...
[TrackingPixelSDK] 🔐 Consentimiento verificado - guardando configuración
[VisitorsV2Service] 🔐 Enviando identify con consentimiento: {hasAcceptedPrivacyPolicy: true}
```

### **4. Verificar Datos Procesados**

```javascript
// AHORA sí debe haber datos:
console.log('Fingerprint:', localStorage.getItem('fingerprint')); // "1234567890" ✅
console.log('VisitorId:', localStorage.getItem('visitorId'));     // "4bb44f8d-..." ✅
console.log('API Key:', localStorage.getItem('guidersApiKey'));   // "abc123..." ✅
```

---

## 🔐 Compliance GDPR

### ✅ **Requisitos Cumplidos**

| Requisito GDPR | Estado | Implementación |
|----------------|--------|----------------|
| No procesamiento sin consentimiento | ✅ | SDK no ejecuta init() si pending |
| No cookies sin consentimiento | ✅ | init() solo se ejecuta con granted |
| No fingerprinting sin consentimiento | ✅ | ClientJS solo en init() |
| No backend calls sin consentimiento | ✅ | identify() solo después de granted |
| Mensaje claro de por qué no funciona | ✅ | Placeholder con texto explicativo |
| Facilitar aceptación | ✅ | Botón "Gestionar cookies" visible |
| Permitir uso sin cookies | ✅ | Placeholder no bloquea navegación |
| Consentimiento explícito | ✅ | Usuario debe hacer clic activamente |
| No consentimiento implícito | ✅ | Placeholder NO implica aceptación |

---

## 📈 Comparación con Competidores

| Característica | Intercom | Zendesk | Drift | **Guiders SDK** |
|----------------|----------|---------|-------|-----------------|
| Placeholder visible | ❌ | ❌ | ✅ | ✅ |
| Mensaje informativo | ❌ | ❌ | ✅ | ✅ |
| Botón para consentimiento | ❌ | ❌ | ⚠️ | ✅ |
| No procesa datos sin consent | ✅ | ✅ | ✅ | ✅ |
| Animación de transición | N/A | N/A | ⚠️ | ✅ |
| Integración con CMP | Externo | Externo | Externo | **Integrado** |

---

## 🚀 Ventajas del Sistema

### **UX**
- ✅ Usuario sabe que hay chat disponible
- ✅ Call-to-action claro para aceptar cookies
- ✅ Transición suave (placeholder → chat real)

### **Legal**
- ✅ 100% GDPR compliant
- ✅ No ambigüedad (placeholder ≠ consentimiento)
- ✅ Auditable (logs completos)

### **Técnico**
- ✅ Cero processing antes del consentimiento
- ✅ Performance (no carga SDK innecesariamente)
- ✅ Responsive (mobile-friendly)

---

## 📝 Personalización

### **Cambiar Texto**

```typescript
// Editar: src/presentation/consent-placeholder.ts línea 27-28
<strong>Tu título aquí</strong>
<p>Tu mensaje personalizado</p>
```

### **Cambiar Estilos**

```typescript
// Editar: src/presentation/consent-placeholder.ts línea 92-136
.guiders-placeholder {
  background: #yourcolor;
  border-radius: 8px; // Tu preferencia
  // ...
}
```

### **Cambiar Posición**

```typescript
// Editar: src/presentation/consent-placeholder.ts línea 94-96
.guiders-placeholder {
  bottom: 20px;  // Cambiar
  right: 20px;   // Cambiar
  left: auto;    // O fijar a la izquierda
}
```

---

## 🐛 Troubleshooting

### **Problema: Placeholder no aparece**

```javascript
// Verificar estado de consentimiento
const state = JSON.parse(localStorage.getItem('guiders_consent_state'));
console.log('Estado:', state);

// Si state es null:
localStorage.removeItem('guiders_consent_state');
location.reload();

// Si state.status === 'granted':
// Es correcto, el placeholder NO debe aparecer
```

### **Problema: Placeholder no desaparece después de aceptar**

```javascript
// Verificar que onConsentChange se dispara
// Debe ver este log:
[TrackingPixelSDK] 🔄 Placeholder removido, inicializando SDK completo...

// Si no aparece, verificar:
window.guiders.grantConsent(); // ¿Esto actualiza el estado?
```

### **Problema: SDK se inicializa sin consentimiento**

```javascript
// Verificar constructor (línea 325):
const initialState = this.consentManager.getState();
console.log('Estado inicial:', initialState);

// Debe ser 'pending' para mostrar placeholder
// Si es 'granted', verificar localStorage:
localStorage.removeItem('guiders_consent_state');
location.reload();
```

---

## 📚 Referencias

- [GDPR Artículo 6](https://gdpr-info.eu/art-6-gdpr/) - Lawfulness of processing
- [GDPR Artículo 7](https://gdpr-info.eu/art-7-gdpr/) - Conditions for consent
- [GDPR Consideración 32](https://gdpr-info.eu/recitals/no-32/) - Conditions for consent
- [Intercom GDPR Compliance](https://www.intercom.com/help/en/articles/1385437-how-intercom-complies-with-gdpr)
- [Drift GDPR Implementation](https://legalweb.io/en/gdpr/livechats_intercom/)

---

## 🏆 Resumen

✅ **Implementado**: Sistema de placeholder GDPR-compliant
✅ **Enfoque**: Placeholder informativo (similar a Drift/LiveChat)
✅ **Compliance**: 100% GDPR compatible
✅ **UX**: Usuario informado sin bloqueo
✅ **Performance**: SDK no carga hasta consentimiento
✅ **Versión**: 1.2.2-alpha.1
✅ **Build**: 323 KiB
✅ **Timestamp**: 2025-10-11 11:29

**El sistema está listo para producción** 🚀
