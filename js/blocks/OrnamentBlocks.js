// Copyright (c) 2019 Bottersnike
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, ValueBlock, NOINPUTERRORMSG, NANERRORMSG, last, Singer,
   FlowClampBlock
 */

/* exported setupOrnamentBlocks */

const setupOrnamentBlocks = (activity) => {
    class StaccatoFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: the duration of a note played as staccato
            super("staccatofactor", _("staccato factor"));
            this.parameter = true;
            this.setPalette("ornament", activity);
            this.setHelpString();
            this.hidden = true;
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "staccato"]);
            } else if (tur.singer.staccato.length > 0) {
                return last(tur.singer.staccato);
            } else {
                return 0;
            }
        }
    }

    class SlurFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: the degree of overlap of notes played as legato
            super("slurfactor", _("slur factor"));
            this.setPalette("ornament", activity);
            this.setHelpString();
            this.parameter = true;
            this.hidden = true;
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "slur"]);
            } else if (tur.singer.staccato.length > 0) {
                return -last(tur.singer.staccato);
            } else {
                return 0;
            }
        }
    }

    class NeighborBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "neighbor");
            this.setPalette("ornament", activity);
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
            this.setHelpString();
            this.formBlock({
                //.TRANS: the neighbor refers to a neighboring note, e.g., D is a neighbor of C
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
                activity.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            }

            Singer.OrnamentActions.doNeighbor(args[0], args[1], turtle, blk);

            return [args[2], 1];
        }
    }

    class Neighbor2Block extends NeighborBlock {
        constructor() {
            super("neighbor2");
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Neighbor block rapidly switches between neighboring pitches."),
                "documentation",
                null,
                "neighbor2help"
            ]);

            this.formBlock({
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
            this.setPalette("ornament", activity);
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
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 16;
            } else {
                arg = args[0];
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.glide.push(arg);

            if (tur.singer.justCounting.length === 0) {
                logo.notation.notationBeginSlur(turtle);
            }

            tur.singer.glideOverride = Singer.noteCounter(logo, turtle, args[1]);
            // eslint-disable-next-line no-console
            console.debug("length of glide " + tur.singer.glideOverride);

            const listenerName = "_glide_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = event => {
                if (tur.singer.justCounting.length === 0) {
                    logo.notation.notationEndSlur(turtle);
                }

                tur.singer.glide.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class SlurBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "slur");
            this.setPalette("ornament", activity);
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
            if (args[1] === undefined)
                return;

            let arg = args[0];
            if (arg === null || typeof arg !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 16;
            }

            Singer.OrnamentActions.setSlur(arg, turtle, blk);

            return [args[1], 1];
        }
    }

    class StaccatoBlock extends FlowClampBlock {
        constructor(name) {
            super(name || "staccato");
            this.setPalette("ornament", activity);
            this.setHelpString();
            this.formBlock({
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
            if (args[1] === undefined)
                return;

            let arg = args[0];
            if (arg === null || typeof arg !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 32;
            }

            Singer.OrnamentActions.setStaccato(arg, turtle, blk);

            return [args[1], 1];
        }
    }

    class NewSlurBlock extends SlurBlock {
        constructor() {
            super("newslur");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Slur block lengthens the sustain of notes while maintaining the specified rhythmic value of the notes."),
                "documentation",
                null,
                "slurhelp"
            ]);

            this.formBlock({
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
                _("The Staccato block shortens the length of the actual note while maintaining the specified rhythmic value of the notes."),
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

    new StaccatoFactorBlock().setup(activity);
    new SlurFactorBlock().setup(activity);
    new NeighborBlock().setup(activity);
    new Neighbor2Block().setup(activity);
    new GlideBlock().setup(activity);
    new SlurBlock().setup(activity);
    new StaccatoBlock().setup(activity);
    new NewSlurBlock().setup(activity);
    new NewStaccatoBlock().setup(activity);
}
