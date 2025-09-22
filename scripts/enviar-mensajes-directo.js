/**
 * Script para generar mensajes usando el chat abierto
 */

const MENSAJES_TEST = [
    "Hola, ¿podrían ayudarme?",
    "Necesito información sobre sus productos",
    "¿Cuáles son los precios actuales?",
    "Me interesa conocer más detalles",
    "¿Tienen disponibilidad inmediata?",
    "¿Qué formas de pago aceptan?",
    "¿Hacen envíos a domicilio?",
    "¿Cuál es el tiempo de entrega?",
    "¿Ofrecen garantía en sus productos?",
    "¿Tienen servicio técnico?",
    "¿Puedo agendar una cita?",
    "¿Trabajan los fines de semana?",
    "¿Dónde están ubicados?",
    "¿Tienen página web?",
    "¿Manejan descuentos por volumen?",
    "¿Qué tan rápido responden?",
    "¿Puedo hablar con un supervisor?",
    "¿Ofrecen capacitación?",
    "¿Tienen manual de usuario?",
    "¿Es compatible con otros sistemas?",
    "¿Qué sistema operativo requiere?",
    "¿Necesita instalación especial?",
    "¿Hay costo de mantenimiento?",
    "¿Incluye soporte técnico?",
    "¿Se puede personalizar?",
    "¿Hay versión móvil?",
    "¿Es seguro el sistema?",
    "¿Hacen respaldos automáticos?",
    "¿Qué pasa si hay fallas?",
    "¿Tienen referencias de clientes?",
    "¿Puedo ver una demostración?",
    "¿Cuándo pueden empezar?",
    "¿Firman contrato de confidencialidad?",
    "¿Qué documentación entregan?",
    "¿Hay penalidades por cancelación?",
    "¿Manejan facturación electrónica?",
    "¿Aceptan transferencias bancarias?",
    "¿Tienen promociones actuales?",
    "¿Qué incluye el servicio básico?",
    "¿Hay planes premium?",
    "¿Se puede cambiar de plan?",
    "¿Cobran por configuración inicial?",
    "¿Hay límite de usuarios?",
    "¿Se puede integrar con CRM?",
    "¿Soporta múltiples idiomas?",
    "¿Generan reportes automáticos?",
    "¿Los datos se pueden exportar?",
    "¿Hay aplicación para tablet?",
    "¿Funciona sin internet?",
    "¿Qué tan rápido es el sistema?",
    "¿Se puede usar desde cualquier lugar?",
    "¿Tienen certificaciones de seguridad?",
    "¿Cumplen con normativas locales?",
    "¿Hay actualizaciones automáticas?",
    "¿Qué tan frecuentes son las mejoras?",
    "¿Notifican cambios importantes?",
    "¿Hay grupo de usuarios?",
    "¿Organizan webinars de capacitación?",
    "¿Tienen blog con tips?",
    "¿Hay comunidad en redes sociales?",
    "¿Responden consultas por email?",
    "¿Tienen chat en vivo siempre?",
    "¿Hay soporte telefónico?",
    "¿Atienden emergencias fuera de horario?",
    "¿Qué nivel de experiencia requiere?",
    "¿Es fácil de aprender?",
    "¿Cuánto tiempo toma la implementación?",
    "¿Acompañan en la puesta en marcha?",
    "¿Hay costo de migración de datos?",
    "¿Pueden importar información existente?",
    "¿Qué formatos de archivo soportan?",
    "¿Se conecta con sistemas legacy?",
    "¿Hay API disponible?",
    "¿Documentan las integraciones?",
    "¿Proporcionan código de ejemplo?",
    "¿Hay sandbox para pruebas?",
    "¿Se puede hacer testing antes de comprar?",
    "¿Ofrecen período de prueba gratuito?",
    "¿Hay demos online disponibles?",
    "¿Puedo hablar con otros clientes?",
    "¿Tienen casos de éxito documentados?",
    "¿Qué ROI promedio obtienen los clientes?",
    "¿En cuánto tiempo se ve retorno?",
    "¿Miden la satisfacción del cliente?",
    "¿Qué tan alta es su retención?",
    "¿Cuál es el tiempo promedio de respuesta?",
    "¿Hay escalamiento automático?",
    "¿Se adapta a crecimiento del negocio?",
    "¿Soporta múltiples ubicaciones?",
    "¿Hay versión enterprise?",
    "¿Manejan contratos corporativos?",
    "¿Ofrecen descuentos por años de contrato?",
    "¿Hay cláusulas de renovación automática?",
    "¿Se puede cancelar en cualquier momento?",
    "¿Qué proceso siguen para terminación?",
    "¿Entregan los datos al finalizar?",
    "¿En qué formato exportan la información?",
    "¿Hay costo por exportación de datos?",
    "¿Eliminan información de sus servidores?",
    "¿Firman acuerdo de no divulgación?",
    "¿Dónde almacenan los datos?",
    "¿Usan servicios cloud reconocidos?",
    "¿Hay redundancia geográfica?",
    "¿Qué protocolos de seguridad usan?",
    "¿Encriptan la información?",
    "¿Hay auditorías de seguridad?",
    "¿Están certificados en ISO?",
    "¿Cumplen con GDPR?",
    "¿Respetan normativas de datos personales?"
];

async function enviarMensajesUnoAUno() {
    console.log('🚀 Iniciando envío de mensajes uno a uno...');
    
    let enviados = 0;
    const total = Math.min(50, MENSAJES_TEST.length); // Máximo 50 mensajes
    
    for (let i = 0; i < total; i++) {
        try {
            const mensaje = MENSAJES_TEST[i];
            console.log(`📝 [${i + 1}/${total}] Enviando: "${mensaje}"`);
            
            // Buscar input y botón en cada iteración (por si se actualizan)
            const input = document.querySelector('textbox, input[placeholder*="mensaje"], textarea[placeholder*="mensaje"]');
            const boton = document.querySelector('button[title*="Enviar"], button:has-text("Enviar")');
            
            if (!input || !boton) {
                console.error(`❌ [${i + 1}] No se encontraron elementos del chat`);
                break;
            }
            
            // Limpiar y escribir mensaje
            input.value = '';
            input.focus();
            
            // Simular escritura natural
            for (let char of mensaje) {
                input.value += char;
                await new Promise(resolve => setTimeout(resolve, 20)); // 20ms por carácter
            }
            
            // Disparar eventos de input
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Hacer clic en enviar
            boton.click();
            
            console.log(`✅ [${i + 1}/${total}] Mensaje enviado exitosamente`);
            enviados++;
            
            // Esperar antes del siguiente mensaje
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 segundos entre mensajes
            
        } catch (error) {
            console.error(`❌ [${i + 1}] Error enviando mensaje:`, error);
        }
    }
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Mensajes enviados: ${enviados}/${total}`);
    console.log(`📈 Tasa de éxito: ${((enviados / total) * 100).toFixed(1)}%`);
    
    if (enviados >= 20) {
        console.log('🎉 ¡Excelente! Se enviaron suficientes mensajes para probar infinite scroll');
        console.log('📜 Ahora intenta hacer scroll hacia arriba para activar la carga de mensajes anteriores');
    }
}

// Ejecutar automáticamente
if (typeof window !== 'undefined') {
    // Estamos en el navegador
    enviarMensajesUnoAUno().catch(console.error);
} else {
    // Exportar para uso en Node.js
    module.exports = { enviarMensajesUnoAUno, MENSAJES_TEST };
}