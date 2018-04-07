#LilyPond with Music Blocks software

[LilyPond](http://www.lilypond.org/) is a music engraving program, devoted to producing the highest-quality sheet music possible. It brings the aesthetics of traditionally engraved music to computer printouts. LilyPond is Free/Libre Software (part of the [GNU Project](https://en.wikipedia.org/wiki/GNU_Project)). We use it with [Music Blocks software](sugarlabs.github.io/musicblocks/) in order to export the user-generated music to sheet music.

##Overview
We will use Music Blocks to create the music and then convert that to sheet music. For that:

1. Using Music Blocks create the desired music.
2. [Export the LilyPond code](#generating-lilypond-files-from-music-blocks).
3. [Download Lilypond](#downloading-lilypond) (In order to turn the LilyPond code into Printable Standard Music Notation).
4. Download [Frescobaldi](#using-frescobaldi) (if desired).

##Prerequisites
* Basic knowledge of [Music Blocks software](http://musicblocks.net/)
* Curiosity about [sheet music](https://en.wikipedia.org/wiki/Sheet_music)

##Downloading LilyPond
Open the [LilyPond download page](http://www.lilypond.org/download.html) and download the software "For Users" as per your operating system.

##Installing LilyPond
###Installation for GNU/Linux and FreeBSD
[Read GNU/Linux Installation on the Lilypond webpage](http://www.lilypond.org/unix.html)

1. Right click the link and save it as `filename.sh` (for example save as `lilypond-2.18.2-1.linux-64.sh`)
2. Open a terminal and go to the directory into which the `.sh` file was downloaded (by default ~/Downloads), e.g.,
```
cd ~/Downloads
chmod +x lilypond-2.16.2-1.linux-64.sh
sudo ./lilypond-2.16.2-1.linux-64.sh
```

###Installation for Windows
[Read Windows Installation on the Lilypond webpage](http://www.lilypond.org/windows.html)

Download the `.exe` file and run it to launch the installation process.

###Installation for Mac OS
1. Open the `.tar.bz2` file once it gets downloaded.
 <img src="\images\ly_mac_1.png"></img>
2. Clicking it will, open the `Archive Utility` and extract it's contents.
 <img src="\images\ly_mac_2.png"></img>
3. After they have been extracted, you will see a `LilyPond application` file in the directory that pops up.
4. Drag and drop this file to the `Applications` on the left pane.
 <img src="\images\ly_mac_3.png"></img>
5. This will now enable you to see the "LilyPond" in your applications, i.e. It will get installed and you can drag and drop it from there to your dock, in order to have a shortcut for `LilyPond` in the dock.
6. You can double-click it to run the program.
 <img src="\images\ly_mac_4.png"></img>
7. Alternatively, run it from a [terminal](http://guides.macrumors.com/Terminal) with the command `open -a LilyPond`.
 <img src="\images\ly_mac_5.png"></img>

##Generating LilyPond files from Music Blocks
<img src='https://rawgit.com/Daksh/guides/master/lywithmb//images/save_as_ly_bt.svg'</img>

*save as lilypond block*

As you play music in Music Blocks, the notes you play are stored in a cache. The `save as lilypond` block is used to transcribe the notes in the cache into a `.ly` file.

**Note**: Use the <img
src="https://rawgit.com/Daksh/guides/master/lywithmb//images/eraser_bt.svg" height="36"</img> (Erase button)  to clear the cache before you run your project to ensure you only get the notes from that project.

###Microphone Analogy
You can imagine this feature as a microphone. It starts recording as soon as you start the activity. So each time that you play a sound, it gets recorded in memory. When you run the `save as lilypond` button, a copy of all what it has recorded up until in the specified file.

If you want to clear the memory, press the Erase button on the main menu.
Let us imagine a scenario:
```
tone_played: Do
tone_played: Re
save_button pressed
tone_played: Do
save_button pressed
chunk_played: Mi Fa
save_button pressed
eraser_button pressed
save_button pressed
chunk_played: Mi Fa
save_button pressed
```
So that would output something like:
```
Do Re
Do Re Do
Do Re Do Mi Fa
```

```

Mi Fa
```

**Hint:** Everytime the save button gets pressed, the `.ly` file gets downloaded
<img src="\images\ly_from_mb_download.png"></img>


##Using LilyPond

###For Linux

1. Open a Terminal
2. Go to the directory into which you have exported the `filename.ly` file from Music Blocks (by default `~/Downloads`).
3. Run the command `lilypond filename.ly`. 
4. This will generate a `.pdf` file in the same directory.
 
###For Windows
1. Copy the generated `filename.ly` file to desktop.
2. Drag and drop this file on the LilyPond shortcut.
<img src="\images\ly_windows_1.png"></img>
3. The `.pdf` and logs are created and can be found on the desktop.
<img src="\images\ly_windows_2.png"></img>

###For Mac OS X
#####Compile (with LilyPad)

1. Open `LilyPond.app` by double clicking it.
2. Close the example file which it opens.
3. Use `File > Open` to open your `.ly` file:

   <img src="\images\ly_use_mac_1.png"></img>
4. From the menu along the top left of your screen, select `Compile > Typeset`

   <img src="\images\ly_use_mac_2.png"></img>

5. A new window will open showing a progress log of the compilation of the file you have just saved.

   <img src="\images\ly_use_mac_3.png"></img>

#####View output
Once the compilation has finished, a `.pdf` file will be created with the same name as the original file. This file will be automatically opened in the default PDF viewer and displayed on your screen.

   <img src="\images\ly_use_mac_4.png"></img>

If the `.pdf` file is not displayed check the window with the progress log for any errors.

You must save any new edits you make to your file before you `Compile > Typeset` and if you are not using the default Preview PDF viewer that comes with the Mac Operating system and you have the `.pdf` file generated from a previous compilation open, then any further compilations may fail to generate an update `.pdf` until you close the original.

##Using Frescobaldi
Optionally, you can install `frescobaldi` a Graphical User Interface [(GUI)](https://en.wikipedia.org/wiki/Graphical_user_interface) for LilyPond.

###For Linux

1. Open a terminal and run the command: `sudo apt-get install frescobaldi`. 
2. To use frescobaldi, run the command `frescobaldi`. 
3. Drag and drop `.ly` files onto the window it launches.

###For Windows

1. For Windows a [full installer](https://github.com/wbsoft/frescobaldi/releases) is available, which contains all of the components needed by Frescobaldi (e.g., the "Frescobaldi.Setup.2.x.x.exe" file). 
 
 **Note**: It might be necessary to install the [Visual C++ 2008 runtime module](http://www.microsoft.com/en-us/download/details.aspx?id=29) from Microsoft.

2. When the installation is completed, you will see the Frescobaldi icon in the Start Menu.
3. Once you open the newly installed software, you can just drag and drop your `.ly` file onto it, to start editing.

###For Mac OS X
1. Download the [DMG disk images](https://github.com/wbsoft/frescobaldi/releases).
 (64 bit and 32 bit versions are provided (the "Frescobaldi-2.x.x-x86_64.dmg" and "Frescobaldi-2.x.x-i386.dmg" files, respectively)
2. Click to open the downloaded `.dmg` file.
 <img src="\images\frescobaldi_mac_1.png"></img>
3. This will open up a pop up in which you can see the `Applications` shortcut and the Frescobaldi logo, drag the logo onto the Applications shortcut.
 <img src="\images\frescobaldi_mac_2.png"></img>
4. Doing that will take you to the `Applications` folder and you can drop it there.
 <img src="\images\frescobaldi_mac_3.png"></img>

####Alternative install via Homebrew or MacPorts
1. If you have not already installed [Homebrew](http://brew.sh/) or [MacPorts](https://www.macports.org/), choose one of them and install.
2. You should have [LilyPond](#installation-for-mac-os) installed.
3. To install Frescobaldi, open a [Terminal](http://guides.macrumors.com/Terminal) and enter the command for the package manager you installed:
    1. Homebrew: `brew install frescobaldi --without-lilypond` (if you omit `--without-lilypond`, Homebrew will install also a copy of LilyPond, but this is not recommended).
    2. MacPorts: `sudo port install frescobaldi`
    3. After the installation, Frescobaldi’s launcher script will be in your `$PATH`, so you’ll be able to launch Frescobaldi by entering `frescobaldi` in a Terminal.
 
#####Application bundle
The installation process generates also the application bundle Frescobaldi.app, that can be used to launch Frescobaldi.
* Homebrew: you’ll see a couple of commands at the end of the installation process, that you can copy and paste in order to link the application bundle into your `~/Applications` or `/Applications` directory.
* MacPorts: you can find the application bundle inside the `/Applications/MacPorts` directory.

If you don’t want the application bundle, you should install with the command:
* Homebrew: `brew install frescobaldi --without-lilypond --without-launcher`
* MacPorts: `sudo port install frescobaldi -app`

####LilyPond and Frescobaldi
If you installed LilyPond in the usual location, i.e. you copied the application bundle `LilyPond.app` into the `/Applications` directory, Frescobaldi should automatically recognize it and you should be able to compile your LilyPond source files right away. If for some reasons this doesn’t happen, you need to point Frescobaldi to the correct location: go to “LilyPond Preferences” in Frescobaldi’s preferences, click “Add…” and either click the directory icon and select LilyPond’s application bundle or directly insert its path (the typical value is `/Applications/LilyPond.app`).

###How Frescobaldi and Lilypond work together
[Frescobaldi](http://frescobaldi.org/uguide.html) is a lightweight, yet powerful, music and text editor with many features added and enhanced particularly for LilyPond. Major features include point-and-click links between the code and music views, detailed score wizards, built in LilyPond documentation browser, syntax highlighting and automatic completion. Frescobaldi is written in [Python](https://wiki.python.org/moin/), with [PyQt4](https://wiki.python.org/moin/PyQt4) for its user interface. It acts as a front-end for the Lilypond software, as it helps in editing the input file given to be processed and helps to check the output `pdf` simultaneously. The conversion at the back of Frescobaldi, is done with LilyPond itself.

##Editing LilyPond Files
###Editing the header
You can customize your LilyPond output by adding your own name, the title of your musical creation, and your intended copyright to the `.ly` file. To do so, open `filename.ly` in a text editor and change the header, e.g.,
```
\header {
   dedication = "To my best friend Someone"
   title = "The Last One"
   subtitle = "Breathless"
   instrument = "Guitar"
   composer = "Mr. ABC XYZ"
   copyright = "Mr. Mouse (c) 2015 -- CC-BY-SA"
   tagline = "Made from Music Blocks v.0.9"
}
```
###Editing other fields
Similarly, you can change the meter, add [MIDI instruments](http://lilypond.org/doc/v2.18/documentation/notation/midi-instruments), add a Guitar Tab Section, and add MIDI Section.
**Note**: Comments in `.ly` files are made by using a `%` at the start of a line of text.

###References
More customization details are found in the .ly file. Further references include:
* [Text Input](http://lilypond.org/text-input.html)
* [Learning Manual](http://lilypond.org/doc/v2.18/Documentation/learning/index.html)
* [Music Glossary](http://www.lilypond.org/doc/v2.19/Documentation/music-glossary/)
* [Freely sharable music notation generated with LilyPond](http://www.mutopiaproject.org/)
* [Lilypond output in a web browser](https://www.tunefl.com/)

##Example: Making a `.ly` file from Music Blocks and Output
<img src='https://rawgit.com/Daksh/guides/master/lywithmb//images/example.svg'</img>

The `save as lilypond` block will transcribe your composition. The
output of the program above is saved to `~/Downloads/hotdog.ly.`

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

<img src='\images\sheetmusic.png'</img>

##Example: Blank `.ly` file
```
\version "2.18.2"

% <comments removed>
\header {
   dedication = "Made with LilyPond and Music Blocks (https://musicblocks.sugarlabs.org)"
   title = "My Music Blocks Creation"
%   subtitle = "Subtitle"
%   instrument = "Instrument"
   composer = "Mr. Mouse"
%   arranger = "Arranger"
   copyright = "Mr. Mouse (c) 2015 -- CC-BY-SA"
   tagline = "Made from Music Blocks v.0.9"
}

meter = {
   \time 3/4
   \key c \minor
   \numericTimeSignature
   \partial 4 
   \tempo "Andante" 4=90
}

\score {
   <<


% GUITAR TAB SECTION
% Delete the %{ and %} below to include guitar tablature output.
%{
      \new TabStaff = "guitar tab" 
      <<
         \clef moderntab
      >>
%}

   >>
   \layout {}

% MIDI SECTION
% Delete the %{ and %} below to include MIDI output.
%{
\midi {
   \tempo 4=90
}
%}

}

% MUSIC BLOCKS CODE
% Below is the code for the Music Blocks project that generated this Lilypond file.
%{

[[0,["start",{"collapsed":false,"xcor":0,"ycor":0,"heading":0,"color":0,"shade":50,"pensize":5,"grey":100}],250,150,[null,null,null]],
[1,["pitch",{}],705.5,128.5,[null,2,3,null]],
[2,["solfege",{"value":"sol"}],779,128.5,[1]],
[3,["number",{"value":4}],779,160,[1]],
[4,["savelilypond",{}],324.5,363.5,[null,5,null]],
[5,["text",{"value":"tada.ly"}],458,363.5,[4]]]
%}

```

##Testing
You can use the following two files `test1.ly` and `test2.ly` to check if LilyPond and Frecobaldi installed properly:

**test1.ly**
```
\version "2.18.2"
{
  c' e' g' e'
}

```

**test2.ly**
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

#License
This work is licensed under the [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/)

###Contributors:
Daksh Shah - 2015