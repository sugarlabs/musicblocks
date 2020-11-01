function _getDict(target, logo, turtle, k) {
    // This is the internal turtle dictionary that
    // includes the turtle status.
    if (k === _('color')) {
        return logo.turtles.turtleList[target].painter.color;
    } else if (k === _('shade')) {
        return logo.turtles.turtleList[target].painter.value;
    } else if (k === _('grey')) {
        return logo.turtles.turtleList[target].painter.chroma;
    } else if (k === _('pen size')) {
        return logo.turtles.turtleList[target].painter.pensize;
    } else if (k === _('font')) {
        return logo.turtles.turtleList[target].painter.font;
    } else if (k === _('heading')) {
        return logo.turtles.turtleList[target].painter.heading;
    } else if (k === "x") {
        return logo.turtles.screenX2turtleX(logo.turtles.turtleList[target].container.x);
    } else if (k === "y") {
        return logo.turtles.screenY2turtleY(logo.turtles.turtleList[target].container.y);
    } else {
        if (target in logo.turtleDicts[turtle]) {
            return logo.turtleDicts[turtle][target][k];
        }
    }
    return 0;
}


function _setDict(target, logo, turtle, k, v) {
    // This is the internal turtle dictionary that
    // includes the turtle status.
    if (k === _('color')) {
        logo.turtles.turtleList[target].painter.doSetColor(v);
    } else if (k === _('shade')) {
        logo.turtles.turtleList[target].painter.doSetValue(v);
    } else if (k === _('grey')) {
        logo.turtles.turtleList[target].painter.doSetChroma(v);
    } else if (k === _('pen size')) {
        logo.turtles.turtleList[target].painter.doSetPensize(v);
    } else if (k === _('font')) {
        logo.turtles.turtleList[target].painter.doSetFont(v);
    } else if (k === _('heading')) {
        logo.turtles.turtleList[target].painter.doSetHeading(v);
    } else if (k === "y") {
        let x = logo.turtles.screenX2turtleX(logo.turtles.turtleList[target].container.x);
        logo.turtles.turtleList[target].painter.doSetXY(x, v);
    } else if (k === "x") {
        let y = logo.turtles.screenY2turtleY(logo.turtles.turtleList[target].container.y);
        logo.turtles.turtleList[target].painter.doSetXY(v, y);
    } else {
        if (!(target in logo.turtleDicts[turtle])) {
            logo.turtleDicts[turtle][target] = {};
        }
        logo.turtleDicts[turtle][target][k] = v;
    }
    return;
}


function _serializeDict(target, logo, turtle) {
    // This is the internal turtle dictionary that includes the turtle
    // status.
    let this_dict = {};
    this_dict[_('color')] = logo.turtles.turtleList[target].painter.color;
    this_dict[_('shade')] = logo.turtles.turtleList[target].painter.value;
    this_dict[_('grey')] = logo.turtles.turtleList[target].painter.chroma;
    this_dict[_('pen size')] = logo.turtles.turtleList[target].painter.stroke;
    this_dict[_('font')] = logo.turtles.turtleList[target].painter.font;
    this_dict[_('heading')] = logo.turtles.turtleList[target].painter.orientation;
    this_dict["y"] = logo.turtles.screenY2turtleY(logo.turtles.turtleList[target].container.y);
    this_dict["x"] = logo.turtles.screenX2turtleX(logo.turtles.turtleList[target].container.x);
    if (target in logo.turtleDicts[turtle]) {
        for(let k in logo.turtleDicts[turtle][target]) {
            this_dict[k] = logo.turtleDicts[turtle][target][k];
        }
    }
    return JSON.stringify(this_dict);
}


function setupDictBlocks() {
    class ShowDictBlock extends FlowBlock {
        constructor() {
            super("showDict");
            this.setPalette("dict");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Show-dictionary block displays the contents of the dictionary at the top of the screen."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Display the dictionary contents
                name: _("show dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")]
            });
        }

        flow(args, logo, turtle, receivedArg) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let a = args[0];
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                logo.textMsg(_serializeDict(target, logo, turtle));
                return;
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            logo.textMsg(JSON.stringify(logo.turtleDicts[turtle][a]));
        }
    }

    class DictBlock extends LeftBlock {
        constructor() {
            super("dictionary");
            this.setPalette("dict");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Dictionary block returns a dictionary."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                return _serializeDict(target, logo, turtle);
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            return JSON.stringify(logo.turtleDicts[turtle][a]);
        }
    }

    class GetDictBlock extends LeftBlock {
        constructor() {
            super("getDict");
            this.setPalette("dict");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Get-dict block returns a value in the dictionary for a specified key."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: retrieve a value from the dictionary with a given key
                name: _("get value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [_("name"), _("key")],
                defaults: [_("My Dictionary"), _('key')]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            let k = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                return _getDict(target, logo, turtle, k);
            } else if (!(a in logo.turtleDicts[turtle])) {
                return 0;
            }

            return logo.turtleDicts[turtle][a][k];
        }
    }

    class SetDictBlock extends FlowBlock {
        constructor() {
            super("setDict");
            this.setPalette("dict");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set-dict block sets a value in the dictionary for a specified key."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: set a value in the dictionary for a given key
                name: _("set value"),
                args: 3,
                argTypes: ["anyin", "anyin", "anyin"],
                argLabels: [_("name"), _("key"), _("value")],
                defaults: [_("My Dictionary"), _('key'), 0]
            });
        }

        flow(args, logo, turtle, receivedArg) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[2] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let a = args[0];
            let k = args[1];
            let v = args[2];

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                _setDict(target, logo, turtle, k, v);
                return;
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            logo.turtleDicts[turtle][a][k] = v;
        }

        return;
    }

    new DictBlock().setup();
    new ShowDictBlock().setup();
    new SetDictBlock().setup();
    new GetDictBlock().setup();
}
