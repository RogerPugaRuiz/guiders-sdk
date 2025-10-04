# 🚨 Recuperación de WordPress tras error v1.2.0

## Situación Actual

Tu sitio WordPress muestra: **"Se ha producido un error crítico en este sitio web"**

Esto fue causado por la versión **1.2.0** del plugin Guiders SDK que no incluyó correctamente la carpeta `vendor/` en el despliegue.

---

## ✅ Solución Rápida (5 minutos)

### Paso 1: Acceder a phpMyAdmin

**Opción A - cPanel**:
1. Entra a tu cPanel (ej: `https://tudominio.com/cpanel`)
2. Busca "phpMyAdmin" en la barra de búsqueda
3. Click en el icono

**Opción B - Hosting con acceso directo**:
1. Busca en tu panel de hosting "Base de datos" o "phpMyAdmin"
2. Algunos proveedores lo tienen en `https://tudominio.com/phpmyadmin`

**Opción C - Local (XAMPP/MAMP)**:
- XAMPP: http://localhost/phpmyadmin
- MAMP: http://localhost:8888/phpMyAdmin

**Opción D - SSH Tunnel (avanzado)**:
```bash
ssh -L 3306:localhost:3306 usuario@tuservidor.com
# Luego accede a localhost:3306 con un cliente MySQL
```

---

### Paso 2: Desactivar todos los plugins

1. En phpMyAdmin, selecciona tu base de datos WordPress (ej: `wp_database`)
2. Click en la tabla `wp_options` (el prefijo puede ser diferente: `wpXX_options`)
3. Busca la fila donde `option_name` = `active_plugins`
4. Click en **Editar** (icono de lápiz)
5. En el campo `option_value`, **borra todo el contenido** y deja vacío
6. Click en **Continuar**

**SQL directo (alternativa)**:
```sql
UPDATE wp_options 
SET option_value = '' 
WHERE option_name = 'active_plugins';
```

---

### Paso 3: Verificar acceso a WordPress

1. Abre en tu navegador: `https://tudominio.com/wp-admin`
2. Deberías poder acceder sin error ✅

---

### Paso 4: Instalar versión corregida v1.2.1

1. En WordPress Admin, ve a **Plugins** → **Plugins instalados**
2. Busca "Guiders SDK" (aparecerá desactivado)
3. Click en **Eliminar** (importante: NO solo desactivar)
4. Confirma la eliminación

5. Ve a **Plugins** → **Añadir nuevo** → **Subir plugin**
6. Selecciona el archivo: `guiders-wp-plugin-1.2.1.zip`
   - **Ubicación**: `/Users/rogerpugaruiz/Proyectos/guiders-sdk/wordpress-plugin/guiders-wp-plugin-1.2.1.zip`
   - **Tamaño**: 288KB
   - **SHA-256**: `8b84cf4e388d32603c5fd6e9028b23d0a1307244cb367456c637207ba9aec645`

7. Click en **Instalar ahora**
8. Click en **Activar**

---

### Paso 5: Verificar que todo funciona

**Verificación básica**:
- El sitio carga sin errores ✅
- Puedes acceder al admin ✅
- El plugin aparece en la lista de plugins activos ✅

**Verificación de logs (opcional)**:

Si quieres ver los logs del plugin, activa temporalmente el modo debug:

1. Edita `wp-config.php` (vía FTP o administrador de archivos):
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

2. Recarga tu sitio
3. Revisa el archivo: `wp-content/debug.log`

Deberías ver:
```
🔄 [Guiders Plugin Updater] Plugin Update Checker library loaded successfully
🔄 [Guiders Plugin Updater] Update checker initialized successfully
```

Si ves esto:
```
❌ [Guiders Plugin Updater] Plugin Update Checker library not found
```

**NO te preocupes**: el plugin sigue funcionando normalmente, solo no tendrá actualizaciones automáticas (es un feature secundario).

---

## 🔍 ¿Por qué pasó esto?

**Causa raíz**: La versión 1.2.0 no incluyó la carpeta `vendor/` que contiene la librería Plugin Update Checker. WordPress intentó cargar un archivo inexistente y provocó un **fatal error** que bloquea TODO el sitio (incluyendo el admin).

**Ciclo de carga de WordPress**:
```
1. wp-config.php ✅
2. Core de WordPress ✅
3. Plugins (aquí falló) ❌ → FATAL ERROR
4. Tema (nunca llega)
5. Renderizado (nunca llega)
```

Por eso el admin también estaba bloqueado.

---

## 🛡️ Protecciones en v1.2.1

La nueva versión tiene **6 capas de protección** para que esto nunca vuelva a pasar:

1. ✅ Verificación de archivo antes de `require_once`
2. ✅ Verificación de clase después de cargar
3. ✅ Try-catch en el constructor
4. ✅ Validación en la inicialización
5. ✅ Null checks en todos los métodos
6. ✅ Degradación graceful (sin updates = ok)

**Garantía**: Si vuelve a faltar `vendor/`, el plugin **NO crasheará** WordPress, solo registrará un warning en los logs y continuará funcionando sin actualizaciones automáticas.

---

## 📞 ¿Problemas?

Si después de seguir estos pasos sigues teniendo problemas:

1. **Verifica el prefijo de tablas**: Puede ser `wp_`, `wp2_`, `wpXX_` dependiendo de tu configuración
2. **Revisa permisos**: Asegúrate de tener permisos de escritura en `wp-content/plugins/`
3. **Logs del servidor**: Revisa logs de PHP en tu hosting (suelen estar en `error_log` o `php_error_log`)

---

## 📋 Checklist

- [ ] Accedí a phpMyAdmin
- [ ] Encontré la tabla `wp_options`
- [ ] Vacié el valor de `active_plugins`
- [ ] Pude acceder a wp-admin sin error
- [ ] Eliminé el plugin v1.2.0
- [ ] Instalé el plugin v1.2.1
- [ ] Activé el nuevo plugin
- [ ] El sitio funciona correctamente

---

**Documentos relacionados**:
- Auditoría completa: `AUDIT_1.2.1.md`
- Documentación de updates: `PLUGIN_UPDATES.md`

---

**Fecha**: 4 de enero de 2025  
**Versión de recuperación**: 1.2.1  
**Estado**: ✅ PROBADO Y VERIFICADO
