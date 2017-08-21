// Copyright (c) 2017 Walter Bender
// Copyright (c) 2017 Tayba Wasim
// Copyright (c) 2017 Prachi Agrawal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function TimbreWidget () {
    const BUTTONDIVWIDTH = 476;   // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    var timbreTableDiv = docById('timbreTableDiv');
    this.env = [];
    this.ENVs = [];
    this.synthVals = {
        "oscillator": {
            "type" : "sine"
        }
        ,        
         "envelope": {
             "attack": 0.01,
             "decay": 0.5,
            "sustain": 0.6,
            "release": 0.01
        },
    };
    this.adsrMap = ['attack', 'decay', 'sustain', 'release'];
    this.amSynthParamvals = {
        "harmonicity" : 3
    };
    this.fmSynthParamvals = {
        'modulationIndex': 10
    };
    this.duoSynthParamVals = {
        'vibratoAmount': 0.5,
        'vibratoRate': 5
    };
    this.fil = [];              
    this.filterParams = [];
    this.osc = [];
    this.oscParams = [];
    this.tremoloEffect = [];
    this.tremoloParams = [];
    this.vibratoEffect = [];
    this.vibratoParams = [];
    this.chorusEffect = [];
    this.chorusParams = [];
    this.phaserEffect = [];
    this.phaserParams = [];
    this.distortionEffect = [];
    this.distortionParams = [];
    this.AMSynthesizer = [];
    this.AMSynthParams = [];
    this.FMSynthesizer = [];
    this.FMSynthParams = [];
    this.duoSynthesizer = [];
    this.duoSynthParams = [];
    this.activeParams = ['synth', 'amsynth', 'fmsynth', 'duosynth', 'envelope', 'oscillator', 'filter', 'effects', 'chorus', 'vibrato', 'phaser', 'distortion', 'tremolo'];
    this.isActive = {};
    for(var i=0; i < this.activeParams.length; i++) {
        this.isActive[this.activeParams[i]] = false;
    }
    this.blockNo = null;
    this.instrument_name = 'custom';
   
    var that = this;
    //console.log('timbre initialised');

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width; 
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._update = function(i, value, k){
        var updateParams = [];
        if (that.isActive['envelope'] === true && this.env[i] != null) {
            for (j = 0; j < 4; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.env[i]].connections[j+1];
            }
        }
        if (that.isActive['filter'] === true && this.fil[i] != null) {
            for (j = 0; j < 3; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.fil[i]].connections[j+1];
            }
        }
        if (that.isActive['oscillator'] === true && this.osc[i] != null) {
            for (j = 0; j < 2; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.osc[i]].connections[j+1];
            }
        }
        if (that.isActive['amsynth'] === true && this.AMSynthesizer[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.AMSynthesizer[i]].connections[1];
        }
        if (that.isActive['fmsynth'] === true && this.FMSynthesizer[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.FMSynthesizer[i]].connections[1];
        }
        if (that.isActive['duosynth'] === true && this.duoSynthesizer[i] != null) {
            for (j = 0; j < 2; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.duoSynthesizer[i]].connections[j+1];
            }
        }
        if (that.isActive['tremolo'] === true && this.tremoloEffect[i] != null) {
            for (j = 0; j < 2; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.tremoloEffect[i]].connections[j+1];
            }
        }

        if (that.isActive['vibrato'] === true && this.vibratoEffect[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.vibratoEffect[i]].connections[1];
            // The rate arg of the vibrato block must be in the form: a / b
            var divBlock = this._logo.blocks.blockList[this.vibratoEffect[i]].connections[2];
            if (this._logo.blocks.blockList[divBlock].name === 'divide' && this._logo.blocks.blockList[divBlock].connections[1] != null && this._logo.blocks.blockList[this._logo.blocks.blockList[divBlock].connections[1]].name === 'number' && this._logo.blocks.blockList[divBlock].connections[2] != null && this._logo.blocks.blockList[this._logo.blocks.blockList[divBlock].connections[2]].name === 'number') {

                var numBlock = this._logo.blocks.blockList[divBlock].connections[1];
                var denomBlock = this._logo.blocks.blockList[divBlock].connections[2];
                updateParams[1] = denomBlock;
                updateParams[2] = numBlock;
            } else {
                // Convert to a / b format
                var obj = rationalToFraction(this._logo.parseArg(this._logo, 0, divBlock, null, null));
                var topOfClamp = this._logo.blocks.blockList[last(this.vibratoEffect)].connections[3];
                var n = this._logo.blocks.blockList.length;
                const DIVOBJ = [[0, ["divide", {}], 0, 0, [null, 1, 2]], [1, ["number", {"value": obj[0]}], 0, 0, [0]], [2, ["number", {"value": obj[1]}], 0, 0, [0]]];
                this._logo.blocks.loadNewBlocks(DIVOBJ);

                updateParams[1] = n + 2;  // Denom block
                updateParams[2] = n + 1;  // Numerator block

                that = this;
                
                __blockRefresher = function () {
                    that._logo.blocks.blockList[last(that.vibratoEffect)].connections[2] = n;
                    that._logo.blocks.blockList[n].connections[0] = last(that.vibratoEffect);
                    that._logo.blocks.blockList[divBlock].connections[0] = null;
                    that._logo.blocks._clampBlocksToCheck.push([n, 0]);
                    that._logo.blocks._clampBlocksToCheck.push([that.blockNo, 0]);
                    that._logo.blocks.adjustDocks(that.blockNo, true);
                };

                setTimeout(__blockRefresher(), 250);
            }
        }

        if (that.isActive['chorus'] === true && this.chorusEffect[i] != null) {
            for (j = 0; j < 3; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.chorusEffect[i]].connections[j+1];
            }
        }
        if (that.isActive['phaser'] === true && this.phaserEffect[i] != null) {
            for (j = 0; j < 3; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.phaserEffect[i]].connections[j+1];
            }
        }
        if (that.isActive['distortion'] === true && this.distortionEffect[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.distortionEffect[i]].connections[1];
        }
        
        if (updateParams[0] != null) {
            if (typeof value === 'string') {
                this._logo.blocks.blockList[updateParams[k]].value = value;
            } else {
                this._logo.blocks.blockList[updateParams[k]].value = parseFloat(value);
            }

            this._logo.blocks.blockList[updateParams[k]].text.text = value.toString();
            this._logo.blocks.blockList[updateParams[k]].updateCache();
            this._logo.refreshCanvas();
            saveLocally();
        }
    };

    this.init = function(logo) {
        this._logo = logo;
        
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;
        var timbreDiv = docById("timbreDiv");
        timbreDiv.style.visibility = "visible";
        timbreDiv.setAttribute('draggable', 'true');
        timbreDiv.style.left = '200px';
        timbreDiv.style.top = '150px';
        
        var widgetButtonsDiv = docById('timbreButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="timbreButtonTable"></table>';

        var canvas = docById('myCanvas');

        var buttonTable = docById('timbreButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        var that = this;
        
        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play all'));
        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        var synthButtonCell = this._addButton(row, 'synth.svg', ICONSIZE, _('synthesizer'));
        synthButtonCell.onclick = function() {
            //console.log('synth button cell');
            for(var i=0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }
            that.isActive['synth'] = true;
            synthButtonCell.id = "synthButtonCell";

            if(that.osc.length === 0) {
              that._synth();  
            }else{
                that._logo.errorMsg(_("Unable to use synth due to existing oscillator"));
            }
        }

        var oscillatorButtonCell = this._addButton(row, 'oscillator.svg', ICONSIZE, _('oscillator'));
        oscillatorButtonCell.onclick=function() {
            console.log('oscillator button clicked');
            for(var i=0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }
            that.isActive['oscillator'] = true;
            oscillatorButtonCell.id = "oscillatorButtonCell";

            // Look to see if there is a filter block in the clamp. If
            // there isn't one, add one. If there is more than one, we
            // should ignore all but the last one.
            if (that.osc.length <= 1) {
            //if (that.osc.length <= 1 && (that.AMSynthesizer.length === 0 && that.FMSynthesizer.length === 0 && that.duoSynthesizer.length === 0)) {
                // Find the last block in the clamp, where we will add
                // a filter block.
                if(that.osc.length === 0) {
                    var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                    var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                    const OSCILLATOROBJ = [[0,["oscillator",{}],0,0,[null,2,1,null]],[1,["number",{"value":6}],0,0,[0]],[2,["oscillatortype",{"value":"sine"}],0,0,[0]]];
                    that._logo.blocks.loadNewBlocks(OSCILLATOROBJ);

                    var n = that._logo.blocks.blockList.length - 3;
                    that.osc.push(n);
                    that.oscParams.push('sine');
                    that.oscParams.push(6);
                
                    setTimeout(that.blockConnection(3, bottomOfClamp), 500);
                }
                that._oscillator();            
            }

            if(that.osc.length != 0 && (that.AMSynthesizer.length !=0  || that.FMSynthesizer.length != 0 || that.duoSynthesizer.length != 0)){
                that._oscillator();
            }
            
        }

        var envelopeButtonCell = this._addButton(row, 'envelope.svg', ICONSIZE, _('envelope'));
        envelopeButtonCell.onclick = function() {
            for(var i=0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }
            that.isActive['envelope'] = true;
            envelopeButtonCell.id = "envelopeButtonCell";

            if (that.env.length === 0) {
                var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                const ENVOBJ = [[0,["envelope",{}],401,226,[null,1,2,3,4,null]],[1,["number",{"value":1}],505.38623046875,226,[0]],[2,["number",{"value":50}],505.38623046875,257.5,[0]],[3,["number",{"value":60}],505.38623046875,289,[0]],[4,["number",{"value":1}],505.38623046875,320.5,[0]]];
                that._logo.blocks.loadNewBlocks(ENVOBJ);

                var n = that._logo.blocks.blockList.length - 5;
                that.env.push(n);
                that.ENVs.push(1);
                that.ENVs.push(50);
                that.ENVs.push(60);
                that.ENVs.push(1);

                setTimeout(that.blockConnection(5, bottomOfClamp), 500);
            }
            that._envelope();
        }

        var filterButtonCell = this._addButton(row, 'filter.svg', ICONSIZE, _('filter'));
        filterButtonCell.onclick = function() {
            for(var i=0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }
            that.isActive['filter'] = true;
            filterButtonCell.id = "filterButtonCell";

            if (that.fil.length === 0) {
                var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                const FILTEROBJ = [[0,['filter',{}],0,0,[null,3,1,2,null]],[1,["number",{"value":-12}],512.5,289.5,[0]],[2,["number",{"value":392}],512.5,321,[0]],[3,["filtertype",{"value":"highpass"}],512.5,258,[0]]];
                that._logo.blocks.loadNewBlocks(FILTEROBJ);

                var n = that._logo.blocks.blockList.length - 4;
                that.fil.push(n);
                that.filterParams.push('highpass');
                that.filterParams.push(-12);
                that.filterParams.push(392);
                
                setTimeout(that.blockConnection(4, bottomOfClamp), 500);
            }
            that._filter();
        }

        var effectsButtonCell = this._addButton(row, 'effects.svg', ICONSIZE, _('effects'));
        effectsButtonCell.onclick=function() {
            for(var i=0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }
            that.isActive['effects'] = true;
            effectsButtonCell.id = "effectsButtonCell";
            that._effects();
        }
        
        var cell = this._addButton(row, 'restore-button.svg', ICONSIZE, _('undo'));
        /*cell.onclick=function() {
            that._undo();
        }*/

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            docById('timbreDiv').style.visibility = 'hidden';
            docById('timbreButtonsDiv').style.visibility = 'hidden';
            docById('timbreTableDiv').style.visibility = 'hidden';
        };

        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - timbreDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - timbreDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
                   dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.ondragover = function(e) {
            e.preventDefault();
        };

        timbreDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        timbreDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };
    };

    this.clampConnection = function (n, clamp, topOfClamp) {
        // Connect the clamp to the Widget block.
        that._logo.blocks.blockList[that.blockNo].connections[2] = n;
        that._logo.blocks.blockList[n].connections[0] = that.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp != null) {
            that._logo.blocks.blockList[n].connections[clamp] = topOfClamp;
            that._logo.blocks.blockList[topOfClamp].connections[0] = n;
        }

        // Adjust the clamp sizes and positions.
        that._logo.blocks._clampBlocksToCheck.push([n, 0]);
        that._logo.blocks._clampBlocksToCheck.push([that.blockNo, 0]);
        that._logo.blocks.adjustDocks(that.blockNo, true);
    };

    this.clampConnectionVspace = function (n, vspace, topOfClamp) {
        // Connect the clamp to the Widget block.
        that._logo.blocks.blockList[that.blockNo].connections[2] = n;
        that._logo.blocks.blockList[n].connections[0] = that.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp != null) {
            that._logo.blocks.blockList[vspace].connections[1] = topOfClamp;
            that._logo.blocks.blockList[topOfClamp].connections[0] = vspace;
        }

        // Adjust the clamp sizes and positions.
        that._logo.blocks._clampBlocksToCheck.push([n, 0]);
        that._logo.blocks._clampBlocksToCheck.push([that.blockNo, 0]);
        that._logo.blocks.adjustDocks(that.blockNo, true);
    };

    /*this.blockConnection = function (len, bottomOfClamp) {
        var n = that._logo.blocks.blockList.length - len;
        if (bottomOfClamp == null) {
            that._logo.blocks.blockList[that.blockNo].connections[2] = n;
            that._logo.blocks.blockList[n].connections[0] = that.blockNo;
        } else {
            var c = that._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
            that._logo.blocks.blockList[bottomOfClamp].connections[c] = n;
            that._logo.blocks.blockList[n].connections[0] = bottomOfClamp;
        }
        that._logo.blocks._clampBlocksToCheck.push([that.blockNo, 0]);
        that._logo.blocks.adjustDocks(that.blockNo, true);
    };*/
     this._blockReplace = function (oldblk, newblk) {
        // Find the connections from the old block
        console.log(oldblk);
        var c0 = this._logo.blocks.blockList[oldblk].connections[0];
        var c1 = last(this._logo.blocks.blockList[oldblk].connections);

        // Connect the new block
        this._logo.blocks.blockList[newblk].connections[0] = c0;
        this._logo.blocks.blockList[newblk].connections[this._logo.blocks.blockList[newblk].connections.length - 1] = c1;

        if (c0 != null) {
            for (var i = 0; i < this._logo.blocks.blockList[c0].connections.length; i++) {
                if (this._logo.blocks.blockList[c0].connections[i] === oldblk) {
                    this._logo.blocks.blockList[c0].connections[i] = newblk;
                    break;
                }
            }
        }

        if (c1 != null) {
            for (var i = 0; i < this._logo.blocks.blockList[c1].connections.length; i++) {
                if (this._logo.blocks.blockList[c1].connections[i] === oldblk) {
                    this._logo.blocks.blockList[c1].connections[i] = newblk;
                    break;
                }
            }
        }

        // Refresh the dock positions
        this._logo.blocks.adjustDocks(newblk, true);

        // Send the old block to the trash
        this._logo.blocks.blockList[oldblk].connections[0] = null;
        this._logo.blocks.blockList[oldblk].connections[this._logo.blocks.blockList[oldblk].connections.length - 1] = null;
        this._blocks.sendStackToTrash(this._logo.blocks.blockList[oldblk]);

        this._logo.refreshCanvas();
    };

    this.blockConnection = function (len, bottomOfClamp) {
        var n = this._logo.blocks.blockList.length - len;
        if (bottomOfClamp == null) {
            this._logo.blocks.blockList[this.blockNo].connections[2] = n;
            this._logo.blocks.blockList[n].connections[0] = this.blockNo;
        } else {
            var c = this._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
            // Check for nested clamps.
            // A hidden block is attached to the bottom of each clamp.
            while (this._logo.blocks.blockList[bottomOfClamp].name === 'hidden') {
                var cblk = this._logo.blocks.blockList[bottomOfClamp].connections[0];
                c = this._logo.blocks.blockList[cblk].connections.length - 2;
                if (this._logo.blocks.blockList[cblk].connections[c] == null) {
                    bottomOfClamp = cblk;
                } else {
                    // Find bottom of stack
                    bottomOfClamp = this._logo.blocks.findBottomBlock(this._logo.blocks.blockList[cblk].connections[c]);
                    c = this._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
                }
            }

            this._logo.blocks.blockList[bottomOfClamp].connections[c] = n;
            this._logo.blocks.blockList[n].connections[0] = bottomOfClamp;
        }
        this._logo.blocks._clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.adjustDocks(this.blockNo, true);
    };


      /* this.blockConnection = function (len, bottomOfClamp) {
        var n = that._logo.blocks.blockList.length - len;
        if (bottomOfClamp == null) {
            that._logo.blocks.blockList[that.blockNo].connections[2] = n;
            that._logo.blocks.blockList[n].connections[0] = that.blockNo;
        } else {
            var c = that._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
            // Check for nested clamps.
            // A hidden block is attached to the bottom of each clamp.
            while (that._logo.blocks.blockList[bottomOfClamp].name === 'hidden') {
                var cblk = that._logo.blocks.blockList[bottomOfClamp].connections[0];
                c = that._logo.blocks.blockList[cblk].connections.length - 2;
                if (that._logo.blocks.blockList[cblk].connections[c] == null) {
                    bottomOfClamp = cblk;
                } else {
                    // Find bottom of stack
            bottomOfClamp = that._logo.blocks.findBottomBlock(that._logo.blocks.blockList[cblk].connections[c]);
                    c = that._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
                }
        }

            that._logo.blocks.blockList[bottomOfClamp].connections[c] = n;
            that._logo.blocks.blockList[n].connections[0] = bottomOfClamp;
        }
        that._logo.blocks._clampBlocksToCheck.push([that.blockNo, 0]);
        that._logo.blocks.adjustDocks(that.blockNo, true);
    };
*/
    this._synth = function () {
        console.log("heysynth");
        var that = this;
        var blockValue = 0;

        docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
        docById("synthButtonCell").onmouseover = function(){};
        docById("synthButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = "";
        for (var i = 0; i < 2; i++) {
            htmlElements += '<div id ="synth'+i+'"></div>';
        }
        
        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        var mainDiv = docById("synth0");
        mainDiv.innerHTML= '<p><input type="radio" name="synthsName" value="AMSynth"/>AMSynth</br><input type="radio" name="synthsName" value="FMSynth"/>FMSynth</br><input type="radio" name="synthsName" value="DuoSynth"/>DuoSynth</br></p>';
        
        var subDiv = docById("synth1");
        var synthsName = document.getElementsByName("synthsName");
        var synthChosen;
        for (var i = 0; i < synthsName.length; i++) {
            synthsName[i].onclick = function () {
                synthChosen = this.value;
                var subHtmlElements = '<div id="chosen">'+synthChosen+'</div>';
                    for(var i=0; i < that.activeParams.length; i++) {
                        that.isActive[that.activeParams[i]] = false;
                    }
                    that.isActive['synth'] = true;

                    if(synthChosen === "AMSynth") {
                        that.isActive['amsynth'] = true;
                        that.isActive['fmsynth'] = false;
                        that.isActive['duosynth'] = false;

                        if (that.AMSynthesizer.length === 0) {
                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                            const AMSYNTHOBJ = [[0,["amsynth",{}],463,556,[null,1,null]],[1,["number",{"value":1}],566.5146484375,556,[0]]];
                            that._logo.blocks.loadNewBlocks(AMSYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 2;
                            that.AMSynthesizer.push(n);
                            that.AMSynthParams.push(1);
                   
                            setTimeout(that.blockConnection(2, bottomOfClamp), 500);
                        } 
                    
                        subHtmlElements += '<div id="wrapperS0"><div id="sS0" class="rectangle"><span></span></div><div id="insideDivSynth"><input type="range" id="myRangeS0"class ="sliders" style="margin-top:20px" value="2"><span id="myspanS0"class="rangeslidervalue">2</span></div></div>';
                        subDiv.innerHTML = subHtmlElements;
                        docById('sS0').textContent = "Harmonicity";
                        docById('myRangeS0').value = that.AMSynthParams[0];
                        docById('myspanS0').textContent = that.AMSynthParams[0];
                        that.amSynthParamvals['harmonicity'] = parseFloat(that.AMSynthParams[0]);
                        that._logo.synth.createSynth(that.instrument_name, 'amsynth', that.amSynthParamvals);
                   //     console.log('inside AMSynth');
                 
                        if (that.AMSynthesizer.length != 1) {
                            blockValue = that.AMSynthesizer.length - 1;
                        }
                    
                        document.getElementById("wrapperS0").addEventListener('change', function(event){
                            console.log('AMSynth event change');
                            docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                            var elem = event.target;
                            docById("myRangeS0").value = parseFloat(elem.value);
                            that.amSynthParamvals['harmonicity'] = parseFloat(elem.value);
                            docById("myspanS0").textContent = elem.value;
                            that._update(blockValue, elem.value, 0);
                            that._logo.synth.createSynth(that.instrument_name, 'amsynth', that.amSynthParamvals);

                        });
                    
                    }
                    else if (synthChosen === "FMSynth") {
                        that.isActive['amsynth'] = false;
                        that.isActive['fmsynth'] = true;
                        that.isActive['duosynth'] = false;

                        if (that.FMSynthesizer.length === 0) {
                          
                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                            const FMSYNTHOBJ = [[0,["fmsynth",{}],463,556,[null,1,null]],[1,["number",{"value":10}],566.5146484375,556,[0]]];
                            that._logo.blocks.loadNewBlocks(FMSYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 2;
                            that.FMSynthesizer.push(n);
                            that.FMSynthParams.push(1);
                   
                            setTimeout(that.blockConnection(2, bottomOfClamp), 500);
                        
                            //if(that.AMSynthesizer.length != 0){
                              // that._blockReplace(that.AMSynthesizer.pop(), that.FMSynthesizer.pop());
                            //}
                        }
                    
                        subHtmlElements += '<div id="wrapperS0"><div id="sS0" class="rectangle"><span></span></div><div id="insideDivSynth"><input type="range" id="myRangeS0"class ="sliders" style="margin-top:20px" value="2"><span id="myspanS0"class="rangeslidervalue">2</span></div></div>';
                        subDiv.innerHTML = subHtmlElements;
                        docById('sS0').textContent = "Modulation Index";
                        docById('myRangeS0').value = that.FMSynthParams[0];
                        docById('myspanS0').textContent = that.FMSynthParams[0];
                        that.fmSynthParamvals['modulationIndex'] = parseFloat(that.FMSynthParams[0]);
                        that._logo.synth.createSynth(that.instrument_name, 'fmsynth', that.fmSynthParamvals);

                        if (that.FMSynthesizer.length != 1) {
                            blockValue = that.FMSynthesizer.length - 1;
                        }
                    
                        document.getElementById("wrapperS0").addEventListener('change', function(event){
                            docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                            var elem = event.target;
                            docById("myRangeS0").value = parseFloat(elem.value);
                            docById("myspanS0").textContent = elem.value;
                            that.fmSynthParamvals['modulationIndex'] = parseFloat(elem.value);
                            that._update(blockValue, elem.value, 0);
                            that._logo.synth.createSynth(that.instrument_name, 'fmsynth', that.fmSynthParamvals);
                        });
                    }
                    else if (synthChosen === "DuoSynth") {
                        that.isActive['amsynth'] = false;
                        that.isActive['fmsynth'] = false;
                        that.isActive['duosynth'] = true;

                        if (that.duoSynthesizer.length === 0) {
                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                            const DUOSYNTHOBJ = [[0,["duosynth",{}],368,254,[null,1,2,null]],[1,["number",{"value":10}],481.54150390625,254,[0]],[2,["number",{"value":6}],481.54150390625,285.5,[0]]];
                            that._logo.blocks.loadNewBlocks(DUOSYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 3;
                            that.duoSynthesizer.push(n);
                            that.duoSynthParams.push(10);
                            that.duoSynthParams.push(6);
                   
                            setTimeout(that.blockConnection(3, bottomOfClamp), 500);
                        }
                    
                        for(var i = 0; i < 2; i++) {
                            subHtmlElements += '<div id="wrapperS'+i+'"><div id="sS'+i+'" class="rectangle"><span></span></div><div id="insideDivSynth"><input type="range" id="myRangeS'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspanS'+i+'"class="rangeslidervalue">2</span></div></div>';
                        }
                    
                        subDiv.innerHTML = subHtmlElements;
                        docById('sS0').textContent = "Vibrato Rate";
                        docById('myRangeS0').value = that.duoSynthParams[0];
                        docById('myspanS0').textContent = that.duoSynthParams[0];
                        that.duoSynthParamVals['vibratoRate'] = parseFloat(that.duoSynthParams[0]); 
                        docById('sS1').textContent = "Vibrato Amount";
                        docById('myRangeS1').value = that.duoSynthParams[1];
                        docById('myspanS1').textContent = that.duoSynthParams[1];
                        that.duoSynthParamVals['vibratoAmount'] = parseFloat(that.duoSynthParams[1]);
                        that._logo.synth.createSynth(that.instrument_name, 'duosynth', that.duoSynthParamVals);

                        if (that.duoSynthesizer.length != 1) {
                            blockValue = that.duoSynthesizer.length - 1;
                        }
                    
                        for (var i = 0; i < 2; i++) {
                            document.getElementById("wrapperS"+i).addEventListener('change', function(event){
                                docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                                var elem = event.target;
                                var m = elem.id.slice(-1);
                                docById("myRangeS"+m).value = parseFloat(elem.value);
                                if(m==0){
                                    that.duoSynthParamVals['vibratoRate'] = parseFloat(elem.value); 
                                }
                                else if(m==1){
                                    that.duoSynthParamVals['vibratoAmount'] = parseFloat(elem.value); 
                                }
                                docById("myspanS"+m).textContent = elem.value;
                                that._update(blockValue, elem.value, Number(m));
                                that._logo.synth.createSynth(that.instrument_name, 'duosynth', that.duoSynthParamVals);
                            });
                        }
                    }  
                }   
            }
        
        btnReset.onclick = function() {
            docById("synthButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR
            if(that.isActive['amsynth'] === true) {
                if (that.AMSynthesizer.length != 1) {
                    blockValue = that.AMSynthesizer.length - 1;
                }
                docById("myRangeS0").value = parseFloat(that.AMSynthParams[0]);
                docById("myspanS0").textContent = that.AMSynthParams[0];
                that.amSynthParamvals['harmonicity'] = parseFloat(that.AMSynthParams[0]); 
                that._update(blockValue, that.AMSynthParams[0], 0);
                that._logo.synth.createSynth(that.instrument_name, 'amsynth', that.amSynthParamvals);
            }  
            if(that.isActive['fmsynth'] === true) {
                if (that.FMSynthesizer.length != 1) {
                    blockValue = that.FMSynthesizer.length - 1;
                }
                docById("myRangeS0").value = parseFloat(that.FMSynthParams[0]);
                docById("myspanS0").textContent = that.FMSynthParams[0];
                that.fmSynthParamvals['modulationIndex'] = parseFloat(hat.FMSynthParams[0]);
                that._update(blockValue, that.FMSynthParams[0], 0);
                that._logo.synth.createSynth(that.instrument_name, 'fmsynth', that.fmSynthParamvals);
            }  
            if(that.isActive['duosynth'] === true) {
                if (that.duoSynthesizer.length != 1) {
                    blockValue = that.duoSynthesizer.length - 1;
                }
                docById("myRangeS0").value = parseFloat(that.duoSynthParams[0]);
                docById("myspanS0").textContent = that.duoSynthParams[0];
                that.duoSynthParamVals['vibratoRate'] = parseFloat(that.duoSynthParams[0]);
                that._update(blockValue, that.duoSynthParams[0], 0);
                docById("myRangeS1").value = parseFloat(that.duoSynthParams[1]);
                docById("myspanS1").textContent = that.duoSynthParams[1];
                that.duoSynthParamVals['vibratoAmount'] = parseFloat(that.duoSynthParams[1]);
                that._update(blockValue, that.duoSynthParams[1], 1);
                that._logo.synth.createSynth(that.instrument_name, 'duosynth', that.duoSynthParamVals);
            }             
        }
    };

    this._oscillator = function(){
        var that = this;
        var blockValue = 0;

        if(this.osc.length != 1) {
            blockValue = this.osc.length - 1;
        }

        docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
        docById("oscillatorButtonCell").onmouseover = function(){};
        docById("oscillatorButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '<div id="wrapperOsc0"><div id="sOsc0" class="rectangle"><span>Type</span></div><div id="selOsc"></div></div>';
            htmlElements += '<div id="wrapperOsc1"><div id="sOsc1" class="rectangle"><span></span></div><div id="insideDivOsc"><input type="range" id="myRangeO0"class ="sliders" style="margin-top:20px" value="2"><span id="myspanO0"class="rangeslidervalue">2</span></div></div>';
    
        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        var myDiv = docById("selOsc");
        
        var selectOpt = '<select id="selOsc1">';
        for (var i = 0; i < OSCTYPES.length; i++) {
            selectOpt += '<option value="'+OSCTYPES[i][0]+'">'+OSCTYPES[i][0]+'</option>';
        }
        selectOpt += '</select>';
        myDiv.innerHTML = selectOpt;

        document.getElementById("wrapperOsc0").addEventListener('change', function(event){
            docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
            console.log('in oscillator type');
            var elem = event.target;
            that.synthVals['oscillator']['type'] = elem.value;
            that._update(blockValue, elem.value, 0);
            that._logo.synth.createSynth(that.instrument_name, that.synthVals['oscillator']['type'], that.synthVals);
        });

        document.getElementById("wrapperOsc1").addEventListener('change', function(event){
            docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
            console.log('in oscillator Partials');
            var elem = event.target;
            docById("myRangeO0").value = parseFloat(elem.value);
            docById("myspanO0").textContent = elem.value;
            that._update(blockValue, elem.value, 1);
        });
        
        var sliderPartials = docById('myRangeO0');
        sliderPartials.min = 0;
        sliderPartials.max = 20;
        
        docById("sOsc1").textContent = "Partials";
        docById("myRangeO0").value = 6;
        docById("myspanO0").textContent = "6";
       
        docById('selOsc1').value = that.oscParams[0];
        that._update(blockValue, that.oscParams[0], 0);
        docById("myRangeO0").value = parseFloat(that.oscParams[1]);
        docById("myspanO0").textContent = that.oscParams[1];
        that._update(blockValue, that.oscParams[1], 1);

        btnReset.onclick = function() {
            docById("oscillatorButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            docById('selOsc1').value = that.oscParams[0];
            that._update(blockValue, that.oscParams[0], 0);
            
            docById("myRangeO0").value = parseFloat(that.oscParams[1]);
            docById("myspanO0").textContent = that.oscParams[1];
            that._update(blockValue, that.oscParams[1], 1);
            that._logo.synth.createSynth(that.instrument_name, that.synthVals['oscillator']['type'], that.oscillatorVals);
        }
    };

    this._envelope = function() {
        var that = this;
        var blockValue = 0;
    //    var synth_source = "triangle";

        if(this.env.length != 1) {
            blockValue = this.env.length - 1;
        }
       
        docById("envelopeButtonCell").style.backgroundColor = "#C8C8C8";
        docById("envelopeButtonCell").onmouseover = function(){};
        docById("envelopeButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = "";
        for (var i = 0; i < 4; i++) {
            htmlElements += '<div id="wrapperEnv'+i+'"><div class="circle">'+("ADSR").charAt(i)+'</div><div id="insideDivEnv"><input type="range" id="myRange'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspan'+i+'"class="rangeslidervalue">2</span></div></div>';
        };

        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        for (var i = 0; i < 4; i++) {
            docById("myRange"+i).value = parseFloat(that.ENVs[i]);
            docById("myspan"+i).textContent = that.ENVs[i];
            that.synthVals['envelope'][that.adsrMap[i]] = parseFloat(that.ENVs[i]) / 100;
            that._update(blockValue, that.ENVs[i], i);
        }

        for (var i = 0; i < 4; i++) {
            document.getElementById("wrapperEnv"+i).addEventListener('change', function(event){
                docById("envelopeButtonCell").style.backgroundColor = "#C8C8C8";
                var elem = event.target;
                var m = elem.id.slice(-1);
                docById("myRange"+m).value = parseFloat(elem.value);
                console.log(elem.value);
                docById("myspan"+m).textContent = elem.value;

                that.synthVals['envelope'][that.adsrMap[m]] = parseFloat(elem.value) / 100;
                that._update(blockValue, parseFloat(elem.value), m);
                that._logo.synth.createSynth(that.instrument_name, that.synthVals['oscillator']['type'], that.synthVals);
            }); 
        }
       
        btnReset.onclick = function() {
            docById("envelopeButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            for(var i = 0; i < 4; i++) {
                that.synthVals['envelope'][that.adsrMap[i]] = parseFloat(that.ENVs[i]) / 100;
                docById("myRange"+i).value = parseFloat(that.ENVs[i]);
                docById("myspan"+i).textContent = that.ENVs[i];
                that._update(blockValue, parseFloat(that.ENVs[i]), i);
            }
            that._logo.synth.createSynth(that.instrument_name, that.synthVals['oscillator']['type'], that.synthVals);
        }
    };

    this._filter = function() {
        var that = this;
        var blockValue = 0;
        
        docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
        docById("filterButtonCell").onmouseover = function(){};
        docById("filterButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '<div id="wrapper0"><div id="s"><span>Type</span></div><div id="sel"></div></div>';
            htmlElements += '<div id="wrapper1"><div id="s1"><span></span></div><div id="insideDivFilter"><p><input type="radio" name="rolloff" value="-12"/>-12<input type="radio" name="rolloff" value="-24"/>-24<input type="radio" name="rolloff" value="-48"/>-48<input type="radio" name="rolloff" value="-96"/>-96</p></div></div>';
            htmlElements += '<div id="wrapper2"><div id="s2"><span></span></div><div id="insideDivFilter"><input type="range" id="myRangeF2"class ="sliders" style="margin-top:20px" value="2"><span id="myspanF2"class="rangeslidervalue">2</span></div></div>';
        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button><button class="btn" id="add_filter"><b>+F</b></button>';
        var btnReset = docById("reset");
        var addFilter = docById("add_filter");
        btnReset.style.marginLeft = '180px';
        addFilter.style.marginLeft = '50px';

        var myDiv = docById("sel");
        
        var selectOpt = '<select id="sel1">';
        for (var i = 0; i < TYPES.length; i++) {
            selectOpt += '<option value="'+TYPES[i][0]+'">'+TYPES[i][0]+'</option>';
        }
        selectOpt += '</select>';
        myDiv.innerHTML = selectOpt;

        document.getElementById("wrapper0").addEventListener('change', function(event){
            docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
            var elem = event.target;
            blockValue = 0;
            that._update(blockValue, elem.value, 0);
        });

        var rolloffValue = document.getElementsByName("rolloff");
        for (var i = 0; i < rolloffValue.length; i++) {
            rolloffValue[i].onclick = function () {
                blockValue = 0;
                that._update(blockValue, this.value, 1);
            }
        }
        document.getElementById("wrapper2").addEventListener('change', function(event){
            docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
            blockValue = 0;
            var elem = event.target;
            var m = elem.id.slice(-1);
            docById("myRangeF2").value = parseFloat(elem.value);
            docById("myspanF2").textContent = elem.value;
            that._update(blockValue, elem.value, 2);
        });
     
        var sliderFrequency = docById('myRangeF2');
        sliderFrequency.max = 7050;
        
        docById("s1").textContent = "RollOff";
        docById("s2").textContent = "Frequency";
        docById("myRangeF2").value = "392";
        docById("myspanF2").textContent = "392";

        docById('sel1').value = that.filterParams[0];
        that._update(blockValue, that.filterParams[0], 0);

        that._update(blockValue, that.filterParams[1], 1);
        
        docById("myRangeF2").value = parseFloat(that.filterParams[2]);
        docById("myspanF2").textContent = that.filterParams[2];
        that._update(blockValue, that.filterParams[2], 2);
        
        if(that.fil.length === 2) {
            var extraDiv = document.createElement("div");
            var newHtmlElements = '<br><div id="newwrapper0"><div id="news"><span>Type</span></div><div id="newsel"></div></div>';
            newHtmlElements += '<div id="newwrapper1"><div id="news1"><span>RollOff</span></div><div id="insideDivFilter"><p><input type="radio" name="rolloff1" value="-12"/>-12<input type="radio" name="rolloff1" value="-24"/>-24<input type="radio" name="rolloff1" value="-48"/>-48<input type="radio" name="rolloff1" value="-96"/>-96</p></div></div>';
            newHtmlElements += '<div id="newwrapper2"><div id="news2"><span>Frequency</span></div><div id="insideDivFilter"><input type="range" id="newmyRangeF2"class ="sliders" style="margin-top:20px" value="2"><span id="newmyspanF2"class="rangeslidervalue">2</span></div></div>';
            extraDiv.className = "rectangle";
            extraDiv.innerHTML = newHtmlElements;
            env.insertBefore(extraDiv, envAppend);
            var selectOpt1 = '<select id="sel2">';
            for (var i = 0; i < TYPES.length; i++) {
                selectOpt1 += '<option value="'+TYPES[i][0]+'">'+TYPES[i][0]+'</option>';
            }
            selectOpt1 += '</select>';
               
            docById("newsel").innerHTML = selectOpt1;
            docById("newsel").style.marginTop = "-35px";

            docById("newmyRangeF2").value = "392";
            docById("newmyspanF2").textContent = "392";
            docById("newmyRangeF2").max = "7050";

            document.getElementById("newwrapper0").addEventListener('change', function(event){
                docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
                blockValue = that.fil.length - 1;
                var elem = event.target;
                that._update(blockValue, elem.value, 0);
            });

            var rolloffValue = document.getElementsByName("rolloff1");
            for (var i = 0; i < rolloffValue.length; i++) {
                blockValue = that.fil.length - 1;
                rolloffValue[i].onclick = function () {
                    that._update(blockValue, this.value, 1);
                }
            }
            document.getElementById("newwrapper2").addEventListener('change', function(event){
                docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
                blockValue = that.fil.length - 1;
                var elem = event.target;
                var m = elem.id.slice(-1);
                docById("newmyRangeF2").value = parseFloat(elem.value);
                docById("newmyspanF2").textContent = elem.value;
                that._update(blockValue, elem.value, 2);
            });
            docById('sel2').value = that.filterParams[3];

            that._update(that.fil.length-1, that.filterParams[3], 0);
            docById('news1').value = that.filterParams[3];
            that._update(that.fil.length-1, that.filterParams[4], 1);
        
            docById("newmyRangeF2").value = parseFloat(that.filterParams[5]);
            docById("newmyspanF2").textContent = that.filterParams[5];
            that._update(that.fil.length-1, that.filterParams[5], 2);
        }

        btnReset.onclick = function() {
            docById("filterButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            docById('sel1').value = that.filterParams[0];
            that._update(0, that.filterParams[0], 0);
            that._update(0, that.filterParams[1], 1);
            docById("myRangeF2").value = parseFloat(that.filterParams[2]);
            docById("myspanF2").textContent = that.filterParams[2];
            that._update(0, that.filterParams[2], 2);

            if(that.fil.length === 2){
                docById('sel2').value = that.filterParams[3];
                that._update(that.fil.length - 1, that.filterParams[3], 0);
                that._update(that.fil.length-1, that.filterParams[4], 1);
                docById("newmyRangeF2").value = parseFloat(that.filterParams[5]);
                docById("newmyspanF2").textContent = that.filterParams[5];
                that._update(that.fil.length-1, that.filterParams[5], 2);
            }
        }

        addFilter.onclick = function() {
              if (that.fil.length < 2) {
                var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);
                
                const FILTEROBJ = [[0,['filter',{}],0,0,[null,3,1,2,null]],[1,["number",{"value":-12}],512.5,289.5,[0]],[2,["number",{"value":392}],512.5,321,[0]],[3,["filtertype",{"value":"highpass"}],512.5,258,[0]]];
                that._logo.blocks.loadNewBlocks(FILTEROBJ);

                var n = that._logo.blocks.blockList.length - 4;
                that.fil.push(n);
                that.filterParams.push('highpass');
                that.filterParams.push(-12);
                that.filterParams.push(392);
                
                setTimeout(that.blockConnection(4, bottomOfClamp), 500);
            
                var extraDiv = document.createElement("div");
                var newHtmlElements = '<br><div id="newwrapper0"><div id="news"><span>Type</span></div><div id="newsel"></div></div>';
                newHtmlElements += '<div id="newwrapper1"><div id="news1"><span>RollOff</span></div><div id="insideDivFilter"><p><input type="radio" name="rolloff1" value="-12"/>-12<input type="radio" name="rolloff1" value="-24"/>-24<input type="radio" name="rolloff1" value="-48"/>-48<input type="radio" name="rolloff1" value="-96"/>-96</p></div></div>';
                newHtmlElements += '<div id="newwrapper2"><div id="news2"><span>Frequency</span></div><div id="insideDivFilter"><input type="range" id="newmyRangeF2"class ="sliders" style="margin-top:20px" value="2"><span id="newmyspanF2"class="rangeslidervalue">2</span></div></div>';
                extraDiv.className = "rectangle";
                extraDiv.innerHTML = newHtmlElements;
                env.insertBefore(extraDiv, envAppend);
                var selectOpt1 = '<select id="sel2">';
                for (var i = 0; i < TYPES.length; i++) {
                    selectOpt1 += '<option value="'+TYPES[i][0]+'">'+TYPES[i][0]+'</option>';
                }
                selectOpt1 += '</select>';
                
                docById("newsel").innerHTML = selectOpt1;
                docById("newsel").style.marginTop = "-35px";

                docById("newmyRangeF2").value = "392";
                docById("newmyspanF2").textContent = "392";

                docById("newmyRangeF2").max = "7050";

                document.getElementById("newwrapper0").addEventListener('change', function(event){
                    docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
                    blockValue = that.fil.length - 1;
                    var elem = event.target;
                    that._update(blockValue, elem.value, 0);
                });

                var rolloffValue = document.getElementsByName("rolloff1");
                for (var i = 0; i < rolloffValue.length; i++) {
                    blockValue = that.fil.length - 1;
                    rolloffValue[i].onclick = function () {
                        that._update(blockValue, this.value, 1);
                    }
                }
                document.getElementById("newwrapper2").addEventListener('change', function(event){
                    docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
                    blockValue = that.fil.length - 1;
                    var elem = event.target;
                    var m = elem.id.slice(-1);
                    docById("newmyRangeF2").value = parseFloat(elem.value);
                    docById("newmyspanF2").textContent = elem.value;
                    that._update(blockValue, elem.value, 2);
                });
            }
        }
    };

    this._effects = function(){
        console.log('hey effects');
        var that = this;
        var blockValue = 0;
        
        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
        docById("effectsButtonCell").onmouseover = function(){};
        docById("effectsButtonCell").onmouseout =  function(){};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = "";
        for(var i = 0; i < 2; i++) {
            htmlElements += '<div id ="effect'+i+'"></div>';
        }
        
        env.innerHTML = htmlElements;
        var envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        docById("envAppend").innerHTML = '<button class="btn" id="reset"><b>RESET</b></button>';
        var btnReset = docById("reset");
        btnReset.style.marginLeft = '230px';

        var mainDiv = docById("effect0");
        mainDiv.innerHTML= '<p><input type="radio" name="effectsName" value="Tremolo"/>Tremolo</br><input type="radio" name="effectsName" value="Vibrato"/>Vibrato</br><input type="radio" name="effectsName" value="Chorus"/>Chorus</br><input type="radio" name="effectsName" value="Phaser"/>Phaser</br><input type="radio" name="effectsName" value="Distortion"/>Distortion</br></p>';
        
        var subDiv = docById("effect1");
        var effectsName = document.getElementsByName("effectsName");
        var effectChosen;

        for (var i = 0; i < effectsName.length; i++) {
            effectsName[i].onclick = function () {
                effectChosen = this.value;
                var subHtmlElements = '<div id="chosen">'+effectChosen+'</div>';
                if (effectChosen === "Tremolo" ) {
                    that.isActive['tremolo'] = true;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = false;
                    
                    instruments_effects[that.instrument_name]['tremoloActive'] = true;

                    for(var i = 0; i < 2; i++) {
                        subHtmlElements += '<div id="wrapperFx'+i+'"><div id="sFx'+i+'" class="rectangle"><span></span></div><div id="insideDivEffects"><input type="range" id="myRangeFx'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspanFx'+i+'"class="rangeslidervalue">2</span></div></div>';
                    }
                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = "Rate";
                    docById('myRangeFx0').value = 10;
                    docById('myspanFx0').textContent = "10";
                    docById('sFx1').textContent = "Depth";
                    docById('myRangeFx1').value = 50;
                    docById('myspanFx1').textContent = "50";

                    if(that.tremoloEffect.length != 0) {
                        blockValue = that.tremoloEffect.length - 1;
                        for (var i = 0; i < 2; i++){
                            docById("myRangeFx"+i).value = parseFloat(that.tremoloParams[i]);
                            docById("myspanFx"+i).textContent = that.tremoloParams[i];
                            that._update(blockValue, that.tremoloParams[i], i);  
                        }
                    }

                    if (that.tremoloEffect.length === 0) {
                    // This is the first block in the child stack of the Timbre clamp.
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const TREMOLOOBJ = [[0,["tremolo",{}],0,0,[null,1,2,null,3]],[1,["number",{"value":10}],0,0,[0]],[2,["number",{"value":50}],0,0,[0]],[3,'hidden',0,0,[0,null]]];
                        that._logo.blocks.loadNewBlocks(TREMOLOOBJ);

                        that.tremoloEffect.push(n);
                        that.tremoloParams.push(10);
                        that.tremoloParams.push(50);
               
                        setTimeout(that.clampConnection(n, 3, topOfClamp), 500);
                    }

                    for(var i = 0; i < 2; i++){
                        document.getElementById("wrapperFx"+i).addEventListener('change', function(event){
                            docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                            var elem = event.target;
                            var m = elem.id.slice(-1);
                            docById("myRangeFx"+m).value = parseFloat(elem.value);
                            docById("myspanFx"+m).textContent = elem.value;
                            if (m==0){
                                instruments_effects[that.instrument_name]['tremoloFrequency'] = parseFloat(elem.value);
                            }
                            if (m==1){
                                instruments_effects[that.instrument_name]['tremoloDepth'] = parseFloat(elem.value)/100;
                            }

                            that._update(blockValue, elem.value, Number(m));
                        });    
                    }
                } else if (effectChosen === "Vibrato") {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = true;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = false;
                    

                    instruments_effects[that.instrument_name]['vibratoActive'] = true;
                    for (var i = 0; i < 2; i++) {
                        subHtmlElements += '<div id="wrapperFx'+i+'"><div id="sFx'+i+'" class="rectangle"><span></span></div><div id="insideDivEffects"><input type="range" id="myRangeFx'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspanFx'+i+'"class="rangeslidervalue">2</span></div></div>';
                    }

                    // Set slider values
                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = "Intensity";
                    docById('sFx1').textContent = "Rate";

                    if (that.vibratoEffect.length > 0) {
                        var vibratroBlock = last(that.vibratoEffect);
                        docById("myRangeFx0").value = parseFloat(that.vibratoParams[0]);
                        docById("myspanFx0").textContent = that.vibratoParams[0];
                        // Scale of rate is 0 to 1, so we need to multiply by 100
                        docById("myRangeFx1").value = 100 / parseFloat(that.vibratoParams[1]);
                        var obj = rationalToFraction(1 / parseFloat(that.vibratoParams[1]));
                        docById("myspanFx1").textContent = obj[0] + '/' + obj[1];  // that.vibratoParams[1];
                    } else {
                        // If necessary, add a vibrato block.
                        var topOfTimbreClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var vibratoBlock = that._logo.blocks.blockList.length;
                        const VIBRATOOBJ = [[0, ["vibrato", {}], 0, 0, [null, 1, 3, 2, 6]], [1, ["number", {"value": 10}], 0, 0, [0]], [2, ["vspace", {}], 0, 0, [0, null]], [3, ["divide", {}], 0, 0, [0, 4, 5]], [4, ["number", {"value": 1}], 0, 0, [3]], [5, ["number", {"value": 16}], 0, 0, [3]], [6, ["hidden", {}], 0, 0, [0, null]]];
                        that._logo.blocks.loadNewBlocks(VIBRATOOBJ);

                        that.vibratoEffect.push(vibratoBlock);
                        that.vibratoParams.push(10);
                        that.vibratoParams.push(16);

                        setTimeout(that.clampConnectionVspace(vibratoBlock, vibratoBlock + 2, topOfTimbreClamp), 500);

                        docById('myRangeFx0').value = 10;
                        docById('myspanFx0').textContent = "10";
                        // Scale of rate is 0 to 1, so we need to multiply by 100
                        docById('myRangeFx1').value = 100 / 16;
                        docById('myspanFx1').textContent = "1/16";
                    }

                    // Add the listeners for the sliders.
                    document.getElementById("wrapperFx0").addEventListener('change', function(event){
                        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                        var elem = event.target;
                        docById("myRangeFx0").value = parseFloat(elem.value);
                        docById("myspanFx0").textContent = elem.value;
                        instruments_effects[that.instrument_name]['vibratoIntensity'] = parseFloat(elem.value)/100;

                        that._update(that.vibratoEffect.length - 1, elem.value, 0);
                    });    

                    document.getElementById("wrapperFx1").addEventListener('change', function(event){
                        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                        var elem = event.target;
                        docById("myRangeFx1").value = parseFloat(elem.value);
                        var obj = oneHundredToFraction(elem.value);
                        docById("myspanFx1").textContent = obj[0] + '/' + obj[1];
                        var temp = parseFloat(obj[0])/parseFloat(obj[1]);

                        instruments_effects[that.instrument_name]['vibratoRate'] = Math.floor(Math.pow(temp, -1));
                        that._update(that.vibratoEffect.length - 1, obj[1], 1);
                        that._update(that.vibratoEffect.length - 1, obj[0], 2);
                    });    
                } else if(effectChosen === "Chorus" ) {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = true;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = false;
                    

                     instruments_effects[that.instrument_name]['chorusActive'] = true;
                    
                    for(var i = 0; i < 3; i++) {
                        subHtmlElements += '<div id="wrapperFx'+i+'"><div id="sFx'+i+'" class="rectangle"><span></span></div><div id="insideDivEffects"><input type="range" id="myRangeFx'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspanFx'+i+'"class="rangeslidervalue">2</span></div></div>';
                    }
                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = "Rate";
                    docById('myRangeFx0').value = 2;
                    docById('myspanFx0').textContent = "2";
                    docById('sFx1').textContent = "Delay(MS)";
                    docById('myRangeFx1').value = 4;
                    docById('myspanFx1').textContent = "4";
                    docById('sFx2').textContent = "Depth";
                    docById('myRangeFx2').value = 70;
                    docById('myspanFx2').textContent = "70";

                    if(that.chorusEffect.length != 0) {
                        blockValue = that.chorusEffect.length - 1;
                        for (var i = 0; i < 3; i++){
                            docById("myRangeFx"+i).value = parseFloat(that.chorusParams[i]);
                            docById("myspanFx"+i).textContent = that.chorusParams[i];
                            that._update(blockValue, that.chorusParams[i], i);  
                        }
                    }

                    if (that.chorusEffect.length === 0) {
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const CHORUSOBJ = [[0,["chorus",{}],415,305,[null,1,2,3,null,4]],[1,["number",{"value":2}],0,0,[0]],[2,["number",{"value":4}],0,0,[0]],[3,["number",{"value":70}],0,0,[0]],[4,'hidden',0,0,[0,null]]];
                        that._logo.blocks.loadNewBlocks(CHORUSOBJ);

                        that.chorusEffect.push(n);
                        that.chorusParams.push(2);
                        that.chorusParams.push(4);
                        that.chorusParams.push(70);
               
                        setTimeout(that.clampConnection(n, 4, topOfClamp), 500);
                    }

                    for(var i = 0; i < 3; i++){
                        document.getElementById("wrapperFx"+i).addEventListener('change', function(event){
                            docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                            var elem = event.target;
                            var m = elem.id.slice(-1);
                            docById("myRangeFx"+m).value = parseFloat(elem.value);
                            docById("myspanFx"+m).textContent = elem.value;
                            if (m==0){
                                instruments_effects[that.instrument_name]['chorusRate'] = parseFloat(elem.value);
                            }
                            if (m==1){
                                instruments_effects[that.instrument_name]['delayTime'] = parseFloat(elem.value);
                            }
                            if (m==2){
                                instruments_effects[that.instrument_name]['chorusDepth'] = parseFloat(elem.value)/100;
                            }
                            
                            that._update(blockValue, elem.value, Number(m));
                        });    
                    }
                } else if(effectChosen === "Phaser") {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = true;
                    

                     instruments_effects[that.instrument_name]['phaserActive'] = true;
                    
                    for(var i = 0; i < 3; i++) {
                        subHtmlElements += '<div id="wrapperFx'+i+'"><div id="sFx'+i+'" class="rectangle"><span></span></div><div id="insideDivEffects"><input type="range" id="myRangeFx'+i+'"class ="sliders" style="margin-top:20px" value="2"><span id="myspanFx'+i+'"class="rangeslidervalue">2</span></div></div>';
                    }
                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = "Rate";
                    docById('myRangeFx0').value = 5;
                    docById('myspanFx0').textContent = "5";
                    docById('sFx1').textContent = "Octaves";
                    docById('myRangeFx1').value = 3;
                    docById('myspanFx1').textContent = "3";
                    docById('sFx2').textContent = "Base Frequency";
                    docById('myRangeFx2').value = 350;
                    docById('myspanFx2').textContent = "350";

                    if(that.phaserEffect.length != 0) {
                        blockValue = that.phaserEffect.length - 1;
                        for (var i = 0; i < 3; i++){
                            docById("myRangeFx"+i).value = parseFloat(that.phaserParams[i]);
                            docById("myspanFx"+i).textContent = that.phaserParams[i];
                            that._update(blockValue, that.phaserParams[i], i);  
                        }
                    }

                    if (that.phaserEffect.length === 0) {
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const PHASEROBJ = [[0,["phaser",{}],447,251,[null,1,2,3,null,4]],[1,["number",{"value":5}],0,0,[0]],[2,["number",{"value":3}],0,0,[0]],[3,["number",{"value":350}],0,0,[0]],[4,'hidden',0,0,[0,null]]];
                        that._logo.blocks.loadNewBlocks(PHASEROBJ);

                        that.phaserEffect.push(n);
                        that.phaserParams.push(5);
                        that.phaserParams.push(3);
                        that.phaserParams.push(350);
               
                        setTimeout(that.clampConnection(n, 4, topOfClamp), 500);
                    }

                    for(var i = 0; i < 3; i++){
                        document.getElementById("wrapperFx"+i).addEventListener('change', function(event){
                            docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                            var elem = event.target;
                            var m = elem.id.slice(-1);
                            docById("myRangeFx"+m).value = parseFloat(elem.value);
                            docById("myspanFx"+m).textContent = elem.value;

                            if (m==0){
                                instruments_effects[that.instrument_name]['rate'] = parseFloat(elem.value);
                            }
                            if (m==1){
                                instruments_effects[that.instrument_name]['octaves'] = parseFloat(elem.value);
                            }
                            if (m==2){
                                instruments_effects[that.instrument_name]['baseFrequency'] = parseFloat(elem.value);
                            }

                            that._update(blockValue, elem.value, Number(m));
                        });    
                    }
                } else if(effectChosen === "Distortion") {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = true;
                    that.isActive['phaser'] = false;
                    

                     instruments_effects[that.instrument_name]['distortionActive'] = true;

                    subHtmlElements += '<div id="wrapperFx0"><div id="sFx0" class="rectangle"><span></span></div><div id="insideDivEffects"><input type="range" id="myRangeFx0"class ="sliders" style="margin-top:20px" value="2"><span id="myspanFx0"class="rangeslidervalue">2</span></div></div>';

                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = "Distortion Amount";
                    docById('myRangeFx0').value = 40;
                    docById('myspanFx0').textContent = "40";

                    if(that.distortionEffect.length != 0) {
                        blockValue = that.distortionEffect.length - 1;
                        docById("myRangeFx0").value = parseFloat(that.distortionParams[0]);
                        docById("myspanFx0").textContent = that.distortionParams[0];
                        that._update(blockValue, that.distortionParams[0], 0);  
                    }    
                    
                    if (that.distortionEffect.length === 0) {
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const DISTORTIONOBJ = [[0,["dis",{}],0,0,[null,1,null,2]],[1,["number",{"value":40}],0,0,[0]],[2,'hidden',0,0,[0,null]]];
                        that._logo.blocks.loadNewBlocks(DISTORTIONOBJ);

                        that.distortionEffect.push(n);
                        that.distortionParams.push(40);
                        
                        setTimeout(that.clampConnection(n, 2, topOfClamp), 500);
                    }
                    document.getElementById("wrapperFx0").addEventListener('change', function(event){
                        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                        var elem = event.target;
                        var m = elem.id.slice(-1);
                        docById("myRangeFx0").value = parseFloat(elem.value);
                        docById("myspanFx0").textContent = elem.value;
                        instruments_effects[that.instrument_name]['distortionAmount'] = parseFloat(elem.value)/100;
                        that._update(blockValue, elem.value, 0);
                    });    
                }
            }
        }
        
        btnReset.onclick = function() {
            docById("effectsButtonCell").style.backgroundColor = MATRIXBUTTONCOLOR;
            if(that.isActive['tremolo'] === true) {
                if (that.tremoloEffect.length != 1) {
                    blockValue = that.tremoloEffect.length - 1;
                }
                for (var i = 0; i < 2; i++){
                    docById("myRangeFx"+i).value = parseFloat(that.tremoloParams[i]);
                    docById("myspanFx"+i).textContent = that.tremoloParams[i];
                    that._update(blockValue, that.tremoloParams[i], i);  
                }
            }  
            if(that.isActive['vibrato'] === true) {
                if (that.vibratoEffect.length != 1) {
                    blockValue = that.vibratoEffect.length - 1;
                }
                for (var i = 0; i < 2; i++){
                    docById("myRangeFx"+i).value = parseFloat(that.vibratoParams[i]);
                    docById("myspanFx"+i).textContent = that.vibratoParams[i];
                    that._update(blockValue, that.vibratoParams[i], i);  
                }
            }  
            if(that.isActive['phaser'] === true) {
                if (that.phaserEffect.length != 1) {
                    blockValue = that.phaserEffect.length - 1;
                }
                for (var i = 0; i < 3; i++){
                    docById("myRangeFx"+i).value = parseFloat(that.phaserParams[i]);
                    docById("myspanFx"+i).textContent = that.phaserParams[i];
                    that._update(blockValue, that.phaserParams[i], i);  
                }
            } 
            if(that.isActive['chorus'] === true) {
                if (that.chorusEffect.length != 1) {
                    blockValue = that.chorusEffect.length - 1;
                }
                for (var i = 0; i < 3; i++){
                    docById("myRangeFx"+i).value = parseFloat(that.chorusParams[i]);
                    docById("myspanFx"+i).textContent = that.chorusParams[i];
                    that._update(blockValue, that.chorusParams[i], i);  
                }
            } 
            if(that.isActive['distortion'] === true) {
                if (that.distortionEffect.length != 1) {
                    blockValue = that.dstortionEffect.length - 1;
                }

                docById("myRangeFx0").value = parseFloat(that.distortionParams[0]);
                docById("myspanFx0").textContent = that.distortionParams[0];
                that._update(blockValue, that.distortionParams[0], 0);  
            }             
        }
    };
};