const { MidiManager, MidiUtils } = require("../midiutils");

describe("MidiUtils and MidiManager", () => {
    let origRequestMIDIAccess;

    beforeEach(() => {
        origRequestMIDIAccess = navigator.requestMIDIAccess;
        MidiManager.reset();
    });

    afterEach(() => {
        if (origRequestMIDIAccess !== undefined) {
            navigator.requestMIDIAccess = origRequestMIDIAccess;
        } else {
            delete navigator.requestMIDIAccess;
        }
        MidiManager.reset();
    });

    test("exports MidiManager on MidiUtils", () => {
        expect(MidiUtils).toBeDefined();
        expect(MidiUtils.MidiManager).toBe(MidiManager);
    });

    describe("isSupported", () => {
        test("returns true when navigator.requestMIDIAccess is a function", () => {
            navigator.requestMIDIAccess = jest.fn();
            expect(MidiManager.isSupported()).toBe(true);
        });

        test("returns false when requestMIDIAccess is missing", () => {
            delete navigator.requestMIDIAccess;
            expect(MidiManager.isSupported()).toBe(false);
        });
    });

    describe("requestAccess", () => {
        test("rejects when WebMIDI is not supported", async () => {
            delete navigator.requestMIDIAccess;
            await expect(MidiManager.requestAccess()).rejects.toThrow(
                "WebMIDI is not supported in this environment."
            );
        });

        test("initializes access and binds message handlers on inputs", async () => {
            const mockInput1 = { onmidimessage: null };
            const mockInput2 = { onmidimessage: null };
            const mockAccess = {
                inputs: new Map([
                    ["input-1", mockInput1],
                    ["input-2", mockInput2]
                ]),
                onstatechange: null
            };

            navigator.requestMIDIAccess = jest.fn().mockResolvedValue(mockAccess);

            const access = await MidiManager.requestAccess();
            expect(access).toBe(mockAccess);
            expect(MidiManager.midiAccess).toBe(mockAccess);

            expect(typeof mockInput1.onmidimessage).toBe("function");
            expect(typeof mockInput2.onmidimessage).toBe("function");
            expect(typeof mockAccess.onstatechange).toBe("function");
        });

        test("re-binds inputs when onstatechange fires", async () => {
            const mockInput1 = { onmidimessage: null };
            const inputsMap = new Map([["input-1", mockInput1]]);
            const mockAccess = {
                inputs: inputsMap,
                onstatechange: null
            };

            navigator.requestMIDIAccess = jest.fn().mockResolvedValue(mockAccess);

            await MidiManager.requestAccess();

            // Simulate plugging in a second device
            const mockInput2 = { onmidimessage: null };
            inputsMap.set("input-2", mockInput2);

            mockAccess.onstatechange();
            expect(typeof mockInput2.onmidimessage).toBe("function");
        });
    });

    describe("listener subscription and dispatch", () => {
        test("dispatches messages to registered listeners", async () => {
            const mockInput = { onmidimessage: null };
            const mockAccess = {
                inputs: [mockInput]
            };

            navigator.requestMIDIAccess = jest.fn().mockResolvedValue(mockAccess);

            await MidiManager.requestAccess();

            const listener1 = jest.fn();
            const listener2 = jest.fn();

            MidiManager.addListener(listener1);
            MidiManager.addListener(listener2);

            const testEvent = { data: [144, 60, 100] };
            mockInput.onmidimessage(testEvent);

            expect(listener1).toHaveBeenCalledWith(testEvent);
            expect(listener2).toHaveBeenCalledWith(testEvent);

            // Removing listener1
            MidiManager.removeListener(listener1);
            const secondEvent = { data: [128, 60, 0] };
            mockInput.onmidimessage(secondEvent);

            expect(listener1).not.toHaveBeenCalledWith(secondEvent);
            expect(listener2).toHaveBeenCalledWith(secondEvent);
        });

        test("error inside one listener does not crash message dispatch to others", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const failingListener = jest.fn(() => {
                throw new Error("Simulated listener failure");
            });
            const workingListener = jest.fn();

            MidiManager.addListener(failingListener);
            MidiManager.addListener(workingListener);

            const testEvent = { data: [144, 60, 100] };
            expect(() => MidiManager.dispatchMessage(testEvent)).not.toThrow();

            expect(failingListener).toHaveBeenCalledWith(testEvent);
            expect(workingListener).toHaveBeenCalledWith(testEvent);
            consoleSpy.mockRestore();
        });

        test("clearListeners removes all active subscriptions", () => {
            const listener = jest.fn();
            MidiManager.addListener(listener);
            MidiManager.clearListeners();

            MidiManager.dispatchMessage({ data: [144, 60, 100] });
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("hasDevices", () => {
        test("returns false when midiAccess is null or empty", () => {
            expect(MidiManager.hasDevices()).toBe(false);

            MidiManager.midiAccess = { inputs: new Map() };
            expect(MidiManager.hasDevices()).toBe(false);

            MidiManager.midiAccess = { inputs: [] };
            expect(MidiManager.hasDevices()).toBe(false);
        });

        test("returns true when devices are present", () => {
            MidiManager.midiAccess = { inputs: new Map([["1", {}]]) };
            expect(MidiManager.hasDevices()).toBe(true);

            MidiManager.midiAccess = { inputs: [{}] };
            expect(MidiManager.hasDevices()).toBe(true);
        });
    });

    describe("reset", () => {
        test("clears input onmidimessage handlers, nullifies midiAccess, and clears listeners", () => {
            const mockInput = { onmidimessage: jest.fn() };
            MidiManager.midiAccess = { inputs: [mockInput] };
            const listener = jest.fn();
            MidiManager.addListener(listener);

            MidiManager.reset();

            expect(mockInput.onmidimessage).toBeNull();
            expect(MidiManager.midiAccess).toBeNull();
            expect(MidiManager.listeners.size).toBe(0);
        });
    });
});
