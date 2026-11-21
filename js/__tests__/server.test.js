/**
 * @jest-environment node
 */

const http = require("http");
const app = require("../../index");

describe("Express server static file access control (SEC-04)", () => {
    let server;
    let baseUrl;
    let serverPort;

    const sendRawRequest = rawPath =>
        new Promise((resolve, reject) => {
            const req = http.request(
                {
                    hostname: "127.0.0.1",
                    port: serverPort,
                    path: rawPath,
                    method: "GET"
                },
                res => {
                    res.resume();
                    resolve(res.statusCode);
                }
            );
            req.on("error", reject);
            req.end();
        });

    beforeAll(done => {
        server = http.createServer(app);
        server.listen(0, "127.0.0.1", () => {
            serverPort = server.address().port;
            baseUrl = `http://127.0.0.1:${serverPort}`;
            done();
        });
    });

    afterAll(done => {
        server.close(done);
    });

    describe("Allowed public routes and assets", () => {
        test("serves root path / with 200 OK", async () => {
            const res = await fetch(`${baseUrl}/`);
            expect(res.status).toBe(200);
        });

        test("serves /index.html with 200 OK", async () => {
            const res = await fetch(`${baseUrl}/index.html`);
            expect(res.status).toBe(200);
        });

        test("serves allowlisted root files like /favicon.ico", async () => {
            const res = await fetch(`${baseUrl}/favicon.ico`);
            expect(res.status).toBe(200);
        });

        test("serves allowlisted root file /manifest.json", async () => {
            const res = await fetch(`${baseUrl}/manifest.json`);
            expect(res.status).toBe(200);
        });

        test("serves assets inside allowed top-level directory /js", async () => {
            const res = await fetch(`${baseUrl}/js/gitDropdown.js`);
            expect(res.status).toBe(200);
        });

        test("serves assets inside allowed top-level directory /css", async () => {
            const res = await fetch(`${baseUrl}/css/darkmode.css`);
            expect(res.status).toBe(200);
        });

        test("dynamic route /env.js returns 200 with javascript content-type", async () => {
            const res = await fetch(`${baseUrl}/env.js`);
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toContain("application/javascript");
        });

        test("dynamic route /healthz returns 200 with JSON status", async () => {
            const res = await fetch(`${baseUrl}/healthz`);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.status).toBe("ok");
        });
    });

    describe("Disallowed root files and configurations", () => {
        test.each([
            "/package.json",
            "/package-lock.json",
            "/index.js",
            "/stryker.config.js",
            "/README.md",
            "/CONTRIBUTING.md",
            "/commitlint.config.js",
            "/jest.config.js",
            "/setup.py",
            "/.gitattributes",
            "/.editorconfig"
        ])("blocks unlisted root file %s with 403 Forbidden", async filePath => {
            const res = await fetch(`${baseUrl}${filePath}`);
            expect(res.status).toBe(403);
        });
    });

    describe("Disallowed internal directories", () => {
        test.each([
            "/node_modules/express/package.json",
            "/.github/workflows/main.yml",
            "/cypress/cypress.config.js",
            "/scripts/convert_po_to_json.py"
        ])("blocks private directory %s with 403 Forbidden", async dirPath => {
            const res = await fetch(`${baseUrl}${dirPath}`);
            expect(res.status).toBe(403);
        });
    });

    describe("Encoded directory traversal protection", () => {
        test("blocks encoded traversal to package.json (/js/%2e%2e/package.json) with 403", async () => {
            const status = await sendRawRequest("/js/%2e%2e/package.json");
            expect(status).toBe(403);
        });

        test("blocks encoded traversal to index.js (/css/%2e%2e/index.js) with 403", async () => {
            const status = await sendRawRequest("/css/%2e%2e/index.js");
            expect(status).toBe(403);
        });

        test("blocks root escape attempts with 403", async () => {
            const status = await sendRawRequest("/%2e%2e/%2e%2e/etc/passwd");
            expect(status).toBe(403);
        });

        test("blocks encoded backslash traversal attempt (%5c) with 403", async () => {
            const status = await sendRawRequest("/js%5c%2e%2e%5cpackage.json");
            expect(status).toBe(403);
        });

        test("blocks literal backslash in request path with 403", async () => {
            const status = await sendRawRequest("/js\\..\\package.json");
            expect(status).toBe(403);
        });

        test("rejects malformed percent-encoding with 400 Bad Request", async () => {
            const status = await sendRawRequest("/%FF%FE");
            expect(status).toBe(400);
        });

        test("rejects null byte in path with 400 Bad Request", async () => {
            const status = await sendRawRequest("/js/%00/test.js");
            expect(status).toBe(400);
        });
    });
});
