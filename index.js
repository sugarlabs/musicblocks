const express = require("express");
const compression = require("compression");
const path = require("path");

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

// --- Security: Block access to sensitive project files ---
// express.static(__dirname) serves the entire project root, which exposes
// server config, dependency info, and build files. This middleware intercepts
// requests for known-sensitive files and returns 403 before they reach
// the static file handler.
const SENSITIVE_PATTERNS = [
    /^\/package\.json$/i,
    /^\/package-lock\.json$/i,
    /^\/index\.js$/i,
    /^\/dockerfile$/i,
    /^\/jest\.config\.js$/i,
    /^\/eslint\.config\.mjs$/i,
    /^\/cypress\.config\.js$/i,
    /^\/gulpfile\.(js|mjs)$/i,
    /^\/setup\.py$/i,
    /^\/convert_po_to_json\.py$/i,
    /^\/\.github\//i,
    /^\/node_modules\//i,
    /^\/cypress\//i,
    /^\/scripts\//i,
];

app.use((req, res, next) => {
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(req.path))) {
        return res.status(403).send("Forbidden");
    }
    next();
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
