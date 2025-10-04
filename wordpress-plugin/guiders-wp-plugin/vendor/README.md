# Vendor Dependencies

Este directorio contiene dependencias de terceros que se incluyen directamente con el plugin.

## Plugin Update Checker v5.6

**Librería**: [YahnisElsts/plugin-update-checker](https://github.com/YahnisElsts/plugin-update-checker)  
**Versión**: 5.6  
**Licencia**: MIT  
**Propósito**: Permite actualizaciones automáticas del plugin desde GitHub Releases

### ¿Por qué está incluida?

WordPress no proporciona un mecanismo integrado para actualizaciones desde repositorios externos (solo desde wordpress.org). Esta librería es el estándar de facto en la industria para plugins comerciales o privados.

### Actualización

Para actualizar la librería a una nueva versión:

1. Descargar la última release desde: https://github.com/YahnisElsts/plugin-update-checker/releases
2. Reemplazar el contenido de `plugin-update-checker/` con la nueva versión
3. Verificar que el archivo principal sigue siendo `plugin-update-checker/plugin-update-checker.php`
4. Probar que las actualizaciones siguen funcionando

### Alternativas Consideradas

- **Composer**: Requeriría `composer install` en producción o incluir `vendor/` completo (con más dependencias innecesarias)
- **Implementación manual**: Más código a mantener, menos robusto, sin soporte de la comunidad
- **WordPress.org**: No aplicable para plugins privados/comerciales

### Referencias

- [Documentación oficial](https://github.com/YahnisElsts/plugin-update-checker/blob/master/README.md)
- [Guía de integración del proyecto](../../PLUGIN_UPDATES.md)
