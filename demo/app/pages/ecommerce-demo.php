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
        <div class="product-card" data-id="<?= $prod['id'] ?>" data-name="<?= htmlspecialchars($prod['nombre']) ?>" data-price="<?= $prod['precio'] ?>">
          <a href="/ecommerce/pages/product-detail.php?id=<?= $prod['id'] ?>" class="product-link">
            <img src="https://dummyimage.com/200x200/0070f3/fff&text=<?= urlencode($prod['nombre']) ?>" alt="<?= htmlspecialchars($prod['nombre']) ?>">
          </a>
          <div class="product-info">
            <h3><a href="/ecommerce/pages/product-detail.php?id=<?= $prod['id'] ?>" class="product-link"><?= htmlspecialchars($prod['nombre']) ?></a></h3>
            <p class="price"><?= number_format($prod['precio'], 2, ',', '.') ?> €</p>
            <p class="desc"><?= htmlspecialchars($prod['descripcion']) ?></p>
            <button onclick="addToCart(<?= $prod['id'] ?>, '<?= htmlspecialchars($prod['nombre']) ?>', <?= $prod['precio'] ?>)">Añadir al carrito</button>
          </div>
        </div>
        <?php endforeach; ?>
      </div>
    </section>
    <aside id="cart" class="cart-sidebar">
      <h2>Carrito</h2>
      <ul id="cart-list"></ul>
      <p id="cart-total">Total: 0 €</p>
      <button onclick="checkout()" class="checkout-btn">Comprar</button>
    </aside>
  </main>
</div>
<script>
  const cart = [];
  function addToCart(id, name, price) {
    cart.push({ id, name, price });
    renderCart();
    sdk.track({ event: 'ecommerce:add_to_cart', productId: id, name, price });
  }
  function renderCart() {
    const list = document.getElementById('cart-list');
    list.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - ${item.price} €`;
      list.appendChild(li);
      total += item.price;
    });
    document.getElementById('cart-total').textContent = `Total: ${total.toFixed(2)} €`;
    document.getElementById('cart-count').textContent = cart.length;
  }
  function checkout() {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    sdk.track({ event: 'ecommerce:purchase', items: cart, total: cart.reduce((a, b) => a + b.price, 0) });
    alert('¡Compra realizada!');
    cart.length = 0;
    renderCart();
  }
  // Evento de vista de producto
  document.querySelectorAll('.product-card').forEach(el => {
    el.addEventListener('click', function() {
      sdk.track({ event: 'ecommerce:view_product', productId: this.dataset.id, name: this.dataset.name, price: this.dataset.price });
    });
  });
  // Mostrar/ocultar carrito
  document.getElementById('cart-link').onclick = function(e) {
    e.preventDefault();
    document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
  };
</script>
</body>
</html>
https://www.youtube.com/watch?v=zYGkKJVXArs