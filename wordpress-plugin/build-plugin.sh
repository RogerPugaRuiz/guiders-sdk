#!/bin/bash

# Script para crear un ZIP distribuible del plugin de WordPress
# Este script debe ejecutarse desde el directorio raíz del proyecto guiders-sdk

echo "🚀 Creando plugin de WordPress para Guiders SDK..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio raíz de guiders-sdk"
    exit 1
fi

# Compilar el SDK si no existe
if [ ! -f "dist/index.js" ]; then
    echo "📦 Compilando SDK..."
    npm install
    npm run build
fi

# Verificar que la compilación fue exitosa
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: No se pudo compilar el SDK"
    exit 1
fi

# Copiar el SDK compilado al plugin
echo "📋 Copiando SDK al plugin..."
cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js

# Crear directorio de distribución
DIST_DIR="wordpress-plugin/dist"
mkdir -p "$DIST_DIR"

# Copiar archivos del plugin
echo "📁 Preparando archivos del plugin..."
cp -r wordpress-plugin/guiders-wp-plugin "$DIST_DIR/"

# Remover archivos innecesarios del plugin
rm -f "$DIST_DIR/guiders-wp-plugin/.gitignore"

# Crear archivo ZIP
PLUGIN_ZIP="$DIST_DIR/guiders-wp-plugin.zip"
echo "🗜️  Creando archivo ZIP..."

cd "$DIST_DIR"
zip -r "guiders-wp-plugin.zip" "guiders-wp-plugin/" -x "*.DS_Store*" "*.git*"
cd - > /dev/null

# Mostrar información del archivo creado
echo "✅ Plugin creado exitosamente:"
echo "   📁 Ubicación: $PLUGIN_ZIP"
echo "   📏 Tamaño: $(du -h "$PLUGIN_ZIP" | cut -f1)"
echo ""
echo "📋 Instrucciones de instalación:"
echo "   1. Ve a tu WordPress admin > Plugins > Añadir nuevo > Subir plugin"
echo "   2. Sube el archivo: $PLUGIN_ZIP"
echo "   3. Activa el plugin"
echo "   4. Ve a Configuración > Guiders SDK para configurar"
echo ""
echo "🔧 Para instalación manual:"
echo "   1. Extrae la carpeta 'guiders-wp-plugin' en /wp-content/plugins/"
echo "   2. Activa el plugin desde el admin de WordPress"
echo ""
echo "🎉 ¡Plugin listo para distribución!"