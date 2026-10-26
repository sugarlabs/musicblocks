# Reflection Widget - Developer Guide

## Overview

The `ReflectionMatrix` class provides a chat-based interface for users to interact with AI mentors for reflecting on their music blocks project. It manages chat history, mentor selection, message exchange with a backend server, and report generation.

Backend Code for the widget : [musicblocks_reflection_fastapi](https://github.com/Commanderk3/musicblocks_reflection_fastapi)

## Key Features

- **Multi-mentor Chat:** Switch between AI mentors (Meta/Rohan, Music/Beethoven, Code/Alan).
- **Chat History:** Stores and renders conversation history.
- **Typing Indicator:** Shows animated "Thinking..." while awaiting responses.
- **Markdown Rendering:** Converts Markdown responses to HTML for display.
- **Analysis & Summary:** Fetches project analysis after sufficient chat history.
- **Local Storage:** Saves and retrieves analysis reports.
- **Export:** Download chat transcript as a text file.

## Components

- **Widget Interface**: `js/widgets/reflection.js` holds the constructor, `init`, the backend
  URL lookup and `installModules`, which copies the methods of the modules below onto
  `ReflectionMatrix.prototype`, so `this` in them is the widget.
- **Block Definition**: `js/blocks/WidgetBlocks.js`. The Reflection block lazy-loads the widget
  through `ReflectionMatrix.dependencies`, or the same list in the block when the class is not
  loaded yet, and keeps the one instance in `logo.reflection`.
- **Shared lifecycle**: `js/utils/ai-widget-lifecycle.js`, also used by the AI Debugger.
- **Shared Markdown**: `js/utils/ai-markdown.js` draws mentor replies, also used by the AI
  Debugger. `mdToHTML` in `ReflectionMarkdown.js` is the fallback when it is not loaded.
- **CSS styling**: `css/activities.css`, from the `.chatInterface` rules on.

| Module                   | What it holds                                                        |
| ------------------------ | -------------------------------------------------------------------- |
| `ReflectionLifecycle.js` | the widget timers, `_isWidgetActive`, `_isSameMount`                 |
| `ReflectionWindow.js`    | the toolbar, the message box, closing, `_endSession`, `changeMentor` |
| `ReflectionChatLog.js`   | the typing indicator, adding messages, `renderChatHistory`           |
| `ReflectionSession.js`   | starting the chat, Refresh, sending queued messages, `getAnalysis`   |
| `ReflectionBackend.js`   | the `/projectcode`, `/updatecode`, `/chat` and `/analysis` requests  |
| `ReflectionReport.js`    | `saveReport`, `readReport`, `downloadAsTxt`                          |
| `ReflectionMarkdown.js`  | `mdToHTML`, `sanitizeHTML`, `isUnsafeUrl`                            |

## Methods

- **Widget Window Initialisation**

    `init(activity)` : Triggers when the reflection block is clicked. It renders the widget and initializes the required data structures.

---

- **Mentor Switching**

    `changeMentor("code")` : Changes the active mentor and updates button highlights.

---

- Sending Messages

    `sendMessage()` : Pushes user message to history, displays it, and requests bot reply.

---

- Bot Reply Handling

    `botReplyDiv(message, user_query, md)` :
    - If `user_query` is true, sends message to backend and displays reply.
    - If `md` is true, renders reply as Markdown.

---

- Analysis & Summary

    `getAnalysis()` :
    - Requests project analysis from backend if chat history is sufficient.
    - Saves analysis to localStorage.

---

- Local Storage
    - **Save:** `saveReport(data)` stores analysis.
    - **Read:** `readReport()` retrieves analysis.

---

- Export Conversation

    `downloadAsTxt(conversationData)` : Downloads chat history as a `.txt` file.

---

- Markdown Rendering

    `mdToHTML(md)` : Converts Markdown to HTML for display in chat.

---

## API Endpoints

### 1. `/projectcode`

- **Method:** `POST`
- **Purpose:** Sends the exported project code to the backend to receive an algorithmic summary.
- **Payload:**
    ```json
    {
        "code": "<project code string>"
    }
    ```
- **Response:**
    ```json
    {
        "algorithm": "<algorithm string>",
        "message": "<first message>"
    }
    ```
    or
    ```json
    {
        "error": "<error message>"
    }
    ```

---

### 2. `/chat`

- **Method:** `POST`
- **Purpose:** Sends a user query, chat history, mentor selection, and project algorithm to the backend to get an AI mentor's reply.
- **Payload:**
    ```json
    {
      "query": "<user message>",
      "messages": [ { "role": "...", "content": "..." }, ... ],
      "mentor": "<mentor key>",
      "algorithm": "<algorithm string>"
    }
    ```
- **Response:**  
  `{ response: "<bot reply>" }`  
  or  
  `{ error: "<error message>" }`

- **Example `messages` structure**
    ```json
    [
        {
            "role": "meta",
            "content": "hello"
        },
        {
            "role": "user",
            "content": "hi"
        },
        {
            "role": "meta",
            "content": "Hey there! I'm Rohan, the meta-mentor here. Tell me, what did you create in your project?"
        }
    ]
    ```

---

### 3. `/analysis`

- **Method:** `POST`
- **Purpose:** Sends the chat history and summary to the backend to receive a project analysis report.
- **Payload:**
    ```json
    {
      "messages": [ { "role": "...", "content": "..." }, ... ],
      "summary": "<summary string>"
    }
    ```
- **Response:**  
  `{ response: "<analysis report>" }`  
  or  
  `{ error: "<error message>" }`

---

### 4. `/updatecode`

- **Method:** `POST`
- **Purpose:** Sends updated project code to the backend to refresh the algorithmic summary.
- **Payload:**
    ```json
    {
        "oldcode": "<existing project code string>",
        "newcode": "<new project code string>"
    }
    ```
- **Response:**
    ```json
    {
        "algorithm": "<new algorithm string>",
        "message": "<response message>"
    }
    ```

---

**All endpoints expect and return JSON.**  
**The backend is expected to run locally while development.**

---

### API testing

code :

```bash
curl -X GET http://localhost:8000/
```

output :

```json
{
    "message": "Hello, Music Blocks!"
}
```

Test `/projectcode` endpoint with sample project code:

```bash
curl -X POST http://localhost:8000/projectcode \
     -H "Content-Type: application/json" \
     -d '{
           "code": "[[0,[\"start\",{\"id\":123,\"collapsed\":false}],244,80,[null,18,null]],[1,\"plus\",392,440,[10,16,8]]]"
         }'
```

Output:

```json
{
    "algorithm": "1. Start the program.\n2. Perform an addition operation.",
    "response": "This looks like a very basic program designed to add two numbers. Is that correct?"
}
```

**Note** : Save your Music Blocks project as an HTML file. Open the file to locate the embedded JSON code, and make sure to stringify the JSON before using it for testing.

Written by : [Diwangshu Kakoty](https://github.com/Commanderk3)
