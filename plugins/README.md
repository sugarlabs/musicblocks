Plugins
=======

How to get plugins
------------------

You can find plugins in the [official app repository](https://github.com/sugarlabs/turtleblocksjs/tree/master/plugins).
The plugins are identified by the extension <code>**.json**</code>
You need to download the plugins for load it.
[(This guide will use this plugin)](https://github.com/sugarlabs/turtleblocksjs/blob/master/plugins/maths.json)

![Nutrition Plugin](https://github.com/sugarlabs/turtleblocksjs/raw/master/screenshots/foodplugin.png "The Nutrition plugin")

How to load plugins
-------------------

The Load Plugin button is found on the Secondary Toolbar (click the "hamburger" menu if it is not expanded) you will see this option:

![Load Plugin Button](https://github.com/sugarlabs/turtleblocksjs/raw/master/documentation/load-plugin-button.png)

Click it and a file chooser will appear. 

In the file chooser select a plugin file (they have
<code>**.json**</code> file suffixes) and click 'Open'.

The file will open and load new blocks into the palettes. Many plugins
define their own palettes, so you will likely see a new palette button
at the bottom of the column of buttons on the left side of the
screen. (In the case of the maths plugin, new blocks will be added to
a new palette, *maths*).

The plugin is saved in the browser local storage so you don't need to
reload it every time you run Music Blocks.

Note that you can delete a plugin by opening the plugin palette and then
clicking on the Delete Plugin button.

How to make a plugin
====================

Plugins allow developers add new palettes and blocks to support
additional functionality without having to make any changes to the
core code of Turtle Blocks. Anyone is free to create and distribute
extensions. If a plugin is present, it is loaded when the activity is
launched and any palettes or blocks defined by the plugin are made
available to the user.

Prerequisites
-------------

* It facilitates debugging if you have Music Blocks up and
  running. You can use the <code>npm run serve</code> command to launch
  a local instance of Music Blocks.

* To define the `blocks` in your plugin, you will need to know
  how to program in JavaScript. The blocks are defined in a dictionary
  element. (See [Guide for Adding Blocks](https://github.com/sugarlabs/musicblocks/blob/master/js/guide_addingblocks.md) for more details.)

* We provide a tool to help you compile psuedo-code into JSON (see the
  section on Pluginify below). But you may also want to at least
  familiarize yourself with [JSON](http://en.wikipedia.org/wiki/JSON)

* You may also want to familarize yourself with the Python plugin
  library [plugins in Turtle
  Art](http://wiki.sugarlabs.org/go/Activities/Turtle_Art/Plugins)

The Plugin Dictionary
---------------------

You should explore [some example
plugins](https://github.com/sugarlabs/turtleblocksjs/blob/master/README.md#Plugins)
and learn [how to install
them.](https://github.com/sugarlabs/turtleblocksjs/blob/master/README.md#how-to-load-plugins)

Plugins are a dictionary of JSON-encoded components that incorporates:
a flow-block dictionary, an arg-block dictionary, a block dictionary,
a globals dictionary, a palette dictionary, and color dictionaries.

* `flow-block`: commands that are evaluated when a flow block is run;

* `arg-block`: commands that are evaluated when an arg block is run;

* `block`: new blocks defined in the plugin;

* `globals`: globals that you can reference throughout your code. We
  discourage the used of globals, but we do provide a dictionary
  object where you can add objects you may want to share among the
  blocks that use your plugin. (If you do use a global, please use a
  unique name -- by convention, we have been prepending the plugin
  name to global variables, e.g., weatherSecretKey for the secret key
  used in the weather plugin.);

* `palette`: icons (in SVG format) associated with the palette;

* `fill-colors`: hex color of the blocks;

* `stroke-colors`: hex color for stroke of the blocks;

* `highlight-colors`: hex color of the blocks when they are
  highlighted.

Layout and Format
-----------------
<pre>
  <code>
  {
    "GLOBALS":{},
    "FLOWPLUGINS":{},
    "ARGSPLUGINS":{},
    "BLOCKPLUGINS":{},
    "PALETTEFILLCOLORS":{},
    "PALETTESTROKECOLORS":{},
    "PALETTEHIGHLIGHTCOLORS":{},
    "PALETTEPLUGINS":{}
  } 
  </code>
</pre>

Format for `PALETTEFILLCOLORS`, `PALETTEHIGHLIGHTCOLORS` and
`PALETTESTROKECOLORS`:
<pre><code>{"[palette name]":"[color hex code]"}</code></pre>
Example: ```"PALETTESTROKECOLORS":{"mashape":"#ef003e"}```

Format for `PALETTEPLUGINS`:
<pre><code>{"[palette name]":"[svg file code]"}</code></pre>
Example: ```"PALETTEPLUGINS":{"mashape":"<?xml version........</svg>"}```

Format for blocks:

<pre><code>"{[name of the block]":"code of the block"}</code></pre>
Example: ```"BLOCKPLUGINS":{"translate":"var ....", "detectlang":"var ....", "setlang":"var ...."}, ```

Pluginify
---------

You can use
[pluginify.py](https://github.com/sugarlabs/turtleblocksjs/blob/master/pluginify.py)
to convert a `.rtp` (Readable Turtle Blocks Plugin) to a `.json`
plugin.

Writing plugins directly in JSON is tedious. To make the job easier
for you, we have created the readable Turtle Blocks plugin (RTP)
format. The syntax is available in `python pluginify.py syntax`

[.rtp example](https://github.com/sugarlabs/turtleblocksjs/blob/master/plugins/finance.rtp)

Once you have made an RTP file it is time to convert it to JSON so
that it can be used in TurtleBlocksjs. To convert it to JSON, run
`python pluginify.py filename.rtp`

[.rtp syntax](https://github.com/sugarlabs/turtleblocksjs/blob/master/pluginify.py#L33)

References
----------
Valid blocks styles in turtleblocksjs:
* `zeroArgBlock`: E.g., penup, pendown
* `basicBlockNoFlow`: E.g., break
* `oneArgBlock`: E.g., forward, right
* `twoArgBlock`: E.g., setxy. These are expandable.
* `oneArgMathBlock`: E.g., sqrt
* `oneArgMathWithLabelBlock`: E.g., box
* `twoArgMathBlock`: E.g., plus, minus, multiply, divide. These are also expandable.
* `valueBlock`: E.g., number, string. Value blocks get DOM textareas associated with them so their values can be edited by the user.
* `mediaBlock`: E.g., media. Media blocks invoke a chooser and a thumbnail image is overlayed to represent the data associated with the block.
* `flowClampZeroArgBlock`: E.g., start. A "child" flow is docked in an expandable clamp. There are no additional arguments and no flow above or below.
* `flowClampOneArgBlock`: E.g., repeat. Unlike action, there is a flow above and below.
* `flowClampBooleanArgBlock`: E.g., if.  A "child" flow is docked in an expandable clamp. The additional argument is a boolean. There is flow above and below.
* `doubleFlowClampBooleanArgBlock`: E.g., if then else.  Two "child" flows are docked in expandable clamps. The additional argument is a boolean. There is flow above and below.
* `blockClampZeroArgBlock`: E.g., forever. Unlike start, there is flow above and below.
* `blockClampOneArgBlock`: E.g., action. A "child" flow is docked in an expandable clamp. The additional argument is a name. Again, no flow above or below.
* `booleanZeroArgBlock`: E.g., mouse button.
* `booleanOneBooleanArgBlock`: E.g., not
* `booleanTwoBooleanArgBlock`: E.g., and
* `booleanOneArgBlock`: E.g.,
* `booleanTwoArgBlock`: E.g., greater, less, equal.
* `parameterBlock`: E.g., color, shade, pensize

To use the block styles to create your blocks, let us go through [an example](https://github.com/sugarlabs/turtleblocksjs/blob/master/plugins/maths.json#L22)

```
//* block-globals *//
const simpleOneArgBlock = function (name, label, defaultValue) {
    if (label === undefined) { var label = name; }
    const block = new ProtoBlock(name);
    block.palette = globalActivity.palettes.dict['maths'];
    globalActivity.blocks.protoBlockDict[name] = block;
    block.staticLabels.push(label);
    block.adjustWidthToLabel();
    block.oneArgMathBlock();
    if (defaultValue === undefined) {
        block.defaults.push(1.0);
    } else {
        block.defaults.push(defaultValue);
    }
};

//* block:sin *//
simpleOneArgBlock('sin', 'sin', '3.14159');
//* arg:sin *//
mathBlock.value = Math.sin(logo.parseArg(logo, turtle, conns[1]));
```

Example plugins
---------------

[nutrition.json](https://github.com/sugarlabs/turtleblocksjs/blob/master/plugins/nutrition.json), [roti.json](https://github.com/sugarlabs/turtleblocksjs/blob/master/plugins/roti.json), [maths.rtp](https://github.com/sugarlabs/turtleblocksjs/blob/master/plugins/maths.rtp)
