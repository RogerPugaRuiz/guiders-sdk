# Changelog Temporal - Guiders SDK WordPress Plugin

Este archivo contiene los cambios pendientes de agregar al readme.txt del plugin de WordPress.

## Versión en Desarrollo: 1.2.2 (próxima versión)

### Cambios Realizados

**Estado actual**: No hay cambios pendientes de publicar. Última versión publicada: **1.2.1** ✅

---

## Cambios Ya Publicados en v1.2.1 (4 de octubre de 2025)

### 🚨 HOTFIX CRÍTICO - Correcciones de Seguridad

**Archivos modificados**:
- `guiders-wp-plugin.php` - Eliminación de código duplicado
- `includes/class-guiders-updater.php` - Refactorización completa con 6 capas de protección

**Problemas corregidos**:

1. ✅ **Duplicación de constante GUIDERS_WP_PLUGIN_VERSION** (CRÍTICO)
   - Se definía dos veces (1.2.1 primero, luego 1.1.0 que sobreescribía)
   - **Impacto**: Plugin reportaba versión incorrecta
   - **Solución**: Eliminado bloque duplicado de código

2. ✅ **Variable global `$puc_available` frágil** (ALTA)
   - Usaba variable global propensa a colisiones
   - **Impacto**: Posibles conflictos con otros plugins
   - **Solución**: Reemplazada por propiedad privada `$this->libraryAvailable`

3. ✅ **Falta protección en métodos** (ALTA)
   - `setupCustomizations()` no verificaba si `$updateChecker` existía
   - **Impacto**: Posible fatal error en edge cases
   - **Solución**: Agregados null checks defensivos en TODOS los métodos

4. ✅ **Sin try-catch en código crítico** (MEDIA-ALTA)
   - Constructor podía lanzar Exception no capturada
   - **Impacto**: Fatal error si PUC library tiene problemas
   - **Solución**: Constructor completamente envuelto en try-catch

**Mejoras de robustez**:
- ✅ 6 capas de protección contra fatal errors
- ✅ Verificación `file_exists()` antes de require
- ✅ Verificación `class_exists()` después de cargar biblioteca
- ✅ Try-catch en constructor y métodos críticos
- ✅ Null checks en todos los métodos públicos
- ✅ Degradación graceful: plugin funciona sin updates si PUC falta
- ✅ Logs mejorados con prefijos emoji (🔄 debug, ❌ error)

**Documentación nueva**:
- `AUDIT_1.2.1.md` - Auditoría exhaustiva de seguridad (500+ líneas)
- `README_RECOVERY.md` - Guía de recuperación ante errores

---

## Cambios Ya Publicados en v1.2.0 (4 de octubre de 2025)

### 🚀 Sistema de Actualizaciones Automáticas

**Nueva funcionalidad**: Plugin Update Checker v5.6 integrado

- ✅ Actualizaciones automáticas desde GitHub Releases
- ✅ Detección cada 12 horas
- ✅ Filtrado de pre-releases (alpha/beta/rc)
- ✅ Notificaciones en WordPress admin
- ✅ Actualización con 1 click

**Archivos nuevos**:
- `vendor/plugin-update-checker/` - Librería PUC v5.6 (116 archivos)
- `vendor/README.md` - Documentación de dependencias
- `includes/class-guiders-updater.php` - Sistema de updates
- `PLUGIN_UPDATES.md` - Documentación completa

**⚠️ NOTA**: Esta versión contenía un bug crítico (vendor/ no se incluía en algunos despliegues). Corregido en v1.2.1.

---

## Próximos Cambios Pendientes

_No hay cambios pendientes actualmente. Este archivo se actualizará cuando se agreguen nuevas funcionalidades._

---

## Instrucciones de Uso

1. **Para agregar nuevos cambios**: Edita este archivo y agrega la nueva funcionalidad en la sección "Versión en Desarrollo"
2. **Para release**: Copia el contenido del bloque "Formato para readme.txt" al archivo oficial `readme.txt`
3. **Actualizar versión**: Cambiar tanto en este archivo como en los archivos del plugin (`guiders-wp-plugin.php`)

---

## Validaciones Antes del Release

* [x] Compilación exitosa del SDK (`npm run build`)
* [x] Tests de funcionalidad pasando
* [ ] Verificación en navegadores principales
* [ ] Pruebas con diferentes configuraciones
* [ ] Documentación actualizada




