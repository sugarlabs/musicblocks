// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

const ProjectStorage = require("../ProjectStorage");

describe("ProjectStorage storage-limit handling", () => {
    let storage;
    let warnSpy;
    let errorSpy;

    beforeEach(() => {
        global._ = msg => msg;
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        storage = new ProjectStorage({});
        storage.data = {
            CurrentProject: "1",
            Projects: {
                "1": { ProjectImage: "image-a" },
                "2": { ProjectImage: "image-b" }
            }
        };
    });

    afterEach(() => {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        jest.restoreAllMocks();
    });

    test("_isQuotaExceededError detects common quota error signatures", () => {
        expect(storage._isQuotaExceededError({ name: "QuotaExceededError" })).toBe(true);
        expect(storage._isQuotaExceededError({ code: 22 })).toBe(true);
        expect(storage._isQuotaExceededError({ message: "Storage quota reached" })).toBe(true);
        expect(storage._isQuotaExceededError(new Error("network failed"))).toBe(false);
    });

    test("save drops cached images and retries when quota is exceeded", async () => {
        const mockSet = jest
            .spyOn(storage, "set")
            .mockRejectedValueOnce({ name: "QuotaExceededError", message: "quota full" })
            .mockResolvedValueOnce();

        const result = await storage.save();

        expect(result).toBe(true);
        expect(mockSet).toHaveBeenCalledTimes(2);
        expect(storage.data.Projects["1"].ProjectImage).toBeNull();
        expect(storage.data.Projects["2"].ProjectImage).toBeNull();
        expect(console.warn).toHaveBeenCalled();
    });

    test("save returns false for quota errors when nothing can be dropped", async () => {
        storage.data.Projects["1"].ProjectImage = null;
        storage.data.Projects["2"].ProjectImage = null;

        const mockSet = jest
            .spyOn(storage, "set")
            .mockRejectedValue({ name: "QuotaExceededError", message: "quota full" });

        const result = await storage.save();

        expect(result).toBe(false);
        expect(mockSet).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalled();
    });

    test("save returns false and keeps images for non-quota failures", async () => {
        const mockSet = jest.spyOn(storage, "set").mockRejectedValue(new Error("disk failure"));

        const result = await storage.save();

        expect(result).toBe(false);
        expect(mockSet).toHaveBeenCalledTimes(1);
        expect(storage.data.Projects["1"].ProjectImage).toBe("image-a");
        expect(storage.data.Projects["2"].ProjectImage).toBe("image-b");
        expect(console.error).toHaveBeenCalled();
    });
});
