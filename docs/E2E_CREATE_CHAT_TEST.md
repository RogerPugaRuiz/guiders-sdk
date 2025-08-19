# E2E Test for CreateChat V2 API

This comprehensive end-to-end test validates the new PUT endpoint for chat creation in the ChatV2Service.

## Overview

The `e2e-create-chat-v2.html` file provides a complete test suite that validates:

### Core Functionality
- ✅ **Idempotent Chat Creation**: PUT `/api/v2/chats/:chatId` 
- ✅ **Status Code Validation**: 201 for new chats, 200 for existing
- ✅ **Data Integrity**: Complete request/response validation
- ✅ **Error Handling**: Invalid data and edge cases

### Test Cases
1. **Initialize ChatV2Service** - Verify SDK initialization
2. **Create New Chat** - Valid data with 201 status
3. **Idempotency Test** - Same chat ID returns existing chat
4. **Priority Levels** - Test all priority values (LOW, MEDIUM, NORMAL, HIGH, URGENT)
5. **Department Handling** - Multiple department scenarios
6. **Optional Fields** - Tags, metadata, custom fields
7. **Error Handling** - Invalid/missing required fields
8. **Concurrent Requests** - Multiple simultaneous requests for same chat
9. **Large Payload** - Stress test with large data objects
10. **Full Integration** - Complete workflow validation

## Running the Tests

### Prerequisites
1. Build the SDK: `npm run build`
2. Ensure backend is running with V2 API support
3. Valid API key configured

### Manual Execution
1. Open `e2e-create-chat-v2.html` in a browser
2. Open Developer Tools (Console tab)
3. Click "Run All E2E Tests" for complete suite
4. Click "Run Single Test" for quick validation

### Automated Execution
The test suite runs automatically and provides:
- **Progress tracking** with visual progress bar
- **Real-time stats** (Total, Passed, Failed, Skipped)
- **Detailed logging** with timestamps
- **Export functionality** for test results (JSON)

## Test Results

### Success Indicators
- ✅ Green status messages for passed tests
- 📊 Progress bar completion
- 📤 Export button enabled after completion

### Failure Indicators  
- ❌ Red status messages with error details
- 📋 Detailed error logs in console
- 💥 Exception handling for unexpected errors

## Validation Points

### API Contract
- **Endpoint**: `PUT /api/v2/chats/:chatId`
- **Content-Type**: `application/json`
- **Authorization**: Bearer token in headers
- **Idempotency**: Same chat ID always returns same chat

### Response Structure
```typescript
interface ChatV2 {
  id: string;
  status: 'PENDING' | 'ASSIGNED' | 'ACTIVE' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'NORMAL' | 'HIGH' | 'URGENT';
  visitorInfo: VisitorInfoV2;
  metadata: ChatMetadataV2;
  // ... additional fields
}
```

### Request Structure
```typescript
interface CreateChatV2Request {
  visitorInfo: VisitorInfoV2;
  metadata: ChatMetadataV2;
  priority?: string;
  department?: string;
  tags?: string[];
}
```

## Integration with Backend

This test validates the complete integration with the Guiders Backend:
- **NestJS API** with DDD/CQRS architecture
- **PostgreSQL** for chat metadata
- **MongoDB** for encrypted messages
- **WebSocket** connections for real-time updates

## Best Practices Validated

1. **Idempotency**: Critical for distributed systems
2. **Type Safety**: Full TypeScript interface compliance
3. **Error Handling**: Graceful degradation for failures
4. **Performance**: Concurrent request handling
5. **Data Integrity**: Complete payload validation

## Debugging

### Console Logs
All test operations are logged with prefixes:
- `[E2E]` - Test suite messages
- `[ChatV2Service]` - Service-level operations
- `🚀`, `✅`, `❌` - Visual status indicators

### Common Issues
- **SDK Not Ready**: Wait for initialization
- **Network Errors**: Check backend connectivity
- **Auth Failures**: Verify API key configuration
- **CORS Issues**: Ensure proper backend CORS setup

## Export Format

Test results can be exported as JSON:
```json
{
  "summary": {
    "total": 10,
    "passed": 10,
    "failed": 0,
    "successRate": "100.0",
    "timestamp": "2024-..."
  },
  "testCases": [...]
}
```

This comprehensive test ensures the new createChat endpoint is production-ready and maintains backward compatibility while providing enhanced functionality.