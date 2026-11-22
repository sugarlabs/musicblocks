/**
 * MusicBlocks v3.8.0
 *
 * @author Kunal Kumar
 *
 * @copyright 2026 Kunal Kumar
 *
 * @license
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

/* global describe, it, expect, beforeEach, jest */

// Loads sw.js with a fake service worker global and drives its fetch handler.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ORIGIN = "https://musicblocks.example";
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "..", "sw.js"), "utf8");

class FakeResponse {
    constructor(body, { status = 200, type = "basic", headers = {} } = {}) {
        this.body = body;
        this.status = status;
        this.ok = status >= 200 && status < 300;
        this.type = type;
        this.headers = { get: name => headers[name] || null };
    }
    clone() {
        return new FakeResponse(this.body, { status: this.status, type: this.type });
    }
}

function request(pathname, { mode = "no-cors", destination = "" } = {}) {
    return {
        url: ORIGIN + pathname,
        method: "GET",
        mode,
        destination,
        credentials: "same-origin",
        headers: { has: () => false }
    };
}

class FakeRequest {
    constructor(url) {
        this.url = String(url);
        this.method = "GET";
        this.mode = "cors";
        this.destination = "";
        this.credentials = "same-origin";
        this.headers = { has: () => false };
    }
}

function load({ cached = {}, network, base = "/" }) {
    const store = new Map(Object.entries(cached).map(([p, body]) => [ORIGIN + p, body]));
    const cache = {
        match: jest.fn(async req => {
            const url =
                typeof req === "string" ? new URL(req, ORIGIN + base + "sw.js").href : req.url;
            return store.has(url) ? new FakeResponse(store.get(url)) : undefined;
        }),
        put: jest.fn(async (req, res) => store.set(req.url, res.body)),
        addAll: jest.fn(async () => {})
    };
    const listeners = {};
    const sandbox = {
        self: {
            location: new URL(ORIGIN + base + "sw.js"),
            addEventListener: (type, fn) => (listeners[type] = fn),
            skipWaiting: () => {},
            clients: { claim: async () => {} }
        },
        caches: { open: async () => cache, match: req => cache.match(req) },
        fetch: jest.fn(network),
        Response: FakeResponse,
        Request: FakeRequest,
        URL,
        Set,
        Promise,
        console: { log: () => {}, debug: () => {} }
    };
    vm.runInNewContext(SOURCE, sandbox);

    const dispatch = async req => {
        let response;
        const pending = [];
        listeners.fetch({
            request: req,
            respondWith: p => (response = p),
            waitUntil: p => pending.push(p)
        });
        const result = await response;
        await Promise.all(pending);
        return result;
    };
    return { dispatch, cache, store, fetch: sandbox.fetch };
}

describe("sw.js fetch handler", () => {
    const page = () => request("/index.html", { mode: "navigate", destination: "document" });

    it("loads the page from the network first, even with a cached copy", async () => {
        const sw = load({
            cached: { "/index.html": "old page" },
            network: async () => new FakeResponse("new page")
        });

        const response = await sw.dispatch(page());

        expect(sw.fetch).toHaveBeenCalledTimes(1);
        expect(response.body).toBe("new page");
        expect(sw.store.get(ORIGIN + "/index.html")).toBe("new page");
    });

    it("falls back to the cached page when offline", async () => {
        const sw = load({
            cached: { "/index.html": "cached page" },
            network: async () => {
                throw new TypeError("offline");
            }
        });

        const response = await sw.dispatch(page());

        expect(response.body).toBe("cached page");
    });

    it("serves the cached index.html for the site root when offline", async () => {
        const sw = load({
            cached: { "/index.html": "cached page" },
            network: async () => {
                throw new TypeError("offline");
            }
        });

        const response = await sw.dispatch(
            request("/", { mode: "navigate", destination: "document" })
        );

        expect(response.body).toBe("cached page");
    });

    it("answers 503 when offline with nothing cached", async () => {
        const sw = load({
            network: async () => {
                throw new TypeError("offline");
            }
        });

        const response = await sw.dispatch(page());

        expect(response.status).toBe(503);
    });

    it("refreshes the offline copy when the page is opened as /", async () => {
        const sw = load({
            cached: { "/index.html": "old page" },
            network: async () => new FakeResponse("new page")
        });

        await sw.dispatch(request("/", { mode: "navigate", destination: "document" }));

        expect(sw.store.get(ORIGIN + "/index.html")).toBe("new page");
    });

    it("treats /musicblocks/ as the page when the worker lives there", async () => {
        const sw = load({
            base: "/musicblocks/",
            cached: { "/musicblocks/index.html": "old page" },
            network: async () => new FakeResponse("new page")
        });

        const response = await sw.dispatch(
            request("/musicblocks/", { mode: "navigate", destination: "document" })
        );

        expect(response.body).toBe("new page");
        expect(sw.store.get(ORIGIN + "/musicblocks/index.html")).toBe("new page");
    });

    it("does not store another document as the app's offline copy", async () => {
        const sw = load({
            cached: { "/index.html": "app page" },
            network: async () => new FakeResponse("planet page")
        });

        await sw.dispatch(
            request("/planet/index.html", { mode: "navigate", destination: "document" })
        );

        expect(sw.store.get(ORIGIN + "/index.html")).toBe("app page");
    });

    it("keeps serving cached scripts first and refreshing them in the background", async () => {
        const sw = load({
            cached: { "/js/app.js": "old script" },
            network: async () => new FakeResponse("new script")
        });

        const response = await sw.dispatch(request("/js/app.js", { destination: "script" }));

        expect(response.body).toBe("old script");
        expect(sw.fetch).toHaveBeenCalledTimes(1);
        expect(sw.store.get(ORIGIN + "/js/app.js")).toBe("new script");
    });
});
