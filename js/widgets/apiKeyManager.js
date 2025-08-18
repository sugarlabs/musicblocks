/**
 * MusicBlocks v3.6.2
 *
 * @author Elwin Li
 *
 * @copyright 2025 Elwin Li
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * API Key Manager Widget
 */
class APIKeyManager {
    constructor(activity) {
        this.activity = activity;
        this.isOpen = false;
        this._setup();
    }

    /**
     * Set up the API key manager UI
     * @private
     */
    _setup() {
        // Create the main container
        this.container = document.createElement("div");
        this.container.id = "apiKeyManager";
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ccc;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: none;
            min-width: 400px;
            max-width: 500px;
            font-family: Arial, sans-serif;
        `;

        // Create the header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        `;

        const title = document.createElement("h3");
        title.textContent = _("Gemini API Key Settings");
        title.style.margin = "0";
        title.style.color = "#333";

        const closeButton = document.createElement("button");
        closeButton.innerHTML = "&times;";
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.onclick = () => this.close();

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create the content
        const content = document.createElement("div");

        // Description
        const description = document.createElement("p");
        description.innerHTML = _("To use AI-powered MIDI generation, you need a Gemini API key. <a href='https://aistudio.google.com/app/apikey' target='_blank'>Get your API key here</a>.");
        description.style.cssText = `
            margin: 0 0 15px 0;
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        `;

        // API Key input
        const inputContainer = document.createElement("div");
        inputContainer.style.marginBottom = "15px";

        const inputLabel = document.createElement("label");
        inputLabel.textContent = _("API Key:");
        inputLabel.style.cssText = `
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        `;

        this.apiKeyInput = document.createElement("input");
        this.apiKeyInput.type = "password";
        this.apiKeyInput.placeholder = _("Enter your Gemini API key");
        this.apiKeyInput.style.cssText = `
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        `;

        // Load existing API key
        const existingKey = localStorage.getItem('gemini_api_key');
        if (existingKey) {
            this.apiKeyInput.value = existingKey;
        }

        inputContainer.appendChild(inputLabel);
        inputContainer.appendChild(this.apiKeyInput);

        // Buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        `;

        const saveButton = document.createElement("button");
        saveButton.textContent = _("Save");
        saveButton.style.cssText = `
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        saveButton.onclick = () => this._saveAPIKey();

        const testButton = document.createElement("button");
        testButton.textContent = _("Test Connection");
        testButton.style.cssText = `
            padding: 10px 20px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        testButton.onclick = () => this._testConnection();

        const clearButton = document.createElement("button");
        clearButton.textContent = _("Clear");
        clearButton.style.cssText = `
            padding: 10px 20px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        clearButton.onclick = () => this._clearAPIKey();

        buttonContainer.appendChild(clearButton);
        buttonContainer.appendChild(testButton);
        buttonContainer.appendChild(saveButton);

        // Status message
        this.statusMessage = document.createElement("div");
        this.statusMessage.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
            font-size: 14px;
        `;

        // Assemble the widget
        content.appendChild(description);
        content.appendChild(inputContainer);
        content.appendChild(buttonContainer);
        content.appendChild(this.statusMessage);

        this.container.appendChild(header);
        this.container.appendChild(content);

        // Add to document
        document.body.appendChild(this.container);

        // Add backdrop
        this.backdrop = document.createElement("div");
        this.backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: none;
        `;
        this.backdrop.onclick = () => this.close();
        document.body.appendChild(this.backdrop);
    }

    /**
     * Show the API key manager
     */
    show() {
        this.container.style.display = "block";
        this.backdrop.style.display = "block";
        this.isOpen = true;
        this.apiKeyInput.focus();
    }

    /**
     * Close the API key manager
     */
    close() {
        this.container.style.display = "none";
        this.backdrop.style.display = "none";
        this.isOpen = false;
        this._hideStatus();
    }

    /**
     * Save the API key
     * @private
     */
    _saveAPIKey() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this._showStatus(_("Please enter an API key"), "error");
            return;
        }

        localStorage.setItem('gemini_api_key', apiKey);
        this._showStatus(_("API key saved successfully"), "success");
        
        // Initialize RAG system if available
        if (window.ragConfig) {
            window.ragConfig.initialize(apiKey).then(success => {
                if (success) {
                    this._showStatus(_("RAG system initialized successfully"), "success");
                } else {
                    this._showStatus(_("Failed to initialize RAG system"), "error");
                }
            });
        }
    }

    /**
     * Test the API key connection
     * @private
     */
    async _testConnection() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this._showStatus(_("Please enter an API key first"), "error");
            return;
        }

        this._showStatus(_("Testing connection..."), "info");

        try {
            // Test with a simple embedding request
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: {
                        parts: [{ text: "test" }]
                    }
                })
            });

            if (response.ok) {
                this._showStatus(_("Connection successful! API key is valid."), "success");
            } else {
                const error = await response.json();
                this._showStatus(_("Connection failed: ") + (error.error?.message || "Unknown error"), "error");
            }
        } catch (error) {
            this._showStatus(_("Connection failed: ") + error.message, "error");
        }
    }

    /**
     * Clear the API key
     * @private
     */
    _clearAPIKey() {
        localStorage.removeItem('gemini_api_key');
        this.apiKeyInput.value = "";
        this._showStatus(_("API key cleared"), "info");
    }

    /**
     * Show a status message
     * @private
     * @param {string} message - The message to show
     * @param {string} type - The type of message (success, error, info)
     */
    _showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.style.display = "block";
        
        // Set color based on type
        switch (type) {
            case "success":
                this.statusMessage.style.backgroundColor = "#d4edda";
                this.statusMessage.style.color = "#155724";
                this.statusMessage.style.border = "1px solid #c3e6cb";
                break;
            case "error":
                this.statusMessage.style.backgroundColor = "#f8d7da";
                this.statusMessage.style.color = "#721c24";
                this.statusMessage.style.border = "1px solid #f5c6cb";
                break;
            case "info":
            default:
                this.statusMessage.style.backgroundColor = "#d1ecf1";
                this.statusMessage.style.color = "#0c5460";
                this.statusMessage.style.border = "1px solid #bee5eb";
                break;
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this._hideStatus();
        }, 5000);
    }

    /**
     * Hide the status message
     * @private
     */
    _hideStatus() {
        this.statusMessage.style.display = "none";
    }

    /**
     * Get the current API key
     * @returns {string|null} - The API key or null if not set
     */
    static getAPIKey() {
        return localStorage.getItem('gemini_api_key');
    }

    /**
     * Check if API key is set
     * @returns {boolean} - Whether an API key is set
     */
    static hasAPIKey() {
        return !!localStorage.getItem('gemini_api_key');
    }
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = APIKeyManager;
} 