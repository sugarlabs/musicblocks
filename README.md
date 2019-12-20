MUSIC BLOCKS
============

“All musicians are subconsciously mathematicians” – Monk

Music Blocks is a programming language and collection of manipulative
tools for exploring musical and mathematical concepts in an
integrative and fun way.

* [Running Music Blocks](#RUNNING_MUSIC_BLOCKS)
* [How to set up a local server](#HOW_TO_SET_UP_A_LOCAL_SERVER)
* [Using Music Blocks](#USING_MUSIC_BLOCKS)
* [Modifying Music Blocks](#MODIFYING_MUSIC_BLOCKS)
* [Credits](#CREDITS)
* [Reporting Bugs](#REPORTING_BUGS)
* [Contributing](#CONTRIBUTING)
* [Music Blocks in Japan](#MUSIC_BLOCKS_IN_JAPAN)
* [An Appendix](#AN_APPENDIX)

![alt tag](https://raw.githubusercontent.com/sugarlabs/musicblocks/master/screenshots/Screenshot-1.png)

![alt tag](https://raw.githubusercontent.com/sugarlabs/musicblocks/master/screenshots/Screenshot-2.png)

## <a name="RUNNING_MUSIC_BLOCKS"></a>Running Music Blocks

Music Blocks is available under the GNU Affero General Public License (AGPL), a free, copyleft license.

Music Blocks is designed to run in a web browser.

The easiest way to run Music Blocks is to open [Music
Blocks](https://musicblocks.sugarlabs.org) in your browser (Firefox,
Chrome, and Opera work best).

If you want to run Music Blocks offline,
[download](https://github.com/sugarlabs/musicblocks/archive/master.zip)
or [git clone](https://github.com/sugarlabs/musicblocks.git) this repo
and run through a local server.

## <a name="HOW_TO_SET_UP_A_LOCAL_SERVER"></a>How to set up a local server

Some web browsers (e.g., Firefox v68) have restrictions that prevent
Music Blocks from running from the file://. To circumvent this, we
provide instructions for launching a web server on your computer to
which you can connect to Music Blocks.

(1) In a terminal, cd to the directory where you downloaded Music
Blocks (e.g., <code>cd /musicblocks</code>)

(2) If you do not have Python installed, you'll need to install
it. (Get it from https://www.python.org) You can test for Python in a
terminal: <code>python</code>. Type <code>exit()</code> to exit
Python.
 
(3) After cloning the musicblocks repository, run the command:

```
$ npm run serve
```

This works on all Operating Systems with Python.

On Windows sytems with multiple Python installations, it is
recommended to use this command instead:

```
$ npm run winserve
```

NOTE: Make sure you can run either <code>python</code> or
<code>py</code> from your terminal.

(4) You should see a message: <code>Serving HTTP on 0.0.0.0 port 3000
...</code> since the HTTPServer is set to start listening on Port
3000.

(5) Open your favorite browser and run <code>localhost:3000</code> or
<code>127.0.0.1:3000</code>.

## <a name="USING_MUSIC_BLOCKS"></a>Using Music Blocks

Once Music Blocks is running, you'll want suggestions on how to use it.
See [Using Music
Blocks](http://github.com/sugarlabs/musicblocks/tree/master/documentation/README.md)
and [Music Blocks
Guide](http://github.com/sugarlabs/musicblocks/tree/master/guide/README.md)

## <a name="MODIFYING_MUSIC_BLOCKS"></a>Modifying Music Blocks

The core code for Music Blocks resides in the [js
directory](https://github.com/sugarlabs/musicblocks/tree/master/js). Individual
modules are described in more detail in [js
README.md](https://github.com/sugarlabs/musicblocks/blob/master/js/README.md)

Note: As with any change, please make your own copy by cloning this
[respository](https://github.com/sugarlabs/musicblocks.git). Make
your changes, test them, and then make a pull request.

See [Contributing
Code](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md)
for more details.

## <a name="CREDITS"></a>Credits

Music Blocks is a fork of
[TurtleBlocksJS](https://github.com/sugarlabs/turtleblocksjs)
created by Walter Bender.

Devin Ulibarri has contributed functional and user-interface
designs. Many of his contributions were inspired by the music
education ideas, representations and practices (e.g. aspects of
matrix, musical cups) developed and published by [Larry
Scripp](http://www.larryscripp.net/) with whom Devin studied at New
England Conservatory and for whom he worked at Affron Scripp &
Associates, LLC, [Center for Music and the Arts in Education
(CMAIE)](http://centerformie.org/), and [Music in
Education](http://music-in-education.org/) Some of the initial graphics
were contributed by [Chie Yasuda](http://www.chieyasuda.com).

Much of the initial coding specific to Music Blocks was done by
Yash Khandelwal as part of Google Summer of Code (GSoC) 2015. Hemant
Kasat contributed to additional widgets as part of GSoC
2016. Additional contributions are being made by Tayba Wasim, Dinuka
Tharangi Jayaweera, Prachi Agrawal, Cristina Del Puerto, and Hrishi
Patel as part of GSoC 2017. During GSoC 2018, Riya Lohia developed a
Temperament Widget. Ritwik Abhishek added a keyboard widget and a
pitch-tracking widget.

Many students contributed to the project as part of Google Code-in
(2015&ndash;16, 2016&ndash;17, and 2017&ndash;2018). Sam Parkinson
built the Planet during GCI 2016&ndash;17. Emily Ong designed our
mouse icon and Euan Ong redesigned the Planet code as a series of GCI
tasks in 2017&ndash;18; Austin George refactored the toolbars as a
series of GCI tasks in 2018.

A full list of
[contributors](https://github.com/sugarlabs/musicblocks/graphs/contributors)
is available.

## <a name="REPORTING_BUGS"></a>Reporting Bugs

Bugs can be reported in the
[issues section](https://github.com/sugarlabs/musicblocks/issues)
of this repository.

If possible, please include the browser console log output when
reporting bugs. To access the console, type ```Ctrl-Shift-J``` on most
browsers. You may need to set the "Default level" for the console to
"Verbose" in order to see all of the output.

## <a name="CONTRIBUTING"></a>Contributing

Please consider contributing to the project, with your ideas, your
music, your lesson plans, your artwork, and your code.

Programmers, please follow these general [guidelines for
contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).

## <a name="MUSIC_BLOCKS_IN_JAPAN"></a>Music Blocks in Japan

[Gakken STEAM](https://gakken-steam.jp/music_blocks/)

## <a name="AN_APPENDIX"></a>An Appendix

Beginner mode

| Palette | Blocks |
| :---: | :---: |
| Rhythm | note |
|   | note value drum | 
|   | silence |
|   | tie |
|   | note value |
| Meter | meter |
|   | beats per second |
|   | master beats per second |
|   | on every note do |
|   | notes played |
|   | beat count |
| Pitch | pitch |
|   | pitch G4 |
|   | scalar step(+/-) |
|   | pitch number |
|   | hertz |
|   | fourth |
|   | fifth |
|   | pitch in hertz |
|   | pitch number |
|   | scalar change in pitch |
|   | change in pitch |
| Interval | set key |
|   | mode length |
|   | movable do |
|   | thirth |
|   | sixth |
|   | chord I |
|   | chord IV |
|   | chord V |
|   | set temperament |
| Tone | set instrument |
|   | vibrato |
|   | chorus |
|   | termolo |
| Ornament | staccato |
|   | slur |
|   | neighbor(+/-) |
| Volume | crescendo |
|   | decrescendo |
|   | set master volume |
|   | set synth volume |
|   | set drum volume |
| Drum | drum |
|   | sound effect |
|   | set drum |
| Widget | status |
|   | phrase maker |
|   | C major scale |
|   | G major scale |
|   | rhythm maker |
|   | music keyboard |
|   | pitch slider |
|   | tempo |
|   | custom mode |
|   | rhythm |
|   | simple tuplet |
| Flow | repeat |
|   | forever |
|   | if |
|   | if |
|   | backward |
| Action | action |
|   | start |
|   | broadcast |
|   | on |
|   | do |
| Boxes | store in box 1 |
|   | box 1 |
|   | store in box 2 |
|   | box 2 |
|   | store in |
|   | box |
|   | add |
|   | add 1 to |
| Number | 4 |
|   | random |
|   | one of |
|   | + |
|   | - |
|   | x |
|   | / |
| Boolean | = |
|   | < |
|   | > |
| Graphics | forward |
|   | back |
|   | left 
|   | right |
|   | set xy |
|   | set heading |
|   | arc |
|   | scroll xy |
|   | x |
|   | y |
|   | heading |
| Pen | set color |
|   | set shade |
|   | set pen size |
|   | pen down |
|   | pen up |
|   | fill |
|   | background |
|   | color |
| Media | print |
|   | text |
|   | show |
|   | avatar |
|   | height |
|   | width |
|   | bottom(screen) |
|   | top(screen) |
|   | left(screen) |
|   | right(screen) |
| Sensors | mouse button |
|   | cursor x |
|   | cursor y |
|   | click |
|   | loudness |
| Ensemble | set name |
|   | mouse name |

Advanced mode

| Palette |	Blocks |
| :---: | :---: |
| Rhythm | note value sol4, note value G4, note value +1, note value 5 4, note value 7 |
|   | note value 392 hertz, dot, multiplicity note value, skipnotes, swings, milliseconds |
| Meter | pickup, on strong beat, on weak beat do, no clock, whole notes played |
|   | note counter, measure count, beat factor, current meter |
| Pitch | scale degree, sharp flat, accidental, unison, second, thirth, sixth, seventh |
|   | down third, down sixth, octave, semi-tone transpose, register, invert, sol, G |
|   | sargam, accidental, number of octave, number of pitch, set pitch number offset |
|   | MIDI |
| Intervals | current key, current mode, define mode, scalar interval(+/-), unison, second |
|   | fourth, fifth, seventh, down third, down sixth, semi tone interval(+/-) |
|   | major(2,3,6,7), down major 3, down major 6, minor(2,3,6,7), down minor 3 |
|   | down minor 6, perfect 4, perfect 5, perfect 8, augmented(1,2,3,4,5,6,7,8) |
|   | diminished(2,3,4,5,6,7,8), scalar interval measure, semi-tone interval measure |
|   | interval name, doubly, set temperament |
| Tone | set instrument, voice name, vibrato, chorus, phaser, tremolo, distrotion, harmonic |
|   | weighted partials, partial, FM synth, AM synth, duo synth |
| Ornament | staccato, slur, neighbor(+/-), neighbor(+/-) |
| Volume | crescendo, decrescendo, set relative volume, set master volume, set synth volume |
|   | set drum volume, fff, ff, f, mf, mp, p, pp, ppp, master volume |
| Drum | drum, sound effect, set drum, map pitch to drum, snare drum, kick drum, floor tom |
|   | cup drum, darbuka drum, hi hat, triangle drum, finger cymbals, ride bell, cow bell |
|   | crash, slap, clap, clang, chime, bubbles, bottle, dog, cricket, cat, duck, noise, effect |
|   | drum, noisename, tom tom |
| Widget | status, phrase maker, C major scale, G major scale, rhythm maker, pitch staircase |
|   | music keyboard, chromatic keyboard, pitch slider, pitch-drum maker, tempo |
|   | meter, timbre, temperament, rhythm, simple tuplet, triplet, quintuplet, septuplet |
|   | tuplet, whole note, half note, quarter note, eighth note, 1/16 note, 1/32 note | 
|   | 1/64 note, custom mode |
| Flow | repeat, forever, if, if, while, until, wait for, stop, switch, case, default, duplicate |
|   | backward |
| Action | action, start, start drum, broadcast, on, do, arg1, arg, calculate, do, calculate, do |
|   | action, calculate, return to URL, return |
| Boxes | store in box 1, box 1, store in box 2, box 2, store in, store in box, box, box |
|   | add, add 1 to |
| Number | 4, random, one of, +, -, -, x, /, abs, sqrt, ^, mod, int |
| Boolean | true, =, <, >, or, and, not |
| Heap | push, pop, set heap, index heap, reverse heap, load heap, save heap, empty heap |
|   | heap empty?, heap length, show heap, save heap to App, load heap from App |
| Extras | print, comment, wait, open project, hide blocks, show blocks, no background |
|   | make block, connect blocks, run blocks, move block, delete block, open palette |
| Graphics | forward, back, left, right, set xy, set heading, arc, bezier, control point 1 |
|   | control point 2, clear, scroll xy, x, y, heading |
| Pen | set color, set grey, set shade, set hue, set translucency, set pen size |
|   | pen down, pen up, fill, hollow line, background, set font, pen size, color |
|   | shade, grey, black, white, red, orange, yellow, green, blue, purple |
| Media	| text, show, avatar, note to frequency, hertz, stop media, open file, height |
|   | width, bottom(screen), top(screen), left(screen), right(screen) |
| Sensors | keyboard, to ASCII, mouse bottom, cursor x, cursor y, time, pixel color |
|   | red, green, blue, click, loudness |
| Ensemble | set name, mouse name, new mouse, found mouse, mouse sync, mouse note value |
|   | mouse pitch number, mouse notes played, mouse x, mouse y, set mouse |
|   | mouse heading, mouse color, start mouse, stop mouse, mouse index heap |
