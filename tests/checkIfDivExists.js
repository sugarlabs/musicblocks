describe('getDiv', function() {
    var d = document.querySelector('.box');

    it('Should exist', function() {
        expect(d.nodeName).toBe('DIV');
    });
});