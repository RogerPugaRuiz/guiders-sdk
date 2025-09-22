/**
 * Script para generar 100 mensajes aleatorios usando Playwright
 * Utiliza la interfaz del chat para enviar mensajes como lo haría un usuario real
 * Para probar el infinite scroll del chat
 */

const { chromium } = require('playwright');

// Configuración
const CHAT_URL = 'http://127.0.0.1:8083/';
const TOTAL_MESSAGES = 100;
const DELAY_BETWEEN_MESSAGES = 1000; // ms para dar tiempo a que se envíen los mensajes

// Mensajes de ejemplo variados (versión más corta para testing rápido)
const MESSAGE_TEMPLATES = [
    // Preguntas frecuentes cortas
    "¿Cuáles son los horarios?",
    "¿Tienen disponibilidad?",
    "¿Cuál es el precio?",
    "¿Hacen envíos?",
    "¿Aceptan tarjetas?",
    "¿Tienen garantía?",
    "¿Puedo devolver?",
    "¿Cuánto tarda el envío?",
    "¿Hay descuentos?",
    "¿Puedo reservar?",
    
    // Respuestas cortas
    "Perfecto, gracias",
    "Entendido",
    "Excelente servicio",
    "¿Más detalles?",
    "Estoy interesado",
    "¿Otros colores?",
    "Buena opción",
    "¿Cuándo confirman?",
    "Esperando respuesta",
    "Gracias por el tiempo",
    
    // Mensajes con emojis
    "¡Excelente! 😊",
    "Gracias 👍",
    "¿Promociones? 🎉",
    "Todo claro ✅",
    "¡Increíble! ⭐⭐⭐⭐⭐",
    "Esperando 📱",
    "¡Gracias! 🙏",
    "Procedemos 🚀",
    "¿Stock? 📦",
    "Perfecto 💯",
    
    // Mensajes técnicos cortos
    "¿Especificaciones?",
    "¿Compatible iOS/Android?",
    "¿Tipo de garantía?",
    "¿Capacidad storage?",
    "¿Certificaciones?",
    "¿Consumo energético?",
    "¿Resistente agua?",
    "¿Qué accesorios?",
    "¿Resolución pantalla?",
    "¿WiFi?"
];

// Función para obtener mensaje aleatorio
function getRandomMessage() {
    const template = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
    
    // Agregar variación ocasional con números
    if (Math.random() < 0.3) {
        const variation = Math.floor(Math.random() * 1000);
        return `${template} (#${variation})`;
    }
    
    return template;
}

// Función para delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función principal
async function generateTestMessages() {
    console.log('🚀 Iniciando generación de mensajes con Playwright...');
    console.log(`📊 Configuración:
- URL del chat: ${CHAT_URL}
- Total mensajes: ${TOTAL_MESSAGES}
- Delay entre mensajes: ${DELAY_BETWEEN_MESSAGES}ms
`);

    const browser = await chromium.launch({ headless: false }); // Visible para debugging
    const page = await browser.newPage();

    try {
        // Navegar a la página del chat
        console.log('🌐 Navegando al chat...');
        await page.goto(CHAT_URL);
        
        // Esperar a que se cargue el SDK
        await page.waitForTimeout(3000);
        
        // Buscar y hacer clic en el botón del chat
        console.log('💬 Abriendo chat...');
        const chatButton = await page.locator('button').first();
        await chatButton.click();
        
        // Esperar a que se abra el chat
        await page.waitForTimeout(2000);
        
        // Buscar el input de mensajes y el botón de enviar
        const messageInput = await page.locator('textbox[placeholder*="mensaje"], textbox[placeholder*="Mensaje"], input[placeholder*="mensaje"], input[placeholder*="Mensaje"]');
        const sendButton = await page.locator('button:has-text("Enviar"), button:has-text("Send"), button[title*="enviar"], button[title*="Enviar"]');
        
        // Verificar que encontramos los elementos
        if (await messageInput.count() === 0) {
            throw new Error('No se encontró el input de mensajes');
        }
        
        if (await sendButton.count() === 0) {
            throw new Error('No se encontró el botón de enviar');
        }
        
        console.log('✅ Chat abierto correctamente, iniciando envío de mensajes...\n');
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i <= TOTAL_MESSAGES; i++) {
            try {
                const message = getRandomMessage();
                
                console.log(`📝 [${i}/${TOTAL_MESSAGES}] Enviando: "${message}"`);
                
                // Escribir el mensaje
                await messageInput.fill(message);
                await page.waitForTimeout(100);
                
                // Hacer clic en enviar
                await sendButton.click();
                
                console.log(`✅ [${i}/${TOTAL_MESSAGES}] Mensaje enviado exitosamente`);
                successCount++;
                
                // Delay para evitar saturar el sistema
                if (i < TOTAL_MESSAGES) {
                    await delay(DELAY_BETWEEN_MESSAGES);
                }
                
            } catch (error) {
                console.error(`❌ [${i}/${TOTAL_MESSAGES}] Error enviando mensaje:`, error.message);
                errorCount++;
                
                // Continuar con el siguiente mensaje
                await delay(DELAY_BETWEEN_MESSAGES);
            }
        }

        console.log('\n📊 RESUMEN FINAL:');
        console.log(`✅ Mensajes enviados exitosamente: ${successCount}`);
        console.log(`❌ Mensajes con error: ${errorCount}`);
        console.log(`📈 Tasa de éxito: ${((successCount / TOTAL_MESSAGES) * 100).toFixed(1)}%`);
        
        if (successCount > 0) {
            console.log('\n🎉 ¡Generación completada!');
            console.log('💡 Ahora puedes probar el infinite scroll en el chat');
            console.log('📜 Haz scroll hacia arriba para cargar mensajes antiguos');
            
            // Mantener el navegador abierto para testing
            console.log('\n⏸️  Manteniendo navegador abierto para testing...');
            console.log('🔍 Prueba el scroll hacia arriba en el chat para verificar infinite scroll');
            console.log('❌ Presiona Ctrl+C para cerrar cuando termines');
            
            // Mantener vivo el proceso
            await new Promise(() => {}); 
        }
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
    } finally {
        // El browser se cerrará automáticamente al terminar el proceso
    }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
    generateTestMessages().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { generateTestMessages };