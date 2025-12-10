#!/bin/bash
set -euo pipefail

# Automatiza: build SDK + zip plugin + commit + tag + push + upload asset
# Uso: ./wordpress-plugin/release-wp-publish.sh [mensaje opcional]
# Requiere: git limpio (excepto cambios del plugin), version ya actualizada en cabecera plugin.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_MAIN="wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php"
if [ ! -f "$PLUGIN_MAIN" ]; then
  echo "❌ No se encuentra $PLUGIN_MAIN"; exit 1; fi

PLUGIN_VERSION=$(grep -i -m1 "^ \* Version:" "$PLUGIN_MAIN" | sed -E 's/^ \* Version:[[:space:]]*//I')
if [[ -z "$PLUGIN_VERSION" ]]; then echo "❌ No se pudo extraer versión"; exit 1; fi

echo "📦 Release WordPress plugin v$PLUGIN_VERSION"

echo "🔍 Verificando estado git..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ℹ️  Hay cambios sin commitear (esto es normal si acabas de editar versión)."; fi

# Construir y generar zip
npm run release:wp > /dev/null
ZIP_PATH="wordpress-plugin/guiders-wp-plugin-$PLUGIN_VERSION.zip"
if [ ! -f "$ZIP_PATH" ]; then echo "❌ ZIP no generado: $ZIP_PATH"; exit 1; fi

echo "✅ ZIP generado: $ZIP_PATH"

# 🔒 VALIDACIÓN: Verificar que el ZIP solo contiene guiders-sdk.min.js
echo "🔍 Validando contenido del ZIP..."
if unzip -l "$ZIP_PATH" | grep -q "guiders-sdk\.js$"; then
  echo "❌ ERROR: El ZIP contiene 'guiders-sdk.js' (archivo antiguo)"
  echo "   Solo debe contener 'guiders-sdk.min.js'"
  echo "   Revisa que build-plugin.sh esté actualizado."
  exit 1
fi
if ! unzip -l "$ZIP_PATH" | grep -q "guiders-sdk\.min\.js"; then
  echo "❌ ERROR: El ZIP no contiene 'guiders-sdk.min.js'"
  exit 1
fi
echo "✅ ZIP validado: solo contiene guiders-sdk.min.js"

COMMIT_MSG=${1:-"chore(wordpress-plugin): release $PLUGIN_VERSION"}

echo "📝 Creando commit..."
# Añadir archivos clave
git add "$PLUGIN_MAIN" \
        wordpress-plugin/guiders-wp-plugin/readme.txt \
        wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.min.js \
        "$ZIP_PATH"

git commit -m "$COMMIT_MSG" || echo "ℹ️  Nada que commitear (quizá ya estaba todo)."

echo "🏷  Creando tag v$PLUGIN_VERSION (si no existe)..."
if git rev-parse "v$PLUGIN_VERSION" >/dev/null 2>&1; then
  echo "ℹ️  Tag v$PLUGIN_VERSION ya existe, omitiendo creación";
else
  git tag "v$PLUGIN_VERSION";
fi

echo "🚀 Push main + tag..."
(git push origin main && git push origin "v$PLUGIN_VERSION") || { echo "❌ Error al hacer push"; exit 1; }

# 🚀 NUEVO: Esperar a que GitHub Actions cree el release y subir el ZIP
echo "⏳ Esperando a que GitHub Actions cree el release..."
sleep 10  # Dar tiempo a GitHub Actions para crear el release

echo "📤 Subiendo ZIP al GitHub Release..."
if command -v gh &> /dev/null; then
  # Reintentar hasta 3 veces (GitHub Actions puede tardar)
  for i in 1 2 3; do
    if gh release upload "v$PLUGIN_VERSION" "$ZIP_PATH" --clobber 2>/dev/null; then
      echo "✅ ZIP subido al release v$PLUGIN_VERSION"
      break
    else
      if [ $i -lt 3 ]; then
        echo "⏳ Release no disponible aún, reintentando en 10s... ($i/3)"
        sleep 10
      else
        echo "⚠️  No se pudo subir el ZIP automáticamente."
        echo "   Ejecuta manualmente: gh release upload v$PLUGIN_VERSION $ZIP_PATH --clobber"
      fi
    fi
  done
else
  echo "⚠️  GitHub CLI (gh) no instalado. Sube el ZIP manualmente al release."
fi

echo "🎉 Release completado: v$PLUGIN_VERSION"
