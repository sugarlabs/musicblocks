const fs = require("fs");
const path = require("path");

async function generateTest() {
    const apiKey = process.env.OPENAI_API_KEY;
    const targetFile = process.argv[2];

    if (!apiKey) {
        console.error("Error: OPENAI_API_KEY environment variable is missing.");
        console.error('Please set it using: export OPENAI_API_KEY="your-api-key"');
        process.exit(1);
    }

    if (!targetFile) {
        console.error("Error: Please provide a target file to generate tests for.");
        console.error("Usage: npm run generate-test <path-to-file.js>");
        process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), targetFile);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: File not found at ${resolvedPath}`);
        process.exit(1);
    }

    const code = fs.readFileSync(resolvedPath, "utf8");
    console.log(`Generating tests for ${targetFile}...`);

    const prompt = `
You are an expert JavaScript tester for the MusicBlocks application.
Write a comprehensive Jest unit test file for the following JavaScript code.
Make sure to require the module appropriately. Use Jest's environment correctly.

Code to test:
\`\`\`javascript
${code}
\`\`\`
`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // Or gpt-3.5-turbo
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        let generatedTest = data.choices[0].message.content;

        // Extract code block if wrapped in markdown
        const codeBlockMatch = generatedTest.match(/```(javascript|js)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
            generatedTest = codeBlockMatch[2].trim();
        }

        // Determine test file path
        const parsedPath = path.parse(resolvedPath);
        const testDir = path.join(parsedPath.dir, "__tests__");
        const testFilePath = path.join(testDir, `${parsedPath.name}.test.js`);

        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        fs.writeFileSync(testFilePath, generatedTest, "utf8");
        console.log(`✅ Test file successfully generated at: ${testFilePath}`);
    } catch (error) {
        console.error("Test generation failed failed:", error.message);
        process.exit(1);
    }
}

generateTest();
