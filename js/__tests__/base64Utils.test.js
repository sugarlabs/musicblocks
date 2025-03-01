const base64Utils = require('../base64Utils');
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;   

describe('base64Utils', () => {
    test('base64Encode should correctly encode a string to Base64', () => {
        expect(base64Utils.base64Encode('hello')).toBe('aGVsbG8=');
        expect(base64Utils.base64Encode('Base64 Encoding!')).toBe('QmFzZTY0IEVuY29kaW5nIQ==');
        expect(base64Utils.base64Encode('123456')).toBe('MTIzNDU2');
    });

    test('base64Decode should correctly decode a Base64 string', () => {
        expect(base64Utils.base64Decode('aGVsbG8=')).toBe('hello');
        expect(base64Utils.base64Decode('QmFzZTY0IEVuY29kaW5nIQ==')).toBe('Base64 Encoding!');
        expect(base64Utils.base64Decode('MTIzNDU2')).toBe('123456');
    });

    test('base64Encode and base64Decode should be reversible', () => {
        const originalText = 'Reversible Test!';
        const encoded = base64Utils.base64Encode(originalText);
        const decoded = base64Utils.base64Decode(encoded);
        expect(decoded).toBe(originalText);
    });

    test('base64Encode should handle empty strings', () => {
        expect(base64Utils.base64Encode('')).toBe('');
    });

    test('base64Decode should handle empty strings', () => {
        expect(base64Utils.base64Decode('')).toBe('');
    });
});
