# Guide to Programming with Music Blocks
  
Music Blocks is a programming environment for children interested in
music and graphics. It expands upon Turtle Blocks by adding a
collection of features relating to pitch and rhythm.

The Turtle Blocks guide is a good place to start learning about the
basics. In this guide, we illustrate the musical features by walking
the reader through numerous examples.

A short [Guide to
Debugging](http://github.com/sugarlabs/musicblocks/tree/master/Debugging.md). is
also available.

## <a name="TOC"></a> Table of Contents

1. [Getting Started](#GETTING-STARTED)
2. [Making Sounds](#NOTES)
   1. [Note Value Blocks](#NOTE-VALUE)
   2. [Pitch Blocks](#PITCH)
   3. [Chords](#CHORDS)
   4. [Rests](#RESTS)
   5. [Drums](#DRUMS)
3. [Programming with Music](#PROGRAMMING-WITH-MUSIC)
   1. [Chunks](#CHUNKS)
   2. [Musical Transformations](#TRANSFORMATION)
      1. [Step Pitch Block](#STEP-PITCH)
      2. [Sharps and Flats](#SHARPS-AND-FLATS)
      3. [Adjusting Transposition](#ADJUST-TRANSPOSITION)
      4. [Summary of Pitch Movements](#PITCH-MOVEMENT)
      5. [Fixed and Movable Pitch Systems](#FIXED-AND-MOVABLE-PITCH-SYSTEMS)
      6. [Dotted Notes](#DOTTED)
      7. [Speeding Up and Slowing Down Notes via Mathematical Operations](#MULTIPLY-AND-DIVIDE)
      8. [Repeating Notes](#REPETITION)
      9. [Swinging Notes and Tied Notes](#SWINGING)
      10. [Set Volume, Crescendo, Staccato, and Slur Blocks](#MORE-TRANSFORMATIONS)
      11. [Intervals](#INTERVALS)
      12. [Inversion](#INVERSION)
      13. [Backwards](#BACKWARDS)
      14. [Setting Voice and Keys](#SETTING)
      15. [Vibrato, Tremelo, et al.](#VIBRATO)
   3. [Voices](#VOICES)
   4. [Graphics](#GRAPHICS)
   5. [Beat](#BEAT)
   6. [Interactions](#INTERACTIONS)
   7. [Ensemble](#ENSEMBLE)
4. [Widgets](#WIDGETS)
    1. [Monitoring Status](#status)
    2. [Generating Chunks of Notes](#pitch-time)
       1. [Phrase Maker](#pitch-time) 
       2. [The Rhythm Block](#THE-RHYTHM-BLOCK) 
       3. [Creating Tuplets](#CREATING-TUPLETS)
       4. [What is a Tuplet?](#WHAT-IS-TUPLET)
       5. [Using Individual Notes in the Phrase Maker](#INDIVIDUAL-NOTES)
       6. [Using a Scale of Pitches in the Phrase Maker](#USING-A-SCALE)
    3. [Generating Rhythms](#rhythms)
    4. [Musical Modes](#modes)
    5. [Meters](#meters)
    6. [The Pitch-Drum Matrix](#pitch-drum)
    7. [Exploring Musical Proportions](#stairs)
    8. [Generating Arbitrary Pitches](#slider)
    9. [Changing Tempo](#tempo)
    10. [Custom Timbres](#timbre)
    11. [Music Keyboard](#keyboard)
    12. [Changing Temperament](#temperament)
5. [Beyond Music Blocks](#BEYOND-MUSIC-BLOCKS)

[APPENDIX: Palette Tables](#APPENDIX_1)

Many of the examples given in the guide have links to code you can
run. Look for `RUN LIVE` links.

## <a name="GETTING-STARTED"></a>1. Getting Started

[Back to Table of Contents](#TOC) | [Next Section (2. Making Sounds)](#NOTES)

Music Blocks is designed to run in a browser. Most of the development
has been done in Chrome, but it should also work in Firefox, Opera,
and some versions of Safari. You can run it from
[musicblocks.sugarlabs.org](https://musicblocks.sugarlabs.org), from
[github io](https://musicblocks.sugarlabs.org), or by
downloading a copy of the code and running a local copy directly from
the file system of your computer. (Note that when running locally, you
may have to use a local server to expose all of the features.)

This guide details the music-specific features of Music Blocks.  You
may also be interested in the [Turtle Blocks
Guide](http://github.com/sugarlabs/turtleblocksjs/tree/master/guide),
which reviews many programming features common to both projects.

For more details on how to use Music Blocks, see [Using Music
Blocks](http://github.com/sugarlabs/musicblocks/tree/master/documentation).
For more details on how to use Turtle Blocks, see [Using Turtle Blocks
JS](http://github.com/sugarlabs/turtleblocksjs/tree/master/documentation).

## <a name="NOTES"></a>2. Making Sounds

[Previous Section (1. Getting Started)](#GETTING-STARTED) | [Back to
Table of Contents](#TOC) | [Next Section (3. Programming with
Music)](#PROGRAMMING-WITH-MUSIC)

Music Blocks incorporates many common elements of music, such as
[pitch](#PITCH), [rhythm](#rhythms), [volume](#MORE-TRANSFORMATIONS),
and, to some degree, [timbre and texture](#VOICES).

### <a name="NOTE-VALUE"></a>2.1 Note Value Blocks

At the heart of Music Blocks is the *Note value* block. The *Note
value* block is a container for a [*Pitch* block](#PITCH) that
specifies the duration (note value) of the pitch.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/note1.svg
 "A single Note value block (top) and two consecutive Note value
 blocks (bottom)")

At the top of the example above, a single (detached) *Note value*
block is shown. The `1/8` is value of the note, which is, in this
case, an eighth note.

At the bottom, two notes that are played consecutively are shown. They
are both `1/8` notes, making the duration of the entire sequence
`1/4`.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/note2.svg
 "A quarter note, a sixteenth note, and a half note Note value
 blocks")

In this example, different note values are shown. From top to bottom,
they are: `1/4` for an quarter note, `1/16` for a sixteenth note, and
`1/2` for a half note.

Note that any mathematical operations can be used as input to the
*Note value*.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/piemenu1.svg
 "A pie menu for selecting note values.")

As a convenience, a pie menu is used for selecting common note values.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/charts/NotationRestChart.svg
 "A chart of note values and their corresponding note value blocks")

Please refer to the above picture for a visual representation of note
values.

### <a name="PITCH"></a>2.2 Pitch Blocks

As we have seen, *Pitch* blocks are used inside the
[*Note value*](#NOTE-VALUE) blocks. The *Pitch* block specifies the
pitch name and pitch octave of a note that in combination determines
the frequency (and therefore pitch) at which the note is played.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/note3.svg
 "Specifying a pitch block's name and octave")

There are many systems you can use to specify a *pitch* block's name
and octave. Some examples are shown above.

The top *Pitch* block is specified using a *Solfege* block (`Sol` in
`Octave 4`), which contains the notes `Do Re Me Fa Sol La Ti `.

The pitch of the next block is specified using a *Pitch-name* block
(`G` in `Octave 4`), which contains the notes `C D E F G A B`.

The next block is specified using a *Scale-degree* block (the `5th note`
in the scale, 'G', also in 'Octave 4'), `C == 1, D == 2, ...`. The
*Scale-Degree* block has numbers like the *Number* block, but also has 
an accidental so that the user may play pitches outside a given key.

The next blocks is specified using a *Nth Modal Pitch* block. This
block takes a number argument and turns it into the "nth pitch of 
a given scale" with an index of 0 (i.e. C for C major is 0). Therefore
in order to get 'G', we input the number 4. The octave argument will
force the octave up or down; otherwise the user may just keep going up
or down in either direction to go through scalar pitches of any mode.

The next block is specified using a *Pitch-number* block (the `7th
semi-tone` above `C` in `Octave 4`). The offset for the pitch number
can be modified using the *Set-pitch-number-offset* block.

The pitch of the next block is specified using the *Hertz* block in
conjunction with a *Number* block (`392` Hertz) , which corresponds to
the frequency of the sound made.

The octave is specified using a number block and is restricted to
whole numbers. In the case where the pitch name is specified by
frequency, the octave is ignored.The octave argument can also be
specified using a *Text* block with values *current*, *previous*,
*next* which does as 0, -1, 1 respectively.

The octave of the next block is specified using a *current* text block
(`Sol` in `Octave 4`).

The octave of the next block is specified using a *previous* text
block (`G` in `Octave 3`).

The octave of the last block is specified using a *next* text block
(`G` in `Octave 5`).

Note that the pitch name can also be specified using a *Text* block. 

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/piemenu2.svg
 "A pie menu for selecting pitch.")

As a convenience, a pie menu is used for selecting pitch, accidental,
and octave.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/charts/KeyboardChart.svg
 "Note layout chart for keyboard")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/charts/MalletChart.svg
 "Note layout chart for mallet")

Please refer to the above charts for a visual representation of where
notes are located on a keyboard or staff.

### <a name="CHORDS"></a>2.3 Chords

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/note4.svg
 "Forming a chord")

A chord (multiple, simultaneous pitches) can be specified by adding
multiple *Pitch* blocks into a single *Note value* block, like the
above example.

### <a name="RESTS"></a>2.4 Rests

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/silence.svg
 "Silence blocks create rests")

A rest of the specified note value duration can be constructed using a
*Silence* block in place of a *Pitch* block.

### <a name="DRUMS"></a>2.5 Drums

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum1.svg
 "Using Drum Sample block")

Anywhere a *Pitch* block can be used&mdash;e.g., inside of the matrix
or a *Note value* block&mdash;a *Drum Sample* block can also be used
instead. Currently there about two dozen different samples from which
to choose. The default drum is a kick drum.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/note5.svg
 "Multiple Drum Sample blocks in combinations")

Just as in the [chord](#CHORD) example above, you can use multiple
*Drum* blocks within a single *Note value* blocks, and combine them
with *Pitch* blocks as well.

## <a name="PROGRAMMING-WITH-MUSIC"></a>3. Programming with Music

[Previous Section (2. Making Sounds)](#NOTES) | [Back to Table of
Contents](#TOC) | [Next Section (4. Widgets)](#WIDGETS)

This section of the guide discusses how to use chunks of notes to
program music. Note that you can program with chunks you create by
hand or use the [*Phrase maker*](#pitch-time) widget to help you
get started.

### <a name="CHUNKS"></a>3.1 Chunks

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-2.svg
 "working of action stack")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-1.svg
 "using chunk inside Start block")

Every time you create a new *Action* stack, Music Blocks creates a new
block specific to, and linked with, that stack. (The new block is
found at the top of the *Block* palette, found on the left edge of the
screen.) Clicking on and running this block is the same as clicking on
your stack. By default, the new blocks are named `chunk`, `chunk1`,
`chunk2`... but you can rename them by editing the labels on the
*Action* blocks.

An *Action* block contains a sequence of actions that will only be
executed when the block is referred to by something else, such as a
start block. This is useful in orchestrating more complex programs of
music.

A *Start* Block is a *chunk* that will automatically be executed once
the start button is pressed.  This is where most of your programs will
begin at.  There are many ways to *Run* a program: you can click on
the *Run* button at the upper-left corner of the screen to run the
music at a fast speed; a long press on the *Run* button will run it
slower (useful for debugging); and the *Step* button can be used to
step through the program one block per button press. (An extra-long
press of the *Run* button will play back the music slowly. A long
press of the *Step* button will step through the program note by
note.)

In the example above, the *Chunk* block is inside of a *Start* block,
which means that when any of the start buttons is pressed, the code
inside the *Start* block (the *Chunk* block) will be executed. You can
add more chunks after this one inside the *Start* block to execute
them sequentially.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-3.svg
 "usage of multiple Chunk blocks")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-4.svg
 "usage of Repeat block")

You can [repeat](#REPETITION) chunks either by using multiple *Chunk*
blocks or using a *Repeat* block.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-6.svg
 "multiple action stacks")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-5.svg
 "mixing and matching chunks")

You can also mix and match chunks. Here we play the action block with
name `chunk0`, followed by `chunk1` twice, and then `chunk0` again.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-8.svg
 "creating a song using chunks")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/chunk-7.svg
 "usage of Repeat block in a song")

A few more chunks and we can make a song. (Can you read the block
notation well enough to guess the outcome? Are you familiar with the
song we created?)

### <a name="TRANSFORMATION"></a>3.2 Musical Transformations

There are many ways to transform pitch, rhythm, and other sonic qualities.

#### <a name="STEP-PITCH"></a>3.2.1 Step Pitch Block

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform0.svg
 "Using the Step Pitch block")

The *Step Pitch* block will move up or down notes in a scale from the
last played note. In the example above, *Step Pitch* blocks are used
inside of *Repeat* blocks to repeat the code `7` times, playing up and
down a scale.

[RUN
LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523032034365533&run=True)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform16.svg
 "Using the Scalar Step Up and Down blocks")

Another way to move up and down notes in a scale is to use the *Scalar
Step Up* and *Scalar Step Down* blocks. These blocks calculate the
number of half-steps to the next note in the current mode. (You can
read more about [Musical Modes](#modes) below.) Note that the *Mouse
Pitch Number* block returns the pitch number of the most recent note
played.

In this example, we are using the *Mode length* block, which returns
the number of scalar steps in the current mode (7 for Major and Minor
modes).

#### <a name="SHARPS-AND-FLATS"></a>3.2.2 Sharps And Flats

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform1.svg
 "Using Sharp and Flat blocks")

The *Accidental* block can be wrapped around *Pitch* blocks, *Note
value* blocks, or [chunks](#CHUNKS). A sharp will raise the pitch by
one half step. A flat will lower by one half step. In the example, on
the left, just the *Pitch* block `Mi` is lowered by one half step; on
the right, both *Pitch* blocks are raised by one half step. (You can
also use a double-sharp or double-flat accidental.)

#### <a name="ADJUST-TRANSPOSITION"></a>3.2.3 Adjusting Transposition

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform2.svg
 "Adjusting transpositions")

There are several ways to transpose a pitch: by semi-tone or scalar
steps. The *Semi-tone-transposition* block (above left) can be used to
make larger shifts in pitch in half-step units. A positive number
shifts the pitch up and a negative number shifts the pitch down. The
input must be a whole number. To shift up an entire octave, transpose
by `12` half-steps. `-12` will shift down an entire octave.

The *Scalar-transposition* block (above right) shifts a pitch based on
the current key and mode. For example, in `C Major`, a scalar
transposition of `1` would transpose `C` to `D` (even though it is a
transposition of `2` half steps). To transpose `E` to `F` is `1`
scalar step (or `1` half step). To shift an entire octave, scalar
transpose by the mode length up or down. (In major scales, the mode
length is `7`.)

As a convenience, a number of standard scalar transpositions are
provided: *Unison*, *Second*, *Third*, ..., *Seventh*, *Down third*,
and *Down sixth*, as well as a transposition for *Octave*.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform3.svg
 "raising an octave using semi-tone-transposition")

In the example above, we take the song we programmed previously and
raise it by one octave.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform18.svg
 "The Register block")

The *Register* block provides an easy way to modify the register
(octave) of the notes that follow it. In the example above it is first
used to bump the `Mi 4` note up by one octave and then to bump the
`Sol 4` note down by one octave.

#### <a name="PITCH-MOVEMENT"></a>3.2.5 Summary of Pitch Movements

| Representation | Pitch Movement | Properties |
| --- | --- | --- |
| Scalar Step | scalar | 0=no change |
| | | 1=next scalar pitch in current key and mode |
| | | -1=previous scalar pitch in current key and mode |
| | | If the argument to scalar step is positive, it moves up the scale; if it is negative, it moves down the scale. |

| Music Blocks Code for Scalar Step |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement1.svg "scalar") |
| The example above demonstrates traveling up and down the major scale by moving an octave up from the starting note, do, one note at a time and then back down the same way. |

| Standard Notation with Scalar Step |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement1.png "scalar step up and down") |

| Representation | Pitch Movement | Properties |
| --- | --- | --- |
| Transposition | Semi-tone | Creates shifts in pitch by half-steps |
| | | If the argument to transpose is positive, it will shift upwards in pitch; if it is negative, there will be a downwards shift. |
| | | There are 12 half-steps shifts per octave. |
| | | An argument of -12 will shift down one octave. |
| | | An argument of zero will not change the pitch. |

| Music Blocks Code with Scalar Transpose |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement2.svg "semi-tone transposition") |

| Standard Notation for Scalar Transpose |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement2.png "semi-tone transposition") |

| Representation | Pitch Movement | Properties |
| --- | --- | --- |
| Transposition | Scalar | Shifts the pitch based on the current key and mode |
| | | Each number represents a scalar step. |
| | | Scalar transposition can transform your original key to a new key by counting the notes between the keys. |
| | | For example: Transposing C-D-E-F by 4 (fifth) will give us G-A-B-C
| | | To transpose an octave: shift by the mode length (7 in major scales) up or down. |

| Music Blocks for Set Key and Movable Do | 
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement3.svg "scalar transposition") |

| Standard Notation for Set Key and Movable Do |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement3.png "scalar transposition") |

| Representation | Pitch Movement | Properties |
| --- | --- | --- |
| Scale Degree | Scalar | The key block sets the key and mode. |
| | | The scale degree blocks indicate which position the pitch is taking in the scale relative to the tonic which is "scale degree 1". |

| Music Blocks Code with Scale Degrees 1-5 |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement4.svg "scale degree") |

| Standard Notation for Scale Degrees 1-5 |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement4.png "scale degree") |

| Representation | Pitch Movement | Properties |
| --- | --- | --- |
| Movable “Do” | Advanced transposition by mode | Movable Do in combination with the Scale/Mode blocks will transpose sections of music in a nuanced way. |
| | | The Set-key block allows you to  change both the mode and key of how solfege is mapped to the notes. |
| | | For example, in C major - Do is C, Re is D, Mi is E, etc. |
| | | In F major - Do is F, Re is G, Mi is A |

| Music Blocks Code with Set Key and Movable Do |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement5.svg "moveable do") |

| Standard Notation Code for Set Key and Movable Do |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement5.png "moveable do") |

| Representation | Pitch Movement | Properties |
| --- | --- | --- |
| Movable “Do” | Advanced transposition by mode | You also have the option of changing the mode to Minor, Major, Chromatic, and many other exotic modes like hirajoshi, as shown in the example below. |

| Music Blocks for Set Key and Scalar Step |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement6.svg "moveable do") |

| Standard Notation with Set Key and Scalar Step |
| --- |
| ![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchmovement6.png "moveable do") |

#### <a name="FIXED-AND-MOVABLE-PITCH-SYSTEMS"></a>3.2.5 Pitch Systems: Fixed and Movable and Subsystems

Music Blocks allows users to express and explore musical ideas in a variety of different systems. The main systems of expression are fixed and movable.

**Fixed and Movable Systems**

Fixed pitch systems represent pitches in an absolute way. Pitches in a fixed system do not change, regardless of a tonal context such as key. Movable systems, on the other hand, represent pitches in a relative way based on their tonal context.

One example of a fixed system is alphabet notation. Pitches are expressed as `A`, `B`, `C`, `D`, `E`, `F`, and `G`. Regardless of whether the key is C major or G minor, the pitch G is the same. The pitches are the same regardless of the context.

One example of a movable system is scale degree. Pitches are expressed as `1`, `2`, `3`, `4`, `5`, `6`, and `7`. For C major, these pitches are `C`, `D`, `E`, `F`, `G`, `A`, and `B`. For G (natural) minor, these pitches are `G`, `A`, `Bb`, `C`, `D`, `Eb`, and `F`. The pitches are determined by the tonal context.

One example of a system that is either fixed or movable is solfege. Solfege can either be a fixed system (fixed solfege) or a movable system (movable solfege). Fixed solfege works like the alphabet system; `La` is `A`, `Ti` is `B`, `Do` is `C`, etc. Context does not affect the sounding pitch. Movable solfege works like the scale degree system; For any major, `Do` is 1st scale degree, `Re` is 2nd, `Mi` is 3rd, `Fa` is 4th, etc. 

Music Blocks users can create and preview code in fixed solfege and movable solfege. Teachers and learners may use either system (or both) to express their musical ideas as well as deepen their understanding of music.

**Using Tonal Context with Movable Systems**

For movable systems an important point of context is its key and mode. For "C Major", the key is "C" and the mode is "Major" or Ionian. Key and mode is important as it lays out the tonal framework--which pitches are "in" and which are "out". It also lays out the function of the pitches within the framework. This is why for scale degrees `1`, `2`, `3`, `4`, and `5`, the expected result for C major is `C`, `D`, `E`, `F`, and `G` (skipping any sharps/flats), while those same scale degrees for D major are `D`, `E`, `F#`, `G`, and `A`. The set of pitches that make up C major have no sharps or flats, so they are skipped. D major has two sharps, `F#` and `C#`. The `F#` is the 3rd scale degree for D major.

Scale Degree with *Set Key* is a very powerful tool for expression. It is also very common in music pedagogy. However, it is a tool that works best to express seven pitch tonal frameworks (e.g. major, minor, and common seven pitch scales). For musical ideas where a more purely mathematical form of expression is required, Music Blocks offers the user *nth modal pitch*.

*nth Modal Pitch* is similar to *Scale Degree* in that it is a movable system that uses numbers to express pitches. However, unlike *Scale Degree*, *nth Modal Pitch* starts at `0`, allows for negative numbers, and is not restricted to a seven pitch tonal framework. `0` is the first pitch of the mode, `1` is the next pitch, `2` is the pitch above that, etc. `-1` is the pitch before the first pitch of the mode. This tool is expecially helpful for expressing a musical idea that requires computation as you can run computations directly on the number value. It is also helpful if you are, for example, creating music in a whole tone (six note) pitch space. In the case of *Set Key* set to "whole tone", `6` would be the octave above.

**Pitch Number, MIDI, and Set Pitch Number Offset**

*Pitch Number* is similar to *nth Modal Pitch* in that it is a zero-based, mathematical system to express pitches. However, unlike *nth Modal Pitch*, *Pitch Number* disregards any tonal framework. It is also chromatic by default, meaning that its pitch space includes the sharp/flat pitches (black keys on piano) as well as the natural pitches (white keys on piano). By default, middle C (C_4) is `0`. The C major scale in the 4th octave is `0`, `2`, `4`, `5`, `7`, `9`, and `11`. `12` is the C an octave above middle C (C_5). This system is useful mathematically, but because it disregards key, it is difficult to create something musical. That being said, fretted instruments such as ukulele and guitar use this system to express pitch, so it is a good system for expressing how these instruments work.

MIDI also uses a similar system to *Pitch Number* to express pitches, but the 0 is offset from Music Blocks' default. In order to change the sounding pitch of `0` for *Pitch Number*, use *set pitch number offset*. This makes *Pitch Number* blocks behave as a relative system as it transposes the pitches up or down accordingly (but has no effect on key).

**Two Subsystems for Movable**

For Movable Do, there exists yet two more systems. One system, which we call `Movable=Do`, allows the user to express solfege syllables in relation to the Major mode. Therefore, if a user were to specify A minor, then La would be A, the first scale degree in A Minor. The other system, which we call `Movable=La` allows the user to express solfege in relation to the particular mode specified. Therefore, if a user were to specify A Minor, then Do would be A. *Scale Degree* works like `Movable=La` by default such that `1` is always the first pitch of a given mode.

For scale degree, because some users may want to explicitly spell out all of the pitches regardless of the chosen key, we allow them to express it that we via the *Movable Do* block (because Scale Degree works like Movable=La by default). Please see [this code](https://rawgithub.com/sugarlabs/musicblocks/master/examples/2-spelling-systems-for-Scale-Degree.html) as an example.

Because many of the blocks behave differently depending on whether or not a *Movable Do* block is present, the following chart was created for clarity.

Block(s) | Fixed or Movable? (Do or La?) | Set Key Transformation?
----- | -------------------- | -------
Alphabet Pitch | Fixed | No effect.
Solfege | Fixed by default  | No effect.
Solfege and Movable Do | Specified via "movable" block set to Do | Yes.
Solfege and Movable La | Specified via "movable" block set to La | Yes. Works like Scale Degree.
n^th modal pitch | Movable | Yes. Good for modes of any length.
Scale Degree | Movable | Yes. Most useful for 7 note systems. Works just like Movable=La for Solfege by default.
Scale Degree | Movable | Yes. When preceded by Movable=Do, the user can be explicit in their spelling.
Scalar Step | Movable | Yes. Navigates up/down within *nth modal pitch* space.
Scalar Interval | Movable | Yes. Adds above/under within *nth modal pitch* space.
Scalar Inversion | Movable | Yes. Inversion around a specified axis within *nth modal pitch* space.
Pitch Number | Movable | No effect. Pitches can be transformed via Set Pitch Number Offset.

Illustrative Examples:

The following example exposes how the Scale Degree functionality combines math and musical modifiers. When combining numbers and accidentals, it recreates the same functionality as the *Scale Degree* block.

![Scale Degree Improv Example](https://rawgit.com/sugarlabs/musicblocks/master/charts/scale-degree-improv.svg "Scale Degree Improv")

[Scale Degree Improv](https://rawgit.com/sugarlabs/musicblocks/master/charts/Scale-Degree-Improv.html)

#### <a name="DOTTED"></a>3.2.6 Dotted Notes

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform4.svg
 "Creating dotted notes using the Dot block")

You can "dot" notes using the *Dot* block. A dotted note extends the
rhythmic duration of a note by 50%. E.g., a dotted quarter note will
play for `3/8` `(i.e. 1/4 + 1/8)` of a beat. A dotted eighth note will
play for `3/16` `(i.e. 1/8 + 1/16)` of a beat. A double dot extends
the duration by `75%` `(i.e. 50% + [50% of 50%])`. For example, a
double-dotted quarter note will play for `7/16` `(i.e. 1/4 + 1/8 +
1/16)` of a beat (which is the same as `4/16 + 2/16 + 1/16 = 7/16`).

The dot block is useful as an expression of musical rhythm--it is
convenient and helps to organize musical ideas (e.g. many melodies use
dots as the basis of their rhythmic motifs), however you can achieve
the same rhythmic result as dot by putting the calculation directly
into note value as well. For example, indicating `3/8` instead of
`1/4` will result in a dotted quarter note.

The chart below shows two common examples, dotted quarter and dotted
eighth, and how to achieve them with either the dot block or by direct
calculation into a note's note value.

![alt tag](https://rawgit.com/sugarlabs/musicblocks/master/charts/DotsChart.svg "using dotted notes")

#### <a name="MULTIPLY-AND-DIVIDE"></a>3.2.7 Changing Note(s) duration via Mathematical Operations

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform5.svg "Changing note duration for a note or notes")

You can also multiply (or divide) the note value, which will change
the duration of the notes by changing their note values. Multiplying
the note value of an `1/8` note by `1/2` is the equivalent of playing
a `1/16` note (i.e. `1/2 * 1/8 = 1/16`) . Multiplying the note value
of an `1/8` note by `2/1` (which has the effect of dividing by `1/2`)
will result in the equivalent of a `1/4` note.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum4.svg
 "increasing sequence of drum beats over time")

In the above example, the sequence of [drum](#DRUMS) note values is
decreased over time, at each repetition.

[RUN LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523106271018484&run=True)

#### <a name="REPETITION"></a>3.2.8 Repeating Notes

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform6.svg
 "repeating notes")

There are several ways to repeat notes. The *Repeat* block will play a
sequence of notes multiple times; the *Duplicate* block will repeat each
note in a sequence.

In the example, on the left, the result would be `Sol, Re, Sol, Sol,
Re, Sol, Sol, Re, Sol, Sol, Re, Sol`; on the right the result would be
`Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol`.

#### <a name="SWINGING"></a>3.2.9 Swinging Notes and Tied Notes

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform7.svg
 "swinging notes and tied notes")

The *Swing* block works on pairs of notes (specified by note value),
adding some duration (specified by swing value) to the first note and
taking the same amount from the second note. Notes that do not match
note value are unchanged.

In the example, `re5` would be played as a `1/6` note and `mi5` would
be played as a `1/12` note (`1/8 + 1/24 === 1/6` and `1/8 - 1/24 ===
1/12`). Observe that the total duration of the pair of notes is
unchanged.

Tie also works on pairs of notes, combining them into one note. (The
notes must be identical in pitch, but can vary in rhythm.)

![alt
 tag](https://rawgit.com/sugarlabs/musicblocks/master/charts/TiesChart.svg
 "using notes with ties")

#### <a name="MORE-TRANSFORMATIONS"></a>3.2.10 Set Volume, Crescendo, Staccato, and Slur

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform8.svg
 "Set master volume, set synth volume, set relative volume,
 crescendo")

The *Set master volume* block will change the master volume. The
default is `50`; the range is `0` (silence) to `100` (full volume).

The *Set synth volume* block will change the volume of a particular
synth, e.g., `violin`, `snare drum`, etc. The default volume is `50`;
the range is `0` (silence) to `100` (full volume). In the example, the
*synth name* block is used to select the current synth.

As a convenience, a number of standard volume blocks are provided:
from loudest to quietest, there is *fff*, *ff* *f*, *mf*, *mp*, *p*,
*pp*, and *ppp*. In musical terms "f" means "forte" or loud, "p" means
"piano" or soft, and "m" means "mezzo" or middle.

The *Set Relative Volume* block modifies the clamped note's volume
according to the input value of the block in an added (or subtracted
when negative) percentage with respect to the original volume. For
example, `100` would mean doubling the current volume.

The *Crescendo* block will increase (or decrease) the volume of the
contained notes by a specified amount for every note played. For
example, if you have 3 notes in sequence contained in a *Crescendo*
block with a value of `5`, the final note will be at 15% more 
than the original value for volume.

NOTE: The *Crescendo* block does not alter the volume of a note as it
is being played. Music Blocks does not yet have this functionality.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform17.svg
 "Staccato, and Slur blocks")

The *Staccato* block shortens the length of the actual
note&mdash;making them tighter bursts&mdash;while maintaining the
specified rhythmic value of the notes.

The *Slur* block lengthens the sustain of notes&mdash;running longer than
the noted duration and blending it into the next note&mdash;while
maintaining the specified rhythmic value of the notes.

#### <a name="INTERVALS"></a>3.2.11 Intervals

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform9.svg
 "Scalar interval block")

The *Scalar interval* block calculates a relative interval based on
the current mode, skipping all notes outside of the mode. For example,
a *fifth*, and adds the additional pitches to a note's playback. In
the figure, we add `La` to `Re` and `Ti` to `Mi`.

As a convenience, a number of standard scalar intervals are provided
on the *Intervals* palette: *Unison*, *Second*, *Third*, ...,
*Seventh*, *Down third*, and *Down sixth*.

The *Scalar interval measure* block can be used to measure the number
of scalar steps between two pitched.

#### <a name= "ABSOLUTE-INTERVALS"></a>Absolute Intervals

Absolute (or semi-tone) intervals are based on half-steps.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform14.svg
 "Using absolute intervals")

The *Augmented* block calculates an absolute interval (in half-steps),
e.g., an augmented fifth, and adds the additional pitches to a
note. Similarly, the *Minor* block calculates an absolute interval,
e.g., a minor third. Other absolute intervals include *Perfect*,
*Diminished*, and *Major*.

In the augmented fifth example above, a chord of `D5` and `A5` are
played, followed by a chord of `E5` and `C5`. In the minor third
example, which includes a shift of one octave, first a chord of `D5`
and `F5` is played, followed by chord of `E5` and `G6`.

As a convenience, a number of standard absolute intervals are provided
on the *Intervals* palette: *Major 2*, *Minor 3*, *Perfect 4*,
*Augmented 6*, *Diminished 8*, et al.

The *Doubly* block can be used to create a double augmentation or
double diminishment.

The *Semi-tone interval measure* block can be used to measure the
number of half-steps between two pitched.

#### <a name= "INVERSION"></a>3.2.12 Inversion

The *Invert* block will rotate a series of notes around a target
note. There are three different modes of the *Invert* block: *even*,
*odd*, and *scalar*. In *even* and *odd* modes, the rotation is based
on half-steps. In *even* and *scalar* mode, the point of rotation is
the given note. In *odd* mode, the point of rotation is shifted up by
a `1/4` step, enabling rotation around a point between two notes. In
"scalar" mode, the scalar interval is preserved around the point of
rotation.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform13.svg
 "inversion")

NOTE: The initial `C5` pitch (as a half note) remains unchanged (in
all of the examples) as it is outside of the invert block.

The above example code has an *even* inversion for two notes `F5` and
`D5` around the reference pitch of `C5`. We would expect the following
results:

Even inversion

| Starting pitch | Distance from `C5`    | Inverse distance from `C5` | Ending pitch |
| :------------: | :-------------------: | :------------------------: | :----------: |
| `F5`           | 5 half steps *above*  | 5 half steps *below*       | `G4`         |
| `D5`           | 2 half steps *above*  | 2 half steps *below*       | `B♭4`        |

This operation can also be visualized on a pitch clock. The arrows on
the following diagram point from the starting pitch, around the axis
of the reference pitch, to its destination ending pitch.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/even-invert-chart.svg "even invert chart")

In standard notation the result of this *even* inversion operation is
depicted in the second measure of the following example. The first
measure is the original reference.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/invert-even.png
 "even invert example")

Underneath the *even* inversion in the example code is an *odd*
inversion for the same two notes of `F5` and `D5` around the same
reference pitch of `C5`. We would expect the following results:

Odd inversion

| Starting pitch | Distance from midway-point between `C5` and `C♯5` | Inverse distance from midway-point between `C5` and `C♯5` | Ending pitch |
| :------------: | :-----------------------------------------------: | :-------------------------------------------------------: | :----------: |
| `F5`           | 4.5 half steps *above*                            | 4.5 half steps *below*                                    | `A♭4`        |
| `D5`           | 1.5 half steps *below*                            | 1.5 half steps *above*                                    | `B4`         |

This operation can be visualized on a pitch clock similar to *even*
inversion except offset in-between `C5` and `C♯5` (i.e. quarter step
*above* `C5`).

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/odd-invert-chart.svg
 "odd invert chart")

In standard notation the result of this *odd* inversion operation is
depicted in second measure of the following example. The first measure
is the original reference. NOTE: The `C5` pitch remains unchanged as
it is not operated upon in the example block code (above). If it were
contained in the operation it would be changed to `C♯5` (i.e. `C5` is
0.5 half steps *below* the axis of rotation, so the result of an
inversion around `C5` and `odd` would be 0.5 half steps *above* the
axis of rotation).

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/invert-odd.png
 "odd invert example")

Scalar inversion

Underneath the *even* and *odd* inversion blocks in the example code
is an inversion block set to *scalar*. We would expect the following
results:

| Starting pitch | Scalar distance from `C5` (in steps) | Inverse scalar distance from `C5` (in steps) | Ending pitch |
| :------------: | :----------------------------------: | :------------------------------------------: | :----------: |
| `F5`           | 3 above (C5 --> D5 --> E5 --> F5)    | 3 below (C5 --> B4 --> A4 --> G4)            | `G4`         |
| `D5`           | 1 above (C5 --> D5)                  | 1 below (C5 --> B4)                          | `B4`         |

This operation can be visualized on a pitch clock similar to *odd* and
*even* except that all non-scalar pitches (i.e. pitches outside the
chosen key) are skipped. NOTE: The scalar pitches are shown in bold in
the following pitch clock diagram.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/scalar-invert-chart.svg
 "scalar invert chart")

In standard notation the result of *scalar* inversion operation is
depicted in the second measure of the following example. The first
measure is the original reference.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/invert-scalar.png
 "scalar invert example")

In the *invert (even)* example above, notes are inverted around `C5`.
In the *invert (odd)* example, notes are inverted around a point
midway between `C5` and `C♯5`.  In the *invert (scalar)* example,
notes are inverted around `C5`, by scalar steps rather than
half-steps.

#### <a name="BACKWARDS"></a>3.2.13 Backwards

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform11.svg
 "Backward block")

The *Backward* block will play the contained notes in reverse order
(retrograde). In the example above, the notes in `chunk` are played as
`Sol`, `Ti`, `La`, `Sol`, i.e., from the bottom to the top of the
stack.

An example from Bach is provided. In the example, there are two
voices, one which plays the composition forward and one that plays the
same composition backward. [RUN
LIVE](https://musicblocks.sugarlabs.org/index.html?id=1522885752309944&run=True)

Note that all of the blocks inside a *Backward* block are reverse, so
use this feature with caution if you include logic intermixed with
notes.

#### <a name= "SETTING"></a>3.2.14 Setting Voice and Keys

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform12.svg
 "setting voice and keys using Set Voice block")

The *Set Voice* block selects a [voice](#VOICES) for the synthesizer for any
contained blocks, e.g., violin or cello.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform10.svg
 "Set Key block")

The *Set Key* block will change the key and mode of the mapping
between solfege, e.g., `Do`, `Re`, `Mi`, to note names, e.g., `C`,
`D`, `E`, when in C Major. Modes include Major and Minor, Chromatic,
and a number of more exotic modes, such as Bebop, Geez, Maqam, etc.
This block allows users to access "movable Do" within Music Blocks,
where the mapping of solfege to particular pitch changes depending on
the user's specified tonality.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform19.svg
 "Define mode block")

The *Define mode* block can be used to define a custom mode by
defining the number and size of the steps within an octave. You can
use your custom mode with the *Set key* block.

#### <a name="VIBRATO"></a>3.2.15 Vibrato, Tremelo, et al.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/transform15.svg
 "Vibrato, tremelo, chorus, distortion, neighbor, and phaser blocks")

The *Vibrato* Block adds a rapid variation in pitch to any contained
notes. The intensity of the variation ranges from `1` to `100` (cents),
e.g. plus or minus up to one half step. The rate argument determines
the rate of the variation.

The other effects blocks also modulate pitch over time. Give them a try.

### <a name="VOICES"></a>3.3 Voices

Each *Start* block runs as a separate voice in Music Blocks. (When
you click on the Run button, all of the *Start* blocks are run
concurrently.)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/voices1.svg
 "use of voices")

If we put our song into an action...

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/voices2.svg
 "running the song using multiple Start blocks")

...we can run it from multiple *Start* blocks.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/voices3.svg
 "shifting the octaves up and down")

It gets more interesting if we shift up and down octaves.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/voices4.svg
 "playing the various voices offset in time")

And even more interesting if we bring the various voices offset in time.

[RUN
LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523026536194324&run=True)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/voices5.svg
 "queuing the various voices using events")

An alternative to use a preprogrammed delay is to use the *Broadcast*
block to bring in multiple voices. In the example above, after each
section of the song is played, a new event is broadcasted, bringing in
a new voice. Note the use of the *Mouse Sync* block. This ensures that
the multiple voices are synced to the same master clock.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum3.svg
 "usage of kick drum")

A special *Start drum* version of the *Start* block is available for
laying down a drum track. Any *Pitch* blocks encounted while starting
from a drum will be played as `C2` with the default drum sample. In
the example above, all of the notes in `chunk` will be played with a
kick drum.

### <a name="GRAPHICS"></a>3.4 Adding graphics

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/graphics1.svg
 "adding graphics")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/graphics2.svg
 "color range")

Turtle graphics can be combined with the music blocks. By placing
graphics blocks, e.g., *Forward* and *Right*, inside of *Note value*
blocks, the graphics stay in sync with the music. In this example, the
turtle moves forward each time a quarter note is played. It turns
right during the eighth note. The pitch is decreased by one half step,
the pen size decreases, and the pen color increases at each step in
the inner repeat loop.

[RUN
LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523494709674021&run=True)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/graphics3.svg
 "synchronizing graphics and music")

Another example of graphics synchronized to the music by placing the
graphics commands inside of *Note value* blocks

[RUN
LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523106271018484&run=True)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/drift_block.svg
 "No-clock block")

Music Blocks has an internal "conductor" maintaining the beat.  When
the Run button is clicked, the program begins and an internal master
(or "conductor") clock starts up. All of the music tries to stay
synced to that clock.

For example, if you have multiple voices (mice), they all share the
same conductor in order to keep on the same beat. If a voice (mouse)
is falling behind, Music Blocks tries to catch up on the next note by
truncating it. If it is an 1/8 note behind and the next note is a 1/2
note, then only an 3/8 note would be played, so as to catch up. That
is a somewhat extreme example—usually the timing errors are only
very very small differences.

But in some situations, the timing errors can be very large. This is
when the *No-clock* block is used.

A typical problem is when the music is not played
continuously. Imagine an interactive game where a hero is battling a
monster. Our hero plays theme music whenever the monster is
defeated. But that might occur at any time, hence it is not going to
be in sync with the conductor. The offset could be tens of
seconds. This would mean that all of the notes in the theme music
might be consumed by trying to catch up with the conductor. The
*No-clock* block essentially says, do your own thing and don't worry
about the conductor.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/fibonacci3.svg
 "usage of No-clock block")

In this example, because the computation and graphics are more
complex, a *No-clock* block is used to decouple the graphics from the
master clock. The "No-clock* block prioritizes the sequence of
actions over the specified rhythm.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/graphics4.png
 "rhythm sequence")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/tree-example.svg
 "another example of the No-clock block")

Another example of embedding graphics into notes: in case, a recursive
tree drawing, where the pitch goes up as the branches assend.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/tree.svg
 "tree graphic")

[RUN LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523029986215035&run=True)

### <a name="BEAT"></a>3.5 Beat

The beat of the music is determined by the *Meter* block (by default,
it is set to 4:4).

The *Pickup* block can be used to accommodate any notes that come in
before the beat.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/beat1.svg
 "meter and pickup")

The Beat count block is the number of the current beat, eg 1, 2, 3, or 4. 
In the figure, it is used to take an action on the first beat of each measure.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/beatvalue_block.svg
 "beat count")

The Measure count block returns the current measure.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/measurevalue_block.svg
 "measure count")

Specifying beat is useful in that you can have the character of a note
vary depending upon the beat. In the example below, the volume of
notes on Beat `1` and Beat `3` are increased, while the volume of off
beats is decreased.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/beat2.svg
 "on-beat-do")

The *On-Beat-Do* and *Off-Beat-Do* blocks let you specify actions to
take on specific beats. (Note that the action is run before any blocks
inside the note block associated with the beat are run.)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/graphics5.svg
 "using beat to synchronize graphics")

Another approach to graphics is to use modulate them based on the
beat. In the example above, we call the same graphics action for each
note, but the parameters associated with the action, such as pen
width, are dependent upon which beat we are on. On Beat 1, the pen
size is set to `50` and the volume to `75`. On Beat `3`, the pen size is set
to `25` and the volume to `50`. On off beats, the pen size is set to `5` and
the volumne to `5`. The resultant graphic is shown below.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/graphics6.svg
 "graphics modulated by beat")

### <a name="INTERACTIONS"></a>3.6 Interactions

There are many ways to interactive with Music Blocks, including
tracking the mouse position to impact some aspect of the music.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/interactive.svg
 "interactions")

For example, we can launch the phrases (chunks) interactively. We use
the mouse position to generate a suffix: `0`, `1`, `2`, or `3`,
depending on the quadrant. When the mouse is in the lower-left
quadrant, `chunk0` is played; lower-right quadrant, `chunk1`;
upper-left quadrant, `chunk2`; and upper-right quadrant, `chunk3`.

[RUN LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523028011868930&run=True)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/interactive2.svg
 "creation of a two-key piano")

In the example above, a simple two-key piano is created by associating
*click* events on two different turtles with individual notes. Can you
make an 8-key piano?

[RUN LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523107390715125&run=True)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/interactive3.svg
 "adding randomness to your music")

You can also add a bit of randomness to your music. In the top example
above, the *One-of* block is used to randomly assign either `Do` or
`Re` each time the *Note value* block is played. In the bottom example
above, the *One-of* block is used to randomly select between `chunk1`
and `chunk2`.

Musical Paint has been a popular activity dating back to programs such
as Dan Franzblau's *Vidsizer* (1979) or Morwaread Farbood's
*Hyperscore* (2002). Music Blocks can be used to create musical paint
as well. In the somewhat ambitious example below, we go a step further
than the typical paint program in that you can not only paint music (a
la Vidsizer) and playback your painting as a composition (a la
Hyperscore), but also generate *Note* blocks from your composition.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/hyperscore.svg
 "musical paint")

The program works by first creating an array from the heap that
corresponds to a 20x12 grid of notes on the screen: 20 columns,
representing time from left to right; and 12 rows, corresponding to
scalar pitch values, which increase in value from the bottom to the
top.

The *record* action repeatedly calls the *paint* action until the
*playback* button is clicked.

The *paint* action tracks the mouse (*Set XY* to *cursor x* and
*cursor y*) and, if the mouse button is pressed, marks an entry in the
array corresponding to that note, plays the note, and leaves behind a
"drop of paint".

The *playback* action is invoked by clicking on the *play* mouse,
which sets *recording* to `0`, thus breaking out of the paint "while
loop". Playback scans each column in the array from left to right for
pitches to play and generates a chord of pitches for each column.

Once the *playback* action is complete, the *save* action is
invoked. Again each column in the array is scanned, but this time,
instead of playing notes, the *Make Block* block is called in order to
generate a stack of notes that correspond to the composition. This
stack can be copied and pasted into another composition.

While a bit fanciful, this example, which can be run by clicking on
the link below, takes musical paint in a novel direction.

[RUN LIVE](https://walterbender.github.io/musicblocks/index.html?id=1523896294964170&run=True&run=True)

## <a name="ENSEMBLE"></a>3.7 Ensemble

Much of music involves multiple instruments (voices or "mice" in Music
Blocks) playing together. There are a number of special blocks that
can be used to coordinate the actions of an ensemble of mice.

This secction will guide about different ensemble blocks, which
communicate the status of mice by name, including notes played,
current pen color, pitch number, etc.

To use the ensemble blocks, you must assign a name to each mouse, as
we will reference each mouse by its name.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtlenameonly_block.svg
 "mouse name")

The *Mouse sync* block aligns the beat count between mice.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtlesync_block.svg
 "mouse sync")

The *Mouse index heap* block returns a value in the heap at a specified
location for a specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtleheap_block.svg
 "mouse heap index")

The *Mouse elapse notes* block returns the number of notes played by the
specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtleelapsednotes_block.svg
 "mouse notes played")

The *Mouse pitch block* returns the current pitch number being played by
the specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtlepitch_block.svg
 "mouse pitch number")

The *X mouse* block returns the X position of the specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/xturtle_block.svg
 "mouse x")

The *Y mouse* block returns the Y position of the specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/yturtle_block.svg
 "mouse y")

The *Mouse heading* block returns the heading of the specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtleheading_block.svg
 "mouse heading")

The *Mouse color* block returns the pen color of the specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/turtlecolor_block.svg
 "mouse color")

The *Found mouse* block will return true if the specified mouse can be found.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/foundturtle_block.svg
 "found mouse")

The *Set mouse* block sends a stack of blocks to be run by the specified mouse.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/documentation/setturtle_block.svg
 "set mouse")

## <a name="WIDGETS"></a>Widgets

[Previous Section (3. Programming with Music)](#PROGRAMMING-WITH-MUSIC) | [Back to Table of Contents](#TOC) | [Next Section (5. Beyond Music Blocks)](#BEYOND-MUSIC-BLOCKS)

This section of the guide will talk about the various Widgets that can
be used within Music Blocks to enhance your experience.

Every widget has a menu with at least two buttons.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/close-button.svg
 "close button")

You can hide the widget by clicking on the *Close* button.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/grab-handle.svg
 "drag handle")

You can move the widget by dragging it by the *Drag* handle.

### <a name="status"></a>4.1 Status

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/status1.svg
 "given Music block")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/status2.svg
 "status in tabular form")

The *Status widget* is a tool for inspecting the status of Music
Blocks as it is running. By default, the key, BPM, and volume are
displayed. Also, each note is displayed as it is played. There is one
row per voice in the status table.

Additional *Print* blocks can be added to the *Status* widget to
display additional music factors, e.g., duplicate, transposition,
skip, [staccato](#MORE-TRANSFORMATIONS),
[slur](#MORE-TRANSFORMATIONS), and [graphics](#GRAPHICS) factors,
e.g., x, y, heading, color, shade, grey, and pensize.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/status3.svg
 "additional programming within the Status block")

You can do additional programming within the status block. In the
example above, `whole notes played` is divided by `4` (e.g. quarter notes)
before being displayed.

### <a name="GENERATION"></a>4.2 Generating Chunks of Notes 

Using the Phrase Maker, it is possible to generate chunks of
notes at a much faster speed.

#### <a name="pitch-time"></a>4.2.1 The Phrase Maker

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix1.svg
 "phrase maker")

Music Blocks provides a widget, the *Phrase maker*, as a scaffold
for getting started.

Once you've launched Music Blocks in your browser, start by clicking
on the *Phrase maker* stack that appears in the middle of the
screen. (For the moment, ignore the *Start* block.) You'll see a grid
organized vertically by pitch and horizontally by rhythm.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix2.svg
 "Pitch and Rhythm block matrix")

The matrix in the figure above has three *Pitch* blocks and one
*Rhythm* block, which is used to create a 3 x 3 grid of pitch and
time.

Note that the default matrix has five *Pitch* blocks, one *Drum*
block, and two *Mouse* (movement) blocks. Hence, you will see eight
rows, one for each pitch, drum, and mouse (movement). (A ninth row at
the bottom is used for specifying the rhythms associated with each
note.) Also by default, there are two *Rhythm* blocks, which specifies
six quarter `(1/4)` notes followed by one half `(1/2)` note.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix3.svg
 "matrix")

By clicking on individual cells in the grid, you should hear
individual notes (or chords if you click on more than one cell in a
column). In the figure, three quarter notes are selected (black
cells). First `Re 4`, followed by `Mi 4`, followed by `Sol 4`.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/play-button.svg
 "play button")

If you click on the *Play* button (found in the top row of the grid),
you will hear a sequence of notes played (from left to right): `Re 4`,
`Mi 4`, `Sol 4`.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/export-chunk.svg
 "save button")

Once you have a group of notes (a "chunk") that you like, click on the
*Save* button (just to the right of the *Play* button). This will
create a stack of blocks that can used to play these same notes
programmatically. (More on that below.)

You can rearrange the selected notes in the grid and save other chunks
as well.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/sort.svg
 "sort button")

The *Sort* button will reorder the pitches in the matrix from highest
to lowest and eliminate any duplicate *Pitch* blocks.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/erase-button.svg
 "erase button")

There is also an Erase button that will clear the grid.

Don't worry. You can reopen the matrix at anytime (it will remember
its previous state) and since you can define as many chunks as you
want, feel free to experiment.

Tip: You can put a chunk inside a *Phrase maker* block to generate
the matrix to corresponds to that chunk.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix4.svg
 "usage of octave for a pitch")

The chunk created when you click on the matrix is a stack of
blocks. The blocks are nested: an *Action* block contains three *Note
value* blocks, each of which contains a *Pitch* block. The *Action*
block has a name automatically generated by the matrix, in this case,
chunk. (You can rename the action by clicking on the name.). Each note
has a duration (in this case 4, which represents a quarter note). Try
putting different numbers in and see (hear) what happens. Each note
block also has a pitch block (if it were a chord, there would be
multiple *Pitch* blocks nested inside the Note block's clamp). Each
pitch block has a pitch name (`Re`, `Mi`, and `Sol`), and a pitch
octave; in this example, the octave is 4 for each pitch. (Try changing
the pitch names and the pitch octaves.)

To play the chuck, simply click on the action block (on the word
action). You should hear the notes play, ordered from top to bottom.

#### <a name="THE-RHYTHM-BLOCK"></a>4.2.2 The Rhythm Block

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix6.svg
 "the Rhythm block")

*Rhythm* blocks are used to generate rhythm patterns in the
*Phrase maker* block. The top argument to the *Rhythm* block
is the number of notes. The bottom argument is the duration of the
note. In the top example above, three columns for quarter notes
would be generated in the matrix. In the middle example, one column
for an eighth note would be generated. In the bottom example, seven
columns for 16th notes would be generated.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix7.svg
 "usage of Rhythm block")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix8.svg
 "resulting notes in tabular format")

You can use as many *Rhythm* blocks as you'd like inside the
*Phrase maker* block. In the above example, two *Rhythm*
blocks are used, resulting in three quarter notes and six eighth
notes.

#### <a name="CREATING-TUPLETS"></a>4.2.3 Creating Tuplets

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix9.svg
 "simple tuplet")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix10.svg
 "tuplet and rhythmic note values")

Tuplets are a collection of notes that get scaled to a specific
duration. Using tuplets makes it easy to create groups of notes that
are not based on a power of 2.

In the example above, three quarter notes&mdash;defined in the *Simple
Tuplet* block&mdash;are played in the time of a single quarter
note. The result is three twelfth notes. (This form, which is quite
common in music, is called a *triplet*. Other common tuplets include a
*quintuplet* and a *septuplet*.)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix11.svg
 "usage of tuplet")

In the example above, the three quarter notes are defined in the
*Rhythm* block embedded in the *Tuplet* block. As with the *Simple
Tuplet* example, they are played in the time of a single quarter
note. The result is three twelfth notes. This more complex form allows
for intermixing multiple rhythms within single tuplet.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix12.svg
 "embedding rhythm and Tuplet block")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix13.svg
 "tuplet and rhythmic note values")

In the example above, the two *Rhythm* blocks are embedded in the
*Tuplet* block, resulting in a more complex rhythm.

Note: You can mix and match *Rhythm* blocks and *Tuplet* blocks when
defining your matrix.

#### <a name="WHAT-IS-TUPLET"></a>4.2.4 What is a Tuplet?

![alt
 tag](https://rawgit.com/sugarlabs/musicblocks/master/charts/TupletChart.svg
 "tuplet chart")

![alt
 tag](https://rawgit.com/sugarlabs/musicblocks/master/charts/TripletChart.svg
 "triplet chart")

#### <a name="INDIVIDUAL-NOTES"></a>4.2.5 Using Individual Notes in the Phrase Maker

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix14.svg)

You can also use individual notes when defining the grid. These blocks
will expand into *Rhythm* blocks with the corresponding values.

#### <a name="USING-A-SCALE"></a>4.2.6 Using a Scale of Pitches in the Phrase Maker

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/matrix15.svg)

You can use the *Scalar step* block to generate a scale of pitches in
the matrix. In the example above, the pitches comprising the G major
scale in the 4th octave are added to the grid. Note that in order to
put the highest note on top, the first pitch is the `Sol` in `Octave
5`. From there, we use `-1` as the argument to the *Scalar step* block
inside the *Repeat*, working our way down to `Sol` in `Octave
4`. Another detail to note is the use of the *Mode length* block.

### <a name="rhythms"></a>4.3 Generating Rhythms

The *Rhythm Maker* block is used to launch a widget similar to the
*Phrase maker* block. The widget can be used to generate rhythmic
patterns.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm1.svg
 "generating rhythms")

The argument to the *Rhythm Maker* block specifies the duration that
will be subdivided to generate a rhythmic pattern. By default, it is 1
/ 1, e.g., a whole note.

The *Set Drum* blocks contained in the clamp of the *Rhythm Maker*
block indicates the number of rhythms to be defined simultaneously. By
default, two rhythm "rulers" are defined. The embedded *Rhythm* blocks define
the initial subdivision of each rhythm ruler.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm2.svg
 "rhythm maker")

When the *Rhythm Maker* block is clicked, the *Rhythm Maker* widget is
opened. It contains a row for each rhythm ruler. An input in the top
row of the widget is used to specify how many subdivisions will be
created within a cell when it is clicked. By default, 2 subdivisions
are created.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm3.svg
 "usage of rhythm maker")

As shown in the above figure, the top rhythm ruler has been divided
into two half-notes and the bottom rhythm ruler has been divided into
three third-notes. Clicking on the *Play* button to the left of each row
will playback the rhythm using a drum for each beat. The *Play-all*
button on the upper-left of the widget will play back all rhythms
simultaneously.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm4.svg
 "divide cells in rhythm maker")

The rhythm can be further subdivided by clicking in individual
cells. In the example above, two quarter-notes have been created by
clicking on one of the half-notes.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm8.svg
 "tie cells in Rhythm Maker")

By dragging across multiple cells, they become tied. In the example
above, two third-notes have been tied into one two-thirds-note.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm5.svg
 "save stack button")

The *Save stack* button will export rhythm stacks.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm6.svg
 "stacks of rhythms" )

These stacks of rhythms can be used to define rhythmic patterns used
with the *Phrase maker* block.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/rhythm7.svg
 "save drum machine button")

The *Save drum machine* button will export *Start* stacks that will
play the rhythms as drum machines.

Another feature of the *Rhythm Maker* wigdet is the ability to tap out
a rhythm. By clicking on the *Tap* button and then clicking on a cell
inside one of the rhythm rulers, you will be prompted (by four tones)
to begin tapping the mouse button to divide the cell into
sub-cells. Once the fourth tone has sounded, a progress bar will run
from left to right across the screen. Each click of the mouse will
define another beat within the cell. If you don't like your rhythm,
use the *Undo* button and try again.

### <a name="modes"></a>4.4 Musical Modes

Musical modes are used to specify the relationship between
[intervals](#INTERVALS-AND-ARTICULATION) (or steps) in a scale. Since
Western music is based on 12 half-steps per octave, modes speficy how
many half steps there are between each note in a scale.

By default, Music Blocks uses the *Major* mode, which, in the
[Key](#SETTING) of C, maps to the white keys on a piano. The intervals
in the *Major* mode are `2, 2, 1, 2, 2, 2, 1`. Many other common modes
are built into Music Blocks, including, of course, *Minor* mode, which
uses `2, 1, 2, 2, 1, 2, 2` as its intervals.

Note that not every mode uses 7 intervals per octave. For example, the
*Chromatic* mode uses 11 intervals: `1, 1, 1, 1, 1, 1, 1, 1, 1,
1, 1, 1`. The *Japanese* mode uses only 5 intervals: `1, 4,
2, 3, 2],`. What is important is that the sum of the intervals
in an octave is 12 half-steps.

The *Mode length* block will return the number of intervals (scalar
steps) in the current mode.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/mode1.svg
 "mode widget")

The *Mode* widget lets you explore modes and generate custom
modes. You invoke the widget with the *Custom mode* block. The mode
specified in the *Set key* block will be the default mode when the
widget launches.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/mode2.svg
 "launching widget with Major mode")

In the above example, the widget has been launched with *Major* mode
(the default). Note that the notes included in the mode are indicated
by the protuding sectors with 'X's, which are arrayed in a circular
pattern of tweleve half-steps to complete the octave.

Since the intervals in the *Major* mode are `2, 2, 1, 2, 2, 2, 1`, the
notes are `0`, `2`, `4`, `5`, `7`, `9`,`11`, and `12` (one octave
above `0`).

The widget controls run along the toolbar at the top. From left to
right are:

*Play all*, which will play a scale using the current mode;

*Save*, which will save the current mode as the *Custom* mode and save
a stack of *Pitch* blocks that can be used with the *Phrase Maker* block;

*Rotate counter-clockwise*, which will rotate the mode
counter-clockwise (See the example below);

*Rotate clockwise*, which will rotate the mode clockwise (See the
example below);

*Invert*, which will invert the mode (See the example below);

*Undo*, which will restore the mode to the previous version; and

*Close*, which will close the widget.

You can also click on individual notes to activate or deactivate them.

Note that the mode inside the *Custom mode* block is updated whenever
the mode is changed inside the widget.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/mode3.svg
 "creating Dorian mode")

In the above example, the *Major* mode has been rotated clockwise,
transforming it into *Dorian*.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/mode4.svg
 "creating Locrian mode")

In the above example, the *Major* mode has been rotated
counter-clockwise, transforming it into *Locrian*.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/mode5.svg
 "creating Phrygian mode")

In the above example, the *Major* mode has been inverted, transforming
it into *Phrygian*.

Note: The build-in modes in Music Blocks can be found in [musicutils.js](https://github.com/sugarlabs/musicblocks/blob/master/js/musicutils.js#L68).

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/mode6.svg
 "phrase maker block")

The *Save* button exports a stack of blocks representing the mode that
can be used inside the *Phrase maker* block.

### <a name="meters"></a>4.5 Meters

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/meter1.svg
 "meter widget block")

The *Meter Widget* block is used to explore strong and weak
beats. Launch the widget with the meter you want to explore. (In the
example, the meter is 4 beats per measure, where each beat is one
quarter note.)

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/meter2.svg
 "Meter Widget")

Inside the widget, you can click on a sector to indicate a strong
beat. (Clicking on the *X* will revert the beat to a weak beat.) In
the figure, the first and third beats are strong.

The *Play* button will play the beat, using a snare drum for strong
beats and a kick drum for weak beats.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/meter3.svg
 "on strong beat do blocks")

The *Save* button will export *On strong beat do* blocks for each strong beat.

Music Blocks has an internal "conductor" maintaining the beat. When
the Run button is clicked, the program begins and an internal master
(or "conductor") clock starts up. All of the music tries to stay
synced to that clock.

For example, if you have multiple voices (mice), they all share the
same conductor in order to keep on the same beat. If a voice (mouse)
is falling behind, Music Blocks tries to catch up on the next note by
truncating it. If it is an 1/8 note behind and the next note is a 1/2
note, then only an 3/8 note would be played, so as to catch up. That
is a somewhat extreme example—usually the timing errors are only very
very small differences. But in some situations, the timing errors can
be very large. This is when the No-clock block is used. A typical
problem is when the music is not played continuously.

Imagine an interactive game where a hero is battling a monster. Our
hero plays theme music whenever the monster is defeated. But that
might occur at any time, hence it is not going to be in sync with the
conductor. The offset could be tens of seconds. This would mean that
all of the notes in the theme music might be consumed by trying to
catch up with the conductor. The No-clock block essentially says, do
your own thing and don't worry about the conductor.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/f057d42544ff53dc3d71ee241b53bf6bff0ddf24/documentation/no-clock.svg
 "no clock")

### <a name="pitch-drum"></a>4.6 The Pitch-Drum Matrix

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum2.svg
 "Pitch-drum matrix")

The *Set Drum* block is used to map the enclosed pitches into drum
sounds. Drum sounds are played in a monopitch using the specified drum
sample. In the example above, a `kick drum` will be substitued for
each occurance of a `Re` `4`.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum8.svg
 "pitch-drum matrix 1")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum5.svg
 "table for pitch-drum matrix")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum6.svg
 "table for pitch-drum matrix")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/drum7.svg
 "pitch-drum matrix 1")

As an experience for creating mapping with the *Set Drum* block, we
provide the *Drum-Pitch* Matrix. You use it to map between pitches and
drums. The output is a stack of *Set Dum* blocks.

### <a name="stairs"></a>4.7 Exploring Musical Proportions

The *Pitch Staircase* block is used to launch a widget similar to the
*Phrase maker*, which can be used to generate different pitches
using a given pitch and musical proportion.

The *Pitch* blocks contained in the clamp of the *Pitch Staircase*
block define the pitches to be initialized simultaneously. By default,
one pitch is defined and it have default note "la" and octave "3".

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchstaircase0.svg
 "generating arbitrary pitches")

When *Pitch Staircase* block is clicked, the *Pitch Staircase* widget is
initialized. The widget contains row for every *Pitch* block contained
in the clamp of the *Pitch Staircase* block. The input fields in the top
row of the widget specify the musical proportions used to create new
pitches in the staircase. The inputs correspond to the numerator and
denominator in the proportion resectively. By default the proportion
is 3:2.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchstaircase1.svg
 "notes associated with the step in the stairs")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchstaircase2.svg
 "notes associated with the step in the stairs")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchstaircase3.svg
 "notes associated with the step in the stairs")

Clicking on the *Play* button to the left of each row will playback
the notes associated with that step in the stairs. The *Play-all*
button on the upper-left of the widget will play back all the pitch
steps simultaneously. A second *Play-all* button to the right of the
stair plays in increasing order of frequency first, then in 
decreasing order of frequency as well, completing a scale.

The *Save stack* button will export pitch stacks. For example, in the
above configuration, the output from pressing the *Save stack* button
is shown below:

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchstaircase4.svg
 "Pitch Stair block")

These stacks can be used with the *Phrase maker* block to define
the rows in the matrix.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchstaircase5.svg
 "Pitch Stair block")

### <a name="slider"></a>4.8 Generating Arbritary Pitches

The *Pitch Slider* block is used to launch a widget that is used to
generate arbitray pitches. It differs from the *Pitch Staircase*
widget in that it is used to create frequencies that vary continuously
within the range of a specified octave.

Each *Sine* block contained within the clamp of the *Pitch Slider* block defines the initial pitch
for an ocatve.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider0.svg
 "Pitch Slider")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider1.svg
 "Pitch Slider-One Column")

When the *Pitch Slider* block is clicked, the *Pitch Slider* widget is
initialized. The widget will have one column for each *Sine* block in
the clamp. Every column has a slider that can be used to move up or
down in frequency, continuously or in intervals of 1/12th of the
starting frequency. The mouse is used to move the frequency up and
down continuously. Buttons are used for intervals. Arrow keys can also
be used to move up and down, or between columns.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider0a.svg
 "Pitch Slider Block")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider2.svg
 "Pitch Slider-Two Column")

Clicking in a column will extact the corresponding *Note* blocks, for example:

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider3.svg
 "Pitch Slider-Two Columns Adjusting")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider4.svg
 " Pitch Slider block")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/pitchslider5.svg
 " Pitch Slider block")

### <a name="tempo"></a>4.9 Changing Tempo

The *Tempo* block is used to launch a widget that enables the user to
visualize Tempo, defined in beats per minute (BPM). When the *Tempo* block
is clicked, the *Tempo* widget is initialized.

The *Master Beats per Minute* block contained in the clamp of the
*Tempo* block sets the initial tempo used by the widget. This
determines the speed at which the ball in the widget moves back and
forth. If BPM is `60`, then it will take one second for the ball to move
across the widget. A round-trip would take two seconds.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/tempo0.svg
 "changing tempo")

The top row of the widget holds the *Play/pause* button, the *Speed
up* and *Slow down* buttons, and an input field for updating the
Tempo.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/tempo1.svg
 "changing tempo")

You can also update the tempo by clicking twice in spaced succession
in the widget: the new beats per minute (BPM) is determined as the
time between the two clicks. For example, if there is `1/2` second
between clicks, the new BPM will be set as `120`.

### <a name="timbre"></a>4.10 Custom Timbres

While Music Blocks comes with many built-in instruments, it is also
possible to create custom timbres with unique sound qualities.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre1.svg
 "the Timbre widget")

The *Timbre* block can be used to launch the *Timbre* widget, which
lets you add synthesizers, oscillators, effects, and filters to create
a custom timbre, which can be used in your Music Blocks programs.

The name of the custom timbre is defined by the argment passed to the
block (by default, `custom`). This name is passed to the *Set timbre*
block in order to use your custom timbre.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2.svg
 "the Timbre widget toolbar")

The *Timbre* widget has a number of different panels, each of which is
used to set the parameters of the components that define your custom
timbre.

From left to right:

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2a.svg
 "the play button")

* The *Play* button, which lets you test the sound quality of your
custom timbre. By default, it will play `Sol`, `Mi`, `Sol` using the
combination of filters you define.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre1a.svg
 "the notes inside Timbre block")

You can also put notes in the *Timbre* block to use for testing your
sound. In the example above, a scale will be used for the test.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2b.svg
 "the save button")

* The *Save* button, which will save your custom timbre for use in
your program.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre3.svg
 "select synth")

* The *Synth* button, which lets you choose between an AM synth, a PM
synth, or a Duo synth.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre4.svg
 "select osc")

* The *Oscillator* button, which lets you choose between a sine wave,
square wave, triangle wave, or sawtooth wave. You can also change
the number of partials.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre5.svg
 "set envelope")

* The *Envelope* button, which lets you change the shape of the sound
envelope, with controls for attack, decay, sustain, and release.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre6.svg
 "select effect")

* The *Effects* button, which lets you add effects to your custom
timbre: tremelo, vibrato, chorus, phaser, and distortion. When an
effect is selected, additional controls will appear in the widget.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre7.svg
 "select filter")

* The *Filter* button, which lets you choose between a number of
different filter types.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2c.svg
 "the add filter button")

* The *Add filter* button, which lets you add addition filters to your
custom timbre.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2d.svg
 "the undo button")

* The *Undo* button.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2e.svg
 "the close button")

* The *Close* button.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/timbre2f.svg
 "the drag handle")

* The *Drag* handle.

As you add synthesizers, effects, and filters with the widget, blocks
corresponding to your choices are added to the *Timbre* block. This
lets you reopen the widget to fine-tune your custom timbre.

### <a name="keyboard"></a>4.11 Music Keyboard

The Music Keyboard is used to generate notes by pressing keys of a virtual
keyboard.

When there are no *Pitch* blocks inside the widget clamp, a keyboard with
all keys between C4 and G5 is created.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/keyboard1.svg
 "keyboard block without clamp")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/keyboard2.svg
 "keyboard widget without clamp")

When there are *Pitch* blocks inside the widget clamp, a keyboard with
only those pitches is created.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/keyboard3.svg
 "keyboard block with pitch block in clamp")

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/keyboard4.svg
 "keyboard widget with pitch block in clamp")

Click on the keys to hear sounds. Click on the Play button to playback
all of the notes played. Click on the Save button to output code (a
series of *Note* blocks). The Clear button is used to delete all keys
pressed previously in order to start new.

###  <a name="temperament"></a>4.12 Changing Temperament

*Tempering* is the process of altering the size of an interval by
making it narrower or wider than pure. It is also possible to change
and create different tuning systems.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament1.svg
 "the Temperament block")

The *Temperament* block is used to launch a widget that enables the
user to visualize and edit notes within an octave.

You can select a temperament system from the pie menu which is passed
as an argument to the block. This name is passed to the *Set
temperament* block in order to play the notes in selected temperament
system. *Starting Pitch* is the argument of pitch block inside
temperament block. In the above example, starting pitch is `C4`.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament2.svg
 "the Temperament widget")

In the above example, selected temperament is *Just Intonation*. Notes
within an octave can be viewed in the form of circle. These circles
represent *pitch numbers*. Note that the pitches that are closer
together in selected temperament system are visually closer and
pitches that are farther apart looks farther.

The information regarding any note can be viewed by clicking on the
respective circle. In the above example, circle (pitch number) `2` is
`D4`. The frequency of note can be changed through edit button (left
hand side corner of note information popup).

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament3.svg
 "the Temperament widget")

Information regarding notes can also be viewed in the form of a
*table* as shown in the above example. The table will show all the
information about pitches that lie within an octave. This information
includes *pitch number*, *interval*, *ratio*, *note*, *frequency* and
*mode*.

The frequency of any note is calculated by `Starting Pitch Frequency`
x `Ratio`.

The widget controls are as follows:

The *Clear* button at the bottom of the widget will clear all pitches
except for a single `0` from which the user may add pitches.

The *Play all* button will play through all the pitches in an octave
and then it will play backwards down the pitches.

The *Save* button will save custom temperament for use in your
program. It will create a *set temperament* block. This block will
tune the notes attached to it according to the selected temperament.

The *Table* button is used to toggle between circular and tabular
representation of notes.

The *Add* button is used to edit notes through different tools:

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament4.svg
 "Equal Edit tool")

The `Equal` edit tool is used to make *equal divisions* between two
pitch numbers.  In the above example, two equal divisions are made
between pitch numbers `0` and `1` and the resultant number of notes
within an octave are changed from 12 to 13.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament4.svg
 "Ratio Edit tool")

The `Ratio` tool is used to add notes of specified ratios in such a
way that the resultant pitches wrap inside a single octave. Recursion
represents the number of times notes ratio calculation is repeated. In
the above example, 2 notes are added in pitch space and the resultant
number of notes within an octave are changed from 12 to 14. Frequency
of first pitch is (Starting Pitch Frequency) * (16/13) and second
pitch is (Starting Pitch Frequency) * (16/13)².

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament4.svg
 "Arbitrary Edit tool")

The `Arbitrary` edit tool is used to add a note in an arbitrary
position. In this panel, whenever the user hovers over the outer
circle, a frequency-slider window pops up, allowing the user to add a
note according to a chosen frequency. In the above example, a new note
will be added somewhere between pitch numbers `2` and `3` by adjusting
the frequency slider.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/temperament4.svg
 "Octave Space Edit tool")

The `Octave Space` tool is used to edit the octave ratio. The standard
octave space is 2:1. In the above example, octave space will be
changed to 3:1 after clicking on `Done`.

The *Drag* button will drag the widget.

The *Close* button will close the widget.

## <a name="BEYOND-MUSIC-BLOCKS"></a>Beyond Music Blocks

[Previous Section (4. Widgets)](#WIDGETS) | [Back to Table of Contents](#TOC)

Music Blocks is a waypoint, not a destination. One of the goals is to
point the learner towards other powerful tools. One such tool is
[Lilypond](http://lilypond.org), a music engraving program.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/lilypond1.svg
 "adding Save as Lilypond block")

The *Save as Lilypond* block will transcribe your composition. The
output of the program above is saved to `Downloads/hotdog.ly`. There is
also a *Save as Lilypond* button on the secondary toolbar.

Note that if you use a *Print* block inside of a note, Lilypond will
create a "markup" or annotation for that note. It is a simple way to
add lyrics to your score.

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/lilypond2.svg
 "Save as Lilypond icon")

```
\version "2.18.2"

mouse = {
c'8 c'8 c'8 c'8 c'4 c'4 g'8 g'8 g'8 g'8 g'4 g'4 a'8 a'8 a'8 a'8 a'4
a'4 g'8 g'8 g'8 g'8 g'4 g'4 f'8 f'8 f'8 f'8 f'4 f'4 e'8 e'8 e'8 e'8
e'4 e'4 d'8 d'8 d'8 d'8 d'4 d'4 c'8 c'8 c'8 c'8 c'4 c'4
}

\score {
<<
\new Staff = "treble" {
\clef "treble"
\set Staff.instrumentName = #"mouse" \mouse
}
>>
\layout { }
}
```

![alt
 tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide/hotdog.png
 "sheet music")

[RUN LIVE](https://musicblocks.sugarlabs.org/index.html?id=1523043053377623&run=True)

## <a name="APPENDIX_1"></a>Appendix: Palette Tables

[Previous Section (5. Beyond Music Blocks)](#BEYOND-MUSIC-BLOCKS) | [Back to Table of Contents](#TOC)

Looking for a block? The tables below (one for beginner mode and one for advanced mode) list the blocks by the palette where they are found.

### Beginner mode

| Music | | | Programming | | | Graphics | |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| _Palette_ | _Blocks_ | | _Palette_ | _Blocks_ | | _Palette_ | _Blocks_ |
| Rhythm | note | | Flow | repeat | | Graphics | forward |
| | note value drum | | | forever | | | back |
| | silence | | | if then | | | left 
| | tie | | | if then else | | | right |
| | note value | | | backward | | | set xy |
| Meter | meter | | Action | action | | | set heading |
| | beats per second | | | start | | | arc |
| | master beats per second | | | broadcast | | | scroll xy |
| | on every note do | | | on event do | | | x |
| | notes played | | | do | | | y |
| | beat count | | Boxes | store in box1 | | | heading |
| Pitch | pitch | | | box1 | | Pen | set color |
| | pitch G4 | | | store in box2 | | | set shade |
| | scalar step (+/-) | | | box2 | | | set pen size |
| | pitch number | | | store in | | | pen down |
| | hertz | | | box | | | pen up |
| | fourth | | | add | | | fill |
| | fifth | | | add 1 to | | | background |
| | pitch in hertz | | Number | number | | | color |
| | pitch number | | | random | | Media | print |
| | scalar change in pitch | | | one of this or that | | | text |
| | change in pitch | | | + | | | show |
| Interval | set key | | | - | | | avatar |
| | mode length | | | x | | | height |
| | movable do | | | / | | | width |
| | third | | Boolean | = | | | bottom (screen) |
| | sixth | | | < | | | top (screen) |
| | chord I | | | > | | | left (screen) |
| | chord IV | | | | | | right (screen) |
| | chord V | | | | | Sensors | mouse button |
| | set temperament | | | | | | cursor x |
| Tone | set instrument | | | | | | cursor y |
| | vibrato | | | | | | click |
| | chorus | | | | | | loudness |
| | termolo | | | | | Ensemble | set name |
| Ornament | staccato | | | | | | mouse name |
| | slur | | | | 
| | neighbor (+/-) | | | | 
| Volume | crescendo | | | | 
| | decrescendo | | | | 
| | set master volume | | | | 
| | set synth volume | | | | 
| | set drum volume | | | | 
| Drum | drum | | | | 
| | sound effect | | | | 
| | set drum | | | | 
| Widget | status | | | | 
| | phrase maker |
| | C major scale |
| | G major scale |
| | rhythm maker |
| | music keyboard |
| | pitch slider |
| | tempo |
| | custom mode |
| | rhythm |
| | simple tuplet |

### Advanced mode

| Music | | | Programming | | | Graphics | |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| _Palette_ | _Blocks_ | | _Palette_ | _Blocks_ | | _Palette_ | _Blocks_ |
| Rhythm | note value sol4 | | Flow | repeat | | Graphics | forward |
| | note value G4 | | | forever | | | back |
| | note value +1 | | | if then | | | left |
| | note value 5 4 | | | if then else | | | right |
| | note value 7 | | | while | | | set xy |
| | note value 392 hertz | | | until | | | set heading |
| | dot | | | wait for | | | arc |
| | multiplicity note value | | | stop | | | bezier |
| | skipnotes | | | switch | | | control point 1 |
| | swings | | | case | | | control point 2 |
| | milliseconds | | | default | | | clear |
| Meter | pickup | | | duplicate | | | scroll xy |
| | on strong beat | | | backward | | | x |
| | on weak beat do | | Action | action | | | y |
| | no clock | | | start | | | heading |
| | whole notes played | | | start drum | | Pen | set color |
| | note counter | | | broadcast | | | set grey |
| | measure count | | | on event do | | | set shade |
| | beat factor | | | do | | | set hue |
| | current meter | | | arg1 | | | set translucency |
| Pitch | scale degree | | | arg | | | set pen size |
| | sharp flat | | | calculate | | | pen down |
| | accidental | | | do | | | pen up |
| | unison | | | calculate | | | fill |
| | second | | | do | | | hollow line |
| | thirth | | | action | | | background |
| | sixth | | | calculate | | | set font |
| | seventh | | | return to URL | | | pen size |
| | down third | | | return | | | color |
| | down sixth | | Boxes | store in box1 | | | shade |
| | octave | | | box1 | | | grey |
| | semi-tone transpose | | | store in box2 | | | black |
| | register | | | box2 | | | white |
| | invert | | | store in | | | red |
| | sol | | | store in box | | | orange |
| | G | | | box | | | yellow |
| | sargam | | | box | | | green |
| | accidental | | | add | | | blue |
| | number of octave | | | add 1 to | | | purple |
| | number of pitch | | Number | number | | Media | text |
| | set pitch number offset | | | random | | | show |
| | MIDI | | | one of this or that | | | avatar |
| Intervals | current key | | | + | | | note to frequency |
| | current mode | | | - | | | hertz |
| | define mode | | | - | | | stop media |
| | scalar interval (+/-) | | | x | | | open file |
| | unison | | | / | | | height |
| | second | | | abs | | | width |
| | fourth | | | sqrt | | | bottom (screen) |
| | fifth | | | ^ | | | top (screen) |
| | seventh | | | mod | | | left (screen) |
| | down third | | | int | | | right (screen) |
| | down sixth | | Boolean | true | | Sensors | keyboard |
| | semi tone interval (+/-) | | | = | | | to ASCII |
| | major 2 | | | < | | | mouse bottom |
| | major 3 | | | > | | | cursor x |
| | major 6 | | | or | | | cursor y |
| | major 7 | | | and | | | time |
| | down major 3 | | | not | | | pixel color |
| | down major 6 | | Heap | push | | | red |
| | minor 2 | | | pop | | | green |
| | minor 3 | | | set heap | | | blue |
| | minor 6 | | | index heap | | | click |
| | minor 7 | | | reverse heap | | | loudness |
| | down minor 3 | | | load heap | | Ensemble | set name |
| | down minor 6 | | | save heap | | | mouse name |
| | perfect 4 | | | empty heap | | | new mouse |
| | perfect 5 | | | heap empty? | | | found mouse |
| | perfect 8 | | | heap length | | | mouse sync |
| | augmented 1 | | | show heap | | | mouse note value |
| | augmented 2 | | | save heap to App | | | mouse pitch number |
| | augmented 3 | | | load heap from App | | | mouse notes played |
| | augmented 4 | | Extras | print | | | mouse x |
| | augmented 5 | | | comment | | | mouse y |
| | augmented 6 | | | wait | | | set mouse |
| | augmented 7 | | | open project | | | mouse heading |
| | augmented 8 | | | hide blocks | | | mouse color |
| | diminished 2 | | | show blocks | | | start mouse |
| | diminished 3 | | | no background | | | stop mouse |
| | diminished 4 | | | make block | | | mouse index heap |
| | diminished 5 | | | connect blocks | 
| | diminished 6 | | | run blocks |
| | diminished 7 | | | move block |
| | diminished 8 | | | delete block |
| | scalar interval measure | | | open palette |
| | semi-tone interval measure | 
| | interval name |
| | doubly |
| | set temperament |
| Tone | set instrument |
| | voice name |
| | vibrato |
| | chorus |
| | phaser |
| | tremolo |
| | distrotion |
| | harmonic |
| | weighted partials |
| | partial |
| | FM synth |
| | AM synth |
| | duo synth |
| Ornament | staccato |
| | slur |
| | neighbor (+/-) |
| | neighbor (+/-) |
| Volume | crescendo |
| | decrescendo |
| | set relative volume |
| | set master volume |
| | set synth volume |
| | set drum volume |
| | fff |
| | ff |
| | f |
| | mf |
| | mp |
| | p |
| | pp |
| | ppp |
| | master volume |
| Drum | drum |
| | sound effect |
| | set drum |
| | map pitch to drum |
| | snare drum |
| | kick drum |
| | floor tom |
| | cup drum |
| | darbuka drum |
| | hi hat |
| | triangle drum |
| | finger cymbals |
| | ride bell |
| | cow bell |
| | crash |
| | slap |
| | clap |
| | clang |
| | chime |
| | bubbles |
| | bottle |
| | dog |
| | cricket |
| | cat |
| | duck |
| | noise |
| | effect |
| | drum |
| | noisename |
| | tom tom |
| Widget | status |
| | phrase maker |
| | C major scale |
| | G major scale |
| | rhythm maker |
| | pitch staircase |
| | music keyboard |
| | chromatic keyboard |
| | pitch slider |
| | pitch-drum maker |
| | tempo |
| | meter |
| | timbre |
| | temperament |
| | rhythm |
| | simple tuplet |
| | triplet |
| | quintuplet |
| | septuplet |
| | tuplet |
| | whole note |
| | half note |
| | quarter note |
| | eighth note |
| | 1/16 note |
| | 1/32 note | 
| | 1/64 note |
| | custom mode |

[Back to Table of Contents](#TOC)
