const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

// Enable compression for all responses
app.use(compression({
    level: 9,
    threshold: 0
}));

app.use(express.static(path.join(__dirname), {
    maxAge: "1h"
}));

const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
    console.log("Compression enabled");
});
