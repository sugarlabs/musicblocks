# AI Model Abstraction Layer

This directory contains the model-agnostic abstraction layer for integrating AI capabilities into Music Blocks.

## Structure
- `AIModelAdapter.js`: Base class for AI model integrations.
- `AIModelRegistry.js`: Singleton registry to manage active AI adapters.
- `MockAIModelAdapter.js`: A placeholder adapter for demonstration and testing.

## How it works
The `AIModelRegistry` acts as a central factory. Components should request AI features through the registry rather than talking to specific providers directly.

Example usage:
```javascript
const response = await Activity.aiRegistry.request({
    prompt: "Generate a melody in C Major"
});
console.log(response.text);
```

## Future Work
This infrastructure is designed to support:
1. LLM-based assistants for block-based coding (#4671).
2. Generative music agents.
3. Automated project debugging.

New adapters can be added by extending `AIModelAdapter` and registering them with `AIModelRegistry.register()`.
