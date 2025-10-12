<!-- partials/gdpr-banner.php -->
<style>
/* Estilos para el banner de consentimiento GDPR */
#gdpr-consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 999998;
  display: none;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

#gdpr-consent-banner.visible {
  display: block;
}

.gdpr-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gdpr-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: wrap;
}

.gdpr-text {
  flex: 1;
  min-width: 300px;
}

.gdpr-text h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.gdpr-text p {
  margin: 0;
  opacity: 0.95;
  line-height: 1.6;
}

.gdpr-text a {
  color: white;
  text-decoration: underline;
  font-weight: 500;
}

.gdpr-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.gdpr-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.gdpr-btn-accept {
  background: white;
  color: #667eea;
}

.gdpr-btn-accept:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.gdpr-btn-reject {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.gdpr-btn-reject:hover {
  background: rgba(255, 255, 255, 0.3);
}

.gdpr-btn-settings {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.gdpr-btn-settings:hover {
  border-color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Modal de preferencias */
#gdpr-preferences-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999999;
  display: none;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

#gdpr-preferences-modal.visible {
  display: flex;
}

.gdpr-modal-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: #333;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.gdpr-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.gdpr-modal-header h3 {
  margin: 0;
  color: #667eea;
  font-size: 1.5rem;
}

.gdpr-modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.gdpr-modal-close:hover {
  background: #f0f0f0;
  color: #333;
}

.gdpr-preference-item {
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.2s ease;
}

.gdpr-preference-item:hover {
  border-color: #667eea;
  background: #f9f9ff;
}

.gdpr-preference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.gdpr-preference-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.gdpr-preference-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Toggle switch */
.gdpr-toggle {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 28px;
}

.gdpr-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.gdpr-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 28px;
}

.gdpr-toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.gdpr-toggle input:checked + .gdpr-toggle-slider {
  background-color: #667eea;
}

.gdpr-toggle input:checked + .gdpr-toggle-slider:before {
  transform: translateX(28px);
}

.gdpr-toggle input:disabled + .gdpr-toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.gdpr-required-badge {
  display: inline-block;
  background: #e0e0e0;
  color: #666;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 8px;
}

.gdpr-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.gdpr-modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gdpr-modal-btn-primary {
  background: #667eea;
  color: white;
}

.gdpr-modal-btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.gdpr-modal-btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.gdpr-modal-btn-secondary:hover {
  background: #e0e0e0;
}

/* Responsive */
@media (max-width: 768px) {
  #gdpr-consent-banner {
    padding: 20px 15px;
  }

  .gdpr-content {
    flex-direction: column;
    gap: 20px;
  }

  .gdpr-text {
    min-width: 100%;
  }

  .gdpr-actions {
    width: 100%;
    justify-content: stretch;
  }

  .gdpr-btn {
    flex: 1;
    text-align: center;
  }

  .gdpr-modal-content {
    padding: 20px;
    width: 95%;
  }

  .gdpr-modal-actions {
    flex-direction: column;
  }

  .gdpr-modal-btn {
    width: 100%;
  }
}
</style>

<!-- Banner de consentimiento -->
<div id="gdpr-consent-banner">
  <div class="gdpr-container">
    <div class="gdpr-content">
      <div class="gdpr-text">
        <h3>🍪 Utilizamos cookies</h3>
        <p>
          <strong>Responsable:</strong> [Tu Empresa] | <strong>Contacto:</strong> privacy@tuempresa.com
        </p>
        <p>
          Usamos cookies propias y de terceros para:
          <br>
          🔧 <strong>Chat en vivo</strong> (necesario para el servicio),
          📊 <strong>Análisis del sitio</strong> (mejorar tu experiencia),
          🎨 <strong>Personalización</strong> (recordar preferencias).
        </p>
        <p style="font-size: 0.9em; opacity: 0.95;">
          <strong>Tus derechos:</strong> Acceso, rectificación, supresión, portabilidad y limitación.
          Reclamar ante <a href="https://www.aepd.es" target="_blank" style="color: white;">AEPD</a>.
          <br>
          <strong>Conservación:</strong> 24 meses desde la última interacción.
          <a href="/politica-cookies" target="_blank" style="color: white; text-decoration: underline;">Más información</a>
        </p>
      </div>
      <div class="gdpr-actions">
        <button class="gdpr-btn gdpr-btn-accept" id="gdpr-accept-all">
          ✅ Aceptar todas
        </button>
        <button class="gdpr-btn gdpr-btn-reject" id="gdpr-reject-all">
          ❌ Rechazar
        </button>
        <button class="gdpr-btn gdpr-btn-settings" id="gdpr-open-settings">
          ⚙️ Preferencias
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Modal de preferencias -->
<div id="gdpr-preferences-modal">
  <div class="gdpr-modal-content">
    <div class="gdpr-modal-header">
      <h3>Preferencias de Cookies</h3>
      <button class="gdpr-modal-close" id="gdpr-close-modal">&times;</button>
    </div>

    <div class="gdpr-preferences-list">
      <!-- Cookies Funcionales (siempre requeridas) -->
      <div class="gdpr-preference-item">
        <div class="gdpr-preference-header">
          <div>
            <h4>
              Cookies Funcionales
              <span class="gdpr-required-badge">OBLIGATORIAS</span>
            </h4>
          </div>
          <label class="gdpr-toggle">
            <input type="checkbox" id="pref-functional" checked disabled>
            <span class="gdpr-toggle-slider"></span>
          </label>
        </div>
        <p class="gdpr-preference-description">
          <strong>Finalidad:</strong> Prestar el servicio de chat en vivo solicitado por el usuario.
          <br>
          <strong>Base legal:</strong> Ejecución del contrato (Art. 6.1.b GDPR).
          <br>
          <strong>Datos:</strong> Session ID, Visitor ID, estado de conexión.
          <br>
          <strong>Conservación:</strong> Durante la sesión y 24 meses para historial.
          <br>
          Estas cookies son técnicamente necesarias y no se pueden desactivar.
        </p>
      </div>

      <!-- Cookies de Análisis -->
      <div class="gdpr-preference-item">
        <div class="gdpr-preference-header">
          <h4>Cookies de Análisis</h4>
          <label class="gdpr-toggle">
            <input type="checkbox" id="pref-analytics">
            <span class="gdpr-toggle-slider"></span>
          </label>
        </div>
        <p class="gdpr-preference-description">
          <strong>Finalidad:</strong> Analizar el uso del sitio y mejorar la experiencia del usuario.
          <br>
          <strong>Base legal:</strong> Consentimiento del usuario (Art. 6.1.a GDPR).
          <br>
          <strong>Datos:</strong> Páginas visitadas, clics, tiempo de permanencia, eventos personalizados.
          <br>
          <strong>Conservación:</strong> 24 meses desde la recopilación.
          <br>
          Esta información es anónima y se usa exclusivamente para estadísticas.
        </p>
      </div>

      <!-- Cookies de Personalización -->
      <div class="gdpr-preference-item">
        <div class="gdpr-preference-header">
          <h4>Cookies de Personalización</h4>
          <label class="gdpr-toggle">
            <input type="checkbox" id="pref-personalization">
            <span class="gdpr-toggle-slider"></span>
          </label>
        </div>
        <p class="gdpr-preference-description">
          <strong>Finalidad:</strong> Recordar preferencias y personalizar la experiencia del usuario.
          <br>
          <strong>Base legal:</strong> Consentimiento del usuario (Art. 6.1.a GDPR).
          <br>
          <strong>Datos:</strong> Idioma preferido, configuración del chat, historial de mensajes.
          <br>
          <strong>Conservación:</strong> 24 meses desde la última actualización.
          <br>
          Permite ofrecer una experiencia adaptada a tus preferencias personales.
        </p>
      </div>
    </div>

    <div class="gdpr-modal-actions">
      <button class="gdpr-modal-btn gdpr-modal-btn-secondary" id="gdpr-save-preferences">
        Guardar Preferencias
      </button>
      <button class="gdpr-modal-btn gdpr-modal-btn-primary" id="gdpr-accept-selected">
        Aceptar Selección
      </button>
    </div>
  </div>
</div>

<script>
// Gestión del banner de consentimiento GDPR
(function() {
  'use strict';

  // Elementos del DOM
  const banner = document.getElementById('gdpr-consent-banner');
  const modal = document.getElementById('gdpr-preferences-modal');
  const acceptAllBtn = document.getElementById('gdpr-accept-all');
  const rejectAllBtn = document.getElementById('gdpr-reject-all');
  const openSettingsBtn = document.getElementById('gdpr-open-settings');
  const closeModalBtn = document.getElementById('gdpr-close-modal');
  const savePreferencesBtn = document.getElementById('gdpr-save-preferences');
  const acceptSelectedBtn = document.getElementById('gdpr-accept-selected');

  // Checkboxes de preferencias
  const prefFunctional = document.getElementById('pref-functional');
  const prefAnalytics = document.getElementById('pref-analytics');
  const prefPersonalization = document.getElementById('pref-personalization');

  // Verificar si el SDK está disponible
  function waitForGuiders(callback, timeout = 5000) {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.guiders) {
        clearInterval(interval);
        callback();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.error('[GDPR Banner] ❌ Guiders SDK no disponible después de 5 segundos');
      }
    }, 100);
  }

  // Mostrar banner si el consentimiento está pendiente
  function checkConsentStatus() {
    waitForGuiders(() => {
      const status = window.guiders.getConsentStatus();
      console.log('[GDPR Banner] 📊 Estado de consentimiento:', status);

      if (status === 'pending') {
        banner.classList.add('visible');
      }
    });
  }

  // Ocultar banner
  function hideBanner() {
    banner.classList.remove('visible');
  }

  // Mostrar modal de preferencias
  function showModal() {
    // Cargar el estado actual si existe
    waitForGuiders(() => {
      const state = window.guiders.getConsentState();
      if (state && state.preferences) {
        prefAnalytics.checked = state.preferences.analytics || false;
        prefPersonalization.checked = state.preferences.personalization || false;
      }
      modal.classList.add('visible');
    });
  }

  // Ocultar modal
  function hideModal() {
    modal.classList.remove('visible');
  }

  // Aceptar todas las cookies
  acceptAllBtn.addEventListener('click', () => {
    console.log('[GDPR Banner] ✅ Usuario aceptó todas las cookies');
    waitForGuiders(() => {
      window.guiders.grantConsent();
      hideBanner();
    });
  });

  // Rechazar todas las cookies (solo funcionales)
  rejectAllBtn.addEventListener('click', () => {
    console.log('[GDPR Banner] ❌ Usuario rechazó cookies opcionales');
    waitForGuiders(() => {
      window.guiders.denyConsent();
      hideBanner();
    });
  });

  // Abrir modal de preferencias
  openSettingsBtn.addEventListener('click', () => {
    console.log('[GDPR Banner] ⚙️ Abriendo preferencias');
    showModal();
  });

  // Cerrar modal
  closeModalBtn.addEventListener('click', hideModal);

  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Guardar preferencias (sin cerrar banner todavía)
  savePreferencesBtn.addEventListener('click', () => {
    const preferences = {
      analytics: prefAnalytics.checked,
      functional: true, // Siempre true
      personalization: prefPersonalization.checked
    };

    console.log('[GDPR Banner] 💾 Guardando preferencias:', preferences);

    waitForGuiders(() => {
      window.guiders.grantConsentWithPreferences(preferences);
      hideModal();
      hideBanner();
    });
  });

  // Aceptar selección actual
  acceptSelectedBtn.addEventListener('click', () => {
    const preferences = {
      analytics: prefAnalytics.checked,
      functional: true, // Siempre true
      personalization: prefPersonalization.checked
    };

    console.log('[GDPR Banner] ✅ Aceptando selección:', preferences);

    waitForGuiders(() => {
      window.guiders.grantConsentWithPreferences(preferences);
      hideModal();
      hideBanner();
    });
  });

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkConsentStatus);
  } else {
    checkConsentStatus();
  }

  // Exponer función para reabrir el modal desde consola o botón
  window.guidersShowPreferences = showModal;

  console.log('[GDPR Banner] 🔐 Sistema de consentimiento inicializado');
  console.log('[GDPR Banner] 💡 Para reabrir preferencias: window.guidersShowPreferences()');
})();
</script>
