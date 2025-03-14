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

    default:
        http_response_code(404);
        echo "<h1>404 - Página no encontrada</h1>";
        break;
}