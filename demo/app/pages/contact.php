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
          <h1>¿Tienes alguna pregunta?</h1>
          <p class="hero-subtitle">Estamos aquí para ayudarte. Ponte en contacto con nuestro equipo de expertos.</p>
        </div>
      </div>
    </section>

    <!-- Contact Content -->
    <section class="contact-section">
      <div class="container">
        <div class="contact-content">
          <div class="contact-form-section">
            <div class="section-header">
              <h2>Envíanos un mensaje</h2>
              <p>Completa el formulario y te responderemos lo antes posible</p>
            </div>
            
            <form class="contact-form" id="contactForm">
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Nombre completo</label>
                  <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                  <label for="email">Correo electrónico</label>
                  <input type="email" id="email" name="email" required>
                </div>
              </div>
              
              <div class="form-group">
                <label for="company">Empresa (opcional)</label>
                <input type="text" id="company" name="company">
              </div>
              
              <div class="form-group">
                <label for="subject">Asunto</label>
                <select id="subject" name="subject" required>
                  <option value="">Selecciona un tema</option>
                  <option value="demo">Solicitar demo</option>
                  <option value="pricing">Información de precios</option>
                  <option value="technical">Soporte técnico</option>
                  <option value="partnership">Colaboración</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="message">Mensaje</label>
                <textarea id="message" name="message" rows="6" required placeholder="Cuéntanos cómo podemos ayudarte..."></textarea>
              </div>
              
              <button type="submit" class="btn btn-primary btn-full">
                Enviar mensaje
              </button>
            </form>
          </div>

          <div class="contact-info-section">
            <div class="contact-card">
              <div class="contact-icon">🏢</div>
              <h3>Oficina Principal</h3>
              <p>
                Calle Innovación 123<br>
                28001 Madrid, España<br>
                <strong>Horario:</strong> Lun-Vie 9:00-18:00
              </p>
            </div>

            <div class="contact-card">
              <div class="contact-icon">📧</div>
              <h3>Email</h3>
              <p>
                <strong>Ventas:</strong> sales@guiders.com<br>
                <strong>Soporte:</strong> support@guiders.com<br>
                <strong>General:</strong> info@guiders.com
              </p>
            </div>

            <div class="contact-card">
              <div class="contact-icon">📱</div>
              <h3>Teléfono</h3>
              <p>
                <strong>España:</strong> +34 91 123 4567<br>
                <strong>Internacional:</strong> +1 555 123 4567<br>
                <strong>WhatsApp:</strong> +34 600 123 456
              </p>
            </div>

            <div class="contact-card">
              <div class="contact-icon">🌐</div>
              <h3>Redes Sociales</h3>
              <div class="social-links">
                <a href="#" class="social-link">LinkedIn</a>
                <a href="#" class="social-link">Twitter</a>
                <a href="#" class="social-link">GitHub</a>
              </div>
            </div>

            <div class="contact-card faq-card">
              <div class="contact-icon">❓</div>
              <h3>Preguntas Frecuentes</h3>
              <div class="faq-item">
                <strong>¿Ofrecen prueba gratuita?</strong>
                <p>Sí, ofrecemos 14 días de prueba gratuita sin compromiso.</p>
              </div>
              <div class="faq-item">
                <strong>¿Qué tipo de soporte incluyen?</strong>
                <p>Soporte técnico 24/7 por email y chat en vivo.</p>
              </div>
            </div>
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
  margin-bottom: 0;
  line-height: 1.6;
}

/* Contact Section */
.contact-section {
  padding: 4rem 0;
  background-color: #f8f9fa;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

/* Form Section */
.contact-form-section {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #6b7280;
  font-size: 1rem;
}

.contact-form {
  max-width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-block;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #1e3a8a;
  color: white;
}

.btn-primary:hover {
  background-color: #1e40af;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);
}

.btn-full {
  width: 100%;
  text-align: center;
}

/* Contact Info Section */
.contact-info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.contact-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.contact-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.contact-card p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.contact-card strong {
  color: #374151;
}

/* Social Links */
.social-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.social-link {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #1e3a8a;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: #1e3a8a;
  color: white;
  transform: translateY(-2px);
}

/* FAQ */
.faq-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.faq-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.faq-item strong {
  display: block;
  color: #374151;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.faq-item p {
  margin: 0;
  font-size: 0.95rem;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.25rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
  
  .contact-form-section {
    padding: 2rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .section-header h2 {
    font-size: 1.75rem;
  }
  
  .contact-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .contact-form-section {
    padding: 1.5rem;
  }
  
  .contact-card {
    padding: 1.25rem;
  }
  
  .social-links {
    justify-content: center;
  }
}
</style>

<script>
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Simular envío del formulario
  const submitBtn = document.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;
  
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;
  
  setTimeout(() => {
    alert('¡Mensaje enviado correctamente! Te contactaremos pronto.');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    document.getElementById('contactForm').reset();
  }, 2000);
});
</script>

</body>
</html>