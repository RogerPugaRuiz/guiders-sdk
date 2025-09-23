# Configuración de Horarios Activos en WordPress

Esta guía te ayudará a configurar los horarios de activación del chat en el plugin de WordPress de Guiders SDK.

## 📋 Acceso a la Configuración

1. Inicia sesión en tu panel de administración de WordPress
2. Ve a **Configuración → Guiders SDK**
3. Busca la sección **"Horarios de Activación del Chat"**

## ⚙️ Configuración Paso a Paso

### 1. Activar Horarios de Restricción

- ✅ Marca la casilla **"Activar restricción por horarios"**
- Si no está marcada, el chat estará disponible 24/7

### 2. Seleccionar Zona Horaria

Elige la zona horaria que corresponde a tu ubicación:

- **Sin especificar**: Usa la hora local del navegador del visitante
- **America/Mexico_City**: Hora del centro de México
- **Europe/Madrid**: Hora de España  
- **America/New_York**: Hora del este de EE.UU.
- **Y muchas más...**

### 3. Configurar Rangos de Horarios

#### Horario Simple
Para un horario comercial normal (9:00 AM - 6:00 PM):
1. **Desde**: 09:00
2. **Hasta**: 18:00

#### Horario Partido
Para horario con pausa de almuerzo (8:00-14:00 y 15:00-17:00):
1. Primer rango:
   - **Desde**: 08:00
   - **Hasta**: 14:00
2. Haz clic en **"+ Agregar horario"**
3. Segundo rango:
   - **Desde**: 15:00
   - **Hasta**: 17:00

### 4. Mensaje Personalizado

En el campo **"Mensaje cuando Chat no está Disponible"**, puedes escribir:

```
Nuestro chat de soporte está disponible de Lunes a Viernes, 
de 8:00 AM a 6:00 PM (hora local). 

¡Vuelve durante nuestros horarios de atención y te ayudaremos enseguida!
```

## 🕐 Ejemplos de Configuración

### Tienda Online
- **Horarios**: 10:00 - 22:00
- **Zona horaria**: Tu zona local
- **Mensaje**: "🛍️ Atención al cliente: 10:00 AM - 10:00 PM. ¡Consúltanos sobre productos, pedidos y envíos!"

### Consultorio Médico
- **Horarios**: 08:00 - 13:00 y 15:00 - 19:00
- **Zona horaria**: Tu zona local  
- **Mensaje**: "🏥 Citas disponibles: 8:00 AM - 1:00 PM y 3:00 PM - 7:00 PM de Lunes a Viernes."

### SaaS/Software
- **Horarios**: 09:00 - 17:00
- **Zona horaria**: UTC (para clientes internacionales)
- **Mensaje**: "💻 Soporte técnico: 9:00 AM - 5:00 PM UTC. Para emergencias, consulta nuestra documentación."

### Restaurante
- **Horarios**: 12:00 - 15:00 y 19:00 - 23:00
- **Zona horaria**: Tu zona local
- **Mensaje**: "🍽️ Reservas: 12:00 PM - 3:00 PM y 7:00 PM - 11:00 PM. ¡Te esperamos!"

## ✅ Verificar Configuración

Después de guardar:

1. **Visita tu sitio web** en una nueva ventana
2. **Verifica el horario actual**:
   - Si está dentro del rango: El botón de chat debe aparecer
   - Si está fuera del rango: El botón debe estar oculto
3. **Revisa la consola del navegador** (F12) para ver mensajes como:
   ```
   [TrackingPixelSDK] 🕐 Chat no está disponible según horarios configurados
   ```

## 🔧 Solución de Problemas

### El chat no se oculta fuera de horarios

1. **Verifica que esté activado**: La casilla debe estar marcada
2. **Revisa el formato de horas**: Debe ser HH:MM (24 horas)
3. **Confirma la zona horaria**: Puede afectar el cálculo
4. **Refresca la página**: Los cambios requieren recargar

### Horarios incorrectos

1. **Zona horaria**: Confirma que sea la correcta para tu ubicación
2. **Formato 24 horas**: Usa 14:00 en lugar de 2:00 PM
3. **Rangos que cruzan medianoche**: Ej: 22:00 - 06:00 (válido)

### Los cambios no se aplican

1. **Guarda la configuración**: Haz clic en "Guardar cambios"
2. **Limpia caché**: Si usas plugins de caché, limpia la caché del sitio
3. **Verifica JavaScript**: Abre consola para ver si hay errores

## 🎨 Personalización Avanzada

### CSS Personalizado

Agrega a tu tema para personalizar la apariencia:

```css
/* Estilo cuando el chat no está disponible */
.chat-unavailable {
    opacity: 0.5;
    pointer-events: none;
}

/* Mensaje de horarios personalizado */
.chat-hours-message {
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: #f8d7da;
    color: #721c24;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

### PHP Personalizado

En `functions.php` de tu tema:

```php
// Mostrar horarios en el footer
add_action('wp_footer', function() {
    $settings = get_option('guiders_wp_plugin_settings', array());
    if (!empty($settings['active_hours_enabled'])) {
        $ranges = json_decode($settings['active_hours_ranges'], true);
        if ($ranges) {
            echo '<div class="chat-hours-info">';
            echo '<h4>Horarios de Chat:</h4>';
            foreach ($ranges as $range) {
                echo '<p>' . $range['start'] . ' - ' . $range['end'] . '</p>';
            }
            echo '</div>';
        }
    }
});
```

## 📊 Casos de Uso por Sector

### E-commerce
```
Horarios: 08:00 - 22:00
Mensaje: "🛍️ Atención al cliente disponible para consultas sobre productos, pedidos y devoluciones de 8:00 AM a 10:00 PM"
```

### Servicios Profesionales
```
Horarios: 09:00 - 18:00 (L-V)
Mensaje: "💼 Consultas profesionales: Lunes a Viernes, 9:00 AM - 6:00 PM. Para urgencias, contáctanos por email."
```

### Educación
```
Horarios: 08:00 - 16:00
Mensaje: "📚 Soporte académico: 8:00 AM - 4:00 PM durante días lectivos. ¡Estamos aquí para ayudarte!"
```

### Salud
```
Horarios: 08:00 - 13:00 y 15:00 - 19:00
Mensaje: "🏥 Citas y consultas: 8:00 AM - 1:00 PM y 3:00 PM - 7:00 PM. Para emergencias, llama al XXX-XXXX"
```

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verifica la [documentación técnica](ACTIVE_HOURS.md)
2. Revisa la [demo interactiva](../examples/active-hours-demo.html)
3. Contacta al soporte de Guiders