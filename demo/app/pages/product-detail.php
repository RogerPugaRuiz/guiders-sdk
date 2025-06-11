<?php
include __DIR__ . '/../partials/header.php';
echo '<link rel="stylesheet" href="/style.css">';

// Obtener ID del producto desde la query string
$id = isset($_GET['id']) ? $_GET['id'] : null;
if (!$id) {
  echo '<div class="container"><h2>Producto no especificado</h2></div>';
  exit;
}

// Cargar productos desde mock.xml
$xml = simplexml_load_file(__DIR__ . '/mock.xml');
$producto = null;
foreach ($xml->producto as $p) {
  if ((string)$p->id === $id) {
    $producto = $p;
    break;
  }
}
if (!$producto) {
  echo '<div class="container"><h2>Producto no encontrado</h2></div>';
  exit;
}
?>
<div class="container">
  <div style="display:none" data-track-event="page_view" data-page="product_detail" data-page-title="Detalle de Producto" data-product-id="<?php echo htmlspecialchars($id); ?>"></div>
  
  <header class="shop-header">
    <h1>GuiderShop</h1>
    <nav>
      <a href="/ecommerce">Inicio</a>
      <a href="/ecommerce#cart" id="cart-link">Carrito</a>
    </nav>
  </header>
  <main class="shop-main" style="display:block;">
    <section class="product-detail">
      <img src="https://dummyimage.com/320x320/0070f3/fff&text=<?=urlencode($producto->nombre)?>" alt="<?=htmlspecialchars($producto->nombre)?>" class="product-detail-img">
      <div class="product-detail-info">
        <h2><?=htmlspecialchars($producto->nombre)?></h2>
        <p class="price"><?=number_format((float)$producto->precio, 2, ',', '.')?> €</p>
        <p><?=htmlspecialchars($producto->descripcion)?></p>
        <h4>Detalles</h4>
        <ul>
          <?php foreach ($producto->detail->children() as $key => $value): ?>
            <li><strong><?=ucfirst($key)?>:</strong> <?=htmlspecialchars($value)?></li>
          <?php endforeach; ?>
        </ul>
        <button onclick="addToCart(<?= (int)$producto->id ?>, '<?= htmlspecialchars($producto->nombre) ?>', <?= (float)$producto->precio ?>)">Añadir al carrito</button>
      </div>
    </section>
  </main>
</div>
<script>
  // Reutiliza el carrito de la página principal
  if (!window.cart) window.cart = [];
  function addToCart(id, name, price) {
    window.cart.push({ id, name, price });
    sdk.track({ event: 'ecommerce:add_to_cart', productId: id, name, price });
    alert('Producto añadido al carrito');
  }
  sdk.track({ event: 'ecommerce:view_product_detail', productId: <?= (int)$producto->id ?>, name: '<?= htmlspecialchars($producto->nombre) ?>', price: <?= (float)$producto->precio ?> });
</script>
</body>
</html>
