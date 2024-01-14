// base64Utils.js

function base64Encode(str) {
    let encoder = new TextEncoder();
    let uint8Array = encoder.encode(str);
    let binaryString = String.fromCharCode(...uint8Array);
    return (binaryString);
}

function base64Decode(str) {
    let binaryString = window.atob(str);
    let uint8Array = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
    let decoder = new TextDecoder();
    return decoder.decode(uint8Array);
}

module.exports = { base64Encode, base64Decode };
