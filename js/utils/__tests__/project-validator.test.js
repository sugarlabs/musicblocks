// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global describe, it, test, expect, beforeEach */

const { ProjectValidator, validateProject, VALIDATOR_CODES } = require("../project-validator");

describe("ProjectValidator", () => {
    beforeEach(() => {
        global._ = s => s;
    });

    describe("Edge cases & empty projects", () => {
        test("returns empty report for null or undefined activity", () => {
            expect(validateProject(null)).toEqual({
                summary: { errors: 0, warnings: 0, notices: 0, totalBlocks: 0, actionCount: 0 },
                items: []
            });
            expect(validateProject(undefined)).toEqual({
                summary: { errors: 0, warnings: 0, notices: 0, totalBlocks: 0, actionCount: 0 },
                items: []
            });
        });

        test("returns empty report for activity without blocks or with empty blockList", () => {
            expect(validateProject({})).toEqual({
                summary: { errors: 0, warnings: 0, notices: 0, totalBlocks: 0, actionCount: 0 },
                items: []
            });
            expect(validateProject({ blocks: { blockList: [] } })).toEqual({
                summary: { errors: 0, warnings: 0, notices: 0, totalBlocks: 0, actionCount: 0 },
                items: []
            });
        });

        test("handles sparse blockList containing nulls and trash blocks cleanly", () => {
            const blockList = [
                null,
                { name: "start", trash: true, connections: [null, null] },
                undefined,
                { name: "action", trash: true, connections: [null, null, null] }
            ];
            const report = validateProject({ blocks: { blockList } });
            expect(report.summary.totalBlocks).toBe(0);
            expect(report.items).toHaveLength(0);
        });
    });

    describe("Clean project validation", () => {
        test("reports 0 issues for a well-formed project with start, action, and calls", () => {
            // Stack 0: start -> nameddo("melody")
            // Stack 1: action("melody") -> note
            const blockList = [
                // 0: start
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                // 1: nameddo (calls melody)
                {
                    name: "nameddo",
                    trash: false,
                    privateData: "melody",
                    connections: [0, null]
                },
                // 2: action (defines melody)
                {
                    name: "action",
                    trash: false,
                    connections: [null, 3, 4]
                },
                // 3: text (name of action)
                {
                    name: "text",
                    trash: false,
                    value: "melody",
                    isValueBlock: () => true,
                    connections: [2]
                },
                // 4: forward (body of action)
                {
                    name: "forward",
                    trash: false,
                    connections: [2, 5, null],
                    protoblock: { args: 1, dockTypes: ["out", "numberin", "in"] }
                },
                // 5: number
                {
                    name: "number",
                    trash: false,
                    value: 100,
                    isValueBlock: () => true,
                    connections: [4]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            expect(report.summary.errors).toBe(0);
            expect(report.summary.warnings).toBe(0);
            expect(report.summary.notices).toBe(0);
            expect(report.summary.actionCount).toBe(1);
            expect(report.items).toHaveLength(0);
        });
    });

    describe("Missing and Mismatched Action Calls", () => {
        test("detects ERR_MISSING_ACTION when nameddo calls undefined action", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "nameddo",
                    trash: false,
                    privateData: "missingMelody",
                    connections: [0, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            expect(report.summary.errors).toBe(1);
            const err = report.items.find(i => i.code === VALIDATOR_CODES.ERR_MISSING_ACTION);
            expect(err).toBeDefined();
            expect(err.actionName).toBe("missingMelody");
            expect(err.message).toContain('Cannot find action "missingMelody"');
        });

        test("detects ERR_MISSING_ACTION when beginner do calls undefined action via text block", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "do",
                    trash: false,
                    connections: [0, 2, null]
                },
                {
                    name: "text",
                    trash: false,
                    value: "ghostAction",
                    isValueBlock: () => true,
                    connections: [1]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            expect(report.summary.errors).toBe(1);
            const err = report.items.find(i => i.code === VALIDATOR_CODES.ERR_MISSING_ACTION);
            expect(err).toBeDefined();
            expect(err.actionName).toBe("ghostAction");
        });

        test("suggests case-insensitive candidate when action names differ only in case", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "nameddo",
                    trash: false,
                    privateData: "verse",
                    connections: [0, null]
                },
                {
                    name: "action",
                    trash: false,
                    connections: [null, 3, 4]
                },
                {
                    name: "text",
                    trash: false,
                    value: "Verse", // Capital V!
                    isValueBlock: () => true,
                    connections: [2]
                },
                {
                    name: "note",
                    trash: false,
                    connections: [2, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const err = report.items.find(i => i.code === VALIDATOR_CODES.ERR_MISSING_ACTION);
            expect(err).toBeDefined();
            expect(err.actionName).toBe("verse");
            expect(err.suggestion).toBe("Verse");
            expect(err.message).toContain('Did you mean "Verse"? Action names are case-sensitive.');
        });

        test("does not report missing action for dynamic do calls (e.g. box or expression)", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "do",
                    trash: false,
                    connections: [0, 2, null]
                },
                {
                    name: "box",
                    trash: false,
                    value: "my_variable",
                    connections: [1]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            // Dynamic call should not generate a false-positive ERR_MISSING_ACTION
            expect(report.summary.errors).toBe(0);
        });
    });

    describe("Action Definition Integrity", () => {
        test("detects ERR_ACTION_NO_NAME when action block has no name block attached", () => {
            const blockList = [
                {
                    name: "action",
                    trash: false,
                    connections: [null, null, 1]
                },
                {
                    name: "forward",
                    trash: false,
                    connections: [0, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            expect(report.summary.errors).toBe(1);
            const err = report.items.find(i => i.code === VALIDATOR_CODES.ERR_ACTION_NO_NAME);
            expect(err).toBeDefined();
            expect(err.blockId).toBe(0);
        });

        test("detects WARN_EMPTY_ACTION when action block clamp body is empty", () => {
            const blockList = [
                {
                    name: "action",
                    trash: false,
                    connections: [null, 1, null]
                },
                {
                    name: "text",
                    trash: false,
                    value: "emptyRoutine",
                    isValueBlock: () => true,
                    connections: [0]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const warn = report.items.find(i => i.code === VALIDATOR_CODES.WARN_EMPTY_ACTION);
            expect(warn).toBeDefined();
            expect(warn.actionName).toBe("emptyRoutine");
        });

        test("detects WARN_DUPLICATE_ACTION when multiple actions share the same name", () => {
            const blockList = [
                // First action "solo"
                {
                    name: "action",
                    trash: false,
                    connections: [null, 1, 2]
                },
                {
                    name: "text",
                    trash: false,
                    value: "solo",
                    isValueBlock: () => true,
                    connections: [0]
                },
                {
                    name: "note",
                    trash: false,
                    connections: [0, null]
                },
                // Second action "solo"
                {
                    name: "action",
                    trash: false,
                    connections: [null, 4, 5]
                },
                {
                    name: "text",
                    trash: false,
                    value: "solo",
                    isValueBlock: () => true,
                    connections: [3]
                },
                {
                    name: "note",
                    trash: false,
                    connections: [3, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const warn = report.items.find(i => i.code === VALIDATOR_CODES.WARN_DUPLICATE_ACTION);
            expect(warn).toBeDefined();
            expect(warn.actionName).toBe("solo");
            expect(warn.message).toContain('Action "solo" is defined multiple times');
        });

        test("unwraps horizontal spacers (hspace) when reading action names", () => {
            const blockList = [
                {
                    name: "action",
                    trash: false,
                    connections: [null, 1, 3]
                },
                // 1: hspace connecting to 2
                {
                    name: "hspace",
                    trash: false,
                    connections: [0, 2]
                },
                // 2: actual text block
                {
                    name: "text",
                    trash: false,
                    value: "spacedAction",
                    isValueBlock: () => true,
                    connections: [1]
                },
                {
                    name: "forward",
                    trash: false,
                    connections: [0, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            expect(report.summary.errors).toBe(0);
            expect(report.summary.actionCount).toBe(1);
        });
    });

    describe("Unused Actions & Dead Code", () => {
        test("reports INFO_UNUSED_ACTION when action is defined but never invoked", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, null]
                },
                {
                    name: "action",
                    trash: false,
                    connections: [null, 2, 3]
                },
                {
                    name: "text",
                    trash: false,
                    value: "dormantAction",
                    isValueBlock: () => true,
                    connections: [1]
                },
                {
                    name: "forward",
                    trash: false,
                    connections: [1, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const notice = report.items.find(i => i.code === VALIDATOR_CODES.INFO_UNUSED_ACTION);
            expect(notice).toBeDefined();
            expect(notice.actionName).toBe("dormantAction");
            expect(notice.message).toContain('Action "dormantAction" is defined but never called');
        });

        test("softens unused action notice when dynamic calls exist in project", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "do",
                    trash: false,
                    connections: [0, 2, null]
                },
                {
                    name: "box",
                    trash: false,
                    value: "dynamicActionName",
                    connections: [1]
                },
                {
                    name: "action",
                    trash: false,
                    connections: [null, 4, 5]
                },
                {
                    name: "text",
                    trash: false,
                    value: "maybeCalled",
                    isValueBlock: () => true,
                    connections: [3]
                },
                {
                    name: "forward",
                    trash: false,
                    connections: [3, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const notice = report.items.find(i => i.code === VALIDATOR_CODES.INFO_UNUSED_ACTION);
            expect(notice).toBeDefined();
            expect(notice.message).toContain("is not called directly by name");
        });
    });

    describe("Missing Arguments & Sockets", () => {
        test("detects ERR_MISSING_ARGUMENT on runnable flow block with empty argument dock", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "forward",
                    trash: false,
                    connections: [0, null, null], // dock 1 is null
                    protoblock: {
                        args: 1,
                        dockTypes: ["out", "numberin", "in"]
                    }
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const warn = report.items.find(i => i.code === VALIDATOR_CODES.ERR_MISSING_ARGUMENT);
            expect(warn).toBeDefined();
            expect(warn.blockName).toBe("forward");
            expect(warn.argIndex).toBe(1);
        });

        test("detects missing action argument on beginner do block", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, 1]
                },
                {
                    name: "do",
                    trash: false,
                    connections: [0, null, null] // socket 1 (action name) is empty
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const warn = report.items.find(i => i.code === VALIDATOR_CODES.ERR_MISSING_ARGUMENT);
            expect(warn).toBeDefined();
            expect(warn.blockName).toBe("do");
        });
    });

    describe("Orphan Stacks vs Loose Value Blocks", () => {
        test("flags executable flow stack without start hat as INFO_ORPHAN_STACK", () => {
            const blockList = [
                {
                    name: "forward",
                    trash: false,
                    connections: [null, 1, null],
                    protoblock: { args: 1, dockTypes: ["out", "numberin", "in"], style: "basic" }
                },
                {
                    name: "number",
                    trash: false,
                    value: 50,
                    isValueBlock: () => true,
                    connections: [0]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const notice = report.items.find(i => i.code === VALIDATOR_CODES.INFO_ORPHAN_STACK);
            expect(notice).toBeDefined();
            expect(notice.blockId).toBe(0);
            expect(notice.blockName).toBe("forward");
        });

        test("does NOT flag loose unconnected number or pitch block as orphan stack", () => {
            const blockList = [
                {
                    name: "start",
                    trash: false,
                    connections: [null, null]
                },
                // Loose number block floating on canvas
                {
                    name: "number",
                    trash: false,
                    value: 42,
                    connections: [null],
                    isValueBlock: () => true,
                    isArgBlock: () => true,
                    protoblock: { style: "value" }
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const orphan = report.items.find(i => i.code === VALIDATOR_CODES.INFO_ORPHAN_STACK);
            expect(orphan).toBeUndefined();
        });
    });

    describe("Start Block Presence", () => {
        test("warns when workspace has executable blocks but no start block", () => {
            const blockList = [
                {
                    name: "action",
                    trash: false,
                    connections: [null, 1, 2]
                },
                {
                    name: "text",
                    trash: false,
                    value: "act1",
                    isValueBlock: () => true,
                    connections: [0]
                },
                {
                    name: "forward",
                    trash: false,
                    connections: [0, null]
                }
            ];

            const report = validateProject({ blocks: { blockList } });
            const warn = report.items.find(i => i.code === VALIDATOR_CODES.WARN_NO_START);
            expect(warn).toBeDefined();
        });

        test("recognizes drum, status, oscilloscope as valid start hats", () => {
            for (const startName of ["drum", "status", "oscilloscope"]) {
                const blockList = [
                    {
                        name: startName,
                        trash: false,
                        connections: [null, null]
                    }
                ];
                const report = validateProject({ blocks: { blockList } });
                const warn = report.items.find(i => i.code === VALIDATOR_CODES.WARN_NO_START);
                expect(warn).toBeUndefined();
            }
        });
    });

    describe("Performance test", () => {
        test("analyzes a large project with 500 blocks in under 50ms", () => {
            const blockList = [];
            // Create a start block
            blockList.push({ name: "start", trash: false, connections: [null, 1] });

            // Chain 490 forward and number blocks
            for (let i = 1; i < 490; i += 2) {
                blockList.push({
                    name: "forward",
                    trash: false,
                    connections: [i - 1, i + 1, i + 2],
                    protoblock: { args: 1, dockTypes: ["out", "numberin", "in"] }
                });
                blockList.push({
                    name: "number",
                    trash: false,
                    value: 10,
                    isValueBlock: () => true,
                    connections: [i]
                });
            }

            const startTime = performance.now();
            const report = validateProject({ blocks: { blockList } });
            const duration = performance.now() - startTime;

            expect(report.summary.totalBlocks).toBe(blockList.length);
            expect(duration).toBeLessThan(50);
        });
    });
});
