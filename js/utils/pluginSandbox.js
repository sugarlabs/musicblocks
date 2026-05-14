/**
 * PluginSandbox provides a secure, isolated environment for executing
 * third-party JavaScript plugins using a sandboxed <iframe> with a null origin.
 * It implements a granular permissions model to restrict access to sensitive APIs.
 */
class PluginSandbox {
    /**
     * @param {Object} options - Sandbox configuration
     * @param {string[]} options.permissions - List of requested permissions (e.g., 'audio', 'storage')
     * @param {Object} options.callbacks - Main thread functions exposed to the sandbox
     */
    constructor(options = {}) {
        this.permissions = new Set(options.permissions || []);
        this.callbacks = options.callbacks || {};
        this.iframe = null;
        this.messageId = 0;
        this.pendingRequests = new Map();
        this.isReady = false;

        this._handleMessage = this._handleMessage.bind(this);
    }

    /**
     * Initializes the sandboxed iframe and sets up the communication bridge.
     */
    async init() {
        if (this.iframe) return;

        this.iframe = document.createElement("iframe");
        this.iframe.style.display = "none";
        this.iframe.sandbox = "allow-scripts"; // Unique origin, no same-origin access

        // Add to body to start loading
        document.body.appendChild(this.iframe);

        const sandboxHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <script>
                    const registry = {};
                    const permissions = new Set();

                    // Security: Remove dangerous globals if they somehow leaked
                    delete window.parent;
                    delete window.top;
                    delete window.frameElement;

                    window.addEventListener('message', async (event) => {
                        const { type, id, name, code, args, permissionList } = event.data;

                        if (type === 'init-permissions') {
                            permissionList.forEach(p => permissions.add(p));
                            window.parent.postMessage({ id, type: 'ready' }, '*');
                        } else if (type === 'load') {
                            try {
                                // Create a restricted function scope
                                const fn = new Function('logo', 'turtle', 'blk', 'receivedArg', 'actionArgs', 'args', 'isflow', code);
                                registry[name] = fn;
                                window.parent.postMessage({ id, type: 'load-success' }, '*');
                            } catch (e) {
                                window.parent.postMessage({ id, type: 'error', message: 'Compilation error: ' + e.message }, '*');
                            }
                        } else if (type === 'execute') {
                            if (registry[name]) {
                                try {
                                    // In a real implementation, we would proxy 'logo' and other objects
                                    // For this sandbox model, we restrict what the function can do.
                                    const result = await registry[name](...args);
                                    window.parent.postMessage({ id, type: 'result', result }, '*');
                                } catch (e) {
                                    window.parent.postMessage({ id, type: 'error', message: 'Runtime error: ' + e.message }, '*');
                                }
                            } else {
                                window.parent.postMessage({ id, type: 'error', message: 'Function not found: ' + name }, '*');
                            }
                        }
                    });

                    // Permission-based API stubs
                    window.MB_API = {
                        playSound: (id) => {
                            if (!permissions.has('audio')) throw new Error('Permission denied: audio');
                            window.parent.postMessage({ type: 'api-call', method: 'playSound', args: [id] }, '*');
                        },
                        saveData: (key, value) => {
                            if (!permissions.has('storage')) throw new Error('Permission denied: storage');
                            window.parent.postMessage({ type: 'api-call', method: 'saveData', args: [key, value] }, '*');
                        }
                    };
                </script>
            </head>
            <body></body>
            </html>
        `;

        this.iframe.srcdoc = sandboxHtml;

        window.addEventListener("message", this._handleMessage);

        // Wait for the 'ready' signal
        await this._sendRequest({
            type: "init-permissions",
            permissionList: Array.from(this.permissions)
        });

        this.isReady = true;
    }

    /**
     * Loads plugin code into the sandbox.
     * @param {string} name - Identifier for the function
     * @param {string} code - The JavaScript code body
     */
    async loadFunction(name, code) {
        if (!this.isReady) await this.init();
        return this._sendRequest({ type: "load", name, code });
    }

    /**
     * Executes a previously loaded function in the sandbox.
     * @param {string} name - Identifier for the function
     * @param {any[]} args - Arguments to pass
     */
    async execute(name, args = []) {
        if (!this.isReady) await this.init();
        return this._sendRequest({ type: "execute", name, args });
    }

    _sendRequest(data) {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            this.pendingRequests.set(id, { resolve, reject });
            this.iframe.contentWindow.postMessage({ ...data, id }, "*");
        });
    }

    _handleMessage(event) {
        if (event.source !== this.iframe.contentWindow) return;

        const { id, type, result, message, method, args } = event.data;

        if (type === "api-call") {
            if (this.callbacks[method]) {
                this.callbacks[method](...args);
            }
            return;
        }

        const pending = this.pendingRequests.get(id);
        if (!pending) return;

        this.pendingRequests.delete(id);

        if (type === "error") {
            pending.reject(new Error(message));
        } else {
            pending.resolve(result);
        }
    }

    destroy() {
        if (this.iframe) {
            this.iframe.remove();
            window.removeEventListener("message", this._handleMessage);
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PluginSandbox;
} else {
    window.PluginSandbox = PluginSandbox;
}
