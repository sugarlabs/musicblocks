// Copyright (c) 2015 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Based on ta-stats.py by Walter Bender

// TODO: CLEAN UP THIS LIST

// Assign each block to a bin.
const TACAT = {
    'newnote': 'note',
    'rest2': 'note',
    'osctime': 'note',
    'turtlenote': 'notefactor',

    'rhythmicdot': 'rhythm',
    'tie': 'rhythm',
    'multiplybeatfactor': 'rhythm',
    'dividebeatfactor': 'rhythm',
    'skipnotes': 'rhythm',
    'duplicatenotes': 'rhythm',
    'backward': 'rhythm',
    'setbpm': 'rhythm',
    'setmasterbpm': 'rhythm',
    'newswing2': 'rhythm',
    'drift': 'rhythm',

    'matrix': 'ignore',
    'tuplet2': 'ignore',
    'rhythm': 'ignore',
    'rhythmruler': 'ignore',
    'pitchstaircase': 'ignore',
    'pitchslider': 'ignore',
    'status': 'ignore',
    'pitchdrummatrix': 'ignore',
    'tempo': 'ignore',
    'modewidget': 'ignore',

    'bpmfactor': 'rhythmfactor',
    'beatfactor': 'rhythmfactor',
    'skipfactor': 'rhythmfactor',
    'duplicationfactor': 'rhythmfactor',

    'notename': 'ignore',
    'solfege': 'ignore',
    'drumname': 'ignore',
    'voicename': 'ignore',
    'modename': 'ignore',

    'hertz': 'pitch',
    'pitch': 'pitch',
    'steppitch': 'pitch',
    'sharp': 'pitch',
    'flat': 'pitch',

    'transpositionfactor': 'transposefactor',
    'consonantstepsizedown': 'transposefactor',
    'consonantstepsizeup': 'transposefactor',
    'turtlepitch': 'transposefactor',
    'number2pitch': 'transposefactor',
    'number2octave': 'transposefactor',

    'settransposition': 'transpose',
    'invert': 'transpose',
    'invert2': 'transpose',

    'diminished': 'pitchchord',
    'augmented': 'pitchchord',
    'perfect': 'pitchchord',
    'minor': 'pitchchord',
    'major': 'pitchchord',
    'interval': 'pitchchord',

    'staccatofactor': 'tonefactor',
    'sluffactor': 'tonefactor',
    'notevolumefactor': 'tonefactor',
    'key': 'tonefactor',

    'setkey': 'tone',
    'setkey2': 'tone',
    'setvoice': 'tone',
    'setdrum': 'tone',
    'articulation': 'tone',
    'setnotevolume2': 'tone',
    'newstaccato': 'tone',
    'newslur': 'tone',
    'swing': 'tone',
    'crescendo': 'tone',

    'clear': 'forward',
    'forward': 'forward',
    'back': 'forward',
    'left': 'forward',
    'right': 'forward',

    'arc': 'arc',
    'bezier': 'arc',
    'controlpoint1': 'arc',
    'controlpoint2': 'arc',

    'x': 'coord',
    'y': 'coord',
    'heading': 'coord',

    'setxy': 'setxy',
    'seth': 'setxy',

    'settranslucency': 'pen',
    'sethue': 'pen',
    'penup': 'pen',
    'setpensize': 'pen',
    'setcolor': 'pen',
    'pensize': 'pen',
    'color': 'pen',
    'setshade': 'pen',
    'setgray': 'pen',
    'gray': 'pen',
    'fillscreen': 'pen',
    'pendown': 'pen',

    'beginfill': 'fill',
    'fill': 'fill',
    'setfont': 'fill',
    'hollowline': 'fill',
    'endfill': 'fill',

    'plus': 'number',
    'minus': 'number',
    'multiply': 'number',
    'divide': 'number',
    'oneOf': 'number',
    'shade': 'pen',
    'mod': 'number',
    'int': 'number',
    'sqrt': 'number',
    'identity': 'number',

    'and': 'boolean',
    'or': 'boolean',
    'not': 'boolean',
    'greater': 'boolean',
    'less': 'boolean',
    'equal': 'boolean',

    'random': 'random',

    'repeat': 'repeat',
    'forever': 'repeat',

    'if': 'ifthen',
    'ifthenelse': 'ifthen',
    'while': 'ifthen',
    'until': 'ifthen',

    'action': 'action',
    'do': 'action',
    'nameddo': 'action',
    'listen': 'action',
    'broadcast': 'action',
    'calc': 'action',
    'doArg': 'action',
    'calcArg': 'action',
    'dispatch': 'action',
    'namedcalc': 'action',
    'nameddoArg': 'action',
    'namedcalcArg': 'action',

    'storein': 'box',
    'namedbox': 'box',
    'incrementOne': 'box',

    'luminance': 'sensor',
    'mousex': 'sensor',
    'mousey': 'sensor',

    'drum': 'action',
    'start': 'action',

    'mousebutton': 'sensor',
    'keyboard': 'sensor',
    'readpixel': 'sensor',
    'see': 'sensor',
    'time': 'sensor',
    'sound': 'sensor',
    'volume': 'sensor',
    'resistance': 'sensor',
    'voltage': 'sensor',
    'kbinput': 'sensor',

    'video': 'media',
    'wait': 'media',
    'camera': 'media',
    'journal': 'media',
    'audio': 'media',
    'show': 'media',
    'setscale': 'media',
    'savepix': 'media',
    'savesvg': 'media',
    'mediawait': 'media',
    'mediapause': 'media',
    'mediastop': 'media',
    'mediaplay': 'media',
    'speak': 'media',
    'sinewave': 'media',
    'description': 'media',

    'push': 'extras',
    'pop': 'extras',
    'printheap': 'extras',
    'clearheap': 'extras',
    'isheapempty': 'extras',
    'chr': 'extras',

    'int': 'number',

    'myfunction': 'python',
    'userdefined': 'python',
    'box': 'box',
    'showHeap': 'extras',
    'emptyHeap': 'extras',
    'loadblock': 'python',
    'loadpalette': 'python',

    'hidden': 'ignore',
    'hiddennoflow': 'ignore',
    'text': 'ignore',
    'number': 'ignore',
    'hspace': 'ignore',
    'vspace': 'ignore'
};

// Assign each bin to a palette.
const TAPAL = {
    'note': 'notesp',
    'rhythm': 'notesp',
    'rhythmfactor': 'notesp',
    'notefactor': 'notesp',
    'pitch': 'pitchp',
    'pitchchord': 'pitchp',
    'transpose': 'pitchp',
    'transposefactor': 'pitchp',
    'tone': 'tonep',
    'forward': 'turtlep',
    'arc': 'turtlep',
    'coord': 'turtlep',
    'setxy': 'turtlep',
    'pen': 'penp',
    'fill': 'penp',
    'random': 'numberp',
    'boolean': 'numberp',
    'repeat': 'flowp',
    'ifthen': 'flowp',
    'action': 'boxp',
    'box': 'boxp',
    'sensor': 'sensorp',
    'media': 'mediap',
    'extras': 'extrasp',
    'number': 'numberp',
    'python': 'extrasp',
    'ignore': 'numberp'
};

// Assign a score for each bin.
const TASCORE = {
    'note': 1,
    'notefactor': 1,
    'rhythm': 5,
    'rhythmfactor': 5,
    'pitchchord': 3,
    'pitch': 1,
    'transpose': 5,
    'transposefactor': 5,
    'tone': 5,
    'forward': 3,
    'arc': 3,
    'setxy': 2.5,
    'coord': 4,
    'turtlep': 5,
    'pen': 2.5,
    'fill': 2.5,
    'penp': 5,
    'number': .5,
    'boolean': 2.5,
    'random': 2.5,
    'repeat': 2.5,
    'ifthen': 7.5,
    'flowp': 10,
    'box': 7.5,
    'action': 7.5,
    'boxp': 0,
    'media': 5,
    'mediap': 0,
    'python': 5,
    'extras': 5,
    'extrasp': 0,
    'ignore': 0,
    'sensor': 5,
    'sensorp': 0
};

// The list of palettes.
const PALS = ['notesp', 'pitchp', 'tonep', 'turtlep', 'penp', 'numberp', 'flowp', 'boxp', 'sensorp', 'mediap', 'extrasp'];

const PALLABELS = [_('rhythm'), _('pitch'), _('tone'), _('turtle'), _('pen'), _('number'), _('flow'), _('action'), _('sensors'), _('media'), _('extras')];


function analyzeProject(blocks) {
    // Parse block data and generate score based on rubric

    var blockList = [];
    for (var blk = 0; blk < blocks.blockList.length; blk++) {
        if (blocks.blockList[blk].trash) {
            continue;
        }
        // Check to see if the block is solo or has no child flow..
        switch(blocks.blockList[blk].name) {
        case 'rhythmicdot':
        case 'tie':
        case 'drift':
        case 'osctime':
        case 'sharp':
        case 'flat':
        case 'fill':
        case 'hollowline':
	case 'start':
            if (blocks.blockList[blk].connections[1] == null) {
		continue;
	    }
            break;
        case 'note':
        case 'dividebeatfactor':
        case 'multiplybeatfactor':
        case 'duplicatenotes':
        case 'skipnotes':
        case 'setbpm':
        case 'settransposition':
        case 'staccato':
        case 'slur':
        case 'swing':
        case 'crescendo':
        case 'setnotevolume2':
        case 'action':
            if (blocks.blockList[blk].connections[2] == null) {
		continue;
	    }
	    break;
        case 'invert':
        case 'tuplet2':
            if (blocks.blockList[blk].connections[3] == null) {
		continue;
	    }
	    break;
	default:
            if (blocks.blockList[blk].connections[0] == null && last(blocks.blockList[blk].connections) == null) {
		continue;
	    }
	    break;
	}
        blockList.push(blocks.blockList[blk].name);
    }

    scores = [];
    for (var i = 0; i < PALS.length; i++) {
        scores.push(0);
    }

    cats = [];
    pals = [];

    for (var b = 0; b < blockList.length; b++) {
        if (blockList[b] in TACAT) {
            if (!(TACAT[blockList[b]] in cats)) {
                cats.push(TACAT[blockList[b]]);
            }
        } else {
           console.log(blockList[b] + ' not in catalog');
        }
    }
    for (var c = 0; c < cats.length; c++) {
        if (cats[c] in TAPAL) {
            if (!(TAPAL[cats[c]] in pals)) {
                pals.push(TAPAL[cats[c]]);
            }
        }
    }

    for (var c = 0; c < cats.length; c++) {
        if (cats[c] in TASCORE) {
            scores[PALS.indexOf(TAPAL[cats[c]])] += TASCORE[cats[c]];
        }
    }

    for (var p = 0; p < pals.length; p++) {
        if (pals[p] in TASCORE) {
            scores[PALS.indexOf(pals[p])] += TASCORE[pals[p]];
        }
    }

    return scores;
};


function scoreToChartData(scores) {
    var normalizedScores = [];
    var maxScore = 0;
    for (var i = 0; i < scores.length; i++) {
        if (scores[i] > maxScore) {
            maxScore = scores[i];
        }
    }

    if (maxScore > 0) {
        var scale = 100 / maxScore;
    } else {
        var scale = 1;
    }

    if (scale > 1) {
        scale = 1;
    }

    for (var i = 0; i < scores.length; i++) {
        normalizedScores.push(scores[i] * scale);
    }

    var data = {
        labels: PALLABELS,
        datasets: [
            {
                label: '',
                fillColor: 'rgba(220,220,220,0.4)',
                strokeColor: 'rgba(220,220,220,1)',
                pointColor: 'rgba(220,220,220,1)',
                pointStrokeColor: '#fff',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgba(220,220,220,1)',
                data: normalizedScores,
            },
        ]
    };

    return data;
};


function getChartOptions(callback) {
    return {
    // Callback for rendering chart into a bitmap
    onAnimationComplete: callback,

    //Boolean - Whether to show lines for each scale point
    scaleShowLine : true,

    //Boolean - Whether we show the angle lines out of the radar
    angleShowLineOut : true,

    //Boolean - Whether to show labels on the scale
    scaleShowLabels : false,

    // Boolean - Whether the scale should begin at zero
    scaleBeginAtZero : true,

    //String - Colour of the angle line
    angleLineColor : 'rgba(0,0,0,.2)',

    //Number - Pixel width of the angle line
    angleLineWidth : 10,

    //String - Point label font declaration
    pointLabelFontFamily : 'Arial',

    //String - Point label font weight
    pointLabelFontStyle : 'normal',

    //Number - Point label font size in pixels
    pointLabelFontSize : 30,

    //String - Point label font colour
    pointLabelFontColor : '#666',

    //Boolean - Whether to show a dot for each point
    pointDot : true,

    //Number - Radius of each point dot in pixels
    pointDotRadius : 18,

    //Number - Pixel width of point dot stroke
    pointDotStrokeWidth : 6,

    //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
    pointHitDetectionRadius : 20,

    //Boolean - Whether to show a stroke for datasets
    datasetStroke : true,

    //Number - Pixel width of dataset stroke
    datasetStrokeWidth : 12,

    //Boolean - Whether to fill the dataset with a colour
    datasetFill : true,

    //String - A legend template
    legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    }
};
