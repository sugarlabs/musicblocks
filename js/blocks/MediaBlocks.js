function setupMediaBlocks() {

class RightPosBlock extends ValueBlock {
    constructor() {
        //.TRANS: right side of the screen
        super('rightpos', _('right (screen)'));
        this.setPalette('media');
        this.beginnerBlock(true);
    }

    arg(logo) {
        return (logo.turtles._canvas.width / (2.0 * logo.turtles.scale));
    }
}

class LeftPosBlock extends ValueBlock {
    constructor() {
        //.TRANS: left side of the screen
        super('leftpos', _('left (screen)'));
        this.setPalette('media');
        this.beginnerBlock(true);
    }

    arg(logo) {
        return -1 * (logo.turtles._canvas.width / (2.0 * logo.turtles.scale));
    }
}

class TopPosBlock extends ValueBlock {
    constructor() {
        super('toppos', _('top (screen)'));
        this.setPalette('media');
        this.beginnerBlock(true);
    }

    arg(logo) {
        return (logo.turtles._canvas.height / (2.0 * logo.turtles.scale));
    }
}

class BottomPosBlock extends ValueBlock {
    constructor() {
        super('bottompos', _('bottom (screen)'));
        this.setPalette('media');
        this.beginnerBlock(true);
    }

    arg(logo) {
        return -1 * (logo.turtles._canvas.height / (2.0 * logo.turtles.scale));
    }
}

class WidthBlock extends ValueBlock {
    constructor() {
        super('width', _('width'));
        this.setPalette('media');
        this.beginnerBlock(true);
    }

    arg(logo) {
        return (logo.turtles._canvas.width / (logo.turtles.scale));
    }
}

class HeightBlock extends ValueBlock {
    constructor() {
        super('height', _('height'));
        this.setPalette('media');
        this.beginnerBlock(true);
    }

    arg(logo) {
        return (logo.turtles._canvas.height / (logo.turtles.scale));
    }
}

class StopPlaybackBlock extends FlowBlock {
    constructor() {
        //.TRANS: stops playback of an audio recording
        super('stopplayback', _('stop play'));
        this.setPalette('media');
    
        this.hidden = true;
    }

    flow(args, logo) {
        for (var sound in logo.sounds) {
            logo.sounds[sound].stop();
        }
        logo.sounds = [];
    }
}

class PlaybackBlock extends FlowBlock {
    constructor() {
        //.TRANS: play an audio recording
        super('playback', _('play back'));
        this.setPalette('media');
        this.formBlock({
            args: 1, defaults: [null],
            argTypes: ['medain']
        })

        this.hidden = true;
    }

    flow(args, logo, turtle, blk) {
        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        var sound = new Howl({
            urls: [args[0]]
        });
        logo.sounds.push(sound);
        sound.play();
    }
}

class SpeakBlock extends FlowBlock {
    // Eliminating until we find a better option.
    constructor() {
        super('speak', _('speak'));
        this.setPalette('media');
        this.beginnerBlock(true);
        this.formBlock({
            args: 1, defaults: ['hello'],
            argTypes: ['textin']
        })

        this.hidden = true;
    }

    flow(args, logo, turtle, blk) {
        if (args.length === 1) {
            if (logo.meSpeak !== null) {
                if (logo.inNoteBlock[turtle].length > 0) {
                    logo.embeddedGraphics[turtle][last(logo.inNoteBlock[turtle])].push(blk);
                } else {
                    if (!logo.suppressOutput[turtle]) {
                        logo._processSpeak(args[0]);
                    }

                    if (logo.justCounting[turtle].length === 0) {
                        logo._playbackPush(turtle, [logo.previousTurtleTime[turtle], 'speak', args[0]]);
                    }
                }
            }
        }
    }
}

class CameraBlock extends ValueBlock {
    constructor() {
        super('camera');
        this.setPalette('media');
        this.formBlock({
            image: 'images/camera.svg'
        });
    }
}

class VideoBlock extends ValueBlock {
    constructor() {
        super('video');
        this.setPalette('media');
        this.formBlock({
            image: 'images/video.svg'
        });
    }
}

class LoadFileBlock extends ValueBlock {
    constructor() {
        super('loadFile', '');
        this.setPalette('media');
        this.formBlock({
            outType: 'fileout'
        });
    }

    arg() {
        // No need to do anything here.
    }
}

class StopVideoCamBlock extends FlowBlock {
    constructor() {
        super('stopvideocam', _('stop media'));
        this.setPalette('media');
    }

    flow(args, logo) {
        if (cameraID != null) {
            doStopVideoCam(logo.cameraID, logo.setCameraID);
        }
    }
}

class ToneBlock extends FlowBlock {
    constructor() {
        super('tone', _('hertz'));
        this.setPalette('media');
        this.formBlock({
            args: 2, defaults: [392, 1000 / 3],
            argLabels: [_('frequency'), _('duration (ms)')],
        });
        this.formBlock((x, y) => [
            [0, 'drift', x, y, [null, 1, null]],
            [1, 'osctime', 0, 0, [0, 3, 2, null]],
            [2, 'vspace', 0, 0, [1, 6]],
            [3, 'divide', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 1000}], 0, 0, [3]],
            [5, ['number', {'value': 3}], 0, 0, [3]],
            [6, 'hertz', 0, 0, [2, 7, null]],
            [7, ['number', {'value': 392}], 0, 0, [6]]
        ]);
    }

    flow() {
        return
    }
}

class ToFrequencyBlock extends LeftBlock {
    constructor() {
        super('tofrequency', _('note to frequency'));
        //.TRANS: translate a note into hertz, e.g., A4 -> 440HZ
        this.setPalette('media');

        this.formBlock({
            args: 2, defaults: ['G', 4],
            argTypes: ['notein', 'anyin'],
            argLabels: [
                //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
                this.lang === 'ja' ? _('name2') : _('name'),
                _('octave')
            ]
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        if (_THIS_IS_MUSIC_BLOCKS_) {
            var block = logo.blocks.blockList[blk];
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 392;
            }
            var note = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            var octave = Math.floor(calcOctave(logo.currentOctave[turtle], logo.parseArg(logo, turtle, cblk2, blk, receivedArg), logo.lastNotePlayed[turtle], note));
            return Math.round(pitchToFrequency(note, octave, 0, logo.keySignature[turtle]));
        } else {
            const NOTENAMES = ['A', 'B♭', 'B', 'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭'];
            const NOTECONVERSION = {'A♯': 'B♭', 'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭'};
            var block = logo.blocks.blockList[blk];
            var cblk = block.connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var noteName = 'G';
            } else {
                var noteName = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            }

            if (typeof(noteName) !== 'string')
                return 440 * Math.pow(2, (noteName - 69) / 12);

            noteName = noteName.replace('b', '♭');
            noteName = noteName.replace('#', '♯');
            if (noteName in NOTECONVERSION) {
                noteName = NOTECONVERSION[noteName];
            }

            var idx = NOTENAMES.indexOf(noteName);
            if (idx === -1) {
                this.errorMsg(_('Note name must be one of A, A♯, B♭, B, C, C♯, D♭, D, D♯, E♭, E, F, F♯, G♭, G, G♯ or A♭.'));
                return 440;
            }
            var cblk = block.connections[2];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                var octave = 4;
            } else {
                var octave = Math.floor(logo.parseArg(logo, turtle, cblk, blk, receivedArg));
            }

            if (octave < 1) {
                octave = 1;
            }

            if (idx > 2) {
                octave -= 1;  // New octave starts on C
            }

            var i = octave * 12 + idx;
            return 27.5 * Math.pow(1.05946309435929, i);
        }
    }
}

class TurtleShellBlock extends FlowBlock {
    constructor() {
        //.TRANS: Avatar is the image used to determine the appearance of the mouse.
        super('turtleshell', _('avatar'));
        this.setPalette('media');
        this.beginnerBlock(true);

        this.formBlock({
            args: 2, defaults: [55, null],
            argTypes: ['numberin', 'anyin'],
            argLabels: [_('size'), _('image')]
        });
        this.makeMacro((x, y) => [
            [0, 'turtleshell', x, y, [null, 1, 2, 3]],
            [1, ['number', {'value': 55}], 0, 0, [0]],
            [2, 'media', 0, 0, [0]],
            [3, 'vspace', 0, 0, [0, null]]
        ]);
    }

    flow(args, logo, turtle, blk) {
        if (args.length === 2) {
            if (typeof(args[0]) === 'string') {
                logo.errorMsg(NANERRORMSG, blk);
            } else {
                logo.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
            }
        }
    }
}

class ShowBlock extends FlowBlock {
    constructor() {
        super('show');
        this.setPalette('media');
        this.beginnerBlock(true);
        this.formBlock({
            //.TRANS: show1 is show as in display an image or text on the screen.
            name: this.lang === 'ja' ? _('show1') : _('show'),
            //.TRANS: a media object
            args: 2, argLabels: [_('size'), _('obj')],
            defaults: [24, _('text')],
            argTypes: ['numberin', 'anyin']
        })
    }

    flow(args, logo, turtle, blk) {
        if (args.length === 2) {
            if (logo.inNoteBlock[turtle].length > 0) {
                logo.embeddedGraphics[turtle][last(logo.inNoteBlock[turtle])].push(blk);
            } else {
                if (!logo.suppressOutput[turtle]) {
                    logo._processShow(turtle, blk, args[0], args[1]);
                }

                if (logo.justCounting[turtle].length === 0) {
                    logo._playbackPush(turtle, [logo.previousTurtleTime[turtle], 'show', args[0], args[1]]);
                }
            }
        }
    }
}

class MediaBlock extends ValueBlock {
    constructor() {
        super('media');
        this.setPalette('media');
        this.beginnerBlock(true);

        /*
        if (language === 'ja') {
            //.TRANS: "video material" is used instead of an image in Japanese
            newblock.staticLabels.push(_('video material'));
            newblock.extraWidth = 10;
        } else {
            newblock.image = 'images/load-media.svg'
        }
        */

        this.formBlock({
            image: 'images/load-media.svg',
            outType: 'mediaout'
        });
    }
}

class TextBlock extends ValueBlock {
    constructor() {
        super('text');
        this.extraWidth = 30;
        this.setPalette('media');
        this.beginnerBlock(true);
        this.formBlock({
            outType: 'textout'
        });
    }
}


    new RightPosBlock().setup();
    new LeftPosBlock().setup();
    new TopPosBlock().setup();
    new BottomPosBlock().setup();
    new WidthBlock().setup();
    new HeightBlock().setup();
    new CameraBlock().setup();
    new StopPlaybackBlock().setup();
    new PlaybackBlock().setup();
    new SpeakBlock().setup();
    new VideoBlock().setup();
    new LoadFileBlock().setup();
    new StopVideoCamBlock().setup();
    new ToneBlock().setup();
    new ToFrequencyBlock().setup();
    new TurtleShellBlock().setup();
    new ShowBlock().setup();
    new MediaBlock().setup();
    new TextBlock().setup();
}
