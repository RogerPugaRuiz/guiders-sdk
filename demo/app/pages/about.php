<?php 
include __DIR__ . '/../partials/header.php';
$link = '/style.css';
echo "<link rel=\"stylesheet\" href=\"$link\">";
?>

<main class="main-content">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1>Transformando la experiencia digital</h1>
          <p class="hero-subtitle">Guiders SDK es una solución integral de seguimiento y análisis que permite a las empresas comprender mejor a sus usuarios y optimizar sus aplicaciones web.</p>
          <div class="hero-actions">
            <a href="/contact" class="btn btn-primary">Solicitar Demo</a>
            <a href="/ecommerce" class="btn btn-secondary">Ver Tienda Demo</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2>¿Por qué elegir Guiders SDK?</h2>
          <p>Descubre las características que nos hacen únicos</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Nuestra Misión</h3>
            <p>Democratizar el acceso a herramientas de análisis avanzadas, permitiendo que empresas de todos los tamaños puedan tomar decisiones basadas en datos de manera sencilla y eficiente.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔬</div>
            <h3>Tecnología Avanzada</h3>
            <p>Utilizamos algoritmos de última generación y tecnologías web modernas para proporcionar seguimiento en tiempo real con mínimo impacto en el rendimiento.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🌟</div>
            <h3>Características Principales</h3>
            <ul class="feature-list">
              <li>✅ Seguimiento de eventos en tiempo real</li>
              <li>✅ Chat integrado con WebSocket</li>
              <li>✅ Análisis de comportamiento de usuario</li>
              <li>✅ Detección inteligente de bots</li>
              <li>✅ Pipeline de procesamiento modular</li>
              <li>✅ API RESTful completa</li>
            </ul>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>Casos de Uso</h3>
            <div class="use-cases">
              <div class="use-case">
                <h4>E-commerce</h4>
                <p>Optimiza tu funnel de ventas y mejora la conversión</p>
              </div>
              <div class="use-case">
                <h4>SaaS</h4>
                <p>Entiende cómo los usuarios interactúan con tu producto</p>
              </div>
              <div class="use-case">
                <h4>Marketing</h4>
                <p>Mide la efectividad de tus campañas digitales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="section-header">
          <h2>Números que Hablan por Sí Solos</h2>
          <p>Resultados que respaldan nuestra excelencia</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">Uptime Garantizado</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">&lt;50ms</div>
            <div class="stat-label">Latencia Promedio</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">1M+</div>
            <div class="stat-label">Eventos por Día</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Soporte Técnico</div>
          </div>
        </div>
      </div>
    </section>
  </main>

<style>
/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 4rem 0;
  margin-bottom: 4rem;
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-block;
}

.btn-primary {
  background-color: white;
  color: #1e3a8a;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background-color: white;
  color: #1e3a8a;
}

/* Features Section */
.features-section {
  padding: 4rem 0;
  background-color: #f8f9fa;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.section-header p {
  font-size: 1.125rem;
  color: #6b7280;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 0.5rem 0;
  color: #4b5563;
  font-size: 1rem;
}

.use-cases {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.use-case {
  background: #f3f4f6;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #1e3a8a;
}

.use-case h4 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
}

.use-case p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

/* Stats Section */
.stats-section {
  padding: 4rem 0;
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.stat-card {
  text-align: center;
  background: #f8f9fa;
  padding: 2.5rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.15);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  display: block;
}

.stat-label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.25rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 280px;
    text-align: center;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

</body>
</html>