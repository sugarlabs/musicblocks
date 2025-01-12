describe('Platform Style Tests', () => {
    beforeEach(() => {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    });

    afterEach(() => {
        document.head.innerHTML = '';
    });

    test('should set the meta theme-color content based on platformColor', () => {
        const platformColor = { header: '#ff0000' };
        document.querySelector("meta[name=theme-color]").content = platformColor.header;
      
        const meta = document.querySelector("meta[name=theme-color]");
        expect(meta.content).toBe('#ff0000');
    });
});
