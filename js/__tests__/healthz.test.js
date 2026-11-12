/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Sugar Labs
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
 *
 * @jest-environment node
 */

const http = require("http");
const path = require("path");

const app = require(path.resolve(__dirname, "../../index.js"));
const pkg = require(path.resolve(__dirname, "../../package.json"));

const request = (port, urlPath) =>
    new Promise((resolve, reject) => {
        const req = http.get({ host: "127.0.0.1", port, path: urlPath, agent: false }, res => {
            let body = "";
            res.on("data", chunk => (body += chunk));
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on("error", reject);
    });

describe("/healthz", () => {
    let server;
    let port;

    beforeAll(done => {
        // Port 0 = OS-assigned free port. Loopback only.
        server = app.listen(0, "127.0.0.1", () => {
            port = server.address().port;
            done();
        });
    });

    afterAll(done => {
        server.close(done);
    });

    it("returns HTTP 200 with a JSON body", async () => {
        const res = await request(port, "/healthz");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("reports status ok and the current package version", async () => {
        const res = await request(port, "/healthz");
        const body = JSON.parse(res.body);
        expect(body.status).toBe("ok");
        expect(body.version).toBe(pkg.version);
    });

    it("reports the current NODE_ENV (defaulting to development)", async () => {
        const res = await request(port, "/healthz");
        const body = JSON.parse(res.body);
        expect(body.env).toBe(process.env.NODE_ENV || "development");
    });

    it("reports a numeric process uptime", async () => {
        const res = await request(port, "/healthz");
        const body = JSON.parse(res.body);
        expect(typeof body.uptime).toBe("number");
        expect(body.uptime).toBeGreaterThanOrEqual(0);
    });

    it("sets Cache-Control: no-store so probes never see a stale response", async () => {
        const res = await request(port, "/healthz");
        expect(res.headers["cache-control"]).toBe("no-store");
    });
});

describe("Security: Block access to sensitive project files", () => {
    let server;
    let port;
    beforeAll(done => {
        server = app.listen(0, "127.0.0.1", () => {
            port = server.address().port;
            done();
        });
    });
    afterAll(done => {
        server.close(done);
    });

    it("serves allowed root files (index.html, favicon.ico, android_chrome_manifest.json)", async () => {
        const res1 = await request(port, "/index.html");
        expect(res1.status).toBe(200);

        const res2 = await request(port, "/");
        expect(res2.status).toBe(200);

        const res3 = await request(port, "/android_chrome_manifest.json");
        expect(res3.status).toBe(200);
    });

    it("serves allowed public subdirectories (/css/style.css)", async () => {
        const res = await request(port, "/css/style.css");
        expect(res.status).toBe(200);
    });

    it("blocks access to sensitive configuration files (package.json, index.js, dockerfile)", async () => {
        const res1 = await request(port, "/package.json");
        expect(res1.status).toBe(403);

        const res2 = await request(port, "/index.js");
        expect(res2.status).toBe(403);

        const res3 = await request(port, "/dockerfile");
        expect(res3.status).toBe(403);
    });

    it("blocks access to unlisted root files (.gitattributes, README.md, stryker.config.js)", async () => {
        const res1 = await request(port, "/.gitattributes");
        expect(res1.status).toBe(403);

        const res2 = await request(port, "/README.md");
        expect(res2.status).toBe(403);

        const res3 = await request(port, "/stryker.config.js");
        expect(res3.status).toBe(403);
    });

    it("blocks access to private directories (.github, scripts, cypress, node_modules)", async () => {
        const res1 = await request(port, "/.github/workflows/ci.yml");
        expect(res1.status).toBe(403);

        const res2 = await request(port, "/scripts/generate-tests/cli.js");
        expect(res2.status).toBe(403);
    });

    it("blocks encoded path traversal attempting to escape allowed directories", async () => {
        const res = await request(port, "/js/%2e%2e/package.json");
        expect(res.status).toBe(403);
    });

    it("rejects malformed percent-encoding with 400", async () => {
        const res = await request(port, "/%ZZ");
        expect(res.status).toBe(400);
    });
});
