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
 * Deterministic "module test plan" builder.
 *
 * Given an ESTree AST (as produced by the vendored Acorn parser) and the block
 * comments collected while parsing, this produces a small JSON-compatible
 * description of what a module exposes and what is therefore worth testing:
 * exported functions/classes, their parameters, and shallow structural counts
 * (branches, `return`, `throw`), the module's `require`/`import` dependencies,
 * the free identifiers it references, and any leading JSDoc blocks.
 *
 * Everything here is derived syntactically from the AST. Nothing is executed and
 * no runtime behaviour is inferred. The output is stable: every list is sorted
 * and de-duplicated so repeated runs on the same source produce identical JSON.
 *
 * Known limitations (documented rather than guessed around):
 *   - `referencedGlobals` is name-based, not scope-accurate. A name that is bound
 *     anywhere in the file (a parameter, a nested declaration) is treated as
 *     bound everywhere, so a global shadowed elsewhere may be omitted. The same
 *     name set is used to ignore calls to a locally declared `require`.
 *   - Only the CommonJS (`module.exports = ...`, `exports.x = ...`) and ES module
 *     (`export ...`) patterns that appear in this repository are recognised, and
 *     only at module scope - an assignment inside a nested function is ignored.
 *     Conditional or computed exports are not resolved.
 *   - `branches` is a rough syntactic count (`if`, conditional expression, each
 *     `&&`/`||`/`??`, and each non-default `switch` case), not a cyclomatic
 *     complexity or branch-coverage figure. `a && b && c` counts as two, and
 *     loops (`for`, `while`, `do`) are not counted at all.
 *   - Per-function counts (`branches`, `returns`, `throws`) stop at nested
 *     function boundaries; the `totals` block counts the whole file.
 *   - A JSDoc `target` for a class member is qualified with the class name
 *     (`Counter.tick`); a bare name is a top-level function, class or variable.
 */

const NODE_META_KEYS = new Set(["type", "start", "end", "loc", "range", "sourceFile"]);

/**
 * Identifiers that are language-level literals rather than dependencies a test
 * would need to set up. Excluded from `referencedGlobals`.
 */
const IGNORED_GLOBALS = new Set(["undefined", "NaN", "Infinity", "arguments", "globalThis"]);

const FUNCTION_TYPES = new Set([
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression"
]);

/**
 * Walks every ESTree node reachable from `root`, calling `visit(node, parent)`.
 * A minimal generic traversal - no framework, no scope handling.
 *
 * @param {object} root - node to start from.
 * @param {function} visit - callback invoked for every node.
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
 * Like {@link walk} but does not descend into nested function bodies, so counts
 * are attributed to the function that directly contains them.
 *
 * @param {object} fnNode - a function node whose body should be scanned.
 * @param {function} visit - callback invoked for every node in that body.
 * @returns {void}
 */
function walkFunctionBody(fnNode, visit) {
    const stack = [fnNode.body];
    while (stack.length > 0) {
        const node = stack.pop();
        if (!node || typeof node.type !== "string") continue;
        visit(node);
        for (const key of Object.keys(node)) {
            if (NODE_META_KEYS.has(key)) continue;
            const child = node[key];
            const items = Array.isArray(child) ? child : [child];
            for (const item of items) {
                if (!item || typeof item.type !== "string") continue;
                if (FUNCTION_TYPES.has(item.type)) continue;
                stack.push(item);
            }
        }
    }
}

/**
 * Like {@link walk} but treats function nodes as leaves: it visits them but does
 * not descend into their bodies. Used to keep "what does this module expose"
 * questions at module scope, ignoring assignments that only run when some inner
 * function is called.
 *
 * @param {object} root - node to start from.
 * @param {function} visit - callback invoked for every node outside a function body.
 * @returns {void}
 */
function walkModuleScope(root, visit) {
    const stack = [root];
    while (stack.length > 0) {
        const node = stack.pop();
        if (!node || typeof node.type !== "string") continue;
        visit(node);
        if (node !== root && FUNCTION_TYPES.has(node.type)) continue;
        for (const key of Object.keys(node)) {
            if (NODE_META_KEYS.has(key)) continue;
            const child = node[key];
            const items = Array.isArray(child) ? child : [child];
            for (const item of items) {
                if (item && typeof item.type === "string") stack.push(item);
            }
        }
    }
}

/**
 * Renders a parameter node as a short readable string.
 *
 * @param {object} param - a parameter/pattern node.
 * @returns {string}
 */
function paramName(param) {
    switch (param.type) {
        case "Identifier":
            return param.name;
        case "AssignmentPattern":
            return paramName(param.left);
        case "RestElement":
            return "..." + paramName(param.argument);
        case "ObjectPattern":
            return "{}";
        case "ArrayPattern":
            return "[]";
        default:
            return "?";
    }
}

/**
 * Computes the effective arity of a parameter list, matching `Function.length`
 * semantics: leading plain parameters, stopping at the first default or rest.
 *
 * @param {object[]} params - parameter nodes.
 * @returns {number}
 */
function computeArity(params) {
    let arity = 0;
    for (const param of params) {
        if (param.type === "AssignmentPattern" || param.type === "RestElement") break;
        arity += 1;
    }
    return arity;
}

/**
 * Counts syntactic branch points inside a function body: `if`, conditional
 * expressions, logical operators (`&&`, `||`, `??`) and non-default `switch`
 * cases.
 *
 * @param {object} fnNode - function node.
 * @returns {number}
 */
function countBranches(fnNode) {
    let branches = 0;
    walkFunctionBody(fnNode, node => {
        if (node.type === "IfStatement" || node.type === "ConditionalExpression") {
            branches += 1;
        } else if (node.type === "LogicalExpression") {
            branches += 1;
        } else if (node.type === "SwitchStatement") {
            branches += node.cases.filter(c => c.test !== null).length;
        }
    });
    return branches;
}

/**
 * Counts nodes of a given type inside a function body, not descending into
 * nested functions.
 *
 * @param {object} fnNode - function node.
 * @param {string} type - ESTree node type to count.
 * @returns {number}
 */
function countInBody(fnNode, type) {
    let count = 0;
    walkFunctionBody(fnNode, node => {
        if (node.type === type) count += 1;
    });
    return count;
}

/**
 * Describes a function node for the `functions` list.
 *
 * @param {string} name - the name the function is known by.
 * @param {object} fnNode - function node.
 * @returns {object}
 */
function describeFunction(name, fnNode) {
    return {
        name,
        params: fnNode.params.map(paramName),
        arity: computeArity(fnNode.params),
        hasRestParam: fnNode.params.some(p => p.type === "RestElement"),
        isAsync: Boolean(fnNode.async),
        isGenerator: Boolean(fnNode.generator),
        returns: countInBody(fnNode, "ReturnStatement"),
        throws: countInBody(fnNode, "ThrowStatement"),
        branches: countBranches(fnNode)
    };
}

/**
 * Describes a single class member.
 *
 * @param {object} member - a MethodDefinition or PropertyDefinition node.
 * @returns {object|null} null when the member is not statically nameable.
 */
function describeMember(member) {
    if (member.computed || !member.key || member.key.type !== "Identifier") return null;

    let fnNode = null;
    let kind = "method";
    if (member.type === "MethodDefinition") {
        fnNode = member.value;
        kind = member.kind === "method" ? "method" : member.kind; // constructor | get | set | method
    } else if (
        member.type === "PropertyDefinition" &&
        member.value &&
        FUNCTION_TYPES.has(member.value.type)
    ) {
        fnNode = member.value;
    } else {
        return null;
    }

    return {
        name: member.key.name,
        kind,
        isStatic: Boolean(member.static),
        params: fnNode.params.map(paramName),
        arity: computeArity(fnNode.params),
        hasRestParam: fnNode.params.some(p => p.type === "RestElement")
    };
}

/**
 * Describes a class node: its superclass name (when a plain identifier) and its
 * members, sorted for determinism.
 *
 * @param {string} name - the name the class is known by.
 * @param {object} classNode - ClassDeclaration or ClassExpression node.
 * @returns {object}
 */
function describeClass(name, classNode) {
    const members = classNode.body.body
        .map(describeMember)
        .filter(Boolean)
        .sort(
            (a, b) =>
                Number(a.isStatic) - Number(b.isStatic) ||
                a.name.localeCompare(b.name) ||
                a.kind.localeCompare(b.kind)
        );

    let superClass = null;
    if (classNode.superClass && classNode.superClass.type === "Identifier") {
        superClass = classNode.superClass.name;
    }

    return { name, superClass, methods: members };
}

/**
 * Collects the top-level function and class declarations of a program, keyed by
 * name, including `const x = function () {}` / `const x = class {}` forms.
 *
 * @param {object} program - Program node.
 * @returns {{ functions: Map<string, object>, classes: Map<string, object>, objects: Map<string, object> }}
 */
function collectTopLevel(program) {
    const functions = new Map();
    const classes = new Map();
    const objects = new Map();

    const record = node => {
        if (node.type === "FunctionDeclaration" && node.id) {
            functions.set(node.id.name, node);
        } else if (node.type === "ClassDeclaration" && node.id) {
            classes.set(node.id.name, node);
        } else if (node.type === "VariableDeclaration") {
            for (const decl of node.declarations) {
                if (!decl.id || decl.id.type !== "Identifier" || !decl.init) continue;
                if (FUNCTION_TYPES.has(decl.init.type)) {
                    functions.set(decl.id.name, decl.init);
                } else if (decl.init.type === "ClassExpression") {
                    classes.set(decl.id.name, decl.init);
                } else if (decl.init.type === "ObjectExpression") {
                    objects.set(decl.id.name, decl.init);
                }
            }
        }
    };

    for (const node of program.body) {
        record(node);
        if (node.type === "ExportNamedDeclaration" && node.declaration) {
            record(node.declaration);
        }
    }

    return { functions, classes, objects };
}

/**
 * Turns a resolved export value into one or more export entries.
 *
 * Object namespaces are expanded exactly one level: the object passed straight
 * to `module.exports` (directly or through a single identifier) has its members
 * listed, but a member that is itself an object is reported as `kind: "object"`
 * without descending further. This mirrors what callers can actually reach as a
 * top-level export and avoids turning nested data maps into "exports".
 *
 * @param {string|null} name - export name (null for a bare object namespace).
 * @param {object} valueNode - the AST node assigned/exported.
 * @param {object} top - result of {@link collectTopLevel}.
 * @param {string|null} via - namespace identifier the entry came through.
 * @param {boolean} expandObjects - whether an object value should be expanded.
 * @returns {object[]}
 */
function resolveExport(name, valueNode, top, via, expandObjects) {
    if (!valueNode) return [];

    if (FUNCTION_TYPES.has(valueNode.type)) {
        return [
            {
                name,
                kind: "function",
                params: valueNode.params.map(paramName),
                arity: computeArity(valueNode.params),
                hasRestParam: valueNode.params.some(p => p.type === "RestElement"),
                via
            }
        ];
    }

    if (valueNode.type === "ClassExpression") {
        const described = describeClass(name, valueNode);
        return [
            {
                name,
                kind: "class",
                superClass: described.superClass,
                methods: described.methods,
                via
            }
        ];
    }

    if (valueNode.type === "ObjectExpression") {
        if (expandObjects) return resolveObjectExports(valueNode, top, name);
        return [{ name, kind: "object", via }];
    }

    if (valueNode.type === "Identifier") {
        const ref = valueNode.name;
        if (top.functions.has(ref)) {
            return resolveExport(name, top.functions.get(ref), top, via, false);
        }
        if (top.classes.has(ref)) {
            const described = describeClass(name, top.classes.get(ref));
            return [
                {
                    name,
                    kind: "class",
                    superClass: described.superClass,
                    methods: described.methods,
                    via
                }
            ];
        }
        if (top.objects.has(ref)) {
            if (expandObjects) return resolveObjectExports(top.objects.get(ref), top, ref);
            return [{ name, kind: "object", via }];
        }
        return [{ name, kind: "value", via }];
    }

    return [{ name, kind: "value", via }];
}

/**
 * Expands an object literal used as an export namespace into one entry per
 * statically nameable property. Members are resolved without further object
 * expansion.
 *
 * @param {object} objectNode - ObjectExpression node.
 * @param {object} top - result of {@link collectTopLevel}.
 * @param {string|null} via - namespace identifier.
 * @returns {object[]}
 */
function resolveObjectExports(objectNode, top, via) {
    const entries = [];
    for (const prop of objectNode.properties) {
        if (prop.type !== "Property" || prop.computed) continue;
        if (!prop.key || (prop.key.type !== "Identifier" && prop.key.type !== "Literal")) continue;
        const key = prop.key.type === "Identifier" ? prop.key.name : String(prop.key.value);
        entries.push(...resolveExport(key, prop.value, top, via, false));
    }
    return entries;
}

/**
 * Finds every export the module declares, across the CommonJS and ES module
 * patterns used in this repository.
 *
 * @param {object} program - Program node.
 * @param {object} top - result of {@link collectTopLevel}.
 * @returns {object[]}
 */
function collectExports(program, top) {
    const entries = [];

    const isMemberOf = (node, objectName, propertyName) =>
        node &&
        node.type === "MemberExpression" &&
        !node.computed &&
        node.object.type === "Identifier" &&
        node.object.name === objectName &&
        node.property.type === "Identifier" &&
        (propertyName === undefined || node.property.name === propertyName);

    // CommonJS assignments. These are frequently wrapped in a
    // `if (typeof module !== "undefined" && module.exports) { ... }` guard, so
    // the whole module scope is scanned - but not the interior of nested
    // functions, where such an assignment would only run when that function is
    // called and does not describe the module's static surface.
    walkModuleScope(program, node => {
        if (node.type !== "AssignmentExpression" || node.operator !== "=") return;
        const { left, right } = node;

        // module.exports = <value>
        if (isMemberOf(left, "module", "exports")) {
            entries.push(...resolveExport(null, right, top, null, true));
        }
        // exports.NAME = <value>  /  module.exports.NAME = <value>
        else if (
            isMemberOf(left, "exports") ||
            (left.type === "MemberExpression" && isMemberOf(left.object, "module", "exports"))
        ) {
            if (!left.computed && left.property.type === "Identifier") {
                entries.push(...resolveExport(left.property.name, right, top, null, false));
            }
        }
    });

    // ES module declarations are always top-level per the spec.
    for (const statement of program.body) {
        if (statement.type === "ExportNamedDeclaration") {
            if (statement.declaration) {
                const decl = statement.declaration;
                if (decl.type === "FunctionDeclaration" && decl.id) {
                    entries.push(...resolveExport(decl.id.name, decl, top, null, false));
                } else if (decl.type === "ClassDeclaration" && decl.id) {
                    const described = describeClass(decl.id.name, decl);
                    entries.push({
                        name: decl.id.name,
                        kind: "class",
                        superClass: described.superClass,
                        methods: described.methods,
                        via: null
                    });
                } else if (decl.type === "VariableDeclaration") {
                    for (const d of decl.declarations) {
                        if (d.id && d.id.type === "Identifier") {
                            entries.push(...resolveExport(d.id.name, d.init, top, null, false));
                        }
                    }
                }
            }
            for (const spec of statement.specifiers) {
                if (spec.local.type === "Identifier") {
                    const local = spec.local.name;
                    const exported =
                        spec.exported.type === "Identifier" ? spec.exported.name : local;
                    let value = { type: "Identifier", name: local };
                    entries.push(...resolveExport(exported, value, top, null, false));
                }
            }
            continue;
        }

        if (statement.type === "ExportDefaultDeclaration") {
            entries.push(...resolveExport("default", statement.declaration, top, null, false));
        }
    }

    return entries;
}

/**
 * Collects `require("x")` string arguments and ES `import` sources.
 *
 * @param {object} program - Program node.
 * @param {Set<string>} boundNames - names bound anywhere in the file; used to
 *     ignore calls to a locally declared `require`.
 * @returns {string[]}
 */
function collectDependencies(program, boundNames) {
    const deps = new Set();
    const requireIsShadowed = boundNames.has("require");
    walk(program, node => {
        if (
            !requireIsShadowed &&
            node.type === "CallExpression" &&
            node.callee.type === "Identifier" &&
            node.callee.name === "require" &&
            node.arguments.length > 0 &&
            node.arguments[0].type === "Literal" &&
            typeof node.arguments[0].value === "string"
        ) {
            deps.add(node.arguments[0].value);
        } else if (
            (node.type === "ImportDeclaration" ||
                node.type === "ExportNamedDeclaration" ||
                node.type === "ExportAllDeclaration") &&
            node.source &&
            node.source.type === "Literal" &&
            typeof node.source.value === "string"
        ) {
            deps.add(node.source.value);
        }
    });
    return [...deps].sort();
}

/**
 * Collects every identifier name bound anywhere in the file (declarations,
 * parameters, catch clauses, import specifiers).
 *
 * @param {object} program - Program node.
 * @returns {Set<string>}
 */
function collectBoundNames(program) {
    const bound = new Set();

    const addPattern = pattern => {
        if (!pattern) return;
        switch (pattern.type) {
            case "Identifier":
                bound.add(pattern.name);
                break;
            case "AssignmentPattern":
                addPattern(pattern.left);
                break;
            case "RestElement":
                addPattern(pattern.argument);
                break;
            case "ArrayPattern":
                pattern.elements.forEach(addPattern);
                break;
            case "ObjectPattern":
                pattern.properties.forEach(prop => {
                    if (prop.type === "RestElement") addPattern(prop.argument);
                    else addPattern(prop.value);
                });
                break;
            default:
                break;
        }
    };

    walk(program, node => {
        if (FUNCTION_TYPES.has(node.type)) {
            node.params.forEach(addPattern);
            if (node.id) bound.add(node.id.name);
        } else if (node.type === "VariableDeclarator") {
            addPattern(node.id);
        } else if (node.type === "ClassDeclaration" && node.id) {
            bound.add(node.id.name);
        } else if (node.type === "CatchClause" && node.param) {
            addPattern(node.param);
        } else if (node.type === "ImportDeclaration") {
            node.specifiers.forEach(spec => bound.add(spec.local.name));
        }
    });

    return bound;
}

/**
 * Collects free identifier references: names used in a value position that are
 * not bound anywhere in the file. Name-based, not scope-accurate (see the module
 * header).
 *
 * @param {object} program - Program node.
 * @param {Set<string>} bound - names bound anywhere in the file.
 * @returns {string[]}
 */
function collectReferencedGlobals(program, bound) {
    const globals = new Set();

    walk(program, (node, parent) => {
        if (node.type !== "Identifier") return;
        if (!parent) return;

        // Skip non-value positions.
        if (parent.type === "MemberExpression" && parent.property === node && !parent.computed)
            return;
        // A property key (`{ foo: ... }`) is not a reference, but a shorthand
        // property (`{ foo }`) reuses the same node for key and value and *is*.
        if (
            parent.type === "Property" &&
            parent.key === node &&
            !parent.computed &&
            !parent.shorthand
        ) {
            return;
        }
        if (
            (parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") &&
            parent.key === node &&
            !parent.computed
        ) {
            return;
        }
        if (parent.type === "VariableDeclarator" && parent.id === node) return;
        if (FUNCTION_TYPES.has(parent.type) && (parent.params.includes(node) || parent.id === node))
            return;
        if (parent.type === "ClassDeclaration" || parent.type === "ClassExpression") return;
        if (
            parent.type === "LabeledStatement" ||
            parent.type === "BreakStatement" ||
            parent.type === "ContinueStatement"
        ) {
            return;
        }
        if (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier") return;
        if (parent.type === "ExportSpecifier") return;

        if (bound.has(node.name) || IGNORED_GLOBALS.has(node.name)) return;
        globals.add(node.name);
    });

    return [...globals].sort();
}

/**
 * Extracts leading JSDoc (`/** ... *\/`) blocks and attaches each to the
 * declaration that immediately follows it in the source.
 *
 * @param {object} program - Program node.
 * @param {object[]} comments - block comments collected during parsing.
 * @param {string} source - the original source text.
 * @returns {object[]}
 */
function collectJsdoc(program, comments, source) {
    const targets = [];

    // Recursive descent so that a method's target can be qualified with the name
    // of the class that contains it (`Counter.constructor`), keeping targets
    // unambiguous across classes.
    const visit = (node, className) => {
        if (!node || typeof node.type !== "string") return;

        const nextClass =
            (node.type === "ClassDeclaration" || node.type === "ClassExpression") && node.id
                ? node.id.name
                : className;

        if ((node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id) {
            targets.push({ start: node.start, name: node.id.name });
        } else if (node.type === "MethodDefinition" && node.key && node.key.type === "Identifier") {
            const member = node.key.name;
            targets.push({
                start: node.start,
                name: className ? `${className}.${member}` : member
            });
        } else if (
            node.type === "VariableDeclaration" &&
            node.declarations[0] &&
            node.declarations[0].id.type === "Identifier"
        ) {
            targets.push({ start: node.start, name: node.declarations[0].id.name });
        }

        for (const key of Object.keys(node)) {
            if (NODE_META_KEYS.has(key)) continue;
            const child = node[key];
            const items = Array.isArray(child) ? child : [child];
            for (const item of items) {
                if (item && typeof item.type === "string") visit(item, nextClass);
            }
        }
    };
    visit(program, null);
    targets.sort((a, b) => a.start - b.start);

    const results = [];
    for (const comment of comments) {
        if (comment.type !== "Block" || !comment.value.startsWith("*")) continue;

        const target = targets.find(t => t.start >= comment.end);
        if (!target) continue;

        // Only attach when the comment sits directly above the declaration:
        // whitespace only, and no blank line between them.
        const between = source.slice(comment.end, target.start);
        if (between.trim() !== "" || (between.match(/\n/g) || []).length > 1) continue;

        results.push({ target: target.name, ...parseJsdoc(comment.value) });
    }

    results.sort(
        (a, b) =>
            (a.target || "").localeCompare(b.target || "") ||
            a.description.localeCompare(b.description)
    );
    return results;
}

/**
 * Splits a JSDoc comment body into a description and a flat list of `@tag`
 * entries. Intentionally shallow - tags are kept as trimmed text.
 *
 * @param {string} raw - the comment's inner text (without the delimiters).
 * @returns {{ description: string, tags: object[] }}
 */
function parseJsdoc(raw) {
    const lines = raw.split("\n").map(line => line.replace(/^\s*\*?/, "").trim());

    const descriptionLines = [];
    const tags = [];
    for (const line of lines) {
        const match = line.match(/^@(\w+)\s*(.*)$/);
        if (match) {
            tags.push({ tag: match[1], text: match[2].trim() });
        } else if (tags.length === 0 && line !== "") {
            descriptionLines.push(line);
        }
    }

    return { description: descriptionLines.join(" ").trim(), tags };
}

/**
 * Builds the deterministic module test plan.
 *
 * @param {object} ast - Program node from the vendored Acorn parser.
 * @param {object} options - `{ file, source, comments }`.
 * @returns {object} JSON-compatible plan.
 */
function buildTestPlan(ast, options) {
    const { file, source, comments = [] } = options;
    const top = collectTopLevel(ast);
    const boundNames = collectBoundNames(ast);

    const functions = [...top.functions.entries()]
        .map(([name, node]) => describeFunction(name, node))
        .sort((a, b) => a.name.localeCompare(b.name));

    const classes = [...top.classes.entries()]
        .map(([name, node]) => describeClass(name, node))
        .sort((a, b) => a.name.localeCompare(b.name));

    const exportsList = dedupeExports(collectExports(ast, top)).sort((a, b) => {
        const an = a.name === null ? "" : a.name;
        const bn = b.name === null ? "" : b.name;
        return an.localeCompare(bn) || a.kind.localeCompare(b.kind);
    });

    let totalBranches = 0;
    let totalReturns = 0;
    let totalThrows = 0;
    walk(ast, node => {
        if (
            node.type === "IfStatement" ||
            node.type === "ConditionalExpression" ||
            node.type === "LogicalExpression"
        ) {
            totalBranches += 1;
        } else if (node.type === "SwitchStatement") {
            totalBranches += node.cases.filter(c => c.test !== null).length;
        } else if (node.type === "ReturnStatement") {
            totalReturns += 1;
        } else if (node.type === "ThrowStatement") {
            totalThrows += 1;
        }
    });

    return {
        file,
        sourceType: ast.sourceType || "script",
        exports: exportsList,
        functions,
        classes,
        dependencies: collectDependencies(ast, boundNames),
        referencedGlobals: collectReferencedGlobals(ast, boundNames),
        jsdoc: collectJsdoc(ast, comments, source),
        totals: {
            branches: totalBranches,
            returns: totalReturns,
            throws: totalThrows
        }
    };
}

/**
 * Removes duplicate export entries (same name + kind), keeping the first.
 *
 * @param {object[]} entries - raw export entries.
 * @returns {object[]}
 */
function dedupeExports(entries) {
    const seen = new Set();
    const result = [];
    for (const entry of entries) {
        // A structured key so name and kind can never run together into an
        // ambiguous string (e.g. name "a b" vs kind "b value").
        const id = JSON.stringify([entry.name, entry.kind]);
        if (seen.has(id)) continue;
        seen.add(id);
        result.push(entry);
    }
    return result;
}

module.exports = { buildTestPlan };
