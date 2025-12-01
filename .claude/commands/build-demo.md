# Build SDK and Copy to Demo

Compila el SDK y copia el bundle al directorio demo.

## Instrucciones

1. Ejecuta `npm run build` para compilar el SDK
2. Copia `dist/index.js` a `demo/app/guiders-sdk.js`
3. Muestra un resumen del resultado

## Comandos a ejecutar

```bash
npm run build && cp dist/index.js ./demo/app/guiders-sdk.js
```

## Verificación

Después de ejecutar, confirma que el archivo se copió correctamente mostrando su tamaño.
