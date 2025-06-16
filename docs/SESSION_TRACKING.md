# Session Tracking Implementation

## Overview

The session tracking functionality has been successfully implemented in the Guiders SDK to measure navigation time per session, tracking only active tab time across multiple browser tabs.

## Features Implemented

### Core Session Events
- **`session_start`** - Triggered when a new browser tab session begins
- **`session_continue`** - Triggered when the SDK loads in an existing tab session (page navigation)
- **`session_end`** - Triggered when a browser tab closes
- **`page_visibility_change`** - Triggered when switching between tabs (focus changes)
- **`session_heartbeat`** - Periodic pulse (default 30 seconds) sent only for active tabs

### Browser APIs Used
- **Page Visibility API** (`document.hidden`, `visibilitychange` event)
- **beforeunload event** for session end detection
- **focus/blur events** for additional tab state tracking

### Key Characteristics
- ✅ Only tracks active tab time (background tabs don't count)
- ✅ Session persists across page navigation within the same browser tab
- ✅ Uses sessionStorage to maintain tab-specific session continuity
- ✅ Each browser tab has its own unique session ID
- ✅ Configurable heartbeat interval
- ✅ Automatic session start on new tab, continuation on page navigation
- ✅ Proper cleanup on tab close
- ✅ Integration with existing tracking pipeline

## Configuration

Session tracking is enabled by default and can be configured:

```javascript
const sdkOptions = {
    // ... other options
    sessionTracking: {
        enabled: true,
        config: {
            enabled: true,
            heartbeatInterval: 30000, // 30 seconds
            trackBackgroundTime: false // only active tabs
        }
    }
};
```

## API Methods

### Session Control
- `sdk.enableSessionTracking()` - Start session tracking
- `sdk.disableSessionTracking()` - Stop session tracking
- `sdk.getCurrentSession()` - Get current session data
- `sdk.updateSessionConfig(config)` - Update configuration

### Session Data Structure
```javascript
{
    sessionId: "session_1234567890_abc123def",
    startTime: 1634567890123,
    lastActiveTime: 1634567920456,
    totalActiveTime: 30333, // milliseconds
    isActive: true,
    tabId: "tab_1234567890_xyz789"
}
```

## Event Data Examples

### Session Start Event
```javascript
{
    event: 'session_start',
    sessionId: 'session_1634567890_abc123def',
    tabId: 'tab_1634567890_xyz789',
    timestamp: 1634567890123,
    isVisible: true
}
```

### Session Continue Event (Page Navigation)
```javascript
{
    event: 'session_continue',
    sessionId: 'session_1634567890_abc123def', // Same session ID persists
    tabId: 'tab_1634567890_xyz789', // Same tab ID persists
    timestamp: 1634567920456,
    isVisible: true,
    totalActiveTime: 30333 // Previously accumulated time
}
```

### Page Visibility Change Event
```javascript
{
    event: 'page_visibility_change',
    sessionId: 'session_1634567890_abc123def',
    tabId: 'tab_1634567890_xyz789',
    isVisible: false,
    wasVisible: true,
    timestamp: 1634567920456,
    activeTimeBeforeChange: 30333
}
```

### Session Heartbeat Event
```javascript
{
    event: 'session_heartbeat',
    sessionId: 'session_1634567890_abc123def',
    tabId: 'tab_1634567890_xyz789',
    timestamp: 1634567950789,
    totalActiveTime: 60666,
    isActive: true
}
```

### Session End Event
```javascript
{
    event: 'session_end',
    sessionId: 'session_1634567890_abc123def',
    tabId: 'tab_1634567890_xyz789',
    startTime: 1634567890123,
    endTime: 1634568010999,
    totalSessionTime: 120876,
    totalActiveTime: 90555, // Only time when tab was active
    timestamp: 1634568010999
}
```

## Implementation Details

### Files Modified/Added
- **`src/core/session-tracking-manager.ts`** - Enhanced core session tracking logic with tab persistence
- **`src/core/tracking-pixel-SDK.ts`** - Integration with main SDK
- **`src/index.ts`** - Export new classes and enable by default

### Session Persistence
- Sessions are now **browser tab-specific** rather than page-specific
- Uses **sessionStorage** to maintain session continuity across page navigation
- Session ID and tab ID persist for the entire lifetime of a browser tab
- New `session_continue` event for page navigation within existing sessions
- Accumulated active time persists across page changes

### Integration Points
- Session tracking integrates with the existing event pipeline
- Uses the same `track()` method as other tracking events
- Follows the same event structure and processing flow
- Respects the existing configuration pattern

### Memory Management
- Proper cleanup of event listeners on SDK cleanup
- Session tracking manager can be safely destroyed
- Timer cleanup to prevent memory leaks

## Testing

A demo page has been created (`session-tracking-demo.html`) that demonstrates:
- Session start/end events
- Visibility change tracking
- Heartbeat functionality
- Manual session control
- Event logging and debugging

## Browser Compatibility

The implementation uses modern browser APIs:
- Page Visibility API (supported in all modern browsers)
- beforeunload event (universal support)
- focus/blur events (universal support)

## Performance Considerations

- Minimal performance impact (only event listeners and periodic timers)
- No continuous polling - events are driven by browser APIs
- Efficient time calculation using timestamps
- Optional heartbeat can be configured for different intervals

## Security & Privacy

- No sensitive data collection
- Uses only standard browser timing APIs
- Session IDs are locally generated (not server-dependent)
- Respects user privacy by tracking only navigation time

This implementation successfully addresses all requirements from the original issue #12.