function setupOrnamentBlocks() {
    class StaccatoFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: the duration of a note played as staccato
            super("staccatofactor", _("staccato factor"));
            this.parameter = true;
            this.setPalette("ornament");
            this.setHelpString();
            this.hidden = true;
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "staccato"]);
            } else if (logo.staccato[turtle].length > 0) {
                return last(logo.staccato[turtle]);
            } else {
                return 0;
            }
        }
    }

    class SlurFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: the degree of overlap of notes played as legato
            super("slurfactor", _("slur factor"));
            this.setPalette("ornament");
            this.setHelpString();
            this.parameter = true;
            this.hidden = true;
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "slur"]);
            } else if (logo.staccato[turtle].length > 0) {
                return -last(logo.staccato[turtle]);
            } else {
                return 0;
            }
        }
    }

    class NeighborBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "neighbor");
            this.setPalette("ornament");
            this.setHelpString();
            this.formBlock({
                //.TRANS: the neigbor refers to a neighboring note, e.g., D is a neighbor of C
                name: _("neighbor") + " (+/–)",
                args: 2,
                defaults: [1, 1 / 16],
                argLabels: [_("semi-tone interval"), _("note value")]
            });
            this.makeMacro((x, y) => [
                [0, "neighbor", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 16 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (typeof args[0] !== "number" || typeof args[1] !== "number") {
                logo.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            }

            logo.inNeighbor[turtle].push(blk);
            logo.neighborStepPitch[turtle].push(args[0]);
            logo.neighborNoteValue[turtle].push(args[1]);

            let listenerName = "_neighbor_" + turtle + "_" + blk;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.inNeighbor[turtle].pop();
                logo.neighborStepPitch[turtle].pop();
                logo.neighborNoteValue[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    class Neighbor2Block extends NeighborBlock {
        constructor() {
            super("neighbor2");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Neighbor block rapidly switches between neighboring pitches."
                ),
                "documentation",
                null,
                "neighbor2help"
            ]);

            this.formBlock({
                //.TRANS: the neigbor refers to a neighboring note, e.g., D is a neighbor of C
                name: _("neighbor") + " (+/–)",
                args: 2,
                defaults: [1, 1 / 16],
                argLabels: [_("scalar interval"), _("note value")]
            });
            this.makeMacro((x, y) => [
                [0, "neighbor2", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 16 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class GlideBlock extends FlowClampBlock {
        constructor() {
            super("glide");
            this.setPalette("ornament");
            this.setHelpString();
            this.formBlock({
                //.TRANS: glide (glissando) is a blended overlap successive notes
                name: _("glide"),
                args: 1,
                defaults: [1 / 16]
            });
            this.makeMacro((x, y) => [
                [0, "glide", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 16 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            // TODO: Duration should be the sum of all the notes (like
            // in a tie). If we set the synth portamento and use
            // setNote for all but the first note, it should produce a
            // glissando.
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 16;
            } else {
                arg = args[0];
            }

            logo.glide[turtle].push(arg);

            if (logo.justCounting[turtle].length === 0) {
                logo.notationBeginSlur(turtle);
            }

            logo.glideOverride[turtle] = logo._noteCounter(turtle, args[1]);
            console.debug("length of glide " + logo.glideOverride[turtle]);

            let listenerName = "_glide_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                if (logo.justCounting[turtle].length === 0) {
                    logo.notationEndSlur(turtle);
                }

                logo.glide[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class SlurBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "slur");
            this.setPalette("ornament");
            this.setHelpString();
            this.formBlock({
                //.TRANS: slur or legato is an overlap successive notes
                name: _("slur"),
                args: 1,
                defaults: [16]
            });
            this.makeMacro((x, y) => [
                [0, "slur", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 16 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 16;
            } else {
                arg = args[0];
            }

            if (logo.blocks.blockList[blk].name === "slur") {
                logo.staccato[turtle].push(-arg);
            } else {
                logo.staccato[turtle].push(-1 / arg);
            }

            if (logo.justCounting[turtle].length === 0) {
                logo.notationBeginSlur(turtle);
            }

            let listenerName = "_staccato_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.staccato[turtle].pop();
                if (logo.justCounting[turtle].length === 0) {
                    logo.notationEndSlur(turtle);
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class StaccatoBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "staccato");
            this.setPalette("ornament");
            this.setHelpString();
            this.formBlock({
                //.TRANS: play each note sharply detached from the others
                name: _("staccato"),
                args: 1,
                defaults: [32]
            });
            this.makeMacro((x, y) => [
                [0, "staccato", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 32 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }
          
            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 32;
            } else {
                arg = args[0];
            }

            if (logo.blocks.blockList[blk].name === "newstaccato") {
                logo.staccato[turtle].push(1 / arg);
            } else {
                logo.staccato[turtle].push(arg);
            }

            let listenerName = "_staccato_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.staccato[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class NewSlurBlock extends SlurBlock {
        constructor() {
            super("newslur");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Slur block lengthens the sustain of notes while maintaining the specified rhythmic value of the notes."
                ),
                "documentation",
                null,
                "slurhelp"
            ]);

            this.formBlock({
                //.TRANS: legato: overlap successive notes
                name: _("slur"),
                args: 1,
                defaults: [1 / 16]
            });
            this.makeMacro((x, y) => [
                [0, "newslur", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 16 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = false;
        }
    }

    class NewStaccatoBlock extends StaccatoBlock {
        constructor() {
            super("newstaccato");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Staccato block shortens the length of the actual note while maintaining the specified rhythmic value of the notes."
                ),
                "documentation",
                null,
                "staccatohelp"
            ]);

            this.formBlock({
                //.TRANS: play each note sharply detached from the others
                name: _("staccato"),
                args: 1,
                defaults: [1 / 32]
            });
            this.makeMacro((x, y) => [
                [0, "newstaccato", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 32 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = false;
        }
    }

    new StaccatoFactorBlock().setup();
    new SlurFactorBlock().setup();
    new NeighborBlock().setup();
    new Neighbor2Block().setup();
    new GlideBlock().setup();
    new SlurBlock().setup();
    new StaccatoBlock().setup();
    new NewSlurBlock().setup();
    new NewStaccatoBlock().setup();
}
