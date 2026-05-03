/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 AdityaM-IITH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
const Converter = require("../Converter");

describe("Converter", () => {
    let converter;
    let mockPlanet;
    let mockCallback;

    beforeEach(() => {
        mockPlanet = {
            ConnectedToServer: true,
            ServerInterface: {
                convertFile: jest.fn()
            }
        };
        converter = new Converter(mockPlanet);
        mockCallback = jest.fn();

        // Mock window methods that might not be in the basic jsdom depending on setup
        if (typeof window.btoa === "undefined") {
            window.btoa = str => Buffer.from(str, "binary").toString("base64");
            window.atob = str => Buffer.from(str, "base64").toString("binary");
        }
    });

    describe("constructor", () => {
        it("should store Planet and ServerInterface references", () => {
            expect(converter.Planet).toBe(mockPlanet);
            expect(converter.ServerInterface).toBe(mockPlanet.ServerInterface);
        });
    });

    describe("isConnected", () => {
        it("should return true when Planet.ConnectedToServer is true", () => {
            expect(converter.isConnected()).toBe(true);
        });

        it("should return false when Planet.ConnectedToServer is false", () => {
            converter.Planet.ConnectedToServer = false;
            expect(converter.isConnected()).toBe(false);
        });
    });

    describe("getDataURL", () => {
        it("should return a correctly formatted data URL string", () => {
            const result = converter.getDataURL("application/pdf", "abc123");
            expect(result).toBe("data:application/pdf;base64,abc123");
        });

        it("should work with any mime type", () => {
            expect(converter.getDataURL("image/png", "xyz")).toBe("data:image/png;base64,xyz");
        });
    });

    describe("getBlob", () => {
        it("should return a Blob of the correct type", () => {
            const base64Data = window.btoa("hello world"); // aGVsbG8gd29ybGQ=
            const blob = converter.getBlob("text/plain", base64Data);
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/plain");
        });

        it("should create a Blob with correct byte length", () => {
            const text = "hi";
            const base64Data = window.btoa(text);
            const blob = converter.getBlob("text/plain", base64Data);
            expect(blob.size).toBe(text.length);
        });
    });

    describe("afterly2pdf", () => {
        it("should call callback with false and error if not successful", () => {
            converter.afterly2pdf({ success: false, error: "timeout" }, mockCallback);
            expect(mockCallback).toHaveBeenCalledWith(false, "timeout");
        });

        it("should call callback with true and dataUrl if successful", () => {
            converter.afterly2pdf(
                {
                    success: true,
                    data: {
                        contenttype: "application/pdf",
                        blob: "pdfData123"
                    }
                },
                mockCallback
            );
            expect(mockCallback).toHaveBeenCalledWith(
                true,
                "data:application/pdf;base64,pdfData123"
            );
        });
    });

    describe("ly2pdf", () => {
        it("should correctly call ServerInterface.convertFile", () => {
            const data = "test data";

            converter.ly2pdf(data, mockCallback);

            expect(converter.ServerInterface.convertFile).toHaveBeenCalled();
            const callArgs = converter.ServerInterface.convertFile.mock.calls[0];

            expect(callArgs[0]).toBe("ly");
            expect(callArgs[1]).toBe("pdf");
            expect(callArgs[2]).toBe(window.btoa(encodeURIComponent(data)));
        });

        it("should pass a bound callback that delegates to afterly2pdf", () => {
            converter.ly2pdf("test", mockCallback);

            // Retrieve the bound callback that was passed to convertFile
            const boundCallback = mockPlanet.ServerInterface.convertFile.mock.calls[0][3];

            // Call it with a success payload and verify the final callback is invoked
            const payload = {
                success: true,
                data: { contenttype: "application/pdf", blob: "data123" }
            };
            boundCallback(payload);

            expect(mockCallback).toHaveBeenCalledWith(true, "data:application/pdf;base64,data123");
        });

        it("should pass a bound callback that handles errors correctly", () => {
            converter.ly2pdf("test", mockCallback);

            const boundCallback = mockPlanet.ServerInterface.convertFile.mock.calls[0][3];
            boundCallback({ success: false, error: "timeout" });

            expect(mockCallback).toHaveBeenCalledWith(false, "timeout");
        });
    });

    describe("init", () => {
        it("should run without throwing", () => {
            expect(() => converter.init()).not.toThrow();
        });
    });
});
