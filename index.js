const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

// Detect environment (default to development for safety)
const isDev = process.env.NODE_ENV !== "production";

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
