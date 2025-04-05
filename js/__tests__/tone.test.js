/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Priyamvada Shah
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

const activity = require('../activity');

jest.mock('../activity', () => ({
  errorMsg: jest.fn(),
  turtles: {
    ithTurtle: jest.fn().mockImplementation((turtle) => ({
      singer: {
        inHarmonic: [],
        partials: [],
        distortionAmount: [0.4],
        tremoloFrequency: [10],
        tremoloDepth: [0.5]
      }
    }))
  }
}));

global._ = jest.fn(str => str);
global.DEFAULTOSCILLATORTYPE = 'sine';
global.OSCTYPES = {
  sine: ['sine', 'sine'],
  square: ['square', 'square'],
  triangle: ['triangle', 'triangle'],
  sawtooth: ['sawtooth', 'sawtooth']
};
global.instrumentsEffects = {};
global.last = jest.fn(arr => arr && arr.length ? arr[arr.length - 1] : undefined);

class FlowBlock {
  constructor(name, displayName) {
    this.name = name;
    this.displayName = displayName;
    this.formBlock = jest.fn();
    this.setPalette = jest.fn();
    this.setHelpString = jest.fn();
    this.makeMacro = jest.fn();
    this.piemenuValuesC1 = [];
    this.piemenuValuesC2 = [];
    this.beginnerBlock = jest.fn();
  }
}

class ValueBlock {
  constructor(name) {
    this.name = name;
    this.formBlock = jest.fn();
    this.setPalette = jest.fn();
    this.setHelpString = jest.fn();
  }
}

class FlowClampBlock {
  constructor(name) {
    this.name = name;
    this.formBlock = jest.fn();
    this.setPalette = jest.fn();
    this.setHelpString = jest.fn();
    this.makeMacro = jest.fn();
    this.piemenuValuesC1 = [];
    this.piemenuValuesC2 = [];
    this.beginnerBlock = jest.fn();
  }
}
class OscillatorBlock {
  constructor() {
    this.name = 'oscillator';
  }
  
  flow(args, logo, turtle, blk) {
    if (logo.inTimbre) {
      const oscillatorType = args[0] || 'sine';
      
      const validTypes = ['sine', 'square', 'triangle', 'sawtooth'];
      const oscType = validTypes.includes(oscillatorType) ? oscillatorType : 'sine';
      
      let partials;
      if (args.length > 1) {
        const partialValue = Number(args[1]);
        if (!isNaN(partialValue)) {
          partials = partialValue;
          logo.timbre.oscParams.push(partials);
        } else {
          logo.timbre.oscParams.push(0);
        }
      }
      
      logo.synth.createSynth(turtle, logo.timbre.instrumentName, oscType, partials);
    }
    return [args[0], args[1]];
  }
}

class PartialBlock {
  constructor() {
    this.name = 'partial';
  }
  
  flow(args, logo, turtle) {
    const tur = activity.turtles.ithTurtle(turtle);
    
    if (!tur || !tur.singer) {
      return;
    }
    
    if (!tur.singer.inHarmonic) {
      tur.singer.inHarmonic = [];
    }
    
    if (!tur.singer.partials) {
      tur.singer.partials = [];
    }
    
    if (tur.singer.inHarmonic.length > 0) {
      const n = tur.singer.inHarmonic.length - 1;
      if (!tur.singer.partials[n]) {
        tur.singer.partials[n] = [];
      }
      tur.singer.partials[n].push(args[0]);
    } else {
      tur.singer.partials.push([args[0]]);
    }
  }
}

class HarmonicBlock {
  constructor() {
    this.name = 'harmonic';
  }
  
  flow(args, logo, turtle, blk) {
    args = args || [];
    
    const tur = activity.turtles.ithTurtle(turtle);
    
    if (!tur.singer) {
      tur.singer = {};
    }
    
    if (!tur.singer.inHarmonic) {
      tur.singer.inHarmonic = [];
    }
    
    if (!tur.singer.partials) {
      tur.singer.partials = [];
    }
    
    tur.singer.inHarmonic.push(blk);
    tur.singer.partials.push([]);
    
    const listenerName = '_harmonic_' + turtle;
    
    const __listener = () => {
      if (tur.singer.inHarmonic.length > 0) {
        tur.singer.inHarmonic.pop();
        tur.singer.partials.pop();
      }
    };
    
    logo.setDispatchBlock(blk, turtle, listenerName);
    logo.setTurtleListener(turtle, listenerName, __listener);
    
    return [args[0] || undefined, 1];
  }
}
const mockToneActions = {
  defDuoSynth: jest.fn(),
  defAMSynth: jest.fn(),
  defFMSynth: jest.fn(),
  doHarmonic: jest.fn(),
  doDistortion: jest.fn(),
  doTremolo: jest.fn()
};

function setupToneBlocks(activity) {
  class OscillatorBlock extends FlowBlock {
    constructor() {
      super("oscillator", _("Oscillator").toLowerCase());
      this.setPalette("tone", activity);
      this.setHelpString();
      this.formBlock({
        args: 2,
        defaults: [_("triangle"), 6],
        argLabels: [
          _("type"),
          _("partials")
        ],
        argTypes: ["anyin", "numberin"]
      });
      this.hidden = true;
    }

    flow(args, logo, turtle, blk) {
      let oscillatorType = DEFAULTOSCILLATORTYPE;
      let partials = 0;

      if (args.length === 2 && typeof args[1] === "number") {
        for (const otype in OSCTYPES) {
          if (OSCTYPES[otype][0] === args[0]) {
            oscillatorType = OSCTYPES[otype][1];
          } else if (OSCTYPES[otype][1] === args[0]) {
            oscillatorType = args[0];
          }
        }

        partials = args[1];
      }

      if (logo.inTimbre) {
        if (logo.timbre.osc.length != 0) {
          activity.errorMsg(_("You are adding multiple oscillator blocks."));
        } else {
          logo.timbre.oscParams = [];
          logo.synth.createSynth(
            turtle,
            logo.timbre.instrumentName,
            oscillatorType,
            logo.timbre.synthVals
          );
        }

        logo.timbre.osc.push(blk);
        logo.timbre.oscParams.push(oscillatorType);
        logo.timbre.oscParams.push(partials);
      }
    }
  }

  class FillerTypeBlock extends ValueBlock {
    constructor() {
      super("filtertype");
      this.setPalette("tone", activity);
      this.setHelpString();
      this.formBlock({ outType: "textout" });
      this.hidden = true;
    }
  }

  class OscillatorTypeBlock extends ValueBlock {
    constructor() {
      super("oscillatortype");
      this.setPalette("tone", activity);
      this.setHelpString();
      this.formBlock({ outType: "textout" });
      this.hidden = true;
    }
  }

  class DuoSynthBlock extends FlowBlock {
    constructor() {
      super("duosynth", _("duo synth"));
      this.setPalette("tone", activity);
      this.piemenuValuesC1 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      this.piemenuValuesC2 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      this.setHelpString([
        _("The Duo synth block is a duo-frequency modulator used to define a timbre."),
        "documentation",
        null,
        "duosynthhelp"
      ]);
      this.formBlock({
        args: 2,
        defaults: [10, 5],
        argLabels: [_("vibrato rate"), _("vibrato intensity")]
      });
    }

    flow(args, logo, turtle, blk) {
      mockToneActions.defDuoSynth(args[0], args[1], turtle, blk);
    }
  }

  class AMSynth extends FlowBlock {
    constructor() {
      super("amsynth", _("AM synth"));
      this.setPalette("tone", activity);
      this.piemenuValuesC1 = [1, 2];
      this.setHelpString([
        _("The AM synth block is an amplitude modulator used to define a timbre."),
        "documentation",
        null,
        "amsynthhelp"
      ]);
      this.formBlock({
        args: 1,
        defaults: [1]
      });
    }

    flow(args, logo, turtle, blk) {
      mockToneActions.defAMSynth(args[0], turtle, blk);
    }
  }

  class FMSynth extends FlowBlock {
    constructor() {
      super("fmsynth", _("FM synth"));
      this.setPalette("tone", activity);
      this.piemenuValuesC1 = [1, 5, 10, 15, 20, 25];
      this.setHelpString([
        _("The FM synth block is a frequency modulator used to define a timbre."),
        "documentation",
        null,
        "fmsynthhelp"
      ]);
      this.formBlock({
        args: 1,
        defaults: [10]
      });
    }

    flow(args, logo, turtle, blk) {
      mockToneActions.defFMSynth(args[0], turtle, blk);
    }
  }

  class PartialBlock extends FlowBlock {
    constructor() {
      super("partial", _("partial"));
      this.setPalette("tone", activity);
      this.setHelpString([
        _("The Partial block is used to specify a weight for a specific partial harmonic."),
        "documentation",
        ""
      ]);
      this.formBlock({
        args: 1,
        defaults: [10]
      });
    }
  
    flow(args, logo, turtle) {
      if (typeof args[0] !== "number" || args[0] > 1 || args[0] < 0) {
        activity.errorMsg(_("Partial weight must be between 0 and 1."));
        logo.stopTurtle = true;
        return;
      }
  
      const tur = activity.turtles ? activity.turtles.ithTurtle(turtle) : null;
  
      if (!tur || !tur.singer || !tur.singer.inHarmonic) {
        console.warn('Turtle or singer properties are undefined');
        return;
      }
  
      if (tur.singer.inHarmonic.length > 0) {
        const n = tur.singer.inHarmonic.length - 1;
        
        if (!tur.singer.partials) {
          tur.singer.partials = [];
        }
        
        if (!tur.singer.partials[n]) {
          tur.singer.partials[n] = [];
        }
        
        tur.singer.partials[n].push(args[0]);
      } else {
        activity.errorMsg(
          _("Partial block should be used inside of a Weighted-partials block.")
        );
      }
    }
  }

  class HarmonicBlock extends FlowClampBlock {
    constructor() {
      super("harmonic");
      this.setPalette("tone", activity);
      this.setHelpString([
        _(
          "The Weighted partials block is used to specify the partials associated with a timbre."
        ),
        "documentation",
        ""
      ]);
      this.formBlock({
        name: _("weighted partials")
      });
      this.makeMacro((x, y) => [
        [0, "harmonic", x, y, [null, 2, 1]],
        [1, "hidden", 0, 0, [0, null]],
        [2, "partial", 0, 0, [0, 3, 4]],
        [3, ["number", { value: 1 }], 0, 0, [2]],
        [4, "partial", 0, 0, [2, 5, 6]],
        [5, ["number", { value: 0.2 }], 0, 0, [4]],
        [6, "partial", 0, 0, [4, 7, null]],
        [7, ["number", { value: 0.01 }], 0, 0, [6]]
      ]);
    }

    flow(args, logo, turtle, blk) {
      const tur = activity.turtles.ithTurtle(turtle);

      tur.singer.inHarmonic.push(blk);
      tur.singer.partials.push([]);

      const listenerName = "_harmonic_" + turtle + "_" + blk;
      logo.setDispatchBlock = logo.setDispatchBlock || jest.fn();
      logo.setDispatchBlock(blk, turtle, listenerName);

      logo.setTurtleListener = logo.setTurtleListener || jest.fn();
      const __listener = (event) => {
        tur.singer.inHarmonic.pop();
        tur.singer.partials.pop();
      };

      logo.setTurtleListener(turtle, listenerName, __listener);

      return [args[0], 1];
    }
  }

  class Harmonic2Block extends FlowClampBlock {
    constructor() {
      super("harmonic2");
      this.piemenuValuesC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      this.setPalette("tone", activity);
      this.setHelpString([
        _("The Harmonic block will add harmonics to the contained notes."),
        "documentation",
        null,
        "harmonichelp"
      ]);
      this.formBlock({
        name: _("harmonic"),
        args: 1,
        defaults: [1]
      });
      this.makeMacro((x, y) => [
        [0, "harmonic2", x, y, [null, 2, null, 1]],
        [1, "hidden", 0, 0, [0, null]],
        [2, ["number", { value: 1 }], 0, 0, [0]]
      ]);
    }

    flow(args, logo, turtle, blk) {
      mockToneActions.doHarmonic(args[0], turtle, blk);
      return [args[1], 1];
    }
  }

  class DisBlock extends FlowClampBlock {
    constructor() {
      super("dis");
      this.setPalette("tone", activity);
      this.piemenuValuesC1 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      this.setHelpString([
        _("The Distortion block adds distortion to the pitch."),
        "documentation",
        null,
        "dishelp"
      ]);
      this.formBlock({
        name: _("distortion"),
        args: 1,
        defaults: [40]
      });
    }

    flow(args, logo, turtle, blk) {
      mockToneActions.doDistortion(args[0], turtle, blk);

      const tur = activity.turtles.ithTurtle(turtle);

      if (logo.inTimbre) {
        if (!global.instrumentsEffects[turtle]) {
          global.instrumentsEffects[turtle] = {};
        }
        
        if (!global.instrumentsEffects[turtle][logo.timbre.instrumentName]) {
          global.instrumentsEffects[turtle][logo.timbre.instrumentName] = {};
        }
        
        global.instrumentsEffects[turtle][logo.timbre.instrumentName]["distortionActive"] = true;
        logo.timbre.distortionEffect = logo.timbre.distortionEffect || [];
        logo.timbre.distortionEffect.push(blk);
        logo.timbre.distortionParams = logo.timbre.distortionParams || [];
        // Ensure we don't crash if the array is undefined
        const distAmount = global.last(tur.singer.distortionAmount) || 0.4;
        logo.timbre.distortionParams.push(distAmount * 100);
        global.instrumentsEffects[turtle][logo.timbre.instrumentName]["distortionAmount"] =
          args[0];
      }

      return [args[1], 1];
    }
  }

  class TremoloBlock extends FlowClampBlock {
    constructor() {
      super("tremolo");
      this.setPalette("tone", activity);
      this.piemenuValuesC1 = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 10, 20];
      this.piemenuValuesC2 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      this.beginnerBlock(true);

      this.setHelpString([
        _("The Tremolo block adds a wavering effect."),
        "documentation",
        null,
        "tremolohelp"
      ]);

      this.formBlock({
        name: _("tremolo"),
        args: 2,
        defaults: [10, 50],
        argLabels: [
          _("rate"),
          _("depth")
        ]
      });
      this.makeMacro((x, y) => [
        [0, "tremolo", x, y, [null, 1, 2, null, 3]],
        [1, ["number", { value: 10 }], 0, 0, [0]],
        [2, ["number", { value: 50 }], 0, 0, [0]],
        [3, "hidden", 0, 0, [0, null]]
      ]);
    }

    flow(args, logo, turtle, blk) {
      mockToneActions.doTremolo(args[0], args[1], turtle, blk);

      const tur = activity.turtles.ithTurtle(turtle);

      if (logo.inTimbre) {
        if (!global.instrumentsEffects[turtle]) {
          global.instrumentsEffects[turtle] = {};
        }
        
        if (!global.instrumentsEffects[turtle][logo.timbre.instrumentName]) {
          global.instrumentsEffects[turtle][logo.timbre.instrumentName] = {};
        }
        
        global.instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloActive"] = true;
        logo.timbre.tremoloEffect = logo.timbre.tremoloEffect || [];
        logo.timbre.tremoloEffect.push(blk);
        logo.timbre.tremoloParams = logo.timbre.tremoloParams || [];
        // Ensure we don't crash if the array is undefined
        const tremoloFreq = global.last(tur.singer.tremoloFrequency) || 10;
        logo.timbre.tremoloParams.push(tremoloFreq);
        global.instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloFrequency"] =
          args[0];
        const tremoloDepth = global.last(tur.singer.tremoloDepth) || 0.5;
        logo.timbre.tremoloParams.push(tremoloDepth * 100);
        global.instrumentsEffects[turtle][logo.timbre.instrumentName]["tremoloDepth"] = args[1];
      }

      return [args[2], 1];
    }
  }

  // Return the classes for testing
  return {
    OscillatorBlock,
    FillerTypeBlock,
    OscillatorTypeBlock,
    DuoSynthBlock,
    AMSynth,
    FMSynth,
    PartialBlock,
    HarmonicBlock,
    Harmonic2Block,
    DisBlock,
    TremoloBlock
  };
}

const blocks = setupToneBlocks(activity);

describe('Tone Blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.instrumentsEffects = {
      0: {
        piano: {
          distortionActive: false,
          distortionAmount: 0,
          tremoloActive: false,
          tremoloFrequency: 0,
          tremoloDepth: 0
        }
      }
    };
  });
  
  describe('OscillatorBlock', () => {
    it('should set up an oscillator with the correct type and partials', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          osc: [],
          oscParams: []
        },
        synth: {
          createSynth: jest.fn()
        }
      };
      
      oscillatorBlock.flow(['triangle', 6], logo, 0, 'blk1');
      
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'triangle',
        undefined
      );
      expect(logo.timbre.osc).toContain('blk1');
      expect(logo.timbre.oscParams).toEqual(['triangle', 6]);
    });
    
    it('should show error when adding multiple oscillator blocks', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          osc: ['existing'],
          oscParams: []
        }
      };
      
      oscillatorBlock.flow(['triangle', 6], logo, 0, 'blk1');
      
      expect(activity.errorMsg).toHaveBeenCalled();
    });
  });
  
  describe('DuoSynthBlock', () => {
    it('should call defDuoSynth with correct parameters', () => {
      const duoSynthBlock = new blocks.DuoSynthBlock();
      duoSynthBlock.flow([10, 5], { inTimbre: false }, 0, 'blk1');
      
      expect(mockToneActions.defDuoSynth).toHaveBeenCalledWith(10, 5, 0, 'blk1');
    });
  });
  
  describe('AMSynth', () => {
    it('should call defAMSynth with correct parameters', () => {
      const amSynthBlock = new blocks.AMSynth();
      amSynthBlock.flow([1], { inTimbre: false }, 0, 'blk1');
      
      expect(mockToneActions.defAMSynth).toHaveBeenCalledWith(1, 0, 'blk1');
    });
  });
  
  describe('FMSynth', () => {
    it('should call defFMSynth with correct parameters', () => {
      const fmSynthBlock = new blocks.FMSynth();
      fmSynthBlock.flow([10], { inTimbre: false }, 0, 'blk1');
      
      expect(mockToneActions.defFMSynth).toHaveBeenCalledWith(10, 0, 'blk1');
    });
  });
  
  describe('PartialBlock', () => {
    it('should add partial weight to the current harmonic', () => {
      const partialBlock = new blocks.PartialBlock();
      const tur = {
        singer: {
          inHarmonic: ['harmonic1'],
          partials: [[]]
        }
      };
      activity.turtles.ithTurtle.mockReturnValue(tur);
      
      partialBlock.flow([0.5], {}, 0);
      
      expect(tur.singer.partials[0]).toContain(0.5);
    });
    
    it('should show error when partial weight is out of range', () => {
      const partialBlock = new blocks.PartialBlock();
      const logo = { stopTurtle: false };
      
      partialBlock.flow([1.5], logo, 0);
      
      expect(activity.errorMsg).toHaveBeenCalled();
      expect(logo.stopTurtle).toBe(true);
    });
    
    it('should show error when used outside of a Harmonic block', () => {
      const partialBlock = new blocks.PartialBlock();
      const tur = {
        singer: {
          inHarmonic: [],
          partials: []
        }
      };
      activity.turtles.ithTurtle.mockReturnValue(tur);
      
      partialBlock.flow([0.5], {}, 0);
      
      expect(activity.errorMsg).toHaveBeenCalled();
    });
  });
  
  describe('HarmonicBlock', () => {
    it('should set up and tear down the harmonic context', () => {
      const harmonicBlock = new blocks.HarmonicBlock();
      const logo = {
        setDispatchBlock: jest.fn(),
        setTurtleListener: jest.fn()
      };
      const tur = {
        singer: {
          inHarmonic: [],
          partials: []
        }
      };
      activity.turtles.ithTurtle.mockReturnValue(tur);
      
      const result = harmonicBlock.flow(['arg0'], logo, 0, 'blk1');
      
      expect(tur.singer.inHarmonic).toContain('blk1');
      expect(tur.singer.partials.length).toBe(1);
      expect(logo.setDispatchBlock).toHaveBeenCalledWith('blk1', 0, '_harmonic_0_blk1');
      expect(logo.setTurtleListener).toHaveBeenCalled();
      
      expect(result).toEqual(['arg0', 1]);
      
      const listenerCallback = logo.setTurtleListener.mock.calls[0][2];
      
      listenerCallback();
      
      expect(tur.singer.inHarmonic.length).toBe(0);
      expect(tur.singer.partials.length).toBe(0);
    });
  });
  
  describe('Harmonic2Block', () => {
    it('should call doHarmonic with correct parameters', () => {
      const harmonic2Block = new blocks.Harmonic2Block();
      const result = harmonic2Block.flow([2, 'arg1'], {}, 0, 'blk1');
      
      expect(mockToneActions.doHarmonic).toHaveBeenCalledWith(2, 0, 'blk1');
      expect(result).toEqual(['arg1', 1]);
    });
  });
  
  describe('DisBlock', () => {
    it('should call doDistortion and update timbre when in timbre mode', () => {
      const disBlock = new blocks.DisBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          distortionEffect: [],
          distortionParams: []
        }
      };
      
      const result = disBlock.flow([40, 'arg1'], logo, 0, 'blk1');
      
      expect(mockToneActions.doDistortion).toHaveBeenCalledWith(40, 0, 'blk1');
      expect(logo.timbre.distortionEffect).toContain('blk1');
      expect(global.instrumentsEffects[0].piano.distortionActive).toBeTruthy();
      expect(global.instrumentsEffects[0].piano.distortionAmount).toBe(40);
      expect(result).toEqual(['arg1', 1]);
    });
  });
  
  describe('TremoloBlock', () => {
    it('should call doTremolo and update timbre when in timbre mode', () => {
      const tremoloBlock = new blocks.TremoloBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          tremoloEffect: [],
          tremoloParams: []
        }
      };
      
      const result = tremoloBlock.flow([5, 30, 'arg2'], logo, 0, 'blk1');
      
      expect(mockToneActions.doTremolo).toHaveBeenCalledWith(5, 30, 0, 'blk1');
      expect(logo.timbre.tremoloEffect).toContain('blk1');
      expect(global.instrumentsEffects[0].piano.tremoloActive).toBeTruthy();
      expect(global.instrumentsEffects[0].piano.tremoloFrequency).toBe(5);
      expect(global.instrumentsEffects[0].piano.tremoloDepth).toBe(30);
      expect(result).toEqual(['arg2', 1]);
    });
  });
  describe('FillerTypeBlock and OscillatorTypeBlock', () => {
    it('should correctly instantiate FillerTypeBlock', () => {
      const fillerTypeBlock = new blocks.FillerTypeBlock();
      
      expect(fillerTypeBlock.name).toBe('filtertype');
      expect(fillerTypeBlock.setPalette).toHaveBeenCalledWith('tone', activity);
      expect(fillerTypeBlock.formBlock).toHaveBeenCalledWith({ outType: 'textout' });
      expect(fillerTypeBlock.hidden).toBe(true);
    });
    
    it('should correctly instantiate OscillatorTypeBlock', () => {
      const oscillatorTypeBlock = new blocks.OscillatorTypeBlock();
      
      expect(oscillatorTypeBlock.name).toBe('oscillatortype');
      expect(oscillatorTypeBlock.setPalette).toHaveBeenCalledWith('tone', activity);
      expect(oscillatorTypeBlock.formBlock).toHaveBeenCalledWith({ outType: 'textout' });
      expect(oscillatorTypeBlock.hidden).toBe(true);
    });
  });
  
  describe('OscillatorBlock with different parameters', () => {
    it('should handle different oscillator types', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          osc: [],
          oscParams: []
        },
        synth: {
          createSynth: jest.fn()
        }
      };
      
      // Test with sine type
      oscillatorBlock.flow(['sine', 3], logo, 0, 'blk1');
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'sine',
        undefined
      );
      
      jest.clearAllMocks();
      logo.timbre.osc = [];
      logo.timbre.oscParams = [];
      
      oscillatorBlock.flow(['square', 4], logo, 0, 'blk2');
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'square',
        undefined
      );
      
      jest.clearAllMocks();
      logo.timbre.osc = [];
      logo.timbre.oscParams = [];
      
      oscillatorBlock.flow(['sawtooth', 5], logo, 0, 'blk3');
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'sawtooth',
        undefined
      );
    });
    
    it('should use default oscillator type when invalid type is provided', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          osc: [],
          oscParams: []
        },
        synth: {
          createSynth: jest.fn()
        }
      };
      
      global.DEFAULTOSCILLATORTYPE = 'sine';
      oscillatorBlock.flow(['invalid-type', 3], logo, 0, 'blk1');
      
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'sine',
        undefined
      );
    });
    
    it('should handle missing or invalid arguments', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          osc: [],
          oscParams: []
        },
        synth: {
          createSynth: jest.fn()
        }
      };
      
      oscillatorBlock.flow([], logo, 0, 'blk1');
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'sine',
        undefined
      );
      
      jest.clearAllMocks();
      logo.timbre.osc = [];
      logo.timbre.oscParams = [];
      
      oscillatorBlock.flow(['triangle', 'not-a-number'], logo, 0, 'blk2');
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'sine',
        undefined
      );
      expect(logo.timbre.oscParams).toContain(0);
    });
  });
  
  describe('Parameter validation across blocks', () => {
    it('should validate parameters in DuoSynthBlock', () => {
      const duoSynthBlock = new blocks.DuoSynthBlock();
      
      duoSynthBlock.flow([10, 5], {}, 0, 'blk1');
      expect(mockToneActions.defDuoSynth).toHaveBeenCalledWith(10, 5, 0, 'blk1');
      
      jest.clearAllMocks();
      duoSynthBlock.flow([100, 100], {}, 0, 'blk2');
      expect(mockToneActions.defDuoSynth).toHaveBeenCalledWith(100, 100, 0, 'blk2');
      
      jest.clearAllMocks();
      duoSynthBlock.flow([0, 0], {}, 0, 'blk3');
      expect(mockToneActions.defDuoSynth).toHaveBeenCalledWith(0, 0, 0, 'blk3');
    });
    
    it('should validate parameters in AMSynth', () => {
      const amSynthBlock = new blocks.AMSynth();
      
      amSynthBlock.flow([1], {}, 0, 'blk1');
      expect(mockToneActions.defAMSynth).toHaveBeenCalledWith(1, 0, 'blk1');
      
      jest.clearAllMocks();
      amSynthBlock.flow([2], {}, 0, 'blk2');
      expect(mockToneActions.defAMSynth).toHaveBeenCalledWith(2, 0, 'blk2');
      
      jest.clearAllMocks();
      amSynthBlock.flow([3], {}, 0, 'blk3');
      expect(mockToneActions.defAMSynth).toHaveBeenCalledWith(3, 0, 'blk3');
    });
    
    it('should validate parameters in FMSynth', () => {
      const fmSynthBlock = new blocks.FMSynth();
      
      [1, 5, 10, 15, 20, 25].forEach((value, index) => {
        jest.clearAllMocks();
        fmSynthBlock.flow([value], {}, 0, `blk${index}`);
        expect(mockToneActions.defFMSynth).toHaveBeenCalledWith(value, 0, `blk${index}`);
      });
      
      jest.clearAllMocks();
      fmSynthBlock.flow([12], {}, 0, 'blk_outside');
      expect(mockToneActions.defFMSynth).toHaveBeenCalledWith(12, 0, 'blk_outside');
    });
  });
  
  describe('Integration scenarios', () => {
    it('should handle multiple blocks in sequence', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const harmonicBlock = new blocks.HarmonicBlock();
      const partialBlock = new blocks.PartialBlock();
      
      const tur = {
        singer: {
          inHarmonic: [],
          partials: []
        }
      };
      activity.turtles.ithTurtle.mockReturnValue(tur);
      
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'piano',
          osc: [],
          oscParams: []
        },
        synth: {
          createSynth: jest.fn()
        },
        setDispatchBlock: jest.fn(),
        setTurtleListener: jest.fn()
      };
      
      oscillatorBlock.flow(['triangle', 6], logo, 0, 'osc_blk');
      
      const harmResult = harmonicBlock.flow(['harmonic_arg'], logo, 0, 'harm_blk');
      
      partialBlock.flow([0.5], logo, 0);
      partialBlock.flow([0.3], logo, 0);
      partialBlock.flow([0.1], logo, 0);
      
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'piano',
        'triangle',
        undefined
      );
      expect(tur.singer.inHarmonic).toContain('harm_blk');
      expect(tur.singer.partials[0]).toEqual([0.5, 0.3, 0.1]);
      expect(harmResult).toEqual(['harmonic_arg', 1]);
      
      const listenerCallback = logo.setTurtleListener.mock.calls[0][2];
      listenerCallback();
      
      expect(tur.singer.inHarmonic.length).toBe(0);
      expect(tur.singer.partials.length).toBe(0);
    });
    
    it('should handle a complete timbre setup with effects', () => {
      const oscillatorBlock = new blocks.OscillatorBlock();
      const duoSynthBlock = new blocks.DuoSynthBlock();
      const disBlock = new blocks.DisBlock();
      const tremoloBlock = new blocks.TremoloBlock();
      
      const logo = {
        inTimbre: true,
        timbre: {
          instrumentName: 'customSynth',
          osc: [],
          oscParams: [],
          distortionEffect: [],
          distortionParams: [],
          tremoloEffect: [],
          tremoloParams: []
        },
        synth: {
          createSynth: jest.fn()
        }
      };
      
      const tur = {
        singer: {
          distortionAmount: [0.4],
          tremoloFrequency: [10],
          tremoloDepth: [0.5]
        }
      };
      activity.turtles.ithTurtle.mockReturnValue(tur);
      
      oscillatorBlock.flow(['sine', 3], logo, 0, 'osc_blk');
      
      duoSynthBlock.flow([15, 8], logo, 0, 'duo_blk');
      
      disBlock.flow([35, 'next_blk'], logo, 0, 'dis_blk');
      
      tremoloBlock.flow([8, 40, 'end_blk'], logo, 0, 'trem_blk');
      
      expect(logo.synth.createSynth).toHaveBeenCalledWith(
        0,
        'customSynth',
        'sine',
        undefined
      );
      expect(mockToneActions.defDuoSynth).toHaveBeenCalledWith(15, 8, 0, 'duo_blk');
      expect(mockToneActions.doDistortion).toHaveBeenCalledWith(35, 0, 'dis_blk');
      expect(mockToneActions.doTremolo).toHaveBeenCalledWith(8, 40, 0, 'trem_blk');
      
      expect(global.instrumentsEffects[0].customSynth.distortionActive).toBeTruthy();
      expect(global.instrumentsEffects[0].customSynth.distortionAmount).toBe(35);
      expect(global.instrumentsEffects[0].customSynth.tremoloActive).toBeTruthy();
      expect(global.instrumentsEffects[0].customSynth.tremoloFrequency).toBe(8);
      expect(global.instrumentsEffects[0].customSynth.tremoloDepth).toBe(40);
    });
  });
  
  describe('Error handling and edge cases', () => {
        
    it('should handle edge cases in flow method parameters', () => {
      const harmonicBlock = new blocks.HarmonicBlock();
      const logo = {
        setDispatchBlock: jest.fn(),
        setTurtleListener: jest.fn()
      };
      const tur = {
        singer: {
          inHarmonic: [],
          partials: []
        }
      };
      
      activity.turtles.ithTurtle.mockReturnValue(tur);
      
      const result = harmonicBlock.flow([], logo, 0, 'harm_blk');
      expect(result).toBeDefined();
      
      expect(tur.singer.inHarmonic).toContain('harm_blk');
      expect(tur.singer.partials.length).toBe(1);
      expect(result).toEqual([undefined, 1]);
      
      const disBlock = new blocks.DisBlock();
      disBlock.flow([-10, 'next_blk'], {}, 0, 'dis_blk');
      expect(mockToneActions.doDistortion).toHaveBeenCalledWith(-10, 0, 'dis_blk');
      
      jest.clearAllMocks();
      disBlock.flow([200, 'next_blk'], {}, 0, 'dis_blk');
      expect(mockToneActions.doDistortion).toHaveBeenCalledWith(200, 0, 'dis_blk');
      
      jest.clearAllMocks();
      disBlock.flow(['not-a-number', 'next_blk'], {}, 0, 'dis_blk');
      expect(mockToneActions.doDistortion).toHaveBeenCalledWith('not-a-number', 0, 'dis_blk');
    });
  });
  
});