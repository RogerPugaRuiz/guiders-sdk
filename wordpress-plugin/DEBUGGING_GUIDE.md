# Guía de Debugging para el Plugin WordPress

## Prevención de Errores de JavaScript Malformado

### Problema Común: Objetos Huérfanos

Al eliminar `console.log()` statements de archivos PHP con JavaScript incrustado, **NUNCA** uses `sed` o comandos automáticos que solo eliminan líneas individuales.

**❌ MAL - Deja objetos huérfanos:**
```bash
# Esto es PELIGROSO
sed -i '' '/console\.log(/d' archivo.php
```

**Problema:** Si había un `console.log` con un objeto como parámetro, quedará así:
```javascript
// ANTES:
console.log('Mensaje:', {
    functional: true,
    analytics: false
});

// DESPUÉS (ROTO):
{
    functional: true,
    analytics: false
});
```

### ✅ Solución Correcta

1. **Usa el script de validación ANTES de cada release:**
```bash
bash wordpress-plugin/validate-php-javascript.sh
```

2. **Elimina manualmente con cuidado:**
   - Abre el archivo en un editor
   - Busca cada `console.log`
   - Elimina **todo el statement completo**, incluyendo parámetros
   - Verifica que no queden bloques huérfanos

3. **Valida después de cada cambio:**
   - Ejecuta el script de validación
   - Comprueba sintaxis PHP: `php -l archivo.php`
   - Prueba en navegador antes de hacer release

## Script de Validación Automática

El script `validate-php-javascript.sh` detecta automáticamente:

✅ Bloques `if (debug)` vacíos
✅ Objetos JavaScript huérfanos
✅ Console statements no eliminados
✅ Errores de sintaxis PHP
✅ Cierres de objetos huérfanos `});`

### Uso del Script

```bash
# Validación manual
bash wordpress-plugin/validate-php-javascript.sh

# Validación automática (integrada en build)
bash wordpress-plugin/build-plugin.sh
```

## Integración en el Proceso de Build

El script de validación se ejecuta **automáticamente** antes de crear el ZIP del plugin:

```bash
npm run release:wp        # Incluye validación automática
bash wordpress-plugin/build-plugin.sh  # Incluye validación
```

**El build fallará si encuentra errores**, evitando releases con código roto.

## Checklist Pre-Release

Antes de hacer un release del plugin, verifica:

- [ ] Ejecutar `bash wordpress-plugin/validate-php-javascript.sh`
- [ ] Sin errores de sintaxis PHP
- [ ] Sin console.log/warn/error en archivos PHP
- [ ] Sin bloques if vacíos
- [ ] Probar en navegador local
- [ ] Verificar que no hay errores JavaScript en la consola
- [ ] Probar aceptación de cookies con plugins GDPR

## Debugging de Errores en Producción

Si encuentras un error `Uncaught SyntaxError: Unexpected token ':'` en producción:

1. **Identifica la línea exacta:**
   - Abre DevTools → Console
   - Anota el número de línea del error

2. **Descarga el ZIP del release:**
   ```bash
   curl -L https://github.com/RogerPugaRuiz/guiders-sdk/releases/download/v2.7.1/guiders-wp-plugin-2.7.1.zip -o plugin.zip
   unzip plugin.zip
   ```

3. **Valida el archivo:**
   ```bash
   # Extrae el archivo PHP del ZIP
   unzip -p plugin.zip guiders-wp-plugin/includes/class-guiders-public.php > temp.php

   # Busca la línea problemática
   sed -n '540,545p' temp.php
   ```

4. **Busca objetos huérfanos:**
   - Busca líneas con `'property': value` sin `var`/`return` antes
   - Busca `});` después de propiedades de objeto

5. **Aplica el fix y re-release**

## Patrones Problemáticos a Evitar

### ❌ Patrón 1: Bloque if vacío
```javascript
if (cookieConfig.debug) {
}
```
**Fix:** Eliminar completamente el bloque.

### ❌ Patrón 2: Objeto huérfano
```javascript
'functional': true,
'analytics': false
});
```
**Fix:** Eliminar el objeto completo o restaurar el contexto.

### ❌ Patrón 3: Console log con objeto multi-línea
```javascript
console.log('Estado:', {
    prop1: value1,
    prop2: value2
});
```
**Fix:** Eliminar **todas las líneas** del statement.

## Herramientas Útiles

### Validación Rápida de Sintaxis
```bash
# PHP
php -l wordpress-plugin/guiders-wp-plugin/includes/class-guiders-public.php

# Buscar console statements
grep -n "console\." wordpress-plugin/guiders-wp-plugin/includes/class-guiders-public.php

# Buscar objetos huérfanos
grep -n "^\s*'.*':\s*" wordpress-plugin/guiders-wp-plugin/includes/class-guiders-public.php | \
  grep -v "var\|return\|="
```

### Debugging en Navegador
```javascript
// Verificar que el SDK se carga correctamente
console.log(window.guiders);

// Verificar configuración
console.log(window.GUIDERS_CONFIG);

// Verificar que no hay logs del plugin
// (la consola debe estar limpia después de cargar la página)
```

## Historial de Bugs Resueltos

### v2.7.1 - Objetos JavaScript Huérfanos
**Fecha:** 2025-11-28
**Causa:** Eliminación automática de `console.log` con `sed` dejó objetos huérfanos
**Archivos afectados:**
- `class-guiders-public.php` líneas 452-457 (Moove GDPR)
- `class-guiders-public.php` líneas 574-577 (Beautiful Cookie Banner)
- `class-guiders-public.php` líneas 429-435 (Moove GDPR mapeo)

**Solución:**
- Eliminación manual de objetos huérfanos
- Creación de script de validación automática
- Integración en proceso de build
