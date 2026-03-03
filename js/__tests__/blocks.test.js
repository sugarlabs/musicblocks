const {
    ALLOWED_CONNECTIONS,
    MINIMUMDOCKDISTANCE,
    LONGSTACK,
    NOTEBLOCKS,
    PITCHBLOCKS
} = require('../blocks');

describe('Blocks constants and connection rules', () => {

    test('MINIMUMDOCKDISTANCE is 400', () => {
        expect(MINIMUMDOCKDISTANCE).toBe(400);
    });

    test('LONGSTACK is 300', () => {
        expect(LONGSTACK).toBe(300);
    });

    test('ALLOWED_CONNECTIONS contains in:out', () => {
        expect(ALLOWED_CONNECTIONS.has('in:out')).toBe(true);
        expect(ALLOWED_CONNECTIONS.has('out:in')).toBe(true);
    });

    test('ALLOWED_CONNECTIONS rejects invalid pair', () => {
        expect(ALLOWED_CONNECTIONS.has('invalid:pair')).toBe(false);
    });

    test('NOTEBLOCKS contains newnote', () => {
        expect(NOTEBLOCKS).toContain('newnote');
    });

    test('PITCHBLOCKS contains pitch', () => {
        expect(PITCHBLOCKS).toContain('pitch');
    });

});