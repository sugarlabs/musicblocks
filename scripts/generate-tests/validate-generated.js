/**
 * @license
 * MusicBlocks v3.7.1
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
 */

/**
 * A deterministic first-pass filter between a generated Jest test (an in-memory
 * string produced by ./llm-client.js) and the source tree.
 *
 *     generated source -> parse AST -> structural checks -> semantic safety
 *                      -> { valid, errors, warnings }
 *
 * A candidate that fails validation must not reach ./write-generated.js.
 *
 * This module only parses the candidate string with the repository's vendored
 * Acorn. It never executes it, never reads the module under test, and never
 * touches the filesystem or a network. Given the same inputs it always returns
 * the same result.
 *
 * Scope and limits - read before relying on this:
 *
 *   - It is a *static, heuristic* check. It rejects the known-unsafe and
 *     known-meaningless *patterns* enumerated below (mocking the module under
 *     test, importing anything but the target module, `fs` writes, `_`-private
 *     access, fake assertions, uncontrolled randomness/timers, ...). It is NOT
 *     a JavaScript security sandbox: it cannot catch an unsafe construct it has
 *     no rule for, and code that only *computes* its damage at runtime will
 *     pass.
 *   - Access via a string literal is covered (`fs["writeFileSync"]`,
 *     `require("fs")`), but *fully dynamic* access - a method name or module
 *     specifier held in a variable, `eval`, `Function(...)` - is out of scope.
 *   - `options.allowedGlobals` / `options.allowedModules` are trusted inputs
 *     from the *calling code*. They must never be populated from the generated
 *     candidate or from provider output - that would let the thing being
 *     validated widen its own allow-list.
 *   - The concrete guarantee that a bad string cannot corrupt the repository
 *     comes from ./write-generated.js (one deterministic path, `wx` create,
 *     never overwrites), not from this file.
 *   - The checks are deliberately narrow so ordinary Music Blocks Jest tests
 *     are not rejected.
 */

const { parseSource } = require("./extract-module");
const { normalizePlan } = require("./generation-request");

const NODE_META_KEYS = new Set(["type", "start", "end", "loc", "range", "sourceFile"]);

/**
 * Tier 1 of the global-name allow-list: the fixed, always-safe surface a
 * generated Jest test may use without declaring - the JavaScript language
 * builtins, the Node/CommonJS module frame, the Jest API, and the browser
 * surface jsdom provides (jest.config.js runs tests under jsdom).
 *
 * The full allow-list a run uses is:
 *   1. this set (fixed);
 *   2. the module's own `plan.referencedGlobals` (project-approved: the module
 *      under test already depends on them, so its test legitimately may too);
 *   3. `options.allowedGlobals` (caller-supplied: an explicit, per-call escape
 *      hatch for a known project global).
 * A name outside all three is an error. Widening the list only ever permits
 * that one identifier - it does not disable any other check (an aliased
 * `writeFileSync`, `Math.random`, a timer, ... are still caught by their own
 * rules).
 */
const ALLOWED_GLOBALS = new Set([
    // language builtins / well-known values
    "undefined",
    "NaN",
    "Infinity",
    "globalThis",
    "arguments",
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
    "Symbol",
    "BigInt",
    "Math",
    "JSON",
    "Date",
    "RegExp",
    "Function",
    "Promise",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Proxy",
    "Reflect",
    "Error",
    "TypeError",
    "RangeError",
    "SyntaxError",
    "ReferenceError",
    "EvalError",
    "URIError",
    "AggregateError",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURI",
    "decodeURI",
    "encodeURIComponent",
    "decodeURIComponent",
    "ArrayBuffer",
    "SharedArrayBuffer",
    "DataView",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array",
    "structuredClone",
    "queueMicrotask",
    "atob",
    "btoa",
    // Node / CommonJS frame
    "require",
    "module",
    "exports",
    "process",
    "Buffer",
    "global",
    "__dirname",
    "__filename",
    "console",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "setImmediate",
    "clearImmediate",
    "URL",
    "URLSearchParams",
    "TextEncoder",
    "TextDecoder",
    // Jest API
    "describe",
    "it",
    "test",
    "expect",
    "jest",
    "beforeEach",
    "afterEach",
    "beforeAll",
    "afterAll",
    "xit",
    "xdescribe",
    "xtest",
    "fit",
    "fdescribe",
    // browser surface provided by jsdom
    "window",
    "document",
    "navigator",
    "location",
    "history",
    "screen",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "MutationObserver",
    "ResizeObserver",
    "IntersectionObserver",
    "localStorage",
    "sessionStorage",
    "Node",
    "Element",
    "HTMLElement",
    "SVGElement",
    "DocumentFragment",
    "Event",
    "CustomEvent",
    "EventTarget",
    "DOMParser",
    "XMLSerializer",
    "Blob",
    "File",
    "FileReader",
    "FormData",
    "Headers",
    "Request",
    "Response",
    "Image",
    "Audio",
    "HTMLCanvasElement",
    "CanvasRenderingContext2D",
    "performance",
    "CSS",
    "customElements",
    "AbortController",
    "AbortSignal"
]);

/**
 * `fs`-style calls that write, delete or otherwise mutate the filesystem. Their
 * mere textual presence in a generated test is treated as unsafe.
 */
const UNSAFE_FS_CALLS = new Set([
    "writeFile",
    "writeFileSync",
    "appendFile",
    "appendFileSync",
    "createWriteStream",
    "rm",
    "rmSync",
    "rmdir",
    "rmdirSync",
    "unlink",
    "unlinkSync",
    "mkdir",
    "mkdirSync",
    "mkdtemp",
    "mkdtempSync",
    "rename",
    "renameSync",
    "copyFile",
    "copyFileSync",
    "cp",
    "cpSync",
    "truncate",
    "truncateSync",
    "chmod",
    "chmodSync",
    "symlink",
    "symlinkSync",
    "outputFile",
    "outputFileSync",
    "ensureDir",
    "ensureFile",
    "remove",
    "move"
]);

const NODE_FS_MODULES = new Set(["fs", "node:fs", "fs/promises", "node:fs/promises", "fs-extra"]);
const NODE_PROCESS_MODULES = new Set(["child_process", "node:child_process", "worker_threads"]);

const SNAPSHOT_MATCHERS = new Set(["toMatchSnapshot", "toMatchInlineSnapshot"]);
const EXISTENCE_MATCHERS = new Set(["toBeDefined", "toBeTruthy", "toBeUndefined", "toBeNull"]);
const EQUALITY_MATCHERS = new Set(["toBe", "toEqual", "toStrictEqual"]);
const TITLE_BLOCKS = new Set(["describe", "it", "test", "xdescribe", "xit", "fdescribe", "fit"]);

/**
 * Minimal generic ESTree traversal, matching the style of ./module-test-plan.js.
 *
 * @param {object} root - node to start from.
 * @param {function} visit - `visit(node, parent)` for every node.
 * @returns {void}
 */
function walk(root, visit) {
    const stack = [{ node: root, parent: null }];
    while (stack.length > 0) {
        const { node, parent } = stack.pop();
        if (!node || typeof node.type !== "string") continue;
        visit(node, parent);
        for (const key of Object.keys(node)) {
            if (NODE_META_KEYS.has(key)) continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child) stack.push({ node: item, parent: node });
            } else if (child && typeof child.type === "string") {
                stack.push({ node: child, parent: node });
            }
        }
    }
}

/**
 * The literal string title of a `describe(...)` / `it(...)` / `test(...)` call
 * (including `it.each`, `it.only`, ...), or `null`.
 *
 * @param {object} node - a CallExpression node.
 * @returns {{ kind: string, title: string } | null}
 */
function readTitleCall(node) {
    if (node.type !== "CallExpression") return null;
    const first = node.arguments && node.arguments[0];
    const title =
        first && first.type === "Literal" && typeof first.value === "string" ? first.value : null;
    if (title === null) return null;

    let callee = node.callee;
    // Unwrap the wrappers Jest puts between the title call and `it`/`test`/
    // `describe`:
    //   it.each(table)("title", fn)          -> callee is itself a CallExpression
    //   it.each`table`("title", fn)          -> callee is a TaggedTemplateExpression
    //   it.only("title", fn) / it.skip / ... -> callee is a MemberExpression
    //   it.concurrent.each(table)("title")   -> a chain of the above
    if (callee.type === "CallExpression") callee = callee.callee;
    if (callee.type === "TaggedTemplateExpression") callee = callee.tag;
    while (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.property.type === "Identifier" &&
        ["each", "only", "skip", "concurrent", "failing", "todo"].includes(callee.property.name)
    ) {
        callee = callee.object;
    }
    const name = callee.type === "Identifier" ? callee.name : null;
    if (!name || !TITLE_BLOCKS.has(name)) return null;
    const kind =
        name === "describe" || name === "xdescribe" || name === "fdescribe" ? "describe" : "test";
    return { kind, title };
}

/**
 * Collects every test title with its full `describe > ... > it` path, so the
 * same `it` title under two different `describe` blocks is not a duplicate.
 *
 * @param {object} ast - parsed program.
 * @returns {{ describeTitles: string[], testPaths: string[], leafTitles: string[] }}
 */
function collectTitlePaths(ast) {
    const describeTitles = [];
    const testPaths = [];
    const leafTitles = [];

    const descend = (node, trail) => {
        if (!node || typeof node.type !== "string") return;
        let nextTrail = trail;
        const info = readTitleCall(node);
        if (info) {
            if (info.kind === "describe") {
                describeTitles.push(info.title);
                nextTrail = [...trail, info.title];
            } else {
                testPaths.push([...trail, info.title].join(" › "));
                leafTitles.push(info.title);
            }
        }
        for (const key of Object.keys(node)) {
            if (NODE_META_KEYS.has(key)) continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child) descend(item, nextTrail);
            } else if (child && typeof child.type === "string") {
                descend(child, nextTrail);
            }
        }
    };
    descend(ast, []);
    return { describeTitles, testPaths, leafTitles };
}

/**
 * Strips a trailing `.js` / `.mjs` / `.cjs` and returns the final path segment.
 *
 * @param {string} spec - a path or module specifier.
 * @returns {string}
 */
function basenameNoExt(spec) {
    const clean = String(spec).replace(/\.(?:js|mjs|cjs|jsx|ts|tsx)$/, "");
    const slash = clean.lastIndexOf("/");
    return slash === -1 ? clean : clean.slice(slash + 1);
}

/**
 * Reads the module specifier from any node that pulls in another module - a
 * `require("x")` call, a `jest.mock("x", ...)` call, a static ESM
 * `import`/`export ... from`, or a dynamic `import("x")` - or `null` when the
 * node is not one of those.
 *
 * @param {object} node - any AST node.
 * @returns {{ kind: string, spec: string, node: object } | null}
 */
function readModuleCall(node) {
    // static ESM: `import ... from "x"`, `export ... from "x"`, `export * from "x"`
    if (
        (node.type === "ImportDeclaration" ||
            node.type === "ExportNamedDeclaration" ||
            node.type === "ExportAllDeclaration") &&
        node.source &&
        node.source.type === "Literal" &&
        typeof node.source.value === "string"
    ) {
        return { kind: "import", spec: node.source.value, node };
    }
    // dynamic `import("x")` (acorn emits ImportExpression at ecmaVersion 2020)
    if (node.type === "ImportExpression") {
        const arg = node.source;
        return arg && arg.type === "Literal" && typeof arg.value === "string"
            ? { kind: "import", spec: arg.value, node }
            : null;
    }
    if (node.type !== "CallExpression") return null;
    const callee = node.callee;
    const firstArg = node.arguments && node.arguments[0];
    const spec =
        firstArg && firstArg.type === "Literal" && typeof firstArg.value === "string"
            ? firstArg.value
            : null;

    if (callee.type === "Identifier" && callee.name === "require" && spec !== null) {
        return { kind: "require", spec, node };
    }
    if (callee.type === "Identifier" && callee.name === "import" && spec !== null) {
        return { kind: "import", spec, node };
    }
    if (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        (callee.object.name === "jest" || callee.object.name === "require") &&
        callee.property.type === "Identifier"
    ) {
        const method = callee.property.name;
        if (["mock", "doMock", "setMock", "unmock", "dontMock"].includes(method) && spec !== null) {
            return { kind: `jest.${method}`, spec, node };
        }
        if (["requireActual", "requireMock"].includes(method) && spec !== null) {
            return { kind: `jest.${method}`, spec, node };
        }
    }
    return null;
}

/**
 * Flattens an `expect(x).not.resolves.matcher(y)` chain into
 * `{ subject, matcher, matcherArgs }`, or `null` when `node` is not the outer
 * call of an `expect(...)` assertion.
 *
 * @param {object} node - a CallExpression node.
 * @returns {{ subject: object, matcher: string, matcherArgs: object[] } | null}
 */
function readAssertion(node) {
    if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") return null;
    if (node.callee.computed || node.callee.property.type !== "Identifier") return null;

    const matcher = node.callee.property.name;
    let obj = node.callee.object;
    // walk back through .not / .resolves / .rejects modifier chain
    while (
        obj.type === "MemberExpression" &&
        !obj.computed &&
        obj.property.type === "Identifier" &&
        ["not", "resolves", "rejects"].includes(obj.property.name)
    ) {
        obj = obj.object;
    }
    if (
        obj.type === "CallExpression" &&
        obj.callee.type === "Identifier" &&
        obj.callee.name === "expect"
    ) {
        return { subject: obj.arguments[0] || null, matcher, matcherArgs: node.arguments || [] };
    }
    return null;
}

/**
 * A literal's primitive value, or the marker `NO_LITERAL` for a non-literal.
 */
const NO_LITERAL = Symbol("not-a-literal");
function literalValue(node) {
    if (!node) return NO_LITERAL;
    if (node.type === "Literal") return node.value;
    if (
        node.type === "UnaryExpression" &&
        node.operator === "-" &&
        node.argument.type === "Literal"
    ) {
        return -node.argument.value;
    }
    if (node.type === "Identifier" && (node.name === "undefined" || node.name === "NaN")) {
        return node.name === "undefined" ? undefined : NaN;
    }
    return NO_LITERAL;
}

/**
 * Collects every name bound anywhere in the tree (declarations, params, imports,
 * catch clauses). Name-based, not scope-accurate - the same heuristic the
 * extractor uses.
 *
 * @param {object} ast - the parsed program.
 * @returns {Set<string>}
 */
function collectBoundNames(ast) {
    const bound = new Set();
    const addPattern = pattern => {
        if (!pattern) return;
        switch (pattern.type) {
            case "Identifier":
                bound.add(pattern.name);
                break;
            case "ObjectPattern":
                for (const prop of pattern.properties) {
                    if (prop.type === "RestElement") addPattern(prop.argument);
                    else addPattern(prop.value);
                }
                break;
            case "ArrayPattern":
                for (const el of pattern.elements) addPattern(el);
                break;
            case "AssignmentPattern":
                addPattern(pattern.left);
                break;
            case "RestElement":
                addPattern(pattern.argument);
                break;
            default:
                break;
        }
    };

    walk(ast, node => {
        if (node.type === "VariableDeclarator") addPattern(node.id);
        else if (
            node.type === "FunctionDeclaration" ||
            node.type === "FunctionExpression" ||
            node.type === "ArrowFunctionExpression"
        ) {
            if (node.id) bound.add(node.id.name);
            for (const param of node.params) addPattern(param);
        } else if (node.type === "ClassDeclaration" && node.id) {
            bound.add(node.id.name);
        } else if (node.type === "CatchClause") {
            addPattern(node.param);
        } else if (
            node.type === "ImportDefaultSpecifier" ||
            node.type === "ImportNamespaceSpecifier"
        ) {
            bound.add(node.local.name);
        } else if (node.type === "ImportSpecifier") {
            bound.add(node.local.name);
        }
    });
    return bound;
}

/**
 * Names introduced by `const x = require("<module under test>")` or an
 * equivalent `import`, so an existence-only assertion on them can be recognised.
 *
 * @param {object} ast - parsed program.
 * @param {function} isTargetSpec - predicate on a module specifier.
 * @returns {Set<string>}
 */
function collectTargetBindings(ast, isTargetSpec) {
    const names = new Set();
    walk(ast, node => {
        if (
            node.type === "VariableDeclarator" &&
            node.init &&
            node.init.type === "CallExpression"
        ) {
            const call = readModuleCall(node.init);
            if (call && (call.kind === "require" || call.kind === "jest.requireActual")) {
                if (isTargetSpec(call.spec) && node.id.type === "Identifier") {
                    names.add(node.id.name);
                }
            }
        }
        if (node.type === "ImportDeclaration" && isTargetSpec(node.source.value)) {
            for (const spec of node.specifiers) names.add(spec.local.name);
        }
    });
    return names;
}

/**
 * Identifiers a candidate has bound to a Node filesystem module, so an unsafe
 * method call can be attributed to a real `fs` receiver rather than to any
 * object that happens to have a same-named method (`element.remove()`).
 *
 * @param {object} ast - parsed program.
 * @returns {{ namespaces: Set<string>, calls: Set<string> }} `namespaces` are
 *     whole-module bindings (`const fs = require("fs")`), `calls` are names
 *     destructured straight off the module (`const { writeFileSync } = ...`).
 */
function collectFsBindings(ast) {
    const namespaces = new Set();
    const calls = new Set();

    const fromModuleCall = (idNode, spec) => {
        if (!NODE_FS_MODULES.has(spec)) return;
        if (idNode.type === "Identifier") {
            namespaces.add(idNode.name);
        } else if (idNode.type === "ObjectPattern") {
            for (const prop of idNode.properties) {
                if (prop.type === "Property" && prop.value.type === "Identifier") {
                    calls.add(prop.value.name);
                }
            }
        }
    };

    walk(ast, node => {
        if (node.type === "VariableDeclarator" && node.init) {
            const call = readModuleCall(node.init);
            if (call && (call.kind === "require" || call.kind === "import")) {
                fromModuleCall(node.id, call.spec);
            }
        }
        if (node.type === "ImportDeclaration" && NODE_FS_MODULES.has(node.source.value)) {
            for (const spec of node.specifiers) {
                if (
                    spec.type === "ImportDefaultSpecifier" ||
                    spec.type === "ImportNamespaceSpecifier"
                ) {
                    namespaces.add(spec.local.name);
                } else if (spec.type === "ImportSpecifier") {
                    calls.add(spec.local.name);
                }
            }
        }
    });
    return { namespaces, calls };
}

/**
 * Validates a generated Jest test candidate against a ModuleTestPlan.
 *
 * @param {string} source - the candidate test source.
 * @param {object} [options]
 * @param {object} [options.plan] - a ModuleTestPlan (or partial) for the module
 *     under test. Used to identify the real module and its known globals.
 * @param {string} [options.modulePath] - overrides `plan.file` when identifying
 *     the module under test.
 * @param {string[]} [options.existingTitles] - `describe > it` titles already
 *     present elsewhere in the suite; a collision is an error.
 * @param {string[]} [options.allowedGlobals] - caller-supplied free identifiers
 *     to add to the allow-list (tier 3; see {@link ALLOWED_GLOBALS}). Each entry
 *     permits exactly that one name and nothing else - it never relaxes another
 *     rule.
 * @param {string[]} [options.allowedModules] - caller-supplied module specifiers
 *     the test may `require`/`import` in addition to the module under test.
 *     `fs`/`child_process` and friends are always rejected and cannot be added
 *     here.
 *
 *     `allowedGlobals` and `allowedModules` are trusted configuration from the
 *     caller. Never derive them from the candidate string or provider output.
 * @returns {{ valid: boolean, errors: string[], warnings: string[], modulePath: string|null }}
 */
function validateGeneratedTest(source, options = {}) {
    const errors = [];
    const warnings = [];
    const plan = options.plan ? normalizePlan(options.plan) : null;
    const modulePath =
        typeof options.modulePath === "string"
            ? options.modulePath
            : plan && plan.file !== "<unknown>"
              ? plan.file
              : null;
    const moduleBase = modulePath ? basenameNoExt(modulePath) : null;

    if (typeof source !== "string" || source.trim() === "") {
        errors.push("generated source is empty");
        return { valid: false, errors, warnings, modulePath };
    }

    // ---- structural: must parse -------------------------------------------
    let ast;
    try {
        ast = parseSource(source, "<generated>").ast;
    } catch (err) {
        errors.push(`does not parse as JavaScript: ${err.message}`);
        return { valid: false, errors, warnings, modulePath };
    }

    const isTargetSpec = spec => {
        if (!moduleBase) return false;
        if (basenameNoExt(spec) !== moduleBase) return false;
        // a bare specifier like "utils-logic" is a package lookup, not our file
        return (
            spec.startsWith(".") || spec === modulePath || spec === modulePath.replace(/\.js$/, "")
        );
    };

    // ---- gather module calls, assertions, titles, identifiers ------------
    const moduleCalls = [];
    const assertions = [];
    const { describeTitles, testPaths, leafTitles } = collectTitlePaths(ast);
    const memberProps = [];
    const computedStringProps = [];
    const freeIdentifierNames = new Set();
    const calledNames = new Set();
    let usesFakeTimers = false;
    let controlsRandom = false;
    let controlsClock = false;
    let assignsModuleExports = false;
    let usesTimerFn = false;
    let usesDateNow = false;
    let usesMathRandom = false;

    const bound = collectBoundNames(ast);

    walk(ast, (node, parent) => {
        const modCall = readModuleCall(node);
        if (modCall) moduleCalls.push(modCall);

        const assertion = readAssertion(node);
        if (assertion) assertions.push(assertion);

        // member expressions: private access + jest fake-timer / spy detection
        if (
            node.type === "MemberExpression" &&
            !node.computed &&
            node.property.type === "Identifier"
        ) {
            memberProps.push({ node, parent });
            const oname = node.object.type === "Identifier" ? node.object.name : null;
            const pname = node.property.name;
            if (oname === "jest" && pname === "useFakeTimers") usesFakeTimers = true;
            if (oname === "jest" && (pname === "setSystemTime" || pname === "useFakeTimers")) {
                controlsClock = true;
            }
            if (oname === "Math" && pname === "random") usesMathRandom = true;
            if (oname === "Date" && pname === "now") usesDateNow = true;
            if (oname === "jest" && pname === "spyOn") {
                const spyArgs = parent && parent.type === "CallExpression" ? parent.arguments : [];
                const target =
                    spyArgs[0] && spyArgs[0].type === "Identifier" ? spyArgs[0].name : null;
                const prop = spyArgs[1] && spyArgs[1].type === "Literal" ? spyArgs[1].value : null;
                if (target === "Math" && prop === "random") controlsRandom = true;
                if (target === "Date" && (prop === "now" || prop === "prototype"))
                    controlsClock = true;
            }
        }

        // computed member access with a string-literal key: fs["writeFileSync"],
        // target["_private"]. Fully dynamic access (a name held in a variable)
        // is out of this static filter's scope - see the module header.
        if (
            node.type === "MemberExpression" &&
            node.computed &&
            node.property.type === "Literal" &&
            typeof node.property.value === "string"
        ) {
            computedStringProps.push({
                recv: node.object.type === "Identifier" ? node.object.name : null,
                prop: node.property.value
            });
        }

        // assignment to Math.random / Date.now, or to module.exports
        if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
            const left = node.left;
            if (
                left.object.type === "Identifier" &&
                left.object.name === "Math" &&
                left.property.type === "Identifier" &&
                left.property.name === "random"
            ) {
                controlsRandom = true;
            }
            if (
                left.object.type === "Identifier" &&
                (left.object.name === "module" || left.object.name === "exports")
            ) {
                assignsModuleExports = true;
            }
            if (
                left.object.type === "MemberExpression" &&
                left.object.object.type === "Identifier" &&
                left.object.object.name === "module" &&
                left.object.property.name === "exports"
            ) {
                assignsModuleExports = true;
            }
        }

        // bare timer / clock / random calls
        if (node.type === "CallExpression" && node.callee.type === "Identifier") {
            calledNames.add(node.callee.name);
            if (["setTimeout", "setInterval", "setImmediate"].includes(node.callee.name)) {
                usesTimerFn = true;
            }
        }
    });

    // free identifiers (value position, not bound, not a property key)
    walk(ast, (node, parent) => {
        if (node.type !== "Identifier") return;
        if (parent) {
            if (
                parent.type === "MemberExpression" &&
                parent.property === node &&
                !parent.computed
            ) {
                return;
            }
            if (parent.type === "Property" && parent.key === node && !parent.computed) return;
            if (parent.type === "MethodDefinition" && parent.key === node && !parent.computed)
                return;
            if (
                (parent.type === "FunctionDeclaration" ||
                    parent.type === "FunctionExpression" ||
                    parent.type === "ClassDeclaration" ||
                    parent.type === "ClassExpression") &&
                parent.id === node
            ) {
                return;
            }
            if (
                parent.type === "LabeledStatement" ||
                parent.type === "BreakStatement" ||
                parent.type === "ContinueStatement"
            ) {
                return;
            }
        }
        if (!bound.has(node.name)) freeIdentifierNames.add(node.name);
    });

    // ---- semantic: imports the real module ------------------------------
    if (moduleBase) {
        const requires = moduleCalls.filter(c => c.kind === "require" || c.kind === "import");
        const importsTarget = requires.some(c => isTargetSpec(c.spec));
        if (!importsTarget) {
            errors.push(
                `does not import the module under test (expected a relative require of "${moduleBase}")`
            );
        }

        // mocks the module under test
        const mocked = moduleCalls.filter(
            c =>
                ["jest.mock", "jest.doMock", "jest.setMock"].includes(c.kind) &&
                isTargetSpec(c.spec)
        );
        if (mocked.length > 0) {
            errors.push("mocks the module under test (jest.mock/doMock/setMock on its own path)");
        }
    } else {
        warnings.push("no module path supplied; skipped the real-module and relatedness checks");
    }

    // ---- semantic: import policy --------------------------------------------
    // Every require()/import must be the module under test or a caller-approved
    // dependency. Anything else is rejected - including a *bare package*
    // specifier: an installed package is opaque to the pattern rules below and
    // could perform filesystem / network / process work this validator never
    // sees. `fs`/`child_process` get their own, more specific message and can
    // never be allow-listed.
    const allowedModules = new Set(
        Array.isArray(options.allowedModules)
            ? options.allowedModules.filter(m => typeof m === "string")
            : []
    );
    for (const c of moduleCalls) {
        if (c.kind !== "require" && c.kind !== "import") continue;
        if (moduleBase && isTargetSpec(c.spec)) continue;
        if (NODE_FS_MODULES.has(c.spec)) {
            errors.push(
                `requires a filesystem module ("${c.spec}"); a generated test must not do I/O`
            );
            continue;
        }
        if (NODE_PROCESS_MODULES.has(c.spec)) {
            errors.push(
                `requires "${c.spec}"; a generated test must not spawn processes or threads`
            );
            continue;
        }
        if (allowedModules.has(c.spec)) continue;
        const isRelative = c.spec.startsWith(".") || c.spec.startsWith("/");
        if (isRelative && !moduleBase) continue; // cannot tell if it is the target
        errors.push(
            isRelative
                ? `imports "${c.spec}", which is not the module under test ("${moduleBase}"); ` +
                      "a generated test must exercise only its target module"
                : `imports the package "${c.spec}"; a generated test may require only its target ` +
                      "module (pass options.allowedModules to permit a specific dependency)"
        );
    }

    // ---- semantic: unsafe filesystem calls --------------------------------
    // Only flag a filesystem method when it is reached through a real `fs`
    // binding (`fs.writeFileSync`, `fs["writeFileSync"]`, a name destructured
    // off `fs`) or called bare as a free identifier. `element.remove()`,
    // `list.move()` and similar on arbitrary receivers are NOT filesystem ops.
    const { namespaces: fsNamespaces, calls: fsDestructuredCalls } = collectFsBindings(ast);
    const unsafeFsCall = new Set();
    for (const n of calledNames) {
        if (fsDestructuredCalls.has(n)) unsafeFsCall.add(n);
        else if (UNSAFE_FS_CALLS.has(n) && !bound.has(n)) unsafeFsCall.add(n);
    }
    for (const { node } of memberProps) {
        const recv = node.object.type === "Identifier" ? node.object.name : null;
        if (recv && fsNamespaces.has(recv) && UNSAFE_FS_CALLS.has(node.property.name)) {
            unsafeFsCall.add(node.property.name);
        }
    }
    for (const { recv, prop } of computedStringProps) {
        if (recv && fsNamespaces.has(recv) && UNSAFE_FS_CALLS.has(prop)) unsafeFsCall.add(prop);
    }
    if (unsafeFsCall.size > 0) {
        errors.push(`uses an unsafe filesystem operation: ${[...unsafeFsCall].sort().join(", ")}`);
    }

    // ---- semantic: does not modify production source -------------------
    if (assignsModuleExports) {
        errors.push("assigns module.exports / exports.*; a test must not add exports to any file");
    }

    // ---- semantic: no private (_-prefixed) member access --------------
    const privateNames = new Set();
    for (const { node } of memberProps) {
        const name = node.property.name;
        if (/^_[A-Za-z0-9]/.test(name) && name !== "__proto__") privateNames.add(name);
    }
    // computed access with a string literal: target["_private"]
    for (const { prop } of computedStringProps) {
        if (/^_[A-Za-z0-9]/.test(prop) && prop !== "__proto__") privateNames.add(prop);
    }
    // also `const { _x } = target`
    walk(ast, node => {
        if (node.type === "ObjectPattern") {
            for (const prop of node.properties) {
                if (
                    prop.type === "Property" &&
                    prop.key.type === "Identifier" &&
                    /^_[A-Za-z0-9]/.test(prop.key.name)
                ) {
                    privateNames.add(prop.key.name);
                }
            }
        }
    });
    if (privateNames.size > 0) {
        errors.push(
            `accesses private, "_"-prefixed members: ${[...privateNames].sort().join(", ")}; ` +
                "test the public API and observable behaviour instead"
        );
    }

    // ---- structural: has at least one test case ----------------------
    if (testPaths.length === 0) {
        errors.push("declares no it()/test() cases");
    }

    // ---- semantic: meaningful assertions -----------------------------
    if (assertions.length === 0) {
        errors.push("contains no expect() assertions");
    } else {
        const targetBindings = moduleBase ? collectTargetBindings(ast, isTargetSpec) : new Set();
        const snapshotOnly = assertions.every(a => SNAPSHOT_MATCHERS.has(a.matcher));
        if (snapshotOnly) {
            errors.push(
                "relies only on snapshot assertions (toMatchSnapshot / toMatchInlineSnapshot); " +
                    "assert concrete values and behaviour"
            );
        }

        const isTrivial = a => {
            const subjVal = literalValue(a.subject);
            const argVal = a.matcherArgs.length > 0 ? literalValue(a.matcherArgs[0]) : NO_LITERAL;
            // expect(<literal>).toBe(<equal literal>)
            if (
                EQUALITY_MATCHERS.has(a.matcher) &&
                subjVal !== NO_LITERAL &&
                argVal !== NO_LITERAL &&
                Object.is(subjVal, argVal)
            ) {
                return true;
            }
            // expect(true).toBeTruthy() / expect(1).toBeTruthy() / expect(false).toBeFalsy()
            if (a.matcher === "toBeTruthy" && subjVal !== NO_LITERAL && subjVal) return true;
            if (a.matcher === "toBeFalsy" && subjVal !== NO_LITERAL && !subjVal) return true;
            // existence-only checks on the imported module binding
            if (
                EXISTENCE_MATCHERS.has(a.matcher) &&
                a.subject &&
                a.subject.type === "Identifier" &&
                targetBindings.has(a.subject.name)
            ) {
                return true;
            }
            return false;
        };

        const meaningful = assertions.filter(
            a => !isTrivial(a) && !SNAPSHOT_MATCHERS.has(a.matcher)
        );
        if (!snapshotOnly && meaningful.length === 0) {
            errors.push(
                "contains no meaningful assertions (only literal-vs-literal checks such as " +
                    "expect(true).toBe(true), or bare existence checks on the import)"
            );
        }
    }

    // ---- semantic: determinism -------------------------------------
    if (usesMathRandom && !controlsRandom) {
        errors.push(
            'uses Math.random without deterministic control (jest.spyOn(Math, "random") or a stub)'
        );
    }
    if (usesTimerFn && !usesFakeTimers) {
        errors.push("uses setTimeout/setInterval without jest.useFakeTimers()");
    }
    if (usesDateNow && !controlsClock) {
        warnings.push(
            "uses Date.now without jest.useFakeTimers()/jest.setSystemTime(); assert on a fixed clock if timing matters"
        );
    }
    // `new Date()` with no argument
    let usesLiveDate = false;
    walk(ast, node => {
        if (
            node.type === "NewExpression" &&
            node.callee.type === "Identifier" &&
            node.callee.name === "Date" &&
            (!node.arguments || node.arguments.length === 0)
        ) {
            usesLiveDate = true;
        }
    });
    if (usesLiveDate && !controlsClock) {
        warnings.push(
            "constructs `new Date()` with no argument; use a fixed timestamp for a deterministic test"
        );
    }

    // ---- semantic: undeclared globals --------------------------------
    const permitted = new Set(ALLOWED_GLOBALS);
    if (plan) for (const g of plan.referencedGlobals) permitted.add(g);
    if (Array.isArray(options.allowedGlobals))
        for (const g of options.allowedGlobals) permitted.add(g);
    const undeclared = [...freeIdentifierNames].filter(n => !permitted.has(n)).sort();
    if (undeclared.length > 0) {
        errors.push(
            `references undeclared globals: ${undeclared.join(", ")}; ` +
                "a generated test must not depend on ambient state from other subsystems"
        );
    }

    // ---- structural: duplicate titles ------------------------------
    const seenPaths = new Set();
    const dupes = new Set();
    for (const p of testPaths) {
        if (seenPaths.has(p)) dupes.add(p);
        seenPaths.add(p);
    }
    if (dupes.size > 0) {
        errors.push(`duplicate test titles within the file: ${[...dupes].sort().join("; ")}`);
    }
    if (Array.isArray(options.existingTitles) && options.existingTitles.length > 0) {
        const existing = new Set(options.existingTitles);
        const collisions = [...new Set([...testPaths, ...leafTitles].filter(t => existing.has(t)))];
        if (collisions.length > 0) {
            errors.push(
                `test titles already used elsewhere in the suite: ${collisions.sort().join("; ")}`
            );
        }
    }

    // ---- structural: relatedness of describe titles ---------------
    if (moduleBase) {
        const other = [...new Set(describeTitles)].filter(
            title => /\.js$/.test(title) && basenameNoExt(title) !== moduleBase
        );
        if (other.length > 0) {
            warnings.push(
                `describe title names a different module file: ${other.sort().join(", ")}`
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        modulePath: modulePath
    };
}

module.exports = {
    validateGeneratedTest,
    ALLOWED_GLOBALS,
    UNSAFE_FS_CALLS
};
