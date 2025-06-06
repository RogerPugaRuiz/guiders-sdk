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
    </nav>
  </div>
</header>

<div class="container">
  <div class="hero-banner">
    <div class="hero-content">
      <h1>Solución integral de análisis web</h1>
      <p class="hero-subtitle">Descubre el poder del seguimiento avanzado con Guiders SDK</p>
      <div class="hero-buttons">
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
        <h3>Seguimiento avanzado</h3>
        <p>Rastrea eventos específicos con alta precisión</p>
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