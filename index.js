const express = require("express");
const compression = require("compression");
const path = require("path");
const pkg = require("./package.json");

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
            `window.MB_IS_DEV=${JSON.stringify(isDev)};` +
            `window.MB_PLANET_API_KEY = ${JSON.stringify(process.env.MB_PLANET_API_KEY || "3f2d3a4c-c7a4-4c3c-892e-ac43784f7381")};` +
            `window.MB_PROJECT_API_KEY = ${JSON.stringify(process.env.MB_PROJECT_API_KEY || "3tgTzMXbbw6xEKX7")};` +
            `window.MB_GIT_BACKEND_URL = ${JSON.stringify(process.env.MB_GIT_BACKEND_URL || "https://git-planet.sugarlabs.org")};`
    );
});

app.get("/healthz", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
        status: "ok",
        version: pkg.version,
        env: process.env.NODE_ENV || "development",
        uptime: process.uptime()
    });
});

// Enable compression for all responses
app.use(
    compression({
        level: 9,
        threshold: 0
    })
);

// --- Security: Block access to sensitive project files ---
// Rather than serving the entire project directory with an incomplete blacklist,
// we enforce a strict allowlist. Only designated public directories and root files
// needed by the client are accessible; unlisted root files and private directories
// (.github, scripts, cypress, node_modules) are blocked by default.
// Allowed directories are served without internal test-file or backup filtering.
const ALLOWED_DIRECTORIES = new Set([
    "activity",
    "bower_components",
    "css",
    "dist",
    "Docs",
    "examples",
    "fonts",
    "header-icons",
    "images",
    "js",
    "lessonPlan",
    "lib",
    "lilypond",
    "locales",
    "mouse-art",
    "planet",
    "plugins",
    "screenshots",
    "sounds",
    "staff",
    "TurtleDocs",
    "usermanual",
    "videos"
]);

const ALLOWED_ROOT_FILES = new Set([
    "index.html",
    "favicon.ico",
    "sw.js",
    "manifest.json",
    "manifest.webapp",
    "android_chrome_manifest.json",
    "loading-animation.mp4",
    "loading-animation.webm",
    "loading-animation-ja.png",
    "Minsky.jpg",
    "script.js"
]);

app.use((req, res, next) => {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(req.path);
    } catch (err) {
        return res.status(400).send("Bad Request");
    }

    // Normalise path and remove leading/trailing separators
    const cleanPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
    const segments = cleanPath.split(/[/\\]/).filter(Boolean);

    // Root ("/") serves index.html by default
    if (segments.length === 0) {
        return next();
    }

    const firstSegment = segments[0];

    // Allow request to permitted public asset directories
    if (ALLOWED_DIRECTORIES.has(firstSegment)) {
        return next();
    }

    // Allow single root file explicitly designated as public
    if (segments.length === 1 && ALLOWED_ROOT_FILES.has(firstSegment)) {
        return next();
    }

    // Everything else is blocked
    return res.status(403).send("Forbidden");
});

// Environment-aware static file serving
app.use(
    express.static(path.join(__dirname), {
        // Disable caching in development, enable in production
        maxAge: isDev ? 0 : "1h",
        etag: isDev ? false : true,
        lastModified: isDev ? false : true,

        // Block all dotfiles (.git, .npmrc, .editorconfig, etc.)
        // Express defaults to "ignore" which is unsafe.
        dotfiles: "deny",

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

const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || 3000;
let server;
let shuttingDown = false;

function listen() {
    server = app.listen(PORT, HOST, () => {
        console.log(`Music Blocks running at http://${HOST}:${PORT}/`);
        console.log("Compression enabled");
    });
}

function shutdown(exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    if (server) {
        console.log("Shutting down server...");
        if (typeof server.closeIdleConnections === "function") {
            server.closeIdleConnections();
        }
        server.close(() => {
            console.log("Server closed");
            process.exit(exitCode);
        });
        setTimeout(() => {
            console.error("Forcing shutdown after timeout");
            process.exit(exitCode);
        }, 10000).unref();
    } else {
        process.exit(exitCode);
    }
}

if (require.main === module) {
    listen();

    process.on("SIGTERM", () => shutdown(0));
    process.on("SIGINT", () => shutdown(0));
}

module.exports = app;
