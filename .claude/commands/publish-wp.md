---
description: Publicar nueva versión del plugin WordPress en GitHub
argument-hint: [version-type] (MAJOR, MINOR, PATCH, AUTO)
---

# Publicar Nueva Versión del Plugin WordPress

Sigue estos pasos para publicar una nueva versión del plugin `guiders-wp-plugin` en GitHub:

## 1. Analizar Cambios desde Último Release

**Tarea**: Obtén el último tag de versión y lista todos los commits nuevos desde ese tag.

```bash
# Obtener último tag
git describe --tags --abbrev=0

# Listar commits desde último tag (formato detallado)
git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges
```

**Análisis requerido**:
  
- Identifica los tipos de cambios usando conventional commits:
- **feat:** → cambios MINOR (nueva funcionalidad)
- **fix:** → cambios PATCH (corrección de bugs)
- **BREAKING CHANGE** o **!** → cambios MAJOR (rompe compatibilidad)
- **chore:**, **docs:**, **style:** → no afectan versión pública

## 2. Determinar Nueva Versión (SemVer)

**Tarea**: Determina el tipo de versión a publicar.

### 2.1. Verificar si se proporcionó argumento

**Si el usuario ejecutó el comando con argumento** (ej: `/publish-wp MINOR`):

- Validar que el argumento sea válido (MAJOR, MINOR, PATCH, AUTO)
- **Si el argumento es "AUTO"**: Continuar con análisis automático de commits (ver 2.2)
- **Si el argumento es MAJOR, MINOR o PATCH**:
  - Usar directamente el tipo de versión especificado
  - Calcular la nueva versión basándose en el tipo especificado
  - Saltar al paso 3 (Generar Changelog)

**Si NO se proporcionó argumento**:

- Continuar con análisis automático de commits (ver 2.2)

### 2.2. Análisis automático (sin argumento)

Basándote en los commits analizados en el paso 1, determina el tipo de versión:

- **MAJOR** (X.0.0): Cambios que rompen compatibilidad (BREAKING CHANGE)
- **MINOR** (x.Y.0): Nuevas funcionalidades sin romper compatibilidad (feat)
- **PATCH** (x.y.Z): Solo correcciones de bugs (fix)

Ejemplo:

- Versión actual: `1.6.0`
- Commits: 3 feat, 2 fix
- Nueva versión sugerida: `1.7.0` (MINOR)

**Reglas de decisión automática**:

- Si encuentra BREAKING CHANGE → MAJOR
- Si encuentra feat (sin breaking) → MINOR
- Si solo encuentra fix → PATCH
- Si no hay cambios relevantes → PATCH (incremento mínimo)

## 3. Generar Changelog

**Tarea**: Crea un changelog bien formateado en español basado en los commits:

**Formato del changelog**:

```
= X.Y.Z =
* **✨ Título Principal del Feature**: Descripción breve
  * **Subfeature 1**: Detalle específico
  * **Subfeature 2**: Otro detalle
* **🐛 Bug Fixes**: Lista de correcciones
  * Corrección 1
  * Corrección 2
* **🔧 Mejoras**: Otras mejoras técnicas
  * Mejora 1
```

**Guías**:

- Usa emojis: ✨ (feat), 🐛 (fix), 🔧 (chore), 📚 (docs), ⚡ (perf)
- Agrupa por tipo: Features, Bug Fixes, Mejoras, Breaking Changes
- Escribe en español, lenguaje claro para usuarios finales
- Destaca lo más importante primero

## 4. Presentar Resumen y Confirmar

**Tarea**: Muestra al usuario un resumen completo y **PREGUNTA** si desea continuar:

```
📦 RESUMEN DE NUEVA VERSIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Versión actual:  1.6.0
📌 Nueva versión:   1.7.0 (MINOR)
📌 Total commits:   5 commits nuevos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CHANGELOG GENERADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[changelog aquí]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ARCHIVOS A MODIFICAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php
   - Línea 6: Version: 1.7.0
   - Línea 24: GUIDERS_WP_PLUGIN_VERSION = '1.7.0'

2. wordpress-plugin/guiders-wp-plugin/readme.txt
   - Línea 7: Stable tag: 1.7.0
   - Línea 151+: Agregar changelog de 1.7.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Deseas continuar con la publicación de la versión 1.7.0?
```

**USA AskUserQuestion tool con las siguientes opciones**:

- Pregunta: "¿Deseas continuar con la publicación de esta versión?"
- Opciones:
  1. "Sí, publicar ahora" (continuar con paso 5)
  2. "Cambiar versión" (volver a paso 2 y preguntar qué versión)
  3. "Editar changelog" (permitir edición manual antes de continuar)
  4. "Cancelar" (detener proceso)

## 5. Actualizar Archivos de Versión

**Si el usuario confirma**, actualiza los siguientes archivos:

### 5.1. Actualizar `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php`

Modifica dos líneas:

- Header `Version:` (línea ~6)
- Constante `GUIDERS_WP_PLUGIN_VERSION` (línea ~24)

```php
* Version: 1.7.0
```

```php
define('GUIDERS_WP_PLUGIN_VERSION', '1.7.0');
```

### 5.2. Actualizar `wordpress-plugin/guiders-wp-plugin/readme.txt`

Modifica:

- Línea ~7: `Stable tag:`
- Línea ~151+: Agregar nuevo changelog al inicio de la sección `== Changelog ==`

**Formato**:

```
Stable tag: 1.7.0
```

```
== Changelog ==

= 1.7.0 =
[changelog generado en paso 3]

= 1.6.0 =
[changelog anterior...]
```

## 6. Ejecutar Script de Publicación

**Tarea**: Ejecuta el script de release con el mensaje de commit apropiado:

```bash
bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release X.Y.Z"
```

**El script automáticamente**:

1. ✅ Build del SDK (`npm run build`)
2. ✅ Copia SDK a plugin
3. ✅ Genera ZIP del plugin
4. ✅ Crea commit con archivos actualizados
5. ✅ Crea tag `vX.Y.Z`
6. ✅ Push a `origin/main` y tag

## 7. Verificar Publicación

**Tarea final**: Verifica que todo se publicó correctamente:

```bash
# Verificar que el tag existe en remoto
git ls-remote --tags origin | grep vX.Y.Z

# Mostrar último commit
git log -1 --oneline
```

**Informa al usuario**:

```
🎉 Publicación completada exitosamente!

✅ Versión X.Y.Z publicada
✅ Tag vX.Y.Z creado y pusheado
✅ ZIP generado: wordpress-plugin/guiders-wp-plugin-X.Y.Z.zip

📦 Próximos pasos opcionales:
1. Crear GitHub Release en: https://github.com/RogerPugaRuiz/guiders-sdk/releases/new
2. Adjuntar el archivo ZIP al release
3. El sistema de auto-updates del plugin detectará la nueva versión automáticamente
```

---

## Notas Importantes

- **SIEMPRE pregunta al usuario antes de hacer cambios** (paso 4)
- **NO ejecutes el script de publicación sin confirmación**
- Si hay cambios sin commitear que no son del plugin, **advierte al usuario**
- Si el tag ya existe, **pregunta si desea sobrescribir o cancelar**
- Mantén el formato del changelog consistente con versiones anteriores
- Los changelog deben estar en **ESPAÑOL** para usuarios finales de WordPress

## Errores Comunes

1. **"No se pudo extraer versión"**: Verifica formato en línea `* Version:` del plugin.php
2. **"ZIP no generado"**: El build falló, revisa errores de webpack
3. **"Tag ya existe"**: Usa `git tag -d vX.Y.Z` y `git push origin :refs/tags/vX.Y.Z` para eliminar
4. **"Error al hacer push"**: Verifica permisos de GitHub y que estés en main

## Workflow Completo Resumido

```
1. git describe + git log       → Obtener cambios
2. Determinar versión           → Argumento proporcionado?
                                   SÍ: usar ese tipo (MAJOR/MINOR/PATCH)
                                   NO: analizar commits automáticamente
3. Generar changelog            → Formato markdown en español
4. AskUserQuestion             → ¿Continuar? (SÍ/NO/EDITAR/CAMBIAR)
5. Edit archivos               → plugin.php + readme.txt
6. Bash script                 → release-wp-publish.sh
7. Verificar                   → git ls-remote + informar usuario
```
