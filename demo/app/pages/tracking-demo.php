<?php require '../partials/header.php'; ?>

<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
    min-height: 100vh;
  }

  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .demo-header {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }

  .demo-header h1 {
    margin: 0 0 10px 0;
    color: #667eea;
    font-size: 2.5rem;
  }

  .demo-header p {
    margin: 0;
    color: #666;
    font-size: 1.1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }

  .card h2 {
    margin: 0 0 20px 0;
    color: #667eea;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }

  .stat-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }

  .stat-label {
    font-size: 0.85rem;
    opacity: 0.9;
    margin-bottom: 5px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  .button:active {
    transform: translateY(0);
  }

  .button.secondary {
    background: #e0e0e0;
    color: #333;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .button.secondary:hover {
    background: #d0d0d0;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .interactive-area {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
    position: relative;
    overflow: hidden;
  }

  .interactive-area:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
  }

  .interactive-area::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .interactive-area:active::before {
    width: 300px;
    height: 300px;
  }

  .log-container {
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 8px;
    padding: 15px;
    max-height: 300px;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    margin-top: 15px;
  }

  .log-entry {
    padding: 5px 0;
    border-bottom: 1px solid #333;
  }

  .log-entry:last-child {
    border-bottom: none;
  }

  .log-time {
    color: #858585;
    margin-right: 10px;
  }

  .log-throttled {
    color: #f48771;
  }

  .log-aggregated {
    color: #4ec9b0;
  }

  .log-tracked {
    color: #9cdcfe;
  }

  .toggle-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 10px;
  }

  .toggle-switch label {
    font-weight: 600;
    color: #333;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 28px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 28px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #667eea;
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }

  .info-banner {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    color: #856404;
  }

  .info-banner strong {
    display: block;
    margin-bottom: 5px;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .recording {
    animation: pulse 1.5s infinite;
  }
</style>

<div class="demo-container">
  <div class="demo-header">
    <h1>🎯 Tracking V2 - Demo Interactivo</h1>
    <p>Visualiza en tiempo real cómo funcionan el throttling y la agregación de eventos</p>
  </div>

  <div class="info-banner">
    <strong>💡 Cómo funciona:</strong>
    El sistema captura tus interacciones, pero antes de enviarlas al servidor:
    <br>• <strong>Throttling</strong> limita la frecuencia (ej: max 10 scroll/segundo)
    <br>• <strong>Agregación</strong> consolida eventos similares en ventanas de 1 segundo
    <br>• Resultado: ~80-95% menos tráfico de red manteniendo información valiosa
  </div>

  <div class="grid">
    <!-- Estadísticas en Tiempo Real -->
    <div class="card">
      <h2>📊 Estadísticas en Tiempo Real</h2>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Eventos Capturados</div>
          <div class="stat-value" id="stat-captured">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Throttled</div>
          <div class="stat-value" id="stat-throttled">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Agregados</div>
          <div class="stat-value" id="stat-aggregated">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Enviados al Servidor</div>
          <div class="stat-value" id="stat-sent">0</div>
        </div>
      </div>
      <div class="stat-box" style="grid-column: 1 / -1;">
        <div class="stat-label">Reducción de Tráfico</div>
        <div class="stat-value" id="stat-reduction">0%</div>
      </div>
    </div>

    <!-- Controles -->
    <div class="card">
      <h2>⚙️ Controles</h2>

      <div class="toggle-switch">
        <label>Throttling Habilitado</label>
        <label class="switch">
          <input type="checkbox" id="toggle-throttling" checked>
          <span class="slider"></span>
        </label>
      </div>

      <div class="toggle-switch">
        <label>Agregación Habilitada</label>
        <label class="switch">
          <input type="checkbox" id="toggle-aggregation" checked>
          <span class="slider"></span>
        </label>
      </div>

      <div class="controls">
        <button class="button" onclick="generateScrollEvents()">
          📜 Generar 50 Eventos SCROLL
        </button>
        <button class="button" onclick="generateMouseEvents()">
          🖱️ Generar 50 Eventos MOUSE_MOVE
        </button>
        <button class="button" onclick="generateMixedEvents()">
          🎲 Generar Eventos Mixtos (100)
        </button>
        <button class="button secondary" onclick="clearStats()">
          🗑️ Limpiar Estadísticas
        </button>
      </div>
    </div>
  </div>

  <!-- Área Interactiva -->
  <div class="card">
    <h2>🎮 Área Interactiva</h2>
    <div class="interactive-area" id="interactive-area">
      <h3>Mueve el mouse aquí o haz scroll en esta página</h3>
      <p>Todos los eventos se capturan y procesan automáticamente</p>
      <p style="margin-top: 20px; font-size: 0.9rem;">
        Intenta hacer scroll rápido o mover el mouse rápidamente para ver el throttling en acción
      </p>
    </div>
  </div>

  <!-- Log de Eventos -->
  <div class="card">
    <h2>📝 Log de Eventos</h2>
    <div class="log-container" id="event-log">
      <div class="log-entry">
        <span class="log-time">[Esperando eventos...]</span>
      </div>
    </div>
  </div>
</div>

<script>
  // Estadísticas globales
  let stats = {
    captured: 0,
    throttled: 0,
    aggregated: 0,
    sent: 0
  };

  // Referencias a los elementos del SDK
  let throttler = null;
  let aggregator = null;
  let sdk = null;

  // Esperar a que el SDK esté listo
  window.addEventListener('load', function() {
    setTimeout(() => {
      sdk = window.guiders?.trackingPixelSDK;
      if (sdk) {
        // Acceder a las instancias internas (esto es para el demo, no para producción)
        throttler = sdk.eventThrottler;
        aggregator = sdk.eventAggregator;

        addLog('✅ SDK Tracking V2 inicializado correctamente', 'tracked');
        addLog(`⚙️ Throttling: ${throttler?.isEnabled() ? 'Habilitado' : 'Deshabilitado'}`, 'tracked');
        addLog(`⚙️ Agregación: ${aggregator?.isEnabled() ? 'Habilitada' : 'Deshabilitada'}`, 'tracked');
      } else {
        addLog('❌ Error: SDK no encontrado', 'throttled');
      }
    }, 1000);
  });

  // Interceptar eventos para mostrar estadísticas
  const originalTrackEvent = window.guiders?.trackingPixelSDK?.trackEvent;
  if (window.guiders?.trackingPixelSDK) {
    window.guiders.trackingPixelSDK.trackEvent = function(...args) {
      stats.captured++;
      updateStats();
      return originalTrackEvent?.apply(this, args);
    };
  }

  // Generar eventos de scroll
  function generateScrollEvents() {
    const scrollCount = 50;
    let generated = 0;

    const interval = setInterval(() => {
      if (generated >= scrollCount) {
        clearInterval(interval);
        addLog(`✅ Generados ${scrollCount} eventos SCROLL`, 'tracked');
        return;
      }

      window.guiders?.trackingPixelSDK?.trackEvent('SCROLL', {
        scrollY: Math.random() * 1000,
        scrollX: 0,
        url: window.location.href
      });

      generated++;
    }, 10); // Generar cada 10ms (muy rápido, ideal para probar throttling)
  }

  // Generar eventos de mouse
  function generateMouseEvents() {
    const mouseCount = 50;
    let generated = 0;

    const interval = setInterval(() => {
      if (generated >= mouseCount) {
        clearInterval(interval);
        addLog(`✅ Generados ${mouseCount} eventos MOUSE_MOVE`, 'tracked');
        return;
      }

      window.guiders?.trackingPixelSDK?.trackEvent('MOUSE_MOVE', {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        elementId: 'interactive-area'
      });

      generated++;
    }, 5); // Generar cada 5ms (súper rápido)
  }

  // Generar eventos mixtos
  function generateMixedEvents() {
    const types = ['SCROLL', 'MOUSE_MOVE', 'HOVER', 'CLICK', 'RESIZE'];
    const count = 100;
    let generated = 0;

    const interval = setInterval(() => {
      if (generated >= count) {
        clearInterval(interval);
        addLog(`✅ Generados ${count} eventos mixtos`, 'tracked');
        return;
      }

      const eventType = types[Math.floor(Math.random() * types.length)];

      window.guiders?.trackingPixelSDK?.trackEvent(eventType, {
        random: Math.random(),
        timestamp: Date.now(),
        url: window.location.href
      });

      generated++;
    }, 8); // Generar cada 8ms
  }

  // Actualizar estadísticas en la UI
  function updateStats() {
    document.getElementById('stat-captured').textContent = stats.captured;
    document.getElementById('stat-throttled').textContent = stats.throttled;
    document.getElementById('stat-aggregated').textContent = stats.aggregated;
    document.getElementById('stat-sent').textContent = stats.sent;

    const reduction = stats.captured > 0
      ? Math.round((1 - stats.sent / stats.captured) * 100)
      : 0;
    document.getElementById('stat-reduction').textContent = reduction + '%';
  }

  // Limpiar estadísticas
  function clearStats() {
    stats = { captured: 0, throttled: 0, aggregated: 0, sent: 0 };
    updateStats();
    document.getElementById('event-log').innerHTML = '<div class="log-entry"><span class="log-time">[Log limpiado]</span></div>';
    addLog('🗑️ Estadísticas reseteadas', 'tracked');
  }

  // Agregar entrada al log
  function addLog(message, type = 'tracked') {
    const logContainer = document.getElementById('event-log');
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${time}]</span>${message}`;

    logContainer.insertBefore(entry, logContainer.firstChild);

    // Limitar a 50 entradas
    if (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }

  // Toggle throttling
  document.getElementById('toggle-throttling')?.addEventListener('change', function(e) {
    if (throttler) {
      throttler.setEnabled(e.target.checked);
      addLog(`⚙️ Throttling ${e.target.checked ? 'habilitado' : 'deshabilitado'}`, 'tracked');
    }
  });

  // Toggle agregación
  document.getElementById('toggle-aggregation')?.addEventListener('change', function(e) {
    if (aggregator) {
      aggregator.setEnabled(e.target.checked);
      addLog(`⚙️ Agregación ${e.target.checked ? 'habilitada' : 'deshabilitada'}`, 'tracked');
    }
  });

  // Capturar eventos reales del área interactiva
  const interactiveArea = document.getElementById('interactive-area');

  interactiveArea?.addEventListener('mousemove', function(e) {
    window.guiders?.trackingPixelSDK?.trackEvent('MOUSE_MOVE', {
      x: e.clientX,
      y: e.clientY,
      elementId: 'interactive-area'
    });
  });

  interactiveArea?.addEventListener('click', function(e) {
    window.guiders?.trackingPixelSDK?.trackEvent('CLICK', {
      x: e.clientX,
      y: e.clientY,
      elementId: 'interactive-area',
      button: e.button
    });
    addLog('🖱️ Click capturado en área interactiva', 'tracked');
  });

  // Capturar scroll de la página
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      window.guiders?.trackingPixelSDK?.trackEvent('SCROLL', {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        url: window.location.href
      });
    }, 50); // Debounce de 50ms
  });

  // Monitorear la cola del SDK cada segundo
  setInterval(() => {
    if (window.guiders?.trackingPixelSDK?.eventQueueManager) {
      const queueSize = window.guiders.trackingPixelSDK.eventQueueManager.size();
      if (queueSize > 0) {
        addLog(`📦 Cola actual: ${queueSize} eventos esperando envío`, 'aggregated');
      }
    }

    // Actualizar estadísticas del agregador
    if (aggregator) {
      const aggStats = aggregator.getStats();
      if (aggStats.totalEventsReceived !== stats.captured) {
        stats.aggregated = aggStats.totalEventsAggregated;
        stats.sent = aggStats.totalEventsAggregated; // Simplificación para el demo
        updateStats();
      }
    }
  }, 2000);

  // Mensaje de bienvenida
  setTimeout(() => {
    addLog('👋 Bienvenido al demo de Tracking V2', 'tracked');
    addLog('💡 Prueba los botones o interactúa con el área morada', 'tracked');
  }, 1500);
</script>

<?php require '../partials/footer.php'; ?>
