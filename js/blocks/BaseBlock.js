function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
};


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
};


class BaseBlock extends ProtoBlock {
    constructor(name) {
        super(name);

        this.macroFunc = null;
        this._style = {}

        // Just for brevity
        this.lang = localStorage.languagePreference || navigator.language;
    }

    setPalette(palette) {
        this.palette = palettes.dict[palette]
    }

    formBlock(style) {
        mergeDeep(this._style, style);
        this._style.args = this._style.args || 0;
        this._style.argTypes = this._style.argTypes || [];
        this._style.argLabels = this._style.argLabels || [];
        this._style.defaults = this._style.defaults || [];
        this._style.flows = this._style.flows || {}
        this._style.flows.labels = this._style.flows.labels || [];

	if (this._style.args > 1) {
	    this.expandable = true;
	}

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
            if (this._style.flows.type === 'value')
                this.style = 'value';
            else if (this._style.flows.left) {
                this.style = 'arg';
                this.parameter = true;
            } else if (this._style.args === 2)
                this.style = 'twoarg';
        }

	if (this._style.flows.type === 'value' && this._style.args === 2)
	    this.expandable = true;

        this.args = this._style.flows.labels.length + this._style.args;
	if (this.size === 0) {
	} else {
            this.size = 1 + this._style.flows.labels.length;
	}
        if (this._style.argTypes[0] === 'booleanin') this.size++;
        else if (this._style.argTypes[1] === 'booleanin') this.size++;
        else this.size += Math.max(0, this._style.args - 1);
        if (this._style.flows.type === 'arg') this.size++;
        if (this._style.image) {
            this.size++;
            this.image = this._style.image;
        }

        this.staticLabels = [this._style.name || ''];
        this.dockTypes = [];
        this.defaults = [];
        this._style.argLabels.forEach(i => this.staticLabels.push(i));
        this._style.flows.labels.forEach(i => this.staticLabels.push(i));

        if (this._style.flows.left)
            this.dockTypes.push(this._style.outType || 'numberout');
        if (this._style.flows.top)
            this.dockTypes.push(this._style.flows.top === 'cap' ? 'unavailable' : 'out');
        if (typeof this._style.args === 'number')
            for (let i = 0; i < this._style.args; i++) {
                this.dockTypes.push(this._style.argTypes[i] || 'numberin');
                if (i < this._style.defaults.length)
                    this.defaults.push(this._style.defaults[i]);
            }
        if (this._style.flows.type === 'arg')
            for (let i = 0; i < this._style.flows.labels.length; i++)
                this.dockTypes.push(this._style.flows.types[i] || 'numberin');
        for (let i = 0; i < this._style.flows.labels.length; i++)
            this.dockTypes.push('in');
        if (this._style.flows.bottom)
            this.dockTypes.push(this._style.flows.bottom === 'tail' ? 'unavailable' : 'in');

        this.generator = function () {
            var svg = new SVG();
            svg.init();
            svg.setScale(this.scale);

            if (this._style.flows.top === 'cap')
                svg.setCap(true);
            else
                svg.setSlot(this._style.flows.top);

            if (this._style.flows.bottom === 'tail')
                svg.setTail(true);
            else if (this._style.flows.bottom)
                svg.setTab(true);
            if (this._style.flows.left)
                svg.setOutie(true);

            let pad = (this._style.flows.type === 'value') ? 60 : 20;
            if (!this._style.flows.type) pad += 10;
            if (this._style.outType === 'booleanout' && this._style.args === 2) pad -= 30;
            else if (this._style.argTypes[0] === 'booleanin') pad -= 5;
            if (this.size !== 0)
                svg.setExpand(pad + this.extraWidth, this.image ? 23 : 0, 0,
                    this._style.outType === 'booleanout' && !this._style.args ? 4 : 0);

            for (let i = arguments.length; i < this._style.flows.labels.length; i++)
                svg.setClampSlots(i, 1);
            svg.setClampCount(this._style.flows.labels.length);

            for (let i = 0; i < arguments.length; i++) {
		if (this._style.flows.type == undefined) {
		    svg.setExpand(30 + this.extraWidth, (arguments[arguments.length - i - 1] - 1) * STANDARDBLOCKHEIGHT / 2, 0, 0);
		} else if (this._style.flows.type == 'value') {
		    svg.setExpand(30 + this.extraWidth, (arguments[arguments.length - i - 1] - 1) * STANDARDBLOCKHEIGHT / 2, 0, 0);
		} else {
                    svg.setClampSlots(i, arguments[arguments.length - i - 1] || 1);
		}
	    }

            if (this._style.argTypes[0] === 'booleanin') {
                svg.setBoolean(true)
            } else if (typeof this._style.args === 'number') {
                svg.setInnies(Array(this._style.args).fill(true));
            }

            // Make space for the expand icon
            if (this._style.canCollapse)
                svg.setLabelOffset(15);

            if (this.fontsize)
                svg.setFontSize(this.fontsize);

            let artwork;
            if (this._style.flows.type === 'arg') {
                artwork = svg.argClamp();
            } else if (this._style.flows.type === 'flow') {
                artwork = svg.basicClamp();
            } else if (this._style.outType === 'booleanout') {
                if (this._style.args === 1 || !this._style.args) {
                    artwork = svg.booleanNot(!this._style.args);
                } else if (this._style.argTypes[0] === 'booleanin') {
                    artwork = svg.booleanAndOr();
                } else {
                    artwork = svg.booleanCompare();
                }
            } else if (this._style.flows.type === 'value') {
                artwork = svg.basicBox();
            } else {
                artwork = svg.basicBlock();
            }
            // If the block has 0 size, clear out the artwork
            if (this.size === 0) {
                artwork = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><text style="font-size:10px;fill:#000000;font-family:sans-serif;text-anchor:end"><tspan x="46.333333333333336" y="13.5">block_label</tspan></text></svg>';
                svg.docks[1][1] = svg.docks[0][1];
	    }
            let clickHeight;
            if (this._style.flows.top || this._style.flows.bottom)
                clickHeight = svg.docks[svg.docks.length - this._style.flows.labels.length - 1][1];
            else
                clickHeight = svg.getHeight();
            if (this.size === 0) return [artwork, svg.docks, 0, 0, 0];
            return [artwork, svg.docks, svg.getWidth(), svg.getHeight(), clickHeight];
        };

    }

    makeMacro(macroFunc) {
        this.macroFunc = macroFunc;
    }

    changeName(name) {
        this.name = name;
    }

    beginnerBlock(value) {
        this.beginnerBlock = value;
    }

    setup() {
        blocks.protoBlockDict[this.name] = this;
        if (beginnerMode && !beginnerBlock(this.name)) {
            this.hidden = true;
        }
        if (this._style.name)
            this.adjustWidthToLabel();
        if (!this.palette)
            console.warn('Block ' + this.name + ' was not added to a palette!');
        else
            this.palette.add(this);
    }
}


class ValueBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

        this.formBlock({
            name: displayName,
            flows: {
                left: true, type: 'value'
            }
        }, !!displayName);
    }
}


class BooleanBlock extends BaseBlock {
    constructor(name) {
        super(name);

        this.formBlock({
            flows: {
                left: true, type: 'value'
            },
            outType: 'booleanout'
        });
    }
}


class BooleanSensorBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

        this.formBlock({
            name: displayName,
            flows: {
                left: true, type: 'value'
            },
            outType: 'booleanout'
        });
    }
}


class FlowBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

        this.formBlock({
            name: displayName,
            flows: {
                top: true, bottom: true
            }
        }, !!displayName);
    }
}


class LeftBlock extends BaseBlock {
    constructor(name, displayName) {
        super(name);
        displayName = displayName || undefined;

        this.formBlock({
            name: displayName,
            flows: {
                left: true, type: null
            }
        }, !!displayName);
    }
}


class FlowClampBlock extends FlowBlock {
    constructor(name) {
        super(name);

        this.extraWidth = 20;
        this.formBlock({
            flows: {
                type: 'flow', labels: ['']
            }
        });
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
        });
    }
}
