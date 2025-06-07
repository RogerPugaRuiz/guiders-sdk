<?php 
include __DIR__ . '/../partials/header.php';
$link = '/style.css';
echo "<link rel=\"stylesheet\" href=\"$link\">";
?>

<header>
  <div class="header-content">
    <h1>Guiders SDK</h1>
    <nav>
      <a href="/">Inicio</a>
      <a href="/about">Nosotros</a>
      <a href="/contact">Contacto</a>
      <a href="/ecommerce">Demo Tienda</a>
      <a href="/vehicle-search">Búsqueda Vehículos</a>
      <a href="/vehicle-comparison">Comparar Vehículos</a>
      <a href="/analytics-dashboard" class="active">Analytics Dashboard</a>
    </nav>
  </div>
</header>

<main class="main-content">
  <div style="display:none" data-track-event="page_view" data-page="analytics_dashboard"></div>
  
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <h1>📊 Dashboard de Análisis Automotriz</h1>
        <p class="hero-subtitle">Seguimiento en tiempo real de interacciones de usuarios con vehículos</p>
      </div>
    </div>
  </section>

  <!-- Analytics Overview -->
  <section class="analytics-overview">
    <div class="container">
      <div class="stats-grid">
        <div class="stat-card" 
             data-track-event="analytics_dashboard_view"
             data-metric="page_views">
          <div class="stat-icon">👁️</div>
          <div class="stat-number" id="pageViews">1,247</div>
          <div class="stat-label">Visualizaciones de página</div>
          <div class="stat-change positive">+12% vs ayer</div>
        </div>

        <div class="stat-card"
             data-track-event="analytics_dashboard_view"
             data-metric="vehicle_searches">
          <div class="stat-icon">🔍</div>
          <div class="stat-number" id="vehicleSearches">856</div>
          <div class="stat-label">Búsquedas de vehículos</div>
          <div class="stat-change positive">+8% vs ayer</div>
        </div>

        <div class="stat-card"
             data-track-event="analytics_dashboard_view"
             data-metric="vehicle_comparisons">
          <div class="stat-icon">⚖️</div>
          <div class="stat-number" id="vehicleComparisons">234</div>
          <div class="stat-label">Comparaciones realizadas</div>
          <div class="stat-change positive">+23% vs ayer</div>
        </div>

        <div class="stat-card"
             data-track-event="analytics_dashboard_view"
             data-metric="financing_calculations">
          <div class="stat-icon">🧮</div>
          <div class="stat-number" id="financingCalculations">189</div>
          <div class="stat-label">Cálculos de financiación</div>
          <div class="stat-change positive">+15% vs ayer</div>
        </div>

        <div class="stat-card"
             data-track-event="analytics_dashboard_view"
             data-metric="dealer_contacts">
          <div class="stat-icon">📞</div>
          <div class="stat-number" id="dealerContacts">67</div>
          <div class="stat-label">Contactos con concesionarios</div>
          <div class="stat-change positive">+31% vs ayer</div>
        </div>

        <div class="stat-card"
             data-track-event="analytics_dashboard_view"
             data-metric="test_drives">
          <div class="stat-icon">🚗</div>
          <div class="stat-number" id="testDrives">45</div>
          <div class="stat-label">Pruebas de conducción</div>
          <div class="stat-change positive">+18% vs ayer</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Real-time Activity Feed -->
  <section class="realtime-activity">
    <div class="container">
      <div class="analytics-grid">
        <!-- Activity Feed -->
        <div class="analytics-card">
          <div class="card-header">
            <h3>📡 Actividad en Tiempo Real</h3>
            <div class="live-indicator">🔴 EN VIVO</div>
          </div>
          <div class="activity-feed" id="activityFeed">
            <div class="activity-item">
              <span class="activity-time">15:23:45</span>
              <span class="activity-event">Usuario vio BMW Serie 3 en Madrid</span>
              <span class="activity-meta">📍 Madrid</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">15:23:12</span>
              <span class="activity-event">Comparación: Audi A3 vs Mercedes Clase C</span>
              <span class="activity-meta">⚖️ Comparación</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">15:22:58</span>
              <span class="activity-event">Cálculo de financiación: Tesla Model 3</span>
              <span class="activity-meta">🧮 Financiación</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">15:22:34</span>
              <span class="activity-event">Contacto con concesionario para Volkswagen Golf</span>
              <span class="activity-meta">📞 Contacto</span>
            </div>
            <div class="activity-item">
              <span class="activity-time">15:22:01</span>
              <span class="activity-event">Búsqueda: SUV Híbrido máx. 40.000€</span>
              <span class="activity-meta">🔍 Búsqueda</span>
            </div>
          </div>
        </div>

        <!-- Popular Vehicles -->
        <div class="analytics-card">
          <div class="card-header">
            <h3>🏆 Vehículos Más Populares</h3>
            <button class="btn btn-outline" 
                    data-track-event="export_analytics"
                    data-export-type="popular_vehicles">
              📊 Exportar
            </button>
          </div>
          <div class="popular-vehicles">
            <div class="vehicle-rank">
              <div class="rank-number">1</div>
              <div class="vehicle-info">
                <h4>BMW Serie 3</h4>
                <p>127 interacciones • 23 comparaciones</p>
              </div>
              <div class="trend-chart">📈 +12%</div>
            </div>
            <div class="vehicle-rank">
              <div class="rank-number">2</div>
              <div class="vehicle-info">
                <h4>Audi A3</h4>
                <p>112 interacciones • 19 comparaciones</p>
              </div>
              <div class="trend-chart">📈 +8%</div>
            </div>
            <div class="vehicle-rank">
              <div class="rank-number">3</div>
              <div class="vehicle-info">
                <h4>Mercedes Clase C</h4>
                <p>98 interacciones • 17 comparaciones</p>
              </div>
              <div class="trend-chart">📈 +15%</div>
            </div>
            <div class="vehicle-rank">
              <div class="rank-number">4</div>
              <div class="vehicle-info">
                <h4>Tesla Model 3</h4>
                <p>89 interacciones • 14 comparaciones</p>
              </div>
              <div class="trend-chart">📈 +25%</div>
            </div>
            <div class="vehicle-rank">
              <div class="rank-number">5</div>
              <div class="vehicle-info">
                <h4>Volkswagen Golf</h4>
                <p>76 interacciones • 11 comparaciones</p>
              </div>
              <div class="trend-chart">📉 -3%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Charts and Graphs -->
  <section class="charts-section">
    <div class="container">
      <div class="charts-grid">
        <!-- Interaction Trends -->
        <div class="analytics-card chart-card">
          <div class="card-header">
            <h3>📈 Tendencias de Interacción</h3>
            <div class="chart-controls">
              <select class="chart-period" 
                      data-track-event="filter_analytics"
                      data-filter-type="time_period">
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="interactionTrendsChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- Popular Filters -->
        <div class="analytics-card">
          <div class="card-header">
            <h3>🔧 Filtros Más Utilizados</h3>
            <button class="btn btn-outline"
                    data-track-event="share_analytics"
                    data-share-type="popular_filters">
              📤 Compartir
            </button>
          </div>
          <div class="popular-filters">
            <div class="filter-stat">
              <div class="filter-name">Precio máximo</div>
              <div class="filter-bar">
                <div class="filter-fill" style="width: 85%"></div>
              </div>
              <div class="filter-percentage">85%</div>
            </div>
            <div class="filter-stat">
              <div class="filter-name">Tipo de combustible</div>
              <div class="filter-bar">
                <div class="filter-fill" style="width: 72%"></div>
              </div>
              <div class="filter-percentage">72%</div>
            </div>
            <div class="filter-stat">
              <div class="filter-name">Marca</div>
              <div class="filter-bar">
                <div class="filter-fill" style="width: 68%"></div>
              </div>
              <div class="filter-percentage">68%</div>
            </div>
            <div class="filter-stat">
              <div class="filter-name">Año desde</div>
              <div class="filter-bar">
                <div class="filter-fill" style="width: 54%"></div>
              </div>
              <div class="filter-percentage">54%</div>
            </div>
            <div class="filter-stat">
              <div class="filter-name">Transmisión</div>
              <div class="filter-bar">
                <div class="filter-fill" style="width: 41%"></div>
              </div>
              <div class="filter-percentage">41%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Conversion Funnel -->
  <section class="funnel-section">
    <div class="container">
      <div class="analytics-card">
        <div class="card-header">
          <h3>🎯 Embudo de Conversión</h3>
          <div class="funnel-period">Últimos 30 días</div>
        </div>
        <div class="conversion-funnel">
          <div class="funnel-step">
            <div class="step-number">1,247</div>
            <div class="step-label">Visitantes únicos</div>
            <div class="step-bar" style="width: 100%"></div>
            <div class="step-percentage">100%</div>
          </div>
          <div class="funnel-step">
            <div class="step-number">856</div>
            <div class="step-label">Búsquedas realizadas</div>
            <div class="step-bar" style="width: 68.6%"></div>
            <div class="step-percentage">68.6%</div>
          </div>
          <div class="funnel-step">
            <div class="step-number">432</div>
            <div class="step-label">Vehículos visualizados</div>
            <div class="step-bar" style="width: 34.6%"></div>
            <div class="step-percentage">34.6%</div>
          </div>
          <div class="funnel-step">
            <div class="step-number">234</div>
            <div class="step-label">Comparaciones realizadas</div>
            <div class="step-bar" style="width: 18.8%"></div>
            <div class="step-percentage">18.8%</div>
          </div>
          <div class="funnel-step">
            <div class="step-number">189</div>
            <div class="step-label">Cálculos de financiación</div>
            <div class="step-bar" style="width: 15.2%"></div>
            <div class="step-percentage">15.2%</div>
          </div>
          <div class="funnel-step">
            <div class="step-number">67</div>
            <div class="step-label">Contactos realizados</div>
            <div class="step-bar" style="width: 5.4%"></div>
            <div class="step-percentage">5.4%</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Export Options -->
  <section class="export-section">
    <div class="container">
      <div class="export-card">
        <h3>📋 Exportar Datos de Análisis</h3>
        <div class="export-options">
          <button class="btn btn-primary"
                  data-track-event="export_analytics"
                  data-export-type="full_report"
                  data-export-format="pdf">
            📄 Reporte Completo (PDF)
          </button>
          <button class="btn btn-outline"
                  data-track-event="export_analytics"
                  data-export-type="data_export"
                  data-export-format="csv">
            📊 Datos en CSV
          </button>
          <button class="btn btn-outline"
                  data-track-event="export_analytics"
                  data-export-type="dashboard_share"
                  data-export-format="link">
            🔗 Compartir Dashboard
          </button>
        </div>
      </div>
    </div>
  </section>
</main>

<style>
/* Analytics Dashboard Styles */
.analytics-overview {
  padding: 2rem 0;
  background: #f8fafc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1e40af;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.stat-change.positive {
  background: #dcfce7;
  color: #16a34a;
}

.stat-change.negative {
  background: #fef2f2;
  color: #dc2626;
}

/* Real-time Activity */
.realtime-activity {
  padding: 2rem 0;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.analytics-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #1e293b;
}

.live-indicator {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.activity-feed {
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.activity-event {
  color: #1e293b;
}

.activity-meta {
  font-size: 0.8rem;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #64748b;
}

/* Popular Vehicles */
.popular-vehicles {
  padding: 1rem;
}

.vehicle-rank {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
}

.vehicle-rank:last-child {
  border-bottom: none;
}

.rank-number {
  width: 2rem;
  height: 2rem;
  background: #1e40af;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.vehicle-info h4 {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
}

.vehicle-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.trend-chart {
  font-size: 0.9rem;
  font-weight: 600;
  color: #16a34a;
}

/* Charts */
.charts-section {
  padding: 2rem 0;
  background: #f8fafc;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.chart-card {
  min-height: 300px;
}

.chart-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.chart-period {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.chart-container {
  padding: 1rem;
  height: 250px;
}

/* Popular Filters */
.popular-filters {
  padding: 1rem;
}

.filter-stat {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.filter-name {
  color: #1e293b;
  font-weight: 500;
}

.filter-bar {
  background: #f1f5f9;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.filter-fill {
  background: linear-gradient(90deg, #3b82f6, #1e40af);
  height: 100%;
  transition: width 0.3s ease;
}

.filter-percentage {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Conversion Funnel */
.funnel-section {
  padding: 2rem 0;
}

.funnel-period {
  color: #64748b;
  font-size: 0.9rem;
}

.conversion-funnel {
  padding: 2rem;
}

.funnel-step {
  display: grid;
  grid-template-columns: auto 1fr 2fr auto;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.step-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e40af;
  min-width: 4rem;
}

.step-label {
  color: #1e293b;
  font-weight: 500;
}

.step-bar {
  background: linear-gradient(90deg, #3b82f6, #1e40af);
  height: 12px;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.step-percentage {
  color: #64748b;
  font-weight: 600;
  min-width: 3rem;
}

/* Export Section */
.export-section {
  padding: 2rem 0;
  background: #f8fafc;
}

.export-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.export-card h3 {
  margin-bottom: 1.5rem;
  color: #1e293b;
}

.export-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>

<script>
// Real-time Analytics Dashboard Manager
class AnalyticsDashboard {
  constructor() {
    this.activityFeed = document.getElementById('activityFeed');
    this.statsElements = {
      pageViews: document.getElementById('pageViews'),
      vehicleSearches: document.getElementById('vehicleSearches'),
      vehicleComparisons: document.getElementById('vehicleComparisons'),
      financingCalculations: document.getElementById('financingCalculations'),
      dealerContacts: document.getElementById('dealerContacts'),
      testDrives: document.getElementById('testDrives')
    };
    
    this.mockEvents = [
      'Usuario vio Audi A3 en Barcelona',
      'Comparación: BMW Serie 3 vs Mercedes Clase C',
      'Cálculo de financiación: Tesla Model 3',
      'Contacto con concesionario para Volkswagen Golf',
      'Búsqueda: Híbrido máx. 35.000€',
      'Prueba de conducción solicitada: SEAT León',
      'Usuario añadió BMW X3 a favoritos',
      'Filtro aplicado: Automático, Gasolina',
      'Vista de galería: Mercedes Clase A',
      'Descarga de folleto: Ford Focus'
    ];
    
    this.startRealTimeUpdates();
    this.initializeChart();
    this.trackDashboardEvents();
  }
  
  startRealTimeUpdates() {
    // Simulate real-time activity every 3-8 seconds
    setInterval(() => {
      this.addNewActivity();
      this.updateStats();
    }, Math.random() * 5000 + 3000);
  }
  
  addNewActivity() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');
    const randomEvent = this.mockEvents[Math.floor(Math.random() * this.mockEvents.length)];
    
    const activityHTML = `
      <div class="activity-item new-activity">
        <span class="activity-time">${timeString}</span>
        <span class="activity-event">${randomEvent}</span>
        <span class="activity-meta">🆕 Nuevo</span>
      </div>
    `;
    
    this.activityFeed.insertAdjacentHTML('afterbegin', activityHTML);
    
    // Remove old activities (keep only last 10)
    const activities = this.activityFeed.querySelectorAll('.activity-item');
    if (activities.length > 10) {
      activities[activities.length - 1].remove();
    }
    
    // Add highlight animation to new activity
    const newActivity = this.activityFeed.querySelector('.new-activity');
    newActivity.style.background = '#fef3c7';
    setTimeout(() => {
      newActivity.style.background = '';
      newActivity.classList.remove('new-activity');
    }, 2000);
    
    this.trackEvent('realtime_activity_added', { event: randomEvent });
  }
  
  updateStats() {
    // Simulate gradual stat increases
    Object.keys(this.statsElements).forEach(stat => {
      const element = this.statsElements[stat];
      if (element) {
        const currentValue = parseInt(element.textContent.replace(/,/g, ''));
        const increase = Math.floor(Math.random() * 3) + 1;
        const newValue = currentValue + increase;
        
        this.animateNumber(element, currentValue, newValue);
      }
    });
  }
  
  animateNumber(element, from, to) {
    const duration = 1000;
    const startTime = Date.now();
    
    const updateNumber = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentValue = Math.floor(from + (to - from) * progress);
      element.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };
    
    requestAnimationFrame(updateNumber);
  }
  
  initializeChart() {
    const canvas = document.getElementById('interactionTrendsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Simple line chart simulation
    const data = Array.from({length: 24}, () => Math.floor(Math.random() * 100) + 20);
    
    this.drawChart(ctx, data, canvas.width, canvas.height);
  }
  
  drawChart(ctx, data, width, height) {
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw data line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const valueRange = maxValue - minValue || 1;
    
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = '#3b82f6';
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  trackDashboardEvents() {
    // Track dashboard interactions
    document.querySelectorAll('[data-track-event]').forEach(element => {
      const event = element.dataset.trackEvent;
      
      if (event.includes('analytics') || event.includes('export') || event.includes('share')) {
        element.addEventListener('click', () => {
          this.trackEvent(event, {
            element: element.tagName.toLowerCase(),
            text: element.textContent.trim(),
            timestamp: Date.now()
          });
        });
      }
    });
  }
  
  trackEvent(eventName, data = {}) {
    const enhancedData = {
      ...data,
      timestamp: Date.now(),
      page: 'analytics_dashboard',
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`
    };
    
    // Send to Guiders SDK if available
    if (window.guiders && typeof window.guiders.track === 'function') {
      window.guiders.track({
        event: eventName,
        ...enhancedData
      });
    }
    
    console.log('📊 Analytics Dashboard Tracking:', eventName, enhancedData);
  }
}

// Initialize Analytics Dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.analyticsDashboard = new AnalyticsDashboard();
  
  // Track initial page view
  if (window.guiders && typeof window.guiders.track === 'function') {
    window.guiders.track({
      event: 'analytics_dashboard_loaded',
      page: 'analytics_dashboard',
      features: ['realtime_feed', 'stats_overview', 'charts', 'conversion_funnel'],
      timestamp: Date.now()
    });
  }
});
</script>

</body>
</html>
