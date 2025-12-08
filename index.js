const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

// Enable compression for all responses
app.use(compression({
    level: 9,
    threshold: 0
}));

// Default static caching
app.use(express.static(path.join(__dirname), {
    maxAge: "1h"
}));

// Longer cache for static assets
app.use("/dist", express.static(path.join(__dirname, "dist"), {
    maxAge: "30d",
    immutable: true
}));
app.use("/fonts", express.static(path.join(__dirname, "fonts"), {
    maxAge: "30d",
    immutable: true
}));
app.use("/lib", express.static(path.join(__dirname, "lib"), {
    maxAge: "7d"
}));
app.use("/images", express.static(path.join(__dirname, "images"), {
    maxAge: "7d"
}));

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
