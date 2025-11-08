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

/* global
   _, FlowBlock, NOINPUTERRORMSG, ValueBlock, docById, toFixed2,
   LeftBlock, BooleanSensorBlock, NANERRORMSG, hex2rgb, searchColors,
   Tone, platformColor, _THIS_IS_MUSIC_BLOCKS_
*/

function setupSensorsBlocks(activity) {

  // =================== INPUT BLOCKS ===================
  class InputBlock extends FlowBlock {
    constructor() {
      super("input");
      this.setPalette("sensors", activity);
      this.parameter = true;
      this.setHelpString([_("The Input block prompts for keyboard input."), "documentation", ""]);
      this.formBlock({ name: _("input"), args: 1, argTypes: ["anyin"], defaults: [_("Input a value")] });
    }

    flow(args, logo, turtle, blk) {
      const tur = activity.turtles.ithTurtle(turtle);
      tur.doWait(120);

      const labelDiv = docById("labelDiv");
      labelDiv.innerHTML = '<input id="textLabel" class="input" type="text" value="" />';
      const inputElem = docById("textLabel");
      const cblk = activity.blocks.blockList[blk].connections[1];
      if (cblk !== null) inputElem.placeholder = activity.blocks.blockList[cblk].value;

      const turtleContainer = activity.turtles.getTurtle(turtle).container;
      inputElem.style.left = turtleContainer.x + "px";
      inputElem.style.top = turtleContainer.y + "px";
      inputElem.focus();
      labelDiv.classList.add("hasKeyboard");

      function __keyPressed(event) {
        if (event.keyCode === 13) {
          const val = inputElem.value;
          logo.inputValues[turtle] = isNaN(val) ? val : Number(val);
          inputElem.blur();
          inputElem.style.display = "none";
          logo.clearTurtleRun(turtle);
          labelDiv.classList.remove("hasKeyboard");
        }
      }

      inputElem.addEventListener("keypress", __keyPressed);
    }
  }

  class InputValueBlock extends ValueBlock {
    constructor() {
      super("inputvalue", _("input value"));
      this.setPalette("sensors", activity);
      this.parameter = true;
      this.setHelpString([_("The Input-value block stores the input."), "documentation", null, "input"]);
    }

    updateParameter(logo, turtle) {
      return turtle in logo.inputValues ? logo.inputValues[turtle] : 0;
    }

    arg(logo, turtle, blk) {
      if (turtle in logo.inputValues) return logo.inputValues[turtle];
      activity.errorMsg(NOINPUTERRORMSG, blk);
      return 0;
    }
  }

  // =================== RGB BLOCKS ===================
  class GetRedBlock extends ValueBlock {
    constructor() {
      super("getred", _("red"));
      this.setPalette("sensors", activity);
      this.parameter = true;
    }

    updateParameter(logo, turtle, blk) {
      return toFixed2(activity.blocks.blockList[blk].value);
    }

    arg(logo, turtle) {
      let colorStr = activity.turtles.getTurtle(turtle).painter.canvasColor;
      if (colorStr[0] === "#") colorStr = hex2rgb(colorStr.slice(1));
      const r = colorStr.split("(")[1].split(",")[0];
      return Math.round(Number(r) / 2.55);
    }
  }

  class GetGreenBlock extends ValueBlock {
    constructor() {
      super("getgreen", _("green"));
      this.setPalette("sensors", activity);
      this.parameter = true;
    }

    updateParameter(logo, turtle, blk) {
      return toFixed2(activity.blocks.blockList[blk].value);
    }

    arg(logo, turtle) {
      let colorStr = activity.turtles.getTurtle(turtle).painter.canvasColor;
      if (colorStr[0] === "#") colorStr = hex2rgb(colorStr.slice(1));
      const g = colorStr.split("(")[1].split(",")[1];
      return Math.round(Number(g) / 2.55);
    }
  }

  class GetBlueBlock extends ValueBlock {
    constructor() {
      super("getblue", _("blue"));
      this.setPalette("sensors", activity);
      this.parameter = true;
    }

    updateParameter(logo, turtle, blk) {
      return toFixed2(activity.blocks.blockList[blk].value);
    }

    arg(logo, turtle) {
      let colorStr = activity.turtles.getTurtle(turtle).painter.canvasColor;
      if (colorStr[0] === "#") colorStr = hex2rgb(colorStr.slice(1));
      const b = colorStr.split("(")[1].split(",")[2];
      return Math.round(Number(b) / 2.55);
    }
  }

  // =================== OTHER BLOCKS ===================
  class PitchnessBlock extends ValueBlock {
    constructor() {
      super("pitchness", _("pitch"));
      this.setPalette("sensors", activity);
      this.parameter = true;
    }

    updateParameter(logo, turtle, blk) {
      return toFixed2(activity.blocks.blockList[blk].value);
    }

    arg(logo) {
      if (!logo.mic) return 440;
      if (!logo.pitchAnalyser) {
        logo.pitchAnalyser = new Tone.Analyser({ type: "fft", size: logo.limit, smoothing: 0 });
        logo.mic.connect(logo.pitchAnalyser);
      }

      const values = logo.pitchAnalyser.getValue();
      let max = Infinity, idx = 0;
      for (let i = 0; i < logo.limit; i++) {
        const v2 = -values[i];
        if (v2 < max) { max = v2; idx = i; }
      }
      return idx / (logo.pitchAnalyser.sampleTime * logo.limit * 2);
    }
  }

  class LoudnessBlock extends ValueBlock {
    constructor() {
      super("loudness", _("loudness"));
      this.setPalette("sensors", activity);
      this.parameter = true;
    }

    updateParameter(logo, turtle, blk) {
      return toFixed2(activity.blocks.blockList[blk].value);
    }

    arg(logo) {
      if (!logo.mic) return 0;
      if (!logo.volumeAnalyser) {
        logo.volumeAnalyser = new Tone.Analyser({ type: "waveform", size: logo.limit });
        logo.mic.connect(logo.volumeAnalyser);
      }
      const values = logo.volumeAnalyser.getValue();
      const rms = Math.sqrt(values.reduce((acc, v) => acc + v * v, 0) / logo.limit);
      return Math.round(rms * 100);
    }
  }

  // =================== REGISTER BLOCKS ===================
  new GetRedBlock().setup(activity);
  new GetGreenBlock().setup(activity);
  new GetBlueBlock().setup(activity);
  new InputBlock().setup(activity);
  new InputValueBlock().setup(activity);
  new PitchnessBlock().setup(activity);
  new LoudnessBlock().setup(activity);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { setupSensorsBlocks };
}
