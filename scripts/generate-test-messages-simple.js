/**
 * Script simplificado para generar mensajes usando Playwright
 * Versión robusta que busca elementos de manera más específica
 */

const { chromium } = require('playwright');

// Configuración simplificada para testing
const CHAT_URL = 'http://127.0.0.1:8083/';
const TOTAL_MESSAGES = 50; // Reducido para testing más rápido
const DELAY_BETWEEN_MESSAGES = 2000; // 2 segundos para ser más seguro

// Mensajes simples para testing
const SIMPLE_MESSAGES = [
    "Hola",
    "¿Cómo están?",
    "Perfecto",
    "Gracias",
    "Excelente servicio",
    "¿Precio?",
    "¿Disponibilidad?",
    "Entendido",
    "Genial",
    "Ok"
];

function getRandomMessage() {
    const message = SIMPLE_MESSAGES[Math.floor(Math.random() * SIMPLE_MESSAGES.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${message} ${number}`;
}

async function generateTestMessages() {
    console.log('🚀 Iniciando generación simplificada con Playwright...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 // Ralentizar para debugging
    });
    
    const page = await browser.newPage();

    try {
        console.log('🌐 Navegando al chat...');
        await page.goto(CHAT_URL);
        
        // Esperar más tiempo para que se cargue completamente
        console.log('⏳ Esperando carga del SDK...');
        await page.waitForTimeout(5000);
        
        // Buscar el botón del chat de manera más específica
        console.log('🔍 Buscando botón del chat...');
        await page.waitForSelector('button', { timeout: 10000 });
        
        const chatButton = page.locator('button').first();
        console.log('💬 Haciendo clic en el chat...');
        await chatButton.click();
        
        // Esperar a que se abra el chat
        console.log('⏳ Esperando que se abra el chat...');
        await page.waitForTimeout(3000);
        
        // Tomar screenshot para debugging
        await page.screenshot({ path: 'debug-chat-opened.png' });
        console.log('📸 Screenshot guardado como debug-chat-opened.png');
        
        // Buscar elementos del chat de manera más específica
        console.log('🔍 Buscando elementos del chat...');
        
        // Esperar a que aparezca el textbox
        const messageInput = await page.waitForSelector('textbox, input[type="text"], textarea', { timeout: 10000 });
        console.log('✅ Input de mensaje encontrado');
        
        // Buscar botón de enviar con múltiples selectores
        let sendButton = null;
        const sendSelectors = [
            'button:has-text("Enviar")',
            'button:has-text("Send")',
            'button[type="submit"]',
            'button:last-child',
            'button:has(svg)', // botones con iconos
        ];
        
        for (const selector of sendSelectors) {
            try {
                sendButton = await page.locator(selector).first();
                if (await sendButton.count() > 0) {
                    console.log(`✅ Botón de enviar encontrado con selector: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!sendButton || await sendButton.count() === 0) {
            throw new Error('No se encontró el botón de enviar con ningún selector');
        }
        
        console.log('🎯 Elementos del chat encontrados, iniciando envío...\n');
        
        let successCount = 0;
        
        for (let i = 1; i <= TOTAL_MESSAGES; i++) {
            try {
                const message = getRandomMessage();
                
                console.log(`📝 [${i}/${TOTAL_MESSAGES}] Enviando: "${message}"`);
                
                // Limpiar y escribir mensaje
                await messageInput.fill('');
                await messageInput.fill(message);
                await page.waitForTimeout(500);
                
                // Hacer clic en enviar
                await sendButton.click();
                await page.waitForTimeout(500);
                
                console.log(`✅ [${i}/${TOTAL_MESSAGES}] Mensaje enviado`);
                successCount++;
                
                // Delay entre mensajes
                if (i < TOTAL_MESSAGES) {
                    await page.waitForTimeout(DELAY_BETWEEN_MESSAGES);
                }
                
            } catch (error) {
                console.error(`❌ [${i}/${TOTAL_MESSAGES}] Error:`, error.message);
                await page.waitForTimeout(1000);
            }
        }

        console.log('\n📊 RESUMEN:');
        console.log(`✅ Mensajes enviados: ${successCount}/${TOTAL_MESSAGES}`);
        console.log(`📈 Tasa de éxito: ${((successCount / TOTAL_MESSAGES) * 100).toFixed(1)}%`);
        
        if (successCount > 10) {
            console.log('\n🎉 ¡Suficientes mensajes generados!');
            console.log('📜 Ahora puedes probar el infinite scroll');
            console.log('⏸️  Manteniendo navegador abierto...');
            
            // Mantener abierto para testing
            await new Promise(() => {});
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
        
        // Tomar screenshot del error
        try {
            await page.screenshot({ path: 'debug-error.png' });
            console.log('📸 Screenshot de error guardado como debug-error.png');
        } catch (e) {}
        
    } finally {
        // El browser se mantiene abierto para debugging
    }
}

// Ejecutar
if (require.main === module) {
    generateTestMessages().catch(console.error);
}

module.exports = { generateTestMessages };