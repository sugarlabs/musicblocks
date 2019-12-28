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

    formBlock(style, adjustWidth=true) {
        style.args = style.args || 0;
        style.argTypes = style.argTypes || [];
        style.argLabels = style.argLabels || [];
        style.argDefaults = style.argDefaults || [];
        style.flows = style.flows || {}
        style.flows.labels = style.flows.labels || [];

        let that = this;
        const debugLog = function () {
            return;  // Silence logging
            console.log(...arguments);
        };

        if (style.flows.labels.length > 0) {
            if (style.flows.type === 'arg')
                this.style = 'argclamp';
            else if (style.flows.type === 'value')
                this.style = 'value';
            else if (style.flows.labels.length == 2)
                this.style = 'doubleclamp';
            else
                this.style = 'clamp';
            this.expandable = true;
        } else {
            if (style.args === 1)
                this.style = 'arg';
            else if (style.args === 2)
                this.style = 'twoarg';
        }
        this.args = (
            style.args === 'onebool' ? 1
                : style.args === 'twobool' ? 2
                    : style.args
        ) + style.flows.labels.length;
        this.size = style.flows.labels.length + 1;
        if (style.args === 'onebool' || style.args === 'twobool') this.size++;
        else this.size += Math.max(0, style.args - 1);

        this.staticLabels = [style.name];
        this.dockTypes = [];
        this.defaults = [];
        style.flows.labels.forEach(i => this.staticLabels.push(i));
        style.argLabels.forEach(i => this.staticLabels.push(i));

        if (style.flows.left)
            this.dockTypes.push(style.outType || 'numberout');
        if (style.flows.top)
            this.dockTypes.push(style.flows.top === 'cap' ? 'unavailable' : 'out');
        if (style.args === 'onebool' || style.args === 'twobool')
            this.dockTypes.push('booleanin');
        if (style.args === 'twobool')
            this.dockTypes.push('booleanin');
        if (typeof style.args === 'number')
            for (let i = 0; i < style.args; i++) {
                this.dockTypes.push(style.argTypes[i] || 'numberin');
                this.defaults.push(style.argDefaults[i]);
            }
        if (style.flows.type === 'arg')
            for (let i = 0; i < style.flows.labels.length; i++)
                this.dockTypes.push(style.flows.types[i] || 'numberin');
        for (let i = 0; i < style.flows.labels.length; i++)
            this.dockTypes.push('in');
        if (style.flows.bottom)
            this.dockTypes.push(style.flows.bottom === 'tail' ? 'unavailable' : 'in');

        this.generator = function () {
            debugLog(':: generating block', this.name);
            debugLog('dockTypes:', this.dockTypes);
            debugLog('args:', this.args);
            debugLog('size:', this.size);
            debugLog('style:', this.style);

            var svg = new SVG();
            svg.init();
            svg.setScale(this.scale);

            if (style.flows.top === 'cap') {
                svg.setCap(true);
                debugLog('setCap true');
            } else {
                svg.setSlot(style.flows.top);
                debugLog('setSlot', style.flows.top);
            }

            if (style.flows.bottom === 'tail') {
                svg.setTail(true);
                debugLog('setTail true')
            } else if (style.flows.bottom) {
                svg.setTab(true);
                debugLog('setTab true')
            }
            if (style.flows.left) {
                svg.setOutie(true);
                debugLog('setOutie true')
            }

            let pad = (style.args === 'onebool' || style.args === 'twobool') ? 15 :
                    (style.flows.type === 'value') ? 60 : 20;
            if (!style.flows.type) pad += 20;
            svg.setExpand(pad + this.extraWidth, 0, 0, 0);
            debugLog('setExpand', pad + this.extraWidth, 0, 0, 0);

            for (let i = 0; i < arguments.length; i++)
                svg.setClampSlots(i, arguments[arguments.length - i - 1] || 1);
            for (let i = arguments.length; i < style.flows.labels.length; i++)
                svg.setClampSlots(i, 1);
            svg.setClampCount(style.flows.labels.length);

            if (style.args === 'onebool') {
                svg.setBoolean(true)
                debugLog('setBoolean', true);
            } else if (typeof style.args === 'number') {
                svg.setInnies(Array(style.args).fill(true));
                debugLog('setInnies', Array(style.args).fill(true))
            }

            // Make space for the expand icon
            if (style.canCollapse)
                svg.setLabelOffset(15);

            if (this.fontsize)
                svg.setFontSize(this.fontsize);

            let artwork;
            if (style.flows.type === 'arg') {
                artwork = svg.argClamp();
                debugLog('artwork = argClamp');
            } else if (style.flows.type === 'flow') {
                artwork = svg.basicClamp();
                debugLog('artwork = basicClamp');
            } else if (style.args === 'twobool') {
                artwork = svg.booleanAndOr();
                debugLog('artwork = booleanAndOr');
            } else if (style.flows.type === 'value') {
                artwork = svg.basicBox();
                debugLog('artwork = basicBox');
            } else {
                artwork = svg.basicBlock();
                debugLog('artwork = basicBlock');
            }
            debugLog('generation complete', svg.docks)
            let clickHeight;
            if (style.flows.top || style.flows.bottom)
                clickHeight = svg.docks[svg.docks.length - style.flows.labels.length - 1][1];
            else
                clickHeight = svg.getHeight();
            return [artwork, svg.docks, svg.getWidth(), svg.getHeight(), clickHeight];
        }

        if (adjustWidth)
            this.adjustWidthToLabel();
    }

    makeMacro(macroFunc) {
        this.macroFunc = macroFunc;
    }

    changeName(blockName) {
        this.staticLabels[0] = blockName;
    }

    flow() {
        return [];
    }

    arg() {
        return null;
    }
}
