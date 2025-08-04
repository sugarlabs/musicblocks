Sugar Graphics
==============

Sugar widgets and graphics, implementing the [Sugar Interface
Guidelines](http://wiki.sugarlabs.org/go/Human_Interface_Guidelines).

Modifying the CSS
-----------------

We use [LESS](http://lesscss.org) and then compile the CSS files.
This is to be able to use calculations and variables for colors and
measures. And to be able to output different CSS files for different
screen resolutions.

To compile the CSS files do:

    lessc graphics/css/sugar-96dpi.less graphics/css/sugar-96dpi.css
    lessc graphics/css/sugar-200dpi.less graphics/css/sugar-200dpi.css

Be sure to compile them before commit.

The grid helper
---------------

The grid is a visual debug tool that allows you to check if the
elements have the correct size. To activate the grid, open the
inspector console and paste the following.

If RequireJS is not in the page head (ie. in the sugar-web-samples),
load it:

    var script = document.createElement('script');
    script.src = 'lib/require.js';
    document.head.appendChild(script);

    requirejs.config({ baseUrl: "lib" });

Then do:

    require(["sugar-web/graphics/grid"], function (grid) { grid.addGrid(11) });
