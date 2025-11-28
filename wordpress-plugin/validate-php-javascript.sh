#!/bin/bash

# Script de validación para detectar JavaScript malformado en archivos PHP
# Uso: bash wordpress-plugin/validate-php-javascript.sh

set -e

echo "🔍 Validando JavaScript incrustado en archivos PHP del plugin..."
echo ""

ERRORS=0
WARNINGS=0

# Archivo a validar
FILE="wordpress-plugin/guiders-wp-plugin/includes/class-guiders-public.php"

if [ ! -f "$FILE" ]; then
    echo "❌ Error: Archivo no encontrado: $FILE"
    exit 1
fi

echo "📁 Validando: $FILE"
echo ""

# 1. Detectar bloques if vacíos
echo "1️⃣ Buscando bloques if (debug) vacíos..."
EMPTY_IFS=$(grep -n "if (cookieConfig\.debug) {" "$FILE" 2>/dev/null | while read line; do
    line_num=$(echo "$line" | cut -d: -f1)
    next_line=$((line_num + 1))
    next_content=$(sed -n "${next_line}p" "$FILE" | xargs)
    if [ "$next_content" = "}" ]; then
        echo "   ⚠️  Línea $line_num: Bloque if (cookieConfig.debug) vacío"
        echo 1
    fi
done | grep -c "1" 2>/dev/null || echo "0")
EMPTY_IFS=$(echo "$EMPTY_IFS" | tr -d '\n' | xargs)

if [ "$EMPTY_IFS" -gt 0 ] 2>/dev/null; then
    echo "   ❌ Encontrados $EMPTY_IFS bloques if vacíos"
    ERRORS=$((ERRORS + EMPTY_IFS))
else
    echo "   ✅ No se encontraron bloques if vacíos"
fi
echo ""

# 2. Detectar objetos huérfanos (propiedades sin var/return/assignment)
echo "2️⃣ Buscando objetos JavaScript huérfanos..."
ORPHAN_OBJECTS=$(grep -n "^\s*'[^']*':\s*\|^\s*\"[^\"]*\":\s*" "$FILE" | \
    grep -v "var\s\|return\s\|=\s\|function\s\|if\s\|//\s" | \
    grep -v "^\s*'functional':\s*'functional'\|^\s*'statistics':\s*'analytics'\|^\s*'marketing':\s*'personalization'" | \
    wc -l | xargs)

if [ "$ORPHAN_OBJECTS" -gt 0 ]; then
    echo "   ⚠️  Posibles objetos huérfanos detectados:"
    grep -n "^\s*'[^']*':\s*\|^\s*\"[^\"]*\":\s*" "$FILE" | \
        grep -v "var\s\|return\s\|=\s\|function\s\|if\s\|//\s" | \
        grep -v "^\s*'functional':\s*'functional'\|^\s*'statistics':\s*'analytics'\|^\s*'marketing':\s*'personalization'" | \
        while read line; do
            echo "      $line"
        done
    WARNINGS=$((WARNINGS + ORPHAN_OBJECTS))
else
    echo "   ✅ No se encontraron objetos huérfanos"
fi
echo ""

# 3. Detectar console.log/warn/error que no hayan sido eliminados
echo "3️⃣ Buscando console.log/warn/error..."
CONSOLE_LOGS=$(grep -n "console\.\(log\|warn\|error\)" "$FILE" | wc -l | xargs)

if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "   ❌ Encontrados $CONSOLE_LOGS console statements:"
    grep -n "console\.\(log\|warn\|error\)" "$FILE" | while read line; do
        echo "      $line"
    done
    ERRORS=$((ERRORS + CONSOLE_LOGS))
else
    echo "   ✅ No se encontraron console statements"
fi
echo ""

# 4. Validar sintaxis PHP
echo "4️⃣ Validando sintaxis PHP..."
if php -l "$FILE" > /dev/null 2>&1; then
    echo "   ✅ Sintaxis PHP correcta"
else
    echo "   ❌ Error de sintaxis PHP:"
    php -l "$FILE"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Buscar patrones problemáticos adicionales
echo "5️⃣ Buscando patrones problemáticos..."

# Detectar '});' huérfanos que podrían indicar objetos incompletos
ORPHAN_CLOSURES=$(grep -n "^\s*});" "$FILE" 2>/dev/null | while read line; do
    line_num=$(echo "$line" | cut -d: -f1)
    prev_line=$((line_num - 1))
    prev_content=$(sed -n "${prev_line}p" "$FILE" | xargs)
    # Si la línea anterior es una propiedad de objeto, puede ser un problema
    if echo "$prev_content" | grep -q "^\s*'.*':\s*\|^\s*\".*\":\s*"; then
        echo "   ⚠️  Línea $line_num: Posible cierre de objeto huérfano después de: $prev_content"
        echo 1
    fi
done | grep -c "1" 2>/dev/null || echo "0")
ORPHAN_CLOSURES=$(echo "$ORPHAN_CLOSURES" | tr -d '\n' | xargs)

if [ "$ORPHAN_CLOSURES" -gt 0 ] 2>/dev/null; then
    echo "   ⚠️  Encontrados $ORPHAN_CLOSURES posibles cierres huérfanos"
    WARNINGS=$((WARNINGS + ORPHAN_CLOSURES))
else
    echo "   ✅ No se encontraron cierres huérfanos"
fi
echo ""

# Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumen de validación:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Errores críticos: $ERRORS"
echo "   Advertencias: $WARNINGS"
echo ""

if [ "$ERRORS" -gt 0 ]; then
    echo "❌ VALIDACIÓN FALLIDA - Se encontraron $ERRORS errores críticos"
    echo "   Por favor, corrija los errores antes de continuar."
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "⚠️  VALIDACIÓN CON ADVERTENCIAS - Se encontraron $WARNINGS advertencias"
    echo "   Revise las advertencias antes de hacer un release."
    exit 0
else
    echo "✅ VALIDACIÓN EXITOSA - No se encontraron problemas"
    exit 0
fi
