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
  <!-- Page will be automatically detected via URL as 'vehicle_search' -->
  
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <h1>🚗 Encuentra tu vehículo ideal</h1>
        <p class="hero-subtitle">Explora nuestra amplia gama de vehículos nuevos, de ocasión, km0, comerciales y renting</p>
      </div>
    </div>
  </section>

  <!-- Search Section -->
  <section class="search-section">
    <div class="container">
      <div class="search-container">
        <h2>Buscar Vehículos</h2>
        
        <form class="vehicle-search-form" id="vehicleSearchForm">
          <!-- Tipo de vehículo y campos principales -->
          <div class="search-row">
            <div class="form-group">
              <label for="vehicleType">Tipo de vehículo</label>
              <select id="vehicleType" name="vehicleType" class="search-filter">
                <option value="">Seleccionar tipo</option>
                <option value="nuevo">🚗 Vehículo nuevo</option>
                <option value="ocasion">🔄 Vehículo de ocasión</option>
                <option value="km0">⭐ Vehículo km0</option>
                <option value="comercial">🚚 Vehículo comercial</option>
                <option value="renting">📋 Renting</option>
              </select>
            </div>

            <div class="form-group">
              <label for="brand">Marca</label>
              <select id="brand" name="brand" class="search-filter">
                <option value="">Seleccionar marca</option>
                <option value="audi">Audi</option>
                <option value="bmw">BMW</option>
                <option value="mercedes">Mercedes-Benz</option>
                <option value="volkswagen">Volkswagen</option>
                <option value="seat">SEAT</option>
                <option value="toyota">Toyota</option>
                <option value="ford">Ford</option>
                <option value="nissan">Nissan</option>
                <option value="mazda">Mazda</option>
              </select>
            </div>

            <div class="form-group">
              <label for="model">Modelo</label>
              <select id="model" name="model" class="search-filter">
                <option value="">Seleccionar modelo</option>
                <option value="a3">A3</option>
                <option value="serie3">Serie 3</option>
                <option value="clase-c">Clase C</option>
                <option value="golf">Golf</option>
                <option value="leon">León</option>
                <option value="focus">Focus</option>
                <option value="qashqai">Qashqai</option>
                <option value="cx5">CX-5</option>
              </select>
            </div>
          </div>

          <!-- Combustible y tipo de precio -->
          <div class="search-row">
            <div class="form-group">
              <label for="fuelType">Combustible</label>
              <select id="fuelType" name="fuelType" 
                      data-track-event="search_fuel"
                      data-search-type="fuel_type">
                <option value="">Todos los combustibles</option>
                <option value="gasolina">⛽ Gasolina</option>
                <option value="diesel">🛢️ Diésel</option>
                <option value="hibrido">🔋 Híbrido</option>
                <option value="electrico">⚡ Eléctrico</option>
                <option value="glp">🔥 GLP</option>
              </select>
            </div>

            <div class="form-group">
              <label for="priceType">Búsqueda por</label>
              <select id="priceType" name="priceType" 
                      data-track-event="search_price_type"
                      data-search-type="price_type">
                <option value="price">💰 Precio total</option>
                <option value="payment">📅 Cuota mensual</option>
              </select>
            </div>

            <div class="form-group">
              <label for="maxPrice">Precio máximo</label>
              <div class="price-slider-container">
                <input type="range" 
                       id="maxPrice" 
                       min="5000" 
                       max="100000" 
                       step="1000" 
                       value="30000"
                       data-track-event="filter_by_price"
                       data-filter-type="price_range">
                <span class="price-display">30.000 €</span>
              </div>
            </div>
          </div>

          <!-- Botón para filtros avanzados -->
          <div class="search-row">
            <button type="button" 
                    class="btn btn-outline advanced-filters-toggle"
                    data-track-event="toggle_advanced_filters"
                    data-action="toggle_filters">
              🔧 Filtros Avanzados
            </button>
          </div>

          <!-- Filtros adicionales -->
          <div class="search-row advanced-filters">
            <div class="form-group">
              <label for="yearFrom">Año desde</label>
              <select id="yearFrom" name="yearFrom" 
                      data-track-event="filter_by_year"
                      data-filter-type="year_from">
                <option value="">Cualquier año</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
                <option value="2018">2018</option>
              </select>
            </div>

            <div class="form-group">
              <label for="transmission">Transmisión</label>
              <select id="transmission" name="transmission" 
                      data-track-event="filter_by_transmission"
                      data-filter-type="transmission">
                <option value="">Cualquier transmisión</option>
                <option value="manual">Manual</option>
                <option value="automatico">Automático</option>
                <option value="secuencial">Secuencial</option>
              </select>
            </div>

            <div class="form-group">
              <label for="doors">Puertas</label>
              <select id="doors" name="doors" 
                      data-track-event="filter_by_doors"
                      data-filter-type="doors">
                <option value="">Cualquier número</option>
                <option value="3">3 puertas</option>
                <option value="5">5 puertas</option>
                <option value="4">4 puertas (sedan)</option>
              </select>
            </div>
          </div>

          <!-- Búsqueda libre -->
          <div class="search-row">
            <div class="form-group search-input-group">
              <label for="freeSearch">Búsqueda libre</label>
              <input type="text" 
                     id="freeSearch" 
                     name="freeSearch" 
                     placeholder="Ej: Audi A3 2020 automático blanco Madrid..."
                     data-track-event="search_input"
                     data-search-type="free_text">
            </div>
          </div>
                <option value="suzuki">Suzuki</option>
                <option value="honda">Honda</option>
                <option value="toyota">Toyota</option>
                <option value="volkswagen">Volkswagen</option>
              </select>
            </div>

            <div class="form-group">
              <label for="model">Modelo</label>
              <select id="model" name="model" 
                      data-track-event="search_model"
                      data-search-type="model">
                <option value="">Seleccionar modelo</option>
                <option value="focus">Focus</option>
                <option value="fiesta">Fiesta</option>
                <option value="kuga">Kuga</option>
                <option value="qashqai">Qashqai</option>
                <option value="civic">Civic</option>
              </select>
            </div>
          </div>

          <div class="search-row">
            <div class="form-group">
              <label for="fuel">Combustible</label>
              <select id="fuel" name="fuel" 
                      data-track-event="search_fuel"
                      data-search-type="fuel">
                <option value="">Seleccionar combustible</option>
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diésel</option>
                <option value="hibrido">Híbrido</option>
                <option value="electrico">Eléctrico</option>
                <option value="glp">GLP</option>
              </select>
            </div>

            <div class="form-group">
              <label for="priceType">Buscar por</label>
              <select id="priceType" name="priceType" 
                      data-track-event="search_price_type"
                      data-search-type="price_type">
                <option value="precio">Precio total</option>
                <option value="cuota">Cuota mensual</option>
              </select>
            </div>

            <div class="form-group">
              <label for="priceRange">Rango de precio</label>
              <select id="priceRange" name="priceRange" 
                      data-track-event="filter_by_price"
                      data-filter-type="price_range">
                <option value="">Cualquier precio</option>
                <option value="0-10000">Hasta 10.000€</option>
                <option value="10000-20000">10.000€ - 20.000€</option>
                <option value="20000-30000">20.000€ - 30.000€</option>
                <option value="30000-50000">30.000€ - 50.000€</option>
                <option value="50000+">Más de 50.000€</option>
              </select>
            </div>
          </div>

          <div class="search-actions">
            <button type="submit" class="btn btn-primary search-submit-btn">
              🔍 Buscar Vehículos
            </button>
            <button type="reset" class="btn btn-secondary">
              🗑️ Limpiar filtros
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>

  <!-- Results Section -->
  <section class="results-section">
    <div class="container">
      <div class="results-header">
        <h2>Resultados de búsqueda</h2>
        <div class="sort-controls">
          <label for="sortBy">Ordenar por:</label>
          <select id="sortBy" name="sortBy" 
                  data-track-event="sort_vehicles"
                  data-sort-type="vehicles">
            <option value="relevance">Relevancia</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="year_desc">Año: más reciente</option>
            <option value="km_asc">Kilómetros: menor a mayor</option>
            <option value="brand">Marca A-Z</option>
          </select>
        </div>
      </div>

      <div class="vehicle-grid">
        <!-- Vehículo 1: Audi A3 -->
        <div class="vehicle-card"
             data-track-event="view_product"
             data-vehicle-id="v001"
             data-vehicle-brand="Audi"
             data-vehicle-model="A3"
             data-vehicle-location="Madrid"
             data-vehicle-price="28500">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/400x250/1e3a8a/fff&text=Audi+A3+Sportback" alt="Audi A3 Sportback">
            <button class="btn-favorite"
                    data-track-event="add_to_favorites"
                    data-vehicle-id="v001"
                    data-vehicle-brand="Audi"
                    data-vehicle-model="A3">
              ♡
            </button>
          </div>
          <div class="vehicle-info">
            <h3>Audi A3 Sportback 1.5 TFSI</h3>
            <p class="vehicle-details">2022 • 15.000 km • Gasolina • Automático</p>
            <p class="vehicle-location">📍 Madrid, España</p>
            <div class="vehicle-price">28.500 €</div>
            <p class="vehicle-payment">Desde 245 €/mes</p>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v001"
                      data-vehicle-location="Madrid">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v001"
                      data-vehicle-brand="Audi"
                      data-vehicle-model="A3">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v001"
                    data-vehicle-price="28500"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>

        <!-- Vehículo 2: BMW Serie 3 -->
        <div class="vehicle-card"
             data-track-event="view_product"
             data-vehicle-id="v002"
             data-vehicle-brand="BMW"
             data-vehicle-model="Serie 3"
             data-vehicle-location="Barcelona"
             data-vehicle-price="32900">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/400x250/1e3a8a/fff&text=BMW+Serie+3+320d" alt="BMW Serie 3 320d">
            <button class="btn-favorite"
                    data-track-event="add_to_favorites"
                    data-vehicle-id="v002"
                    data-vehicle-brand="BMW"
                    data-vehicle-model="Serie 3">
              ♡
            </button>
          </div>
          <div class="vehicle-info">
            <h3>BMW Serie 3 320d xDrive</h3>
            <p class="vehicle-details">2021 • 28.000 km • Diésel • Automático</p>
            <p class="vehicle-location">📍 Barcelona, España</p>
            <div class="vehicle-price">32.900 €</div>
            <p class="vehicle-payment">Desde 285 €/mes</p>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v002"
                      data-vehicle-location="Barcelona">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v002"
                      data-vehicle-brand="BMW"
                      data-vehicle-model="Serie 3">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v002"
                    data-vehicle-price="32900"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>

        <!-- Vehículo 3: Mercedes Clase C -->
        <div class="vehicle-card"
             data-track-event="view_product"
             data-vehicle-id="v003"
             data-vehicle-brand="Mercedes"
             data-vehicle-model="Clase C"
             data-vehicle-location="Valencia"
             data-vehicle-price="35800">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/400x250/1e3a8a/fff&text=Mercedes+Clase+C+200" alt="Mercedes Clase C 200">
            <button class="btn-favorite"
                    data-track-event="add_to_favorites"
                    data-vehicle-id="v003"
                    data-vehicle-brand="Mercedes"
                    data-vehicle-model="Clase C">
              ♡
            </button>
          </div>
          <div class="vehicle-info">
            <h3>Mercedes Clase C 200 Hybrid</h3>
            <p class="vehicle-details">2023 • 8.500 km • Híbrido • Automático</p>
            <p class="vehicle-location">📍 Valencia, España</p>
            <div class="vehicle-price">35.800 €</div>
            <p class="vehicle-payment">Desde 310 €/mes</p>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v003"
                      data-vehicle-location="Valencia">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v003"
                      data-vehicle-brand="Mercedes"
                      data-vehicle-model="Clase C">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v003"
                    data-vehicle-price="35800"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>

        <!-- Vehículo 4: Tesla Model 3 -->
        <div class="vehicle-card"
             data-track-event="view_product"
             data-vehicle-id="v004"
             data-vehicle-brand="Tesla"
             data-vehicle-model="Model 3"
             data-vehicle-location="Sevilla"
             data-vehicle-price="42000">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/400x250/1e3a8a/fff&text=Tesla+Model+3" alt="Tesla Model 3">
            <button class="btn-favorite"
                    data-track-event="add_to_favorites"
                    data-vehicle-id="v004"
                    data-vehicle-brand="Tesla"
                    data-vehicle-model="Model 3">
              ♡
            </button>
          </div>
          <div class="vehicle-info">
            <h3>Tesla Model 3 Long Range</h3>
            <p class="vehicle-details">2022 • 12.000 km • Eléctrico • Automático</p>
            <p class="vehicle-location">📍 Sevilla, España</p>
            <div class="vehicle-price">42.000 €</div>
            <p class="vehicle-payment">Desde 365 €/mes</p>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v004"
                      data-vehicle-location="Sevilla">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v004"
                      data-vehicle-brand="Tesla"
                      data-vehicle-model="Model 3">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v004"
                    data-vehicle-price="42000"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>

        <!-- Vehículo 5: Volkswagen Golf -->
        <div class="vehicle-card"
             data-track-event="view_product"
             data-vehicle-id="v005"
             data-vehicle-brand="Volkswagen"
             data-vehicle-model="Golf"
             data-vehicle-location="Bilbao"
             data-vehicle-price="24900">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/400x250/1e3a8a/fff&text=VW+Golf+GTI" alt="Volkswagen Golf GTI">
            <button class="btn-favorite"
                    data-track-event="add_to_favorites"
                    data-vehicle-id="v005"
                    data-vehicle-brand="Volkswagen"
                    data-vehicle-model="Golf">
              ♡
            </button>
          </div>
          <div class="vehicle-info">
            <h3>Volkswagen Golf 8 GTI</h3>
            <p class="vehicle-details">2021 • 22.000 km • Gasolina • Manual</p>
            <p class="vehicle-location">📍 Bilbao, España</p>
            <div class="vehicle-price">24.900 €</div>
            <p class="vehicle-payment">Desde 215 €/mes</p>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v005"
                      data-vehicle-location="Bilbao">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v005"
                      data-vehicle-brand="Volkswagen"
                      data-vehicle-model="Golf">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v005"
                    data-vehicle-price="24900"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>

        <!-- Vehículo 6: SEAT León -->
        <div class="vehicle-card"
             data-track-event="view_product"
             data-vehicle-id="v006"
             data-vehicle-brand="SEAT"
             data-vehicle-model="León"
             data-vehicle-location="Zaragoza"
             data-vehicle-price="19500">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/400x250/1e3a8a/fff&text=SEAT+Leon+FR" alt="SEAT León FR">
            <button class="btn-favorite"
                    data-track-event="add_to_favorites"
                    data-vehicle-id="v006"
                    data-vehicle-brand="SEAT"
                    data-vehicle-model="León">
              ♡
            </button>
          </div>
          <div class="vehicle-info">
            <h3>SEAT León 1.5 TSI FR</h3>
            <p class="vehicle-details">2020 • 35.000 km • Gasolina • Manual</p>
            <p class="vehicle-location">📍 Zaragoza, España</p>
            <div class="vehicle-price">19.500 €</div>
            <p class="vehicle-payment">Desde 168 €/mes</p>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v006"
                      data-vehicle-location="Zaragoza">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v006"
                      data-vehicle-brand="SEAT"
                      data-vehicle-model="León">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v006"
                    data-vehicle-price="19500"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>
      </div>
            <div class="vehicle-actions">
              <button class="btn btn-primary">Ver detalles</button>
              <button class="btn-favorite"
                      data-track-event="add_to_favorites"
                      data-vehicle-id="v002"
                      data-vehicle-brand="Nissan"
                      data-vehicle-model="Qashqai">
                ❤️ Favorito
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v002"
                    data-vehicle-price="28900"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>

        <!-- Vehículo 3 -->
        <div class="vehicle-card"
             data-track-event="view_vehicle_location"
             data-vehicle-id="v003"
             data-vehicle-brand="Toyota"
             data-vehicle-model="Corolla"
             data-vehicle-location="Valencia"
             data-vehicle-price="25600">
          <div class="vehicle-image">
            <img src="https://dummyimage.com/300x200/1e3a8a/fff&text=Toyota+Corolla" alt="Toyota Corolla">
          </div>
          <div class="vehicle-info">
            <h3>Toyota Corolla Hybrid</h3>
            <p class="vehicle-details">2023 • 8.500 km • Híbrido</p>
            <p class="vehicle-location">📍 Valencia, España</p>
            <div class="vehicle-price">25.600 €</div>
            <div class="vehicle-actions">
              <button class="btn btn-outline"
                      data-track-event="view_vehicle_location"
                      data-vehicle-id="v003"
                      data-vehicle-location="Valencia">
                📍 Ver ubicación
              </button>
              <button class="btn btn-primary">🔍 Ver detalles</button>
              <button class="btn btn-secondary compare-vehicle-btn"
                      data-track-event="add_to_comparison"
                      data-vehicle-id="v003"
                      data-vehicle-brand="Toyota"
                      data-vehicle-model="Corolla">
                ⚖️ Comparar
              </button>
            </div>
            <button class="financing-calculator-btn"
                    data-track-event="calculate_financing"
                    data-vehicle-id="v003"
                    data-vehicle-price="25600"
                    data-financing-type="calculator">
              🧮 Calcular financiación
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Financing Calculator Section -->
  <section class="financing-section">
    <div class="container">
      <div class="financing-card">
        <h3>🧮 Calculadora de Financiación</h3>
        <p class="financing-subtitle">Calcula tu cuota mensual personalizada</p>
        
        <form class="financing-form" id="financingForm">
          <div class="form-row">
            <div class="form-group">
              <label for="vehiclePrice">Precio del vehículo (€)</label>
              <input type="number" 
                     id="vehiclePrice" 
                     name="vehiclePrice"
                     value="30000" 
                     min="1000" 
                     max="200000"
                     step="100"
                     data-track-event="filter_by_price" 
                     data-filter-type="vehicle_price">
            </div>
            
            <div class="form-group">
              <label for="downPayment">Entrada (€)</label>
              <input type="number" 
                     id="downPayment" 
                     name="downPayment"
                     value="6000" 
                     min="0"
                     step="100"
                     data-track-event="filter_by_payment" 
                     data-filter-type="down_payment">
            </div>
            
            <div class="form-group">
              <label for="loanTerm">Plazo (meses)</label>
              <select id="loanTerm" 
                      name="loanTerm"
                      data-track-event="filter_by_payment" 
                      data-filter-type="loan_term">
                <option value="36">36 meses (3 años)</option>
                <option value="48">48 meses (4 años)</option>
                <option value="60" selected>60 meses (5 años)</option>
                <option value="72">72 meses (6 años)</option>
                <option value="84">84 meses (7 años)</option>
              </select>
            </div>
            
            <button type="button" 
                    class="btn btn-primary"
                    data-track-event="calculate_financing" 
                    data-financing-type="calculate_payment"
                    onclick="calculatePayment()">
              🧮 Calcular
            </button>
          </div>
          
          <div class="calculation-result" id="calculationResult" style="display: none;">
            <h4>📊 Resultado del cálculo</h4>
            <div class="result-grid">
              <div class="result-item">
                <span class="result-label">💰 Cantidad financiada:</span>
                <span class="result-value" id="loanAmount">- €</span>
              </div>
              <div class="result-item highlight">
                <span class="result-label">📅 Cuota mensual:</span>
                <span class="result-value" id="monthlyPayment">- €</span>
              </div>
              <div class="result-item">
                <span class="result-label">💸 Total intereses:</span>
                <span class="result-value" id="totalInterest">- €</span>
              </div>
              <div class="result-item">
                <span class="result-label">🏁 Total a pagar:</span>
                <span class="result-value" id="totalPayment">- €</span>
              </div>
            </div>
            
            <div class="financing-info">
              <p class="info-text">
                <strong>ℹ️ Información:</strong> Cálculo orientativo con TIN 4,5% anual. 
                Las condiciones finales pueden variar según tu perfil crediticio.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  </section>

</main>

<style>
/* Estilos específicos para la calculadora de financiación */
.financing-section {
  padding: 3rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.financing-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
  max-width: 800px;
  margin: 0 auto;
}

.financing-card h3 {
  color: #1e3a8a;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
}

.financing-subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.financing-form .form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  align-items: end;
  margin-bottom: 2rem;
}

.calculation-result {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
  border: 2px solid #bae6fd;
}

.calculation-result h4 {
  color: #1e3a8a;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.result-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
}

.result-item.highlight {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  border-color: #1e3a8a;
}

.result-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.result-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e3a8a;
}

.result-item.highlight .result-label,
.result-item.highlight .result-value {
  color: white;
}

.financing-info {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.info-text {
  margin: 0;
  font-size: 0.9rem;
  color: #92400e;
  line-height: 1.5;
}

/* Actualizar estilos del slider de precio */
.price-slider-container {
  position: relative;
}

.price-display {
  display: inline-block;
  background: #1e3a8a;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1e3a8a;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1e3a8a;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Botones de favoritos mejorados */
.btn-favorite {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  color: #6b7280;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.btn-favorite:hover {
  background: rgba(255, 255, 255, 1);
  color: #dc2626;
  transform: scale(1.1);
}

.btn-favorite.active {
  background: #dc2626;
  color: white;
}

.vehicle-image {
  position: relative;
}

@media (max-width: 768px) {
  .financing-form .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .financing-card {
    padding: 1.5rem;
  }
  
  .result-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}
/* Filtros avanzados */
.advanced-filters {
  border-top: 2px solid #e5e7eb;
  padding-top: 1.5rem;
  margin-top: 1rem;
}

.advanced-filters-toggle {
  background: #f8f9fa;
  color: #1e3a8a;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.advanced-filters-toggle:hover {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
  transform: translateY(-1px);
}

.advanced-filters-toggle.active {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
}

/* Resultados con transiciones */
.vehicle-card {
  transition: all 0.3s ease;
}

.vehicle-card.filtered {
  opacity: 0.3;
  transform: scale(0.95);
}

/* Indicador de búsqueda activa */
.search-input-group {
  position: relative;
}

.search-input-group input:focus {
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.search-input-group::after {
  content: '🔍';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 1rem;
  opacity: 0.5;
}

/* Animación para nuevos resultados */
@keyframes resultFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.vehicle-card.new-result {
  animation: resultFadeIn 0.3s ease-out;
}

.search-section {
  padding: 3rem 0;
  background-color: #f8f9fa;
}

.search-container {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.search-container h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #1f2937;
  font-size: 1.75rem;
  font-weight: 700;
}

.search-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-group select {
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  transition: all 0.3s ease;
}

.form-group select:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.search-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* Results Section */
.results-section {
  padding: 4rem 0;
  background: white;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-header h2 {
  color: #1f2937;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-controls label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.sort-controls select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: white;
}

/* Vehicle Grid */
.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.vehicle-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.vehicle-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.vehicle-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.vehicle-info {
  padding: 1.5rem;
}

.vehicle-info h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.vehicle-details {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.vehicle-location {
  color: #1e3a8a;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.vehicle-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.vehicle-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.btn-favorite {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-favorite:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-favorite.active {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.financing-calculator-btn {
  width: 100%;
  background: #f8f9fa;
  color: #1e3a8a;
  border: 2px solid #e5e7eb;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.financing-calculator-btn:hover {
  background: #1e3a8a;
  color: white;
  border-color: #1e3a8a;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-row {
    grid-template-columns: 1fr;
  }
  
  .search-actions {
    flex-direction: column;
  }
  
  .results-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .vehicle-grid {
    grid-template-columns: 1fr;
  }
  
  .vehicle-actions {
    flex-direction: column;
  }
}
</style>

<script>
// Función para calcular financiación
function calculatePayment() {
  const price = parseFloat(document.getElementById('vehiclePrice').value);
  const downPayment = parseFloat(document.getElementById('downPayment').value);
  const term = parseInt(document.getElementById('loanTerm').value);
  const interestRate = 0.045; // 4.5% anual
  
  const loanAmount = price - downPayment;
  const monthlyRate = interestRate / 12;
  const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                        (Math.pow(1 + monthlyRate, term) - 1);
  const totalPayment = monthlyPayment * term + downPayment;
  const totalInterest = totalPayment - price;
  
  // Actualizar la UI
  document.getElementById('loanAmount').textContent = 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(loanAmount);
  
  document.getElementById('monthlyPayment').textContent = 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(monthlyPayment);
  
  document.getElementById('totalInterest').textContent = 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(totalInterest);
  
  document.getElementById('totalPayment').textContent = 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(totalPayment);
  
  // Mostrar resultados
  document.getElementById('calculationResult').style.display = 'block';
  
  // Scroll suave hacia los resultados
  document.getElementById('calculationResult').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
}

// Tracking de eventos específicos
document.addEventListener('DOMContentLoaded', function() {
  
  // Actualizar visualización del precio
  const priceSlider = document.getElementById('maxPrice');
  if (priceSlider) {
    priceSlider.addEventListener('input', function() {
      document.querySelector('.price-display').textContent = 
        new Intl.NumberFormat('es-ES').format(this.value) + ' €';
    });
  }
  
  // Tracking de favoritos
  document.querySelectorAll('.btn-favorite').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      this.textContent = this.classList.contains('active') ? '♥' : '♡';
      
      const vehicleId = this.getAttribute('data-vehicle-id');
      const brand = this.getAttribute('data-vehicle-brand');
      const model = this.getAttribute('data-vehicle-model');
      
      console.log('❤️ Favorite Tracking:', {
        event_type: 'add_to_favorites',
        vehicle_id: vehicleId,
        brand: brand,
        model: model,
        action: this.classList.contains('active') ? 'add' : 'remove',
        timestamp: new Date().toISOString()
      });
    });
  });

  // Tracking de calculadora desde botones de vehículos
  document.querySelectorAll('.financing-calculator-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const vehicleId = this.getAttribute('data-vehicle-id');
      const price = this.getAttribute('data-vehicle-price');
      
      // Llenar la calculadora con los datos del vehículo
      document.getElementById('vehiclePrice').value = price;
      
      // Scroll hacia la calculadora
      document.querySelector('.financing-section').scrollIntoView({ 
        behavior: 'smooth' 
      });
      
      // Tracking del evento
      console.log('🧮 Financing Calculator Tracking:', {
        event_type: 'calculate_financing',
        vehicle_id: vehicleId,
        vehicle_price: price,
        source: 'vehicle_card',
        timestamp: new Date().toISOString()
      });
    });
  });

  // Toggle de filtros avanzados
  const advancedFiltersToggle = document.querySelector('.advanced-filters-toggle');
  const advancedFilters = document.querySelector('.advanced-filters');
  
  if (advancedFiltersToggle && advancedFilters) {
    // Ocultar filtros inicialmente
    advancedFilters.style.display = 'none';
    
    advancedFiltersToggle.addEventListener('click', function() {
      const isVisible = advancedFilters.style.display !== 'none';
      
      if (isVisible) {
        advancedFilters.style.display = 'none';
        this.textContent = '🔧 Filtros Avanzados';
        this.classList.remove('active');
      } else {
        advancedFilters.style.display = 'grid';
        this.textContent = '🔧 Ocultar Filtros';
        this.classList.add('active');
        
        // Smooth scroll para mostrar los filtros
        setTimeout(() => {
          advancedFilters.scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }
      
      // Tracking del toggle
      console.log('🔧 Advanced Filters Toggle:', {
        event_type: 'toggle_advanced_filters',
        action: isVisible ? 'hide' : 'show',
        timestamp: new Date().toISOString()
      });
    });
  }

  // Búsqueda predictiva en tiempo real
  const freeSearchInput = document.getElementById('freeSearch');
  if (freeSearchInput) {
    let searchTimeout;
    
    freeSearchInput.addEventListener('input', function() {
      const query = this.value;
      
      // Debounce para evitar demasiadas búsquedas
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (query.length >= 3) {
          console.log('🔍 Predictive Search:', {
            event_type: 'predictive_search',
            query: query,
            query_length: query.length,
            timestamp: new Date().toISOString()
          });
          
          // Simulación de filtrado de resultados
          filterVehiclesByQuery(query);
        } else if (query.length === 0) {
          // Mostrar todos los vehículos si se borra la búsqueda
          showAllVehicles();
        }
      }, 300);
    });
  }

  // Función para filtrar vehículos por búsqueda
  function filterVehiclesByQuery(query) {
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    const queryLower = query.toLowerCase();
    let visibleCount = 0;
    
    vehicleCards.forEach(card => {
      const brand = card.getAttribute('data-vehicle-brand')?.toLowerCase() || '';
      const model = card.getAttribute('data-vehicle-model')?.toLowerCase() || '';
      const location = card.getAttribute('data-vehicle-location')?.toLowerCase() || '';
      const vehicleText = card.textContent.toLowerCase();
      
      const matches = brand.includes(queryLower) || 
                     model.includes(queryLower) || 
                     location.includes(queryLower) || 
                     vehicleText.includes(queryLower);
      
      if (matches) {
        card.style.display = 'block';
        card.style.opacity = '1';
        visibleCount++;
      } else {
        card.style.opacity = '0.3';
        // No ocultar completamente para mejor UX
      }
    });
    
    // Actualizar contador de resultados
    updateResultsCount(visibleCount);
  }

  // Función para mostrar todos los vehículos
  function showAllVehicles() {
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    vehicleCards.forEach(card => {
      card.style.display = 'block';
      card.style.opacity = '1';
    });
    updateResultsCount(vehicleCards.length);
  }

  // Función para actualizar contador de resultados
  function updateResultsCount(count) {
    let resultsHeader = document.querySelector('.results-header h2');
    if (resultsHeader) {
      resultsHeader.textContent = `Resultados de búsqueda (${count} vehículos encontrados)`;
    }
  }

  // Tracking de búsqueda en tiempo real
  const searchInputs = document.querySelectorAll('select[data-track-event], input[data-track-event]');
  searchInputs.forEach(input => {
    const eventType = input.type === 'range' ? 'input' : 'change';
    input.addEventListener(eventType, function() {
      const trackEvent = this.getAttribute('data-track-event');
      const value = this.value;
      const searchType = this.getAttribute('data-search-type') || this.getAttribute('data-filter-type');
      
      console.log(`🔍 Tracking Event: ${trackEvent}`, {
        search_type: searchType,
        selected_value: value,
        element_id: this.id,
        timestamp: new Date().toISOString()
      });
    });
  });

  // Tracking de envío de formulario de búsqueda
  const searchForm = document.getElementById('vehicleSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const searchData = {};
      for (let [key, value] of formData.entries()) {
        if (value) searchData[key] = value;
      }
      
      console.log('🔍 Search Submit Tracking:', {
        event_type: 'search_submit',
        search_data: searchData,
        timestamp: new Date().toISOString()
      });
      
      // Simular resultados de búsqueda
      alert('🔍 Búsqueda realizada!\n\n' + 
            'Criterios aplicados:\n' + 
            Object.entries(searchData)
              .map(([key, value]) => `• ${key}: ${value}`)
              .join('\n') + 
            '\n\nDatos de tracking enviados a consola.');
    });
  }

  // Tracking de ordenación
  const sortSelect = document.getElementById('sortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const sortValue = this.value;
      console.log('📊 Sort Tracking:', {
        event_type: 'sort_vehicles',
        sort_type: 'vehicles',
        sort_by: sortValue,
        timestamp: new Date().toISOString()
      });
      
      // Simular reorganización de resultados
      const vehicleGrid = document.querySelector('.vehicle-grid');
      if (vehicleGrid) {
        vehicleGrid.style.opacity = '0.5';
        setTimeout(() => {
          vehicleGrid.style.opacity = '1';
        }, 500);
      }
    });
  }

  // Tracking de hover en vehículos
  document.querySelectorAll('.vehicle-card[data-track-event="view_product"]').forEach(card => {
    card.addEventListener('mouseenter', function() {
      const vehicleId = this.getAttribute('data-vehicle-id');
      const brand = this.getAttribute('data-vehicle-brand');
      const model = this.getAttribute('data-vehicle-model');
      const price = this.getAttribute('data-vehicle-price');
      
      console.log('👁️ Vehicle View Tracking:', {
        event_type: 'view_product',
        vehicle_id: vehicleId,
        brand: brand,
        model: model,
        price: price,
        timestamp: new Date().toISOString()
      });
    });
  });

  // Tracking de ubicación de vehículos
  document.querySelectorAll('[data-track-event="view_vehicle_location"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const vehicleId = this.getAttribute('data-vehicle-id');
      const location = this.getAttribute('data-vehicle-location');
      
      console.log('📍 Location View Tracking:', {
        event_type: 'view_vehicle_location',
        vehicle_id: vehicleId,
        location: location,
        timestamp: new Date().toISOString()
      });
      
      // Simular apertura de mapa
      alert(`📍 Ver ubicación\n\nVehículo: ${vehicleId}\nUbicación: ${location}\n\n(Esta es una demo del tracking)`);
    });
  });

  // Tracking de calculadora de financiación
  const financingInputs = document.querySelectorAll('#financingForm input, #financingForm select');
  financingInputs.forEach(input => {
    input.addEventListener('change', function() {
      const trackEvent = this.getAttribute('data-track-event');
      const filterType = this.getAttribute('data-filter-type');
      
      if (trackEvent) {
        console.log(`💰 Financing Tracking: ${trackEvent}`, {
          filter_type: filterType,
          value: this.value,
          element_id: this.id,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  // Mensaje de tracking inicial
  console.log('🚗 Página de búsqueda de vehículos cargada');
  console.log('📊 Eventos de seguimiento disponibles:');
  console.log('- search_vehicle_type: Cambio de tipo de vehículo');
  console.log('- search_brand: Selección de marca');
  console.log('- search_model: Selección de modelo');
  console.log('- search_fuel: Selección de combustible');
  console.log('- search_price_type: Tipo de búsqueda (precio/cuota)');
  console.log('- filter_by_price: Filtro por rango de precio');
  console.log('- search_input: Búsqueda libre');
  console.log('- search_submit: Envío de búsqueda');
  console.log('- sort_vehicles: Ordenación de resultados');
  console.log('- view_product: Hover sobre vehículo');
  console.log('- add_to_favorites: Añadir a favoritos');
  console.log('- view_vehicle_location: Ver ubicación');
  console.log('- calculate_financing: Calcular financiación');
  console.log('- filter_by_payment: Filtros de financiación');

});
</script>

<!-- Floating Comparison Panel -->
<div id="comparisonPanel" class="comparison-panel" style="display: none;">
  <div class="comparison-panel-header">
    <h3>⚖️ Comparar Vehículos</h3>
    <div class="comparison-panel-actions">
      <button id="viewComparisonBtn" class="btn btn-primary" data-track-event="view_full_comparison">
        Ver Comparación Completa
      </button>
      <button id="clearComparisonBtn" class="btn btn-outline" data-track-event="clear_comparison_panel">
        🗑️ Limpiar
      </button>
      <button id="closeComparisonBtn" class="comparison-panel-close" data-track-event="close_comparison_panel">
        ×
      </button>
    </div>
  </div>
  <div class="comparison-panel-content">
    <div id="comparisonSlots" class="comparison-slots">
      <!-- Dynamic comparison slots will be added here -->
    </div>
  </div>
</div>

<style>
/* Floating Comparison Panel Styles */
.comparison-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-width: 90vw;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
}

.comparison-panel.show {
  transform: translateY(0);
}

.comparison-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.comparison-panel-header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.1rem;
}

.comparison-panel-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.comparison-panel-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  line-height: 1;
}

.comparison-panel-close:hover {
  color: #374151;
}

.comparison-panel-content {
  padding: 1rem 1.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.comparison-slots {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comparison-slot {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.comparison-slot:hover {
  background: #e5e7eb;
}

.comparison-slot-image {
  width: 60px;
  height: 45px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.comparison-slot-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comparison-slot-info {
  flex: 1;
  min-width: 0;
}

.comparison-slot-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comparison-slot-info p {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.comparison-slot-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.comparison-slot-remove:hover {
  background: #fee2e2;
}

.comparison-empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.comparison-empty-state .empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Compare button styles */
.compare-vehicle-btn {
  position: relative;
  overflow: hidden;
}

.compare-vehicle-btn.added {
  background: #16a34a;
  border-color: #16a34a;
  color: white;
}

.compare-vehicle-btn.added:hover {
  background: #15803d;
  border-color: #15803d;
}

/* Animation for adding to comparison */
@keyframes addToComparison {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.compare-vehicle-btn.adding {
  animation: addToComparison 0.3s ease-out;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .comparison-panel {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
  
  .comparison-panel-actions {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .comparison-panel-actions .btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>

<script>
// Vehicle Comparison Functionality
class VehicleComparisonManager {
  constructor() {
    this.comparedVehicles = [];
    this.maxComparisons = 3;
    this.panel = document.getElementById('comparisonPanel');
    this.slotsContainer = document.getElementById('comparisonSlots');
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updatePanel();
  }
  
  setupEventListeners() {
    // Compare vehicle buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('compare-vehicle-btn')) {
        e.preventDefault();
        const vehicleData = this.extractVehicleData(e.target);
        this.toggleVehicleComparison(vehicleData, e.target);
      }
    });
    
    // Panel action buttons
    document.getElementById('viewComparisonBtn').addEventListener('click', () => {
      this.goToComparisonPage();
    });
    
    document.getElementById('clearComparisonBtn').addEventListener('click', () => {
      this.clearAllComparisons();
    });
    
    document.getElementById('closeComparisonBtn').addEventListener('click', () => {
      this.hidePanel();
    });
    
    // Remove individual vehicles
    this.slotsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('comparison-slot-remove')) {
        const vehicleId = e.target.dataset.vehicleId;
        this.removeVehicle(vehicleId);
      }
    });
  }
  
  extractVehicleData(button) {
    return {
      id: button.dataset.vehicleId,
      brand: button.dataset.vehicleBrand,
      model: button.dataset.vehicleModel,
      price: button.closest('.vehicle-card').dataset.vehiclePrice,
      location: button.closest('.vehicle-card').dataset.vehicleLocation,
      image: button.closest('.vehicle-card').querySelector('img').src,
      title: button.closest('.vehicle-card').querySelector('h3').textContent
    };
  }
  
  toggleVehicleComparison(vehicleData, button) {
    const existingIndex = this.comparedVehicles.findIndex(v => v.id === vehicleData.id);
    
    if (existingIndex !== -1) {
      // Remove from comparison
      this.removeVehicle(vehicleData.id);
      this.updateButtonState(button, false);
      this.trackEvent('remove_from_comparison', vehicleData);
    } else {
      // Add to comparison
      if (this.comparedVehicles.length >= this.maxComparisons) {
        this.showMaxComparisonMessage();
        return;
      }
      
      this.addVehicle(vehicleData);
      this.updateButtonState(button, true);
      this.trackEvent('add_to_comparison', vehicleData);
    }
  }
  
  addVehicle(vehicleData) {
    this.comparedVehicles.push(vehicleData);
    this.updatePanel();
    this.showPanel();
  }
  
  removeVehicle(vehicleId) {
    this.comparedVehicles = this.comparedVehicles.filter(v => v.id !== vehicleId);
    this.updatePanel();
    
    // Update button state
    const button = document.querySelector(`[data-vehicle-id="${vehicleId}"].compare-vehicle-btn`);
    if (button) {
      this.updateButtonState(button, false);
    }
    
    if (this.comparedVehicles.length === 0) {
      this.hidePanel();
    }
    
    this.trackEvent('remove_from_comparison', { vehicleId });
  }
  
  clearAllComparisons() {
    const vehicleIds = this.comparedVehicles.map(v => v.id);
    this.comparedVehicles = [];
    
    // Update all button states
    vehicleIds.forEach(id => {
      const button = document.querySelector(`[data-vehicle-id="${id}"].compare-vehicle-btn`);
      if (button) {
        this.updateButtonState(button, false);
      }
    });
    
    this.updatePanel();
    this.hidePanel();
    this.trackEvent('clear_all_comparisons', { count: vehicleIds.length });
  }
  
  updateButtonState(button, isAdded) {
    button.classList.add('adding');
    
    setTimeout(() => {
      button.classList.remove('adding');
      
      if (isAdded) {
        button.classList.add('added');
        button.innerHTML = '✓ Agregado';
      } else {
        button.classList.remove('added');
        button.innerHTML = '⚖️ Comparar';
      }
    }, 300);
  }
  
  updatePanel() {
    if (this.comparedVehicles.length === 0) {
      this.slotsContainer.innerHTML = `
        <div class="comparison-empty-state">
          <div class="empty-icon">⚖️</div>
          <p>Añade vehículos para comparar</p>
        </div>
      `;
      return;
    }
    
    this.slotsContainer.innerHTML = this.comparedVehicles.map(vehicle => `
      <div class="comparison-slot">
        <div class="comparison-slot-image">
          <img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}">
        </div>
        <div class="comparison-slot-info">
          <h4>${vehicle.brand} ${vehicle.model}</h4>
          <p>€${parseInt(vehicle.price).toLocaleString()} • ${vehicle.location}</p>
        </div>
        <button class="comparison-slot-remove" 
                data-vehicle-id="${vehicle.id}"
                data-track-event="remove_from_comparison_panel">
          ×
        </button>
      </div>
    `).join('');
    
    // Update view comparison button
    const viewBtn = document.getElementById('viewComparisonBtn');
    viewBtn.textContent = `Ver Comparación (${this.comparedVehicles.length})`;
  }
  
  showPanel() {
    this.panel.style.display = 'block';
    setTimeout(() => {
      this.panel.classList.add('show');
    }, 10);
  }
  
  hidePanel() {
    this.panel.classList.remove('show');
    setTimeout(() => {
      if (!this.panel.classList.contains('show')) {
        this.panel.style.display = 'none';
      }
    }, 300);
  }
  
  goToComparisonPage() {
    const vehicleIds = this.comparedVehicles.map(v => v.id).join(',');
    const url = `/vehicle-comparison?vehicles=${vehicleIds}`;
    
    this.trackEvent('navigate_to_comparison_page', {
      vehicleCount: this.comparedVehicles.length,
      vehicleIds: this.comparedVehicles.map(v => v.id)
    });
    
    window.location.href = url;
  }
  
  showMaxComparisonMessage() {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1100;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = `Máximo ${this.maxComparisons} vehículos para comparar`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
    
    this.trackEvent('max_comparison_reached', { maxComparisons: this.maxComparisons });
  }
  
  trackEvent(eventName, data = {}) {
    // Enhanced tracking with more detailed data
    const enhancedData = {
      ...data,
      timestamp: Date.now(),
      page: 'vehicle_search',
      comparisonCount: this.comparedVehicles.length,
      maxComparisons: this.maxComparisons
    };
    
    // Send to Guiders SDK if available
    if (window.guiders && typeof window.guiders.track === 'function') {
      window.guiders.track({
        event: eventName,
        ...enhancedData
      });
    }
    
    console.log('🔍 Comparison Tracking:', eventName, enhancedData);
  }
}

// Initialize comparison manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.vehicleComparisonManager = new VehicleComparisonManager();
  
  // Track enhanced page view with comparison functionality
  if (window.guiders && typeof window.guiders.track === 'function') {
    window.guiders.track({
      event: 'page_view_with_comparison',
      page: 'vehicle_search',
      features: ['vehicle_search', 'vehicle_comparison', 'financing_calculator'],
      timestamp: Date.now()
    });
  }
});
</script>


</body>
</html>
