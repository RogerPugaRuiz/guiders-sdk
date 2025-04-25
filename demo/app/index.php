<?php
// index.php
$page = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

switch ($page) {
    case '':
        require 'pages/home.php';
        break;

    case 'about':
        require 'pages/about.php';
        break;

    case 'contact':
        require 'pages/contact.php';
        break;

    case 'ecommerce':
        require 'pages/ecommerce-demo.php';
        break;

    case 'ecommerce/pages/product-detail.php':
        require 'pages/product-detail.php';
        break;

    default:
        http_response_code(404);
        echo "<h1>404 - Página no encontrada</h1>";
        break;
}