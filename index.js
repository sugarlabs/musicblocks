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

/**
 * Security middleware: deny access to server-side / config / build files.
 * Only public-facing assets (HTML, CSS, JS, media, locales, etc.) should
 * be reachable through the static server.
 */
const BLOCKED_PATTERNS = [
    // Node / npm
    /^\/package(-lock)?\.json$/i,
    /^\/node_modules\//i,
    // Server source
    /^\/index\.js$/i,
    /^\/electron-main\.js$/i,
    /^\/gulpfile\.(js|mjs)$/i,
    /^\/script\.js$/i,
    // Docker / CI infrastructure
    /^\/dockerfile$/i,
    /^\/\.github\//i,
    /^\/\.git\//i,
    // Tool / build config
    /^\/jest\.config\.js$/i,
    /^\/cypress\.config\.js$/i,
    /^\/eslint\.config\.mjs$/i,
    /^\/lighthouserc\.js$/i,
    /^\/\.prettierrc$/i,
    /^\/\.prettierignore$/i,
    /^\/\.editorconfig$/i,
    /^\/\.nvmrc$/i,
    // npm / git internals
    /^\/\.npmrc$/i,
    /^\/\.gitignore$/i,
    /^\/\.gitattributes$/i,
    /^\/\.gitmodules$/i,
    // Python / setup scripts
    /^\/setup\.py$/i,
    /^\/convert_po_to_json\.py$/i,
    /^\/scripts\//i,
    // Test directories
    /^\/cypress\//i,
    // Docs / screenshots (not needed at runtime)
    /^\/Docs\//i,
    /^\/screenshots\//i,
    // Misc root-level markdown / logs
    /\.(md|txt|log)$/i
];

app.use((req, res, next) => {
    const url = req.path;
    const isBlocked = BLOCKED_PATTERNS.some(pattern => pattern.test(url));
    if (isBlocked) {
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
    console.log("Sensitive files are blocked from public access");
});
