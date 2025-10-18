/**
 * Script de diagnóstico para Commercial Availability
 * Ejecutar en la consola del navegador para verificar el estado
 */

(function() {
    console.log('🔍 === DIAGNÓSTICO DE COMMERCIAL AVAILABILITY ===');

    // 1. Verificar que el SDK existe
    if (!window.guiders) {
        console.error('❌ window.guiders no existe. El SDK no se inicializó.');
        return;
    }
    console.log('✅ SDK encontrado:', window.guiders);

    // 2. Verificar configuración
    console.log('\n📋 Configuración:');
    console.log('  GUIDERS_CONFIG:', window.GUIDERS_CONFIG);

    if (window.GUIDERS_CONFIG?.commercialAvailability) {
        console.log('✅ commercialAvailability configurado:', window.GUIDERS_CONFIG.commercialAvailability);
    } else {
        console.error('❌ commercialAvailability NO está configurado en GUIDERS_CONFIG');
    }

    // 3. Verificar servicio
    console.log('\n🔧 Servicio:');
    if (window.guiders.commercialAvailabilityService) {
        console.log('✅ commercialAvailabilityService existe:', window.guiders.commercialAvailabilityService);

        // Verificar estado
        const state = window.guiders.commercialAvailabilityService.getLastKnownState();
        console.log('📊 Estado actual:', state);

        // Verificar polling
        const isPolling = window.guiders.commercialAvailabilityService.isPollingActive();
        console.log('🔄 Polling activo:', isPolling);

    } else {
        console.error('❌ commercialAvailabilityService NO existe');
        console.log('   Esto significa que el servicio no se inicializó.');
        console.log('   Posibles causas:');
        console.log('   1. commercialAvailability.enabled = false');
        console.log('   2. El bundle está en caché (versión antigua)');
        console.log('   3. Error durante la inicialización');
    }

    // 4. Verificar botón de chat
    console.log('\n💬 Botón de chat:');
    if (window.guiders.chatToggleButton) {
        console.log('✅ chatToggleButton existe');

        // Intentar verificar visibilidad
        try {
            const isVisible = window.guiders.chatToggleButton.isButtonVisible?.();
            console.log('👁️ Botón visible:', isVisible);
        } catch (e) {
            console.log('⚠️ No se pudo verificar visibilidad:', e.message);
        }
    } else {
        console.error('❌ chatToggleButton NO existe');
    }

    // 5. Verificar versión del bundle
    console.log('\n📦 Versión:');
    console.log('  Bundle timestamp:', document.querySelector('script[src*="guiders-sdk.js"]')?.src);

    // 6. Test manual del endpoint
    console.log('\n🧪 Test manual del endpoint:');
    console.log('Ejecuta esto para probar el endpoint manualmente:');
    console.log(`
fetch('http://localhost:3000/api/v2/commercials/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        domain: '${window.location.hostname}',
        apiKey: '${window.GUIDERS_CONFIG?.apiKey}'
    })
})
.then(r => r.json())
.then(d => console.log('✅ Respuesta:', d))
.catch(e => console.error('❌ Error:', e));
    `);

    // 7. Forzar consulta si el servicio existe
    if (window.guiders.commercialAvailabilityService) {
        console.log('\n🚀 Forzando consulta de disponibilidad...');
        window.guiders.commercialAvailabilityService.checkAvailability()
            .then(response => {
                console.log('✅ Consulta exitosa:', response);
            })
            .catch(error => {
                console.error('❌ Error en consulta:', error);
            });
    }

    console.log('\n🔍 === FIN DEL DIAGNÓSTICO ===');
})();
