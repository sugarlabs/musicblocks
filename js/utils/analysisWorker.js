/* This worker handles the CPU-intensive project analysis and scoring logic
   to prevent blocking the main UI thread. */

const last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

const TACAT = {
    // Deprecated blocks (no longer in use, mapped to "ignore")
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
    setratio: "transpose",
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
    intervalnumber: "ignore",
    currentinterval: "ignore",
    measureintervalsemitones: "pitchfactor",
    measureintervalscalar: "pitchfactor",
    arpeggio: "pitchchord",
    chordname: "ignore",
    chordinterval: "pitchchord",
    semitoneinterval: "pitchchord",
    interval: "pitchchord",
    ratiointerval: "pitchchord",
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

const TASCORE = {
    // Bin scores
    note: 1,
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

self.onmessage = function (e) {
    const { blocks } = e.data;
    if (!blocks) {
        self.postMessage({ error: "No blocks provided" });
        return;
    }

    const projectBlockNames = [];

    for (let blk = 0; blk < blocks.length; blk++) {
        const currentBlock = blocks[blk];
        if (currentBlock.trash) {
            continue;
        }

        switch (currentBlock.name) {
            case "rhythmicdot":
            case "tie":
            case "drift":
            case "osctime":
            case "sharp":
            case "flat":
            case "fill":
            case "hollowline":
            case "start":
                if (currentBlock.connections[1] === null) {
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
                if (currentBlock.connections[2] === null) {
                    continue;
                }
                break;
            case "tuplet2":
                if (currentBlock.connections[3] === null) {
                    continue;
                }
                break;
            case "invert":
                if (currentBlock.connections[4] === null) {
                    continue;
                }
                break;
            default:
                if (
                    currentBlock.connections[0] === null &&
                    last(currentBlock.connections) === null
                ) {
                    continue;
                }
                break;
        }
        projectBlockNames.push(currentBlock.name);
    }

    const scores = [];
    for (let i = 0; i < PALS.length; i++) {
        scores.push(0);
    }

    const cats = [];
    const pals = [];

    for (let b = 0; b < projectBlockNames.length; b++) {
        if (projectBlockNames[b] in TACAT) {
            if (!cats.includes(TACAT[projectBlockNames[b]])) {
                cats.push(TACAT[projectBlockNames[b]]);
            }
        }
    }
    for (let c = 0; c < cats.length; c++) {
        if (cats[c] in TAPAL) {
            if (!pals.includes(TAPAL[cats[c]])) {
                pals.push(TAPAL[cats[c]]);
            }
        }
    }

    for (let c = 0; c < cats.length; c++) {
        if (cats[c] in TASCORE) {
            const idx = PALS.indexOf(TAPAL[cats[c]]);
            if (idx !== -1) {
                scores[idx] += TASCORE[cats[c]];
            }
        }
    }

    for (let p = 0; p < pals.length; p++) {
        if (pals[p] in TASCORE) {
            const idx = PALS.indexOf(pals[p]);
            if (idx !== -1) {
                scores[idx] += TASCORE[pals[p]];
            }
        }
    }

    self.postMessage({ scores });
};
