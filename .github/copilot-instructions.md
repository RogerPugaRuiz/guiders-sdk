# Copilot Instructions

## Estilo de Código

- Sigue la convención de nombres en **camelCase** para variables y métodos.
- Sigue la convención de nombres en **kebab-case** para archivos.
- Usa programación orientada a objetos

## Estilo de Commits

- cuando copilot genere los mensajes de confimación debe seguir la convención `tipo(scope): descripción`.

## Estructura del proyecto

src
│── core
│   │── fingerprint-manager.ts
│   │── token-manager.ts
│   │── websocket-manager.ts
│   │── factories
│   │   │── socket.factory.ts
│   │   │── token.factory.ts
│   │── interfaces
│       │── base-component.abstract.ts
│       │── component.interface.ts
│       │── fingerprint.interface.ts
│       │── token.interface.ts
│       │── websocket.interface.ts
│── pixel
│   │── guiders-pixel.ts
│── presentation
│   │── live-chat
│       │── button-live-chat.component.ts
│       │── live-chat.component.ts
│       │── index.ts
│       │── logger.ts