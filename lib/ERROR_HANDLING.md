# Error Handling Documentation

## Overview

This document describes the graceful error handling system implemented for the AI Content Repurposer (PodcastAnalyzer component). The system provides human-readable error messages with contextual information and actionable guidance.

## Features

- **User-Friendly Error Messages**: Technical errors are translated into plain language
- **Contextual Icons**: Visual indicators help users quickly understand the error type
- **Actionable Guidance**: Each error includes specific steps users can take to resolve the issue
- **Alert Dialog**: Errors are displayed in a non-intrusive modal dialog
- **Error Type Recognition**: Automatically detects and formats specific error types
- **Lite Model Fallback**: One-click retry with Gemini Flash Lite model when Pro model is overloaded
- **Auto Model Reset**: Automatically resets to Pro model on navigation or manual reset

## Error Types Handled

### 1. Service Unavailable (503 - Model Overloaded)

**When it occurs**: The AI model is experiencing high demand

**User sees**:
- 🎯 Icon: ⏳
- 🎯 Title: "Service Temporarily Unavailable"
- 🎯 Message: "The AI model is currently experiencing high demand and is overloaded. This is a temporary issue."
- 🎯 Action: "Please try again in a few moments. If the problem persists, try again in 5-10 minutes."

**Example API Error**:
```json
{
  "error": {
    "code": 503,
    "message": "The model is overloaded. Please try again later.",
    "status": "UNAVAILABLE"
  }
}
```

### 2. Rate Limit (429 - Too Many Requests)

**When it occurs**: Too many API requests in a short period

**User sees**:
- 🎯 Icon: ⚠️
- 🎯 Title: "Rate Limit Reached"
- 🎯 Message: "You've made too many requests in a short period."
- 🎯 Action: "Please wait a moment before trying again."

### 3. Authentication Error (401)

**When it occurs**: Invalid or expired API credentials

**User sees**:
- 🎯 Icon: 🔒
- 🎯 Title: "Authentication Error"
- 🎯 Message: "Your API credentials are invalid or have expired."
- 🎯 Action: "Please check your API key configuration and try again."

### 4. Invalid Request (400)

**When it occurs**: Malformed request or invalid parameters

**User sees**:
- 🎯 Icon: ❌
- 🎯 Title: "Invalid Request"
- 🎯 Message: [Specific error message from API]
- 🎯 Action: "Please check your input and try again."

### 5. Server Error (500)

**When it occurs**: Internal server error on the API side

**User sees**:
- 🎯 Icon: 🔧
- 🎯 Title: "Server Error"
- 🎯 Message: "An internal server error occurred."
- 🎯 Action: "Please try again later. If the problem persists, contact support."

### 6. Network Error

**When it occurs**: Connection issues or network problems

**User sees**:
- 🎯 Icon: 📡
- 🎯 Title: "Network Error"
- 🎯 Message: "Unable to connect to the service."
- 🎯 Action: "Please check your internet connection and try again."

### 7. Timeout Error

**When it occurs**: Request takes too long to complete

**User sees**:
- 🎯 Icon: ⏱️
- 🎯 Title: "Request Timeout"
- 🎯 Message: "The request took too long to complete."
- 🎯 Action: "Please try again. The service may be experiencing delays."

### 8. Generic/Unknown Error

**When it occurs**: Unrecognized or unexpected errors

**User sees**:
- 🎯 Icon: ⚠️
- 🎯 Title: "Something Went Wrong"
- 🎯 Message: [Raw error message]
- 🎯 Action: "Please try again. If the problem persists, contact support."

## Implementation

### Core Components

1. **`lib/error-utils.ts`**
   - `parseApiError()`: Extracts error information from various formats
   - `formatErrorForDisplay()`: Converts technical errors to user-friendly messages

2. **`components/gemini-analyzer-components/PodcastAnalyzer.tsx`**
   - Integrated AlertDialog component
   - Error state management
   - `showErrorDialog()` helper function

3. **`lib/gemini-analyzer-social-service.ts`**
   - Enhanced error handling in API calls
   - Proper error propagation

### Usage Example

```typescript
// In any component
import { formatErrorForDisplay } from "@/lib/error-utils";

try {
  // Your API call
  await someApiCall();
} catch (error) {
  const formattedError = formatErrorForDisplay(error);
  // Display formattedError to user
}
```

### Error Dialog Component

The error dialog automatically displays when an error occurs during:
- Initial podcast analysis
- Social media post generation
- Social media post regeneration
- Image editing

The dialog can be dismissed by clicking "Got it" or clicking outside the dialog.

## Testing

### Manual Testing

To test the error handling:

1. **Test 503 Error (Model Overloaded)**:
   - Generate multiple analysis requests rapidly
   - The system should show the service unavailable dialog

2. **Test Network Error**:
   - Disconnect from the internet
   - Try to analyze content
   - Should show network error dialog

3. **Test Invalid Input**:
   - Provide extremely long or malformed transcript
   - Should show appropriate error message

## Lite Model Retry Feature

### Overview

When the Gemini Pro model is overloaded or unavailable, users can retry their request using the lighter Gemini Flash Lite model. This provides:
- **Higher availability**: Lite model handles high demand better
- **Faster response**: Generally quicker processing times
- **Seamless fallback**: One-click retry without re-entering data

### User Experience

1. **Error Occurs**: User encounters a 503 error or similar
2. **Dialog Appears**: Error dialog shows with "Try with Lite Model ⚡" button
3. **One-Click Retry**: User clicks button to automatically retry with lite model
4. **Visual Indicator**: Blue badge shows "⚡ Lite Model Active" in header
5. **Auto Reset**: Model resets to Pro when:
   - User clicks "Reset & Try Again"
   - User navigates away from the page
   - Component unmounts

### Implementation Details

**Service Layer** (`lib/gemini-analyzer-social-service.ts`):
```typescript
// Functions accept optional useLiteModel parameter
analyzePodcastContent(transcript, onProgress, useLiteModel?: boolean)
generateSocialMediaPosts(summary, chapters, tone?, useLiteModel?: boolean)
```

**Component Layer** (`PodcastAnalyzer.tsx`):
- `useLiteModel` state tracks current model
- Error dialog conditionally shows retry button
- Auto-retry mechanism on button click
- Cleanup function resets model on unmount

### Model Comparison

| Feature | Gemini Pro | Gemini Flash Lite |
|---------|------------|-------------------|
| Quality | Higher | Good |
| Speed | Slower | Faster |
| Availability | Can be overloaded | Better uptime |
| Use Case | Primary/default | Fallback/high-demand |

## Best Practices

1. **Always use `showErrorDialog()`** when catching errors in async operations
2. **Keep existing error state** for backward compatibility with inline error displays
3. **Log errors to console** for debugging purposes
4. **Provide specific error messages** when possible, fall back to generic messages when not
5. **Let users choose**: Don't automatically switch to lite model; let users decide via dialog
6. **Reset properly**: Always reset to Pro model on cleanup to avoid confusion

## Future Enhancements

- [ ] Add retry mechanism with exponential backoff
- [ ] Implement error tracking/analytics
- [ ] Add toast notifications for non-critical errors
- [ ] Create error recovery suggestions based on error history
- [ ] Add multilingual error messages
- [ ] Track success rates for each model
- [ ] Smart model selection based on historical performance

