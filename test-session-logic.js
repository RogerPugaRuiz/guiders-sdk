// Manual test script to verify session_end logic
// This script can be run in browser console to test our implementation

// Test helper functions
function testRefreshDetection() {
    console.log('=== Testing Refresh Detection Logic ===');
    
    // Test 1: No unload timestamp (new session)
    sessionStorage.removeItem('guiders_unload_timestamp');
    console.log('Test 1 - No timestamp:', wasLikelyRefresh() === false ? 'PASS' : 'FAIL');
    
    // Test 2: Recent unload timestamp (refresh)
    const recentTime = Date.now() - 500; // 500ms ago
    sessionStorage.setItem('guiders_unload_timestamp', recentTime.toString());
    console.log('Test 2 - Recent timestamp (500ms):', wasLikelyRefresh() === true ? 'PASS' : 'FAIL');
    
    // Test 3: Old unload timestamp (tab close)
    const oldTime = Date.now() - 5000; // 5 seconds ago
    sessionStorage.setItem('guiders_unload_timestamp', oldTime.toString());
    console.log('Test 3 - Old timestamp (5s):', wasLikelyRefresh() === false ? 'PASS' : 'FAIL');
    
    // Clean up
    sessionStorage.removeItem('guiders_unload_timestamp');
}

function testPageHideDetection() {
    console.log('=== Testing PageHide Event Detection ===');
    
    // Test 1: Persisted event (back/forward)
    const persistedEvent = { persisted: true };
    console.log('Test 1 - Persisted event:', isLikelyPageRefresh(persistedEvent) === true ? 'PASS' : 'FAIL');
    
    // Test 2: Non-persisted event (potential tab close)
    const normalEvent = { persisted: false };
    console.log('Test 2 - Normal event:', isLikelyPageRefresh(normalEvent) === false ? 'PASS' : 'FAIL');
}

function simulatePageRefresh() {
    console.log('=== Simulating Page Refresh ===');
    
    // Store timestamp as if page is unloading
    const now = Date.now();
    sessionStorage.setItem('guiders_unload_timestamp', now.toString());
    
    // Check if it would be detected as refresh
    setTimeout(() => {
        const wasRefresh = wasLikelyRefresh();
        console.log('Refresh simulation result:', wasRefresh ? 'Detected as REFRESH' : 'Detected as TAB CLOSE');
        
        // Should be detected as refresh since timestamp is very recent
        console.log('Test result:', wasRefresh ? 'PASS - Correctly detected refresh' : 'FAIL - Should detect refresh');
    }, 100);
}

function simulateTabClose() {
    console.log('=== Simulating Tab Close ===');
    
    // Store old timestamp as if page was unloaded long ago
    const oldTime = Date.now() - 10000; // 10 seconds ago
    sessionStorage.setItem('guiders_unload_timestamp', oldTime.toString());
    
    // Check if it would be detected as tab close
    setTimeout(() => {
        const wasRefresh = wasLikelyRefresh();
        console.log('Tab close simulation result:', wasRefresh ? 'Detected as REFRESH' : 'Detected as TAB CLOSE');
        
        // Should be detected as tab close since timestamp is old
        console.log('Test result:', !wasRefresh ? 'PASS - Correctly detected tab close' : 'FAIL - Should detect tab close');
    }, 100);
}

// Helper functions that mirror the actual implementation
function wasLikelyRefresh() {
    try {
        const unloadTimestamp = sessionStorage.getItem('guiders_unload_timestamp');
        if (!unloadTimestamp) return false;

        const now = Date.now();
        const timeSinceUnload = now - parseInt(unloadTimestamp, 10);
        
        // If less than 2 seconds since unload, it's likely a refresh
        const isRefresh = timeSinceUnload < 2000;
        
        console.log('Refresh detection:', { 
            unloadTimestamp: parseInt(unloadTimestamp, 10),
            currentTime: now,
            timeSinceUnload,
            isRefresh
        });

        // Clean up the timestamp after checking
        sessionStorage.removeItem('guiders_unload_timestamp');
        
        return isRefresh;
    } catch (error) {
        console.log('Error checking refresh status:', error);
        return false;
    }
}

function isLikelyPageRefresh(event) {
    // Check if page is being persisted (back/forward cache)
    if (event.persisted) {
        console.log('Page hide with persisted=true, likely navigation');
        return true;
    }

    return false;
}

// Run all tests
console.log('🧪 Running Session End Fix Tests...');
testRefreshDetection();
testPageHideDetection();
simulatePageRefresh();
setTimeout(() => simulateTabClose(), 200);

console.log('\n✅ Tests completed. Check results above.');
console.log('💡 You can also test manually by:');
console.log('1. Refreshing the page and checking for session_end events');
console.log('2. Navigating to another URL and checking for session_end events'); 
console.log('3. Closing the tab and checking server logs for session_end events');