# Integración con WP Rocket

Este documento explica cómo usar el Guiders SDK con WP Rocket, un popular plugin de optimización para WordPress.

## ¿Qué es WP Rocket?

WP Rocket es un plugin de caché y optimización para WordPress que incluye lazy loading de JavaScript. Cuando está activo, puede cambiar el atributo `type` de los scripts a `type="rocketlazyloadscript"` para cargarlos de forma diferida.

## Configuración del SDK con WP Rocket

### Método 1: Usando atributos data (Recomendado)

```html
<script 
    src="https://tu-dominio.com/guiders-sdk.js" 
    data-api-key="tu-clave-api"
    type="rocketlazyloadscript">
</script>
```

### Método 2: Usando configuración global

```html
<script>
window.GUIDERS_CONFIG = {
    apiKey: 'tu-clave-api'
};
</script>
<script 
    src="https://tu-dominio.com/guiders-sdk.js" 
    type="rocketlazyloadscript">
</script>
```

### Método 3: Usando parámetros en la URL

```html
<script 
    src="https://tu-dominio.com/guiders-sdk.js?apiKey=tu-clave-api" 
    type="rocketlazyloadscript">
</script>
```

## Características de Compatibilidad

El SDK ahora incluye las siguientes mejoras para WP Rocket:

### 1. Detección Robusta de Scripts

- Múltiples métodos de fallback para encontrar el script del SDK
- Soporte para scripts con `type="rocketlazyloadscript"`
- Búsqueda por atributos específicos del SDK

### 2. Inicialización Adaptativa

- Detección automática del estado de carga del documento
- Soporte para eventos de WP Rocket
- Prevención de múltiples inicializaciones

### 3. Configuración Flexible

- Múltiples formas de proporcionar la API key
- Configuración global opcional
- Fallbacks automáticos entre métodos

## Configuración de WP Rocket

### Excluir el SDK del Lazy Loading (Opcional)

Si prefieres que el SDK se cargue inmediatamente sin lazy loading:

1. Ve a **WP Rocket > Optimización de archivos > JavaScript**
2. En "Archivos JavaScript excluidos", añade:

   ```text
   guiders-sdk
   ```

### Preload del SDK (Recomendado)

Para mejorar la velocidad de carga:

1. Ve a **WP Rocket > Precargas > Preload**
2. Añade el enlace del SDK:

   ```text
   https://tu-dominio.com/guiders-sdk.js
   ```

## Verificación de Funcionamiento

Para verificar que el SDK funciona correctamente con WP Rocket:

1. Abre las herramientas de desarrollador del navegador
2. Ve a la pestaña **Console**
3. Deberías ver mensajes como:

   ```text
   Entorno de desarrollo: false
   Servicio de mensajes no leídos inicializado
   ```

## Resolución de Problemas

### Error: "No se encontró el script del SDK Guiders"

**Solución:** Asegúrate de usar uno de los métodos de configuración mencionados arriba.

### Error: "No se encontró la clave API"

**Soluciones:**

1. Verifica que el atributo `data-api-key` esté presente
2. Comprueba la configuración de `window.GUIDERS_CONFIG`
3. Verifica los parámetros en la URL del script

### El SDK no se inicializa

**Soluciones:**

1. Verifica que WP Rocket no esté bloqueando el script
2. Comprueba la consola por errores de JavaScript
3. Asegúrate de que la API key sea válida

## Mejores Prácticas

1. **Usa atributos data**: Es el método más confiable y no depende de JavaScript adicional
2. **Configura preload**: Mejora la velocidad de carga del SDK
3. **Monitorea la consola**: Para verificar que todo funciona correctamente
4. **Testa en diferentes dispositivos**: WP Rocket puede comportarse diferente en móviles

## Soporte

Si encuentras problemas específicos con WP Rocket, por favor:

1. Incluye la versión de WP Rocket que estás usando
2. Proporciona la configuración exacta del script
3. Incluye cualquier mensaje de error de la consola
4. Menciona si funciona con WP Rocket desactivado
