const express = require("express");
const compression = require("compression");
const path = require("path");

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err, origin) => {
    console.error(`Caught exception: ${err}\nException origin: ${origin}`);
});

const app = express();

// Detect environment (default to development for safety)
const isDev = process.env.NODE_ENV !== "production";

// runtime environment for browser
app.get("/env.js", (req, res) => {
    res.type("application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.send(
        `window.MB_ENV=${JSON.stringify(process.env.NODE_ENV || "development")};` +
            `window.MB_IS_DEV=${JSON.stringify(isDev)};`
    );
});

// Enable compression for all responses
app.use(
    compression({
        level: 9,
        threshold: 0
    })
);

// Environment-aware static file serving
app.use(
    express.static(path.join(__dirname), {
        // Disable caching in development, enable in production
        maxAge: isDev ? 0 : "1h",
        etag: isDev ? false : true,
        lastModified: isDev ? false : true,

        // Set explicit no-cache headers in development
        setHeaders: (res, filePath) => {
            if (isDev) {
                res.setHeader(
                    "Cache-Control",
                    "no-store, no-cache, must-revalidate, proxy-revalidate"
                );
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", "0");
                res.setHeader("Surrogate-Control", "no-store");
            }
        }
    })
);

// Use port 3001 to avoid common conflicts (e.g., with EonVPN on 3000)
const startPort = parseInt(process.env.PORT, 10) || 3000;

function startServer(port) {
    const server = app.listen(port, "0.0.0.0", () => {
        console.log(`Music Blocks is running at http://localhost:${port}`);
        console.log("Compression enabled");
    });

    server.on("error", err => {
        if (err.code === "EADDRINUSE") {
            console.log(`Port ${port} is in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error("Server error:", err);
        }
    });
}

startServer(startPort);

// Force the process to stay alive
process.stdin.resume();
