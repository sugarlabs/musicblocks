# Copyright (C) 2015 Sam Parkinson
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import re
import sys
import json

HELP = '''Usage:

    python pluginify.py (file)

or

    python pluginify.py (file) > plugin.json

Converts an RTP (readable TurtleBlocks plugin) file into a JSON file
to load into Turtle Blocks JS.  For more information, run
`python pluginify.py syntax`
'''

SYNTAX = '''

In an RST file, new blocks are not defined with braces (as is typical of
Javascript); rather they start whenever you add //* *// and their scope is
until the next block starts (or the end of file in the case that it is
the last block).

To add a comment, just type //* comment *// followed by your multi-
line comment. pluginify ignores comments, i.e., they are not added in
the JSON plugin.

Example:
//* comment *// Your single or multi line comment here...

Global variables are defined in a section //* globals *//.

Example:
//* globals *//
var calories = 0;
var protein = 0;
var carbohydrate = 0;
var fiber = 0;
var fat = 0;

Define all the global variables under the section
//* block-globals *//.

These definitions will be added to all the code blocks in the created
JSON output. Note that these "globals" included in each block but are
local in context to each block.

Example: You can define a common API Key to be used by all blocks.
//* block-globals *//
var mashapeKey = '(keycode)'; in globals.

You can also declare global variables specific to argument blocks that
get applied to a set of similar blocks, e.g., the variables under
//* arg-globals *// will be added to all the arg blocks.

Example:
//* arg-globals *//
var block = blocks.blockList[blk];
var connections = block.connections;

You can declare functions for parameter blocks to be evaluated when
the block labels are updated with the //* parameter:(blockname) *//
tag.

Example:
//* parameter:loudness *//
if (mic == null) {errorMsg("The microphone is not available.");
    value = 0;
} else {
    value = Math.round(mic.getLevel() * 1000);
}

To define a block you need to type: //* block:(blockname) *//

Example:
//* block:power *//
var block = new ProtoBlock('power');
block.palette = palettes.dict['maths'];
blocks.protoBlockDict['power'] = block;
block.twoArgMathBlock();
block.defaults.push(10, 2);
block.staticLabels.push('power', 'base', 'exp.');

You should also define a setter for a parameter block (if appropriate).
You can do this using the setter setion:

//* setter:myValue *//
myValue = value;
updateDisplayOfMyValue();

Macros are defined in in //* macro:(blockname) *//

Example:
//* macro: black *//
[[0, "setshade", 0, 0, [null, 1, null]], [1, ["number", {"value": 0}], 0, 0, [0]]]

Note the use of double quotes in the JSON-encoded object.

Graphical elements (icons, colors) are defined in the own sections:

Palette icons are defined as //* palette-icon:(palette name) *//

Example:
//* palette-icon:food *//
<svg ...> ... </svg>

Similarly for block colors:

Example:
//* palette-fill:food *// #FFFFFF
//* palette-stroke:food *// #A0A0A0
//* palette-highlight:food *// #D5D5D5

Plugins can specify code to be executed on load, on start, and on stop.
Example:

//* onload:foo *//
your code here...

NOTE: name of on load, on start, and on stop sections must match the
name of one of the plugin blocks.
'''


def clear():
    global NAMES, JS_TYPES, IMAGES
    NAMES = {
        'flow': 'FLOWPLUGINS',
        'arg': 'ARGPLUGINS',
        'block': 'BLOCKPLUGINS',
        'macro': 'MACROPLUGINS',
        'parameter': 'PARAMETERPLUGINS',
        'setter': 'SETTERPLUGINS',
        'onload': 'ONLOAD',
        'onstart': 'ONSTART',
        'onstop': 'ONSTOP',
        'palette-icon': 'PALETTEPLUGINS',
        'palette-fill': 'PALETTEFILLCOLORS',
        'palette-stroke': 'PALETTESTROKECOLORS',
        'palette-highlight': 'PALETTEHIGHLIGHTCOLORS',
        'palette-stroke-highlight': 'HIGHLIGHTSTROKECOLORS'}
    JS_TYPES = ('flow', 'arg', 'block', 'macro', 'parameter', 'setter', 'onload', 'onstart', 'onstop')
    # 'blkName': 'imageData',
    IMAGES = {}


def pluginify(data):
    clear()
    sections_list = data.split('//*')
    sections_pairs = []
    specific_globals = {x: '' for x in JS_TYPES}
    globals_ = None
    for section in sections_list:
        match = re.match('(.*)\*\/\/([^\0]*)', section.strip())
        if match:
            if match.group(1).strip() == 'globals':
                globals_ = match.group(2).strip()
            elif match.group(1).strip().endswith('-globals'):
                type_, _ = match.group(1).strip().split('-')
                specific_globals[type_] = specific_globals[type_] + \
                    match.group(2).strip()
            elif match.group(1).strip() == 'comment':
                continue
            else:
                sections_pairs.append((match.group(1).strip(),
                                       match.group(2).strip()))

    outp = {}
    if globals_ is not None:
        outp['GLOBALS'] = globals_.replace('\n', '').replace('var ', '')

    for key, value in sections_pairs:
        if len(key.split(':')) != 2:
            raise ValueError('Section names should have 1 colon (type:name)')
        type_, name = key.split(':')

        if type_ in JS_TYPES:
            value = specific_globals[type_] + value
        value = value.replace('\n', '')

        if type_ in NAMES:
            type_ = NAMES[type_]
            if type_ not in outp:
                outp[type_] = {}
            outp[type_][name] = value

        if type_ == 'image':
            # TODO: Detect if its png
            IMAGES[name] = 'data:image/svg+xml;utf8,' + value

    if IMAGES:
        outp['IMAGES'] = IMAGES

    return json.dumps(outp, indent=4)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print HELP
    elif sys.argv[1] in ('help', '-h', '--help'):
        print HELP
    elif sys.argv[1] == 'syntax':
        print SYNTAX
    else:
        with open(sys.argv[1]) as f:
            data = f.read()
        print pluginify(data)
