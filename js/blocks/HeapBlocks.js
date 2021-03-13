function setupHeapBlocks() {
    class HeapBlock extends ValueBlock {
        constructor() {
            super("heap");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([_("The Heap block returns the heap."), "documentation", ""]);

            this.formBlock({
                name: _("heap"),
                outType: "numberout"
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "heap"]);
            } else {
                return JSON.stringify(logo.turtleHeaps[turtle]);
            }
        }
    }

    class ShowHeapBlock extends FlowBlock {
        constructor() {
            super("showHeap");
            this.setPalette("heap");
            this.hidden = this.deprecated = true;
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Show-heap block displays the contents of the heap at the top of the screen."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Display the heap contents
                name: _("show heap")
            });
        }

        flow(args, logo, turtle) {
            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }
            logo.textMsg(JSON.stringify(logo.turtleHeaps[turtle]));
        }
    }

    class HeapLengthBlock extends ValueBlock {
        constructor() {
            super("heapLength");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Heap-length block returns the length of the heap."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: How many entries are in the heap?
                name: _("heap length"),
                outType: "numberout"
            });
        }

        arg(logo, turtle, blk) {
            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "heapLength"]);
            } else {
                return logo.turtleHeaps[turtle].length;
            }
        }
    }

    class HeapEmptyBlock extends ValueBlock {
        constructor() {
            super("heapEmpty");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Heap-empty? block returns true if the heap is empty."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Is the heap empty?
                name: _("heap empty?"),
                outType: "booleanout"
            });
        }

        arg(logo, turtle) {
            if (turtle in logo.turtleHeaps) return logo.turtleHeaps[turtle].length === 0;
            return true;
        }
    }

    class EmptyHeapBlock extends FlowBlock {
        constructor() {
            super("emptyHeap");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([_("The Empty-heap block empties the heap."), "documentation", ""]);

            this.formBlock({
                //.TRANS: empty the heap
                name: _("empty heap")
            });
        }

        flow(args, logo, turtle) {
            logo.turtleHeaps[turtle] = [];
        }
    }

    class ReverseHeapBlock extends FlowBlock {
        constructor() {
            super("reverseHeap");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Reverse-heap block reverses the order of the heap."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: reverse the order of the heap
                name: _("reverse heap")
            });
        }

        flow(args, logo, turtle) {
            logo.turtleHeaps[turtle] = logo.turtleHeaps[turtle].reverse();
        }
    }

    class IndexHeapBlock extends LeftBlock {
        constructor() {
            super("indexHeap");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Index-heap block returns a value in the heap at a specified location."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: retrieve a value from the heap at index position in the heap
                name: _("index heap"),
                args: 1,
                defaults: [1]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (typeof a === "number") {
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }

                if (a === -1) {
                    // -1 to access top of heap
                    a = logo.turtleHeaps[turtle].length;
                } else if (a < 1) {
                    a = 1;
                    logo.errorMsg(_("Index must be > 0."));
                }

                if (a > 1000) {
                    a = 1000;
                    logo.errorMsg(_("Maximum heap size is 1000."));
                }

                // If index > heap length, grow the heap.
                while (logo.turtleHeaps[turtle].length < a) {
                    logo.turtleHeaps[turtle].push(0);
                }

                return logo.turtleHeaps[turtle][a - 1];
            }
            logo.errorMsg(NANERRORMSG, blk);
            return 0;
        }
    }

    class SetHeapEntryBlock extends FlowBlock {
        constructor() {
            super("setHeapEntry");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set-heap entry block sets a value in he heap at the specified location."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("set heap"),
                args: 2,
                argTypes: ["numberin", "anyin"],
                defaults: [1, 100],
                //.TRANS: value1 is a numeric value (JAPANESE ONLY)
                argLabels: [_("index"), this.lang === "ja" ? _("value1") : _("value")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (typeof args[0] !== "number" || typeof args[1] !== "number") {
                logo.errorMsg(NANERRORMSG, blk);
                return;
            }

            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }

            let idx = Math.floor(args[0]);
            if (idx < 1) {
                logo.errorMsg(_("Index must be > 0."));
                idx = 1;
            }

            if (idx > 1000) {
                logo.errorMsg(_("Maximum heap size is 1000."));
                idx = 1000;
            }

            // If index > heap length, grow the heap.
            while (logo.turtleHeaps[turtle].length < idx) {
                logo.turtleHeaps[turtle].push(0);
            }

            logo.turtleHeaps[turtle][idx - 1] = args[1];
        }
    }

    class PopBlock extends ValueBlock {
        constructor() {
            super("pop");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Pop block removes the value at the top of the heap."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: pop a value off the top of the heap
                name: _("pop")
            });
        }

        arg(logo, turtle) {
            if (turtle in logo.turtleHeaps && logo.turtleHeaps[turtle].length > 0) {
                return logo.turtleHeaps[turtle].pop();
            }
            logo.errorMsg(_("empty heap"));
            return 0;
        }
    }

    class PushBlock extends FlowBlock {
        constructor() {
            super("push");
            this.setPalette("heap");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Push block adds a value to the top of the heap."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: push a value onto the top of the heap
                name: _("push"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [1]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }

            logo.turtleHeaps[turtle].push(args[0]);
        }
    }

    new HeapBlock().setup();
    new ShowHeapBlock().setup();
    new HeapLengthBlock().setup();
    new HeapEmptyBlock().setup();
    new EmptyHeapBlock().setup();
    new ReverseHeapBlock().setup();
    new IndexHeapBlock().setup();
    new SetHeapEntryBlock().setup();
    new PopBlock().setup();
    new PushBlock().setup();
}
