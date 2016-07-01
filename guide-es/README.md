Guide to Programming with Music Blocks
======================================

Music Blocks is a programming environment for children interested in
music and graphics. It expands upon Turtle Blocks in that it has a
collection of features relating to pitch and rhythm.

The Turtle Blocks guide is a good place to start learning about the
basics. In this guide, we illustrate the music features walking the
reader through numerous examples.

Getting Started
---------------

Music Blocks is designed to run in a browser. Most of the development
has been done in Chrome, but it should also work in Firefox (although
you may need to disable hardware acceleration). You can run it from
[github io](http://walterbender.github.io/musicblocks) or by
downloading a copy of the code and running directly from the file
system of your computer.

For more details on how to use Music Blocks, see [Using Music
Blocks](http://github.com/walterbender/musicblocks/tree/master/documentation)
and for more details on how to use Turtle Blocks, see [Using Turtle
Blocks
JS](http://github.com/walterbender/turtleblocksjs/tree/master/documentation).

ABOUT THIS GUIDE
----------------

Many of the examples given in the guide have links to code you can
run. Look for EJECUTAR EN VIVO links.

NOTES
-----

Music Blocks exposed the common elements of music: pitch, rhythm, and
sonic quality, e.g., loudness and softness, and to some degree, timbre
and texture.

At the heart of Music Blocks is the *Note value* block. The *Note
value* block is a container for a pitch that specifies the duration
(note value) of the pitch. (The *Pitch* block is detailed below.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/note1.svg'</img>

Se muestra un bloque *Valor de la Nota*. El 4 es el valor de la nota, en
este caso, una quarter note. El tono, especificado por el bloque *Tono*,
contiene un tono Re en la octava 4.

Un acorde (tonos múltiples y simultáneos) puede especificarse
agregando múltiples bloques *Tono* a un bloque *Valor de Nota*.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/note2.svg'</img>

In this example, different note values are shown. From top to bottom,
`8` for an eighth note, `16` for a sixteenth note, and `2` for a half
note.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/note3.svg'</img>

As we have seen, *Pitch* blocks are used inside the *Note value*
blocks. The *Pitch* block specifies a pitch name and pitch octave that
in combination determine the frequency at which a note is played.

You can plug different values into the *Pitch* block name and octave
slots. Some examples are shown above. Starting from the top, the pitch
name block is specified using a *Solfege* block (`Sol` in `Octave 6`);
the pitch name is specified using a *Ppppppitch-name* block (`B flat` in
`Octave 4`); the pitch name is specified using a *Number* block (`440`
Hertz).

The octave is specified using a number block and is restricted to
whole numbers. In the case where the pitch name is specified by
frequency, the octave is ignored.

Note that the pitch name can also be specified using a *Text* block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/note4.svg'</img>

A chord (multiple, simultaneous pitches) can be specified by add
multiple *Pitch* blocks to a *Note value* container.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/silence.svg'</img>

A rest of duration note value can be constructed using a *Silence* block.

Using drums
-----------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum1.svg'</img>

Anywhere you can use a *Pitch* block--e.g., inside of the matrix or a
*Note value* block--you can also specify a drum sample. Currently there
about two dozen different samples from which to choose. The default
drum is a kick drum.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/note5.svg'</img>

Al igual que en el ejemplo del acorde, se pueden usar múltiples
bloques *Tambor* y combinarlos con bloques *Tono*.

THE PITCH-TIME MATRIX
---------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix1.svg'</img>

Music Blocks provides a widget, the *Pitch-time Matrix*, as a scaffold
for getting started.

Once you've launched Music Blocks in your browser, start by clicking
on the *Pitch-time Matrix* stack that appears in the middle of the
screen. (For the moment, ignore the *Start* block.) You'll see a grid
organized vertically by pitch and horizontally by rhythm.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix2.svg'</img>

El bloque *Matriz de Tono en Tiempo* de la figura tiene tres bloques
*Tono* y un bloque *Ritmo*, a partir de los cuales se crea una grilla 3x3
de tono y tiempo.

Note that the default matrix has five *Pitch* blocks, hence, you will
see five rows, one for each pitch. (A sixth row at the bottom is used
for specifying the rhythms associated with each note.) Also by
default, there are two *Rhythm* blocks, which specifies six quarter
notes followed by one half note. Since the *Rhythm* blocks are inside
of a *Repeat* block, there are fourteen (2 x 7) columns for selecting
notes.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix3.svg'</img>

Al hacer clic en cada celda de la grilla se reproducen notas
individuales o acordes si se hace clic en más de una celda por
columna.

In the figure, three quarter notes are selected (black
cells). First `Re 4`, followed by `Mi 4`, followed by `Sol 4`.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg'
height="36"</img>

If you click on the *Play* button (found in the top row of the grid),
you will hear a sequence of notes played (from left to right): `Re 4`,
`Mi 4`, `Sol 4`.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/export-chunk.svg'
height="36"</img>

Se puede guardar un grupo de notas (una “colección”). Esto creará una
pila de bloques que pueden usarse para tocar las notas almacenadas.

You can rearrange the selected notes in the grid and safe other chunks
as well.

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg'
height="36"</img>

Or hide the matrix by clicking on the *Close* button (the right-most
button in the top row of the grid.)

<img
src='https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg'
height="36"</img>

There is also an Erase button that will clear the grid.

Don't worry. You can reopen the matrix at anytime (it will remember
its previous state) and since you can define as many chunks as you
want, feel free to experiment.

Tip: You can put a chunk inside a *Pitch-time Matrix* block to generate
the matrix to corresponds to that chunk.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix4.svg'</img>

La colección creada cuando se hace clic en la matriz es una pila de
bloques. Estos están anidados: un bloque de *Acción* contiene tres
bloques de *Valor de la Nota*, cada uno de los cuales tiene un bloque
de *Tono*.

 The *Action* block has a name automatically generated by the matrix,
in this case, chunk. (You can rename the action by clicking on the
name.). Each note has a duration (in this case 4, which represents a
quarter note). Try putting different numbers in and see (hear) what
happens. Each note block also has a pitch block (if it were a chord,
there would be multiple *Pitch* blocks nested inside the Note block's
clamp). Each pitch block has a pitch name (`Re`, `Mi`, and `Sol`), and
a pitch octave; in this example, the octave is 4 for each pitch. (Try
changing the pitch names and the pitch octaves.)

To play the chuck, simply click on the action block (on the word
action). You should hear the notes play, ordered from top to bottom.

About the Rhythm Block
----------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix6.svg'</img>

*Rhythm* blocks are used to generate rhythm patterns in the
*Pitch-time Matrix* block. The top argument to the *Rhythm* block
*is the number of notes. The bottom argument is the duration of the
*note. In the top example above, three columns for quarter notes
*would be generated in the matrix. In the middle example, one column
*for an eighth note would be generated. In the bottom example, seven
*columns for 16th notes would be generated.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix7.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix8.svg'</img>

Puedes usar tantos bloques *Ritmo* como quieras dentro del bloque *Matriz
de Tono en Tiempo*. En el ejemplo se usan dos bloques *Ritmo*, lo que da
como resultado tres quarter notes and six eighth notes.

Creating Tuplets
----------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix9.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix10.svg'</img>

Tuplets son una colección de notas que son ajustadas a una duración
específica. El uso de tuplets facilitan la creción de grupos de notas
que no están basadas en potencias de 2.

En el ejemplo, tres quarter notes, definidas en el bloque *Ritmo*,
suenan en el tiempo de una sola quarter note. El resultado es tres
twelfth notes.

Se pueden mezclas y combinar los bloques de *Ritmo* y *Tuplet* al
definir la matriz.

Using individual notes in the matrix
------------------------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix11.svg'</img>

You can also use individual notes when defining the grid. These blocks
will expand into *Rhythm* blocks with corresponding values.

PROGRAMMING WITH MUSIC
----------------------

The remainder of this guide discusses how to use the chunks created by
the *Pitch-time Matrix* when programming (You can also program with
chunks you create and/or modify by hand).

1. A chunk of notes
--------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/matrix4.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk1.svg'</img>

Every time you create a new *Action* stack, Music Blocks creates a new
block specific to that stack. (The new block is found at the top of
the *Block* palette, found on the left edge of the screen.) Clicking
on this block is the same as clicking on your stack. By default, the
new blocks are named `colección`, `colección1`, `colección2`... but
you can rename them by editing the labels on the *Action* blocks.

En el ejemplo el bloque *Colección* está dentro de un bloque
*Iniciar*, lo que vincula su ejecución al botor *Ejecutar* (ícono de
conejo). Haz clic en el botón *Ejecutar*. Prueba también los botones
*Ejecutar Lento* (ícono de tortuga) y *Ejecutar paso a paso* (ícono de
caracol).

También hay botones para reproducir lentamente la música y para
avanzar una nota por clic.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk2.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk3.svg'</img>

You can repeat chunks either by using multiple *Chunk* blocks or using a
*Repeat* block.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk4.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk5.svg'</img>

Es posible combinar y mezclar Colecciones.

Here we play chunk, followed by chunk1 twice, and then chunk again.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk6.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/chunk7.svg'</img>

Agregando algunas colecciones podemos crear una canción. ¿Puedes leer
la notación de bloques y adivinar la canción que hemos programado?

2. Transformations
------------------

There are many ways to transform pitch, rhythm, and other qualities of
the sound.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform0.svg'</img>

El bloque *Paso el Tono* moverá las notas hacia arriba o hacia abajo
en una escala a partir de la nota actual En el ejemplo, bloques *Paso
el Tono* se usan dentro de bloques *Repetir* para tocar una escala
hacia arriba y hacia abajo.

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_scales.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform1.svg'</img>

Los bloques *Agudas* y *Planas* pueden contener bloques *Tono*, *Valor
de la Nota* o colecciones.

Un bloque *Agudas* va a aumentar el tono en medio paso. Un bloque
*Planas* lo disminuye en medio paso.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform2.svg'</img>

El bloque *Ajustar Transposición* puede usarse para hacer
desplazamientos más largos de tono. Para desplazar una octava
completa, se debe trasponer 12 medios pasos. -12 desplazará una octava
hacia abajo.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform3.svg'</img>

In the example above, we take the song we programmed previously and
raise it by one octave.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform4.svg'</img>

Se puede usar la notación punto con el bloque *Dot*. Una nota con
punto se extiende en un 50%. Por ejemplo, una quarter note con punto
tocará durante 3/8 (1/4 + 1/8) de un pulso. Una eighth note con punto
tocará por 3/16 (1/8 + 1/16) de un pulso.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform5.svg'</img>

Tamién se puede multiplicar o dividir el valor del pulso, lo cual
acelerará o disminuirá las notas.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform6.svg'</img>

There are several ways to repeat notes. The *Repeat* block will play a
sequence of notes multiple times; the *Duplicate* block will repeat each
note in a sequence.

In the example, on the left, the result would be `Sol, Re, Sol, Sol,
Re, Sol, Sol, Re, Sol, Sol, Re, Sol`; on the right the result would be
`Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol`.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform7.svg'</img>

El bloque *Swing* actúa sobre pares de notas, extendiendo la duración
de la primera y restándole la misma cantidad de tiempo a la segunda

El bloque *Tie* también actúa sobre pares de notas, combinándolas en
una sola. Las notas tienen que tener tono idéntico, pero pueden variar
en ritmo.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform8.svg'</img>

El bloque *Fijar Volumen* cambia el bolumen de las notas. El valor por
defecto es 50, y puede variar desde 0 (silencio) hasta 100 (volumen
máximo).

El bloque *Crescendo* aumenta o disminuye el volumen de las notas que
contiene según el valor especificado.

El bloque *Staccato* toca las notas en ráfagas rápidas, manteniendo su
ritmo.

El bloque *Slur* toca una nota más allá de su duración, mezclándola
con la nota siguiente.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform9.svg'</img>

El bloque *Intervalo* calcula un intervalo (por ejemplo, un quinto) y
agrega los tonos adicionales a una nota. En la figura, se agrega Sol a
Do y Do a Fa.

El bloque *Articulación* cambia el volumen de un grupo de notas.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform11.svg'</img>

El bloque *Hacia atrás* juega las notas contenidas en reversa
orden. En el ejemplo anterior, las notas en la colección se reproducen
como `Sol`, `Ti`,` La`, `Sol`, es decir, desde el fondo hasta la parte
superior de la pila.

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_crab_canon.tb&run=true)

Note that all of the blocks inside a *Backward* block are reverse, so
use this feature with caution if you include logic intermixed with
notes.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/transform10.svg'</img>

El bloque *Fijar Clave* cambia la clave y el modo de relación entre
solfege, por ejemplo, Do, Re, Mi, a nombres de notas como C, D, E, en
C Mayor. Los modos incluyen Mayor y Menor, Cromático y otros modos
exóticos como Bebop, Geez y Maqam.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum4.svg'</img>

En este ejemplo, la secuencia de pulsos de tambor aumenta en el tiempo.

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_drumexample.tb&run=true)

The Pitch Drum Matrix
---------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum2.svg'</img>

The *Set Drum* block is used to map the enclosed pitches into drum
sounds. Drum sounds are played in a monopitch using the specified drum
sample. In the example above, a `kick drum` will be substitued for
each occurance of a `Re` `4`.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum8.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum5.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum6.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum7.svg'</img>

As an expedience for creating mapping with the *Set Drum* block, we
provide the *Drum-Pitch* Matrix. You use it to map between pitches and
drums. The output is a stack of *Set Dum* blocks.


3. Voices
---------

Each *Start* block runs as a separate voice in Music Blocks. (When
you click on the Run button, all of the *Start* blocks are run
concurrently.)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/voices1.svg'</img>

Si colocamos nuestra canción dentro de un bloque *Acción*...

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/voices2.svg'</img>

...la podemos ejecutar desde múltiples bloques *Iniciar*.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/voices3.svg'</img>

Se pone más interesante si la desplazamos octavas arriba y abajo.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/voices4.svg'</img>

And even more interesting if we bring the various voices offset in time.

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_frerejacques.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/drum3.svg'</img>

A special "drum" version of the *Start* block is available for laying
down a drum track. Any pitch blocks encounted while starting from a
drum will be played as `C2` with the default drum sample. In the
example above, all of the notes in `chunk` will be played with a kick
drum.

4. Adding graphics
------------------

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/graphics1.svg'</img>

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/graphics2.png'</img>

Es posible combinar dibujos con bloques musicales. Al colocar bloques
de funciones gráficas (como *Adelante* o *Drecha*) dentro de bloques *Valor
de la Nota*, los dibujos se sincronizan con la música.

En el ejemplo, la tortuga avanza cada vez que se toca una quarter note
y gira a la derecha durante la octava nota. En cada paso del bloque
*Repetir* más interno el tono sube un paso y medio, el tamaño de lápiz
disminuye y el color aumenta.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/graphics3.svg'</img>

In this example, the graphics are synchronized to the music by placing
the graphics commands inside of *Note value* blocks.

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_sync_graphics.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/fibonacci3.svg'</img>

En este ejemplo un bloque de *Tiempo Libre* es usado para desacoplar el
dibujo de la música. Esto se hace porque el procesamiento y los
gráficos son más complejos.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/graphics4.png'</img>

5. Interaction
--------------

There are many ways to interactive with Music Blocks, including
tracking the mouse position to impact some aspect of the music.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/interactive.svg'</img>

For example, we can launch the phrases (chunks) interactively. When
the mouse is in the lower-left quadrant, `chunk` is played;
lower-right quadrant, `chunk1`; upper-left quadrant, `chunk2`; and
upper-right quadrant, `chunk3`.

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_interactivefrerejacques.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/interactive2.svg'</img>

In the example above, a simple two-key piano is created by associating
*click* events on two different turtles with individual notes. Can you
make an 8-key piano?

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_twokey_piano.tb&run=true)

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/interactive3.svg'</img>

You can also add a bit of randomness to your music. In the top example
above, the *One-of* block is used to randomly assign either `Do` or
`Re` each time the *Note value* block is played. In the bottom example
above, the *One-of* block is used to randomly select between `chunk1`
and `chunk2`.

6. Beyond Music Blocks
----------------------

Music Blocks is a waypoint, not a destination. One of the goals is to
point the learner towards other powerful tools. One such tool is
[Lilypond](http://lilypond.org), a music engraving program.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/lilypond1.svg'</img>

The *Save as Lilypond* block will transcribe your composition. The
output of the program above is saved to `Downloads/hotdog.ly`. There is
also a *Save as Lilypond* button on the secondary toolbar.

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/lilypond2.svg'</img>

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

<img src='https://rawgithub.com/walterbender/musicblocks/master/guide-es/hotdog.png'</img>

[EJECUTAR EN VIVO](http://walterbender.github.io/musicblocks/?file=MusicBlocks_hotdog.tb&run=true)
