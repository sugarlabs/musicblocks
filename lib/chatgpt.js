async function queryChatGPT(prompt) {
    const apiKey = "your-openai-api-key"; // Need to fill in with API 
    const engineId = "text-davinci-003"; 
    const response = await fetch(`https://api.openai.com/v1/engines/${engineId}/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            max_tokens: 150
        }),
    });

    const data = await response.json();
    return data.choices[0].text; // The AI's response
}

queryChatGPT("Translate the following English text to French: 'Hello, how are you?'")
    .then(response => console.log(response))
    .catch(error => console.error("Error querying OpenAI:", error));
