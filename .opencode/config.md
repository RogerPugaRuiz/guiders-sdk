# OpenCode Configuration for Guiders SDK

## Project Context

This is a TypeScript SDK for real-time visitor tracking and chat, with a WordPress plugin integration.

## Custom Commands

Custom slash commands are defined in `.opencode/commands/` directory.

### Available Commands:
- `/publish-wp [version-type]` - Publish WordPress plugin to GitHub

## Build Commands

```bash
# Build SDK
npm run build

# Development mode (webpack dev server + WordPress Docker)
npm start

# Run E2E tests
npm test

# Update SDK in test environments after build
npm run build 2>&1 && \
cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js && \
cp dist/index.js demo/app/guiders-sdk.js
```

## Code Style

- Use relative imports (no `@/` path aliases)
- Follow naming conventions from AGENTS.md
- TypeScript strict mode enabled
- No ESLint configured (use `npx tsc --noEmit --strict`)

## Architecture

- `core/` - Orchestration, state, managers
- `pipeline/` - Event processing stages
- `services/` - Network & WebSocket logic
- `presentation/` - UI components (lazy-loaded)
- `types/` - Centralized type definitions

## Language Standards

- **User communication**: Always in Spanish
- **Code & documentation**: Always in English
- **Changelog & WordPress**: In Spanish (for end users)
