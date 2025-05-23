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
<div class="container">
  <div style="display:none" data-track-event="page_view" data-page="ecommerce"></div>
  <header class="shop-header">
    <h1>GuiderShop</h1>
    <nav>
      <a href="/ecommerce">Inicio</a>
      <a href="#cart" id="cart-link">Carrito (<span id="cart-count">0</span>)</a>
    </nav>
  </header>
  <main class="shop-main">
    <section id="products">
      <h2>Productos destacados</h2>
      <div class="product-list">
        <?php foreach ($productos as $prod): ?>
        <div class="product-card"
             data-track-event="view_product"
             data-product-id="<?= $prod['id'] ?>"
             data-product-name="<?= htmlspecialchars($prod['nombre']) ?>"
             data-product-price="<?= $prod['precio'] ?>">
          <a href="/ecommerce/pages/product-detail.php?id=<?= $prod['id'] ?>" class="product-link">
            <img src="https://dummyimage.com/200x200/0070f3/fff&text=<?= urlencode($prod['nombre']) ?>" alt="<?= htmlspecialchars($prod['nombre']) ?>">
          </a>
          <div class="product-info">
            <h3><a href="/ecommerce/pages/product-detail.php?id=<?= $prod['id'] ?>" class="product-link"><?= htmlspecialchars($prod['nombre']) ?></a></h3>
            <p class="price"><?= number_format($prod['precio'], 2, ',', '.') ?> €</p>
            <p class="desc"><?= htmlspecialchars($prod['descripcion']) ?></p>
            <button class="add-to-cart-btn"
                    data-track-event="add_to_cart"
                    data-product-id="<?= $prod['id'] ?>"
                    data-product-name="<?= htmlspecialchars($prod['nombre']) ?>"
                    data-product-price="<?= $prod['precio'] ?>">
              Añadir al carrito
            </button>
          </div>
        </div>
        <?php endforeach; ?>
      </div>
    </section>
    <aside id="cart" class="cart-sidebar"
           data-track-event="view_cart">
      <h2>Carrito</h2>
      <ul id="cart-list"></ul>
      <p id="cart-total">Total: 0 €</p>
      <div class="cart-actions">
        <button class="checkout-btn"
                data-track-event="purchase">
          Comprar
        </button>
        <button class="clear-cart-btn"
                data-track-event="clear_cart">
          Vaciar carrito
        </button>
      </div>
    </aside>
  </main>
</div>
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
    });
  });
  // Renderizar el carrito
  function renderCart() {
    const list = document.getElementById('cart-list');
    list.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ${item.price.toFixed(2)} €`;
      list.appendChild(li);
      total += item.price;
    });
    document.getElementById('cart-total').textContent = `Total: ${total.toFixed(2)} €`;
    document.getElementById('cart-count').textContent = cart.length;
  }
  // Comprar
  document.querySelector('.checkout-btn').addEventListener('click', function() {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    alert('¡Compra realizada! (demo)');
    cart.length = 0;
    renderCart();
  });
  // Vaciar carrito
  document.querySelector('.clear-cart-btn').addEventListener('click', function() {
    if (cart.length === 0) {
      alert('El carrito ya está vacío');
      return;
    }
    cart.length = 0;
    renderCart();
  });
  // Mostrar/ocultar carrito (scroll)
  document.getElementById('cart-link').onclick = function(e) {
    e.preventDefault();
    document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
  };
  // Inicializar contador
  renderCart();
</script>
</body>
</html>
