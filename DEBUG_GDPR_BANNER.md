# 🐛 Debug: Banner GDPR No Envía Peticiones

## Problema

Al hacer clic en "Aceptar todas" en el banner, no se envían peticiones al backend.

---

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar que el SDK se está cargando

Abre la **consola del navegador** (F12 → Console) y ejecuta:

```javascript
console.log('1. ¿Existe window.guiders?', typeof window.guiders);
console.log('2. ¿Qué métodos tiene?', window.guiders ? Object.keys(window.guiders) : 'NO EXISTE');
```

**Resultado esperado:**
```
1. ¿Existe window.guiders? object
2. ¿Qué métodos tiene? ["grantConsent", "denyConsent", "getConsentStatus", ...]
```

**Si ves `undefined`:**
→ El SDK **NO se está cargando**. Problema en el `<script>` tag del header.

---

### Paso 2: Verificar que el botón existe

```javascript
console.log('3. Botón "Aceptar todas":', document.getElementById('gdpr-accept-all'));
console.log('4. Banner:', document.getElementById('gdpr-consent-banner'));
```

**Resultado esperado:**
```
3. Botón "Aceptar todas": <button class="gdpr-btn gdpr-btn-accept" id="gdpr-accept-all">
4. Banner: <div id="gdpr-consent-banner" class="visible">
```

**Si ves `null`:**
→ El DOM no está listo o hay un problema con los IDs.

---

### Paso 3: Verificar listeners

```javascript
console.log('5. Script de GDPR Banner cargado?', typeof window.guidersShowPreferences);
```

**Resultado esperado:**
```
5. Script de GDPR Banner cargado? function
```

**Si ves `undefined`:**
→ El script del banner no se ejecutó.

---

### Paso 4: Test manual del clic

```javascript
// Simular clic programáticamente
const btn = document.getElementById('gdpr-accept-all');
if (btn) {
  console.log('6. Ejecutando clic manual...');
  btn.click();
} else {
  console.error('6. ❌ Botón no encontrado');
}
```

**Si no pasa nada:**
→ El listener no está atado correctamente.

---

### Paso 5: Llamada directa al SDK

```javascript
// Bypass del banner, llamar directamente al SDK
console.log('7. Llamando directamente a grantConsent...');
if (window.guiders) {
  window.guiders.grantConsent();
  console.log('✅ grantConsent() ejecutado');
} else {
  console.error('❌ window.guiders no existe');
}
```

**Si funciona:**
→ El problema está en el banner, no en el SDK.

---

## 🧪 Script Completo de Debug

Copia y pega esto en la consola:

```javascript
(function debugGDPRBanner() {
  console.log('🐛 ========== DEBUG GDPR BANNER ==========');

  // 1. SDK
  console.log('1️⃣ SDK:', typeof window.guiders === 'object' ? '✅ Cargado' : '❌ NO cargado');
  if (window.guiders) {
    console.log('   Métodos:', Object.keys(window.guiders).join(', '));
  }

  // 2. Elementos DOM
  const banner = document.getElementById('gdpr-consent-banner');
  const btn = document.getElementById('gdpr-accept-all');
  console.log('2️⃣ Banner DOM:', banner ? '✅ Existe' : '❌ No existe');
  console.log('3️⃣ Botón DOM:', btn ? '✅ Existe' : '❌ No existe');

  // 3. Script del banner
  console.log('4️⃣ Script banner:', typeof window.guidersShowPreferences === 'function' ? '✅ Cargado' : '❌ NO cargado');

  // 4. Logs en consola
  console.log('5️⃣ Busca estos logs en consola:');
  console.log('   - "[GDPR Banner] 🔐 Sistema de consentimiento inicializado"');
  console.log('   - "[GDPR Banner] 📊 Estado de consentimiento: pending"');

  // 5. Estado actual
  if (window.guiders) {
    const status = window.guiders.getConsentStatus();
    console.log('6️⃣ Estado consentimiento:', status);
  }

  // 6. Test de clic manual
  console.log('\n🧪 TEST: Simulando clic en "Aceptar todas"...');
  if (btn && window.guiders) {
    // Añadir listener temporal para capturar el evento
    btn.addEventListener('click', function testListener() {
      console.log('   ✅ Click event captured!');
    }, { once: true });

    // Hacer clic
    btn.click();

    // Esperar 2 segundos y verificar
    setTimeout(() => {
      const newStatus = window.guiders.getConsentStatus();
      console.log('   Estado después del clic:', newStatus);

      if (newStatus === 'granted') {
        console.log('   ✅ ¡FUNCIONA! Consentimiento otorgado');
      } else {
        console.error('   ❌ NO FUNCIONÓ. Estado sigue siendo:', newStatus);
      }
    }, 2000);
  } else {
    console.error('   ❌ No se puede testear: falta botón o SDK');
  }

  console.log('\n📋 Resumen:');
  console.log('   SDK:', window.guiders ? '✅' : '❌');
  console.log('   Banner:', banner ? '✅' : '❌');
  console.log('   Botón:', btn ? '✅' : '❌');
  console.log('   Script:', typeof window.guidersShowPreferences === 'function' ? '✅' : '❌');
  console.log('========================================');
})();
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: `window.guiders` es `undefined`

**Causa**: El SDK no se está cargando.

**Solución**:

1. Verifica que el script existe:
   ```bash
   ls -lh demo/app/public/sdk/guiders-sdk.js
   ```

2. Verifica la ruta en el HTML:
   ```html
   <!-- demo/app/partials/header.php línea 48 -->
   <script src="/guiders-sdk.js?dev=true" data-api-key="..."></script>
   ```

3. Abre Network tab → Busca `guiders-sdk.js` → ¿Status 200 o 404?

4. Si es 404, el problema es la ruta. Cambia:
   ```html
   <script src="/sdk/guiders-sdk.js?dev=true" ...></script>
   ```

---

### Problema 2: Error `Cannot read property 'grantConsent' of undefined`

**Causa**: El SDK se carga DESPUÉS del banner.

**Solución**: El banner ya tiene `waitForGuiders()` que debería solucionar esto. Verifica que el timeout no se está cumpliendo:

```javascript
// Busca este log en consola:
[GDPR Banner] ❌ Guiders SDK no disponible después de 5 segundos
```

Si ves ese error, aumenta el timeout en el banner:

```javascript
// gdpr-banner.php línea 531
function waitForGuiders(callback, timeout = 10000) { // ← Cambiar de 5000 a 10000
```

---

### Problema 3: El clic no hace nada (silencioso)

**Causa**: Error JavaScript anterior bloqueando ejecución.

**Solución**: Busca errores en Console:

```
Uncaught TypeError: ...
Uncaught ReferenceError: ...
```

Comparte el error conmigo para solucionarlo.

---

### Problema 4: El banner no aparece

**Causa**: El estado en localStorage ya es 'granted' o 'denied'.

**Solución**:

```javascript
localStorage.clear();
location.reload();
```

---

## 📞 Siguiente Paso

**Ejecuta el script completo de debug** (el grande) y comparte la salida completa conmigo.

Buscaré específicamente:
- ✅ o ❌ para cada check
- Cualquier error en rojo
- El resultado del test de clic

Con esa información podré decirte exactamente dónde está el problema.
