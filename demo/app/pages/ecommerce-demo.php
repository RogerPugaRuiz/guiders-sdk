<?php
include __DIR__ . '/../partials/header.php';
$link = '/style.css';
echo "<link rel=\"stylesheet\" href=\"$link\">";

// Cargar productos desde mock.xml
$xml = simplexml_load_file(__DIR__ . '/mock.xml');
$productos = [];
foreach ($xml->producto as $p) {
  $productos[] = [
    'id' => (string)$p->id,
    'nombre' => (string)$p->nombre,
    'precio' => (float)$p->precio,
    'descripcion' => (string)$p->descripcion
  ];
}
?>
<main class="main-content">
  <div style="display:none" data-track-event="page_view" data-page="ecommerce"></div>
  
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-content">
        <h1>🛍️ GuiderShop</h1>
        <p class="hero-subtitle">Descubre nuestra selección premium de productos con seguimiento avanzado</p>
        <div class="hero-actions">
          <a href="#products" class="btn btn-primary">Ver Productos</a>
          <a href="#cart" id="cart-link" class="btn btn-secondary">🛒 Carrito (<span id="cart-count">0</span>)</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Products Section -->
  <section id="products" class="products-section">
    <div class="container">
      <div class="section-header">
        <h2>✨ Productos Destacados</h2>
        <p class="section-subtitle">Descubre nuestra selección premium de productos</p>
      </div>
      
      <div class="product-grid">
        <?php foreach ($productos as $prod): ?>
        <div class="product-card"
             data-track-event="view_product"
             data-product-id="<?= $prod['id'] ?>"
             data-product-name="<?= htmlspecialchars($prod['nombre']) ?>"
             data-product-price="<?= $prod['precio'] ?>">
          <div class="product-image">
            <a href="/ecommerce/pages/product-detail.php?id=<?= $prod['id'] ?>" class="product-link">
              <img src="https://dummyimage.com/250x250/1e3a8a/fff&text=<?= urlencode($prod['nombre']) ?>" alt="<?= htmlspecialchars($prod['nombre']) ?>">
            </a>
          </div>
          <div class="product-info">
            <h3 class="product-title">
              <a href="/ecommerce/pages/product-detail.php?id=<?= $prod['id'] ?>" class="product-link">
                <?= htmlspecialchars($prod['nombre']) ?>
              </a>
            </h3>
            <p class="product-description"><?= htmlspecialchars($prod['descripcion']) ?></p>
            <div class="product-footer">
              <span class="product-price"><?= number_format($prod['precio'], 2, ',', '.') ?> €</span>
              <button class="add-to-cart-btn"
                      data-track-event="add_to_cart"
                      data-product-id="<?= $prod['id'] ?>"
                      data-product-name="<?= htmlspecialchars($prod['nombre']) ?>"
                      data-product-price="<?= $prod['precio'] ?>">
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
        <?php endforeach; ?>
      </div>
    </div>
  </section>

  <!-- Cart Section -->
  <aside id="cart" class="cart-section" data-track-event="view_cart">
    <div class="container">
      <div class="cart-container">
        <div class="cart-header">
          <h2>🛒 Tu Carrito de Compras</h2>
          <div class="cart-badge" id="cart-badge">0</div>
        </div>
        <div class="cart-content">
          <ul id="cart-list" class="cart-list"></ul>
          <div class="cart-summary">
            <p id="cart-total" class="cart-total">Total: 0 €</p>
          </div>
          <div class="cart-actions">
            <button class="btn btn-primary checkout-btn" data-track-event="purchase">
              💳 Comprar Ahora
            </button>
            <button class="btn btn-danger clear-cart-btn" data-track-event="clear_cart">
              🗑️ Vaciar Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
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
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: white;
  color: #1e3a8a;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
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

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

/* Products Section */
.products-section {
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

.section-subtitle {
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-image {
  position: relative;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.product-title a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

.product-title a:hover {
  color: #1e3a8a;
}

.product-description {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e3a8a;
}

.add-to-cart-btn {
  background-color: #1e3a8a;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-to-cart-btn:hover {
  background-color: #1e40af;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
}

/* Cart Section */
.cart-section {
  padding: 4rem 0;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.cart-container {
  max-width: 800px;
  margin: 0 auto;
  background: #f8f9fa;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.cart-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.cart-badge {
  background: #1e3a8a;
  color: white;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.cart-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.cart-list li {
  background: white;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.cart-list li:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cart-summary {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.cart-total {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0;
}

.cart-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Cart Animations */
@keyframes cartBounce {
  0%, 20%, 60%, 100% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-10px) scale(1.1); }
  80% { transform: translateY(-5px) scale(1.05); }
}

.cart-badge.bounce {
  animation: cartBounce 0.6s ease-out;
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
  
  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .product-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .add-to-cart-btn {
    width: 100%;
  }
  
  .cart-container {
    padding: 1.5rem;
  }
  
  .cart-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .cart-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
  
  .cart-container {
    padding: 1rem;
  }
}
</style>

<script>
  const cart = [];
  
  // Añadir producto al carrito
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-product-id');
      const name = this.getAttribute('data-product-name');
      const price = parseFloat(this.getAttribute('data-product-price'));
      
      cart.push({ id, name, price });
      renderCart();
      
      // Feedback visual
      this.style.backgroundColor = '#059669';
      this.textContent = '✓ Añadido';
      setTimeout(() => {
        this.style.backgroundColor = '#1e3a8a';
        this.textContent = 'Añadir al carrito';
      }, 1500);
    });
  });
  
  // Renderizar el carrito
  function renderCart() {
    const list = document.getElementById('cart-list');
    const badge = document.getElementById('cart-badge');
    list.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.innerHTML = `
        <div style="text-align: center; color: #6b7280; padding: 3rem 2rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
          <h3 style="color: #374151; margin-bottom: 0.5rem;">Tu carrito está vacío</h3>
          <p style="font-size: 0.95rem; margin: 0;">¡Agrega algunos productos para comenzar!</p>
        </div>
      `;
      emptyMessage.style.border = 'none';
      emptyMessage.style.background = 'none';
      emptyMessage.style.marginBottom = '0';
      list.appendChild(emptyMessage);
    } else {
      cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex-grow: 1;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">${item.name}</div>
              <div style="color: #1e3a8a; font-weight: 700; font-size: 1.1rem;">${item.price.toFixed(2)} €</div>
            </div>
            <button onclick="removeFromCart(${index})" 
                    style="background: #dc2626; color: white; border: none; border-radius: 6px; 
                           width: 32px; height: 32px; cursor: pointer; font-size: 1rem; 
                           display: flex; align-items: center; justify-content: center;
                           transition: all 0.3s ease;"
                    onmouseover="this.style.backgroundColor='#b91c1c'"
                    onmouseout="this.style.backgroundColor='#dc2626'">×</button>
          </div>
        `;
        list.appendChild(li);
        total += item.price;
      });
    }
    
    document.getElementById('cart-total').textContent = `Total: ${total.toFixed(2)} €`;
    document.getElementById('cart-count').textContent = cart.length;
    badge.textContent = cart.length;
    
    // Animación del badge
    if (cart.length > 0) {
      badge.classList.add('bounce');
      setTimeout(() => badge.classList.remove('bounce'), 600);
    }
  }
  
  // Función para eliminar del carrito
  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
  }
  
  // Comprar
  document.querySelector('.checkout-btn').addEventListener('click', function() {
    if (cart.length === 0) {
      alert('🛒 El carrito está vacío\n\n¡Agrega algunos productos antes de continuar!');
      return;
    }
    
    // Mostrar resumen de compra
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemCount = cart.length;
    const itemText = itemCount === 1 ? 'producto' : 'productos';
    
    const confirmMessage = `🎉 ¡Compra Confirmada!\n\n📦 ${itemCount} ${itemText}\n💰 Total: ${total.toFixed(2)} €\n\n¡Gracias por tu compra! (Esta es una demo)`;
    
    alert(confirmMessage);
    cart.length = 0;
    renderCart();
  });

  // Vaciar carrito
  document.querySelector('.clear-cart-btn').addEventListener('click', function() {
    if (cart.length === 0) {
      alert('🛒 El carrito ya está vacío');
      return;
    }
    
    const confirmDelete = confirm('🗑️ ¿Estás seguro de que quieres vaciar el carrito?');
    if (confirmDelete) {
      cart.length = 0;
      renderCart();
      alert('✅ Carrito vaciado correctamente');
    }
  });
  
  // Scroll suave al carrito
  document.getElementById('cart-link').onclick = function(e) {
    e.preventDefault();
    document.getElementById('cart').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };
  
  // Scroll suave a productos
  document.querySelector('a[href="#products"]').onclick = function(e) {
    e.preventDefault();
    document.getElementById('products').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };
  
  // Inicializar contador
  renderCart();
</script>
</body>
</html>
