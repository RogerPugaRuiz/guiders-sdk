/**
 * Script para generar 100 mensajes aleatorios de prueba
 * Utiliza la API del backend para crear mensajes realistas
 * Para probar el infinite scroll del chat
 */

// Configuración
const BACKEND_URL = 'http://localhost:3000/api';
const CHAT_ID = 'e5b0ae5a-6c5d-47e6-a664-cf275b65976d'; // Chat actual identificado
const VISITOR_ID = 'a8173e2f-f383-4144-8e9d-d503562ab56d'; // Visitor actual
const TOTAL_MESSAGES = 100;
const DELAY_BETWEEN_MESSAGES = 200; // ms para evitar rate limiting

// Mensajes de ejemplo variados
const MESSAGE_TEMPLATES = [
    // Preguntas frecuentes
    "¿Cuáles son los horarios de atención?",
    "¿Tienen disponibilidad para hoy?",
    "¿Cuál es el precio del producto?",
    "¿Hacen envíos a domicilio?",
    "¿Aceptan tarjetas de crédito?",
    "¿Tienen garantía los productos?",
    "¿Puedo devolver un producto?",
    "¿Cuánto tiempo tarda el envío?",
    "¿Tienen descuentos especiales?",
    "¿Puedo reservar el producto?",
    
    // Respuestas y información
    "Perfecto, muchas gracias por la información",
    "Entendido, procederé con la compra",
    "Excelente servicio, muy recomendado",
    "¿Podrían enviarme más detalles?",
    "Estoy interesado en conocer más opciones",
    "¿Tienen otros colores disponibles?",
    "Me parece una buena opción",
    "¿Cuándo podrían confirmar la disponibilidad?",
    "Perfecto, estaré esperando su respuesta",
    "Muchas gracias por su tiempo",
    
    // Mensajes con emojis
    "¡Excelente! 😊 Me encanta la propuesta",
    "Gracias por la atención 👍",
    "¿Tienen promociones? 🎉",
    "Perfecto, todo claro ✅",
    "¡Increíble servicio! ⭐⭐⭐⭐⭐",
    "Esperando novedades 📱",
    "¡Muchas gracias! 🙏",
    "Genial, procedemos entonces 🚀",
    "¿Hay stock disponible? 📦",
    "Todo perfecto 💯",
    
    // Mensajes más largos
    "Hola, estoy interesado en obtener más información sobre sus productos. Me gustaría conocer las especificaciones técnicas y los precios disponibles.",
    "Buenos días, quería consultar sobre la posibilidad de hacer una compra al por mayor. ¿Manejan descuentos especiales para pedidos grandes?",
    "Perfecto, entiendo que el producto tiene esas características. ¿Podrían confirmarme si está disponible en el color azul y cuándo sería la fecha de entrega?",
    "Muchas gracias por toda la información proporcionada. Voy a revisar con mi equipo y les confirmo si procedemos con la compra en los próximos días.",
    "Excelente atención al cliente. He quedado muy satisfecho con el servicio recibido y definitivamente los recomendaré a mis contactos.",
    
    // Mensajes cortos
    "Ok",
    "Perfecto",
    "Gracias",
    "Entendido",
    "Sí",
    "No",
    "Claro",
    "Genial",
    "Bien",
    "Dale",
    
    // Mensajes técnicos
    "¿Cuáles son las especificaciones técnicas?",
    "¿Es compatible con iOS y Android?",
    "¿Qué tipo de garantía incluye?",
    "¿Cuál es la capacidad de almacenamiento?",
    "¿Tiene certificaciones internacionales?",
    "¿Cuál es el consumo energético?",
    "¿Es resistente al agua?",
    "¿Qué accesorios incluye?",
    "¿Cuál es la resolución de pantalla?",
    "¿Tiene conectividad WiFi?"
];

// Función para obtener mensaje aleatorio
function getRandomMessage() {
    const template = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
    
    // Agregar variación ocasional con números o fechas
    if (Math.random() < 0.2) {
        const variation = Math.floor(Math.random() * 1000);
        return `${template} (#${variation})`;
    }
    
    return template;
}

// Función para generar timestamp aleatorio en las últimas 24 horas
function getRandomTimestamp() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const randomTime = oneDayAgo.getTime() + Math.random() * (now.getTime() - oneDayAgo.getTime());
    return new Date(randomTime).toISOString();
}

// Función para enviar un mensaje
async function sendMessage(content, timestamp) {
    try {
        const response = await fetch(`${BACKEND_URL}/v2/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: CHAT_ID,
                content: content,
                type: 'TEXT'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        throw error;
    }
}

// Función para delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función principal
async function generateTestMessages() {
    console.log('🚀 Iniciando generación de mensajes de prueba...');
    console.log(`📊 Configuración:
- Chat ID: ${CHAT_ID}
- Visitor ID: ${VISITOR_ID}
- Total mensajes: ${TOTAL_MESSAGES}
- Delay entre mensajes: ${DELAY_BETWEEN_MESSAGES}ms
- Backend URL: ${BACKEND_URL}
`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= TOTAL_MESSAGES; i++) {
        try {
            const message = getRandomMessage();
            const timestamp = getRandomTimestamp();
            
            console.log(`📝 [${i}/${TOTAL_MESSAGES}] Enviando: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
            
            const result = await sendMessage(message, timestamp);
            
            console.log(`✅ [${i}/${TOTAL_MESSAGES}] Mensaje enviado exitosamente (ID: ${result.id})`);
            successCount++;
            
            // Delay para evitar saturar el servidor
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
    }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
    generateTestMessages().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { generateTestMessages, sendMessage, getRandomMessage };