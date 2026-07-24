/**
 * @fileoverview This script reads the ast2blocks.json file, parses it, and minifies it to ast2blocks.min.json for deployment.
 */
const fs = require("fs");

const jsonContent = fs.readFileSync("ast2blocks.json", "utf8");

const minified = JSON.stringify(JSON.parse(jsonContent));

fs.writeFileSync("ast2blocks.min.json", minified);
