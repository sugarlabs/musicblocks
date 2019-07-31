MUSIC BLOCKS
============

“All musicians are subconsciously mathematicians” – Monk

Music Blocks is a programming language and collection of manipulative tools for exploring
musical and mathematical concepts in an integrative and fun way.

![alt tag](https://raw.githubusercontent.com/sugarlabs/musicblocks/master/screenshots/Screenshot-1.png)

![alt tag](https://raw.githubusercontent.com/sugarlabs/musicblocks/master/screenshots/Screenshot-2.png)

Using Music Blocks
------------------

Music Blocks is available under the GNU Affero General Public License (AGPL), a free, copyleft license.

Music Blocks is designed to run in a web browser.

The easiest way to run Music Blocks is to open [Music
Blocks](https://musicblocks.sugarlabs.org) in your browser (Firefox,
Chrome, and Opera work best).

If you want to run Music Blocks offline,
[download](https://github.com/sugarlabs/musicblocks/archive/master.zip)
or [git clone](https://github.com/sugarlabs/musicblocks.git) this repo
and run through a local server.

How to set up the Local Server
-----------------------------
HTTPServer is set to start listening on port 3000

STEPS TO FOLLOW 
1)In your terminal, cd into the Music Blocks directory wish you to access via
browsers and HTTP.

1) Check if you have python installed on the terminal by typing `python` then you `exit()`
 
2) Run `npm run serve` after you hit enter you will see a message:

  `Serving HTTP on 0.0.0.0 port 3000 ...`

3)Open your favorite browser and put in any of the following addresses:
 
 `localhost:3000`
  `127.0.0.1:3000`

4)As long as the HTTP server is running, the terminal will update as data are
loaded from the Python web server. 


See [Using Music
Blocks](http://github.com/sugarlabs/musicblocks/tree/master/documentation/README.md)
and [Music Blocks
Guide](http://github.com/sugarlabs/musicblocks/tree/master/guide/README.md)

Credits
-------

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

Reporting Bugs
--------------

Bugs can be reported in the
[issues section](https://github.com/sugarlabs/musicblocks/issues)
of this repository.

Contributing
------------

Please consider contributing to the project, with your ideas, your
music, your lesson plans, your artwork, and your code.

Programmers, please follow these general [guidelines for
contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).


Performance Tools
-----------------

Performance tools used are in-browsers perfomance profiling and jsperf.com (https://jsperf.com/) 
Note: When running testing code on (https://jsperf.com/) tests should be run more than once 