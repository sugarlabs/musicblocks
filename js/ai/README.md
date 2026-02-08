# AI Model Abstraction Layer

This directory contains the model-agnostic abstraction layer for integrating AI capabilities into Music Blocks.

## Structure
- `AIModelAdapter.js`: Base class for AI model integrations.
- `AIModelRegistry.js`: Singleton registry to manage active AI adapters.
- `MockAIModelAdapter.js`: A basic placeholder adapter for demonstration and testing.
- `ExampleAIAdapter.js`: An advanced mock that simulates specific AI behaviors like melody suggestions and block debugging.

## How it works
The `AIModelRegistry` acts as a central factory and orchestrator. Components should request AI features through the registry rather than talking to specific providers.

### Usage for Developers
The AI layer is currently in "Stub & Connector" mode. It is safe to use in development without making real API calls.

#### 1. Making a Request
```javascript
// Send a request to the active adapter
const response = await AIModelRegistry.request({
    prompt: "Give me a melody suggestion"
});
console.log(response.text);
```

#### 2. Switching Adapters
You can manually switch between different mock behaviors for testing.
```javascript
// List registered adapters
console.log(AIModelRegistry.getRegisteredAdapters());

// Switch to the example adapter
AIModelRegistry.setActiveAdapter("example-ai");

// Now requests will use the ExampleAIAdapter logic
const debugResponse = await AIModelRegistry.request({
    prompt: "Help me debug my code"
});
console.log(debugResponse.text);
```

#### 3. Manual Testing from Console
You can interact with the AI layer directly from the browser's developer console:
```javascript
// Test basic mock
AIModelRegistry.setActiveAdapter("mock-ai");
AIModelRegistry.request({ prompt: "Hello" }).then(r => console.log(r.text));

// Test melody simulation
AIModelRegistry.setActiveAdapter("example-ai");
AIModelRegistry.request({ prompt: "melody" }).then(r => console.log(r.text));
```

## Integration and Safety
- **No Automatic Calls**: The layer does not initiate any network requests or UI triggers by itself. Use it only via manual developer actions for now.
- **Deterministic Responses**: All current adapters are dummy implementations with deterministic or simulated outputs.
- **Merge Safety**: This layer provides the necessary scaffolding for future AI features while remaining invisible to the end user.
