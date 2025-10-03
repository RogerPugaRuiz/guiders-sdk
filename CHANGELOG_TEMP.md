# Changelog Temporal - Guiders SDK WordPress Plugin

Este archivo contiene los cambios pendientes de agregar al readme.txt del plugin de WordPress.

## Versión en Desarrollo: 1.0.7

### 🎯 Cambios Realizados

#### 💬 Mejoras en el Avatar del Bot

* **Cambio de texto**: Avatar del bot ahora muestra "BOT" en lugar de "AI" para mayor claridad
* **Diseño refinado**: Eliminado el box-shadow del avatar para un aspecto más limpio y profesional
* **Esfera perfecta**: Garantizadas dimensiones exactas (32x32px) con `box-sizing: border-box` y constraints de tamaño
* **Bordes optimizados**: Removido border para un acabado más suave

#### 🕐 Rediseño de la Visualización de Hora

* **Ubicación mejorada**: La hora ahora aparece **dentro** de la burbuja del mensaje
  * En mensajes propios: dentro del área azul con texto blanco semitransparente
  * En mensajes de otros: dentro del área blanca con texto gris sutil
* **Tipografía unificada**:
  * Font size: 10px para discreción
  * Font weight: 400 para sutileza
  * Opacity: 0.9 para integración visual perfecta
* **Layout optimizado**:
  * Estructura en columna (texto + hora) dentro de cada mensaje
  * Alineación consistente a la derecha
  * Espaciado mejorado con margin-top de 4px

#### 🔧 Mejoras Técnicas

* **Estructura HTML unificada**: Ambos tipos de mensajes usan `message-content-wrapper` consistente
* **CSS optimizado**: Layout flexbox para mejor control de la disposición de elementos
* **Padding ajustado**: Aumentado a 8x12px para mejor respiración del contenido
* **Compatibilidad**: Cambios aplicados en `message-renderer.ts` (sistema unificado de renderizado)

---

## Próximos Cambios Pendientes

_Aquí se irán agregando los siguientes cambios que se realicen..._

---

## Instrucciones de Uso

1. **Para agregar nuevos cambios**: Edita este archivo y agrega la nueva funcionalidad en la sección "Versión en Desarrollo"
2. **Para release**: Copia el contenido del bloque "Formato para readme.txt" al archivo oficial `readme.txt`
3. **Actualizar versión**: Cambiar tanto en este archivo como en los archivos del plugin (`guiders-wp-plugin.php`)

---

## Validaciones Antes del Release

* [ ] Compilación exitosa del SDK (`npm run build`)
* [ ] Tests de funcionalidad pasando
* [ ] Verificación en navegadores principales
* [ ] Pruebas con diferentes configuraciones
* [ ] Documentación actualizada
