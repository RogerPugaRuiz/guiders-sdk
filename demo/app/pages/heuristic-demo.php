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
      <a href="/heuristic-demo">🎯 Demo Heurístico</a>
    </nav>
  </div>
</header>

<main class="main-content">
  <!-- Page will be automatically detected via URL -->
  
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <h1>🎯 Demo de Detección Heurística</h1>
        <p class="hero-subtitle">Esta página demuestra la nueva funcionalidad de detección automática sin usar atributos data-track-event</p>
      </div>
    </div>
  </section>

  <!-- Demo Section -->
  <section class="demo-section">
    <div class="container">
      <div class="demo-content">
        
        <!-- E-commerce Demo Elements -->
        <div class="demo-category">
          <h2>🛒 Elementos de E-commerce (detección automática)</h2>
          <div class="demo-elements">
            
            <div class="product-card">
              <h3>Producto Demo</h3>
              <p>Este es un producto de ejemplo con precio de 99.99€</p>
              <button class="add-to-cart-btn">Añadir al carrito</button>
              <button class="buy-now-btn">Comprar ahora</button>
            </div>

            <div class="product-item">
              <h3>Otro Producto</h3>
              <p>Precio: 149.90€</p>
              <button>Agregar carrito</button>
            </div>

            <div class="cart-section">
              <a href="/cart" class="cart-link">🛒 Ver carrito (3 items)</a>
              <button class="checkout-btn">Proceder al checkout</button>
            </div>

          </div>
        </div>

        <!-- Vehicle/Automotive Demo Elements -->
        <div class="demo-category">
          <h2>🚗 Elementos Automotrices (detección automática)</h2>
          <div class="demo-elements">
            
            <div class="vehicle-card">
              <h3>BMW Serie 3 2024</h3>
              <p>Desde 45.000€ - Diesel automático</p>
              <button class="contact-dealer-btn">Contactar concesionario</button>
              <button class="test-drive-btn">Solicitar prueba de conducir</button>
              <button class="quote-btn">Solicitar cotización</button>
            </div>

            <div class="vehicle-info">
              <h3>Mercedes Clase C</h3>
              <a href="/brochure.pdf" class="brochure-link">Descargar folleto PDF</a>
              <button class="schedule-btn">Programar cita</button>
            </div>

          </div>
        </div>

        <!-- Search Demo Elements -->
        <div class="demo-category">
          <h2>🔍 Elementos de Búsqueda (detección automática)</h2>
          <div class="demo-elements">
            
            <form class="search-form">
              <input type="text" placeholder="Buscar vehículos..." class="search-input">
              <button type="submit" class="search-btn">Buscar</button>
            </form>

            <form class="filter-form">
              <select class="filter-dropdown">
                <option>Filtrar por precio</option>
                <option>0-20.000€</option>
                <option>20.000-40.000€</option>
              </select>
              <button type="submit">Aplicar filtros</button>
            </form>

          </div>
        </div>

        <!-- Instructions -->
        <div class="demo-instructions">
          <h2>📋 Instrucciones</h2>
          <div class="instructions-content">
            <p><strong>Esta página demuestra la detección heurística automática:</strong></p>
            <ul>
              <li>✅ <strong>No hay atributos data-track-event</strong> - El SDK detecta automáticamente los elementos relevantes</li>
              <li>🎯 <strong>Detección inteligente</strong> - Usa patrones CSS, texto y contexto para identificar elementos</li>
              <li>📄 <strong>Detección de página por URL</strong> - El tipo de página se detecta automáticamente por la URL</li>
              <li>🔧 <strong>Configurable</strong> - La confianza mínima y otros parámetros pueden ajustarse</li>
              <li>👁️ <strong>Indicadores visuales</strong> - En modo desarrollo, verás indicadores sobre los elementos detectados</li>
            </ul>
            
            <div class="demo-note">
              <h4>🧪 Elementos detectados automáticamente:</h4>
              <ul>
                <li><code>add_to_cart</code> - Botones con texto "añadir", "agregar" o clases relacionadas con "cart"</li>
                <li><code>contact_dealer</code> - Elementos con texto "contactar", "concesionario" o contexto "dealer"</li>
                <li><code>purchase</code> - Botones con texto "comprar", "buy", "checkout" o "pagar"</li>
                <li><code>search_submit</code> - Botones de envío en formularios de búsqueda</li>
                <li><code>schedule_test_drive</code> - Elementos relacionados con "prueba", "test drive", "cita"</li>
                <li><code>request_quote</code> - Botones de "cotizar", "presupuesto", "solicitar"</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

</main>

<style>
.demo-section {
  padding: 4rem 0;
  background: #f8f9fa;
}

.demo-category {
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.demo-category h2 {
  margin-bottom: 1.5rem;
  color: #1e3a8a;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.demo-elements {
  display: grid;
  gap: 1.5rem;
}

.product-card, .product-item, .vehicle-card, .vehicle-info {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.cart-section {
  padding: 1rem;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-form, .filter-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.search-input, .filter-dropdown {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  flex: 1;
}

button, .cart-link {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #1e3a8a;
  color: white;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  margin: 0.25rem;
  transition: background 0.2s;
}

button:hover, .cart-link:hover {
  background: #1e40af;
}

.demo-instructions {
  margin-top: 2rem;
  padding: 2rem;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 12px;
}

.demo-instructions h2 {
  color: #92400e;
  margin-bottom: 1rem;
}

.instructions-content ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.instructions-content li {
  margin-bottom: 0.5rem;
}

.demo-note {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
  border-radius: 0 8px 8px 0;
}

.demo-note h4 {
  color: #0c4a6e;
  margin-bottom: 0.5rem;
}

.demo-note code {
  background: #e0e7ff;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #3730a3;
}

@media (max-width: 768px) {
  .cart-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-form, .filter-form {
    flex-direction: column;
  }
}
</style>

</body>
</html>