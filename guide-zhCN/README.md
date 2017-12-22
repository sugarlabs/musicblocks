# 《音乐拼块》程序设计说明

《音乐拼块》是一个培养青少年对音乐和图像的兴趣的程序环境。《音乐拼块》扩展另一个程序，《乌龟拼块》，加上了一集关于音调和韵律的功能。

《音乐拼块》程序设计说明是一个开始学程序基础的好地方。在这个说明书里，我们会让读者看看了解几个程序例子，来展示《音乐拼块》的音乐功能。

## <a name="TOC"></a> 目录

1. [开始](#GETTING-STARTED)
2. [发出声音](#NOTES)
    1. [音符长度](#NOTE-VALUE)
    2. [音调](#PITCH)
    3. [和弦](#CHORDS)
    4. [休止](#RESTS)
    5. [鼓声](#DRUMS)
3. [使用音乐设计程序](#PROGRAMMING-WITH-MUSIC)
    1. [砖块](#CHUNKS)
    2. [音乐转变](#TRANSFORMATION)
        1. [转变音调](#STEP-PITCH)
        2. [升号和降号](#SHARPS-AND-FLATS)
        3. [移调法](#ADJUST-TRANSPOSITION)
        4. [附点音符](#DOTTED)
        5. [使用数学加快放慢音符](#MULTIPLY-AND-DIVIDE)
        6. [重复音符](#REPETITION)
        7. [摆动音符和合并音符](#SWINGING)
        8. [定住，转变，断奏，模糊声音](#MORE-TRANSFORMATIONS)
        9. [间隔和定住相对声音](#INTERVALS-AND-ARTICULATION)
        10. [绝对间隔](#ABSOLUTE-INTERVALS)
        11. [倒位](#INVERSION)
        12. [反向播放音乐](#BACKWARDS)
        13. [定住音色和音调](#SETTING)
        14. [颤音](#VIBRATO)
    3. [音色](#VOICES)
    4. [图像](#GRAPHICS)
    5. [节奏](#BEAT)
    6. [相互作用](#INTERACTIONS)
4. [部件](#WIDGETS)
    1. [观察状况](#status)
    2. [产生音乐砖块](#pitch-time)
        1. [音调-时间矩阵](#pitch-time)
        2. [音律拼块](#THE-RHYTHM-BLOCK)
        3. [创造连音](#CREATING-TUPLETS)
        4. [连音是什么?](#WHAT-IS-TUPLET)
        5. [在矩阵里使用独自音符](#INDIVIDUAL-NOTES)
    3. [产生音律](#rhythms)
    4. [音乐模式](#modes)
    5. [音调-鼓声矩阵](#pitch-drum)
    6. [探索音调比例](#stairs)
    7. [产生音调](#slider)
    8. [改换节奏](#tempo)
5. [《音乐拼块》以外](#BEYOND-MUSIC-BLOCKS)

许多说明里给的例子可以链接到可以执行的程序，只需注意 `RUN LIVE` 链接.

## <a name="GETTING-STARTED"></a>1. 开始                                                     
[回去目录](#TOC) | [下一章 (2. 发出声音)](#NOTES)

《音乐拼块》是设计在游览器上使用。大多数的程序发展是在 Google Chrome 上做的，
可是程序也应该在 Mozilla Firefox 上使用。你可以从
[github.io](http://walterbender.github.io/musicblocks) 执行程序，
或下载一个程序的复制，直接在自己的电脑上，使用文件系统执行下载的复制程序。

想知道更多关于《音乐拼块》的详情，你可以看 [Using Music
Blocks](http://github.com/walterbender/musicblocks/tree/master/documentation).
想知道更多关于《乌龟拼块》的详情，你可以看 [Using Turtle
Blocks
JS](http://github.com/walterbender/turtleblocksjs/tree/master/documentation).

## <a name="NOTES"></a>2. 发出声音
[上一章 (1. 开始)](#GETTING-STARTED) | [回去目录](#TOC) |[下一章 (3. 使用音乐设计程序)](#PROGRAMMING-WITH-MUSIC)

《音乐拼块》使用很多常见的音乐元素，相似
[音调](#PITCH), [音律](#rhythms),[声音](#MORE-TRANSFORMATIONS),
和一点 [乐器的选择](#VOICES)。

### <a name="NOTE-VALUE"></a>
2.1 《音乐拼块》最有用的拼块是《音符长度》。《音符长度》里面有一个[音调拼块](#PITCH)和音符的长度。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/guide/note1.svg
 "一个《音符长度拼块》(在上面) 和两个连接的拼块(在下面)")

 上面的例子有一个“音符拼块”。“1/8”是价值或长度，在这种情况下是一个八分音符

 下面有两个连接的音符。这些音符是八分音符，一起做一个四分序列。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/guide/note2.svg
 "一个四分音符，一个十六分音符，和一个半音音符的拼块")

这个例子有不同的音符。从上到下有:`1/4`为一个四分音符，`1/16`为一个十六分音符，和
`1/2`为一个半音音符。


《音符长度拼块》可以使用任何数学运算。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/charts/NotationRestChart.svg
 "一个音符长度图和他们的《音符长度拼块》。

请使用上面的图片作为表示值。

### <a name="PITCH"></a>
2.2 音调。我们已经看到了音调拼块在[音符长度拼块](#NOTE-VALUE)里面.
音调拼块指定音调的名字和音高八度。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/guide/note3.svg
 "指定一个音调块的名称和八度")

有很多方法来指定一个音调拼块音高八度和音名。上面有例子

上面的音调拼块是使用唱名指定(`Sol` 在 `八度-四`)，
里面有音符 `Do Re Me Fa Sol La Ti `。

下一个拼块有用音高名称指定的音高。(`G` 在 `八度-四`)，里面有音符 `C D E F G A B`。

下一个拼块有用音阶程度拼块(音阶中的第五个音符，'G'，也在 `八度-四`), `C == 1, D == 2, ...`

下一个拼块有用音音调编号拼块。(`C` 上面的第七个半音，也在 `八度-四`)。音高数字偏移可以用《设置音高数字偏移拼块》固定。

最后一个拼块的音调用赫兹和一个《数字拼块》指定。赫兹是频率的度量。

八度是用《数字拼块》指定的。这个数字不能有小数。
如果音高由赫兹指定，八度将不会被使用。

最后，音高名称可以用一个文字拼块指定。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/charts/KeyboardChart.svg "Note layout chart for keyboard")
![alt tag](https://rawgithub.com/walterbender/musicblocks/master/charts/MalletChart.svg "Note layout chart for mallet")
请参考上面的图表，了解音符在键盘或五线谱上的位置。

### <a name="CHORDS"></a>2.3 和弦

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/note4.svg "Forming a chord")

一个和弦可以通过将多个音调拼块放在一个音长度拼块里面。

### <a name="RESTS"></a>2.4 休止

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/silence.svg "Silence blocks create rests")

休息可以使用一个音符长度拼块。在这个拼块应该有一个《安静拼块》而不是一个音调拼块。

### <a name="DRUMS"></a>2.5 鼓声

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum1.svg "Using Drum Sample block")

一个音调拼块可以在任何地方使用&mdash;例如，在音符长度里面&mdash;一个鼓样品可以用来代替。
现在大概有二十多个不同的样本可选择。默认鼓是踢鼓。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/note5.svg "Multiple Drum Sample blocks in combinations")

上面有一个和弦的例子。这个例子的和弦使用鼓拼块。

## <a name="PROGRAMMING-WITH-MUSIC"></a>3. 使用音乐设计程序

[上一章 (2. 发出声音)](#NOTES) | [回去目录](#TOC) | [下一章 (4. 部件)](#WIDGETS)

这一章将会说明怎么使用音乐砖块来产生音乐。
一件必须注意的事是你可以使用自己做出来的音乐砖块来做出你的程序，
或使用 [*音调-时间矩阵*](#pitch-time) 开始做出你的程序.

### <a name="CHUNKS"></a>3.1 砖块

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix4.svg "working of action stack")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk1.svg "using chunk inside Start block")

每当你做出一个新的 *Action* 程序堆，《音乐拼块》会产生一个新的拼块。
这个拼块会是独特的，也会链接程序堆。
（这个新的拼块可以在屏幕的左角， *Block* 的部分里找的)
按上和执行这个拼块和执行以上的程序堆是一样的。
这些新的拼块创造时的名字是 `chunk`, `chunk1`,
`chunk2`... 可是你可以编改 *Action* 拼块的标签来换拼块的名字。

一个 *Action* 拼块包含了一系列的行动，这些行动只有当拼块被其他拼块提名才会执行,
例如一个*Start*拼块。 这个特性有用于产生更复杂的音乐程序。

一个 *Start* 拼块 是一个在按下开始按钮后，直接执行的 *chunk*。
这个拼块是大多数程序开始的地方。《音乐拼块》包含着很多可以 *Run* 一个程序的方式:
你可以按下在屏幕左上角的 *Run* 按钮("兔子" 图标) 快速播放音乐;
按下 *Run Slow* 按钮 ("乌龟" 图标) 慢速播放音乐;
和按下 *Step* 按钮 ("蜗牛" 图标) 每按下按钮播放程序的一个拼块。

In the example above, the *Chunk* block is inside of a *Start* block, which means
that when any of the start buttons is pressed, the code inside the *Start* block (the *Chunk* block) will
be executed. You can add more chunks after this one inside the *Start* block to execute them
sequentially.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk2.svg "usage of multiple Chunk blocks")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk3.svg "usage of Repeat block")

You can [repeat](#REPETITION) chunks either by using multiple *Chunk* blocks or using a
*Repeat* block.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk4.svg "multiple action stacks")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk5.svg "mixing and matching chunks")

You can also mix and match chunks. Here we play the action block with
name "chunk", followed by "chunk1" twice, and then "chunk" again.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk6.svg "creating a song using chunks")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/chunk7.svg "usage of Repeat block in a song")

A few more chunks and we can make a song. (Can you read the block
notation well enough to guess the outcome? Are you familiar with the
song we created?)

### <a name="TRANSFORMATION"></a>3.2 音乐转变

There are many ways to transform pitch, rhythm, and other sonic qualities.

#### <a name="STEP-PITCH"></a>3.2.1 转变音调

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform0.svg "Using the Step Pitch block")

The *Step Pitch* block will move up or down notes in a scale from the
last played note. In the example above, *Step Pitch* blocks are used inside
of *Repeat* blocks to repeat the code 7 times, playing up and down a scale.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_scales.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform16.svg "Using the Consonant Step Up and Down blocks")

Another way to move up and down notes in a scale is to use the
*Consonant Step Up* and *Consonant Step Down* blocks. These blocks
calculate the number of half-steps to the next note in the current
mode. (You can read more about [Musical Modes](#modes) below.) Note
that the *Mouse Pitch Number* block returns the pitch number of the
most recent note played.

#### <a name="SHARPS-AND-FLATS"></a>3.2.2 升号和降号

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform1.svg "Using Sharp and Flat blocks")

The *Sharp* and *Flat* blocks can be wrapped around *Pitch* blocks,
*Note value* blocks, or [chunks](#CHUNKS). A sharp will raise the pitch by one
half step. A flat will lower by one half step. In the example, on the
left, just the *Pitch* block `Mi` is lowered by one half step; on the
right, both *Pitch* blocks are raised by one half step.

#### <a name="ADJUST-TRANSPOSITION"></a>3.2.3 移调法

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform2.svg "Adjust-transposition")

The *Adjust-transposition* block can be used to make larger shifts in
pitch in half step units. A positive number shifts the pitch up and a
negative number shifts the pitch down. The input must be a whole
number. To shift an entire octave, transpose by 12 half-steps up. -12
will shift an octave down.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform3.svg "raising an octave using Adjust-transposition")

In the example above, we take the song we programmed previously and
raise it by one octave.

#### <a name="DOTTED"></a>3.2.4 附点音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform4.svg "Creating dotted notes using the Dot block")

You can "dot" notes using the *Dot* block. A dotted note extends the rhythmic duration of a note by
50%. E.g., a dotted quarter note will play for 3/8 (1/4 + 1/8) of a
beat. A dotted eighth note will play for 3/16 (1/8 + 1/16) of a beat.

You can also simply change the note value to mimic a dotted note, for example indicating 3/8 instead of 1/4, for a dotted quarter note.
![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/DotsChart.svg "using dotted notes")

#### <a name="MULTIPLY-AND-DIVIDE"></a>3.2.5 使用数学加快放慢音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform5.svg "Speeding up and slowing down the tempo")

You can also multiply (or divide) the beat value, which will speed up
or slowdown the notes. Multiplying the beat value of an `1/8` note by
`2` is the equivalent of playing a `1/16` note. Dividing the beat
value of an `1/8` note by '2' is the equivalent of playing a `1/4`
note.

#### <a name="REPETITION"></a>3.2.6 重复音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform6.svg "repeating notes")

There are several ways to repeat notes. The *Repeat* block will play a
sequence of notes multiple times; the *Duplicate* block will repeat each
note in a sequence.

In the example, on the left, the result would be `Sol, Re, Sol, Sol,
Re, Sol, Sol, Re, Sol, Sol, Re, Sol`; on the right the result would be
`Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol`.

#### <a name="SWINGING"></a>3.2.7 摆动音符和合并音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform7.svg "swinging notes and tied notes")

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

![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/TiesChart.svg "using notes with ties")

#### <a name="MORE-TRANSFORMATIONS"></a>3.2.8 定住，转变，断奏，模糊声音

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform8.svg "Set volume, Crescendo, Staccato, and Slur blocks")

The *Set volume* block will change the volume of the notes. The
default is 50; the range is 0 (silence) to 100 (full volume).

The *Crescendo* block will increase (or decrease) the volume of the
contained notes by a specified amount for every note played. For
example, if you have 3 notes in sequence contained in a *Crescendo*
block with a value of 5, the final note will be at 15% more
than the original value for volume.

The *Staccato* block shortens the length of the actual note&mdash;making them tighter
bursts&mdash;while maintaining the specified rhythmic value of the notes.

The *Slur* block lengthens the sustain of notes&mdash;running longer than
the noted duration and blending it into the next note&mdash;while
maintaining the specified rhythmic value of the notes.

#### <a name="INTERVALS-AND-ARTICULATION"></a>3.2.9 间隔和定住相对声音

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform9.svg "Interval and Set Relative Volume block")

The *Interval* block calculates a relative interval, e.g., a fifth,
and adds the additional pitches to a note's playback. In the figure,
we add `La` to `Re` and `Ti` to `Mi`.

The *Set Relative Volume* block modifies the clamped note's volume according to the input value of the block in an added (or subtracted when negative) percentage with respect to the original volume.For example,100 would mean doubling the current volume.

#### <a name= "ABSOLUTE-INTERVALS"></a>绝对间隔

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform14.svg "Using absolute intervals")

The *Augmented* block calculates an absolute interval, e.g., an
augmented fifth, and adds the additional pitches to a note. Similarly,
the *Minor* block calculates an absolute interval, e.g., a minor
third. Other absolute intervals include *Perfect*, *Diminished*, and
*Major*.

In the augmented fifth example above, a chord of D5 and A5 are played,
followed by a chord of E5 and C5. In the minor third example, which
includes a shift of one octave, first a chord of D5 and F5 is played,
followed by chord of E5 and G6.

#### <a name= "INVERSION"></a>3.2.11 倒位
![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform13.svg "inversion")

The *Invert* block will invert a series of notes around a target
note. There are two different modes of the *Invert* block: *odd*
and *even*, the latter shifts the point of rotation up by a `1/4`
step, enabling rotation around a point between two notes.

In the *invert (even)* example, `D4` is inverted around `G4`,
resulting in a `C5`. In the *invert (odd)* example, `D4` is inverted
around a point midway between `G4` and `G♯4` resulting in a `C♯5`

#### <a name="BACKWARDS"></a>3.2.12 反向播放音乐

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform11.svg "Backward block")

The *Backward* block will play the contained notes in reverse order
(retrograde). In the example above, the notes in *Chunk* are played as
`Sol`, `Ti`, `La`, `Sol`, i.e., from the bottom to the top of the
stack.

[RUN
LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_crab_canon.tb)

Note that all of the blocks inside a *Backward* block are reverse, so
use this feature with caution if you include logic intermixed with
notes.

#### <a name= "SETTING"></a>3.2.13 定住音色和音调

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform12.svg "setting voice and keys using Set Voice block")

The *Set Voice* block selects a [voice](#VOICES) for the synthesizer for any
contained blocks, e.g., violin or cello.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform10.svg "Set Key block")

The *Set Key* block will change the key and mode of the mapping
between solfege, e.g., `Do`, `Re`, `Mi`, to note names, e.g., `C`,
`D`, `E`, when in C Major. Modes include Major and Minor, Chromatic,
and a number of more exotic modes, such as Bebop, Geez, Maqam, etc.
This block allows users to access "movable Do" within Music
Blocks, where the mapping of solfege to particular pitch changes
depending on the user's specified tonality.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum4.svg "increasing sequence of drum beats over time")

In the above example, the sequence of [drum](#DRUMS) beats is increased over time.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_drumexample.tb)

#### <a name="VIBRATO"></a>3.2.14 颤音

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/transform15.svg "Vibrato block")

The *Vibrato* Block adds a rapid variation in pitch to any contained
notes. The intensity of the variation ranges from 1 to 100 (cents),
e.g. plus or minus up to one half step. The rate argument determines
the rate of the variation.

### <a name="VOICES"></a>3.3 音色

Each *Start* block runs as a separate voice in Music Blocks. (When
you click on the Run button, all of the *Start* blocks are run
concurrently.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/voices1.svg "use of voices")

If we put our song into an action...

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/voices2.svg "running the song using multiple Start blocks")

...we can run it from multiple *Start* blocks.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/voices3.svg "shifting the octaves up and down")

It gets more interesting if we shift up and down octaves.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/voices4.svg playing the various voices offset in time")

And even more interesting if we bring the various voices offset in time.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_frerejacques.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/voices5.svg "queuing the various voices using events")

An alternative to use a preprogrammed delay is to use the *Broadcast*
block to bring in multiple voices. In the example above, after each
section of the song is played, a new event is broadcasted, bringing in
a new voice. Note the use of the *Mouse Sync* block. This ensures that
the multiple voices are synced to the same master clock.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum3.svg "usage of kick drum")

A special "drum" version of the *Start* block is available for laying
down a drum track. Any *Pitch* blocks encounted while starting from a
drum will be played as `C2` with the default drum sample. In the
example above, all of the notes in `chunk` will be played with a kick
drum.

### <a name="GRAPHICS"></a>3.4 图像

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/graphics1.svg "adding graphics")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/graphics2.svg "color range")

Turtle graphics can be combined with the music blocks. By placing
graphics blocks, e.g., *Forward* and *Right*, inside of *Note value*
blocks, the graphics stay in sync with the music. In this example, the
turtle moves forward each time a quarter note is played. It turns
right during the eighth note. The pitch is raised by one half step,
the pen size decreases, and the pen color increases at each step in
the inner repeat loop.

[RUN LIVE](https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_graphicsexample.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/graphics3.svg "synchronizing graphics and music")

Another example of graphics synchronized to the music by placing the
graphics commands inside of *Note value* blocks

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_sync_graphics.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/fibonacci3.svg "usage of No-clock block")

In this example, because the computation and graphics are more
complex, a *No-clock* block is used to decouple the graphics from the
master clock. The "No-clock* block prioritizes the sequence of
actions over the specified rhythm.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/graphics4.png "rhythm sequence")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/tree-example.svg "another example of the No-clock block")

Another example of embedding graphics into notes: in case, a recursive
tree drawing, where the pitch goes up as the branches assend.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/tree.svg "tree graphic")

[RUN LIVE](https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_musicaltree.tb)

### <a name="BEAT"></a>3.5 节奏

The beat of the music is determined by the *Meter* block (by default,
it is set to 4:4).

The *Pickup* block can be used to accommodate any notes that come in
before the beat.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/beat1.svg "meter and pickup")

Specifying beat is useful in that you can have the character of a note
vary depending upon the beat. In the example below, the volume of
notes on Beat 1 and Beat 3 are increased, while the volume of off
beats is decreased.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/beat2.svg "on-beat-do")

The *On-Beat-Do* and *Off-Beat-Do* blocks let you specify actions to
take on specific beats. (Note that the action is run before any blocks
inside the note block associated with the beat are run.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/graphics5.svg "using beat to synchronize graphics")

Another approach to graphics is to use modulate them based on the
beat. In the exxample above, we call the same graphics action for each
note, but the parameters associated with the action, such as pen
width, are dependent upon which beat we are on. On Beat 1, the pen
size is set to 50 and the volume to 75. On Beat 3, the pen size is set
to 25 and the volume to 50. On off beats, the pen size is set to 5 and
the volumne to 5. The resultant graphic is shown below.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/graphics6.svg "graphics modulated by beat")

### <a name="INTERACTIONS"></a>3.6 相互作用

There are many ways to interactive with Music Blocks, including
tracking the mouse position to impact some aspect of the music.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/interactive.svg "interactions")

For example, we can launch the phrases (chunks) interactively. When
the mouse is in the lower-left quadrant, `chunk` is played;
lower-right quadrant, `chunk1`; upper-left quadrant, `chunk2`; and
upper-right quadrant, `chunk3`.

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_interactivefrerejacques.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/interactive2.svg "creation of a two-key piano")

In the example above, a simple two-key piano is created by associating
*click* events on two different turtles with individual notes. Can you
make an 8-key piano?

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_twokey_piano.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/interactive3.svg "adding randomness to your music")

You can also add a bit of randomness to your music. In the top example
above, the *One-of* block is used to randomly assign either `Do` or
`Re` each time the *Note value* block is played. In the bottom example
above, the *One-of* block is used to randomly select between `chunk1`
and `chunk2`.

## <a name="WIDGETS"></a>部件

[上一章 (3. 使用音乐设计程序)](#PROGRAMMING-WITH-MUSIC) | [回去目录](#TOC) | [下一章 (5. 《音乐拼块》之外)](#BEYOND-MUSIC-BLOCKS)

This section of the guide will talk about the various Widgets that can be added to Music Blocks
to enhance your experience.

### <a name="status"></a>4.1 观察状况

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/status1.svg "given Music block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/status2.svg "status in tabular form")

The *Status widget* is a tool for inspecting the status of Music
Blocks as it is running. By default, the key, BPM, and volume are
displayed. Also, each note is displayed as it is played. There is one
row per voice in the status table.

Additional *Print* blocks can be added to the *Status* widget to
display additional music factors, e.g., duplicate, transposition,
skip, [staccato](#MORE-TRANSFORMATIONS), [slur](#MORE-TRANSFORMATIONS), and [graphics](#GRAPHICS) factors, e.g., x, y, heading,
color, shade, grey, and pensize.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/status3.svg "additional programming within the Status block")

You can do additional programming within the status block. In the
example above, the volume is divided by 10 before being displayed.

### <a name="GENERATION"></a>4.2 产生音乐砖块

Using the Pitch-Time Matrix, it is possible to generate chunks of notes at a much faster speed.

#### <a name="pitch-time"></a>4.2.1 音调-时间矩阵

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix1.svg "Pitch-time Matrix")

Music Blocks provides a widget, the *Pitch-time Matrix*, as a scaffold
for getting started.

Once you've launched Music Blocks in your browser, start by clicking
on the *Pitch-time Matrix* stack that appears in the middle of the
screen. (For the moment, ignore the *Start* block.) You'll see a grid
organized vertically by pitch and horizontally by rhythm.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix2.svg "Pitch and Rhythm block matrix")

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

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix3.svg "matrix")

By clicking on individual cells in the grid, you should hear
individual notes (or chords if you click on more than one cell in a
column). In the figure, three quarter notes are selected (black
cells). First `Re 4`, followed by `Mi 4`, followed by `Sol 4`.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg "play button")

If you click on the *Play* button (found in the top row of the grid),
you will hear a sequence of notes played (from left to right): `Re 4`,
`Mi 4`, `Sol 4`.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/export-chunk.svg "save button")


Once you have a group of notes (a "chunk") that you like, click on the
*Save* button (just to the right of the *Play* button). This will
create a stack of blocks that can used to play these same notes
programmatically. (More on that below.)

You can rearrange the selected notes in the grid and save other chunks
as well.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/sort.svg "sort button")


The *Sort* button will reorder the pitches in the matrix from highest
to lowest and eliminate any duplicate *Pitch* blocks.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg "close button")


You can hide the matrix by clicking on the *Close* button (the right-most
button in the top row of the grid.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg "erase button")


There is also an Erase button that will clear the grid.

Don't worry. You can reopen the matrix at anytime (it will remember
its previous state) and since you can define as many chunks as you
want, feel free to experiment.

Tip: You can put a chunk inside a *Pitch-time Matrix* block to generate
the matrix to corresponds to that chunk.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix4.svg "usage of octave for a pitch")

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

#### <a name="THE-RHYTHM-BLOCK"></a>4.2.2 音律拼块

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix6.svg "the Rhythm block")

*Rhythm* blocks are used to generate rhythm patterns in the
*Pitch-time Matrix* block. The top argument to the *Rhythm* block
is the number of notes. The bottom argument is the duration of the
note. In the top example above, three columns for quarter notes
would be generated in the matrix. In the middle example, one column
for an eighth note would be generated. In the bottom example, seven
columns for 16th notes would be generated.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix7.svg "usage of Rhythm block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix8.svg "resulting notes in tabular format")

You can use as many *Rhythm* blocks as you'd like inside the
*Pitch-time Matrix* block. In the above example, two *Rhythm*
blocks are used, resulting in three quarter notes and six eighth
notes.

#### <a name="CREATING-TUPLETS"></a>4.2.3 创造连音

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix9.svg "simple tuplet")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix10.svg "tuplet and rhythmic note values")

Tuplets are a collection of notes that get scaled to a specific
duration. Using tuplets makes it easy to create groups of notes that
are not based on a power of 2.

In the example above, three quarter notes&mdash;defined in the *Simple
Tuplet* block&mdash;are played in the time of a single quarter
note. The result is three twelfth notes. (This form, which is quite
common in music, is called a *triplet*. Other common tuplets include a
*quintuplet* and a *septuplet*.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix11.svg "usage of tuplet")

In the example above, the three quarter notes are defined in the
*Rhythm* block embedded in the *Tuplet* block. As with the *Simple
Tuplet* example, they are played in the time of a single quarter
note. The result is three twelfth notes. This more complex form allows
for intermixing multiple rhythms within single tuplet.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix12.svg "embedding rhythm and Tuplet block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix13.svg "tuplet and rhythmic note values")

In the example above, the two *Rhythm* blocks are embedded in the
*Tuplet* block, resulting in a more complex rhythm.

Note: You can mix and match *Rhythm* blocks and *Tuplet* blocks when
defining your matrix.

#### <a name="WHAT-IS-TUPLET"></a>4.2.4 连音是什么?

![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/TupletChart.svg "tuplet chart")

![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/TripletChart.svg "triplet chart")

#### <a name="INDIVIDUAL-NOTES"></a>4.2.5 在矩阵里使用独自音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/matrix14.svg)

You can also use individual notes when defining the grid. These blocks
will expand into *Rhythm* blocks with the corresponding values.

### <a name="rhythms"></a>4.3 产生音律

The *Rhythm Ruler* block is used to launch a widget similar to the
*Pitch-time Matrix* block. The widget can be used to generate rhythmic
patterns.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm1.svg "generating rhythms")

The argument to the *Rhythm Ruler* block specifies the duration that
will be subdivided to generate a rhythmic pattern. By default, it is 1
/ 1, e.g., a whole note.

The *Set Drum* blocks contained in the clamp of the *Rhythm Ruler*
block indicates the number of rhythms to be defined simultaneously. By
default, two rhythms are defined. The embedded *Rhythm* blocks define
the initial subdivision of each rhythm ruler.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm2.svg "rhythm ruler")

When the *Rhythm Ruler* block is clicked, the *Rhythm Ruler* widget is
opened. It contains a row for each rhythm ruler. An input in the top
row of the widget is used to specify how many subdivisions will be
created within a cell when it is clicked. By default, 2 subdivisions
are created.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm3.svg "usage of rhythm ruler")

As shown in the above figure, the top rhythm ruler has been divided
into two half-notes and the bottom rhythm ruler has been divided into
three third-notes. Clicking on the *Play* button to the left of each row
will playback the rhythm using a drum for each beat. The *Play-all*
button on the upper-left of the widget will play back all rhythms
simultaneously.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm4.svg "divide cells in rhythm ruler")

The rhythm can be further subdivided by clicking in individual
cells. In the example above, two quarter-notes have been created by
clicking on one of the half-notes.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm8.svg "tie cells in rhythm ruler")

By dragging across multiple cells, they become tied. In the example
above, two third-notes have been tied into one two-thirds-note.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm5.svg "save stack button")

The *Save stack* button will export rhythm stacks.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm6.svg "stacks of rhythms" )

These stacks of rhythms can be used to define rhythmic patterns used
with the *Pitch-time Matrix* block.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/rhythm7.svg "save drum machine button")

The *Save drum machine* button will export *Start* stacks that will
play the rhythms as drum machines.

### <a name="modes"></a>4.4 音乐模式

Musical modes are used to specify the relationship between [intervals](#INTERVALS-AND-ARTICULATION)
(or steps) in a scale. Since Western music is based on 12 half-steps
per octave, modes speficy how many half steps there are between each
note in a scale.

By default, Music Blocks uses the *Major* mode, which, in the [Key](#SETTING) of
C, maps to the white keys on a piano. The intervals in the *Major*
mode are `2, 2, 1, 2, 2, 2, 1`. Many other common modes are
built into Music Blocks, including, of course, *Minor* mode, which
uses `2, 1, 2, 2, 1, 2, 2` as its intervals.

Note that not every mode uses 7 intervals per octave. For example, the
*Chromatic* mode uses 11 intervals: `1, 1, 1, 1, 1, 1, 1, 1, 1,
1, 1, 1`. The *Japanese* mode uses only 5 intervals: `1, 4,
2, 3, 2],`. What is important is that the sum of the intervals
in an octave is 12 half-steps.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/mode1.svg "mode widget")

The *Mode* widget lets you explore modes and generate custom
modes. You invoke the widget with the *Custom mode* block. The mode
specified in the *Set key* block will be the default mode when the
widget launches.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/mode2.svg "launching widget with Major mode")

In the above example, the widget has been launched with *Major* mode
(the default). Note that the notes included in the mode are indicated by
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

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/mode3.svg "creating Dorian mode")

In the above example, the *Major* mode has been rotated clockwise,
transforming it into *Dorian*.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/mode4.svg "creating Locrian mode")

In the above example, the *Major* mode has been rotated
counter-clockwise, transforming it into *Locrian*.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/mode5.svg "creating Phrygian mode")

In the above example, the *Major* mode has been inverted, transforming
it into *Phrygian*.

Note: The build-in modes in Music Blocks can be found in [musicutils.js](https://github.com/walterbender/musicblocks/blob/master/js/musicutils.js#L68).

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/mode6.svg "Pitch-time Matrix block")

The *Save* button exports a stack of blocks representing the mode that
can be used inside the *Pitch-time Matrix* block.

### <a name="pitch-drum"></a>4.5 音调-鼓声矩阵

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum2.svg "Pitch-drum matrix")

The *Set Drum* block is used to map the enclosed pitches into drum
sounds. Drum sounds are played in a monopitch using the specified drum
sample. In the example above, a `kick drum` will be substitued for
each occurance of a `Re` `4`.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum8.svg "pitch-drum matrix 1")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum5.svg "table for pitch-drum matrix")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum6.svg "table for pitch-drum matrix")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/drum7.svg "pitch-drum matrix 1")

As an experience for creating mapping with the *Set Drum* block, we
provide the *Drum-Pitch* Matrix. You use it to map between pitches and
drums. The output is a stack of *Set Dum* blocks.

### <a name="stairs"></a>4.6 探索音调比例

The *Pitch Staircase* block is used to launch a widget similar to the
*Pitch-time Matrix*, which can be used to generate different pitches
using a given pitch and musical proportion.

The *Pitch* blocks contained in the clamp of the *Pitch Staircase*
block define the pitches to be initialized simultaneously. By default,
one pitch is defined and it have default note "la" and octave "3".

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchstaircase0.svg "generating arbitrary pitches")

When *Pitch Staircase* block is clicked, the *Pitch Staircase* widget is
initialized. The widget contains row for every *Pitch* block contained
in the clamp of the *Pitch Staircase* block. The input fields in the top
row of the widget specify the musical proportions used to create new
pitches in the staircase. The inputs correspond to the numerator and
denominator in the proportion resectively. By default the proportion
is 3:2.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchstaircase1.svg "notes associated with the step in the stairs")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchstaircase2.svg "notes associated with the step in the stairs")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchstaircase3.svg "notes associated with the step in the stairs")

Clicking on the *Play* button to the left of each row will playback
the notes associated with that step in the stairs. The *Play-all*
button on the upper-left of the widget will play back all the pitch
steps simultaneously. A second *Play-all* button to the right of the
stair plays in increasing order of frequency first, then in
decreasing order of frequency as well, completing a scale.

The *Save stack* button will export pitch stacks. For example, in the above
configuration, the output  from pressing the *Save stack* button is shown below:

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchstaircase4.svg "Pitch Stair block")

These stacks can be used with the *Pitch-time Matrix* block to define
the rows in the matrix.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchstaircase5.svg "Pitch Stair block")

### <a name="slider"></a>4.7 产生音调

The *Pitch Slider* block is used to launch a widget that is used to
generate arbitray pitches. It differs from the *Pitch Staircase* widget in
that it is used to create frequencies that vary continuously within
the range of a specified octave.

Each *Sine* block contained within the clamp of the *Pitch Slider* block defines the initial pitch
for an ocatve.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider0.svg "Pitch Slider")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider1.svg "Pitch Slider")

When the *Pitch Slider* block is clicked, the *Pitch Slider* widget is
initialized. The widget will have one column for each *Sine* block in
the clamp. Every column has a slider that can be used to move up or
down in frequency, continuously or in intervals of 1/12th of the
starting frequency. The mouse is used to move the frequency up and down continuously. Buttons are
used for intervals. Arrow keys can also be used to move up and down,
or between columns.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider0a.svg "Pitch Slider block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider2.svg "pitch slider")

Clicking in a column will extact the corresponding *Note* blocks, for example:

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider3.svg "pitch slider")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider4.svg " Pitch Slider block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/pitchslider5.svg " Pitch Slider block")

### <a name="tempo"></a>4.8 改换节奏

The *Tempo* block is used to launch a widget that enables the user to
visualize Tempo, defined in beats per minute (BPM). When the *Tempo* block
is clicked, the *Tempo* widget is initialized.

The *Master Beats per Minute* block contained in the clamp of the
*Tempo* block sets the initial tempo used by the widget. This
determines the speed at which the ball in the widget moves back and
forth. If BPM is 60, then it will take one second for the ball to move
across the widget. A round-trip would take two seconds.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/tempo0.svg "changing tempo")

The top row of the widget holds the *Play/pause* button, the *Speed
up* and *Slow down* buttons, and an input field for updating the
Tempo.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/tempo1.svg "changing tempo")

You can also update the tempo by clicking twice in spaced succession in the
widget: the new BPM is determined as the time between the two clicks. For
example, if there is 1/2 seconds between clicks, the new BPM will be set as 120.

## <a name="BEYOND-MUSIC-BLOCKS"></a>《音乐拼块》之外

[上一章 (4. 部件)](#WIDGETS) | [回去目录](#TOC)

Music Blocks is a waypoint, not a destination. One of the goals is to
point the learner towards other powerful tools. One such tool is
[Lilypond](http://lilypond.org), a music engraving program.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/lilypond1.svg "adding Save as Lilypond block")

The *Save as Lilypond* block will transcribe your composition. The
output of the program above is saved to `Downloads/hotdog.ly`. There is
also a *Save as Lilypond* button on the secondary toolbar.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/lilypond2.svg "Save as Lilypond icon")

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

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide/hotdog.png "sheet music")

[RUN LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_hotdog.tb)
