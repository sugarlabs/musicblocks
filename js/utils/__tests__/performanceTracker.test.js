describe("performanceTracker basic tests", () => {
    let tracker;

    beforeEach(() => {
        tracker = {
            enabled: false,
            enable() {
                this.enabled = true;
            },
            disable() {
                this.enabled = false;
            },
            isEnabled() {
                return this.enabled;
            }
        };
    });

    test("should be disabled by default", () => {
        expect(tracker.isEnabled()).toBe(false);
    });

    test("should enable tracker", () => {
        tracker.enable();
        expect(tracker.isEnabled()).toBe(true);
    });

    test("should disable tracker", () => {
        tracker.enable();
        tracker.disable();
        expect(tracker.isEnabled()).toBe(false);
    });
});
