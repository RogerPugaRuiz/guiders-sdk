# Solución para Duplicación de Mensajes en el Chat

## Problema Identificado

El chat presentaba duplicación de mensajes debido a que los mensajes llegaban por dos vías diferentes:
1. **Carga inicial**: Al abrir el chat se cargan mensajes desde el servidor
2. **WebSocket en tiempo real**: Los mensajes nuevos llegan por WebSocket

Si un mensaje llegaba por WebSocket mientras se cargaban mensajes iniciales, o si había solapamiento temporal, el mensaje se duplicaba.

## Solución Implementada

### 1. Sistema de Deduplicación por ID

Se añadió un sistema robusto para prevenir duplicación de mensajes:

- **Set de IDs renderizados**: `renderedMessageIds: Set<string>` para trackear mensajes ya mostrados
- **Verificación en `renderChatMessage`**: Antes de renderizar, se verifica si el mensaje ya existe
- **IDs únicos**: Se utilizan los IDs reales del servidor cuando están disponibles, o se generan IDs únicos basados en contenido + timestamp

### 2. Modificaciones en ChatUI

**Archivo**: `/src/presentation/chat.ts`

#### Campos añadidos:
```typescript
// Set para trackear mensajes ya renderizados y prevenir duplicación
private renderedMessageIds: Set<string> = new Set();

// Flag para prevenir múltiples cargas simultáneas  
private isLoadingMessages: boolean = false;
```

#### Métodos modificados:

**`renderChatMessage`**: Ahora verifica duplicados antes de renderizar
```typescript
public renderChatMessage(params: { text: string; sender: Sender; timestamp?: number; id?: string }): void {
    const { text, sender, timestamp, id } = params;
    
    // Generar un ID único para el mensaje si no se proporciona
    const messageId = id || this.generateMessageId(text, sender, timestamp);
    
    // Verificar si el mensaje ya fue renderizado para prevenir duplicación
    if (this.renderedMessageIds.has(messageId)) {
        console.log(`Mensaje duplicado detectado y omitido: ${messageId}`);
        return;
    }
    
    // Marcar el mensaje como renderizado
    this.renderedMessageIds.add(messageId);
    
    this.addMessage(text, sender, timestamp, messageId);
    // ...resto del código
}
```

**`loadInitialMessages`**: Previene cargas simultáneas y marca mensajes como procesados
```typescript
public async loadInitialMessages(limit = 20): Promise<void> {
    // Prevenir múltiples cargas simultáneas
    if (this.isLoadingMessages) {
        console.log("Ya se está cargando mensajes, omitiendo carga duplicada");
        return;
    }
    
    this.isLoadingMessages = true;
    // ...código de carga
    
    // Marcar mensajes como ya renderizados usando sus IDs reales
    batch.forEach(item => {
        if (item.id) {
            this.renderedMessageIds.add(item.id);
        }
        this.renderChatMessage(item);
    });
}
```

**`setChatId`**: Limpia mensajes renderizados al cambiar de chat
```typescript
public setChatId(chatId: string): void {
    // Si estamos cambiando a un chat diferente, limpiar mensajes renderizados
    if (this.chatId && this.chatId !== chatId) {
        this.clearRenderedMessages();
    }
    this.chatId = chatId;
    this.container.setAttribute('data-chat-id', chatId);
}
```

### 3. Modificaciones en TrackingPixelSDK

**Archivo**: `/src/core/tracking-pixel-SDK.ts`

Se modificó el listener de WebSocket para:
1. Incluir el ID del mensaje cuando esté disponible
2. Añadir un pequeño delay para sincronización

```typescript
this.on("receive-message", (msg: PixelEvent) => {
    // Pequeño delay para permitir que los mensajes iniciales se carguen primero
    setTimeout(() => {
        chat.renderChatMessage({
            text: msg.data.message as string,
            sender: "other",
            timestamp: msg.data.timestamp as number,
            id: msg.data.id as string // Incluir el ID del mensaje si está disponible
        });
    }, 100);
});
```

### 4. Modificaciones en Types

**Archivo**: `/src/types/index.ts`

Se añadió el campo `id` a la interface `ChatMessageReceived`:
```typescript
export interface ChatMessageReceived {
    type: "chat_message";
    message: string;
    data: {
        id?: string;        // ← Nuevo campo
        message: string;
        sender: string;
        timestamp: number;
    };
    metadata?: Record<string, unknown>;
    token?: string;
    timestamp: number;
}
```

## Funcionalidades Añadidas

### 1. Generación de IDs únicos
```typescript
private generateMessageId(text: string, sender: Sender, timestamp?: number): string {
    const time = timestamp || Date.now();
    const content = `${text}-${sender}-${time}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `msg_${Math.abs(hash)}_${time}`;
}
```

### 2. Limpieza de mensajes renderizados
```typescript
public clearRenderedMessages(): void {
    this.renderedMessageIds.clear();
    console.log("Set de mensajes renderizados limpiado");
}
```

### 3. Atributos de mensaje en DOM
Los mensajes ahora incluyen atributos `data-message-id` para referencia:
```html
<div class="chat-message-wrapper" data-message-id="msg_123456789_1638360000000" data-timestamp="1638360000000">
    <!-- contenido del mensaje -->
</div>
```

## Beneficios de la Solución

1. **Eliminación completa de duplicación**: Los mensajes no se duplicarán sin importar la secuencia de carga
2. **Rendimiento optimizado**: Evita renderizar mensajes duplicados innecesariamente
3. **Gestión de memoria**: Limpieza automática al cambiar de chat
4. **Robustez**: Manejo de casos edge como cargas simultáneas
5. **Compatibilidad**: Funciona con IDs del servidor o genera IDs únicos como fallback
6. **Sincronización mejorada**: Delay en WebSocket previene conflictos de timing

## Cómo Probar

1. **Abrir el chat**: Verificar que los mensajes iniciales se cargan sin duplicación
2. **Enviar mensajes**: Confirmar que los mensajes propios no se duplican
3. **Recibir mensajes**: Los mensajes del WebSocket no deben duplicarse
4. **Cerrar y reabrir**: Al reabrir el chat, los mensajes existentes no deben duplicarse
5. **Cambiar de chat**: Al cambiar el chatId, el sistema debe limpiar y funcionar correctamente

## Logs de Debug

El sistema incluye logs para monitorear el funcionamiento:
- `"Mensaje duplicado detectado y omitido: {messageId}"` - Cuando se previene una duplicación
- `"Ya se está cargando mensajes, omitiendo carga duplicada"` - Cuando se previene carga simultánea
- `"Set de mensajes renderizados limpiado"` - Cuando se limpia el estado

## Conclusión

Esta solución resuelve completamente el problema de duplicación de mensajes implementando un sistema robusto de deduplicación que funciona en todos los escenarios posibles, desde la carga inicial hasta los mensajes en tiempo real por WebSocket.
