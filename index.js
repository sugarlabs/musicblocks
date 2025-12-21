const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

function getCspHeaderValue() {
    // NOTE: Tone.js uses AudioWorklets and creates blob: modules/workers.
    // We intentionally do NOT allow 'unsafe-eval'.
    // We keep 'unsafe-inline' for now because index.html includes small inline scripts.
    return [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "script-src 'self' https://cdnjs.cloudflare.com blob: 'unsafe-inline'",
        "style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'",
        "worker-src 'self' blob:",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'self'"
    ].join("; ");
}

function requireMusicBlocksClient(req, res, next) {
    // Require a custom header so cross-site requests from a random web page can't hit this endpoint.
    // Browsers can't send custom headers cross-origin without a successful CORS preflight.
    if (req.get("x-mb-client") !== "1") {
        res.status(403).json({ error: "forbidden" });
        return;
    }
    next();
}

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        const error = new Error(`Missing required environment variable: ${name}`);
        error.code = "MISSING_ENV";
        throw error;
    }
    return value;
}

function joinBaseUrl(baseUrl, suffix) {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    const normalizedSuffix = String(suffix || "").replace(/^\/+/, "");
    return normalizedBase + normalizedSuffix;
}

// Enable compression for all responses
app.use(compression({
    level: 9,
    threshold: 0
}));

// Basic security headers for HTML documents.
app.use((req, res, next) => {
    const accept = req.headers.accept || "";
    if (accept.includes("text/html")) {
        res.setHeader("Content-Security-Policy", getCspHeaderValue());
    }
    next();
});

app.get("/api/data", requireMusicBlocksClient, async (req, res) => {
    try {
        const externalApiBase = requireEnv("EXTERNAL_API");
        const apiKey = requireEnv("API_KEY");
        const projectName = req.query.projectName;
        const url = projectName ? joinBaseUrl(externalApiBase, projectName) : externalApiBase;

        const upstreamResponse = await fetch(url, {
            headers: {
                "x-api-key": apiKey
            }
        });

        const contentType = upstreamResponse.headers.get("content-type");
        if (contentType) res.setHeader("content-type", contentType);

        res.status(upstreamResponse.status);
        res.send(Buffer.from(await upstreamResponse.arrayBuffer()));
    } catch (err) {
        res.status(err && err.code === "MISSING_ENV" ? 500 : 502);
        res.json({
            error: "api_proxy_failed",
            message: err?.message || "Failed to proxy request"
        });
    }
});

app.post(
    "/api/data",
    requireMusicBlocksClient,
    express.text({ type: "*/*", limit: "10mb" }),
    async (req, res) => {
        try {
            const externalApiBase = requireEnv("EXTERNAL_API");
            const apiKey = requireEnv("API_KEY");
            const projectName = req.query.projectName;
            if (!projectName) {
                res.status(400).json({ error: "missing_projectName" });
                return;
            }

            const url = joinBaseUrl(externalApiBase, projectName);
            const upstreamResponse = await fetch(url, {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "content-type": req.headers["content-type"] || "text/plain"
                },
                body: req.body
            });

            const contentType = upstreamResponse.headers.get("content-type");
            if (contentType) res.setHeader("content-type", contentType);

            res.status(upstreamResponse.status);
            res.send(Buffer.from(await upstreamResponse.arrayBuffer()));
        } catch (err) {
            res.status(err && err.code === "MISSING_ENV" ? 500 : 502);
            res.json({
                error: "api_proxy_failed",
                message: err?.message || "Failed to proxy request"
            });
        }
    }
);

app.use(express.static(path.join(__dirname), {
    maxAge: "1h"
}));

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
