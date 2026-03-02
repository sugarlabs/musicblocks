const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

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

app.use(
    express.static(path.join(__dirname), {
        maxAge: "1h"
    })
);

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
    console.log("Sensitive files are blocked from public access");
});
