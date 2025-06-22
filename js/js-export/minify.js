const fs = require("fs");

const jsonContent = fs.readFileSync("ast2blocks.json", "utf8");

const minified = JSON.stringify(JSON.parse(jsonContent));

fs.writeFileSync("ast2blocks.min.json", minified);
