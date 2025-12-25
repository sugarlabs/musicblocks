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

// Helper regex for hashed filenames like app.9a8b7c65.js or styles-abcdef0123.css
const HASHED_NAME_REGEX = /[\.-][0-9a-fA-F]{8,}[\.-]?/;

// Long-term cache for versioned static assets in specific folders
app.use(
    "/lib",
    express.static(path.join(__dirname, "lib"), {
        maxAge: "1y",
        immutable: true
    })
);

app.use(
    "/css",
    express.static(path.join(__dirname, "css"), {
        maxAge: "1y",
        immutable: true
    })
);

app.use(
    "/fonts",
    express.static(path.join(__dirname, "fonts"), {
        maxAge: "1y",
        immutable: true
    })
);

// Ensure the service worker is never cached too long so updates are picked up
app.get(["/sw.js", "/service-worker.js"], (req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    next();
});

// Default static serving for everything else with sensible per-file controls
app.use(
    express.static(path.join(__dirname), {
        maxAge: "1h", // fallback for non-HTML, non-versioned assets
        setHeaders: (res, filePath) => {
            const ext = path.extname(filePath).toLowerCase();

            // HTML should not be cached by the browser
            if (ext === ".html") {
                res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
                return;
            }

            // JS/CSS with hashed filenames can be cached for a year and marked immutable
            if (
                (ext === ".js" || ext === ".css") &&
                HASHED_NAME_REGEX.test(path.basename(filePath))
            ) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                return;
            }
        }
    })
);

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
