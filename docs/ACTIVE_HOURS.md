# 🕐 Horarios de Activación del Chat - Guiders SDK

La funcionalidad de **Horarios de Activación** permite configurar el SDK para que el chat esté disponible solo durante rangos horarios específicos. Fuera de estos horarios, el chat se oculta automáticamente.

## 📋 Características

- ✅ **Múltiples rangos horarios**: Configura horarios partidos (ej: 8:00-14:00 y 15:00-17:00)
- ✅ **Soporte de zonas horarias**: Especifica la zona horaria para interpretar los horarios
- ✅ **Rangos que cruzan medianoche**: Soporta horarios nocturnos (ej: 22:00-06:00)
- ✅ **Mensajes personalizados**: Define qué mostrar cuando el chat no está disponible
- ✅ **Verificación en tiempo real**: El estado se actualiza automáticamente
- ✅ **API programática**: Control dinámico desde JavaScript

## 🚀 Configuración Básica

### En el SDK directamente

```javascript
window.GUIDERS_CONFIG = {
    apiKey: 'tu-api-key',
    activeHours: {
        enabled: true,
        timezone: 'America/Mexico_City',  // Opcional, por defecto usa hora local
        ranges: [
            { start: '08:00', end: '14:00' },
            { start: '15:00', end: '17:00' }
        ],
        fallbackMessage: 'El chat está disponible de 8:00-14:00 y 15:00-17:00. ¡Vuelve pronto!'
    }
};
```

### En WordPress Plugin

1. Ve a **Configuración → Guiders SDK**
2. Busca la sección **"Horarios de Activación del Chat"**
3. Activa **"Habilitar Horarios de Activación"**
4. Configura:
   - **Zona Horaria**: Selecciona tu zona horaria
   - **Rangos de Horarios**: Agrega uno o más rangos
   - **Mensaje de Fallback**: Personaliza el mensaje para horarios no disponibles

## 📖 Ejemplos de Configuración

### 1. Horario Comercial Normal
```javascript
activeHours: {
    enabled: true,
    ranges: [
        { start: '09:00', end: '18:00' }
    ],
    fallbackMessage: 'Nuestro chat está disponible de 9:00 AM a 6:00 PM.'
}
```

### 2. Horario Partido (Siesta)
```javascript
activeHours: {
    enabled: true,
    timezone: 'Europe/Madrid',
    ranges: [
        { start: '08:00', end: '14:00' },  // Mañana
        { start: '15:00', end: '17:00' }   // Tarde
    ]
}
```

### 3. Soporte Nocturno
```javascript
activeHours: {
    enabled: true,
    ranges: [
        { start: '22:00', end: '06:00' }  // Cruza medianoche
    ],
    fallbackMessage: 'Soporte nocturno: 22:00 PM - 6:00 AM'
}
```

### 4. Múltiples Turnos
```javascript
activeHours: {
    enabled: true,
    ranges: [
        { start: '06:00', end: '14:00' },  // Turno mañana
        { start: '14:00', end: '22:00' },  // Turno tarde
        { start: '22:00', end: '06:00' }   // Turno noche
    ]
}
```

### 5. Desactivar (24/7)
```javascript
activeHours: {
    enabled: false  // Chat disponible 24/7
}
```

## 🌍 Zonas Horarias Soportadas

Puedes usar cualquier zona horaria estándar de la [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones):

```javascript
// Ejemplos comunes
timezone: 'America/New_York'        // Este de EE.UU.
timezone: 'America/Los_Angeles'     // Oeste de EE.UU.
timezone: 'America/Mexico_City'     // México
timezone: 'America/Bogota'          // Colombia
timezone: 'America/Lima'            // Perú
timezone: 'America/Sao_Paulo'       // Brasil
timezone: 'Europe/Madrid'           // España
timezone: 'Europe/London'           // Reino Unido
timezone: 'UTC'                     // Tiempo Universal
```

Si no especificas zona horaria, se usa la hora local del navegador del visitante.

## 🛠️ API Programática

### Verificar si el chat está activo
```javascript
const isActive = window.guiders.isChatActive();
console.log('Chat disponible:', isActive);
```

### Obtener mensaje de fallback
```javascript
const message = window.guiders.getChatFallbackMessage();
console.log('Mensaje cuando no disponible:', message);
```

### Obtener próximo horario disponible
```javascript
const nextTime = window.guiders.getNextAvailableTime();
console.log('Próximo horario:', nextTime); // Ej: "09:00"
```

### Actualizar configuración dinámicamente
```javascript
const success = window.guiders.updateActiveHours({
    enabled: true,
    ranges: [
        { start: '10:00', end: '16:00' }
    ],
    fallbackMessage: 'Nuevo horario: 10:00 - 16:00'
});

console.log('Configuración actualizada:', success);
```

### Desactivar horarios dinámicamente
```javascript
window.guiders.disableActiveHours();
// Ahora el chat estará disponible 24/7
```

## ⚙️ Configuración Avanzada

### Validación automática
El SDK valida automáticamente la configuración:

```javascript
// ❌ Configuración inválida
activeHours: {
    enabled: true,
    ranges: [
        { start: '25:00', end: '18:00' }  // Hora inválida
    ]
}
// → Se mostrará warning en consola y se ignorará
```

### Verificación periódica
El SDK verifica automáticamente el estado cada 5 minutos cuando el chat está inactivo por horarios, y reactiva el botón cuando entra en horario disponible.

### Mensajes de sistema
Cuando el chat cambia de estado, se registran mensajes en la consola:

```
[TrackingPixelSDK] 🕐 Chat no está disponible según horarios configurados
[TrackingPixelSDK] 🕐 ✅ Chat ahora está disponible según horarios
```

## 🎨 Personalización en WordPress

### Estilos CSS personalizados
Puedes personalizar la apariencia cuando el chat no está disponible:

```css
/* Ocultar completamente el botón fuera de horarios */
.chat-toggle-button[style*="display: none"] {
    display: none !important;
}

/* O mostrar un indicador de horarios */
.chat-unavailable-indicator {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #f8d7da;
    color: #721c24;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
}
```

### Integración con temas
```php
// En functions.php de tu tema
add_action('wp_footer', function() {
    if (is_plugin_active('guiders-wp-plugin/guiders-wp-plugin.php')) {
        ?>
        <script>
        // Agregar lógica personalizada cuando cambia el estado
        if (window.guiders) {
            setInterval(function() {
                const isActive = window.guiders.isChatActive();
                document.body.classList.toggle('chat-available', isActive);
            }, 30000);
        }
        </script>
        <?php
    }
});
```

## 🔧 Solución de Problemas

### El chat no se oculta
1. Verifica que `enabled: true` esté configurado
2. Confirma que los rangos tienen formato correcto (`HH:MM`)
3. Revisa la zona horaria configurada
4. Verifica en consola del navegador si hay errores

### Horarios incorrectos
1. Confirma la zona horaria del servidor vs. configuración
2. Verifica formato de 24 horas (no AM/PM)
3. Para rangos que cruzan medianoche, asegúrate que `start > end`

### Configuración no se aplica
1. Refresca la página después de cambios
2. Verifica que no hay errores de JavaScript
3. Confirma que la configuración está en `window.GUIDERS_CONFIG`

## 📊 Casos de Uso Comunes

### E-commerce
```javascript
// Horario de atención al cliente
activeHours: {
    enabled: true,
    ranges: [{ start: '08:00', end: '22:00' }],
    fallbackMessage: '🛍️ Soporte al cliente: 8:00 AM - 10:00 PM'
}
```

### SaaS/Soporte Técnico
```javascript
// Soporte técnico horario laboral
activeHours: {
    enabled: true,
    timezone: 'UTC',
    ranges: [{ start: '09:00', end: '17:00' }],
    fallbackMessage: '💻 Soporte técnico: 9:00 AM - 5:00 PM UTC'
}
```

### Servicios de Salud
```javascript
// Citas médicas horario partido
activeHours: {
    enabled: true,
    ranges: [
        { start: '08:00', end: '13:00' },
        { start: '15:00', end: '19:00' }
    ],
    fallbackMessage: '🏥 Citas disponibles: 8:00-13:00 y 15:00-19:00'
}
```

### Servicios Financieros
```javascript
// Horario bancario extendido
activeHours: {
    enabled: true,
    ranges: [{ start: '06:00', end: '23:00' }],
    fallbackMessage: '💰 Consultas financieras: 6:00 AM - 11:00 PM'
}
```

---

## 🔗 Enlaces Relacionados

- [Demo Interactiva](../examples/active-hours-demo.html)
- [Configuración WordPress](wordpress-plugin-config.md)
- [API Reference](../docs/api-reference.md)

## 📝 Changelog

- **v1.0.4**: Implementación inicial de horarios de activación
- **v1.0.4**: Soporte para zonas horarias y múltiples rangos
- **v1.0.4**: Integración con plugin WordPress