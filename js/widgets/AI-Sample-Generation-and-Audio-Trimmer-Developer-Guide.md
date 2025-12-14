# AI Sample Generation - Developer Guide

## Introduction

The AI Sample Generation feature is an addition to the existing Sampler Widget, allowing users to generate audio from text, which can then be imported into Music Blocks.

### Prerequisites

To run this feature, you need to set up the backend: [AI-Sample-Generation-Backend](https://github.com/sugarlabs/AI-Sample-Generation-Backend).

### Endpoints

The backend provides three endpoints:
- `/generate` - Generate audio from text
- `/preview` - Preview generated audio
- `/save` - Save generated audio

### Feature Overview

There is one button added to the Sampler Widget toolbar: Prompt

![Sampler Widget](../../screenshots/Sampler%20Widget.png)

Clicking the Prompt button opens a screen to enter and submit a prompt. Once submitted, the audio is generated. Users can click the Preview button to listen to the generated audio. If they are satisfied, they can save it by clicking the Save button; otherwise, they can refine the prompt and generate it again.

### Code Structure

1. **Toolbar Button**

```js
this._promptBtn = widgetWindow.addButton("prompt.svg", ICONSIZE, _("Prompt"), "");
```

- Prompt Button (`this._promptBtn`)
  - Upon clicking it, the AI Sample Generation screen is rendered.

---

2. **When the Prompt Button is clicked** (`this._promptBtn.onclick`)

- **Purpose**: Renders a new screen which allows users to enter a text prompt, generate audio, then preview and save it.

- **Workflow**:
    - **Clears the Screen**
        - Removes any previous content from the widget except for the toolbar.
    - **Creates the Layout**
        - A container `div` with a heading (`AI Sample Generation`) and a textarea for user input and a row of three buttons.
        - Textarea uses a random placeholder from a predefined prompt list.
    - **Adds Buttons**
        - **Submit**
          - Sends a request to `/generate` with the user’s prompt.
          - Shows status messages while generating.
          - On success, enables **Preview** and **Save**.
        - **Preview**
          - Plays the generated audio from `/preview`.
        - **Save**
          - Downloads the generated audio from `/save`.

---

Created by: [Muhammad Haroon](https://github.com/haroon10725), Contributor, Sugar Summer of Code (SSoC) 2025