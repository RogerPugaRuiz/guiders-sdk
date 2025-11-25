# WordPress de Desarrollo con Docker

Este entorno Docker proporciona un WordPress completamente funcional para probar el plugin Guiders SDK.

## 🚀 Inicio Rápido

### 1. Iniciar el entorno

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f wordpress
```

### 2. Acceder a WordPress

- **WordPress**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081
- **Usuario DB**: `wordpress` / `wordpress`
- **Usuario Root DB**: `root` / `rootpassword`

### 3. Configurar WordPress (Primera vez)

1. Abre http://localhost:8080
2. Sigue el asistente de instalación:
   - **Idioma**: Español
   - **Título del sitio**: Guiders Test
   - **Usuario**: admin
   - **Contraseña**: admin (o la que prefieras)
   - **Email**: tu@email.com

### 4. Activar el Plugin Guiders

El plugin ya está montado automáticamente en `/wp-content/plugins/guiders-wp-plugin/`

```bash
# Opción A: Desde el panel de WordPress
# Ve a Plugins → Plugins Instalados → Activar "Guiders SDK"

# Opción B: Desde línea de comandos
docker-compose exec wpcli wp plugin activate guiders-wp-plugin --allow-root
```

## 📦 Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **wordpress** | 8080 | Sitio WordPress principal |
| **db** | 3306 | MySQL 8.0 (no expuesto externamente) |
| **phpmyadmin** | 8081 | Interfaz web para gestionar MySQL |
| **wpcli** | - | WP-CLI para comandos de WordPress |

## 🛠️ Comandos Útiles

### Gestión del Entorno

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios (conserva datos)
docker-compose stop

# Detener y eliminar contenedores (conserva volúmenes)
docker-compose down

# Eliminar TODO (contenedores + volúmenes + red)
docker-compose down -v

# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f              # Todos los servicios
docker-compose logs -f wordpress    # Solo WordPress
docker-compose logs -f db           # Solo MySQL

# Reiniciar un servicio específico
docker-compose restart wordpress
```

### Comandos de WordPress (WP-CLI)

```bash
# Listar plugins
docker-compose exec wpcli wp plugin list --allow-root

# Activar plugin
docker-compose exec wpcli wp plugin activate guiders-wp-plugin --allow-root

# Desactivar plugin
docker-compose exec wpcli wp plugin deactivate guiders-wp-plugin --allow-root

# Actualizar WordPress
docker-compose exec wpcli wp core update --allow-root

# Listar usuarios
docker-compose exec wpcli wp user list --allow-root

# Crear usuario administrador
docker-compose exec wpcli wp user create testuser test@example.com --role=administrator --user_pass=test123 --allow-root

# Limpiar caché
docker-compose exec wpcli wp cache flush --allow-root

# Exportar base de datos
docker-compose exec wpcli wp db export /var/www/html/backup.sql --allow-root

# Importar base de datos
docker-compose exec wpcli wp db import /var/www/html/backup.sql --allow-root

# Buscar y reemplazar URLs (útil para migraciones)
docker-compose exec wpcli wp search-replace 'http://oldsite.com' 'http://localhost:8080' --allow-root
```

### Instalar Plugins de Cookies para Pruebas

```bash
# Moove GDPR (GDPR Cookie Compliance)
docker-compose exec wpcli wp plugin install gdpr-cookie-compliance --activate --allow-root

# Beautiful Cookie Banner
docker-compose exec wpcli wp plugin install beautiful-and-responsive-cookie-consent --activate --allow-root

# Complianz GDPR
docker-compose exec wpcli wp plugin install complianz-gdpr --activate --allow-root

# CookieYes
docker-compose exec wpcli wp plugin install cookie-law-info --activate --allow-root

# Cookie Notice
docker-compose exec wpcli wp plugin install cookie-notice --activate --allow-root

# WP Consent API
docker-compose exec wpcli wp plugin install wp-consent-api --activate --allow-root
```

### Acceso a la Base de Datos

```bash
# Acceder a MySQL desde línea de comandos
docker-compose exec db mysql -u wordpress -pwordpress wordpress

# Hacer backup de la base de datos
docker-compose exec db mysqldump -u wordpress -pwordpress wordpress > backup.sql

# Restaurar backup
cat backup.sql | docker-compose exec -T db mysql -u wordpress -pwordpress wordpress
```

### Desarrollo del Plugin

```bash
# El plugin está montado en tiempo real desde:
# ./wordpress-plugin/guiders-wp-plugin → /var/www/html/wp-content/plugins/guiders-wp-plugin

# Cualquier cambio en tu carpeta local se refleja inmediatamente en WordPress

# Si haces cambios, recarga el plugin:
docker-compose exec wpcli wp plugin deactivate guiders-wp-plugin --allow-root
docker-compose exec wpcli wp plugin activate guiders-wp-plugin --allow-root

# O simplemente recarga la página en el navegador
```

## 🔧 Configuración Avanzada

### Cambiar Puerto de WordPress

Edita `docker-compose.yml`:

```yaml
wordpress:
  ports:
    - "8888:80"  # Cambiar 8080 por el puerto deseado
```

Luego reinicia:
```bash
docker-compose down
docker-compose up -d
```

### Habilitar HTTPS (SSL)

Para HTTPS necesitarías un proxy reverso como Nginx o Traefik. Por simplicidad, este entorno usa HTTP.

### Aumentar Límites de PHP

Crea un archivo `php.ini` personalizado:

```bash
# Crear archivo de configuración PHP
cat > uploads.ini <<EOF
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
memory_limit = 256M
EOF

# Añadir al docker-compose.yml en la sección de wordpress:
# volumes:
#   - ./uploads.ini:/usr/local/etc/php/conf.d/uploads.ini
```

### Acceder al Contenedor

```bash
# Shell interactivo en WordPress
docker-compose exec wordpress bash

# Shell interactivo en MySQL
docker-compose exec db bash

# Shell interactivo en WP-CLI
docker-compose exec wpcli bash
```

## 🧪 Escenarios de Prueba

### 1. Probar Integración con Moove GDPR

```bash
# Instalar Moove GDPR
docker-compose exec wpcli wp plugin install gdpr-cookie-compliance --activate --allow-root

# Accede a: http://localhost:8080/wp-admin
# Ve a: GDPR Cookie Compliance → Settings
# Activa las categorías: Necessary, Performance, Targeting
# Guarda configuración

# Verifica logs en consola del navegador:
# Deberías ver: [Guiders WP] Moove GDPR detectado - configurando sincronización
```

### 2. Probar Integración con Beautiful Cookie Banner

```bash
# Instalar Beautiful Cookie Banner
docker-compose exec wpcli wp plugin install beautiful-and-responsive-cookie-consent --activate --allow-root

# Configura el banner desde: Settings → Beautiful Cookie Banner
# Activa las categorías necesarias

# Verifica logs en consola:
# Deberías ver: [Guiders WP] Beautiful Cookie Banner detectado
```

### 3. Probar con WP Consent API

```bash
# Instalar WP Consent API + un plugin compatible
docker-compose exec wpcli wp plugin install wp-consent-api --activate --allow-root
docker-compose exec wpcli wp plugin install complianz-gdpr --activate --allow-root

# Configura Complianz y verifica sincronización automática
```

## 🐛 Troubleshooting

### WordPress no carga

```bash
# Verificar estado de servicios
docker-compose ps

# Ver logs de WordPress
docker-compose logs -f wordpress

# Reiniciar servicios
docker-compose restart
```

### Error de conexión a la base de datos

```bash
# Verificar que MySQL está listo
docker-compose exec db mysqladmin ping -h localhost -u root -prootpassword

# Reiniciar MySQL
docker-compose restart db

# Esperar a que esté healthy
docker-compose ps
```

### El plugin no aparece en WordPress

```bash
# Verificar que el plugin está montado
docker-compose exec wordpress ls -la /var/www/html/wp-content/plugins/guiders-wp-plugin

# Si no existe, verificar la ruta en docker-compose.yml
# Debe ser: ./wordpress-plugin/guiders-wp-plugin

# Recargar WordPress
docker-compose restart wordpress
```

### Permisos de archivos

```bash
# Corregir permisos (ejecutar desde el proyecto)
docker-compose exec wordpress chown -R www-data:www-data /var/www/html
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto 8080
lsof -i :8080

# Cambiar el puerto en docker-compose.yml o matar el proceso
kill -9 <PID>
```

## 🗑️ Limpiar Entorno

```bash
# Eliminar contenedores y volúmenes (BORRA TODO)
docker-compose down -v

# Eliminar imágenes (si quieres empezar desde cero)
docker-compose down -v --rmi all

# Limpiar Docker completamente (CUIDADO: afecta otros proyectos)
docker system prune -a --volumes
```

## 📚 Estructura de Volúmenes

```
Volúmenes persistentes:
├── db_data/           # Base de datos MySQL (persiste entre reinicios)
└── wordpress_data/    # Archivos de WordPress (temas, plugins, uploads)

Montajes en tiempo real:
└── ./wordpress-plugin/guiders-wp-plugin → /var/www/html/wp-content/plugins/guiders-wp-plugin
```

## 🔐 Credenciales por Defecto

| Servicio | Usuario | Contraseña |
|----------|---------|------------|
| WordPress Admin | admin | (la que configures) |
| MySQL | wordpress | wordpress |
| MySQL Root | root | rootpassword |
| phpMyAdmin | wordpress | wordpress |

**⚠️ Importante**: Estas credenciales son solo para desarrollo local. No uses en producción.

## 🚦 Estado de Salud

```bash
# Ver estado de salud de servicios
docker-compose ps

# Ver logs de health checks
docker inspect guiders-wp-db | grep -A 10 Health
```

## 📝 Notas

1. **Persistencia**: Los datos de WordPress y MySQL se guardan en volúmenes Docker. Sobreviven a `docker-compose down` pero se eliminan con `docker-compose down -v`.

2. **Desarrollo del plugin**: Los cambios en `./wordpress-plugin/guiders-wp-plugin` se reflejan automáticamente en WordPress (no necesitas rebuild).

3. **Rendimiento**: En Mac/Windows, el montaje de volúmenes puede ser lento. Considera usar Docker con backend nativo.

4. **Múltiples entornos**: Puedes tener varios proyectos con docker-compose. Solo asegúrate de usar puertos diferentes.

## 🎯 Próximos Pasos

1. ✅ Iniciar el entorno: `docker-compose up -d`
2. ✅ Configurar WordPress: http://localhost:8080
3. ✅ Activar plugin Guiders
4. ✅ Configurar API Key en: Settings → Guiders SDK
5. ✅ Instalar un plugin de cookies para probar integración
6. ✅ Verificar sincronización en consola del navegador

---

**¿Necesitas ayuda?** Consulta la documentación del plugin en `wordpress-plugin/WORDPRESS_GDPR_GUIDE.md`
