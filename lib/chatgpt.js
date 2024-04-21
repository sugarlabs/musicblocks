async function queryChatGPT(prompt) {
    const apiKey = 'Your_API_KEY'; // Replace with your API key stored in environment variables
    // const engineId = "text-davinci-004"; 
    try {
        const response = await fetch(`https://api.openai.com/v1/engines/gpt-3.5-turbo-1106/completions`, {
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].text; // The AI's response
    } catch (error) {
        console.error("Error querying OpenAI:", error);
        throw error; // Rethrow the error to be caught by the calling function
    }
}