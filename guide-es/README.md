Guía de Programación con Bloques de Música
==========================================

Bloques de Música es un entorno de programación para lqs niños
interesados en música y gráficos. Se amplía la Tortugaarte en que
tiene una colección de funciones relacionadas con el tono y el ritmo.

La guía de la Tortugaarte es un buen lugar para comenzar a aprender
acerca de la lo esencial. En esta guía, se ilustran las
características de la música que recorren la lector a través de
numerosos ejemplos.

Empezando
---------

Bloques de Música está diseñado para ejecutarse en un navegador. La
mayor parte del desarrollo se ha hecho en Cromo, pero también debería
funcionar en Firefox. Se puede ejecutar desde [Bloques de Música]
(https://musicblocks.sugarlabs.org) o por la descarga de una
copia del código y se ejecuta directamente desde el archivo sistema de
su computadora.

Para más detalles sobre el uso de Bloques de Música, ver [Uso de
Bloques de Música]
(http://github.com/sugarlabs/musicblocks/tree/master/documentation)
y para más detalles sobre cómo utilizar los bloques de la tortuga, ver
[Uso de la tortuga bloques

ACERCA DE ESTA GUÍA
-------------------

Esta guía se divide en cuatro secciones: (i) una descripción general
de la *Nota* estructura; (ii) una guía de programación; (iii) los
widgets que proporcionan alguna andamio para el programador; y (iv)
una sección sobre la exportación de tu trabajar en otros sistemas de
música.

Muchos de los ejemplos dados en la guía tienen enlaces a código que puede
correr. Busque vínculos EJECUTAR EN VIVO.

I. NOTAS
--------

Bloques musicales expuestos los elementos comunes de la música: el
tono, el ritmo y la calidad de sonido, por ejemplo, el volumen y la
suavidad, y en cierto grado, timbre y la textura.

En el corazón de los bloques de música es el bloque de *Valores de
Nota*. El bloque de *Valores de Nota* es un contenedor para un campo
que especifica la duración (valor de nota) del terreno de juego. (El
bloque de *Tono* se detalla a continuación.)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/note1.svg " ")

En la parte superior del ejemplo anterior, un único *Valores de
Nota* es mostrado. El `1 / 8` es el valor de la nota, en este caso,
una corchea. los terreno de juego, a que el bloque de *Tono*, contiene
un lanzamiento, `La` en `4'Octave. En la parte inferior, dos notas que
se tocan son consecutivamente mostrado.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/note2.svg " ")

En este ejemplo, se muestran diferentes valores de las notas. De
arriba a abajo, `1 / 4'para un cuarto de nota,` 1 / 16` de una
semicorchea, y `1/2` por una media Nota.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/note3.svg " ")

Como hemos visto, bloques de *Tono* se utilizan dentro del bloques de
*Valor de la Nota*. El bloque *Tono* especifica un nombre de brea y
octava que en combinación determinar la frecuencia con la que se toca
una nota.

Puede conectar diferentes valores en el *Tono* nombre del bloque y
la octava ranuras. Algunos ejemplos se muestran arriba. A partir de la
parte superior, el terreno de juego nombre del bloque se especifica el
uso de un bloque de *Solfeo* ( `Sol` en `Octava 6`); el nombre de tono
se especifica el uso de un bloque *Tono-nombre* ( `B en flat`
`Octava 4`); el terreno de juego se especifica utilizando el bloque de
*Hertz* y una bloque de *Número* ( `440` Hertz).

La octava se especifica mediante un bloque de número y se limita a
todos los números. En el caso en que el nombre de pitch se especifica
por la frecuencia, la octava se ignora.

Tenga en cuenta que el nombre de tono también se puede especificar el
uso de un bloque de *Texto*.

También tenga en cuenta que cualquier operación matemática se puede
utilizar como entrada para el *Valor de Nota*.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/note4.svg " ")

Un acorde (múltiples, campos simultáneos) puede ser especificado por
complemento *Tono* múltiples bloques a un *valor de Nota* contenedor.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/silence.svg " ")

Un resto de valor de la nota duración se puede construir usando un
bloque de *Silencio*.


Using drums
-----------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum1.svg " ")

Anywhere you can use a *Pitch* block--e.g., inside of the matrix or a
*Note value* block--you can also specify a drum sample. Currently there
about two dozen different samples from which to choose. The default
drum is a kick drum.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/note5.svg " ")

Just as in the chord example above, you can use multiple *Drum* blocks
within a single *Note value* block and combine them with *Pitch*
blocks.

II. PROGRAMMING WITH MUSIC
--------------------------

This section of the guide discusses how to use chunks of notes to
program music. Note that you can program with chunks you create by
hand or use the *Pitch-time Matrix* widget described in Section III.

1. A chunk of notes
--------------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix4.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk1.svg " ")

Every time you create a new *Action* stack, Music Blocks creates a new
block specific to that stack. (The new block is found at the top of
the *Block* palette, found on the left edge of the screen.) Clicking
on this block is the same as clicking on your stack. By default, the
new blocks are named `chunk`, `chunk1`, `chunk2`... but you can rename
them by editing the labels on the *Action* blocks.

In the example above, the *Chunk* block is inside of a *Start* block,
which ties it to the *Run* button in the upper-left corner of the
screen (the "rabbit"). Try clicking on the *Run* button. Also try the
*Run Slow* button (the "turtle") and the *Step* button (the "snail"),
which steps through the program one block per button press. There are
also buttons for playing the music back slowly and for stepping one
note per button press.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk2.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk3.svg " ")

You can repeat chunks either by using multiple *Chunk* blocks or using a
*Repeat* block.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk4.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk5.svg " ")

You can also mix and match chunks. Here we play chunk, followed by
chunk1 twice, and then chunk again.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk6.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/chunk7.svg " ")

A few more chunks and we can make a song. (Can you read the block
notation in order to guess what song we've programmed?)

2. Transformations
------------------

There are many ways to transform pitch, rhythm, and other qualities of
the sound.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform0.svg " ")

The *Step Pitch* block will move up or down notes in a scale from the
current note. In the example above, *Step Pitch* blocks are used inside
of *Repeat* blocks to play up and down a scale.

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523032034365533&run=True)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform1.svg " ")

The *Sharp* and *Flat* blocks can be wrapped around *Pitch*
blocks, *Note value* blocks, or chunks. A sharp will raise the pitch by
one half step. A flat will lower by one half step. In the example, on
the left, just the *Pitch* block `Mi` is lowered by one half step;
on the right, both pitch blocks are raised by one half step.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform2.svg " ")

The *Adjust-transposition* block can be used to make larger shifts in
pitch. To shift an entire octave, transpose by 12 half-steps up. -12
will shift an octave down.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform3.svg " ")

In the example above, we take the song we programmed previously and
raise it by one octave.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform4.svg " ")

You can "dot" notes using the *Dot* block. A dotted note extends by
50%. E.g., a dotted quarter note will play for 3/8 (1/4 + 1/8) of a
beat. A dotted eighth note will play for 3/16 (1/8 + 1/16) of a beat.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform5.svg " ")

You can also multiply (or divide) the beat value, which will speed up
or slowdown the notes. Multiplying the beat value of an `1/8` note by
`2` is the equivalent of playing a `1/16` note. Dividing the beat
value of an `1/8` note by '2' is the equivalent of playing a `1/4`
note.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform6.svg " ")

There are several ways to repeat notes. The *Repeat* block will play a
sequence of notes multiple times; the *Duplicate* block will repeat each
note in a sequence.

In the example, on the left, the result would be `Sol, Re, Sol, Sol,
Re, Sol, Sol, Re, Sol, Sol, Re, Sol`; on the right the result would be
`Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol`.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform7.svg " ")

The *Swing* block works on pairs of notes (specified by note value),
adding some duration (specified by swing value) to the first note and
taking the same amount from the second note. Notes that do not match
note value are unchanged.

In the example, `re5` would be played as a `1/6` note and `me5` would
be played as a `1/12` note (`1/8 + 1/24 === 1/6' and `1/8 - 1/24 ===
1/12`). Observe that the total duration of the pair of notes is
unchanged.

Tie also works on pairs of notes, combining them into one note. (The
notes must be identical in pitch, but can vary in rhythm.)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform8.svg " ")

The *Set volume* block will change the volume of the notes. The
default is 50; the range is 0 (silence) to 100 (full volume).

The *Crescendo* block will increase (or decrease) the volume of the
contained notes by an amount specified.

The *Staccato* block will play back notes in tight bursts while
maintaining the specified rhymic value of the notes.

The *Slur* block will run a note past its noted duration, blending
it into the next note.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform9.svg " ")

The *Interval* block calculates a relative interval, e.g., a fifth, and adds
the additional pitches to a note. In the figure, we add `Sol` to `Do` and
`Do` to `Fa`.

The *Articulation* block changes the volume of a group of notes.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform14.svg " ")

The *Augmented* block calculates an absolute interval, e.g., an
augmented fifth, and adds the additional pitches to a note. Similarly,
the *Minor* block calculates an absolute interval, e.g., a minor
third. Other absolute intervals include *Perfect*, *Diminished*, and
*Major*.

In the augmented fifth example above, a chord of D5 and A5 are played,
followed by a chord of E5 and C5. In the minor third example, which
includes a shift of one octave, first a chord of D5 and F5 is played,
followed by chord of E5 and G6.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform13.svg " ")

The *Invert* block will invert a series of notes around a target
note. There are two different versions of the *Invert* block: *odd*
and *even*, the latter shifts the point of rotation up by a `1/4`
step, enabling rotation around a point between two notes.

In the *invert (even)* example, `D4` is inverted around `G4`,
resulting in a `C5`. In the *invert (odd)* example, `D4` is inverted
around a point midway between `G4` and `G♯4` resulting in a `C♯5`

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform11.svg " ")

The *Backward* block will play the contained notes in reverse order
(retrograde). In the example above, the notes in *Chunk* are played as
`Sol`, `Ti`, `La`, `Sol`, i.e., from the bottom to the top of the
stack.

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1522885752309944&run=True)

Note that all of the blocks inside a *Backward* block are reverse, so
use this feature with caution if you include logic intermixed with
notes.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform12.svg " ")

The *Set Voice* block selected a voice for the synthesizer for any
contained blocks, e.g., violin or cello.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/transform10.svg " ")

The *Set Key* block will change the key and mode of the mapping
between solfege, e.g., `Do`, `Re`, `Mi`, to note names, e.g., `C`,
`D`, `E`, when in C Major. Modes include Major and Minor, Chromatic,
and a number of more exotic modes, such as Bebop, Geez, Maqam, et al.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum4.svg " ")

In the above example, the sequence of drum beats is increased over time.

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523106271018484&run=True)

3. Voices
---------

Each *Start* block runs as a separate voice in Music Blocks. (When
you click on the Run button, all of the *Start* blocks are run
concurrently.)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/voices1.svg " ")

If we put our song into an action...

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/voices2.svg " ")

...we can run it from multiple *Start* blocks.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/voices3.svg " ")

It gets more interesting if we shift up and down octaves.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/voices4.svg " ")

And even more interesting if we bring the various voices offset in time.

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523026536194324&run=True)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum3.svg " ")

A special "drum" version of the *Start* block is available for laying
down a drum track. Any pitch blocks encounted while starting from a
drum will be played as `C2` with the default drum sample. In the
example above, all of the notes in `chunk` will be played with a kick
drum.

4. Adding graphics
------------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/graphics1.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/graphics2.png " ")

Turtle graphics can be combined with the music blocks. By placing
graphics blocks, e.g., *Forward* and *Right*, inside of *Note value*
blocks, the graphics stay in sync with the music. In this example, the
turtle moves forward each time a quarter note is played. It turns
right during the eighth note. The pitch is raised by one half step,
the pen size decreases, and the pen color increases at each step in
the inner repeat loop.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/graphics3.svg " ")

In this example, the graphics are synchronized to the music by placing
the graphics commands inside of *Note value* blocks.

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523106271018484&run=True)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/fibonacci3.svg " ")

In this example, because the computation and graphics are more
complex, a *Free-time* block is used to decouple the graphics from
the master clock.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/graphics4.png " ")

5. Interaction
--------------

There are many ways to interactive with Music Blocks, including
tracking the mouse position to impact some aspect of the music.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/interactive.svg " ")

For example, we can launch the phrases (chunks) interactively. When
the mouse is in the lower-left quadrant, `chunk` is played;
lower-right quadrant, `chunk1`; upper-left quadrant, `chunk2`; and
upper-right quadrant, `chunk3`.

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523028011868930&run=True)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/interactive2.svg " ")

In the example above, a simple two-key piano is created by associating
*click* events on two different turtles with individual notes. Can you
make an 8-key piano?

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523107390715125&run=True)

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/interactive3.svg " ")

You can also add a bit of randomness to your music. In the top example
above, the *One-of* block is used to randomly assign either `Do` or
`Re` each time the *Note value* block is played. In the bottom example
above, the *One-of* block is used to randomly select between `chunk1`
and `chunk2`.

III. WIDGETS
------------

1. Status
---------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/status1.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/status2.svg " ")

The *Status widget* is a tool for inspecting the status of Music
Blocks as it is running. By default, the key, BPM, and volume are
displayed. Also, each note is displayed as it is played. There is one
row per voice in the status table.

Additional *Print* blocks can be added to the *Status* widget to
display additional music factors, e.g., duplicate, transposition,
skip, staccato, slur, and graphics factors, e.g., x, y, heading,
color, shade, grey, and pensize.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/status3.svg " ")

You can do additional programming within the status block. In the
example above, the volume is divided by 10 before being displayed.

2. The Pitch-Time Matrix
------------------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix1.svg " ")

Music Blocks provides a widget, the *Pitch-time Matrix*, as a scaffold
for getting started.

Once you've launched Music Blocks in your browser, start by clicking
on the *Pitch-time Matrix* stack that appears in the middle of the
screen. (For the moment, ignore the *Start* block.) You'll see a grid
organized vertically by pitch and horizontally by rhythm.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix2.svg " ")

The matrix in the figure above has three *Pitch* blocks and one
*Rhythm* block, which is used to create a 3 x 3 grid of pitch and
time.

Note that the default matrix has five *Pitch* blocks, hence, you will
see five rows, one for each pitch. (A sixth row at the bottom is used
for specifying the rhythms associated with each note.) Also by
default, there are two *Rhythm* blocks, which specifies six quarter
notes followed by one half note. Since the *Rhythm* blocks are inside
of a *Repeat* block, there are fourteen (2 x 7) columns for selecting
notes.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix3.svg " ")

By clicking on individual cells in the grid, you should hear
individual notes (or chords if you click on more than one cell in a
column). In the figure, three quarter notes are selected (black
cells). First `Re 4`, followed by `Mi 4`, followed by `Sol 4`.

<img
src='https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/play-button.svg'
height="36"</img>

If you click on the *Play* button (found in the top row of the grid),
you will hear a sequence of notes played (from left to right): `Re 4`,
`Mi 4`, `Sol 4`.

<img
src='https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/export-chunk.svg'
height="36"</img>

Once you have a group of notes (a "chunk") that you like, click on the
*Save* button (just to the right of the *Play* button). This will
create a stack of blocks that can used to play these same notes
programmatically. (More on that below.)

You can rearrange the selected notes in the grid and safe other chunks
as well.

<img
src='https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/sort.svg'
height="36"</img>

The *Sort* button will reorder the pitches in the matrix from highest
to lowest and eliminate any duplicate *Pitch* blocks.

<img
src='https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/close-button.svg'
height="36"</img>

Or hide the matrix by clicking on the *Close* button (the right-most
button in the top row of the grid.)

<img
src='https://rawgithub.com/sugarlabs/musicblocks/master/header-icons/erase-button.svg'
height="36"</img>

There is also an Erase button that will clear the grid.

Don't worry. You can reopen the matrix at anytime (it will remember
its previous state) and since you can define as many chunks as you
want, feel free to experiment.

Tip: You can put a chunk inside a *Pitch-time Matrix* block to generate
the matrix to corresponds to that chunk.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix4.svg " ")

The chunk created when you click on the matrix is a stack of
blocks. The blocks are nested: an *Action* block contains three *Note value*
blocks, each of which contains a *Pitch* block. The *Action* block has a
name automatically generated by the matrix, in this case, chunk. (You
can rename the action by clicking on the name.). Each note has a
duration (in this case 4, which represents a quarter note). Try
putting different numbers in and see (hear) what happens. Each note
block also has a pitch block (if it were a chord, there would be
multiple *Pitch* blocks nested inside the Note block's clamp). Each
pitch block has a pitch name (`Re`, `Mi`, and `Sol`), and a pitch octave; in
this example, the octave is 4 for each pitch. (Try changing the pitch
names and the pitch octaves.)

To play the chuck, simply click on the action block (on the word
action). You should hear the notes play, ordered from top to bottom.

About the Rhythm Block
----------------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix6.svg " ")

*Rhythm* blocks are used to generate rhythm patterns in the
*Pitch-time Matrix* block. The top argument to the *Rhythm* block
*is the number of notes. The bottom argument is the duration of the
*note. In the top example above, three columns for quarter notes
*would be generated in the matrix. In the middle example, one column
*for an eighth note would be generated. In the bottom example, seven
*columns for 16th notes would be generated.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix7.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix8.svg " ")

You can use as many *Rhythm* blocks as you'd like inside the
*Pitch-time Matrix* block. In the above example, two *Rhythm*
blocks are used, resulting in three quarter notes and six eighth
notes.

Creating Tuplets
----------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix9.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix10.svg " ")

Tuplets are a collection of notes that get scaled to a specific
duration. Using tuplets makes it easy to create groups of notes that
are not based on a power of 2. In the example above, three quarter
notes--defined in the *Rhythm* block--are played in the time of a
single quarter note. The result is three twelfth notes.

You can mix and match *Rhythm* blocks and *Tuplet* blocks when
defining your matrix.

Using individual notes in the matrix
------------------------------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/matrix11.svg " ")

You can also use individual notes when defining the grid. These blocks
will expand into *Rhythm* blocks with corresponding values.

3. Generating Rhythms
---------------------

The *Rhythm Ruler* block is used to launch a widget similar to the
*Pitch-time Matrix* block, which can be used to generate rhythmic
patterns.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm1.svg " ")

The argument to the *Rhythm Ruler* block specifies the duration that
will be subdivided to generate a rhythmic pattern. By default, it is 1
/ 1, e.g., a whole note.

The *Set Drum* blocks contained in the clamp of the *Rhythm Ruler*
block define the number of rhythms to be defined simultaneously. By
default, two rhythms are defined. The embedded *Rhythm* blocks define
the initial subdivision of the of each rhythm ruler.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm2.svg " ")

When the *Rhythm Ruler* block is clicked, the *Rhythm Ruler* widget is
opened. It contains a row for each rhythm ruler. An input in the top
row of the widget is used to specify how many subdivisions will be
created within a cell when it is clicked. By default, 2 subdivisions
are created.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm3.svg " ")

As shown in the above figure, the top rhythm ruler has been divided
into two half-notes and the bottom rhythm ruler has been divided into
three third-notes. Clicking on the *Play* button to the left of each row
will playback the rhythm using a drum for each beat. The *Play-all*
button on the upper-left of the widget will play back all rhythms
simultaneously.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm4.svg " ")

The rhythm can be further subdivided by clicking in individual
cells. In the example above, two quarter-notes have been created by
clicking on one of the half-notes.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm5.svg " ")

The *Save stack* button will export rhythm stacks.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm6.svg " ")

These stacks of rhythms can be used to define rhythmic patterns used
with the *Pitch-time Matrix* block.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/rhythm7.svg " ")

The *Save drum machine* button will export *Start* stacks that will
play the rhythms as drum machines.

4. Musical Modes
----------------

Musical modes are used to specify the relationship between intervals
(or steps) in a scale. Since Western music is based on 12 half-steps
per octave, modes speficy how many half steps there are between each
note in a scale.

By default, Music Blocks uses the *Major* mode, which, in the Key of
C, maps to the white keys on a piano. The intervals in the *Major*
mode are `2, 2, 1, 2, 2, 2, 1`. Many other common modes are
built into Music Blocks, including, of course, *Minor* mode, which
uses `2, 1, 2, 2, 1, 2, 2` as its intervals.

Note that not every mode uses 7 intervals per octave. For example, the
*Chromatic* mode uses 11 intervals: `1, 1, 1, 1, 1, 1, 1, 1, 1,
1, 1, 1`. The *Japanese* mode uses only 5 intervals: `1, 4,
2, 3, 2],`. What is important is that the sum of the intervals
in an octave is 12 half-steps.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/mode1.svg " ")

The *Mode* widget lets you explore modes and generate custom
modes. You invoke the widget with the *Custom mode* block. The mode
specified in the *Set key* block will be the default mode when the
widget launches.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/mode2.svg " ")

In the above example, the widget has been launched with *Major* mode
(the default). Note that the notes included the mode are indicated by
the black boxes, which are arrayed in a circular pattern of tweleve
half-steps to complete the octave.

Since the intervals in the *Major* mode are `2, 2, 1, 2, 2, 2, 1`, the
notes are `0`, `2`, `4`, `5`, `7`, `9`,`11`, and `12` (one octave
above `0`).

The widget controls run along the toolbar at the top. From left to
right are:

*Play all*, which will play a scale using the current mode;

*Save*, which will save the current mode as the *Custom* mode and save
 a stack of *Pitch* blocks that can be used with the *Pitch-time
 Matrix* block;

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

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/mode3.svg " ")

In the above example, the *Major* mode has been rotated clockwise,
transforming it into *Dorian*.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/mode4.svg " ")

In the above example, the *Major* mode has been rotated
counter-clockwise, transforming it into *Locrian*.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/mode5.svg " ")

In the above example, the *Major* mode has been inverted, transforming
it into *Phrygian*.

Note: The build-in modes in Music Blocks can be found in (musicutils.js)[https://github.com/sugarlabs/musicblocks/blob/master/js/musicutils.js#L68].

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/mode6.svg " ")

The *Save* button exports a stack of blocks representing the mode that
can be used inside the *Pitch-time Matrix* block.

5. The Pitch-Drum Matrix
------------------------

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum2.svg " ")

The *Set Drum* block is used to map the enclosed pitches into drum
sounds. Drum sounds are played in a monopitch using the specified drum
sample. In the example above, a `kick drum` will be substitued for
each occurance of a `Re` `4`.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum8.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum5.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum6.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/drum7.svg " ")

As an expedience for creating mapping with the *Set Drum* block, we
provide the *Drum-Pitch* Matrix. You use it to map between pitches and
drums. The output is a stack of *Set Dum* blocks.

6. Generating Pitches using Musical Proportions
-----------------------------------------------

The *Pitch Staircase* block is used to launch a widget similar to the
*Pitch-time Matrix*, which can be used to generate different pitches
using a given pitch and musical proportion.

The *Pitch* blocks contained in the clamp of the *Pitch Staircase*
block define the pitches to be initialized simultaneously. By default,
one pitch is defined and it have default note "la" and octave "3".

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchstaircase0.svg " ")

When *Pitch Staircase* block is clicked, *Pitch Staircase* widget is
initialized. The widget contains row for every *Pitch* block contained
in the clamp of the *Pitch Staircase* block. Input fields in the top
row of the widget specify the musical proportion to used to create new
pitches in the staircase. The inputs correspond to the numerator and
denominator in the proportion resectively. By default the proportion
is 3:2.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchstaircase1.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchstaircase2.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchstaircase3.svg " ")

Clicking on the *Play* button to the left of each row will playback
the note associated with that step in the stairs. The *Play-all*
button on the upper-left of the widget will play back all the pitch
steps simultaneously. A second *Play-all* button to its right the
stair first in increasing order of the frequency and than in the
decreasing order of the frequency.

The *Save stack* button will export pitch stacks. For example, in the
configuration, the output is as shown below:

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchstaircase4.svg " ")

These stacks can be used with the *Pitch-tim Matrix* block to define
the rows in the matrix.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchstaircase5.svg " ")

7. Understanding Tempo
----------------------

The *Tempo* block is used to launch a widget that enables us to
visualize Tempo, defined as beats per minute (BPM). When *Tempo* block
is clicked, the *Tempo* widget is initialized.

The *Master Beats per Minute* block contained in the clamp of the
*Tempo* block sets the initial tempo used by the widget. This
determines the speed at which the ball in the widget moves back and
forth. If BPM is 60, then it will take one second for the ball to move
across the widget. A round-trip would take two seconds.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/tempo0.svg " ")

The top row of the widget holds the *Play/pause* button, the *Speed
up* and *Slow down* buttons, and an input field for updating the
Tempo.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/tempo1.svg " ")

You can also update the tempo by clicking twice in succession in the
widget: the new BPM is determined from the time between clicks. For
example, if there 1/2 second between clicks, the new BPM is 120.

8. Creating Pitches with continuously varying frequencies
---------------------------------------------------------

The *Pitch Slider* block is used to launch a widget that is used to
generate arbitray pitches. It differs from *Pitch Staircase* widget in
that it is used to create frequencies that vary continuously within
the range of a specified octave.

Each *Sine* block contained within the clamp of the *Pitch Slider* block defines the initial pitch
for an ocatve.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider0.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider1.svg " ")

When the *Pitch Slider* block is clicked, the *Pitch Slider* widget is
initialized. The widget will have one column for each *Sine* block in
the clamp. Every column has a slider that can be used to move go up or
down in frequency, continuously or in intervals of 1/12th of the
starting frequency. For continuous case mouse is used. Buttons are
used for intervals. Arrow keys can also be used to move up and down,
or between columns.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider0a.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider2.svg " ")

CLicking in a column will extact corresponding *Note* blocks, for example:

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider3.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider4.svg " ")

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/pitchslider5.svg " ")

IV. BEYOND MUSIC BLOCKS
-----------------------

Music Blocks is a waypoint, not a destination. One of the goals is to
point the learner towards other powerful tools. One such tool is
[Lilypond](http://lilypond.org), a music engraving program.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/lilypond1.svg " ")

The *Save as Lilypond* block will transcribe your composition. The
output of the program above is saved to `Downloads/hotdog.ly`. There is
also a *Save as Lilypond* button on the secondary toolbar.

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/lilypond2.svg " ")

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

![alt tag](https://rawgithub.com/sugarlabs/musicblocks/master/guide-es/hotdog.png " ")

[EJECUTAR EN VIVO](https://musicblocks.sugarlabs.org/index.html?id=1523043053377623&run=True)
