/**
 * Script para enviar múltiples mensajes usando Playwright directamente
 */

const { chromium } = require('playwright');

const MENSAJES = [
    "Mensaje de prueba automatizada #2",
    "¿Cómo puedo obtener más información?",
    "Necesito ayuda con el producto",
    "¿Cuáles son los horarios de atención?",
    "¿Tienen soporte técnico disponible?",
    "Me interesa hacer una compra",
    "¿Qué métodos de pago aceptan?",
    "¿Hacen envíos a toda la región?",
    "¿Cuánto tiempo demora la entrega?",
    "¿Ofrecen garantía en sus productos?",
    "¿Tienen descuentos especiales?",
    "¿Puedo ver una demostración?",
    "¿Cómo es el proceso de compra?",
    "¿Necesito registrarme en su sitio?",
    "¿Hay costo de envío?",
    "¿Puedo devolver el producto si no me gusta?",
    "¿Qué formas de contacto tienen?",
    "¿Atienden consultas por WhatsApp?",
    "¿Tienen tienda física?",
    "¿Dónde están ubicados?",
    "¿Trabajan los fines de semana?",
    "¿Hay descuentos por volumen?",
    "¿Manejan facturación empresarial?",
    "¿Qué incluye la garantía?",
    "¿Tienen servicio de instalación?",
    "¿Ofrecen capacitación para el uso?",
    "¿Es compatible con otros sistemas?",
    "¿Qué requisitos técnicos necesito?",
    "¿Hay versión de prueba gratuita?",
    "¿Cuánto cuesta el mantenimiento?",
    "¿Qué tan seguro es el sistema?",
    "¿Hacen respaldos de información?",
    "¿Se puede acceder desde móvil?",
    "¿Hay límites de usuarios?",
    "¿Se integra con otros software?",
    "¿Proporcionan capacitación inicial?",
    "¿Cuál es el proceso de implementación?",
    "¿Hay soporte durante la instalación?",
    "¿Qué documentación incluye?",
    "¿Tienen casos de éxito de clientes?",
    "¿Puedo hablar con referencias?",
    "¿Ofrecen período de prueba?",
    "¿Hay costo de configuración inicial?",
    "¿Se puede personalizar la interfaz?",
    "¿Qué tan rápido es el sistema?",
    "¿Funciona sin conexión a internet?",
    "¿Generan reportes automáticos?",
    "¿Se pueden exportar los datos?",
    "¿Hay actualizaciones automáticas?",
    "¿Cuál es la política de respaldos?"
];

async function enviarMensajesConPlaywright() {
    console.log('🚀 Iniciando envío masivo con Playwright...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 100 // Ralentizar un poco para ver el proceso
    });
    
    const page = await browser.newPage();

    try {
        console.log('🌐 Navegando al chat...');
        await page.goto('http://127.0.0.1:8083/');
        
        // Esperar a que se cargue el SDK
        console.log('⏳ Esperando carga del SDK...');
        await page.waitForTimeout(5000);
        
        // Abrir el chat
        console.log('💬 Abriendo chat...');
        await page.getByRole('button').first().click();
        await page.waitForTimeout(2000);
        
        let enviados = 0;
        const total = Math.min(40, MENSAJES.length); // Enviar máximo 40 mensajes
        
        console.log(`📝 Enviando ${total} mensajes...\n`);
        
        for (let i = 0; i < total; i++) {
            try {
                const mensaje = MENSAJES[i];
                console.log(`📤 [${i + 1}/${total}] Enviando: "${mensaje}"`);
                
                // Escribir en el input del mensaje
                await page.getByRole('textbox', { name: 'Mensaje' }).fill(mensaje);
                
                // Hacer clic en enviar
                await page.getByRole('button', { name: 'Enviar mensaje' }).click();
                
                console.log(`✅ [${i + 1}/${total}] Enviado exitosamente`);
                enviados++;
                
                // Pausa entre mensajes
                await page.waitForTimeout(800); // 800ms entre mensajes
                
            } catch (error) {
                console.error(`❌ [${i + 1}/${total}] Error: ${error.message}`);
            }
        }
        
        console.log('\n📊 RESUMEN DE ENVÍO:');
        console.log(`✅ Mensajes enviados: ${enviados}/${total}`);
        console.log(`📈 Tasa de éxito: ${((enviados / total) * 100).toFixed(1)}%`);
        
        if (enviados >= 20) {
            console.log('\n🎉 ¡Excelente! Se generaron suficientes mensajes');
            console.log('📜 Ahora puedes probar el infinite scroll:');
            console.log('   1. Haz scroll hacia arriba en el chat');
            console.log('   2. Verifica que se cargan mensajes anteriores');
            console.log('   3. Observa los logs de paginación');
        }
        
        console.log('\n⏸️ Manteniendo navegador abierto para testing...');
        
        // Mantener abierto para inspección
        await new Promise(() => {});
        
    } catch (error) {
        console.error('💥 Error en el proceso:', error);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    enviarMensajesConPlaywright().catch(console.error);
}

module.exports = { enviarMensajesConPlaywright };