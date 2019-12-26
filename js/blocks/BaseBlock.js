class BaseBlock extends ProtoBlock {
    constructor(name) {
        super(name);

        this.macroFunc = null;

        blocks.protoBlockDict[this.name] = this;
        if (beginnerMode && !beginnerBlock(this.name)) {
            this.hidden = true;
        }
    }

    setPalette(palette) {
        this.palette = palettes.dict[palette]
        this.palette.add(this);
    }

    makeMacro(macroFunc) {
        this.macroFunc = macroFunc;
    }

    flow() {
        return [];
    }

    arg() {
        return null;
    }
}
