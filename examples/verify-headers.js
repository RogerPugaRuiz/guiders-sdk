// Test de verificación de headers de sesión
// Ejecutar en consola del navegador después de cargar el SDK

console.log('🔍 Verificando implementación de headers X-Guiders-Sid...\n');

// 1. Verificar que el sessionId existe en localStorage
const sessionId = sessionStorage.getItem('guiders_backend_session_id');
console.log('📦 Session ID en storage:', sessionId || 'No encontrado');

// 2. Interceptar fetch temporalmente para verificar headers
const originalFetch = window.fetch;
const requestLog = [];

window.fetch = function(...args) {
    const [url, options = {}] = args;
    const headers = options.headers || {};
    const hasSessionHeader = headers['X-Guiders-Sid'] !== undefined;
    const isIdentifyRequest = url.includes('/identify');
    
    requestLog.push({
        url: url.toString(),
        method: options.method || 'GET',
        hasSessionHeader,
        isIdentifyRequest,
        sessionHeaderValue: headers['X-Guiders-Sid'],
        correct: isIdentifyRequest ? !hasSessionHeader : hasSessionHeader
    });
    
    console.log(`🌐 ${options.method || 'GET'} ${url}`);
    console.log(`   Header X-Guiders-Sid: ${hasSessionHeader ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`   Es identify: ${isIdentifyRequest ? '✅ Sí' : '❌ No'}`);
    console.log(`   Correcto: ${isIdentifyRequest ? !hasSessionHeader : hasSessionHeader ? '✅' : '❌'}\n`);
    
    return originalFetch.apply(this, args);
};

// 3. Función para probar diferentes servicios
async function testHeadersImplementation() {
    console.log('🚀 Iniciando pruebas de headers...\n');
    
    try {
        // Test 1: Identify (NO debe tener header)
        console.log('1️⃣ Probando identify (NO debe tener X-Guiders-Sid)...');
        const identifyResult = await window.guiders.identifyVisitor();
        
        // Test 2: Chat methods (SÍ deben tener header)
        console.log('2️⃣ Probando métodos de chat (SÍ deben tener X-Guiders-Sid)...');
        const chatService = window.guiders.getChatV2Service?.();
        if (chatService) {
            try {
                await chatService.getVisitorChats('test-visitor-id', 5);
            } catch (e) {
                console.log('   Error esperado en getVisitorChats:', e.message);
            }
            
            try {
                await chatService.getCommercialMetrics();
            } catch (e) {
                console.log('   Error esperado en getCommercialMetrics:', e.message);
            }
        }
        
        // Mostrar resumen
        console.log('\n📊 RESUMEN DE PRUEBAS:');
        console.log('='.repeat(50));
        
        const identifyRequests = requestLog.filter(r => r.isIdentifyRequest);
        const otherRequests = requestLog.filter(r => !r.isIdentifyRequest);
        
        console.log(`Peticiones identify: ${identifyRequests.length}`);
        identifyRequests.forEach((req, i) => {
            console.log(`  ${i + 1}. ${req.url} - ${req.correct ? '✅' : '❌'} ${req.hasSessionHeader ? 'Tiene header (MAL)' : 'Sin header (BIEN)'}`);
        });
        
        console.log(`\nOtras peticiones: ${otherRequests.length}`);
        otherRequests.forEach((req, i) => {
            console.log(`  ${i + 1}. ${req.url} - ${req.correct ? '✅' : '❌'} ${req.hasSessionHeader ? 'Tiene header (BIEN)' : 'Sin header (MAL)'}`);
        });
        
        const allCorrect = requestLog.every(r => r.correct);
        console.log(`\n🎯 RESULTADO FINAL: ${allCorrect ? '✅ TODOS LOS HEADERS CORRECTOS' : '❌ HAY ERRORES EN HEADERS'}`);
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    } finally {
        // Restaurar fetch original
        window.fetch = originalFetch;
        console.log('\n🔄 Fetch original restaurado');
    }
}

// 4. Función para verificar el estado actual
function checkCurrentState() {
    console.log('\n📋 ESTADO ACTUAL:');
    console.log('='.repeat(30));
    
    const signal = window.guiders?.getIdentitySignal?.();
    if (signal) {
        const state = signal.getState();
        console.log('Signal Status:', state.status);
        console.log('Visitor ID:', state.data?.visitor?.visitorId || 'N/A');
        console.log('Chats loaded:', state.data?.chats?.length || 0);
    } else {
        console.log('❌ Signal no disponible');
    }
    
    const sessionId = sessionStorage.getItem('guiders_backend_session_id');
    console.log('Session ID:', sessionId || 'No encontrado');
}

// Exportar funciones para uso manual
window.testHeadersImplementation = testHeadersImplementation;
window.checkCurrentState = checkCurrentState;

console.log('✅ Script de verificación cargado.');
console.log('💡 Ejecuta testHeadersImplementation() para probar headers');
console.log('💡 Ejecuta checkCurrentState() para ver el estado actual');