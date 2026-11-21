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

// --- Security: Enforce strict allowlist for static file serving ---
// Serving the repository root via express.static can expose server config,
// build scripts, internal testing directories, and tooling configurations.
// To prevent information disclosure and encoded path traversal bypasses,
// validate, decode, and normalize the request path against an explicit allowlist.
const ALLOWED_ROOT_FILES = new Set([
    "",
    "index.html",
    "favicon.ico",
    "manifest.json",
    "manifest.webapp",
    "android_chrome_manifest.json",
    "config.xml",
    "sw.js",
    "Minsky.jpg",
    "loading-animation.mp4",
    "loading-animation.webm",
    "loading-animation-ja.png"
]);

const ALLOWED_TOP_LEVEL_DIRS = new Set([
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
    "po",
    "screenshots",
    "sounds",
    "staff",
    "TurtleDocs",
    "usermanual",
    "videos",
    ".well-known"
]);

app.use((req, res, next) => {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(req.path);
    } catch {
        return res.status(400).send("Bad Request");
    }

    if (decodedPath.includes("\0")) {
        return res.status(400).send("Bad Request");
    }

    const normalizedPath = path.posix.normalize(decodedPath);
    if (normalizedPath.startsWith("../") || normalizedPath === "..") {
        return res.status(403).send("Forbidden");
    }

    const relativePath = normalizedPath.replace(/^\/+/, "");
    const segments = relativePath.split("/");
    const topSegment = segments[0];

    if (segments.length === 1 && ALLOWED_ROOT_FILES.has(topSegment)) {
        return next();
    }

    if (ALLOWED_TOP_LEVEL_DIRS.has(topSegment)) {
        return next();
    }

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
