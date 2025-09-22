#!/usr/bin/env node

/**
 * Script de demostración: Dev Random Messages
 * 
 * Este script muestra cómo usar la funcionalidad de mensajes aleatorios
 * del SDK de Guiders en modo desarrollo.
 * 
 * Uso:
 *   node scripts/demo-dev-random-messages.js
 */

console.log('🎲 Dev Random Messages - Demo Script');
console.log('=====================================\n');

console.log('🔧 CONFIGURACIÓN DEL SCRIPT');
console.log('- ✅ Solo funciona en modo desarrollo');
console.log('- ✅ Requiere SDK con ?dev en la URL');
console.log('- ✅ Usa endpoint real: http://localhost:3000/api');
console.log('- ✅ 40+ mensajes predefinidos variados\n');

console.log('💬 MÉTODOS DE USO');
console.log('1. COMANDO EN CHAT:');
console.log('   - Abre el chat en una página con SDK dev');
console.log('   - Escribe: #random');
console.log('   - Presiona enviar');
console.log('   - ¡5 mensajes aleatorios se generarán automáticamente!\n');

console.log('2. INTERFAZ GLOBAL (Consola del navegador):');
console.log('   // Verificar disponibilidad');
console.log('   window.guidersDevRandomMessages\n');
console.log('   // Generar mensajes manualmente');
console.log('   await window.guidersDevRandomMessages.trigger(chatId, 3)\n');
console.log('   // Configurar parámetros');
console.log('   window.guidersDevRandomMessages.setConfig({');
console.log('     messageCount: 10,');
console.log('     minInterval: 500,');
console.log('     maxInterval: 1500');
console.log('   })\n');

console.log('📊 EJEMPLOS DE MENSAJES ALEATORIOS');
console.log('- "¿Tienen descuentos disponibles?"');
console.log('- "Testing scroll infinito 🧪"');
console.log('- "😀 ¡Excelente servicio!"');
console.log('- "Debug de mensajes largos: Lorem ipsum..."');
console.log('- "Caracteres especiales: ñÑáéíóúÁÉÍÓÚ"\n');

console.log('🚀 CÓMO PROBAR:');
console.log('1. Asegúrate de que el SDK esté en modo dev');
console.log('2. Abre el chat');
console.log('3. Escribe "#random" y envía');
console.log('4. ¡Observa la magia! 🎉\n');

console.log('📝 LOGS DE DEBUG:');
console.log('🎲 [DevRandomMessages] ✅ Inicializado en modo desarrollo');
console.log('🎲 [DevRandomMessages] 🎯 Comando #random detectado');
console.log('🎲 [DevRandomMessages] 🚀 Iniciando generación de 5 mensajes aleatorios');
console.log('🎲 [DevRandomMessages] 📤 Mensaje 1/5: "Testing scroll infinito 🧪"');
console.log('🎲 [DevRandomMessages] ✅ Generación de mensajes completada\n');

console.log('🔗 DOCUMENTACIÓN COMPLETA:');
console.log('   docs/DEV_RANDOM_MESSAGES.md\n');

console.log('✨ ¡Listo para hacer testing con mensajes aleatorios!');