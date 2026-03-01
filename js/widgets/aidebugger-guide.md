# AI-powered Debugger Widget - Contributor Guide

## Overview

The AI-powered Debugger Widget is an intelligent debugging assistant for Music Blocks that provides AI-powered analysis and child-friendly debugging suggestions through an interactive chat interface.

### Key Features

-   Interactive chat interface within Music Blocks
-   Real-time project analysis using AI
-   Educational explanations for children
-   Export/reset conversation functionality
-   Integration with Music Blocks widget system

### Architecture

```
Music Blocks Frontend → AI Debugger Widget → FastAPI Backend → Google Gemini AI
                                         → RAG System → Qdrant Vector DB
```

**Components:**

-   **Frontend**: `js/widgets/aidebugger.js` (main widget)
-   **Block Definition**: `js/blocks/WidgetBlocks.js` (lines 1643-1719)
-   **Registration**: `js/activity.js` (line 165)
-   **Backend**: External FastAPI server with AI processing

## Quick Start

### Setup

```bash
git clone https://github.com/sugarlabs/musicblocks.git
cd musicblocks
npm install
npm run serve  # Access at http://localhost:3000
```

### Key Files

-   `js/widgets/aidebugger.js` - Main widget implementation
-   `js/blocks/WidgetBlocks.js` - Block definition (lines 1643-1719)
-   `js/activity.js` - Widget registration (line 165)

## Frontend Implementation

### Widget Structure

```javascript
function AIDebuggerWidget() {
    const BACKEND_CONFIG = {
        BASE_URL: "http://13.49.246.243:8000",
        ENDPOINTS: { ANALYZE: "/analyze" }
    };

    this.chatHistory = [];
    this.promptCount = 0;
    this.conversationId = null;
}
```

### Key Methods

-   `init(activity)` - Initialize widget and UI
-   `_createLayout()` - Build chat interface
-   `_sendMessage()` - Handle user input and AI responses
-   `_convertProjectToLLMFormat()` - Convert Music Blocks JSON to readable text

### API Communication

```javascript
const payload = {
    code: projectData, // Music Blocks JSON
    prompt: message, // User question
    history: history, // Chat history
    prompt_count: this.promptCount
};

fetch(`${BACKEND_CONFIG.BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});
```

## Development Workflow

### Adding Features

1. **Edit Widget**: Modify `js/widgets/aidebugger.js`
2. **Test Locally**: Run `npm run serve`
3. **Block Integration**: Update `js/blocks/WidgetBlocks.js` if needed
4. **Register Widget**: Ensure listed in `js/activity.js`

### Code Standards

```javascript
// Use descriptive names
this._createChatInterface = function() { ... };

// Add documentation
/**
 * Sends message to backend and processes AI response
 * @param {string} message - User input message
 */
this._sendToBackend = function(message) { ... };

// Handle errors gracefully
.catch(error => {
    console.error("Backend error:", error.message);
    this.activity.textMsg(_("Connection error"));
});
```

### Code Review Checklist

-   [ ] Widget initializes correctly
-   [ ] Chat interface is responsive
-   [ ] Backend communication works
-   [ ] Error handling is robust
-   [ ] Language is child-appropriate
-   [ ] No console errors

## Testing

### Manual Testing

1. Open Music Blocks → Drag AI Debugger block → Click block
2. Verify widget window opens with chat interface
3. Type message → Click Send → Check AI response
4. Test export/reset functionality
5. Verify works with different project types

### Debug Commands

```javascript
// Frontend debugging
console.log("Widget initialized:", this);
console.log("Backend URL:", BACKEND_CONFIG.BASE_URL);

// Backend testing
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "[]", "prompt": "test"}'
```

## Troubleshooting

### Common Issues

-   **Widget not loading**: Check `activity.js` registration and console errors
-   **Backend connection**: Verify `BACKEND_CONFIG.BASE_URL` and CORS
-   **UI problems**: Check CSS styles and widget window creation

### Resources

-   **GitHub Issues**: [Music Blocks Issues](https://github.com/sugarlabs/musicblocks/issues)
-   **Documentation**: [Music Blocks Guide](https://github.com/sugarlabs/musicblocks/tree/master/guide)
-   **Backend Repo**: [AI Debugger Backend](https://github.com/omsuneri/AI-powered-Debugger-for-Music-Blocks)

---

**Made with ❤️ for Music Blocks and Sugar Labs**  
**Created by**: [Om Santosh Suneri](https://github.com/omsuneri/) | **[GSoC 2025](https://summerofcode.withgoogle.com/programs/2025/projects/l4402WCJ)**
