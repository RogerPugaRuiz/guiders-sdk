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
    </nav>
  </div>
</header>

<main class="main-content">
  <div style="display:none" data-track-event="page_view" data-page="vehicle_comparison" data-page-title="Comparación de Vehículos"></div>
  
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <h1>🚗 Compara vehículos lado a lado</h1>
        <p class="hero-subtitle">Encuentra las diferencias y elige el vehículo perfecto para ti</p>
      </div>
    </div>
  </section>

  <!-- Comparison Section -->
  <section class="comparison-section">
    <div class="container">
      <!-- Vehicle Selection -->
      <div class="comparison-selector">
        <h2>Seleccionar Vehículos para Comparar</h2>
        <div class="vehicle-selector-grid">
          <div class="vehicle-selector-slot" data-slot="1">
            <div class="selector-placeholder">
              <div class="selector-icon">🚗</div>
              <h3>Seleccionar Vehículo 1</h3>
              <button class="btn-primary" data-track-event="select_comparison_vehicle" data-slot="1">
                Elegir Vehículo
              </button>
            </div>
          </div>
          
          <div class="comparison-vs">
            <span class="vs-text">VS</span>
          </div>
          
          <div class="vehicle-selector-slot" data-slot="2">
            <div class="selector-placeholder">
              <div class="selector-icon">🚙</div>
              <h3>Seleccionar Vehículo 2</h3>
              <button class="btn-primary" data-track-event="select_comparison_vehicle" data-slot="2">
                Elegir Vehículo
              </button>
            </div>
          </div>
          
          <div class="vehicle-selector-slot" data-slot="3" style="display: none;">
            <div class="selector-placeholder">
              <div class="selector-icon">🚐</div>
              <h3>Seleccionar Vehículo 3</h3>
              <button class="btn-primary" data-track-event="select_comparison_vehicle" data-slot="3">
                Elegir Vehículo
              </button>
            </div>
          </div>
        </div>
        
        <div class="comparison-actions">
          <button id="addThirdVehicle" class="btn-secondary" data-track-event="add_third_comparison_vehicle">
            ➕ Añadir Tercer Vehículo
          </button>
          <button id="clearComparison" class="btn-outline" data-track-event="clear_comparison">
            🗑️ Limpiar Comparación
          </button>
        </div>
      </div>

      <!-- Vehicle Selection Modal -->
      <div id="vehicleSelectionModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Seleccionar Vehículo</h3>
            <button class="modal-close" data-track-event="close_vehicle_selection_modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="vehicle-search-input">
              <input type="text" id="modalVehicleSearch" placeholder="Buscar por marca, modelo o características..." data-track-event="search_comparison_vehicle">
            </div>
            <div class="available-vehicles-grid" id="availableVehiclesGrid">
              <!-- Dynamic vehicle cards will be inserted here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div id="comparisonTable" class="comparison-table-container" style="display: none;">
        <h2>Comparación Detallada</h2>
        <div class="comparison-table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="feature-column">Características</th>
                <th class="vehicle-column" id="vehicle1Header">Vehículo 1</th>
                <th class="vehicle-column" id="vehicle2Header">Vehículo 2</th>
                <th class="vehicle-column" id="vehicle3Header" style="display: none;">Vehículo 3</th>
              </tr>
            </thead>
            <tbody id="comparisonTableBody">
              <!-- Dynamic comparison rows will be inserted here -->
            </tbody>
          </table>
        </div>
        
        <!-- Comparison Actions -->
        <div class="comparison-results-actions">
          <button class="btn-primary" data-track-event="save_comparison" data-track-vehicle-count="2">
            💾 Guardar Comparación
          </button>
          <button class="btn-secondary" data-track-event="export_comparison" data-track-format="pdf">
            📄 Exportar PDF
          </button>
          <button class="btn-secondary" data-track-event="share_comparison" data-track-method="link">
            🔗 Compartir Enlace
          </button>
        </div>
      </div>

      <!-- Quick Comparison Cards -->
      <div id="quickComparisonCards" class="quick-comparison-cards" style="display: none;">
        <h2>Resumen Rápido</h2>
        <div class="comparison-cards-grid">
          <div class="comparison-card price-comparison">
            <h3>💰 Precio</h3>
            <div class="comparison-values" id="priceComparison">
              <!-- Dynamic price comparison -->
            </div>
          </div>
          
          <div class="comparison-card fuel-comparison">
            <h3>⛽ Consumo</h3>
            <div class="comparison-values" id="fuelComparison">
              <!-- Dynamic fuel comparison -->
            </div>
          </div>
          
          <div class="comparison-card performance-comparison">
            <h3>🏎️ Rendimiento</h3>
            <div class="comparison-values" id="performanceComparison">
              <!-- Dynamic performance comparison -->
            </div>
          </div>
          
          <div class="comparison-card features-comparison">
            <h3>⚙️ Equipamiento</h3>
            <div class="comparison-values" id="featuresComparison">
              <!-- Dynamic features comparison -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Analytics Dashboard -->
  <section class="analytics-section">
    <div class="container">
      <h2>📊 Analytics en Tiempo Real</h2>
      <div class="analytics-dashboard">
        <div class="analytics-card">
          <h3>Comparaciones Activas</h3>
          <div class="analytics-value" id="activeComparisons">0</div>
        </div>
        
        <div class="analytics-card">
          <h3>Eventos de Seguimiento</h3>
          <div class="analytics-value" id="trackingEvents">0</div>
        </div>
        
        <div class="analytics-card">
          <h3>Vehículos Más Comparados</h3>
          <div class="analytics-list" id="popularVehicles">
            <!-- Dynamic popular vehicles list -->
          </div>
        </div>
        
        <div class="analytics-card">
          <h3>Filtros Más Usados</h3>
          <div class="analytics-list" id="popularFilters">
            <!-- Dynamic popular filters list -->
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<style>
/* Comparison Specific Styles */
.comparison-section {
  padding: 2rem 0;
}

.comparison-selector {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.vehicle-selector-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 2rem;
  align-items: center;
  margin: 2rem 0;
}

.vehicle-selector-slot {
  background: #f8f9fa;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.vehicle-selector-slot:hover {
  border-color: #1e3a8a;
  background: #f0f7ff;
}

.vehicle-selector-slot.selected {
  border-color: #16a34a;
  background: #f0fdf4;
  border-style: solid;
}

.selector-placeholder .selector-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.comparison-vs {
  background: #1e3a8a;
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.comparison-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.vehicle-search-input {
  margin-bottom: 1.5rem;
}

.vehicle-search-input input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.available-vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.available-vehicle-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.available-vehicle-card:hover {
  border-color: #1e3a8a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Comparison Table Styles */
.comparison-table-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.comparison-table-wrapper {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.comparison-table th,
.comparison-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #1f2937;
}

.feature-column {
  background: #f0f7ff !important;
  font-weight: 600;
  color: #1e3a8a;
  min-width: 200px;
}

.vehicle-column {
  min-width: 180px;
}

.comparison-results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Quick Comparison Cards */
.quick-comparison-cards {
  margin-bottom: 2rem;
}

.comparison-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.comparison-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.comparison-card h3 {
  margin-bottom: 1rem;
  color: #1e3a8a;
}

.comparison-values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-value-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.value-winner {
  background: #dcfce7;
  border-left: 4px solid #16a34a;
}

/* Analytics Dashboard */
.analytics-section {
  background: #f8f9fa;
  padding: 3rem 0;
}

.analytics-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.analytics-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.analytics-card h3 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.analytics-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #16a34a;
  margin-bottom: 0.5rem;
}

.analytics-list {
  text-align: left;
}

.analytics-list-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.analytics-list-item:last-child {
  border-bottom: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .vehicle-selector-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .comparison-vs {
    transform: rotate(90deg);
    margin: 1rem 0;
  }
  
  .comparison-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .comparison-results-actions {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.comparison-table-container,
.quick-comparison-cards {
  animation: slideIn 0.5s ease-out;
}

.analytics-value {
  animation: pulse 2s infinite;
}
</style>

<script>
// Vehicle Comparison JavaScript
class VehicleComparison {
  constructor() {
    this.selectedVehicles = {};
    this.currentSlot = null;
    this.availableVehicles = this.generateMockVehicles();
    this.analytics = {
      activeComparisons: 0,
      trackingEvents: 0,
      popularVehicles: {},
      popularFilters: {}
    };
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.renderAvailableVehicles();
    this.startAnalyticsUpdate();
    this.trackPageView();
  }
  
  setupEventListeners() {
    // Vehicle selection buttons
    document.querySelectorAll('[data-track-event="select_comparison_vehicle"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = e.target.dataset.slot;
        this.openVehicleSelectionModal(slot);
        this.trackEvent('select_comparison_vehicle', { slot });
      });
    });
    
    // Add third vehicle
    document.getElementById('addThirdVehicle').addEventListener('click', () => {
      this.showThirdVehicleSlot();
      this.trackEvent('add_third_comparison_vehicle');
    });
    
    // Clear comparison
    document.getElementById('clearComparison').addEventListener('click', () => {
      this.clearComparison();
      this.trackEvent('clear_comparison');
    });
    
    // Modal close
    document.querySelector('.modal-close').addEventListener('click', () => {
      this.closeVehicleSelectionModal();
      this.trackEvent('close_vehicle_selection_modal');
    });
    
    // Modal vehicle search
    document.getElementById('modalVehicleSearch').addEventListener('input', (e) => {
      this.filterAvailableVehicles(e.target.value);
      this.trackEvent('search_comparison_vehicle', { query: e.target.value });
    });
    
    // Comparison actions
    document.querySelectorAll('[data-track-event^="save_comparison"], [data-track-event^="export_comparison"], [data-track-event^="share_comparison"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventName = e.target.dataset.trackEvent;
        const additionalData = {};
        
        if (eventName === 'save_comparison') {
          additionalData.vehicleCount = Object.keys(this.selectedVehicles).length;
        } else if (eventName === 'export_comparison') {
          additionalData.format = e.target.dataset.trackFormat || 'pdf';
        } else if (eventName === 'share_comparison') {
          additionalData.method = e.target.dataset.trackMethod || 'link';
        }
        
        this.trackEvent(eventName, additionalData);
        this.handleComparisonAction(eventName, additionalData);
      });
    });
    
    // Click outside modal to close
    document.getElementById('vehicleSelectionModal').addEventListener('click', (e) => {
      if (e.target.id === 'vehicleSelectionModal') {
        this.closeVehicleSelectionModal();
      }
    });
  }
  
  generateMockVehicles() {
    return [
      {
        id: 'v1',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        type: 'nuevo',
        fuel: 'Híbrido',
        price: 28500,
        consumption: 4.2,
        power: 122,
        doors: 5,
        transmission: 'Automático',
        features: ['Navegación GPS', 'Cámara trasera', 'Sensores parking', 'Bluetooth'],
        image: 'https://via.placeholder.com/300x200?text=Toyota+Corolla'
      },
      {
        id: 'v2',
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2023,
        type: 'nuevo',
        fuel: 'Gasolina',
        price: 32000,
        consumption: 5.8,
        power: 150,
        doors: 5,
        transmission: 'Manual',
        features: ['Pantalla táctil', 'Control crucero', 'Faros LED', 'Climatizador'],
        image: 'https://via.placeholder.com/300x200?text=VW+Golf'
      },
      {
        id: 'v3',
        brand: 'Ford',
        model: 'Focus',
        year: 2022,
        type: 'ocasion',
        fuel: 'Gasolina',
        price: 22000,
        consumption: 6.1,
        power: 125,
        doors: 5,
        transmission: 'Manual',
        features: ['Sistema audio', 'Aire acondicionado', 'Llantas aleación'],
        image: 'https://via.placeholder.com/300x200?text=Ford+Focus'
      },
      {
        id: 'v4',
        brand: 'BMW',
        model: 'Serie 3',
        year: 2023,
        type: 'nuevo',
        fuel: 'Diesel',
        price: 45000,
        consumption: 4.8,
        power: 190,
        doors: 4,
        transmission: 'Automático',
        features: ['Navegación', 'Asientos cuero', 'Techo solar', 'Sistema premium'],
        image: 'https://via.placeholder.com/300x200?text=BMW+Serie+3'
      },
      {
        id: 'v5',
        brand: 'Audi',
        model: 'A4',
        year: 2023,
        type: 'km0',
        fuel: 'Diesel',
        price: 42000,
        consumption: 4.5,
        power: 175,
        doors: 4,
        transmission: 'Automático',
        features: ['Navegación MMI', 'Asientos deportivos', 'Faros Matrix', 'Parking assist'],
        image: 'https://via.placeholder.com/300x200?text=Audi+A4'
      },
      {
        id: 'v6',
        brand: 'Mercedes',
        model: 'Clase C',
        year: 2022,
        type: 'ocasion',
        fuel: 'Híbrido',
        price: 38000,
        consumption: 4.0,
        power: 204,
        doors: 4,
        transmission: 'Automático',
        features: ['MBUX', 'Asientos confort', 'Cámara 360°', 'Suspensión adaptativa'],
        image: 'https://via.placeholder.com/300x200?text=Mercedes+C'
      }
    ];
  }
  
  openVehicleSelectionModal(slot) {
    this.currentSlot = slot;
    document.getElementById('vehicleSelectionModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  closeVehicleSelectionModal() {
    document.getElementById('vehicleSelectionModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    this.currentSlot = null;
  }
  
  renderAvailableVehicles(vehicles = this.availableVehicles) {
    const grid = document.getElementById('availableVehiclesGrid');
    grid.innerHTML = '';
    
    vehicles.forEach(vehicle => {
      const card = document.createElement('div');
      card.className = 'available-vehicle-card';
      card.innerHTML = `
        <div class="vehicle-card-image">
          <img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;">
        </div>
        <div class="vehicle-card-info">
          <h4>${vehicle.brand} ${vehicle.model}</h4>
          <p><strong>${vehicle.year}</strong> • ${vehicle.type}</p>
          <p><strong>€${vehicle.price.toLocaleString()}</strong></p>
          <p>${vehicle.fuel} • ${vehicle.power}CV</p>
        </div>
      `;
      
      card.addEventListener('click', () => {
        this.selectVehicle(vehicle);
        this.trackEvent('vehicle_selected_for_comparison', {
          vehicleId: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          slot: this.currentSlot
        });
      });
      
      grid.appendChild(card);
    });
  }
  
  filterAvailableVehicles(query) {
    const filtered = this.availableVehicles.filter(vehicle => 
      vehicle.brand.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.fuel.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(query.toLowerCase())
    );
    this.renderAvailableVehicles(filtered);
  }
  
  selectVehicle(vehicle) {
    if (!this.currentSlot) return;
    
    this.selectedVehicles[this.currentSlot] = vehicle;
    this.updateVehicleSlot(this.currentSlot, vehicle);
    this.closeVehicleSelectionModal();
    
    // Update analytics
    this.updatePopularVehicles(vehicle);
    
    // Check if we can show comparison
    if (Object.keys(this.selectedVehicles).length >= 2) {
      this.showComparison();
    }
  }
  
  updateVehicleSlot(slot, vehicle) {
    const slotElement = document.querySelector(`[data-slot="${slot}"]`);
    slotElement.classList.add('selected');
    slotElement.innerHTML = `
      <div class="selected-vehicle">
        <img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; margin-bottom: 1rem;">
        <h4>${vehicle.brand} ${vehicle.model}</h4>
        <p>${vehicle.year} • €${vehicle.price.toLocaleString()}</p>
        <button class="btn-outline btn-sm" onclick="vehicleComparison.removeVehicle('${slot}')">
          🗑️ Quitar
        </button>
      </div>
    `;
  }
  
  removeVehicle(slot) {
    delete this.selectedVehicles[slot];
    const slotElement = document.querySelector(`[data-slot="${slot}"]`);
    slotElement.classList.remove('selected');
    slotElement.innerHTML = `
      <div class="selector-placeholder">
        <div class="selector-icon">${slot === '1' ? '🚗' : slot === '2' ? '🚙' : '🚐'}</div>
        <h3>Seleccionar Vehículo ${slot}</h3>
        <button class="btn-primary" data-track-event="select_comparison_vehicle" data-slot="${slot}">
          Elegir Vehículo
        </button>
      </div>
    `;
    
    // Re-add event listener
    slotElement.querySelector('button').addEventListener('click', (e) => {
      this.openVehicleSelectionModal(slot);
      this.trackEvent('select_comparison_vehicle', { slot });
    });
    
    this.trackEvent('remove_comparison_vehicle', { slot });
    
    // Hide comparison if less than 2 vehicles
    if (Object.keys(this.selectedVehicles).length < 2) {
      this.hideComparison();
    } else {
      this.showComparison();
    }
  }
  
  showThirdVehicleSlot() {
    const thirdSlot = document.querySelector('[data-slot="3"]');
    thirdSlot.style.display = 'block';
    
    // Update grid layout
    const grid = document.querySelector('.vehicle-selector-grid');
    grid.style.gridTemplateColumns = '1fr auto 1fr auto 1fr';
  }
  
  clearComparison() {
    this.selectedVehicles = {};
    
    // Reset all slots
    [1, 2, 3].forEach(slot => {
      const slotElement = document.querySelector(`[data-slot="${slot}"]`);
      if (slotElement) {
        slotElement.classList.remove('selected');
        slotElement.innerHTML = `
          <div class="selector-placeholder">
            <div class="selector-icon">${slot === 1 ? '🚗' : slot === 2 ? '🚙' : '🚐'}</div>
            <h3>Seleccionar Vehículo ${slot}</h3>
            <button class="btn-primary" data-track-event="select_comparison_vehicle" data-slot="${slot}">
              Elegir Vehículo
            </button>
          </div>
        `;
        
        // Re-add event listener
        slotElement.querySelector('button').addEventListener('click', (e) => {
          this.openVehicleSelectionModal(slot);
          this.trackEvent('select_comparison_vehicle', { slot });
        });
      }
    });
    
    // Hide third slot
    document.querySelector('[data-slot="3"]').style.display = 'none';
    
    this.hideComparison();
  }
  
  showComparison() {
    const vehicles = Object.values(this.selectedVehicles);
    if (vehicles.length < 2) return;
    
    // Show comparison table
    document.getElementById('comparisonTable').style.display = 'block';
    document.getElementById('quickComparisonCards').style.display = 'block';
    
    // Update headers
    Object.keys(this.selectedVehicles).forEach(slot => {
      const vehicle = this.selectedVehicles[slot];
      const header = document.getElementById(`vehicle${slot}Header`);
      if (header) {
        header.textContent = `${vehicle.brand} ${vehicle.model}`;
        header.style.display = 'table-cell';
      }
    });
    
    // Generate comparison table
    this.generateComparisonTable(vehicles);
    this.generateQuickComparison(vehicles);
    
    // Update analytics
    this.analytics.activeComparisons++;
    this.updateAnalyticsDashboard();
    
    // Track comparison view
    this.trackEvent('view_vehicle_comparison', {
      vehicleCount: vehicles.length,
      vehicles: vehicles.map(v => ({ id: v.id, brand: v.brand, model: v.model }))
    });
  }
  
  hideComparison() {
    document.getElementById('comparisonTable').style.display = 'none';
    document.getElementById('quickComparisonCards').style.display = 'none';
  }
  
  generateComparisonTable(vehicles) {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';
    
    const features = [
      { key: 'price', label: 'Precio', format: (val) => `€${val.toLocaleString()}` },
      { key: 'year', label: 'Año', format: (val) => val },
      { key: 'type', label: 'Tipo', format: (val) => val },
      { key: 'fuel', label: 'Combustible', format: (val) => val },
      { key: 'power', label: 'Potencia', format: (val) => `${val} CV` },
      { key: 'consumption', label: 'Consumo', format: (val) => `${val} L/100km` },
      { key: 'doors', label: 'Puertas', format: (val) => val },
      { key: 'transmission', label: 'Transmisión', format: (val) => val },
      { key: 'features', label: 'Equipamiento', format: (val) => val.join(', ') }
    ];
    
    features.forEach(feature => {
      const row = document.createElement('tr');
      let cells = `<td class="feature-column">${feature.label}</td>`;
      
      Object.keys(this.selectedVehicles).forEach(slot => {
        const vehicle = this.selectedVehicles[slot];
        const value = feature.format(vehicle[feature.key]);
        const cellStyle = slot <= Object.keys(this.selectedVehicles).length ? 'table-cell' : 'none';
        cells += `<td style="display: ${cellStyle}">${value}</td>`;
      });
      
      // Fill remaining cells if needed
      for (let i = Object.keys(this.selectedVehicles).length; i < 3; i++) {
        cells += `<td style="display: none">-</td>`;
      }
      
      row.innerHTML = cells;
      tbody.appendChild(row);
    });
  }
  
  generateQuickComparison(vehicles) {
    // Price comparison
    const priceComparison = document.getElementById('priceComparison');
    const sortedByPrice = [...vehicles].sort((a, b) => a.price - b.price);
    priceComparison.innerHTML = sortedByPrice.map((vehicle, index) => `
      <div class="comparison-value-item ${index === 0 ? 'value-winner' : ''}">
        <span>${vehicle.brand} ${vehicle.model}</span>
        <span>€${vehicle.price.toLocaleString()}</span>
      </div>
    `).join('');
    
    // Fuel consumption comparison
    const fuelComparison = document.getElementById('fuelComparison');
    const sortedByFuel = [...vehicles].sort((a, b) => a.consumption - b.consumption);
    fuelComparison.innerHTML = sortedByFuel.map((vehicle, index) => `
      <div class="comparison-value-item ${index === 0 ? 'value-winner' : ''}">
        <span>${vehicle.brand} ${vehicle.model}</span>
        <span>${vehicle.consumption} L/100km</span>
      </div>
    `).join('');
    
    // Performance comparison
    const performanceComparison = document.getElementById('performanceComparison');
    const sortedByPower = [...vehicles].sort((a, b) => b.power - a.power);
    performanceComparison.innerHTML = sortedByPower.map((vehicle, index) => `
      <div class="comparison-value-item ${index === 0 ? 'value-winner' : ''}">
        <span>${vehicle.brand} ${vehicle.model}</span>
        <span>${vehicle.power} CV</span>
      </div>
    `).join('');
    
    // Features comparison
    const featuresComparison = document.getElementById('featuresComparison');
    const sortedByFeatures = [...vehicles].sort((a, b) => b.features.length - a.features.length);
    featuresComparison.innerHTML = sortedByFeatures.map((vehicle, index) => `
      <div class="comparison-value-item ${index === 0 ? 'value-winner' : ''}">
        <span>${vehicle.brand} ${vehicle.model}</span>
        <span>${vehicle.features.length} características</span>
      </div>
    `).join('');
  }
  
  handleComparisonAction(action, data) {
    switch (action) {
      case 'save_comparison':
        this.saveComparison(data);
        break;
      case 'export_comparison':
        this.exportComparison(data);
        break;
      case 'share_comparison':
        this.shareComparison(data);
        break;
    }
  }
  
  saveComparison(data) {
    // Simulate saving comparison
    const comparisonData = {
      id: Date.now().toString(),
      vehicles: Object.values(this.selectedVehicles),
      timestamp: new Date().toISOString(),
      vehicleCount: data.vehicleCount
    };
    
    // Save to localStorage for demo purposes
    const savedComparisons = JSON.parse(localStorage.getItem('vehicleComparisons') || '[]');
    savedComparisons.push(comparisonData);
    localStorage.setItem('vehicleComparisons', JSON.stringify(savedComparisons));
    
    alert('✅ Comparación guardada exitosamente');
  }
  
  exportComparison(data) {
    // Simulate PDF export
    const comparisonData = {
      vehicles: Object.values(this.selectedVehicles),
      timestamp: new Date().toISOString(),
      format: data.format
    };
    
    // In a real implementation, this would generate and download a PDF
    console.log('Exporting comparison as PDF:', comparisonData);
    alert('📄 Generando PDF... (Funcionalidad simulada)');
  }
  
  shareComparison(data) {
    // Simulate sharing functionality
    const shareUrl = `${window.location.origin}/vehicle-comparison?compare=${Object.keys(this.selectedVehicles).map(slot => this.selectedVehicles[slot].id).join(',')}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Comparación de Vehículos',
        text: `Compara estos vehículos: ${Object.values(this.selectedVehicles).map(v => `${v.brand} ${v.model}`).join(' vs ')}`,
        url: shareUrl
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('🔗 Enlace copiado al portapapeles');
      });
    }
  }
  
  updatePopularVehicles(vehicle) {
    const key = `${vehicle.brand} ${vehicle.model}`;
    this.analytics.popularVehicles[key] = (this.analytics.popularVehicles[key] || 0) + 1;
  }
  
  startAnalyticsUpdate() {
    setInterval(() => {
      this.updateAnalyticsDashboard();
    }, 2000);
  }
  
  updateAnalyticsDashboard() {
    // Update analytics values
    document.getElementById('activeComparisons').textContent = this.analytics.activeComparisons;
    document.getElementById('trackingEvents').textContent = this.analytics.trackingEvents;
    
    // Update popular vehicles
    const popularVehiclesList = document.getElementById('popularVehicles');
    const sortedVehicles = Object.entries(this.analytics.popularVehicles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    popularVehiclesList.innerHTML = sortedVehicles.map(([vehicle, count]) => `
      <div class="analytics-list-item">
        <span>${vehicle}</span>
        <span>${count} comparaciones</span>
      </div>
    `).join('') || '<p>No hay datos disponibles</p>';
    
    // Update popular filters
    const popularFiltersList = document.getElementById('popularFilters');
    const sortedFilters = Object.entries(this.analytics.popularFilters)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    popularFiltersList.innerHTML = sortedFilters.map(([filter, count]) => `
      <div class="analytics-list-item">
        <span>${filter}</span>
        <span>${count} usos</span>
      </div>
    `).join('') || '<p>No hay datos disponibles</p>';
  }
  
  trackEvent(eventName, data = {}) {
    this.analytics.trackingEvents++;
    
    // Track popular filters
    if (eventName.includes('filter') || eventName.includes('search')) {
      this.analytics.popularFilters[eventName] = (this.analytics.popularFilters[eventName] || 0) + 1;
    }
    
    // Send to Guiders SDK if available
    if (window.guiders && typeof window.guiders.track === 'function') {
      window.guiders.track({
        event: eventName,
        ...data,
        timestamp: Date.now(),
        page: 'vehicle_comparison'
      });
    }
    
    console.log('🔍 Tracking event:', eventName, data);
  }
  
  trackPageView() {
    this.trackEvent('page_view', {
      page: 'vehicle_comparison',
      pageTitle: 'Comparación de Vehículos'
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.vehicleComparison = new VehicleComparison();
});
</script>

<?php include __DIR__ . '/../partials/footer.php'; ?>
