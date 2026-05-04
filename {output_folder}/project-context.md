---
project_name: 'guiders-sdk'
user_name: 'rogerpugaruiz'
date: '2026-04-24'
sections_completed: ['technology_stack', 'language_rules', 'architecture_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **TypeScript** ^5.8.2 — `strict: true`, target ES6, module CommonJS, generates `.d.ts`
- **Webpack** ^5.98.0 — UMD bundle output to `dist/index.js`, library name `GuidersPixel`
- **socket.io-client** ^4.8.1 — WebSocket client (real-time message reception only)
- **uuid** ^10.0.0 — `import { v4 as uuidv4 } from 'uuid'`
- **clientjs** ^0.2.1 — Browser fingerprinting
- **Playwright** ^1.55.0 — E2E tests only, base URL `http://127.0.0.1:8083` (PHP server)
- **Babel** ^7.26.9 — Only for Webpack, not for type checking
- **Build constants**: `__PRODUCTION__` (boolean) and `__SDK_VERSION__` (string) injected by Webpack DefinePlugin

---

## Critical Implementation Rules

### Language-Specific Rules

- **strict: true is mandatory** — No `any` except when explicitly required with a comment explaining why
- **Relative imports only** — Never use `@/` aliases. Use `../`, `../../` etc. Never include `.ts` extension
- **Named exports preferred** — Avoid default exports except in `index.ts` barrel files
- **All types centralized in `src/types/index.ts`** — Never duplicate type definitions across files
- **`__PRODUCTION__` constant** — Use for dev-only code blocks. Webpack tree-shakes `if (!__PRODUCTION__)` blocks in production build
- **`__SDK_VERSION__`** — Use when you need the SDK version string at runtime
- **Async patterns**: Use `async/await` over `.then()` chains. Always catch errors in async methods
- **Error handling in services**: `try/catch` with `debugError()` + silent return (never throw to caller unless critical)
- **Guards for early exit**: Prefer `if (!condition) return;` over nested if blocks

### Architecture Layer Rules

- **Layer order (strict)**:
  1. `types/` — Interfaces and types only. No logic.
  2. `utils/` — Pure helper functions. No imports from other SDK layers.
  3. `core/` — Orchestration, state, managers. No DOM rendering. No `presentation/` imports.
  4. `pipeline/` — Pure event transformation. Only `side-effect-stage.ts` may do I/O.
  5. `services/` — Network + WebSocket. **Never import from `presentation/`**.
  6. `presentation/` — UI components. No token/session logic. Lazy-loaded.

- **Pipeline stages must be pure** — No `fetch`, `localStorage`, or DOM access in stages except `side-effect-stage.ts`. Return `null` to abort pipeline (always log reason).
- **New enrichment stages go BEFORE `validation-stage.ts`** in the pipeline order.

### Endpoint Resolution Rules

- **Never hardcode IPs or URLs** — Always use `EndpointManager.getInstance().getEndpoint()`
- **Endpoint priority**: `window.GUIDERS_CONFIG` > env vars (`GUIDERS_SDK_ENDPOINT`) > fallback
- **Dev mode**: activated by `?dev` query param. Default is always **production**.
- **Production endpoints**: `https://guiders.es/api` (HTTP), `wss://guiders.es` (WS)
- **Dev endpoints**: `http://localhost:3000/api`, `ws://localhost:3000`

### Singleton Pattern Rules

- **All services and managers use Singleton** — Always `private constructor()` + `static getInstance()`
- **Never instantiate directly** — Always call `.getInstance()`
- **WebSocket is shared** — `WebSocketService.getInstance()` is the single connection point

### Hybrid Communication Model (Chat)

- **Send messages**: HTTP POST to `/v2/messages` via `ChatV2Service`
- **Receive messages**: WebSocket event `message:new` via `RealtimeMessageManager`
- **NEVER** use WebSocket to send messages or HTTP to receive them
- **Duplicate prevention**: `RealtimeMessageManager` automatically ignores messages where `senderId === visitorId`

### API Key Discovery (priority order)

1. `<script data-api-key="...">`
2. Query param `?apiKey=...` in script src
3. `window.GUIDERS_CONFIG.apiKey`

### GDPR / Consent Rules

- **Never call `init()` automatically** — The SDK constructor handles initialization based on consent state
- **Consent states**: `pending` (show placeholder, no init) | `granted` (auto-init) | `denied` (do nothing)
- **`init()` is called automatically** when user accepts cookies via `onConsentChange` callback

### Double Initialization Guard

- Check `window.guiders || window.__GUIDERS_INITIALIZING__` before initializing
- Set `window.__GUIDERS_SCRIPT_LOADED__` to prevent double script load (WP Rocket pattern)

---

## Testing Rules

- **E2E only with Playwright** — No unit test framework configured. All tests in `tests/e2e/`
- **Test files**: `*.spec.ts` naming convention
- **Requires PHP server**: `php -S 127.0.0.1:8083 -t demo/app` must be running before tests
- **After SDK changes**: Always run `npm run build && cp dist/index.js demo/app/guiders-sdk.js` before testing
- **Run single test**: `npx playwright test tests/e2e/chat.spec.ts`
- **Run by pattern**: `npx playwright test -g "pattern"`
- **Browser**: Chromium only (Desktop Chrome)
- **Base URL**: `http://127.0.0.1:8083` — never change in tests, use relative paths

---

## Code Quality & Style Rules

### File Naming
| Type | Pattern | Example |
|------|---------|---------|
| Services | `*-service.ts` | `websocket-service.ts` |
| Managers | `*-manager.ts` | `consent-manager.ts` |
| UI Components | `*-ui.ts` | `chat-ui.ts` |
| Types | `*-types.ts` | `websocket-types.ts` |
| Pipeline stages | `*-stage.ts` | `validation-stage.ts` |
| Tests | `*.spec.ts` | `chat.spec.ts` |

### Naming Conventions
- **Classes**: PascalCase with descriptive suffix (`TrackingPixelSDK`, `WebSocketService`)
- **Methods/Functions**: camelCase (`executeIdentify()`, `loadChatMessagesOnOpen()`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEY`, `ACTIVITY_THROTTLE_MS`)
- **Interfaces/Types**: PascalCase with suffix (`SDKOptions`, `ConsentState`, `PixelEvent`)

### Logging
Use `debugLog`, `debugWarn`, `debugError` from `utils/debug-logger` — never use `console.log` directly.

Standard emoji prefixes:
- `🚀` init | `📊` tracking | `💬` chat | `🔍` heuristic | `📡` socket | `🕐` active hours | `❌` errors

`debugLog` calls are **eliminated in production** by Webpack TerserPlugin (`pure_funcs: ['debugLog']`).

---

## Development Workflow Rules

### SDK Build & Deploy (MANDATORY after any source change)
```bash
npm run build 2>&1 && \
cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js && \
cp dist/index.js demo/app/guiders-sdk.js
```

### WordPress Plugin Release
```bash
npm run release:wp:publish  # Full: build → ZIP → git commit → tag → push
```

### Active Hours Validator
- `timezone: 'auto'` detects via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Time ranges can cross midnight (e.g., `22:00-06:00`)
- Always validate active hours **before** initializing chat UI

### Event Queue (defaults)
- `maxQueueSize`: 1,000 events
- `eventTtlMs`: 86,400,000 ms (24h)
- `maxPayloadSizeBytes`: 1,048,576 bytes (1 MB)
- `SendBeacon` limit: 64 KB (browser restriction)

---

## Critical Don't-Miss Rules

### Anti-Patterns (reject in review)
- **I/O inside non-side-effect pipeline stages** — pure stages cannot do fetch/localStorage/DOM
- **Network logic inside `presentation/`** — belongs in `services/`
- **Duplicate types** already defined in `types/index.ts`
- **v1/v2 branching in UI** — belongs in service adapters
- **Hardcoded endpoints** — use `EndpointManager.getInstance()`
- **Multiple Singleton instances** — always `.getInstance()`
- **Importing `presentation/` from `services/` or `core/`** — circular dependency violation
- **Static imports of dev-only modules** — use `import()` dynamic import inside `if (!__PRODUCTION__)` blocks

### Edge Cases
- **WP Rocket compatibility**: SDK uses `setTimeout(500ms)` delay + `rocket-script-loaded` / `rocket-loaded` event listeners for lazy-loaded scripts
- **`preventAutoInit`**: If `window.GUIDERS_CONFIG.preventAutoInit = true`, SDK skips auto-init but still exposes `window.TrackingPixelSDK`
- **Bot detection**: `BotDetector.detect()` runs before SDK init. If `result.isBot === true`, SDK does NOT initialize
- **Payload limits**: If batch > 1MB, binary search trims it; minimum 10 events per batch to avoid infinite loops
- **Token re-auth**: On HTTP 401, attempt `reAuthenticate()` once before failing

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-04-24
