# Reflection Widget - Developer Guide

## Overview

The `ReflectionMatrix` class provides a chat-based interface for users to interact with AI mentors for reflecting on their music blocks project. It manages chat history, mentor selection, message exchange with a backend server, and report generation.

Backend Code for the widget : [musicblocks_reflection_fastapi](https://github.com/Commanderk3/musicblocks_reflection_fastapi)

## Key Features

-   **Multi-mentor Chat:** Switch between AI mentors (Meta/Rohan, Music/Beethoven, Code/Steve).
-   **Chat History:** Stores and renders conversation history.
-   **Typing Indicator:** Shows animated "Thinking..." while awaiting responses.
-   **Markdown Rendering:** Converts Markdown responses to HTML for display.
-   **Analysis & Summary:** Fetches project analysis after sufficient chat history.
-   **Local Storage:** Saves and retrieves analysis reports.
-   **Export:** Download chat transcript as a text file.

## Components

-   **Widget Interface**: `js/widgets/reflection.js`
-   **Block Definition**: `js/blocks/WidgetBlocks.js`
-   **Registration**: `js/activity.js` (line 176) and `js/logo.js` (line 113)
-   **CSS styling**: `css/activities.css` (line 2023 - 2072)

## Methods

-   **Widget Window Initialisation**

    `init(activity)` : Triggers when the reflection block is clicked. It renders the widget and initializes the required data structures.

---

-   **Mentor Switching**

    `changeMentor("code")` : Changes the active mentor and updates button highlights.

---

-   Sending Messages

    `sendMessage()` : Pushes user message to history, displays it, and requests bot reply.

---

-   Bot Reply Handling

    `botReplyDiv(message, user_query, md)` :

    -   If `user_query` is true, sends message to backend and displays reply.
    -   If `md` is true, renders reply as Markdown.

---

-   Analysis & Summary

    `getAnalysis()` :

    -   Requests project analysis from backend if chat history is sufficient.
    -   Saves analysis to localStorage.

---

-   Local Storage

    -   **Save:** `saveReport(data)` stores analysis.
    -   **Read:** `readReport()` retrieves analysis.

---

-   Export Conversation

    `downloadAsTxt(conversationData)` : Downloads chat history as a `.txt` file.

---

-   Markdown Rendering

    `mdToHTML(md)` : Converts Markdown to HTML for display in chat.

---

## API Endpoints

### 1. `/projectcode`

-   **Method:** `POST`
-   **Purpose:** Sends the exported project code to the backend to receive an algorithmic summary.
-   **Payload:**
    ```json
    {
        "code": "<project code string>"
    }
    ```
-   **Response:**  
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

-   **Method:** `POST`
-   **Purpose:** Sends a user query, chat history, mentor selection, and project algorithm to the backend to get an AI mentor's reply.
-   **Payload:**
    ```json
    {
      "query": "<user message>",
      "messages": [ { "role": "...", "content": "..." }, ... ],
      "mentor": "<mentor key>",
      "algorithm": "<algorithm string>"
    }
    ```
-   **Response:**  
    `{ response: "<bot reply>" }`  
    or  
    `{ error: "<error message>" }`

-   **Example `messages` structure**
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

-   **Method:** `POST`
-   **Purpose:** Sends the chat history and summary to the backend to receive a project analysis report.
-   **Payload:**
    ```json
    {
      "messages": [ { "role": "...", "content": "..." }, ... ],
      "summary": "<summary string>"
    }
    ```
-   **Response:**  
    `{ response: "<analysis report>" }`  
    or  
    `{ error: "<error message>" }`

---

**All endpoints expect and return JSON.**  
**The backend is expected to run locally while development.**

---

### API testing

```bash
curl -X POST http://localhost:PORT/projectcode \
     -H "Content-Type: application/json" \
     -d '{
           "code": "MUSICBLOCKS_PROJECT_CODE_HERE"
         }'
```

**Note** : Save your Music Blocks project as an HTML file. Open the file to locate the embedded JSON code, and make sure to stringify the JSON before using it for testing.

Written by : [Diwangshu Kakoty](https://github.com/Commanderk3)