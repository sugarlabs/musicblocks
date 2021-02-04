/**
 * @file This contains the starter code and API for the JavaScript Editor Widget.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */
/*exported JS_API, JS_STARTER, SAMPLE_1, SAMPLE_2*/
const JS_API = `/*
============================================================
       API
============================================================
CREATE NEW MOUSE:
-----------------
new Mouse(async mouse => {
    await mouse.func(...);

    // also can be inside conditionals and loops
    // e.g.
    if (cond ..) {
        await mouse.func(...);
        ...
    } else {
        await mouse.func(...);
        ...
    }
});

CREATE NEW ACTION:
------------------
let action_name = async mouse => {
    await mouse.func(...);
    ...
    return mouse.ENDFLOW;
};

CALL A CLAMP BLOCK FUNCTION:
----------------------------
...
await mouse.func(async () => {
    await mouse.func(...);  // non clamp block function
    ...
    return mouse.ENDFLOW;
});

RUN ALL MICE:
-------------
MusicBlocks.run();


FLOW BLOCK FUNCTIONS:
----------------------
// [R] means function returns value

    // Rhythm
rest                        : playRest()

    // Meter
set meter                   : setMeter(beatCount, noteValue)
set mouse beats per minute  : setBPM(bpm, beatValue)
set master beats per minute : setMasterBPM(bpm, beatValue)
action on every note        : onEveryNoteDo(actionName)
action on every beat        : onEveryBeatDo(actionName)
action on every strong beat : onStrongNoteDo(beatValue, actionName)
action on every weak beat   : onWeakNoteDo(actionName)
count of notes played       : [R] getNotesPlayed(noteValue)

    // Pitch
pitch                       : playPitch(note, octave)
scalar step                 : stepPitch(value)
nth modal pitch             : playNthModalPitch(number, octave)
pitch number                : playPitchNumber(number)
hertz                       : playHertz(value)
register                    : setRegister(value)
set pitch number offset     : setPitchNumberOffset(pitch, octave)
number to pitch             : [R] numToPitch(number)
number to octave            : [R] numToOctave(number)

    // Intervals
set key                     : setKey(key, mode)
set temperament             : setTemperament(temperament, pitch, octave)

    // Volume
set synth volume            : setSynthVolume(synth, volume)
get synth volume            : [R] getSynthVolume(synth)

    // Drum
drum                        : playDrum(drum)
noise                       : playNoise(noise)

    // Graphics
go forward                  : goForward(steps)
go backward                 : goBackward(steps)
turn right                  : turnRight(degrees)
turn left                   : turnLeft(degrees)
set x, y coordinates        : setXY(x_coord, y_coord)
set mouse head angle        : setHeading(degrees)
draw pivoted arc            : drawArc(degrees, radius)
draw bezier curve           : drawBezier(dest_x, dest_y)
set bezier control point 1  : setBezierControlPoint1(x_coord, y_coord)
set bezier control point 2  : setBezierControlPoint2(x_coord, y_coord)
clear screen                : clear()
scroll canvas to x, y       : scrollXY(x_coord, y_coord)

    // Pen
set pen color               : setColor(hue_value_in_0_to_100)
set pen saturation          : setGrey(value_in_0_to_100)
set pen lightness           : setShade(value_in_0_to_100)
set pen hue                 : setHue(value_in_0_to_100)
set pen opacity             : setTranslucency(value_in_0_to_100)
set pen thickness           : setPensize(value_in_0_to_100)
pen up                      : penUp()
pen down                    : penDown()
fill background             : fillBackground()
set font name               : setFont(fontname)

    // Dictionary
set value to unnamed dict   : setValue(key, value)
set value to named dict     : setValue(key, value, dict)
get value from unnamed dict : getValue(key)
get value from named dict   : getValue(key, dict)
get a dictionary            : getDict(dict)
print a dictionary (on top) : showDict(dict)

CLAMP BLOCK FUNCTIONS:
----------------------
// flow refers to an async function callback    : async () => {...}

    // Rhythm
play a note                 : playNote(value, flow)
play a note (ms)            : playNoteMillis(value, flow)
dot                         : dot(value, flow)
tie                         : tie(flow)
multiply note value         : multiplyNoteValue(factor, flow)
swing                       : swing(swingValue, noteValue, flow)

    // Meter
(drift) set no clock        : setNoClock(flow)

    // Pitch
add accidental              : setAccidental(accidental, flow)
scalar transpose            : setScalarTranspose(value, flow)
semitone transpose          : setSemitoneTranspose(value, flow)
invert                      : invert(name, octave, mode, flow)

    // Intervals
scalar interval             : setScalarInterval(value, flow)
semitone interval           : setSemitoneInterval(value, flow)

    // Tone
set instrument              : setInstrument(instrument, flow)
vibrato                     : doVibrato(intensity, rate, flow)
chorus                      : doChorus(chorusRate, delayTime, chorusDepth, flow)
phaser                      : doPhaser(rate, octaves, baseFrequency, flow)
tremolo                     : doTremolo(frequency, depth, flow)
distortion                  : doDistortion(distortion, flow)
harmonic                    : doHarmonic(harmonic, flow)

    // Ornament
staccato                    : setStaccato(value, flow)
slur                        : setSlur(value, flow)
neighbor                    : doNeighbor(interval, noteValue, flow)

    // Volume
crescendo                   : doCrescendo(value, flow)
decrescendo                 : doDecrescendo(value, flow)
set relative volume         : setRelativeVolume(value, flow)

    // Drum
set drum                    : setDrum(drum, flow)
map pitch to drum           : mapPitchToDrum(drum, flow)

    // Number
// use MathUtility.funcName(...) instead of mouse.funcName(...) for these

random                      : doRandom(lowerLimit, upperLimit)
one of                      : doOneOf(value_1, value_2)
distance                    : doCalculateDistance(x_1, y_1, x_2, y_2)

    // Pen
draw filled polygon         : fillShape(flow)
draw hollow lines           : hollowLine(flow)

FLOW BLOCK SETTERS:
-------------------
pickup                      : PICKUP
movable                     : MOVEABLE
set master volume           : MASTERVOLUME
set panning                 : PANNING

VALUE BLOCK GETTERS:
--------------------
current note value          : NOTEVALUE
count of whole notes played : WHOLENOTESPLAYED
beat count                  : BEATCOUNT
measure count               : MEASURECOUNT
beats per minute            : BPM
beat factor                 : BEATFACTOR
current meter               : CURRENTMETER
change in pitch vs previous : CHANGEINPITCH
scalar change in pitch      : SCALARCHANGEINPITCH
scalar step up              : SCALARSTEPUP
scalar step down            : SCALARSTEPDOWN
is solfege moveable         : MOVEABLEDO
current key                 : CURRENTKEY
current mode                : CURRENTMODE
current mode length         : MODELENGTH
master volume               : MASTERVOLUME
mouse X coordinate          : X
mouse Y coordinate          : Y
mouse head angle            : HEADING
pen size                    : PENSIZE
pen color                   : COLOR
pen lightness               : SHADE
pen saturation              : GREY
*/`;

const JS_STARTER = `let rightSqr = async mouse => {
    await mouse.hollowLine(async () => {
        for (let i = 0; i < 4; i++) {
            await mouse.goForward(100);
            await mouse.turnRight(90);
        }
        return mouse.ENDFLOW;
    });
    return mouse.ENDFLOW;
};

let leftSqr = async mouse => {
    await mouse.hollowLine(async () => {
        for (let i = 0; i < 4; i++) {
            await mouse.goForward(100);
            await mouse.turnLeft(90);
        }
        return mouse.ENDFLOW;
    });
    return mouse.ENDFLOW;
};

new Mouse(async mouse => {
    for (let i = 0; i < 12; i++) {
        await mouse.goForward(100);
        if (i < 6) {
            await mouse.turnRight(60);
        } else {
            await mouse.turnLeft(60);
        }
    }
    await mouse.clear();
    await rightSqr(mouse);
});

new Mouse(async mouse => {
    for (let i = 0; i < 12; i++) {
        await mouse.goForward(150);
        if (i < 6) {
            await mouse.turnLeft(60);
        } else {
            await mouse.turnRight(60);
        }
    }
    await mouse.clear();
    await leftSqr(mouse);
});

MusicBlocks.run();
`;

const SAMPLE_1 = `new Mouse(async mouse => {
    await mouse.playPitch("sol", 4);
    for (let i = 0; i < 7; i++) {
        await mouse.playNote(1/4, async () => {
            await mouse.stepPitch(1);
            return mouse.ENDFLOW;
        });
    }
    for (let i = 0; i < 7; i++) {
        await mouse.playNote(1/4, async () => {
            await mouse.stepPitch(-1);
            return mouse.ENDFLOW;
        });
    }
    return mouse.ENDMOUSE;
});

MusicBlocks.run();
`;

const SAMPLE_2 = `new Mouse(async mouse => {
    await mouse.playNote(1/4, async () => {
        await mouse.playPitch("sol", 4);
        await mouse.playPitch("do", 4);
        return mouse.ENDFLOW;
    });
    await mouse.playNote(1/1, async () => {
        await mouse.playPitch("re", 4);
        return mouse.ENDFLOW;
    });
    await mouse.playNote(1/4, async () => {
        await mouse.playPitch("mi", 4);
        return mouse.ENDFLOW;
    });
    await mouse.playNote(1/4, async () => {
        await mouse.playPitch("fa", 4);
        await mouse.playNote(1/2, async () => {
            await mouse.playPitch("mi", 4);
            return mouse.ENDFLOW;
        });
        return mouse.ENDFLOW;
    });
    return mouse.ENDMOUSE;
});

new Mouse(async mouse => {
    await mouse.playPitch("re", 5);
    return mouse.ENDMOUSE;
});

MusicBlocks.run();
`;
