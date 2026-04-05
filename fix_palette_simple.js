const fs = require('fs');
const filePath = 'c:\\Users\\Shashank V\\Music\\musicblocks-master\\js\\__tests__\\palette.test.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic line
const fixedContent = content.replace(
    /img\.onmouseup\(\{\\}\\)\\)\\);/g,
    'img.onmouseup({}));'
);

// Write back the fixed content
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('Fixed palette test file');
