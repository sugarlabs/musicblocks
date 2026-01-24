const express = require("express");
const compression = require("compression");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

app.use(express.json());

// compression + static files
app.use(
    compression({
        level: 9,
        threshold: 0
    })
);

app.use(
    express.static(path.join(__dirname), {
        maxAge: "1h"
    })
);

// ================================
// Learning Guide AI (DEV ONLY)
// ================================
app.post("/guide-ai", async (req, res) => {
    try {
        const { stepId, stepText, isCompleted, userQuestion } = req.body;

        const prompt = `
You are a friendly Music Blocks tutor.

Step ID: ${stepId}
Instruction: ${stepText}
Status: ${isCompleted ? "COMPLETED" : "NOT COMPLETED"}

User question:
${userQuestion}

Rules:
- If NOT completed, explain what to do next
- If completed, explain what was achieved
- Beginner friendly
`;

        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Music Blocks Learning Guide"
            },
            body: JSON.stringify({
                model: "openrouter/auto",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await r.json();

        res.json({
            response: data.choices?.[0]?.message?.content || "AI unavailable."
        });

    } catch (err) {
        console.error("❌ Guide AI error:", err);
        res.status(500).json({ response: "AI unavailable." });
    }
});

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
});