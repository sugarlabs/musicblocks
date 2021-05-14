// Copyright (c) 2015-2021 Walter Bender
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

/*
   globals

   _, last, isCustomTemperament, getTemperament
 */

/*
Globals location

- js/utils/musicutils.js
    isCustomTemperament, getTemperament

- js/utils/utils.js
    _, last
*/

/* exported analyzeProject, scoreToChartData, getChartOptions, runAnalytics,
   getStatsFromNotation
*/

/* eslint-disable no-dupe-keys */

// Assign each block to a bin.
const TACAT = {
    // deprecated blocks
    rest: "ignore",
    square: "ignore",
    triangle: "ignore",
    sine: "ignore",
    sawtooth: "ignore",
    invert2: "ignore",
    invert: "ignore",
    rhythm: "ignore",
    rhythmruler: "ignore",
    swing: "ignore",
    newswing: "ignore",
    rhythmicdot: "ignore",
    note: "ignore",
    harmonic: "ignore",
    neighbor: "ignore",
    setvoice: "ignore",
    synthname: "ignore",
    setkey: "ignore",
    drum: "ignore",
    saveabc: "ignore",
    savelilypond: "ignore",
    savesvg: "ignore",
    flat: "ignore",
    sharp: "ignore",
    diminished: "ignore",
    augmented: "ignore",
    perfect: "ignore",
    minor: "ignore",
    major: "ignore",

    // pitch palette

    invertmode: "pitchfactor",
    transpositionfactor: "pitchfactor",
    consonantstepsizedown: "pitchfactor",
    consonantstepsizeup: "pitchfactor",
    deltapitch: "pitchfactor",
    mypitch: "pitchfactor",
    setpitchnumberoffset: "pitchfactor",
    number2pitch: "pitchfactor",
    number2octave: "pitchfactor",

    accidentalname: "ignore",
    eastindiansolfege: "ignore",
    notename: "ignore",
    solfege: "ignore",

    invert1: "transpose",
    register: "transpose",
    settransposition: "transpose",
    interval: "pitch",
    accidental: "pitch",
    hertz: "pitch",
    pitchnumber: "pitch",
    scaledegree: "pitch",
    steppitch: "pitch",
    pitch: "pitch",

    // matrix palette

    oscillator: "ignore",
    filtertype: "ignore",
    oscillatortype: "ignore",
    envelope: "ignore",
    filter: "ignore",
    tuplet2: "rhythm",
    tuplet3: "rhythm",
    tuplet4: "rhythm",
    stuplet: "rhythm",
    rhythm2: "rhythm",
    timbre: "ignore",
    modewidget: "ignore",
    tempo: "ignore",
    temperament: "ignore",
    pitchdrummatrix: "ignore",
    pitchslider: "ignore",
    musickeyboard: "ignore",
    pitchstaircase: "ignore",
    rhythmruler2: "ignore",
    matrix: "ignore",
    status: "ignore",

    // rhythm palette
    mynotevalue: "rhythmfactor",
    duplicatefactor: "rhythmfactor",
    skipfactor: "rhythmfactor",
    osctime: "rhythm",
    newswing2: "rhythm",
    backward: "rhythm",
    skipnotes: "rhythm",
    duplicatenotes: "rhythm",
    multiplybeatfactor: "rhythm",
    tie: "rhythm",
    rhythmicdot2: "rhythm",
    rest2: "note",
    newnote: "note",

    // meter palette

    beatfactor: "rhythmfactor",
    bpmfactor: "rhythmfactor",
    measurevalue: "rhythmfactor",
    beatvalue: "rhythmfactor",
    notecounter: "rhythmfactor",
    elapsednotes: "rhythmfactor",
    elapsednotes2: "rhythmfactor",
    drift: "rhythmfactor",
    offbeatdo: "rhythm",
    onbeatdo: "rhythm",
    setmasterbpm2: "rhythm",
    setmasterbpm: "rhythm",
    setbpm2: "rhythm",
    setbpm: "rhythm",
    pickup: "rhythm",
    meter: "rhythm",

    // tone palette

    staccatofactor: "tonefactor",
    slurfactor: "tonefactor",
    amsynth: "ignore",
    fmsynth: "ignore",
    duosynth: "ignore",
    partial: "tone",
    harmonic2: "tone",
    neighbor2: "tone",
    dis: "tone",
    tremolo: "tone",
    phaser: "tone",
    chorus: "tone",
    vibrato: "tone",
    setvoice: "tone",
    glide: "tone",
    slur: "tone",
    staccato: "tone",
    newslur: "tone",
    newstaccato: "tone",
    synthname: "tone",
    voicename: "tone",
    settimbre: "tone",
    settemperament: "tone",
    // interval palette

    modename: "ignore",
    doubly: "pitchchord",
    intervalname: "ignore",
    measureintervalsemitones: "pitchfactor",
    measureintervalscalar: "pitchfactor",
    semitoneinterval: "pitchchord",
    interval: "pitchchord",
    definemode: "pitchchord",
    movable: "pitchchord",
    modelength: "pitchfactor",
    key: "pitchchord",
    setkey2: "pitchchord",

    // drum palette

    drumname: "ignore",
    effectsname: "ignore",
    setdrum: "tone",
    playdrum: "tone",

    // turtle palette

    heading: "coord",
    y: "coord",
    x: "coord",
    clear: "forward",
    controlpoint2: "ignore",
    controlpoint1: "ignore",
    bezier: "arc",
    arc: "arc",
    setheading: "setxy",
    setxy: "setxy",
    right: "forward",
    left: "forward",
    back: "forward",
    forward: "forward",

    // pen palette

    beginfill: "fill",
    endfill: "fill",
    fillscreen: "fill",
    grey: "pen",
    shade: "pen",
    color: "pen",
    pensize: "pen",
    setfont: "pen",
    background: "fill",
    hollowline: "fill",
    fill: "fill",
    penup: "pen",
    pendown: "pen",
    setpensize: "pen",
    settranslucency: "pen",
    sethue: "pen",
    setshade: "pen",
    setgrey: "pen",
    setcolor: "pen",

    // boolean palette

    int: "boolean",
    not: "boolean",
    and: "boolean",
    or: "boolean",
    greater: "boolean",
    less: "boolean",
    equal: "boolean",
    boolean: "boolean",

    // numbers palette

    eval: "ignore",
    mod: "number",
    power: "number",
    sqrt: "number",
    abs: "number",
    divide: "number",
    multiply: "number",
    neg: "number",
    minus: "number",
    plus: "number",
    oneOf: "random",
    random: "random",
    number: "ignore",

    // box palette

    incrementOne: "box",
    increment: "box",
    box: "ignore",
    namedbox: "ignore",
    storein2: "box",
    storein: "box",

    // action palette

    do: "action",
    return: "action",
    returnToUrl: "action",
    calc: "action",
    namedcalc: "action",
    nameddoArg: "action",
    namedcalcArg: "action",
    doArg: "action",
    calcArg: "action",
    arg: "action",
    namedarg: "action",
    listen: "action",
    dispatch: "action",
    start: "ignore",
    action: "action",
    nameddo: "action",

    // heap palette

    loaHeapFromApp: "box",
    saveHeapToApp: "box",
    showHeap: "box",
    heapLength: "box",
    heapEmpty: "box",
    emptyHeap: "box",
    saveHeap: "programming",
    loadHeap: "programming",
    indexHeap: "box",
    setHeapEntry: "box",
    pop: "box",
    push: "box",

    // dictionary palette
    getDict: "box",
    setDict: "box",

    // media palette

    leftpos: "ignore",
    rightpos: "ignore",
    toppos: "ignore",
    bottompos: "ignore",
    width: "ignore",
    height: "ignore",
    stopplayback: "ignore",
    playback: "ignore",
    speak: "media",
    camera: "ignore",
    video: "ignore",
    loadFile: "ignore",
    stopvideocam: "ignore",
    tone: "media",
    tofrequency: "media",
    turtleshell: "media",
    show: "media",
    media: "ignore",
    text: "ignore",

    // flow palette

    hiddennoflow: "ignore",
    hidden: "ignore",
    defaultcase: "ignore",
    case: "ignore",
    switch: "iften",
    clamp: "ignore",
    break: "ignore",
    waitFor: "ifthen",
    until: "ifthen",
    while: "ifthen",
    ifthenelse: "ifthen",
    if: "ifthen",
    forever: "repeat",
    repeat: "repeat",

    // extras palette

    nopValueBlock: "ignore",
    nopOneArgMathBlock: "ignore",
    nopTwoArgMathBlock: "ignore",
    nopZeroArgBlock: "ignore",
    nopOneArgBlock: "ignore",
    nopTwoArgBlock: "ignore",
    nopThreeArgBlock: "ignore",
    openpalette: "programming",
    deleteblock: "programming",
    moveblock: "programming",
    runblock: "programming",
    dockblock: "programming",
    makeblock: "programming",
    saveabc: "ignore",
    savelilypond: "ignore",
    savesvg: "ignore",
    nobackground: "ignore",
    showblocks: "ignore",
    hideblocks: "ignore",
    openProject: "ignore",
    vspace: "ignore",
    hspace: "ignore",
    wait: "ignore",
    comment: "ignore",
    print: "ignore",

    // sensors palette

    pitchness: "sensor",
    loudness: "sensor",
    myclick: "sensor",
    getblue: "sensor",
    getgreen: "sensor",
    getred: "sensor",
    getcolorpixel: "sensor",
    time: "sensor",
    mousey: "sensor",
    mousex: "sensor",
    mousebutton: "sensor",
    toascii: "sensor",
    keyboard: "sensor",

    // mice palette

    stopTurtle: "mice",
    startTurtle: "mice",
    turtlecolor: "mice",
    turtleheading: "mice",
    setxyturtle: "mice",
    yturtle: "mice",
    xturtle: "mice",
    turtleelapsednotes: "mice",
    turtlepitch: "mice",
    turtlenote: "mice",
    turtlenote2: "mice",
    turtlesync: "mice",
    turtlename: "ignore",
    setturtlename: "mice",
    setturtlename2: "mice",

    // volume palette

    notevolumefactor: "tone",
    setsynthvolume2: "tone",
    setsynthvolume: "tone",
    setnotevolume: "tone",
    setnotevolume2: "tone",
    articulation: "tone",
    crescendo: "tone"
};

// Assign each bin to a palette.
const TAPAL = {
    beat: "notesp",
    note: "notesp",
    rhythm: "notesp",
    rhythmfactor: "notesp",
    pitch: "pitchp",
    pitchchord: "pitchp",
    transpose: "pitchp",
    pitchfactor: "pitchp",
    tone: "tonep",
    forward: "turtlep",
    arc: "turtlep",
    coord: "turtlep",
    setxy: "turtlep",
    pen: "penp",
    fill: "penp",
    random: "numberp",
    boolean: "numberp",
    repeat: "flowp",
    ifthen: "flowp",
    action: "boxp",
    box: "boxp",
    sensor: "sensorp",
    media: "mediap",
    mice: "micep",
    number: "numberp",
    programming: "numberp",
    ignore: "numberp"
};

// Assign a score for each bin.
const TASCORE = {
    note: 1,
    rhythmfactor: 1,
    beat: 10,
    rhythm: 5,
    rhythmfactor: 5,
    pitchchord: 3,
    pitch: 1,
    transpose: 5,
    pitchfactor: 5,
    tone: 5,
    forward: 3,
    arc: 3,
    setxy: 2.5,
    coord: 4,
    turtlep: 5,
    pen: 2.5,
    fill: 2.5,
    penp: 5,
    number: 0.5,
    boolean: 2.5,
    random: 2.5,
    repeat: 2.5,
    ifthen: 5,
    flowp: 2.5,
    box: 2.5,
    action: 2.5,
    boxp: 0,
    media: 5,
    mediap: 0,
    programming: 5,
    mice: 7.5,
    micep: 2.5,
    ignore: 0,
    sensor: 5,
    sensorp: 0
};

// The list of palettes.
const PALS = [
    "notesp",
    "pitchp",
    "tonep",
    "turtlep",
    "penp",
    "numberp",
    "flowp",
    "boxp",
    "sensorp",
    "mediap",
    "micep"
];

const PALLABELS = [
    _("rhythm"),
    _("pitch"),
    _("tone"),
    _("mouse"),
    _("pen"),
    _("number"),
    _("flow"),
    _("action"),
    _("sensors"),
    _("media"),
    _("mice")
];

function analyzeProject(activity) {
    // Parse block data and generate score based on rubric
    const blocks = activity.blocks;

    const blockList = [];
    for (let blk = 0; blk < activity.blocks.blockList.length; blk++) {
        if (activity.blocks.blockList[blk].trash) {
            continue;
        }

        // Check to see if the block is solo or has no child flow..
        switch (activity.blocks.blockList[blk].name) {
            case "rhythmicdot":
            case "tie":
            case "drift":
            case "osctime":
            case "sharp":
            case "flat":
            case "fill":
            case "hollowline":
            case "start":
                if (activity.blocks.blockList[blk].connections[1] == null) {
                    continue;
                }
                break;
            case "note":
            case "multiplybeatfactor":
            case "duplicatenotes":
            case "skipnotes":
            case "setbpm":
            case "settransposition":
            case "staccato":
            case "slur":
            case "swing":
            case "crescendo":
            case "setnotevolume2":
            case "vibrato":
            case "tremolo":
            case "dis":
            case "chorus":
            case "phaser":
            case "action":
                if (activity.blocks.blockList[blk].connections[2] == null) {
                    continue;
                }
                break;
            case "tuplet2":
                if (activity.blocks.blockList[blk].connections[3] == null) {
                    continue;
                }
                break;
            case "invert":
                if (activity.blocks.blockList[blk].connections[4] == null) {
                    continue;
                }
                break;
            default:
                if (
                    activity.blocks.blockList[blk].connections[0] == null &&
                    last(activity.blocks.blockList[blk].connections) == null
                ) {
                    continue;
                }
                break;
        }
        blockList.push(activity.blocks.blockList[blk].name);
    }

    const scores = [];
    for (let i = 0; i < PALS.length; i++) {
        scores.push(0);
    }

    const cats = [];
    const pals = [];

    for (let b = 0; b < blockList.length; b++) {
        if (blockList[b] in TACAT) {
            if (!(TACAT[blockList[b]] in cats)) {
                cats.push(TACAT[blockList[b]]);
            }
        } else {
            // eslint-disable-next-line no-console
            console.debug(blockList[b] + " not in catalog");
        }
    }
    for (let c = 0; c < cats.length; c++) {
        if (cats[c] in TAPAL) {
            if (!(TAPAL[cats[c]] in pals)) {
                pals.push(TAPAL[cats[c]]);
            }
        }
    }

    for (let c = 0; c < cats.length; c++) {
        if (cats[c] in TASCORE) {
            scores[PALS.indexOf(TAPAL[cats[c]])] += TASCORE[cats[c]];
        }
    }

    for (let p = 0; p < pals.length; p++) {
        if (pals[p] in TASCORE) {
            scores[PALS.indexOf(pals[p])] += TASCORE[pals[p]];
        }
    }

    return scores;
}

function scoreToChartData(scores) {
    const normalizedScores = [];
    let maxScore = 0;
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] > maxScore) {
            maxScore = scores[i];
        }
    }

    let scale = 1;
    if (maxScore > 0) {
        scale = 100 / maxScore;
    }

    if (scale > 1) {
        scale = 1;
    }

    for (let i = 0; i < scores.length; i++) {
        normalizedScores.push(scores[i] * scale);
    }

    return {
        labels: PALLABELS,
        datasets: [
            {
                label: "",
                fillColor: "rgba(220,220,220,0.4)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: normalizedScores
            }
        ]
    };
}

function getChartOptions(callback) {
    return {
        // Callback for rendering chart into a bitmap
        onAnimationComplete: callback,

        //Boolean - Whether to show lines for each scale point
        scaleShowLine: true,

        //Boolean - Whether we show the angle lines out of the radar
        angleShowLineOut: true,

        //Boolean - Whether to show labels on the scale
        scaleShowLabels: false,

        // Boolean - Whether the scale should begin at zero
        scaleBeginAtZero: true,

        //String - Colour of the angle line
        angleLineColor: "rgba(0,0,0,.2)",

        //Number - Pixel width of the angle line
        angleLineWidth: 10,

        //String - Point label font declaration
        pointLabelFontFamily: "Arial",

        //String - Point label font weight
        pointLabelFontStyle: "normal",

        //Number - Point label font size in pixels
        pointLabelFontSize: 30,

        //String - Point label font colour
        pointLabelFontColor: "#666",

        //Boolean - Whether to show a dot for each point
        pointDot: true,

        //Number - Radius of each point dot in pixels
        pointDotRadius: 18,

        //Number - Pixel width of point dot stroke
        pointDotStrokeWidth: 6,

        //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius: 20,

        //Boolean - Whether to show a stroke for datasets
        datasetStroke: true,

        //Number - Pixel width of dataset stroke
        datasetStrokeWidth: 12,

        //Boolean - Whether to fill the dataset with a colour
        datasetFill: true,

        //String - A legend template
        legendTemplate:
            '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].strokeColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
    };
}

const runAnalytics = (activity) => {
    const logo = activity.logo;
    const turtles = activity.turtles;
    // Using lilypond output to run through code and get some stats.
    logo.runningLilypond = true;
    logo.notationNotes = {};
    for (let turtle = 0; turtle < turtles.turtleList.length; turtle++) {
        logo.notation.notationStaging[turtle] = [];
        logo.notation.notationDrumStaging[turtle] = [];
        turtles.turtleList[turtle].painter.doClear(true, true, true);
    }
    document.body.style.cursor = "wait";
    logo.collectingStats = true;
    logo.runLogoCommands();
};

const getStatsFromNotation = (activity) => {
    const projectStats = {};
    // since we use the lilypond output to generate stats , please make sure to change these rules if
    // we ever change the lilypond notation structure.
    const notation = activity.logo.notation;
    projectStats["duples"] = 0;
    projectStats["triplets"] = 0;
    projectStats["quintuplets"] = 0;
    projectStats["pitchNames"] = new Set();
    projectStats["articulation"] = {
        begin: [],
        end: []
    };
    projectStats["pitches"] = [];
    projectStats["numberOfNotes"] = 0;

    let noteId = 0;

    for (const tur in notation.notationStaging) {
        for (const it in notation.notationStaging[tur]) {
            const item = notation.notationStaging[tur][it];

            if (typeof item == "object" && item[0].length) {
                for (let note of item[0]) {
                    let freq;
                    if (isCustomTemperament(activity.logo.synth.inTemperament)) {
                        freq = activity.logo.synth.getCustomFrequency(
                            note, activity.logo.synth.inTemperament);
                        const test = getTemperament(activity.logo.synth.inTemperament).filter(
                            (ele) => ele[3] === note.slice(0, note.length - 1)
                        );
                        if (test.length > 0) {
                            note = test[0][1] + note[note.length - 1];
                        }
                    } else {
                        freq = activity.logo.synth._getFrequency(note);
                    }
                    if (note.slice(0, note.length - 1) === "") {
                        projectStats["pitchNames"].add("R");
                    } else {
                        projectStats["pitchNames"].add(note.slice(0, note.length - 1));
                    }
                    projectStats["pitches"].push(freq);
                    if (projectStats["lowestNote"] == undefined) {
                        if (!isNaN(freq)) {
                            projectStats["lowestNote"] = [note, noteId, freq];
                        }
                    } else {
                        if (freq < projectStats["lowestNote"][2]) {
                            projectStats["lowestNote"] = [note, noteId, freq];
                        }
                    }
                    if (projectStats["highestNote"] == undefined) {
                        if (!isNaN(freq)) {
                            projectStats["highestNote"] = [note, noteId, freq];
                        }
                    } else {
                        if (freq > projectStats["highestNote"][2]) {
                            projectStats["highestNote"] = [note, noteId, freq];
                        }
                    }
                    projectStats["numberOfNotes"]++;
                    noteId++;
                }
            }

            if (item[1] == 2) {
                projectStats["duples"]++;
            } else if (item[1] == 3) {
                projectStats["triplets"]++;
            } else if (item[1] == 5) {
                projectStats["quintuplets"]++;
            }

            if (typeof item == "string") {
                if (item == "begin articulation") {
                    projectStats["articulation"].begin.push(it);
                } else if (item == "end articulation") {
                    projectStats["articulation"].begin.push(it);
                }
            }
        }
    }

    const blockList = activity.blocks.blockList;
    projectStats["rests"] = 0;
    projectStats["ornaments"] = 0;
    for (const b of blockList) {
        if (b.trash) {
            continue;
        }
        switch (b.name) {
            case "rest2":
                projectStats["rests"]++;
                break;
            case "":
            default:
        }

        switch (b.protoblock.palette.name) {
            case "ornaments":
                projectStats["ornaments"]++;
                break;
            default:
        }
    }
    // console.debug(projectStats);
    return projectStats;
};
