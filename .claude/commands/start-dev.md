# Start Development Servers

Inicia los servidores de desarrollo en segundo plano para el SDK y el demo PHP.

## Instrucciones

1. Inicia el servidor de desarrollo de Webpack (SDK) en segundo plano en el puerto 8080
2. Inicia el servidor PHP del demo en segundo plano en el puerto 8083
3. Muestra los comandos para ver los logs y detener los servidores

## Comandos a ejecutar

```bash
# Servidor SDK (Webpack dev server)
npm start &

# Servidor PHP demo
php -S 127.0.0.1:8083 -t demo/app &
```

## URLs de acceso

- SDK Dev Server: http://localhost:8080
- PHP Demo: http://127.0.0.1:8083

## Para detener los servidores

```bash
# Encontrar y matar los procesos
pkill -f "webpack serve"
pkill -f "php -S 127.0.0.1:8083"
```
