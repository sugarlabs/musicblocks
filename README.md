MUSIC BLOCKS
============

“All musicians are subconsciously mathematicians” – Monk

“Music is a hidden arithmetic exercise of the soul, which does not
know that it is counting.” ~ Leibniz

Music Blocks is a programming language and collection of manipulative
tools for exploring musical and mathematical concepts in an
integrative and fun way.

**Refer the following sections below to get familiar with this awesome project:**

* [Running Music Blocks](#RUNNING_MUSIC_BLOCKS)
* [How to set up a local server](#HOW_TO_SET_UP_A_LOCAL_SERVER)
* [Using Music Blocks](#USING_MUSIC_BLOCKS)
* [Modifying Music Blocks](#MODIFYING_MUSIC_BLOCKS)
* [Credits](#CREDITS)
* [Reporting Bugs](#REPORTING_BUGS)
* [Contributing](#CONTRIBUTING)
* [Music Blocks in Japan](#MUSIC_BLOCKS_IN_JAPAN)

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

(4) You should see a message: <code>Serving HTTP on 127.0.0.1 port 3000
...</code> since the HTTPServer is set to start listening on Port
3000.

(5) Open your favorite browser and run <code>localhost:3000</code> or
<code>127.0.0.1:3000</code>.

NOTE: Use **ctrl + c** to quit the **HTTPServer** to avoid
**socket.error:[Errno 48]**.

## <a name="USING_MUSIC_BLOCKS"></a>Using Music Blocks

Once Music Blocks is running, you'll want suggestions on how to use it.
See [Using Music
Blocks](http://github.com/sugarlabs/musicblocks/tree/master/documentation/README.md)
and [Music Blocks
Guide](http://github.com/sugarlabs/musicblocks/tree/master/guide/README.md).

Looking for a block? Find it in the [Palette
Tables](https://github.com/sugarlabs/musicblocks/blob/master/guide/README.md#APPENDIX_1).

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
(2015&ndash;2020). Sam Parkinson built the Planet during GCI. Emily
Ong designed our mouse icon and Euan Ong redesigned the Planet code as
a series of GCI tasks.  Austin George refactored the toolbars as a
series of GCI tasks. Bottersnike redesigned the widgets and the Block
API, AndreaGon made the widgets responsive, Pidddgy refactored the
update code, resulting in an order-of-magnitude improvement in CPU
usage, and Nepaltechguy2 updated the local storage mechanism to use
localforage.

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

Please note there is no need to ask permission to work on an
issue. You should check for pull requests linked to an issue you are
addressing; if there are none, then assume nobody has done
anything. Begin to fix the problem, test, make your commits, push your
commits, then make a pull request. Mention an issue number in the pull
request, but not the commit message. These practices allow the
competition of ideas (Sugar Labs is a meritocracy).

## <a name="MUSIC_BLOCKS_IN_JAPAN"></a>Music Blocks in Japan

[Gakken STEAM](https://gakken-steam.jp/music_blocks/)
