# Session Tracking Implementation

## Overview

The session tracking functionality has been successfully implemented in the Guiders SDK to measure navigation time per session, tracking only active tab time across multiple browser tabs.

## Features Implemented

### Core Session Events
- **`session_start`** - Triggered when a new browser tab session begins
- **`session_continue`** - Triggered when the SDK loads in an existing tab session (page navigation within same tab)
- **`session_end`** - Triggered when a browser tab closes, user navigates to external domain, or SDK is explicitly disabled
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
- ✅ `totalActiveTime` accumulates across multiple URLs within the same tab session
- ✅ Sessions end only on tab closure, external navigation, or explicit disabling

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

The session data structure contains comprehensive information about the user's session:

```javascript
{
    sessionId: "session_1234567890_abc123def",  // Unique identifier for this session
    startTime: 1634567890123,                   // Session start timestamp (ms)
    lastActiveTime: 1634567920456,              // Last time tab was active (ms)
    totalActiveTime: 30333,                     // Cumulative active time across all URLs (ms)
    isActive: true,                             // Current visibility state
    tabId: "tab_1234567890_xyz789"              // Unique tab identifier
}
```

### Important Notes about `totalActiveTime`

- **Cross-URL Accumulation**: `totalActiveTime` accumulates across different URLs within the same browser tab session
- **Active Time Only**: Only counts time when the tab is visible and active (not in background)
- **Persistent Storage**: Maintained in `sessionStorage` and persists across page navigation
- **Reset Conditions**: Only resets when the tab is closed or a new session explicitly starts

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

## Session End Behavior

### When `session_end` is Triggered

The `session_end` event occurs in the following scenarios:

1. **Browser Tab Closure**
   - User closes the browser tab
   - User closes the entire browser window
   - Triggered by the `beforeunload` event

2. **External Navigation**
   - User navigates to a different domain
   - User types a new URL in the address bar to an external site
   - Any navigation that would cause the page to unload

3. **Explicit Session Termination**
   - Calling `sdk.disableSessionTracking()` programmatically
   - User logout (if implemented to call disableSessionTracking)
   - Application-specific session termination logic

4. **SDK Cleanup**
   - When the SDK is being destroyed or cleaned up
   - During page unload processes

### What Does NOT Trigger `session_end`

- **Internal Page Navigation**: Moving between pages within the same domain
- **Page Refresh**: Reloading the current page (generates `session_continue` instead)
- **Tab Switching**: Changing focus to another tab (generates `page_visibility_change`)
- **Temporary Network Issues**: Brief disconnections or network failures
- **Background Tab State**: Tab becoming inactive or hidden

### Session Data at End

When `session_end` is triggered, the event includes:

```javascript
{
    event: 'session_end',
    sessionId: 'session_1634567890_abc123def',
    tabId: 'tab_1634567890_xyz789',
    startTime: 1634567890123,        // Session start timestamp
    endTime: 1634568010999,          // Session end timestamp
    totalSessionTime: 120876,        // Total time tab was open (ms)
    totalActiveTime: 90555,          // Only time when tab was active (ms)
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

## Future Enhancements & Recommendations

### Potential Improvements

The current implementation provides a solid foundation for session tracking. Future enhancements could include:

1. **Automatic Session Timeout**
   - Add configurable maximum inactivity period
   - Automatically end sessions after prolonged inactivity
   - Prevent indefinitely long sessions from inactive tabs

2. **Cross-Tab Session Synchronization**
   - Coordinate sessions across multiple tabs of the same site
   - Optionally merge or relate sessions from the same user
   - Handle cases where users open multiple tabs simultaneously

3. **Enhanced Session End Triggers**
   - Session termination on user logout/authentication changes
   - Custom business logic triggers for session termination
   - Integration with user activity patterns

4. **Session Analytics**
   - Pre-calculated session metrics (bounce rate, engagement time)
   - Session quality scoring based on interaction patterns
   - Automatic categorization of session types

5. **Privacy Mode Handling**
   - Special handling for incognito/private browsing modes
   - Configurable behavior for privacy-conscious users
   - Compliance with privacy regulations

### Implementation Considerations

- **Performance**: Current implementation has minimal impact; future features should maintain this
- **Privacy**: All enhancements must respect user privacy and comply with data protection regulations
- **Backward Compatibility**: New features should not break existing implementations
- **Configuration**: Additional features should be opt-in and configurable

### Known Limitations

- No built-in session timeout mechanism
- Sessions don't automatically sync across browser tabs
- Limited handling of edge cases in private browsing modes
- No automatic cleanup of very old session data

This implementation successfully addresses all requirements from the original issue #12.