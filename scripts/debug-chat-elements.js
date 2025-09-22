/**
 * Script de debugging para ver el estado del chat
 */

const { chromium } = require('playwright');

async function debugChat() {
    console.log('🔍 Debugging del chat...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const page = await browser.newPage();

    try {
        console.log('🌐 Navegando...');
        await page.goto('http://127.0.0.1:8083/');
        
        // Esperar carga
        await page.waitForTimeout(5000);
        
        // Screenshot inicial
        await page.screenshot({ path: 'debug-1-inicial.png', fullPage: true });
        console.log('📸 Screenshot inicial: debug-1-inicial.png');
        
        // Buscar y hacer clic en el botón del chat
        console.log('🔍 Buscando botón del chat...');
        const chatButton = await page.locator('button').first();
        await chatButton.click();
        
        // Esperar a que se abra
        await page.waitForTimeout(3000);
        
        // Screenshot con chat abierto
        await page.screenshot({ path: 'debug-2-chat-abierto.png', fullPage: true });
        console.log('📸 Screenshot con chat: debug-2-chat-abierto.png');
        
        // Listar todos los elementos interactivos
        console.log('\n🔍 Elementos encontrados:');
        
        const buttons = await page.locator('button').all();
        console.log(`📋 Botones: ${buttons.length}`);
        for (let i = 0; i < buttons.length; i++) {
            try {
                const text = await buttons[i].textContent();
                const visible = await buttons[i].isVisible();
                console.log(`  - Botón ${i}: "${text}" (visible: ${visible})`);
            } catch (e) {}
        }
        
        const inputs = await page.locator('input, textarea, [contenteditable]').all();
        console.log(`📝 Inputs: ${inputs.length}`);
        for (let i = 0; i < inputs.length; i++) {
            try {
                const type = await inputs[i].getAttribute('type');
                const placeholder = await inputs[i].getAttribute('placeholder');
                const visible = await inputs[i].isVisible();
                console.log(`  - Input ${i}: type="${type}" placeholder="${placeholder}" (visible: ${visible})`);
            } catch (e) {}
        }
        
        console.log('\n⏸️  Manteniendo abierto para inspección...');
        await new Promise(() => {}); // Mantener abierto
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    debugChat().catch(console.error);
}