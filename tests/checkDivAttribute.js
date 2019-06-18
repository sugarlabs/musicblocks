describe('getDivAttribute', function() {
    var d = document.querySelector('.box');

    it('Should be bar', function() {
        expect(d.getAttribute('foo')).toBe('bar');
    });
});