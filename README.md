# Music Blocks

“_All musicians are subconsciously mathematicians._” — Monk

“_Music is a hidden arithmetic exercise of the soul, which does not know that it is counting._” —
Leibniz

Music Blocks is a _Visual Programming Language_ and collection of _manipulative tools_ for exploring musical and mathematical concepts in an integrative and fun way.

**Refer the following sections below to get familiar with this project:**

- [Running Music Blocks](#RUNNING_MUSIC_BLOCKS)
- [How to set up a local server](#HOW_TO_SET_UP_A_LOCAL_SERVER)
- [Using Music Blocks](#USING_MUSIC_BLOCKS)
- [Modifying Music Blocks](#MODIFYING_MUSIC_BLOCKS)
- [Reporting Bugs](#REPORTING_BUGS)
- [Contributing](#CONTRIBUTING)
- [Credits](#CREDITS)
- [Music Blocks in Japan](#MUSIC_BLOCKS_IN_JAPAN)

## Screenshots

![alt tag](./res/screenshots/Screenshot-1.png)

![alt tag](./res/screenshots/Screenshot-2.png)

Some background on why music and programming can be found [here](./WhyMusicBlocks.md).

## <a name="RUNNING_MUSIC_BLOCKS"></a>Running Music Blocks

Music Blocks is available under the _GNU Affero General Public License (AGPL) v3.0_, a free,
copyleft license.

Music Blocks is designed to run in a web browser. The ideal way to run Music Blocks is to visit the
URL [_musicblocks.sugarlabs.org_](https://musicblocks.sugarlabs.org) in your browser —
_Google Chrome_ (or _Chromium_), _Microsoft Edge_ (_Chromium-based_), _Mozilla Firefox_, and
_Opera_ work best.

To run from the latest master branch (experimental), visit
[_sugarlabs.github.io/musicblocks_](https://sugarlabs.github.io/musicblocks).

## <a name="HOW_TO_SET_UP_A_LOCAL_SERVER"></a>How to set up a _local server_

Music Blocks is written using native browser technologies. The bulk of the functionality is in
vanilla _JavaScript_. This means that most of the functionality can be accessed by launching the
[index.html](./index.html) file in the browser using `file:///absolute/path/to/index.html`.

However, using so, some functionality will not be available. On top of that, some web browsers
(e.g., Firefox v68) have restrictions that prevent Music Blocks from running using `file:///`.
Therefore, it is best to launch a _local web server_ from the directory of Music Blocks.

1. [Download](https://github.com/sugarlabs/musicblocks/archive/master.zip) Music Blocks, or clone
(`https://github.com/sugarlabs/musicblocks.git` for _HTTPS_, or
`gh repo clone sugarlabs/musicblocks` for _GitHub CLI_), on your local machine.

2. In a terminal, `cd` to the directory where you downloaded/cloned Music Blocks, using
`cd path/to/musicblocks/`.

3. If you do not have [_Python_](https://www.python.org) installed, you'll need to install it.
You can test for Python in a terminal using `python`. Type `exit()` to exit Python. (Note that on
some older Linux systems, the `python3` command is not bound to python. You may need to perform a
`sudo apt install python-is-python3` on Debian-like distros, or equivalent on others.)

4. After cloning the musicblocks repository, run

    for _Linux_ and _macOS_:

    ```bash
    python -c \"import os, sys; os.system('python -m SimpleHTTPServer 3000 --bind 127.0.0.1') if sys.version_info.major==2 else os.system('python -m http.server 3000 --bind 127.0.0.1');
    ```

    for _Windows_:

    ```bash
    py -c \"import os, sys; os.system('py -m SimpleHTTPServer 3000') if sys.version_info.major==2 else os.system('py -m http.server 3000 --bind 127.0.0.1');
    ```

    If you have `npm` installed, simply run `npm run serve` for Linux and macOS, and
    `npm run winserve` for Windows.

    **NOTE:** _Make sure you can run either `python` or `py` from your terminal, to launch the
    Python prompt._

5. You should see a message `Serving HTTP on 127.0.0.1 port 3000 (http://127.0.0.1:3000/) ...` since
the HTTP Server is set to start listening on port 3000.

6. Open your favorite browser and visit `localhost:3000` or `127.0.0.1:3000`.

**NOTE:** _Use `ctrl + c` or `cmd + c` to quit the HTTP Server to avoid
`socket.error:[Errno 48]`_.

## <a name="USING_MUSIC_BLOCKS"></a>Using Music Blocks

Once Music Blocks is running, you'll want suggestions on how to use it. Follow
[Using Music Blocks](./documentation/README.md) and [Music Blocks Guide](./guide/README.md).

Looking for a block? Find it in the
[Palette Tables](./guide/README.md#APPENDIX_1).

## <a name="MODIFYING_MUSIC_BLOCKS"></a>Modifying Music Blocks

The core functionality for Music Blocks resides in the [`js/` directory](./js/). Individual
modules are described in more detail in [js/README.md](./js/README.md).

**NOTE:** As for any changes, please make your own copy by cloning this
[repository](https://github.com/sugarlabs/musicblocks.git). Make your changes, test them, and then
make a pull request.

See [Contributing Code](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md)
to get a general idea about this organizations guidelines. See [Contributing](#CONTRIBUTING)
section for specific details about this repository.

## <a name="REPORTING_BUGS"></a>Reporting Bugs

Bugs can be reported in the [issues tab](https://github.com/sugarlabs/musicblocks/issues) of this
repository.

If possible, please include the browser _console log output_, and _steps to reproduce_, when
reporting bugs. To access the console, type `Ctrl-Shift-J`/`F12` on most browsers. Alternately,
_right click_ and select `Inspect`. You may need to set the `Default levels` for the console to
`Verbose` in order to see all of the output, however, in most cases that won't be required. In fact,
it'll only clutter the list, so select it only when required.

## <a name="CONTRIBUTING"></a>Contributing

Please consider contributing to the project, with your ideas, your music, your lesson plans, your
artwork, and your code.

Programmers, please follow these general
[guidelines for contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).

### Special Notes

Music Blocks is being built from the ground-up, to address several architectural problems with this
run. Since Music Blocks is a fork of Turtle Blocks JS, musical functionality was added on top of it.
However, music is fundamental to Music Blocks. Besides, the Turtle Blocks JS started initially with
handful of features, and was written without a complex architecture. As Music Blocks got built on
top of that, it got incrementally complex, but the architecture remained simple, thus resulting in a
monolith. Also, the functionality is tightly coupled with the interface and native client API (Web
API).

Keeping these problems in mind, we have considered a foundational rebuild that will address all
these issues, whilst adding buffers for future additions. We'll also be using a more elegant
tech-stack to develop and maintain this project given its scale. After the core is built, we'll be
porting features from this application to it.

### New Contributors

Use the [discussions](https://github.com/sugarlabs/musicblocks/discussions) tab at the top of the
repository to:

- Ask questions you’re wondering about.
- Share ideas.
- Engage with other community members.

Feel free. But, please don't spam :p.

### Keep in Mind

1. Your contributions need not necessarily have to address any discovered issue. If you encounter
any, feel free to add a fix through a PR, or create a new issue ticket.

2. Use [labels](https://github.com/sugarlabs/musicblocks/labels) on your issues and PRs.

3. Do not spam with lots of PRs with little changes.

4. If you are addressing a bulk change, divide your commits across multiple PRs, and send them one
at a time. The fewer the number of files addressed per PR, the better.

5. Communicate effectively. Go straight to the point. You don't need to address anyone using
'_sir_'. Don't write unnecessary comments; don't be over-apologetic. There is no superiority
hierarchy. Every single contribution is welcome, as long as it doesn't spam or distract the flow.

6. Write useful, brief commit messages. Add commit descriptions if necessary. PR name should speak
about what it is addressing and not the issue. In case a PR fixes an issue, use `fixes #ticketno` or
`closes #ticketno` in the PR's comment. Briefly explain what your PR is doing.

7. Always test your changes extensively before creating a PR. There's no sense in merging broken
code. If a PR is a _work in progress (WIP)_, convert it to draft. It'll let the maintainers know it
isn't ready for merging.

8. Read and revise the concepts about programming constructs you're dealing with. You must be clear
about the behavior of the language or compiler/transpiler. See
[JavaScript docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

9. If you have a question, do a _web search_ first. If you don't find any satisfactory answer, then
ask it in a comment. If it is a general question about Music Blocks, please use the new
[discussions](https://github.com/sugarlabs/musicblocks/discussions) tab on top the the repository,
or the _Sugar-dev Devel <[sugar-devel@lists.sugarlabs.org](mailto:sugar-devel@lists.sugarlabs.org)>_
mailing list. Don't ask silly questions (unless you don't know it is silly ;p) before searching it
on the web.

10. Work on things that matter. Follow three milestones: `Port Ready`, `Migration`, and `Future`.
Those tagged `Port Ready` are priority. Those tagged with `Migration` will be taken care of during
or after the foundation rebuild. Feel free to participate in the conversation, adding valuable
comments. Those tagged with `Future` need not be addressed presently.

_Please note there is no need to ask permission to work on an issue. You should check for pull
requests linked to an issue you are addressing; if there are none, then assume nobody has done
anything. Begin to fix the problem, test, make your commits, push your commits, then make a pull
request. Mention an issue number in the pull request, but not the commit message. These practices
allow the competition of ideas (Sugar Labs is a meritocracy)._

## <a name="CREDITS"></a>Credits

Music Blocks is a fork of [Turtle Blocks JS](https://github.com/sugarlabs/turtleblocksjs) created by
_Walter Bender ([@walterbender](https://github.com/walterbender))_.

[_Devin Ulibarri_](http://www.devinulibarri.com/) has contributed functional and user-interface
designs. Many of his contributions were inspired by the music education ideas, representations and
practices (e.g. aspects of matrix, musical cups) developed and published by
[_Larry Scripp_](http://www.larryscripp.net/) with whom _Devin_ studied at New England Conservatory
and for whom he worked at Affron Scripp & Associates, LLC,
[Center for Music and the Arts in Education (CMAIE)](http://centerformie.org/), and
[Music in Education](http://music-in-education.org/). Some of the initial graphics were contributed
by [_Chie Yasuda_](http://www.chieyasuda.com).

Much of the initial coding specific to Music Blocks was done by
_Yash Khandelwal ([@khandelwalYash](https://github.com/khandelwalYash))_ as part of Google Summer of
Code (GSoC) 2015. _Hemant Kasat ([@hemantkasat](https://github.com/hemantkasat))_ contributed to
additional widgets as part of GSoC 2016. Additional contributions were made by
_Tayba Wasim ([@Tabs16](https://github.com/Tabs16))_,
_Dinuka Tharangi Jayaweera ([@Tharangi](https://github.com/Tharangi))_,
_Prachi Agrawal ([@prachiagrawal269](https://github.com/prachiagrawal269))_,
_Cristina Del Puerto ([@cristinadp](https://github.com/cristinadp))_,
and _Hrishi Patel ([@Hrishi1999](https://github.com/Hrishi1999))_ as part of GSoC 2017. During GSoC
2018, _Riya Lohia ([@riyalohia](https://github.com/riyalohia))_ developed a Temperament widget.
_Ritwik Abhishek ([@a-ritwik](https://github.com/a-ritwik))_ added a keyboard widget and a
pitch-tracking widget. During GSoC 2019, _Favor Kelvin ([@fakela](https://github.com/fakela))_
refactored much of the code to use promises. During GSoC 2020,
_Anindya Kundu ([@meganindya](https://github.com/meganindya))_ did a major refactoring of the code
base to support JavaScript export. _Aviral Gangwar ([@aviral243](https://github.com/aviral243))_
enhanced the internal representation of mode and key.
_Saksham Mrig ([@sksum](https://github.com/sksum))_ fixed 70+ bugs and added support for pitch
tracking and MIDI import.

Many students contributed to the project as part of Google Code-in (2015&ndash;2019).
_Sam Parkinson ([@samdroid-apps](https://github.com/samdroid-apps))_ built the Planet during GCI.
_Emily Ong ([@EmilyOng](https://github.com/EmilyOng))_ designed our mouse icon and
_Euan Ong ([@eohomegrownapps](https://github.com/eohomegrownapps))_
redesigned the Planet code as a series of GCI tasks.
_Austin George ([@aust-n](https://github.com/aust-n))_ refactored the toolbars as a series of GCI
tasks. _Bottersnike ([@Bottersnike](https://github.com/Bottersnike))_ redesigned the widgets and the
Block API, _Andrea Gonzales ([@AndreaGon](https://github.com/AndreaGon))_ made the widgets
responsive, _Marcus Chong ([@pidddgy](https://github.com/pidddgy))_ refactored the update code,
resulting in an order-of-magnitude improvement in CPU usage, and
_Samyok Nepal ([@nepaltechguy2](https://github.com/nepaltechguy2))_ updated the local storage
mechanism to use localForage.

A full list of [contributors](https://github.com/sugarlabs/musicblocks/graphs/contributors) is
available.

## <a name="MUSIC_BLOCKS_IN_JAPAN"></a>Music Blocks in Japan

[Gakken STEAM](https://gakken-steam.jp/music_blocks/)
