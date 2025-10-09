# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Guiders SDK** is a TypeScript-based tracking and real-time chat SDK that bundles to a UMD library (`dist/index.js`) exposing `window.GuidersPixel`. It supports heuristic element detection, WebSocket-based chat, session tracking, bot detection, and integrates with WordPress via a plugin.

**Key capabilities:**
- Real-time chat with lazy initialization
- Intelligent heuristic detection of user interactions (no manual `data-track-event` attributes needed)
- Session tracking with heartbeat mechanism
- Bot detection to prevent SDK initialization for crawlers
- Chat API v2 with cursor pagination, metrics, and automatic fallback to v1
- Active hours validation with timezone support
- WordPress plugin for zero-code integration

## Build & Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Development server (hot reload on localhost:8081)
npm start

# Production build (outputs to dist/index.js)
npm run build

# End-to-end tests (Playwright)
npm test

# Interactive test UI
npm run test:ui

# Debug tests
npm run test:debug

# Run tests in headed mode
npm run test:headed

# View test report
npm run test:report

# Type checking (strict mode)
npx tsc --noEmit --strict

# WordPress plugin build & release
npm run release:wp           # Build SDK + create plugin ZIP
npm run release:wp:skip      # Create ZIP without rebuilding SDK
npm run release:wp:publish   # Full release: build + ZIP + git commit/tag/push
```

### Demo & Testing
- Demo PHP server (required for E2E tests): `php -S 127.0.0.1:8083 -t demo/app`
- Quick session test: Open `examples/quick-test.html` in browser after running `npx http-server -p 8080`
- WebSocket demo: `examples/websocket-realtime-chat-demo.html`
- Active hours demos: `demo/app/timezone-comparison.html`, `examples/timezone-auto-demo.html`

## Architecture

### Core Directory Structure

```
src/
├── core/                      # Orchestration, managers, runtime state
│   ├── tracking-pixel-SDK.ts  # Main SDK entry point & public API
│   ├── token-manager.ts       # JWT token lifecycle (JWT mode only)
│   ├── session-tracking-manager.ts  # Session heartbeat & end detection
│   ├── bot-detector.ts        # Bot detection (User-Agent, behavior, timing)
│   ├── heuristic-element-detector.ts  # Intelligent element detection
│   ├── dom-tracking-manager.ts      # Legacy manual tracking
│   ├── enhanced-dom-tracking-manager.ts  # Combined heuristic + manual
│   ├── active-hours-validator.ts    # Business hours validation
│   ├── endpoint-resolver.ts         # Centralized endpoint resolution
│   └── ...
├── pipeline/                  # Immutable event processing pipeline
│   ├── pipeline-processor.ts
│   ├── pipeline-stage.ts      # PipelineStage<I, O> interface
│   └── stages/
│       ├── time-stamp-stage.ts      # Add timestamp to events
│       ├── token-stage.ts           # Inject JWT token (if authMode=jwt)
│       ├── url-injection-stage.ts   # Inject URL metadata
│       ├── session-injection-stage.ts  # Inject session data
│       ├── metadata-stage.ts        # Add custom metadata
│       ├── validation-stage.ts      # Validate event structure
│       ├── tracking-event-v2-stage.ts  # Transform to v2 format
│       └── side-effect-stage.ts     # Network I/O (ONLY stage allowed to do I/O)
├── services/                  # Network layer & WebSocket
│   ├── chat-v2-service.ts     # Chat API v2 with v1 fallback
│   ├── websocket-service.ts   # Socket.IO singleton for real-time messages
│   └── ...
├── presentation/              # UI components (lazy-loaded)
│   ├── chat-ui.ts             # Main chat UI controller
│   ├── chat-messages-ui.ts    # Message list renderer
│   ├── chat-input-ui.ts       # Input box component
│   └── message-renderer.ts    # Individual message rendering
└── types/                     # Shared TypeScript types
    ├── index.ts
    └── websocket-types.ts
```

### Architectural Patterns

#### 1. Pipeline Architecture
The SDK uses an **immutable pipeline** for event processing. Events flow through fixed stages in order:

**Stage Order:** TimeStamp → Token → URL → Session → Metadata → Validation → TrackingEventV2 → SideEffect

- Each stage implements `PipelineStage<I, O>` with a `process(input: I): O` method
- Stages must be **pure functions** (no side effects like network calls, localStorage, DOM manipulation)
- **ONLY** `SideEffectStage` may perform I/O (HTTP requests, console logs, storage)
- If a stage returns `null`, the pipeline stops (document reason with log emoji ❌)
- New enrichments should be added as pure stages before `ValidationStage`

**Example: Adding a new enrichment stage**
```typescript
class GeoEnrichmentStage implements PipelineStage {
  process(evt) {
    // Pure function: no fetch/localStorage/DOM
    return { ...evt, geo: { /* detected from IP */ } };
  }
}
// Register before validation, after session
```

#### 2. Authentication Modes
The SDK supports two authentication modes (configured via `authMode`):

- **`session` (default):** Uses HttpOnly cookies from `/api/visitors/identify`. No JWT handling.
- **`jwt`:** Uses JWT tokens from `/api/pixel/token`. Token manager handles renewal when <60s to expiry.

**Important:** Legacy endpoints `/pixel/register` and `/pixel/token/refresh` have been removed. Token renewal uses the same `/pixel/token` endpoint.

#### 3. API Fallback Strategy
`ChatV2Service` tries `/api/v2/chats` endpoints first, then silently falls back to v1 format:
- Adapts v1 response shapes to match v2 (normalizes `participants`, `messages`, `unread`)
- **NO branching in UI code** - services handle compatibility transparently

#### 4. Endpoint Resolution
All endpoints are resolved through `EndpointManager` (from `endpoint-resolver.ts`):

**Resolution order:**
1. `window.GUIDERS_CONFIG.endpoint` / `window.GUIDERS_CONFIG.webSocketEndpoint`
2. Environment variables (`GUIDERS_SDK_ENDPOINT`, `GUIDERS_SDK_WS_ENDPOINT`, `VITE_*` variants)
3. Fallback: Production or development defaults

**Development mode:** Triggered by `?dev` query param (in page URL or script src). Default dev endpoint: `http://localhost:3000/api`

**Never hardcode `localhost:3000` in services** - always use `EndpointManager.getInstance().getEndpoint()`

#### 5. Heuristic Detection
Use `enableAutomaticTracking()` (v2 API) instead of `enableDOMTracking()`:
- Detects user interactions without requiring `data-track-event` attributes
- Custom rules can be added via `heuristicDetector.addCustomRules()`
- Runtime tuning: `updateHeuristicConfig()`, `setHeuristicEnabled()`

**Example: Custom heuristic rule**
```typescript
heuristicDetector.addCustomRules('my_custom_event', [
  { selector: 'button', confidence: 0.9, textPatterns: ['comprar', 'buy'] }
]);
```

#### 6. Session Tracking
`SessionTrackingManager` prevents false `session_end` events on page refresh:
- Heartbeat mechanism (default: 30s intervals)
- Inactivity detection
- Validates with `examples/quick-test.html` after modifying heartbeat/inactivity logic

#### 7. Active Hours Validation
`ActiveHoursValidator` controls chat availability by business hours:
- Supports manual timezone or `'auto'` (uses `Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Configured via `window.GUIDERS_CONFIG.activeHours` or `updateActiveHoursConfig()`
- Handles ranges that cross midnight (e.g., `22:00-06:00`)

**Configuration example:**
```typescript
window.GUIDERS_CONFIG = {
  activeHours: {
    enabled: true,
    timezone: 'auto',  // or 'Europe/Madrid'
    ranges: [
      { start: '08:00', end: '14:00' },
      { start: '15:00', end: '17:00' }
    ],
    fallbackMessage: 'Chat available 8am-2pm and 3pm-5pm'
  }
};
```

#### 8. WebSocket Message Filtering
`RealtimeMessageManager.handleNewMessage()` automatically filters messages where `senderId === visitorId`:
- Prevents duplicate rendering (visitor sees message immediately via optimistic UI)
- WebSocket echo is ignored
- Only renders messages from commercials/bots/other participants

#### 9. Bot Detection
Run `BotDetector` before initializing UI or opening WebSocket connections:
- Checks User-Agent, browser features, load timing, and behavior
- If `isBot` probability >60%, SDK exits early (logs with ❌ emoji, no exceptions thrown)

#### 10. Initialization Protection
`window.__GUIDERS_INITIALIZING__` guard prevents race conditions during initialization:
- Compatible with WP Rocket lazy loading (`rocket-script-loaded`, `rocket-loaded` events)
- `preventAutoInit: true` in config disables auto-initialization for custom integrations

## API Key Discovery

The SDK resolves API keys from multiple sources (in priority order):

1. Script `data-api-key` attribute: `<script data-api-key="KEY">`
2. Query parameter: `<script src="...?apiKey=KEY">`
3. Global config: `window.GUIDERS_CONFIG = { apiKey: 'KEY' }`

**All three methods must remain supported for backward compatibility.**

## WordPress Plugin Release Workflow

The project includes a WordPress plugin (`wordpress-plugin/`) that auto-injects the SDK bundle.

### Plugin Update System
Uses **[Plugin Update Checker v5.6](https://github.com/YahnisElsts/plugin-update-checker)** for automatic updates from GitHub Releases.

**Key behaviors:**
- **Stable releases** (no suffix): Auto-detected every 12h, WordPress shows update notification
- **Pre-releases** (`-alpha`, `-beta`, `-rc`): NOT auto-detected, manual download from GitHub Releases only

### SemVer Philosophy
`alpha → beta → rc → stable` with same base version:
- Example: `1.0.8-alpha.1 → 1.0.8-beta.1 → 1.0.8-rc.1 → 1.0.8`
- **Alpha:** Experimental features, unstable API
- **Beta:** Complete features, API nearly stable, broader testing
- **RC:** Feature freeze, only critical bug fixes
- **Stable:** Production-ready

### Release Phases (use prompts in `.github/prompts/`)
- `alpha-release.prompt.md` - Create alpha versions (features in development)
- `beta-release.prompt.md` - Transition alpha → beta (features complete)
- `rc-release.prompt.md` - Create release candidates (feature freeze)
- `release.prompt.md` - Publish stable version

### Automated Release Flow
1. **Update version numbers:**
   - `wordpress-plugin/guiders-wp-plugin/guiders-wp-plugin.php`: `Version:` header + `GUIDERS_WP_PLUGIN_VERSION` constant
   - `wordpress-plugin/guiders-wp-plugin/readme.txt`: `Stable tag:` + add changelog entry

2. **Run release script:**
   ```bash
   bash wordpress-plugin/release-wp-publish.sh "chore(wp-plugin): release 1.2.3"
   ```
   This script: builds SDK → copies bundle → creates ZIP → git add → commit → tag → push

3. **GitHub Actions (automatic on tag push):**
   - `Pre-Release WordPress Plugin` workflow (tags with `-alpha/-beta/-rc`)
   - `Release WordPress Plugin` workflow (stable tags without suffix)
   - Validates tag matches plugin `Version:` header exactly
   - Generates release notes from changelog
   - Attaches `guiders-wp-plugin-<version>.zip` to GitHub Release

4. **Plugin Update Checker:**
   - Scans GitHub Releases for assets matching `/guiders-wp-plugin.*\.zip$/i`
   - **CRITICAL:** ZIP attachment is mandatory for auto-updates to work

### Manual Release (fallback)
```bash
npm run build
cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js
bash wordpress-plugin/build-plugin.sh --skip-build
# Then manually commit, tag, and push
```

**Important Rules:**
- Never re-tag published versions
- CI fails if git tag doesn't match plugin `Version:` header
- Pre-releases must include suffix in version for CI validation to pass
- Always verify GitHub Actions attaches the ZIP to the release

## Logging Conventions

Use emoji prefixes for consistent log filtering:

- 🚀 init
- 📊 tracking
- 💬 chat
- 🔍 heuristic
- 📡 WebSocket
- 🕐 active hours
- ❌ warnings/errors

**Example:**
```typescript
console.log('[TrackingPixelSDK] 🚀 Initializing SDK...');
console.warn('[ChatUI] ❌ Failed to load messages');
```

## Pre-PR Checklist

Before submitting a PR, ensure:

1. ✅ `npm run build` completes without critical warnings
2. ✅ `npx tsc --noEmit --strict` passes
3. ✅ ESLint errors resolved after `--fix` (warnings acceptable)
4. ✅ `npm test` (Playwright E2E) passes
5. ✅ Bundle size within budget (check with analyzer task)
6. ✅ Chat and tracking work without heuristic detection (v1 compatibility)
7. ✅ If modified active hours: test midnight-crossing ranges, auto timezone detection
8. ✅ If modified WebSocket: verify reconnection, join/leave rooms, `message:new` events

## Anti-Patterns (reject in code review)

- ❌ I/O operations in non-SideEffect pipeline stages
- ❌ Network logic in `presentation/` components
- ❌ Duplicate type definitions (reuse from `types/`)
- ❌ v1/v2 compatibility branching in UI (must live in service adapters)
- ❌ Blocking initialization on recoverable errors (tokens, socket, heuristic)
- ❌ Hardcoding timezones instead of using auto-detection
- ❌ Validating active hours in UI (must validate in `ActiveHoursValidator`)
- ❌ Multiple WebSocket instances (use `.getInstance()` singletons)
- ❌ Importing `presentation/` from `services/` or `core/` (layer violation)

## Quick Debug Snippets

```typescript
// Check SDK state
console.log({
  tokens: TokenManager.hasValidTokens(),
  ws: window.guiders.webSocket?.isConnected(),
  chatVisible: window.guiders.chatUI?.isVisible(),
  heuristic: window.guiders.heuristicEnabled,
  activeHours: window.guiders.trackingPixelSDK.getActiveHoursConfig(),
  chatActive: window.guiders.trackingPixelSDK.isChatActive()
});

// Test bot detection
new BotDetector().detect().then(r => console.log(r));

// Check resolved endpoints
import { resolveDefaultEndpoints } from '@/core/endpoint-resolver';
console.log(resolveDefaultEndpoints());

// Test timezone changes
window.guiders.trackingPixelSDK.updateActiveHoursConfig({
  enabled: true,
  timezone: 'Asia/Tokyo',
  ranges: [{ start: '09:00', end: '17:00' }]
});
```

## Important File References

- Pipeline stages: `src/pipeline/stages/*.ts`
- WebSocket events: `src/types/websocket-types.ts`
- Endpoint resolution: `src/core/endpoint-resolver.ts`
- Plugin updater config: `wordpress-plugin/guiders-wp-plugin/includes/class-guiders-updater.php`
- GitHub Actions workflows: `.github/workflows/*.yml`
- Release prompts: `.github/prompts/*.md`
- Copilot instructions (additional context): `.github/copilot-instructions.md`

**Update this file when:**
- Pipeline stage order changes
- New global stage is added
- WebSocket events are introduced
- Public API is extended
- Active hours logic is modified
- WordPress plugin release process changes
