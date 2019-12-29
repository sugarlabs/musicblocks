function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
    // From https://stackoverflow.com/a/34749873
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}


class BaseBlock extends ProtoBlock {
    constructor(name) {
        super(name);

        this.macroFunc = null;
        this._style = {}
    }

    setPalette(palette) {
        this.palette = palettes.dict[palette]
    }

    formBlock(style, adjustWidth=true) {
        mergeDeep(this._style, style);
        this._style.args = this._style.args || 0;
        this._style.argTypes = this._style.argTypes || [];
        this._style.argLabels = this._style.argLabels || [];
        this._style.argDefaults = this._style.argDefaults || [];
        this._style.flows = this._style.flows || {}
        this._style.flows.labels = this._style.flows.labels || [];

        let that = this;
        const debugLog = function () {
            return;  // Silence logging
            console.log(...arguments);
        };

        if (this._style.flows.labels.length > 0) {
            if (this._style.flows.type === 'arg')
                this.style = 'argclamp';
            else if (this._style.flows.type === 'value')
                this.style = 'value';
            else if (this._style.flows.labels.length == 2)
                this.style = 'doubleclamp';
            else
                this.style = 'clamp';
            this.expandable = true;
        } else {
            if (this._style.args === 1)
                this.style = 'arg';
            else if (this._style.args === 2)
                this.style = 'twoarg';
        }
        this.args = (
            this._style.args === 'onebool' ? 1
                : this._style.args === 'twobool' ? 2
                    : this._style.args
        ) + this._style.flows.labels.length;
        this.size = this._style.flows.labels.length + 1;
        if (this._style.args === 'onebool' || this._style.args === 'twobool') this.size++;
        else this.size += Math.max(0, this._style.args - 1);

        this.staticLabels = [this._style.name || ''];
        this.dockTypes = [];
        this.defaults = [];
        this._style.flows.labels.forEach(i => this.staticLabels.push(i));
        this._style.argLabels.forEach(i => this.staticLabels.push(i));

        if (this._style.flows.left)
            this.dockTypes.push(this._style.outType || 'numberout');
        if (this._style.flows.top)
            this.dockTypes.push(this._style.flows.top === 'cap' ? 'unavailable' : 'out');
        if (this._style.args === 'onebool' || this._style.args === 'twobool')
            this.dockTypes.push('booleanin');
        if (this._style.args === 'twobool')
            this.dockTypes.push('booleanin');
        if (typeof this._style.args === 'number')
            for (let i = 0; i < this._style.args; i++) {
                this.dockTypes.push(this._style.argTypes[i] || 'numberin');
                if (i < this._style.argDefaults.length)
                    this.defaults.push(this._style.argDefaults[i]);
            }
        if (this._style.flows.type === 'arg')
            for (let i = 0; i < this._style.flows.labels.length; i++)
                this.dockTypes.push(this._style.flows.types[i] || 'numberin');
        for (let i = 0; i < this._style.flows.labels.length; i++)
            this.dockTypes.push('in');
        if (this._style.flows.bottom)
            this.dockTypes.push(this._style.flows.bottom === 'tail' ? 'unavailable' : 'in');

        this.generator = function () {
            debugLog(':: generating block', this.name);
            debugLog('dockTypes:', this.dockTypes);
            debugLog('args:', this.args);
            debugLog('size:', this.size);
            debugLog('style:', this.style);

            var svg = new SVG();
            svg.init();
            svg.setScale(this.scale);

            if (this._style.flows.top === 'cap') {
                svg.setCap(true);
                debugLog('setCap true');
            } else {
                svg.setSlot(this._style.flows.top);
                debugLog('setSlot', this._style.flows.top);
            }

            if (this._style.flows.bottom === 'tail') {
                svg.setTail(true);
                debugLog('setTail true')
            } else if (this._style.flows.bottom) {
                svg.setTab(true);
                debugLog('setTab true')
            }
            if (this._style.flows.left) {
                svg.setOutie(true);
                debugLog('setOutie true')
            }

            let pad = (this._style.args === 'onebool' || this._style.args === 'twobool') ? 15 :
                    (this._style.flows.type === 'value') ? 60 : 20;
            if (!this._style.flows.type) pad += 20;
            svg.setExpand(pad + this.extraWidth, 0, 0, 0);
            debugLog('setExpand', pad + this.extraWidth, 0, 0, 0);

            for (let i = 0; i < arguments.length; i++)
                svg.setClampSlots(i, arguments[arguments.length - i - 1] || 1);
            for (let i = arguments.length; i < this._style.flows.labels.length; i++)
                svg.setClampSlots(i, 1);
            svg.setClampCount(this._style.flows.labels.length);

            if (this._style.args === 'onebool') {
                svg.setBoolean(true)
                debugLog('setBoolean', true);
            } else if (typeof this._style.args === 'number') {
                svg.setInnies(Array(this._style.args).fill(true));
                debugLog('setInnies', Array(this._style.args).fill(true))
            }

            // Make space for the expand icon
            if (this._style.canCollapse)
                svg.setLabelOffset(15);

            if (this.fontsize)
                svg.setFontSize(this.fontsize);

            let artwork;
            if (this._style.flows.type === 'arg') {
                artwork = svg.argClamp();
                debugLog('artwork = argClamp');
            } else if (this._style.flows.type === 'flow') {
                artwork = svg.basicClamp();
                debugLog('artwork = basicClamp');
            } else if (this._style.args === 'twobool') {
                artwork = svg.booleanAndOr();
                debugLog('artwork = booleanAndOr');
            } else if (this._style.flows.type === 'value') {
                artwork = svg.basicBox();
                debugLog('artwork = basicBox');
            } else {
                artwork = svg.basicBlock();
                debugLog('artwork = basicBlock');
            }
            debugLog('generation complete', svg.docks)
            let clickHeight;
            if (this._style.flows.top || this._style.flows.bottom)
                clickHeight = svg.docks[svg.docks.length - this._style.flows.labels.length - 1][1];
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

    changeName(name) {
        this.name = name;
    }

    setup() {
        blocks.protoBlockDict[this.name] = this;
        if (beginnerMode && !beginnerBlock(this.name)) {
            this.hidden = true;
        }
        this.palette.add(this);
    }

    flow() {
        return [];
    }

    arg() {
        return null;
    }
}


class ValueBlock extends BaseBlock {
    constructor(name) {
        super(name);

        this.formBlock({
            flows: {
                left: true, type: 'value'
            }
        }, false);
    }
}


class FlowBlock extends BaseBlock {
    constructor(name) {
        super(name);

        this.formBlock({
            flows: {
                top: true, bottom: true
            }
        }, false);
    }
}


class FlowClampBlock extends FlowBlock {
    constructor(name) {
        super(name);

        this.formBlock({
            flows: {
                type: 'flow', labels: ['']
            }
        }, false);
    }
}


class StackClampBlock extends BaseBlock {
    constructor(name) {
        super(name);

        this.extraWidth = 40;
        this.formBlock({
            flows: {
                top: 'cap', bottom: 'tail',
                type: 'flow', labels: ['']
            }
        }, false);
    }
}
