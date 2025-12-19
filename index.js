const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

// Enable compression for all responses
app.use(compression({
    level: 9,
    threshold: 0
}));

app.use(express.static(path.join(__dirname), {
    maxAge: "1h"
}));

// Simple backend proxy for API calls using env var
// Configure environment variables: API_KEY and EXTERNAL_API_URL
app.get("/api/data", async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        const targetUrl = process.env.EXTERNAL_API_URL;
        if (!apiKey || !targetUrl) {
            return res.status(500).json({ error: "API not configured (set API_KEY and EXTERNAL_API_URL)" });
        }

        const response = await fetch(targetUrl, {
            headers: {
                "x-api-key": apiKey
            }
        });
        const contentType = response.headers.get("content-type") || "application/json";
        const body = contentType.includes("application/json") ? await response.json() : await response.text();
        res.setHeader("content-type", contentType);
        res.status(response.status).send(body);
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Proxy request failed" });
    }
});

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
