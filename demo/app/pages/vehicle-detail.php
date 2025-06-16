<?php 
include __DIR__ . '/../partials/header.php';
$link = '/style.css';
echo "<link rel=\"stylesheet\" href=\"$link\">";

// Get vehicle ID from URL parameters
$vehicleId = $_GET['id'] ?? 'v001';
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
  <!-- Breadcrumb -->
  <section class="breadcrumb-section">
    <div class="container">
      <nav class="breadcrumb">
        <a href="/">Inicio</a> > 
        <a href="/vehicle-search">Búsqueda Vehículos</a> > 
        <span>Detalle del Vehículo</span>
      </nav>
    </div>
  </section>

  <!-- Vehicle Detail Section -->
  <section class="vehicle-detail-section">
    <div class="container">
      <div class="vehicle-detail-grid">
        <!-- Vehicle Gallery -->
        <div class="vehicle-gallery">
          <div class="main-image" data-track-event="view_vehicle_gallery" data-vehicle-id="<?php echo $vehicleId; ?>">
            <img id="mainVehicleImage" src="https://dummyimage.com/800x500/1e3a8a/fff&text=Audi+A3+Principal" alt="Vista principal del vehículo">
            <div class="gallery-controls">
              <button class="gallery-prev">‹</button>
              <button class="gallery-next">›</button>
            </div>
          </div>
          <div class="gallery-thumbnails">
            <img src="https://dummyimage.com/150x100/1e3a8a/fff&text=Exterior" alt="Vista exterior" class="thumbnail active">
            <img src="https://dummyimage.com/150x100/2563eb/fff&text=Interior" alt="Vista interior" class="thumbnail">
            <img src="https://dummyimage.com/150x100/3b82f6/fff&text=Motor" alt="Vista motor" class="thumbnail">
            <img src="https://dummyimage.com/150x100/60a5fa/fff&text=Lateral" alt="Vista lateral" class="thumbnail">
            <img src="https://dummyimage.com/150x100/93c5fd/fff&text=Trasera" alt="Vista trasera" class="thumbnail">
          </div>
        </div>

        <!-- Vehicle Info -->
        <div class="vehicle-info-panel">
          <div class="vehicle-header">
            <h1>Audi A3 Sportback 1.5 TFSI</h1>
            <div class="vehicle-badges">
              <span class="badge badge-new">Nuevo</span>
              <span class="badge badge-warranty">Garantía</span>
              <span class="badge badge-eco">ECO</span>
            </div>
          </div>

          <div class="vehicle-price-section">
            <div class="price-main">28.500 €</div>
            <div class="price-details">
              <span class="price-before">31.200 €</span>
              <span class="price-discount">-2.700 € descuento</span>
            </div>
            <div class="financing-options">
              <div class="financing-option">
                <strong>Financiación:</strong> Desde 245 €/mes
              </div>
              <div class="financing-option">
                <strong>Renting:</strong> Desde 320 €/mes
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="btn btn-primary btn-large" 
                    data-track-event="contact_dealer" 
                    data-vehicle-id="<?php echo $vehicleId; ?>"
                    data-action-type="primary">
              📞 Contactar Concesionario
            </button>
            <button class="btn btn-secondary" 
                    data-track-event="schedule_test_drive" 
                    data-vehicle-id="<?php echo $vehicleId; ?>">
              🚗 Solicitar Prueba
            </button>
            <button class="btn btn-outline" 
                    data-track-event="request_quote" 
                    data-vehicle-id="<?php echo $vehicleId; ?>">
              💰 Pedir Cotización
            </button>
          </div>

          <!-- Vehicle Quick Specs -->
          <div class="quick-specs">
            <div class="spec-item">
              <span class="spec-label">Año:</span>
              <span class="spec-value">2023</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Kilómetros:</span>
              <span class="spec-value">15.000 km</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Combustible:</span>
              <span class="spec-value">Gasolina</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Transmisión:</span>
              <span class="spec-value">Automático</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Potencia:</span>
              <span class="spec-value">150 CV</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Ubicación:</span>
              <span class="spec-value">Madrid, España</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="secondary-actions">
            <button class="action-btn" 
                    data-track-event="add_to_favorites" 
                    data-vehicle-id="<?php echo $vehicleId; ?>">
              ♡ Añadir a Favoritos
            </button>
            <button class="action-btn" 
                    data-track-event="add_to_comparison" 
                    data-vehicle-id="<?php echo $vehicleId; ?>"
                    data-vehicle-brand="Audi"
                    data-vehicle-model="A3">
              ⚖️ Comparar
            </button>
            <button class="action-btn" 
                    data-track-event="share_comparison" 
                    data-vehicle-id="<?php echo $vehicleId; ?>"
                    data-share-method="social">
              🔗 Compartir
            </button>
            <button class="action-btn" 
                    data-track-event="download_brochure" 
                    data-vehicle-id="<?php echo $vehicleId; ?>"
                    data-document-type="brochure">
              📄 Descargar Folleto
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Vehicle Details Tabs -->
  <section class="vehicle-tabs-section">
    <div class="container">
      <div class="tabs-navigation">
        <button class="tab-btn active" data-tab="specs" data-track-event="view_vehicle_specs">
          ⚙️ Especificaciones
        </button>
        <button class="tab-btn" data-tab="equipment" data-track-event="view_vehicle_details">
          🎯 Equipamiento
        </button>
        <button class="tab-btn" data-tab="history" data-track-event="view_vehicle_history">
          📋 Historial
        </button>
        <button class="tab-btn" data-tab="financing" data-track-event="calculate_financing">
          💰 Financiación
        </button>
        <button class="tab-btn" data-tab="location" data-track-event="view_vehicle_location">
          📍 Ubicación
        </button>
      </div>

      <div class="tab-content">
        <!-- Specifications Tab -->
        <div id="specs" class="tab-panel active">
          <h3>Especificaciones Técnicas</h3>
          <div class="specs-grid">
            <div class="specs-category">
              <h4>Motor y Rendimiento</h4>
              <div class="specs-list">
                <div class="spec-row">
                  <span>Motor:</span>
                  <span>1.5 TFSI 4 cilindros</span>
                </div>
                <div class="spec-row">
                  <span>Potencia:</span>
                  <span>150 CV (110 kW)</span>
                </div>
                <div class="spec-row">
                  <span>Par motor:</span>
                  <span>250 Nm</span>
                </div>
                <div class="spec-row">
                  <span>Aceleración 0-100:</span>
                  <span>8.4 segundos</span>
                </div>
                <div class="spec-row">
                  <span>Velocidad máxima:</span>
                  <span>224 km/h</span>
                </div>
                <div class="spec-row">
                  <span>Consumo combinado:</span>
                  <span>5.8 L/100km</span>
                </div>
              </div>
            </div>

            <div class="specs-category">
              <h4>Dimensiones y Peso</h4>
              <div class="specs-list">
                <div class="spec-row">
                  <span>Longitud:</span>
                  <span>4.343 mm</span>
                </div>
                <div class="spec-row">
                  <span>Anchura:</span>
                  <span>1.815 mm</span>
                </div>
                <div class="spec-row">
                  <span>Altura:</span>
                  <span>1.459 mm</span>
                </div>
                <div class="spec-row">
                  <span>Distancia entre ejes:</span>
                  <span>2.636 mm</span>
                </div>
                <div class="spec-row">
                  <span>Peso en vacío:</span>
                  <span>1.395 kg</span>
                </div>
                <div class="spec-row">
                  <span>Capacidad maletero:</span>
                  <span>380 litros</span>
                </div>
              </div>
            </div>

            <div class="specs-category">
              <h4>Capacidades</h4>
              <div class="specs-list">
                <div class="spec-row">
                  <span>Plazas:</span>
                  <span>5</span>
                </div>
                <div class="spec-row">
                  <span>Puertas:</span>
                  <span>5</span>
                </div>
                <div class="spec-row">
                  <span>Depósito combustible:</span>
                  <span>50 litros</span>
                </div>
                <div class="spec-row">
                  <span>Capacidad remolque:</span>
                  <span>1.400 kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment Tab -->
        <div id="equipment" class="tab-panel">
          <h3>Equipamiento y Características</h3>
          <div class="equipment-categories">
            <div class="equipment-category">
              <h4>🛡️ Seguridad</h4>
              <ul class="equipment-list">
                <li>✓ Sistema de frenado ABS</li>
                <li>✓ Control de estabilidad ESP</li>
                <li>✓ Airbags frontales y laterales</li>
                <li>✓ Asistente de frenada de emergencia</li>
                <li>✓ Control de crucero adaptativo</li>
                <li>✓ Asistente de mantenimiento de carril</li>
                <li>✓ Sensores de parking delanteros y traseros</li>
                <li>✓ Cámara de visión trasera</li>
              </ul>
            </div>

            <div class="equipment-category">
              <h4>🎵 Confort y Tecnología</h4>
              <ul class="equipment-list">
                <li>✓ Sistema de navegación MMI</li>
                <li>✓ Pantalla táctil de 10.1"</li>
                <li>✓ Conectividad Apple CarPlay/Android Auto</li>
                <li>✓ Sistema de audio Premium</li>
                <li>✓ Bluetooth y USB</li>
                <li>✓ Climatizador automático bi-zona</li>
                <li>✓ Asientos calefactables</li>
                <li>✓ Volante multifunción en cuero</li>
              </ul>
            </div>

            <div class="equipment-category">
              <h4>🚗 Exterior</h4>
              <ul class="equipment-list">
                <li>✓ Llantas de aleación 18"</li>
                <li>✓ Faros LED con DRL</li>
                <li>✓ Luces traseras LED</li>
                <li>✓ Espejos exteriores eléctricos</li>
                <li>✓ Techo solar panorámico</li>
                <li>✓ Barras de techo</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- History Tab -->
        <div id="history" class="tab-panel">
          <h3>Historial del Vehículo</h3>
          <div class="history-timeline">
            <div class="history-item">
              <div class="history-date">2023-01-15</div>
              <div class="history-event">
                <h5>🚗 Primera matriculación</h5>
                <p>Vehículo matriculado como nuevo en Madrid</p>
              </div>
            </div>
            <div class="history-item">
              <div class="history-date">2023-06-20</div>
              <div class="history-event">
                <h5>🔧 Mantenimiento programado</h5>
                <p>Revisión a los 10.000 km en concesionario oficial</p>
              </div>
            </div>
            <div class="history-item">
              <div class="history-date">2023-12-10</div>
              <div class="history-event">
                <h5>📋 ITV pasada</h5>
                <p>Inspección técnica superada sin observaciones</p>
              </div>
            </div>
            <div class="history-item">
              <div class="history-date">2024-01-05</div>
              <div class="history-event">
                <h5>🛡️ Verificación disponible</h5>
                <p>Historial completo verificado por Guiders</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Financing Tab -->
        <div id="financing" class="tab-panel">
          <h3>Opciones de Financiación</h3>
          <div class="financing-calculator">
            <div class="calculator-inputs">
              <div class="input-group">
                <label for="downPayment">Entrada (€)</label>
                <input type="number" id="downPayment" value="5000" min="0" max="28500" 
                       data-track-event="calculate_financing" data-input-type="down_payment">
              </div>
              <div class="input-group">
                <label for="loanTerm">Plazo (meses)</label>
                <select id="loanTerm" data-track-event="calculate_financing" data-input-type="loan_term">
                  <option value="24">24 meses</option>
                  <option value="36">36 meses</option>
                  <option value="48" selected>48 meses</option>
                  <option value="60">60 meses</option>
                  <option value="72">72 meses</option>
                </select>
              </div>
              <div class="input-group">
                <label for="interestRate">Interés (%)</label>
                <input type="number" id="interestRate" value="6.5" min="0" max="15" step="0.1"
                       data-track-event="calculate_financing" data-input-type="interest_rate">
              </div>
            </div>
            
            <div class="calculator-results">
              <div class="result-item">
                <span class="result-label">Importe a financiar:</span>
                <span class="result-value" id="financeAmount">23.500 €</span>
              </div>
              <div class="result-item">
                <span class="result-label">Cuota mensual:</span>
                <span class="result-value result-highlight" id="monthlyPayment">245 €</span>
              </div>
              <div class="result-item">
                <span class="result-label">Total a pagar:</span>
                <span class="result-value" id="totalPayment">28.760 €</span>
              </div>
              <div class="result-item">
                <span class="result-label">Intereses totales:</span>
                <span class="result-value" id="totalInterest">260 €</span>
              </div>
            </div>

            <div class="financing-actions">
              <button class="btn btn-primary" 
                      data-track-event="request_quote" 
                      data-financing-type="traditional">
                📊 Solicitar Financiación
              </button>
              <button class="btn btn-secondary" 
                      data-track-event="chat_request_financing">
                💬 Consultar por Chat
              </button>
            </div>
          </div>
        </div>

        <!-- Location Tab -->
        <div id="location" class="tab-panel">
          <h3>Ubicación y Contacto</h3>
          <div class="location-info">
            <div class="dealer-info">
              <h4>Concesionario Audi Madrid Norte</h4>
              <div class="dealer-details">
                <p><strong>📍 Dirección:</strong> Calle Alcalá 123, 28028 Madrid</p>
                <p><strong>📞 Teléfono:</strong> +34 91 123 45 67</p>
                <p><strong>📧 Email:</strong> madrid.norte@audi.es</p>
                <p><strong>🕒 Horario:</strong> L-V 9:00-20:00, S 9:00-14:00</p>
              </div>
              <div class="dealer-actions">
                <button class="btn btn-primary" 
                        data-track-event="contact_dealer" 
                        data-contact-method="phone">
                  📞 Llamar Ahora
                </button>
                <button class="btn btn-secondary" 
                        data-track-event="schedule_test_drive">
                  🚗 Agendar Visita
                </button>
                <button class="btn btn-outline" 
                        data-track-event="chat_schedule_viewing">
                  💬 Chat con Asesor
                </button>
              </div>
            </div>
            
            <div class="location-map">
              <div class="map-placeholder" 
                   data-track-event="view_vehicle_location" 
                   data-location="madrid">
                <img src="https://dummyimage.com/500x300/e5e7eb/6b7280&text=Mapa+Interactivo" alt="Ubicación del concesionario">
                <div class="map-overlay">
                  <p>🗺️ Ver en mapa interactivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Related Vehicles -->
  <section class="related-vehicles-section">
    <div class="container">
      <h2>Vehículos Similares</h2>
      <div class="related-vehicles-grid">
        <div class="vehicle-card mini" data-track-event="view_product" data-related-vehicle="true">
          <img src="https://dummyimage.com/250x150/1e3a8a/fff&text=Audi+A4" alt="Audi A4">
          <div class="vehicle-info">
            <h4>Audi A4 Avant</h4>
            <p class="price">32.900 €</p>
            <button class="btn btn-sm btn-outline" data-track-event="view_vehicle_details">
              Ver Detalles
            </button>
          </div>
        </div>
        
        <div class="vehicle-card mini" data-track-event="view_product" data-related-vehicle="true">
          <img src="https://dummyimage.com/250x150/2563eb/fff&text=BMW+Serie+1" alt="BMW Serie 1">
          <div class="vehicle-info">
            <h4>BMW Serie 1</h4>
            <p class="price">29.500 €</p>
            <button class="btn btn-sm btn-outline" data-track-event="view_vehicle_details">
              Ver Detalles
            </button>
          </div>
        </div>
        
        <div class="vehicle-card mini" data-track-event="view_product" data-related-vehicle="true">
          <img src="https://dummyimage.com/250x150/3b82f6/fff&text=Mercedes+A-Class" alt="Mercedes Clase A">
          <div class="vehicle-info">
            <h4>Mercedes Clase A</h4>
            <p class="price">31.200 €</p>
            <button class="btn btn-sm btn-outline" data-track-event="view_vehicle_details">
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<style>
/* Vehicle Detail Specific Styles */
.breadcrumb-section {
  background: #f8f9fa;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.breadcrumb {
  font-size: 0.9rem;
  color: #6b7280;
}

.breadcrumb a {
  color: #1e3a8a;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.vehicle-detail-section {
  padding: 2rem 0;
}

.vehicle-detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

/* Gallery Styles */
.vehicle-gallery {
  position: relative;
}

.main-image {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.main-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.gallery-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  transform: translateY(-50%);
}

.gallery-prev,
.gallery-next {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.gallery-prev:hover,
.gallery-next:hover {
  background: rgba(0, 0, 0, 0.7);
}

.gallery-thumbnails {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  border: 2px solid transparent;
}

.thumbnail:hover,
.thumbnail.active {
  opacity: 1;
  border-color: #1e3a8a;
}

/* Vehicle Info Panel */
.vehicle-info-panel {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.vehicle-header h1 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.vehicle-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-new {
  background: #dcfce7;
  color: #166534;
}

.badge-warranty {
  background: #dbeafe;
  color: #1e40af;
}

.badge-eco {
  background: #d1fae5;
  color: #047857;
}

.vehicle-price-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.price-main {
  font-size: 2.5rem;
  font-weight: bold;
  color: #16a34a;
  margin-bottom: 0.5rem;
}

.price-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.price-before {
  text-decoration: line-through;
  color: #6b7280;
}

.price-discount {
  color: #dc2626;
  font-weight: 600;
}

.financing-options {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.financing-option {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-large {
  padding: 1rem;
  font-size: 1.1rem;
}

.quick-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.spec-label {
  color: #6b7280;
}

.spec-value {
  font-weight: 600;
  color: #1f2937;
}

.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn:hover {
  border-color: #1e3a8a;
  background: #f0f7ff;
}

/* Tabs Section */
.vehicle-tabs-section {
  background: #f8f9fa;
  padding: 3rem 0;
}

.tabs-navigation {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #f3f4f6;
}

.tab-btn.active {
  background: #1e3a8a;
  color: white;
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

/* Specifications Tab */
.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.specs-category h4 {
  color: #1e3a8a;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.spec-row:last-child {
  border-bottom: none;
}

/* Equipment Tab */
.equipment-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.equipment-category h4 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.equipment-list {
  list-style: none;
  padding: 0;
}

.equipment-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.equipment-list li:last-child {
  border-bottom: none;
}

/* History Tab */
.history-timeline {
  position: relative;
  padding-left: 2rem;
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.history-item {
  position: relative;
  margin-bottom: 2rem;
}

.history-item::before {
  content: '';
  position: absolute;
  left: -2.25rem;
  top: 0.5rem;
  width: 12px;
  height: 12px;
  background: #1e3a8a;
  border-radius: 50%;
}

.history-date {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.history-event h5 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.history-event p {
  color: #6b7280;
  margin: 0;
}

/* Financing Tab */
.financing-calculator {
  max-width: 600px;
}

.calculator-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.calculator-results {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-highlight {
  font-size: 1.25rem;
  font-weight: bold;
  color: #16a34a;
}

.financing-actions {
  display: flex;
  gap: 1rem;
}

/* Location Tab */
.location-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.dealer-info {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.dealer-info h4 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.dealer-details p {
  margin-bottom: 0.5rem;
}

.dealer-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-map {
  position: relative;
}

.map-placeholder {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.map-placeholder img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.map-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

/* Related Vehicles */
.related-vehicles-section {
  padding: 3rem 0;
}

.related-vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.vehicle-card.mini {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.vehicle-card.mini:hover {
  transform: translateY(-4px);
}

.vehicle-card.mini img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.vehicle-card.mini .vehicle-info {
  padding: 1rem;
}

.vehicle-card.mini h4 {
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.vehicle-card.mini .price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #16a34a;
  margin-bottom: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .vehicle-detail-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .vehicle-info-panel {
    position: static;
  }
  
  .tabs-navigation {
    flex-direction: column;
  }
  
  .tab-btn {
    flex: none;
  }
  
  .specs-grid,
  .equipment-categories {
    grid-template-columns: 1fr;
  }
  
  .location-info {
    grid-template-columns: 1fr;
  }
  
  .calculator-inputs {
    grid-template-columns: 1fr;
  }
  
  .financing-actions {
    flex-direction: column;
  }
  
  .secondary-actions {
    grid-template-columns: 1fr;
  }
}
</style>

<script>
// Vehicle Detail JavaScript
class VehicleDetail {
  constructor() {
    this.currentImageIndex = 0;
    this.images = [
      'https://dummyimage.com/800x500/1e3a8a/fff&text=Audi+A3+Principal',
      'https://dummyimage.com/800x500/2563eb/fff&text=Audi+A3+Interior',
      'https://dummyimage.com/800x500/3b82f6/fff&text=Audi+A3+Motor',
      'https://dummyimage.com/800x500/60a5fa/fff&text=Audi+A3+Lateral',
      'https://dummyimage.com/800x500/93c5fd/fff&text=Audi+A3+Trasera'
    ];
    
    this.init();
  }
  
  init() {
    this.setupGallery();
    this.setupTabs();
    this.setupFinancingCalculator();
    this.setupTrackingEvents();
    this.trackPageView();
  }
  
  setupGallery() {
    // Gallery navigation
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    const mainImage = document.getElementById('mainVehicleImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentImageIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : this.images.length - 1;
        this.updateMainImage();
        this.trackEvent('gallery_navigation', { direction: 'previous', imageIndex: this.currentImageIndex });
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentImageIndex = this.currentImageIndex < this.images.length - 1 ? this.currentImageIndex + 1 : 0;
        this.updateMainImage();
        this.trackEvent('gallery_navigation', { direction: 'next', imageIndex: this.currentImageIndex });
      });
    }
    
    // Thumbnail clicks
    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        this.currentImageIndex = index;
        this.updateMainImage();
        this.updateThumbnails();
        this.trackEvent('gallery_thumbnail_click', { imageIndex: index });
      });
    });
  }
  
  updateMainImage() {
    const mainImage = document.getElementById('mainVehicleImage');
    if (mainImage) {
      mainImage.src = this.images[this.currentImageIndex];
    }
    this.updateThumbnails();
  }
  
  updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === this.currentImageIndex);
    });
  }
  
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        button.classList.add('active');
        const targetPanel = document.getElementById(targetTab);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
        
        this.trackEvent('tab_navigation', { tab: targetTab });
      });
    });
  }
  
  setupFinancingCalculator() {
    const downPaymentInput = document.getElementById('downPayment');
    const loanTermSelect = document.getElementById('loanTerm');
    const interestRateInput = document.getElementById('interestRate');
    
    if (downPaymentInput && loanTermSelect && interestRateInput) {
      [downPaymentInput, loanTermSelect, interestRateInput].forEach(input => {
        input.addEventListener('change', () => {
          this.calculateFinancing();
        });
        input.addEventListener('input', () => {
          this.calculateFinancing();
        });
      });
      
      // Initial calculation
      this.calculateFinancing();
    }
  }
  
  calculateFinancing() {
    const vehiclePrice = 28500;
    const downPayment = parseFloat(document.getElementById('downPayment')?.value || '0');
    const loanTerm = parseInt(document.getElementById('loanTerm')?.value || '48');
    const interestRate = parseFloat(document.getElementById('interestRate')?.value || '6.5') / 100;
    
    const financeAmount = vehiclePrice - downPayment;
    const monthlyRate = interestRate / 12;
    const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1);
    const totalPayment = (monthlyPayment * loanTerm) + downPayment;
    const totalInterest = totalPayment - vehiclePrice;
    
    // Update display
    document.getElementById('financeAmount').textContent = `${financeAmount.toLocaleString()} €`;
    document.getElementById('monthlyPayment').textContent = `${Math.round(monthlyPayment)} €`;
    document.getElementById('totalPayment').textContent = `${Math.round(totalPayment).toLocaleString()} €`;
    document.getElementById('totalInterest').textContent = `${Math.round(totalInterest).toLocaleString()} €`;
    
    this.trackEvent('financing_calculation', {
      vehiclePrice,
      downPayment,
      loanTerm,
      interestRate: interestRate * 100,
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(totalInterest)
    });
  }
  
  setupTrackingEvents() {
    // Action buttons tracking
    document.querySelectorAll('[data-track-event]').forEach(element => {
      if (!element.hasAttribute('data-listener-added')) {
        const eventType = element.dataset.trackEvent;
        const eventHandler = element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'select' ? 'change' : 'click';
        
        element.addEventListener(eventHandler, (e) => {
          const trackingData = this.extractTrackingData(element);
          this.trackEvent(eventType, trackingData);
          
          // Handle specific actions
          this.handleSpecialActions(eventType, trackingData, e);
        });
        
        element.setAttribute('data-listener-added', 'true');
      }
    });
  }
  
  extractTrackingData(element) {
    const data = {};
    
    // Extract all data-* attributes
    Object.keys(element.dataset).forEach(key => {
      if (key !== 'trackEvent' && key !== 'listenerAdded') {
        data[key] = element.dataset[key];
      }
    });
    
    return data;
  }
  
  handleSpecialActions(eventType, data, event) {
    switch (eventType) {
      case 'contact_dealer':
        this.showContactModal(data);
        break;
      case 'schedule_test_drive':
        this.showTestDriveModal(data);
        break;
      case 'request_quote':
        this.showQuoteModal(data);
        break;
      case 'add_to_favorites':
        this.toggleFavorite(data);
        break;
      case 'add_to_comparison':
        this.addToComparison(data);
        break;
      case 'share_comparison':
        this.shareVehicle(data);
        break;
      case 'download_brochure':
        this.downloadBrochure(data);
        break;
      case 'chat_ask_about_vehicle':
      case 'chat_request_financing':
      case 'chat_schedule_viewing':
        this.openChatWithContext(eventType, data);
        break;
    }
  }
  
  showContactModal(data) {
    alert(`📞 Contactando con el concesionario sobre ${data.vehicleId || 'este vehículo'}...`);
  }
  
  showTestDriveModal(data) {
    alert(`🚗 Solicitando prueba de conducción para ${data.vehicleId || 'este vehículo'}...`);
  }
  
  showQuoteModal(data) {
    alert(`💰 Solicitando cotización para ${data.vehicleId || 'este vehículo'}...`);
  }
  
  toggleFavorite(data) {
    const button = event.target;
    const isFavorite = button.textContent.includes('♥');
    
    if (isFavorite) {
      button.textContent = '♡ Añadir a Favoritos';
      alert('❌ Eliminado de favoritos');
    } else {
      button.textContent = '♥ En Favoritos';
      alert('✅ Añadido a favoritos');
    }
  }
  
  addToComparison(data) {
    // Get existing comparison from localStorage
    const comparison = JSON.parse(localStorage.getItem('vehicleComparison') || '[]');
    
    if (comparison.length >= 3) {
      alert('⚖️ Ya tienes 3 vehículos para comparar. Elimina uno primero.');
      return;
    }
    
    const vehicleData = {
      id: data.vehicleId,
      brand: data.vehicleBrand || 'Audi',
      model: data.vehicleModel || 'A3',
      price: 28500,
      year: 2023,
      fuel: 'Gasolina',
      power: 150
    };
    
    comparison.push(vehicleData);
    localStorage.setItem('vehicleComparison', JSON.stringify(comparison));
    
    alert(`✅ Vehículo añadido a comparación (${comparison.length}/3)`);
  }
  
  shareVehicle(data) {
    const shareUrl = `${window.location.origin}/vehicle-detail?id=${data.vehicleId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Audi A3 Sportback',
        text: 'Echa un vistazo a este vehículo',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('🔗 Enlace copiado al portapapeles');
      });
    }
  }
  
  downloadBrochure(data) {
    // Simulate brochure download
    alert('📄 Descargando folleto del vehículo...');
    this.trackEvent('brochure_download_started', data);
  }
  
  openChatWithContext(eventType, data) {
    // This would integrate with the chat system
    const messages = {
      'chat_ask_about_vehicle': '¡Hola! Me interesa este Audi A3. ¿Podrían darme más información?',
      'chat_request_financing': '¡Hola! Me gustaría conocer las opciones de financiación para este vehículo.',
      'chat_schedule_viewing': '¡Hola! ¿Podría agendar una cita para ver este vehículo?'
    };
    
    const message = messages[eventType] || '¡Hola! Me interesa este vehículo.';
    alert(`💬 Iniciando chat: "${message}"`);
  }
  
  trackEvent(eventName, data = {}) {
    // Send to Guiders SDK if available
    if (window.guiders && typeof window.guiders.track === 'function') {
      window.guiders.track({
        event: eventName,
        ...data,
        timestamp: Date.now(),
        page: 'vehicle_detail',
        vehicleId: new URLSearchParams(window.location.search).get('id') || 'v001'
      });
    }
    
    console.log('🔍 Tracking event:', eventName, data);
  }
  
  trackPageView() {
    const vehicleId = new URLSearchParams(window.location.search).get('id') || 'v001';
    this.trackEvent('page_view', {
      page: 'vehicle_detail',
      vehicleId: vehicleId,
      pageTitle: 'Detalle del Vehículo'
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.vehicleDetail = new VehicleDetail();
});

// Include Guiders SDK
document.addEventListener('DOMContentLoaded', function() {
  // Mock API key for demo
  const script = document.createElement('script');
  script.src = 'https://guiders-sdk.s3.eu-north-1.amazonaws.com/0.0.1/index.js';
  script.setAttribute('data-api-key', 'demo-vehicle-detail-key');
  document.head.appendChild(script);
});
</script>

<?php include __DIR__ . '/../partials/footer.php'; ?>
