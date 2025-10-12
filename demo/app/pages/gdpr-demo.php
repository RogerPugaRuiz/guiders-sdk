<?php require_once __DIR__ . '/../partials/header.php'; ?>

<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  .demo-header {
    text-align: center;
    color: white;
    margin-bottom: 40px;
  }

  .demo-header h1 {
    font-size: 3rem;
    margin: 0 0 20px 0;
    font-weight: 700;
  }

  .demo-header p {
    font-size: 1.2rem;
    opacity: 0.95;
    max-width: 600px;
    margin: 0 auto;
  }

  .demo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
  }

  .demo-card {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .demo-card h2 {
    margin: 0 0 20px 0;
    color: #667eea;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .demo-card h2 span {
    font-size: 1.8rem;
  }

  .demo-card p {
    color: #666;
    line-height: 1.6;
    margin: 0 0 20px 0;
  }

  .demo-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .demo-btn {
    padding: 14px 20px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .demo-btn-primary {
    background: #667eea;
    color: white;
  }

  .demo-btn-primary:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .demo-btn-secondary {
    background: #f0f0f0;
    color: #333;
  }

  .demo-btn-secondary:hover {
    background: #e0e0e0;
  }

  .demo-btn-danger {
    background: #ef4444;
    color: white;
  }

  .demo-btn-danger:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .demo-btn-success {
    background: #10b981;
    color: white;
  }

  .demo-btn-success:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .status-box {
    background: #f9f9ff;
    border: 2px solid #667eea;
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
  }

  .status-box h3 {
    margin: 0 0 10px 0;
    color: #667eea;
    font-size: 1.1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;
  }

  .status-item:last-child {
    border-bottom: none;
  }

  .status-label {
    font-weight: 600;
    color: #333;
  }

  .status-value {
    font-family: 'Monaco', 'Courier New', monospace;
    color: #667eea;
    background: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .status-badge.granted {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.denied {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-badge.pending {
    background: #fef3c7;
    color: #92400e;
  }

  .code-block {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-top: 15px;
  }

  .code-block .comment {
    color: #6a9955;
  }

  .code-block .function {
    color: #dcdcaa;
  }

  .code-block .string {
    color: #ce9178;
  }

  .info-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin-top: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .info-section h2 {
    color: #667eea;
    margin: 0 0 20px 0;
  }

  .info-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .info-section li {
    padding: 12px 0;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .info-section li:last-child {
    border-bottom: none;
  }

  .info-section li span {
    font-size: 1.3rem;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .demo-header h1 {
      font-size: 2rem;
    }

    .demo-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="demo-container">
  <div class="demo-header">
    <h1>🔐 Demo GDPR / LOPDGDD</h1>
    <p>
      Prueba el sistema de consentimiento integrado con el Guiders SDK.
      Gestión completa de cookies conforme a la normativa europea.
    </p>
  </div>

  <div class="demo-grid">
    <!-- Control de Consentimiento -->
    <div class="demo-card">
      <h2><span>✅</span>Control de Consentimiento</h2>
      <p>
        Gestiona el estado de consentimiento del usuario. Estas acciones
        se sincronizan automáticamente con el backend GDPR.
      </p>
      <div class="demo-actions">
        <button class="demo-btn demo-btn-success" onclick="grantFullConsent()">
          ✅ Otorgar Consentimiento Completo
        </button>
        <button class="demo-btn demo-btn-secondary" onclick="showPreferences()">
          ⚙️ Abrir Preferencias
        </button>
        <button class="demo-btn demo-btn-danger" onclick="revokeConsent()">
          ❌ Revocar Consentimiento
        </button>
      </div>
      <div class="code-block">
<span class="comment">// Ejemplo de código</span>
window.guiders.<span class="function">grantConsent</span>();
window.guiders.<span class="function">revokeConsent</span>();
      </div>
    </div>

    <!-- Estado Actual -->
    <div class="demo-card">
      <h2><span>📊</span>Estado Actual</h2>
      <p>
        Visualiza el estado de consentimiento en tiempo real y las
        categorías activas.
      </p>
      <div class="demo-actions">
        <button class="demo-btn demo-btn-primary" onclick="updateStatus()">
          🔄 Actualizar Estado
        </button>
      </div>
      <div class="status-box" id="status-display">
        <h3>Estado de Consentimiento</h3>
        <div class="status-item">
          <span class="status-label">Estado:</span>
          <span class="status-badge pending" id="consent-status">Cargando...</span>
        </div>
        <div class="status-item">
          <span class="status-label">Analytics:</span>
          <span class="status-value" id="analytics-status">-</span>
        </div>
        <div class="status-item">
          <span class="status-label">Funcionales:</span>
          <span class="status-value" id="functional-status">-</span>
        </div>
        <div class="status-item">
          <span class="status-label">Personalización:</span>
          <span class="status-value" id="personalization-status">-</span>
        </div>
      </div>
    </div>

    <!-- Derechos GDPR -->
    <div class="demo-card">
      <h2><span>📦</span>Derechos del Usuario</h2>
      <p>
        Implementación de los derechos GDPR: Derecho de Acceso (Art. 15) y
        Derecho al Olvido (Art. 17).
      </p>
      <div class="demo-actions">
        <button class="demo-btn demo-btn-primary" onclick="exportData()">
          📥 Exportar Mis Datos
        </button>
        <button class="demo-btn demo-btn-danger" onclick="deleteData()">
          🗑️ Eliminar Mis Datos
        </button>
      </div>
      <div class="code-block">
<span class="comment">// Exportar datos del visitante</span>
<span class="function">const</span> data = <span class="function">await</span> window.guiders.<span class="function">exportVisitorData</span>();

<span class="comment">// Eliminar todos los datos</span>
<span class="function">await</span> window.guiders.<span class="function">deleteVisitorData</span>();
      </div>
    </div>

    <!-- Preferencias Granulares -->
    <div class="demo-card">
      <h2><span>🎯</span>Preferencias Granulares</h2>
      <p>
        Otorga consentimientos específicos por categoría según las
        preferencias del usuario.
      </p>
      <div class="demo-actions">
        <button class="demo-btn demo-btn-secondary" onclick="grantAnalyticsOnly()">
          📊 Solo Analytics
        </button>
        <button class="demo-btn demo-btn-secondary" onclick="grantFunctionalOnly()">
          🔧 Solo Funcionales
        </button>
        <button class="demo-btn demo-btn-secondary" onclick="grantCustom()">
          🎨 Configuración Personalizada
        </button>
      </div>
      <div class="code-block">
<span class="comment">// Consentimiento granular</span>
window.guiders.<span class="function">grantConsentWithPreferences</span>({
  <span class="string">analytics</span>: <span class="function">true</span>,
  <span class="string">functional</span>: <span class="function">true</span>,
  <span class="string">personalization</span>: <span class="function">false</span>
});
      </div>
    </div>
  </div>

  <!-- Información adicional -->
  <div class="info-section">
    <h2>📚 Información sobre el Sistema GDPR</h2>
    <ul>
      <li>
        <span>🔐</span>
        <div>
          <strong>Sincronización Automática:</strong> Todos los cambios de consentimiento
          se sincronizan automáticamente con el backend GDPR cuando el visitante está identificado.
        </div>
      </li>
      <li>
        <span>💾</span>
        <div>
          <strong>Persistencia Local:</strong> El estado de consentimiento se guarda en
          localStorage para mantener las preferencias entre sesiones.
        </div>
      </li>
      <li>
        <span>🎯</span>
        <div>
          <strong>Categorías de Datos:</strong> Analytics (tracking de eventos), Funcionales
          (chat y sesión), Personalización (preferencias de usuario).
        </div>
      </li>
      <li>
        <span>⚖️</span>
        <div>
          <strong>Cumplimiento Legal:</strong> Implementa los principios de GDPR, LOPDGDD y LSSI
          con consentimiento explícito, granular y revocable.
        </div>
      </li>
      <li>
        <span>🔄</span>
        <div>
          <strong>Mapeo Backend:</strong> SDK categories (analytics, functional, personalization)
          se mapean a backend types (analytics, privacy_policy, marketing).
        </div>
      </li>
    </ul>
  </div>
</div>

<script>
  // Esperar a que el SDK esté disponible
  function waitForGuiders(callback) {
    if (window.guiders) {
      callback();
    } else {
      setTimeout(() => waitForGuiders(callback), 100);
    }
  }

  // Otorgar consentimiento completo
  function grantFullConsent() {
    waitForGuiders(() => {
      window.guiders.grantConsent();
      console.log('[GDPR Demo] ✅ Consentimiento completo otorgado');
      setTimeout(updateStatus, 500);
    });
  }

  // Revocar consentimiento
  function revokeConsent() {
    if (!confirm('¿Estás seguro de que quieres revocar todos los consentimientos?')) {
      return;
    }
    waitForGuiders(() => {
      window.guiders.revokeConsent();
      console.log('[GDPR Demo] ❌ Consentimiento revocado');
      setTimeout(updateStatus, 500);
    });
  }

  // Mostrar preferencias
  function showPreferences() {
    if (window.guidersShowPreferences) {
      window.guidersShowPreferences();
    } else {
      alert('El modal de preferencias no está disponible. Asegúrate de que el banner GDPR esté incluido.');
    }
  }

  // Solo analytics
  function grantAnalyticsOnly() {
    waitForGuiders(() => {
      window.guiders.grantConsentWithPreferences({
        analytics: true,
        functional: true,
        personalization: false
      });
      console.log('[GDPR Demo] 📊 Solo analytics otorgado');
      setTimeout(updateStatus, 500);
    });
  }

  // Solo funcionales
  function grantFunctionalOnly() {
    waitForGuiders(() => {
      window.guiders.grantConsentWithPreferences({
        analytics: false,
        functional: true,
        personalization: false
      });
      console.log('[GDPR Demo] 🔧 Solo funcionales otorgado');
      setTimeout(updateStatus, 500);
    });
  }

  // Configuración personalizada
  function grantCustom() {
    waitForGuiders(() => {
      window.guiders.grantConsentWithPreferences({
        analytics: true,
        functional: true,
        personalization: true
      });
      console.log('[GDPR Demo] 🎨 Configuración personalizada aplicada');
      setTimeout(updateStatus, 500);
    });
  }

  // Actualizar estado
  function updateStatus() {
    waitForGuiders(() => {
      const state = window.guiders.getConsentState();
      const status = window.guiders.getConsentStatus();

      console.log('[GDPR Demo] 📊 Estado actual:', state);

      // Actualizar estado general
      const statusBadge = document.getElementById('consent-status');
      statusBadge.textContent = status.toUpperCase();
      statusBadge.className = 'status-badge ' + status;

      // Actualizar categorías
      if (state.preferences) {
        document.getElementById('analytics-status').textContent =
          state.preferences.analytics ? '✅ Permitido' : '❌ Bloqueado';
        document.getElementById('functional-status').textContent =
          state.preferences.functional ? '✅ Permitido' : '❌ Bloqueado';
        document.getElementById('personalization-status').textContent =
          state.preferences.personalization ? '✅ Permitido' : '❌ Bloqueado';
      } else {
        document.getElementById('analytics-status').textContent = '-';
        document.getElementById('functional-status').textContent = '-';
        document.getElementById('personalization-status').textContent = '-';
      }
    });
  }

  // Exportar datos
  async function exportData() {
    try {
      const data = await window.guiders.exportVisitorData();
      console.log('[GDPR Demo] 📦 Datos exportados:', data);

      // Crear blob y descargar
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guiders-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Datos exportados exitosamente. El archivo se ha descargado.');
    } catch (error) {
      console.error('[GDPR Demo] ❌ Error exportando datos:', error);
      alert('❌ Error exportando datos: ' + error.message);
    }
  }

  // Eliminar datos
  async function deleteData() {
    if (!confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS tus datos de forma permanente.\n\n¿Estás seguro de que quieres continuar?')) {
      return;
    }

    if (!confirm('Esta acción NO se puede deshacer. ¿Confirmas la eliminación?')) {
      return;
    }

    try {
      await window.guiders.deleteVisitorData();
      console.log('[GDPR Demo] 🗑️ Datos eliminados exitosamente');
      alert('✅ Todos tus datos han sido eliminados.\n\nLa página se recargará.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('[GDPR Demo] ❌ Error eliminando datos:', error);
      alert('❌ Error eliminando datos: ' + error.message);
    }
  }

  // Actualizar estado al cargar
  waitForGuiders(() => {
    updateStatus();
    console.log('[GDPR Demo] 🚀 Demo GDPR inicializada');
  });

  // Actualizar estado cada 2 segundos
  setInterval(updateStatus, 2000);
</script>

<?php require_once __DIR__ . '/../partials/footer.php'; ?>
