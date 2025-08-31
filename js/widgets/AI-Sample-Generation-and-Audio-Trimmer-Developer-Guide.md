# AI Sample Generation and Audio Trimmer - Developer Guide

## Introduction

The AI Sample Generation and Audio Trimmer features are additions to the existing Sampler Widget, allowing users to generate audio from text. Once the audio is generated, users can trim their desired segment using the Audio Trimmer feature and then import it into Music Blocks.

### Prerequisites

To run this feature, you need to set up the backend: [AI-Sample-Generation-Backend](https://github.com/haroon10725/AI-Sample-Generation-Backend).

### Endpoints

There are 5 endpoints created:
- /generate - Generate audio from text
- /preview - Preview generated audio
- /save - Save generated audio
- /trim-preview - Preview trimmed audio
- /trim-save - Save trimmed audio

### Feature Overview

There are two buttons added to the Sampler Widget toolbar: Prompt and Trim.

When you click the Prompt button in the toolbar, a screen appears where you can enter your prompt and submit it. Once submitted, the audio is generated. Users can click the Preview button to listen to the generated audio. If they are satisfied, they can save it by clicking the Save button; otherwise, they can refine the prompt and generate it again.

After the users are satisfied with the generated audio, they can trim it to select the desired segment. This can be done by clicking the Trim button in the toolbar. When clicked, a new screen appears with two input boxes: one for the start time of the audio and the other for the end time. By clicking the Preview button, users can listen to the trimmed audio and verify whether it meets their needs. Once satisfied, they can save the trimmed audio by clicking the Save button. The final audio file will be downloaded and can then be imported into Music Blocks.

### Code Structure

1. **Toolbar Buttons**

```js
this._promptBtn = widgetWindow.addButton("prompt.svg", ICONSIZE, _("Prompt"), "");
this._trimBtn   = widgetWindow.addButton("trim.svg", ICONSIZE, _("Trim"), "");
```

- Prompt Button (`this._promptBtn`)
  - Upon clicking it, the AI Sample Generation screen is rendered.
- Trim Button (`this._trimBtn`)
  - Upon clicking it, the Audio Trimmer screen is rendered.

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

3. **When the Trim Button is clicked** (`this._trimBtn.onclick`)

- **Purpose:** Renders a new screen which allows users to upload the AI generated audio file, trim it between specified times, and then preview or save the result.

- **Workflow**
    - **Clears the Screen**
        - Removes any previous content from the widget except for the toolbar.
    - **Creates the Layout**
        - A container `div` with a heading (`Audio Trimmer`), an upload section, input fields and a row of two buttons.
    - **Adds an Upload Section**
        - File chooser to upload an audio file.
        - After upload, replaces the file chooser with an audio player for playback.
    - **Adds Input Fields**
        - **From Input** → Start time (in minutes).  
        - **To Input** → End time (in minutes).
    - **Adds Buttons**
        - **Preview**
          - Sends start and end times to `/trim-preview`.
          - Trims the audio and then plays it.
          - Enables **Save**.
        - **Save**
          - Downloads the trimmed audio from `/trim-save`.

---

Created by: [Muhammad Haroon](https://github.com/haroon10725) a pilot candidate for Sugar Summer of Code 2025.