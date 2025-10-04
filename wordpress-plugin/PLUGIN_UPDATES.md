# Sistema de Actualizaciones Automáticas del Plugin WordPress

## 📦 Librería Utilizada

El plugin utiliza [**Plugin Update Checker v5.6**](https://github.com/YahnisElsts/plugin-update-checker) de Yahnis Elsts, el estándar de la industria para actualizaciones automáticas de plugins WordPress desde repositorios externos.

## 🚀 Cómo Funciona

### Arquitectura

```
GitHub Release (tag)
       ↓
GitHub Actions (workflow)
       ↓
Genera guiders-wp-plugin-X.Y.Z.zip
       ↓
Adjunta como Release Asset
       ↓
Plugin Update Checker (cada 12h)
       ↓
Detecta nueva versión
       ↓
WordPress muestra notificación
       ↓
Usuario actualiza (1-click)
```

### Configuración Actual

**Ubicación**: `includes/class-guiders-updater.php`

```php
// Repositorio GitHub
$updateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/RogerPugaRuiz/guiders-sdk/',
    GUIDERS_WP_PLUGIN_PLUGIN_FILE,
    'guiders-wp-plugin'
);

// Buscar assets .zip en releases
$updateChecker->getVcsApi()->enableReleaseAssets(
    '/guiders-wp-plugin.*\.zip$/i'
);

// Solo releases estables (no pre-releases)
$updateChecker->getVcsApi()->setReleaseFilter(function($versionNumber, $release) {
    return empty($release->prerelease) && empty($release->draft);
});

// Verificar cada 12 horas
$updateChecker->setCheckPeriod(12);
```

## 📋 Tipos de Releases

### 1. **Stable Releases** (Actualizaciones Automáticas)
- **Tags**: `1.0.0`, `1.1.0`, `2.0.0`
- **Flag**: `prerelease: false`
- **Detección**: ✅ Plugin Update Checker las detecta automáticamente
- **Workflow**: `.github/workflows/release-wp-plugin.yml`

### 2. **Pre-releases** (No Detectadas Automáticamente)
- **Tags**: `1.0.8-alpha.1`, `1.0.8-beta.2`, `1.0.8-rc.1`
- **Flag**: `prerelease: true`
- **Detección**: ❌ Filtradas por `setReleaseFilter()`
- **Workflow**: `.github/workflows/pre-release-wp-plugin.yml`

**Nota**: Los pre-releases NO aparecen en WordPress automáticamente. Son útiles para testing manual descargando el ZIP desde GitHub.

## 🔄 Workflow de Release

### Release Stable (Producción)

1. **Preparar versión**:
   ```bash
   # Editar wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php
   # Version: 1.1.0
   # GUIDERS_WP_PLUGIN_VERSION: '1.1.0'
   
   # Editar wordpress-plugin/guiders-wp-plugin/readme.txt
   # Stable tag: 1.1.0
   # Añadir changelog
   ```

2. **Ejecutar script de release**:
   ```bash
   bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release 1.1.0"
   ```

3. **GitHub Actions automático**:
   - Build SDK (`npm run build`)
   - Copia bundle al plugin
   - Genera ZIP
   - Crea GitHub Release
   - Adjunta ZIP como asset

4. **WordPress detecta actualización** (en 12h o al forzar):
   - Plugin Update Checker verifica GitHub
   - Encuentra nueva versión estable
   - Muestra notificación en WordPress
   - Usuario actualiza con 1 clic

### Pre-release (Testing)

```bash
# Alpha
bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release 1.0.8-alpha.1"

# Beta
bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release 1.0.8-beta.1"

# RC
bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release 1.0.8-rc.1"
```

Estos tags crean releases marcados como `prerelease: true` que **NO** se detectan automáticamente.

## 🔧 Personalización Avanzada

### Cambiar Periodo de Verificación

```php
// En class-guiders-updater.php
$this->updateChecker->setCheckPeriod(6); // Verificar cada 6 horas
```

### Habilitar Pre-releases en Producción

```php
// ADVERTENCIA: Mostrará versiones alpha/beta/rc a todos los usuarios
$this->updateChecker->getVcsApi()->setReleaseFilter(function($versionNumber, $release) {
    // Solo excluir drafts
    return empty($release->draft);
});
```

### Filtrar por Patrón de Versión

```php
// Solo mostrar versiones 1.x.x
$this->updateChecker->getVcsApi()->setReleaseVersionFilter('/^1\.\d+\.\d+$/');
```

### Usar Branch en vez de Releases

```php
// Usar rama stable en vez de releases (NO RECOMENDADO)
$this->updateChecker->setBranch('stable');
```

## 🐛 Debugging

### Ver Logs de Actualización

Los logs aparecen en `wp-content/debug.log` si `WP_DEBUG` está activo:

```php
// Error al verificar actualizaciones
❌ [Guiders Plugin Update] API Error: ...

// Actualización exitosa
🚀 [Guiders Plugin] Successfully updated to version 1.1.0
```

### Forzar Verificación Manual

```php
// Desde código (development)
$updater = new GuidersUpdater();
$updater->forceUpdateCheck();
```

### Ver Información de Debug Bar

1. Instalar [Debug Bar](https://wordpress.org/plugins/debug-bar/)
2. Ir a Admin → Debug → "PUC (guiders-wp-plugin)"
3. Click en "Check Now"

### Ver Request/Response de API

```php
// Añadir en class-guiders-updater.php (después de initUpdateChecker)
add_action('puc_request_info_result-guiders-wp-plugin', function($pluginInfo, $result) {
    error_log('📊 Plugin Info: ' . print_r($pluginInfo, true));
}, 10, 2);
```

## 📁 Estructura de Archivos

```
wordpress-plugin/
├── guiders-wp-plugin/
│   ├── vendor/
│   │   └── plugin-update-checker/    ← Librería PUC v5.6
│   ├── includes/
│   │   └── class-guiders-updater.php ← Configuración actualizaciones
│   ├── guiders-wp-plugin.php         ← Header con Version
│   └── readme.txt                    ← Changelog + Stable tag
├── build-plugin.sh                   ← Script generación ZIP
└── release-wp-publish.sh             ← Script release completo
```

## 🔒 Seguridad

- ✅ **Checksums**: WordPress verifica integridad del ZIP descargado
- ✅ **HTTPS**: Todas las comunicaciones encriptadas (GitHub API/assets)
- ✅ **Sin credenciales**: Repositorio público, no requiere tokens
- ✅ **Validación versiones**: Solo actualiza si `version_compare()` es mayor
- ✅ **Sandbox**: WordPress instala en directorio temporal antes de aplicar

## 📚 Referencias

- [Plugin Update Checker Documentation](https://github.com/YahnisElsts/plugin-update-checker)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [WordPress Plugin Update API](https://developer.wordpress.org/plugins/plugin-basics/updating-your-plugin/)
- [SemVer Specification](https://semver.org/)

## ⚠️ Notas Importantes

1. **Versionado consistente**: El tag GitHub, `Version:` en PHP, y `Stable tag:` en readme.txt DEBEN coincidir exactamente.

2. **Assets obligatorios**: El workflow DEBE adjuntar un archivo `.zip` al release. Sin asset, PUC no puede descargar la actualización.

3. **No retaguear**: Nunca borrar/recrear tags publicados. Incrementar versión siempre (1.0.0 → 1.0.1).

4. **Pre-releases separados**: Alpha/Beta/RC son para testing manual, NO aparecen en WordPress.

5. **Fallback manual**: Si falla PUC, usuarios pueden descargar ZIP desde GitHub y subir manualmente.

## 🎯 Próximos Pasos

- [ ] Añadir screenshots al README.md del plugin
- [ ] Crear banners e iconos (actualmente usando placeholders)
- [ ] Considerar hosting propio si se requieren actualizaciones privadas
- [ ] Implementar telemetría de actualizaciones (opcional)
- [ ] Documentar proceso de rollback en caso de problemas
