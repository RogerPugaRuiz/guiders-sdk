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

<div class="container">
  <!-- Removed data-track-event attribute - page detection is now automatic via URL -->
  
  <div class="hero-banner">
    <div class="hero-content">
      <h1>Solución integral de análisis web</h1>
      <p class="hero-subtitle">Descubre el poder del seguimiento automático con Guiders SDK</p>
      <div class="hero-buttons">
        <!-- These links will be automatically detected by heuristics -->
        <a href="/ecommerce" class="btn-primary">Ver Demo</a>
        <a href="/about" class="btn-secondary">Más información</a>
      </div>
    </div>
  </div>

  <section class="content-section">
    <h2>Características principales</h2>
    <div class="features-grid">
      <div class="feature-item">
        <div class="feature-icon">📊</div>
        <h3>Análisis en tiempo real</h3>
        <p>Obtén métricas precisas del comportamiento de usuarios</p>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">🎯</div>
        <h3>Detección automática</h3>
        <p>Nuestro SDK detecta automáticamente eventos sin modificar tu HTML</p>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">💬</div>
        <h3>Chat integrado</h3>
        <p>Sistema de mensajería en tiempo real</p>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">🔒</div>
        <h3>Seguro y privado</h3>
        <p>Cumplimiento total de normativas de privacidad</p>
      </div>
    </div>
  </section>

  <!-- Demo section to showcase automatic detection -->
  <section class="content-section demo-section">
    <h2>🚀 Demo de Detección Automática</h2>
    <p class="demo-description">
      Este SDK ya no requiere atributos HTML especiales. Los siguientes elementos son detectados automáticamente:
    </p>
    
    <div class="demo-grid">
      <div class="demo-item">
        <h4>Búsqueda Inteligente</h4>
        <div class="search-demo">
          <input type="text" placeholder="Buscar productos..." class="search-input">
          <button type="submit" class="search-btn">Buscar</button>
        </div>
        <small>✨ Detectado automáticamente como evento de búsqueda</small>
      </div>
      
      <div class="demo-item">
        <h4>Botón de Contacto</h4>
        <button class="contact-btn">Contactar con nosotros</button>
        <small>✨ Detectado automáticamente como evento de contacto</small>
      </div>
      
      <div class="demo-item">
        <h4>Enlace de Producto</h4>
        <a href="/ecommerce" class="product-link">Ver productos disponibles</a>
        <small>✨ Detectado automáticamente como evento de visualización</small>
      </div>
    </div>
    
    <div class="detection-info">
      <h4>🧠 Cómo funciona la detección:</h4>
      <ul>
        <li><strong>Detecta por URL:</strong> Las páginas se identifican automáticamente por su URL, no por elementos HTML</li>
        <li><strong>Heurística inteligente:</strong> Analiza texto, clases CSS, y contexto para identificar elementos relevantes</li>
        <li><strong>Sin modificaciones:</strong> No necesitas añadir atributos data-* a tu HTML</li>
        <li><strong>Puntuación de confianza:</strong> Cada detección tiene una puntuación que indica su precisión</li>
      </ul>
    </div>
  </section>

  <section class="content-section">
    <h2>¿Por qué elegir Guiders SDK?</h2>
    <div class="benefits-list">
      <div class="benefit-item">
        <h4>Fácil integración</h4>
        <p>Implementa nuestro SDK en minutos con una simple línea de código</p>
      </div>
      <div class="benefit-item">
        <h4>Escalable</h4>
        <p>Desde startups hasta empresas Fortune 500, se adapta a tu crecimiento</p>
      </div>
      <div class="benefit-item">
        <h4>Soporte 24/7</h4>
        <p>Nuestro equipo está disponible cuando lo necesites</p>
      </div>
    </div>
  </section>
</div>

<style>
.hero-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 4rem 2rem;
  margin-bottom: 3rem;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.btn-primary {
  background: white;
  color: #1e3a8a;
}

.btn-primary:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.feature-item {
  text-align: center;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.feature-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.benefits-list {
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;
}

.benefit-item {
  padding: 1.5rem;
  border-left: 4px solid #1e3a8a;
  background: #f9fafb;
  border-radius: 0 8px 8px 0;
}

.benefit-item h4 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

/* Demo section styles */
.demo-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 3rem 2rem;
  border-radius: 12px;
  margin: 3rem 0;
  border: 1px solid #cbd5e1;
}

.demo-description {
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #475569;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.demo-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.demo-item h4 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.search-demo {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.search-btn, .contact-btn {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.search-btn:hover, .contact-btn:hover {
  background: #1e40af;
}

.product-link {
  display: inline-block;
  background: #059669;
  color: white;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.product-link:hover {
  background: #047857;
}

.demo-item small {
  display: block;
  margin-top: 1rem;
  color: #059669;
  font-weight: 600;
}

.detection-info {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-top: 2rem;
  border-left: 4px solid #1e3a8a;
}

.detection-info h4 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.detection-info ul {
  list-style: none;
  padding: 0;
}

.detection-info li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.detection-info li:last-child {
  border-bottom: none;
}

.detection-info strong {
  color: #1e3a8a;
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.5rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
    max-width: 300px;
  }
}
</style>

</body>
</html>