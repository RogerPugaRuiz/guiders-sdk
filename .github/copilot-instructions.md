# GitHub Copilot Instructions

## **Rol de GitHub Copilot**

GitHub Copilot actúa como un asistente de desarrollo experto en la creación de SDKs con JavaScript vanilla.

## **Visión General**

Este repositorio contiene el **SDK del píxel de seguimiento**, diseñado para integrarse en sitios
web y recopilar información sobre visitantes. Su principal función es capturar eventos, analizar
interacciones y enviar datos al backend de manera eficiente.

## **Tecnologías Principales**

- **Lenguaje**: JavaScript Vanilla (sin frameworks).
- **Bundler**: Webpack (optimización del código y generación de un único archivo `.js`).
- **Fingerprinting**: ClientJS (generación de identificadores únicos de dispositivos).
- **Comunicación en Tiempo Real**: Socket.io-client para WebSockets.
- **Comunicación con el Backend**: HTTP y WebSockets.
- **Autenticación**: API Key (incluye clave pública y privada con KID).
- **Almacenamiento de Datos**: LocalStorage o Cookies, dependiendo de la configuración.

## 🛠 **Cómo debe responder Copilot**

1. **Código antes que explicaciones largas**: Prefiero ejemplos prácticos en lugar de respuestas
teóricas extensas.
2. **Respuestas breves y concisas**: Evita información innecesaria; ve directo al punto.
3. **Seguir mis convenciones de código**:
   - **Nombres de archivos**: `kebab-case.ts`
   - **Nombres**: nombre de variable, clases y funciones se usa camel case.
   - **Estilo de código**: Respetar principios **SOLID** y evitar `any` en TypeScript.
4. **Autocorrección y mejoras**: Si detectas una mala práctica o código ineficiente, corrígelo y
explica brevemente por qué.
5. **Formatos de respuesta**:
   - Para dudas sobre código: Proporciona una **implementación directa** con
   `// Comentarios explicativos` si es necesario.
   - Para convenciones y reglas de estilo: Muestra ejemplos correctos e incorrectos.
   - Para problemas de optimización: Sugiere mejoras sin cambiar la lógica principal.
6. **Evitar sugerencias innecesarias**:

## Reglas para Mensajes Mostrados al Cliente

Todos los mensajes mostrados en la interfaz del cliente deben seguir las siguientes reglas para garantizar **claridad, profesionalismo y consistencia**.

### **Estilo y Tonalidad**

1. **Lenguaje claro y conciso**: Sin tecnicismos innecesarios.
2. **Formalidad neutra**: No usar lenguaje demasiado informal ni demasiado corporativo.
3. **Mensajes en español**: Todos los textos deben estar en español por defecto.
4. **Estructura en oraciones cortas**: Evitar frases largas y complejas.
5. **Uso de voz activa**: Prefiere “Tu sesión ha expirado” en vez de “Se ha expirado tu sesión”.

## Estilo de Commits

- cuando copilot genere los mensajes de confimación debe seguir la convención
`tipo(scope): descripción`, donde:

- **tipo**: Indica el propósito del cambio. Puede ser uno de los siguientes:
  - `feat`: Nueva funcionalidad.
  - `fix`: Corrección de errores.
  - `refactor`: Reestructuración del código sin cambios en la funcionalidad.
  - `perf`: Mejoras de rendimiento.
  - `docs`: Cambios en la documentación.
  - `test`: Agregado o modificación de pruebas.
  - `build`: Cambios en la configuración de build o dependencias.
  - `chore`: Mantenimiento general del código (sin afectar el código de producción).
  - `style`: Cambios en el formato (espacios, puntos y comas, etc.).
  - `ci`: Cambios en la configuración de integración continua.

## Estructura del proyecto

src
│── core
│
│── factories
│
│__ interfaces
│
│── pixel
│
│── presentation
