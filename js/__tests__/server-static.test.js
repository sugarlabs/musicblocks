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

const request = (port, urlPath) =>
    new Promise((resolve, reject) => {
        const req = http.get({ host: "127.0.0.1", port, path: urlPath, agent: false }, res => {
            let body = "";
            res.on("data", chunk => (body += chunk));
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on("error", reject);
    });

describe("static file access", () => {
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

    it.each(["/nodemon.json", "/NODEMON.JSON", "/nodemon.json?cache=1"])(
        "blocks requests for %s",
        async urlPath => {
            const res = await request(port, urlPath);
            expect(res.status).toBe(403);
            expect(res.body).toBe("Forbidden");
        }
    );

    it("continues to serve the application HTML", async () => {
        const res = await request(port, "/index.html");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
    });
});
