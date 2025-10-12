<?php require_once __DIR__ . '/../partials/header.php'; ?>

<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: #f5f5f5;
    min-height: 100vh;
  }

  .policy-container {
    max-width: 900px;
    margin: 40px auto;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .policy-header {
    border-bottom: 3px solid #667eea;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }

  .policy-header h1 {
    color: #667eea;
    margin: 0 0 10px 0;
    font-size: 2.5rem;
  }

  .policy-header .last-updated {
    color: #666;
    font-size: 0.9rem;
  }

  .policy-section {
    margin-bottom: 30px;
  }

  .policy-section h2 {
    color: #333;
    font-size: 1.5rem;
    margin: 30px 0 15px 0;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
  }

  .policy-section h3 {
    color: #555;
    font-size: 1.2rem;
    margin: 20px 0 10px 0;
  }

  .policy-section p {
    color: #666;
    line-height: 1.8;
    margin: 10px 0;
  }

  .policy-section ul, .policy-section ol {
    color: #666;
    line-height: 1.8;
    margin: 15px 0;
    padding-left: 30px;
  }

  .policy-section li {
    margin: 8px 0;
  }

  .info-box {
    background: #f9f9ff;
    border-left: 4px solid #667eea;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .info-box strong {
    color: #667eea;
  }

  .cookie-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 0.9rem;
  }

  .cookie-table th {
    background: #667eea;
    color: white;
    padding: 12px;
    text-align: left;
    font-weight: 600;
  }

  .cookie-table td {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
  }

  .cookie-table tr:hover {
    background: #f9f9ff;
  }

  .contact-box {
    background: #f0f0f0;
    border-radius: 8px;
    padding: 20px;
    margin: 30px 0;
  }

  .contact-box h3 {
    margin-top: 0;
    color: #667eea;
  }

  .back-link {
    display: inline-block;
    margin-top: 30px;
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
  }

  .back-link:hover {
    text-decoration: underline;
  }
</style>

<div class="policy-container">
  <div class="policy-header">
    <h1>🍪 Política de Cookies</h1>
    <p class="last-updated">
      <strong>Última actualización:</strong> Octubre 2024 |
      <strong>Versión:</strong> 1.0
    </p>
  </div>

  <div class="info-box">
    <strong>Nota importante:</strong> Esta es una plantilla de ejemplo. Debes personalizarla con los datos reales de tu empresa antes de publicarla. Consulta con un asesor legal para asegurar el cumplimiento con GDPR, LOPDGDD y LSSI.
  </div>

  <div class="policy-section">
    <h2>1. Responsable del Tratamiento</h2>
    <p>
      <strong>Razón Social:</strong> [Tu Empresa S.L.]<br>
      <strong>NIF:</strong> [B-XXXXXXXX]<br>
      <strong>Domicilio:</strong> [Calle XXX, CP, Ciudad, País]<br>
      <strong>Email:</strong> privacy@tuempresa.com<br>
      <strong>Teléfono:</strong> [+34 XXX XXX XXX]<br>
      <strong>Delegado de Protección de Datos (DPO):</strong> dpo@tuempresa.com <em>(si aplica)</em>
    </p>
  </div>

  <div class="policy-section">
    <h2>2. ¿Qué son las Cookies?</h2>
    <p>
      Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web.
      También utilizamos tecnologías similares como localStorage y sessionStorage.
    </p>
    <p>
      Estas tecnologías nos permiten:
    </p>
    <ul>
      <li>Recordar tus preferencias y configuración</li>
      <li>Proporcionar funcionalidades esenciales como el chat en vivo</li>
      <li>Entender cómo usas nuestro sitio web</li>
      <li>Mejorar tu experiencia de usuario</li>
    </ul>
  </div>

  <div class="policy-section">
    <h2>3. Tipos de Cookies que Utilizamos</h2>

    <h3>3.1. Cookies Técnicas o Necesarias</h3>
    <p>
      <strong>Base legal:</strong> Art. 6.1.b GDPR (ejecución del contrato) y Art. 22.2 LSSI (excepción de consentimiento para cookies técnicas).
    </p>
    <p>
      Estas cookies son esenciales para el funcionamiento básico del sitio web y no requieren tu consentimiento.
    </p>

    <table class="cookie-table">
      <thead>
        <tr>
          <th>Cookie</th>
          <th>Propósito</th>
          <th>Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>guiders_consent_state</td>
          <td>Almacenar tu decisión sobre cookies</td>
          <td>Persistente (24 meses)</td>
        </tr>
        <tr>
          <td>guiders_backend_session_id</td>
          <td>Identificar tu sesión de chat</td>
          <td>Sesión</td>
        </tr>
        <tr>
          <td>visitorId</td>
          <td>Identificar tu dispositivo para el chat</td>
          <td>Persistente (24 meses)</td>
        </tr>
      </tbody>
    </table>

    <h3>3.2. Cookies de Análisis</h3>
    <p>
      <strong>Base legal:</strong> Art. 6.1.a GDPR (consentimiento del usuario) y Art. 22.2 LSSI (consentimiento obligatorio).
    </p>
    <p>
      Nos ayudan a entender cómo interactúas con nuestro sitio web. Estas cookies <strong>requieren tu consentimiento</strong>.
    </p>

    <table class="cookie-table">
      <thead>
        <tr>
          <th>Cookie</th>
          <th>Propósito</th>
          <th>Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>guiders_analytics_events</td>
          <td>Rastrear eventos personalizados</td>
          <td>Sesión</td>
        </tr>
        <tr>
          <td>guiders_page_views</td>
          <td>Contar páginas visitadas</td>
          <td>Persistente (24 meses)</td>
        </tr>
      </tbody>
    </table>

    <p><strong>Datos recopilados:</strong></p>
    <ul>
      <li>Páginas visitadas y tiempo en cada página</li>
      <li>Clicks en elementos de la página</li>
      <li>Interacciones con el chat</li>
      <li>Eventos personalizados (ej: "usuario completó formulario")</li>
    </ul>

    <h3>3.3. Cookies de Personalización</h3>
    <p>
      <strong>Base legal:</strong> Art. 6.1.a GDPR (consentimiento del usuario) y Art. 22.2 LSSI (consentimiento obligatorio).
    </p>
    <p>
      Permiten recordar tus preferencias y personalizar tu experiencia. Estas cookies <strong>requieren tu consentimiento</strong>.
    </p>

    <table class="cookie-table">
      <thead>
        <tr>
          <th>Cookie</th>
          <th>Propósito</th>
          <th>Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>guiders_preferences</td>
          <td>Recordar configuración del chat</td>
          <td>Persistente (24 meses)</td>
        </tr>
        <tr>
          <td>guiders_recent_chats</td>
          <td>Historial de conversaciones</td>
          <td>Persistente (24 meses)</td>
        </tr>
      </tbody>
    </table>

    <p><strong>Datos recopilados:</strong></p>
    <ul>
      <li>Idioma preferido</li>
      <li>Configuración del chat (notificaciones, sonidos)</li>
      <li>Historial de mensajes</li>
    </ul>
  </div>

  <div class="policy-section">
    <h2>4. Plazo de Conservación</h2>
    <p>
      Los datos recopilados a través de cookies se conservan durante:
    </p>
    <ul>
      <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
      <li><strong>Cookies persistentes:</strong> Máximo 24 meses desde la última interacción</li>
      <li><strong>Datos de chat:</strong> 24 meses desde el último mensaje</li>
    </ul>
    <p>
      Puedes eliminar tus datos en cualquier momento desde la página de <a href="/gdpr-demo">Gestión GDPR</a>.
    </p>
  </div>

  <div class="policy-section">
    <h2>5. Tus Derechos</h2>
    <p>
      De acuerdo con el GDPR y la LOPDGDD, tienes derecho a:
    </p>
    <ul>
      <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre ti</li>
      <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
      <li><strong>Supresión:</strong> Eliminar tus datos ("Derecho al olvido")</li>
      <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
      <li><strong>Limitación:</strong> Restringir el tratamiento de tus datos</li>
      <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos</li>
      <li><strong>Revocación del consentimiento:</strong> Retirar tu consentimiento en cualquier momento</li>
    </ul>

    <p>
      Puedes ejercer estos derechos:
    </p>
    <ul>
      <li>Enviando un email a: <strong>privacy@tuempresa.com</strong></li>
      <li>Usando nuestra página de <a href="/gdpr-demo">Gestión GDPR</a></li>
      <li>Por correo postal a: [Dirección completa]</li>
    </ul>
  </div>

  <div class="policy-section">
    <h2>6. Gestión de Cookies</h2>

    <h3>6.1. Panel de Preferencias</h3>
    <p>
      Puedes gestionar tus preferencias de cookies en cualquier momento desde nuestro panel de configuración:
    </p>
    <p>
      <button onclick="window.guidersShowPreferences()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
        ⚙️ Gestionar Preferencias de Cookies
      </button>
    </p>

    <h3>6.2. Configuración del Navegador</h3>
    <p>
      También puedes gestionar las cookies desde la configuración de tu navegador:
    </p>
    <ul>
      <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
      <li><strong>Firefox:</strong> Opciones → Privacidad y Seguridad → Cookies</li>
      <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
      <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
    </ul>

    <div class="info-box">
      <strong>Nota:</strong> Si desactivas las cookies técnicas, algunas funcionalidades del sitio (como el chat en vivo) pueden no funcionar correctamente.
    </div>
  </div>

  <div class="policy-section">
    <h2>7. Transferencias Internacionales</h2>
    <p>
      Los datos recopilados a través de cookies se almacenan en servidores ubicados en:
    </p>
    <ul>
      <li><strong>Unión Europea:</strong> [Especificar país]</li>
      <li><strong>Garantías aplicadas:</strong> Cláusulas contractuales tipo de la Comisión Europea</li>
    </ul>
    <p>
      <em>Nota: Si usas servicios fuera de la UE (ej: AWS US, Google Analytics), debes especificarlo aquí con las garantías aplicadas.</em>
    </p>
  </div>

  <div class="policy-section">
    <h2>8. Seguridad</h2>
    <p>
      Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos:
    </p>
    <ul>
      <li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
      <li>Acceso restringido a datos personales</li>
      <li>Auditorías regulares de seguridad</li>
      <li>Procedimientos de respuesta a incidentes</li>
    </ul>
  </div>

  <div class="policy-section">
    <h2>9. Reclamaciones</h2>
    <p>
      Si consideras que tus derechos no han sido atendidos correctamente, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD):
    </p>
    <p>
      <strong>Agencia Española de Protección de Datos (AEPD)</strong><br>
      C/ Jorge Juan, 6<br>
      28001 Madrid<br>
      Teléfono: 901 100 099 / 912 663 517<br>
      Web: <a href="https://www.aepd.es" target="_blank">www.aepd.es</a>
    </p>
  </div>

  <div class="policy-section">
    <h2>10. Actualizaciones de esta Política</h2>
    <p>
      Podemos actualizar esta Política de Cookies para reflejar cambios en nuestras prácticas o requisitos legales.
    </p>
    <p>
      <strong>Última actualización:</strong> Octubre 2024<br>
      <strong>Versión:</strong> 1.0
    </p>
    <p>
      Te notificaremos de cualquier cambio sustancial mediante:
    </p>
    <ul>
      <li>Banner en el sitio web</li>
      <li>Email (si tienes cuenta)</li>
      <li>Actualización de la fecha "Última actualización"</li>
    </ul>
  </div>

  <div class="contact-box">
    <h3>📞 Contacto</h3>
    <p>
      Si tienes preguntas sobre esta Política de Cookies o sobre cómo tratamos tus datos, puedes contactarnos:
    </p>
    <ul>
      <li><strong>Email:</strong> privacy@tuempresa.com</li>
      <li><strong>Teléfono:</strong> [+34 XXX XXX XXX]</li>
      <li><strong>Dirección:</strong> [Calle XXX, CP, Ciudad, País]</li>
      <li><strong>DPO:</strong> dpo@tuempresa.com <em>(si aplica)</em></li>
    </ul>
  </div>

  <a href="/" class="back-link">← Volver al inicio</a>
</div>

<script>
  // Verificar si la función de preferencias está disponible
  if (!window.guidersShowPreferences) {
    console.warn('El panel de preferencias no está disponible. Asegúrate de incluir el banner GDPR.');
  }
</script>

<?php require_once __DIR__ . '/../partials/footer.php'; ?>
