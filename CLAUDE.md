# Guiders SDK - Architecture Guide

This document provides essential context for AI agents (Claude Code, GitHub Copilot, etc.) working on this codebase.

## Project Overview

**Guiders SDK** is a JavaScript/TypeScript SDK for real-time visitor tracking, chat functionality, and GDPR-compliant consent management. It's designed to be embedded in client websites via a simple `<script>` tag.

**Core functionality**:
- Real-time visitor identification and tracking (fingerprinting)
- WebSocket-based chat system with typing indicators, read receipts, and file uploads
- GDPR-compliant consent management (granular: analytics, functional, personalization)
- Event pipeline for tracking user interactions (page views, custom events)
- Backend integration with Guiders platform API

## Build and Development

### Key Commands

```bash
# Development build (watch mode)
npm run dev

# Production build
npm run build

# Demo server (serves built SDK)
npm run demo

# Testing
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:e2e           # E2E tests only
npm run test:coverage      # Coverage report
```

### Build Output

- **Development**: `demo/app/public/guiders-sdk.js` (unminified, with source maps)
- **Production**: `dist/guiders-sdk.js` (minified, optimized)
- Build tool: **Rollup** with TypeScript, Terser for minification

### Demo Environment

The SDK includes a complete PHP-based demo app at `demo/app/` that simulates a real website integration:
- Consent banner UI (`demo/app/partials/gdpr-banner.php`)
- Header integration (`demo/app/partials/header.php`)
- Test pages: Home, About, Contact, Product

**Run demo**: `npm run demo` then visit `http://localhost:8087`

## Architecture

### High-Level Structure

```
src/
├── core/                    # Core SDK initialization and orchestration
│   ├── tracking-pixel-SDK.ts   # Main SDK class (entry point)
│   └── consent-manager.ts      # Local consent state management
│
├── services/                # Backend integrations and business logic
│   ├── visitors-v2-service.ts    # Visitor identification (fingerprinting)
│   ├── consent-backend-service.ts # Consent API integration
│   ├── chat-service.ts           # WebSocket chat client
│   └── events-service.ts         # Event tracking API
│
├── pipeline/                # Event processing and queuing
│   ├── queue-system.ts          # Persistent event queue (localStorage)
│   └── event-pipeline.ts        # Event batching and retry logic
│
└── presentation/            # UI components
    ├── chat-ui.ts              # Chat widget UI
    ├── consent-placeholder.ts   # GDPR placeholder (pre-consent)
    └── components/             # Reusable UI components
```

### Key Design Patterns

#### 1. GDPR-First Architecture

**Principle**: No data processing without explicit consent.

**Implementation**:
- **ConsentManager** (`src/core/consent-manager.ts`): Manages consent state in localStorage
  - States: `pending`, `granted`, `denied`
  - Categories: `analytics`, `functional`, `personalization`
  - Emits events on state change

- **Consent Placeholder** (`src/presentation/consent-placeholder.ts`):
  - Shows static HTML/CSS widget when consent is `pending`
  - NO JavaScript execution, NO cookies, NO fingerprinting
  - User clicks "Gestionar cookies" → banner appears → consent granted → placeholder hides → SDK initializes

- **Automatic Consent Registration** (`src/services/visitors-v2-service.ts`):
  - Backend automatically registers ALL consents when `identify()` is called
  - Frontend sends `hasAcceptedPrivacyPolicy: true/false` in the identify payload
  - If `true` (HTTP 200): Backend creates visitor with session and registers consent as `granted`
  - If `false` (HTTP 400): Backend creates anonymous visitor WITHOUT session and registers consent as `denied`
  - No manual consent registration needed after identify (backend handles everything)

- **Consent Synchronization** (`src/core/tracking-pixel-SDK.ts` lines 753-786):
  - For NEW visitors (consentAge < 5s): Backend has latest state from identify, no sync needed
  - For RETURNING visitors (consentAge > 5s): Sync local state with backend state to detect changes

**Critical**: SDK initialization (`init()`) ONLY runs when consent status is `granted`. Constructor checks initial state and either:
- Shows placeholder (pending)
- Initializes SDK (granted)
- Does nothing (denied)

#### 2. Visitor Identity System

**Fingerprinting** (`src/services/visitors-v2-service.ts`):
- Uses ClientJS to generate browser fingerprint (canvas, WebGL, fonts, etc.)
- Stored in localStorage as `fingerprint`
- Sent to backend via `POST /visitors/v2/identify`
- Backend returns `visitorId` (UUID) which is stored and used for all subsequent API calls

**Identity Resolution**:
```
1. User visits site → SDK checks localStorage for fingerprint
2. If no fingerprint → SDK checks consent status
3. If consent pending → Show placeholder, STOP
4. If consent granted → Generate fingerprint via ClientJS
5. Call identify() → Backend matches fingerprint to existing visitor or creates new
6. Store visitorId in localStorage
7. Use visitorId for all chat/events/consent operations
```

#### 3. Event Pipeline

**Purpose**: Reliable event delivery even with network failures.

**Flow**:
```
trackEvent() → EventPipeline.enqueue() → QueueSystem.add() → localStorage
                                       ↓
                                   (background)
                                       ↓
                              EventPipeline.flush()
                                       ↓
                            POST /events/v2/track-batch
                                       ↓
                              (on success) QueueSystem.remove()
```

**Features**:
- Persistent queue in localStorage (`guiders_event_queue`)
- Automatic retry with exponential backoff
- Batch processing (10 events per request, max 50KB payload)
- Fallback to `navigator.sendBeacon()` on page unload

**File**: `src/pipeline/event-pipeline.ts`

#### 4. Chat System

**WebSocket Client** (`src/services/chat-service.ts`):
- Connects to `wss://chat.guiders.app`
- Handles:
  - Message sending/receiving
  - Typing indicators
  - Read receipts
  - File uploads (via presigned S3 URLs)
  - Reconnection logic

**UI Components**:
- `ChatUI` (`src/presentation/components/chat-ui.ts`): Main widget
- `ChatInputUI` (`src/presentation/components/chat-input-ui.ts`): Message input with file upload

**State Management**:
- Messages stored in memory (not persisted)
- UI auto-scrolls on new message
- Welcome message shown on first load (stored in localStorage flag)

### API Integration

**Base URL**: `https://app.guiders.app` (or staging: `https://staging.guiders.app`)

**Authentication**:
- API Key in request body: `apiKey: "gds_xxx"`
- Session ID in header: `X-Guiders-SID: <visitorId>`

**Key Endpoints**:
- `POST /visitors/v2/identify` - Register/identify visitor
- `POST /events/v2/track-batch` - Send event batch
- `POST /consent/visitors/{id}` - Register consent
- `GET /consent/visitors/{id}` - Fetch consent status
- WebSocket: `wss://chat.guiders.app` - Real-time chat

## Important Technical Decisions

### Why Automatic Consent Registration?

**Evolution**: The consent flow was simplified in January 2025 to reduce complexity and improve GDPR compliance.

**Old approach (deprecated)**:
- Backend registered only `privacy_policy` automatically
- Frontend manually registered `analytics` and `marketing` after identify
- Complex timing logic to avoid overwrites

**New approach (current)**:
- Backend automatically registers ALL consent preferences when `identify()` is called
- Frontend only sends `hasAcceptedPrivacyPolicy: true/false` in the identify payload
- Backend handles the rest: visitor creation, session management, and consent registration
- HTTP 200 (accepted) vs HTTP 400 (denied) clearly distinguish consent outcomes

**Mapping** (still used internally by backend):
- Frontend `functional` → Backend `privacy_policy`
- Frontend `analytics` → Backend `analytics`
- Frontend `personalization` → Backend `marketing`

**Benefits**:
- Simpler frontend code (no manual consent registration)
- Atomic operation (visitor + consent registered together)
- Better GDPR audit trail (consent recorded at visitor creation)
- Clearer error handling (HTTP 400 for denied consent is not a failure)

**Location**: `src/services/visitors-v2-service.ts` lines 72-151

### Why Placeholder Instead of Disabled Chat?

**Rejected Approach**: Show full chat UI but disable functionality until consent.

**Why rejected**:
- Loading SDK JavaScript = processing data (fingerprint, userAgent, localStorage writes)
- Showing functional UI = implied consent (GDPR violation - Article 7, Consideration 32)

**Chosen Approach**: Static HTML/CSS placeholder.

**Why chosen**:
- GDPR compliant (no processing before consent)
- User knows chat is available (UX benefit)
- Clear call-to-action ("Gestionar cookies")
- Industry standard (Drift, LiveChat, etc. use this pattern)

**Location**: `src/presentation/consent-placeholder.ts`

### Why ClientJS for Fingerprinting?

**Alternatives considered**: FingerprintJS (commercial), custom solution.

**Why ClientJS**:
- Open source, lightweight
- Generates stable fingerprints across sessions
- Covers: canvas, WebGL, fonts, timezone, screen resolution, plugins, etc.
- Good enough accuracy for visitor identification (not security use case)

**Location**: `src/services/visitors-v2-service.ts` lines 13-14 (import)

## Common Development Tasks

### Adding a New Event Type

1. Define event type in `src/pipeline/types/event-types.ts`:
   ```typescript
   export interface CustomEvent extends BaseEvent {
     type: 'custom';
     properties: {
       category: string;
       action: string;
       value?: number;
     };
   }
   ```

2. Add tracking method in `src/core/tracking-pixel-SDK.ts`:
   ```typescript
   public trackCustomEvent(category: string, action: string, value?: number): void {
     this.eventPipeline.enqueue({
       type: 'custom',
       properties: { category, action, value },
       timestamp: Date.now()
     });
   }
   ```

3. Test in demo: `demo/app/public/test-events.html`

### Adding a New Consent Category

1. Update `ConsentPreferences` in `src/core/types/consent-types.ts`:
   ```typescript
   export interface ConsentPreferences {
     analytics: boolean;
     functional: boolean;
     personalization: boolean;
     newCategory: boolean; // Add here
   }
   ```

2. Update mapping in `src/services/consent-backend-service.ts`:
   ```typescript
   const SDK_TO_BACKEND_TYPE_MAP: Record<string, BackendConsentType> = {
     'analytics': 'analytics',
     'functional': 'privacy_policy',
     'personalization': 'marketing',
     'newCategory': 'backend_type' // Add mapping
   };
   ```

3. Update banner UI: `demo/app/partials/gdpr-banner.php`

### Modifying Chat UI

**Files to edit**:
- `src/presentation/components/chat-ui.ts` - Main widget structure
- `src/presentation/components/chat-input-ui.ts` - Input area
- Styles are inline (look for `injectStyles()` methods)

**Key methods**:
- `showWelcomeMessage()` - Initial bot message
- `addMessage()` - Append new message to chat
- `scrollToBottom()` - Auto-scroll behavior

### Debugging GDPR Flow

**Clear state and test**:
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();

// Check consent state
const state = JSON.parse(localStorage.getItem('guiders_consent_state'));
console.log('Consent state:', state);

// Manual grant
window.guiders.grantConsent();

// Check if placeholder is visible
document.getElementById('guiders-consent-placeholder');
```

**Common issues**:
- Placeholder doesn't appear → Check initial consent state (might be `granted` from previous session)
- SDK initializes without consent → Check constructor logic in `src/core/tracking-pixel-SDK.ts` line 322
- Consents not reaching backend → Check Network tab for `POST /consent/visitors/{id}` calls

**Debug script**: See `DEBUG_GDPR_BANNER.md` for comprehensive troubleshooting steps.

## Testing Strategy

### Unit Tests (`tests/unit/`)
- ConsentManager state transitions
- Event queue operations
- Fingerprint generation
- Message formatting utilities

### E2E Tests (`tests/e2e/`)
- Full SDK initialization flow
- Consent grant/deny scenarios
- Chat message sending
- Event tracking end-to-end

**Run specific suite**:
```bash
npm test -- --grep "ConsentManager"
```

## File Naming Conventions

- **Services**: `*-service.ts` (e.g., `chat-service.ts`)
- **Types**: `*-types.ts` (e.g., `consent-types.ts`)
- **UI Components**: `*-ui.ts` (e.g., `chat-ui.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

## Documentation

- `README.md` - User-facing SDK documentation
- `GDPR_PLACEHOLDER_GUIDE.md` - Deep dive on consent placeholder system
- `DEBUG_GDPR_BANNER.md` - Troubleshooting guide for consent banner
- `.github/copilot-instructions.md` - Development guidelines for AI agents

## Key Dependencies

- **ClientJS** (`client-js`): Browser fingerprinting
- **uuid**: UUID generation for visitor IDs
- **Rollup**: Build system
- **TypeScript**: Type safety and modern JavaScript features

## Performance Considerations

- **Bundle size**: ~323 KiB (production build)
- **Lazy loading**: Chat UI components only load after consent granted
- **Event batching**: Max 10 events per request, 50KB payload limit
- **WebSocket**: Single persistent connection for chat (not polling)
- **localStorage**: Used for persistence (fingerprint, visitorId, consent state, event queue)

## Security Notes

- **API Keys**: Client-side keys (`gds_xxx`) are public by design (scoped to domain)
- **CORS**: Backend validates origin headers
- **XSS Protection**: All user input is sanitized before rendering
- **No sensitive data**: SDK never stores passwords, payment info, or PII beyond fingerprint

---

**Last updated**: 2025-10-11
**Current version**: 1.2.2-alpha.1

For questions or issues, refer to the issue tracker at: https://github.com/anthropics/claude-code/issues
