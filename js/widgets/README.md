# How to add new widgets

This README describes how to add new widgets to Music Blocks.

**Note:** Almost all of the code associated with the widget itself is found in
`js/widgets`. The code that defines the block associated with the widget is
found in `js/blocks/WidgetBlocks.js`. Finally, files added to Music Blocks are
imported in `js/activity.js`.

## Steps:

1. **Create a new file that will define your widget:**
   Make a new file in `js/widgets` with a meaningful name.

2. **Define the Block Class:**
   Create a new class inside that file for your block.

    ```javascript
    class UniqueClass {
        // Blocks with some functionality
    }
    ```

    This class will contain the code that defines the behavior of your widget.

3. **Declare the widget's lazy-load dependencies:**
   If your widget is loaded lazily by `js/blocks/WidgetBlocks.js` (via
   `_ensureWidget()` or `_lazyLoadWidget()`), declare its AMD module id(s) as a
   `dependencies` property on the widget definition itself, rather than
   passing a literal array at the call site. The widget definition is the
   single source of truth for this list — `WidgetBlocks.js` reads
   `Widget.dependencies` instead of maintaining its own copy.

    `WidgetBlocks.js` offers two loading helpers, both sharing the same
    `(logo, widgetKey, modules, factory, ...)` argument shape and both
    built on the same AMD/CommonJS-aware `_lazyRequire()` primitive
    underneath — pick whichever matches where your block constructs its
    widget:

    - **`_ensureWidget(logo, widgetKey, modules, factory, turtle, blk, receivedArg)`**
      — for widgets constructed directly in `flow()`. Guards against
      concurrent loads, returns an interruption signal `[null, 0, true]`
      while the widget is loading, and calls `logo.runFromBlockNow(...)`
      once it's ready so the interpreter re-enters the block. Use this when
      the rest of the block's `flow()` logic depends on the widget already
      existing. This is the standard loading path — most widgets use it,
      e.g. `TemperamentWidget`.
    - **`_lazyLoadWidget(logo, widgetKey, modules, factory, onReady)`**
      — for widgets constructed inside a turtle listener (registered via
      `logo.setTurtleListener`) rather than in `flow()` itself. No guard or
      interruption signal: the listener already runs once, after the
      interpreter has moved on, so there's nothing for an interruption to
      interrupt. `onReady` runs after the widget is assigned to `logo`, for
      any cleanup that used to follow the assignment inline. Used by
      listener-deferred widgets that load only once their turtle listener
      fires, e.g. `MeterWidget`, `Oscilloscope`, and `ModeWidget`.

    Do not write a third, ad hoc lazy-loading pattern at a new call site —
    route through one of these two.

    For an ES6 class widget, use a `static` field:

    ```javascript
    class UniqueClass {
        static dependencies = ["widgets/UniqueClassFileName"];
        // Blocks with some functionality
    }
    ```

    For a constructor-function widget, assign the property on the function
    itself, since `static` class-field syntax doesn't apply:

    ```javascript
    function UniqueClass() {
        // Blocks with some functionality
    }
    UniqueClass.dependencies = ["widgets/UniqueClassFileName"];
    ```

4. **Initialize the Class**
   Define the block that will be used to launch your widget in `js/blocks/WidgetBlocks.`
   Don't forget to initialize the class. (Look at the code towards the end of the file.)

    ```javascript
    new UniqueClass().setup(activity);
    ```

5. **Import the widget**
   In `js/activity.js`, import the widget code.

    ```javascript
    if (_THIS_IS_MUSIC_BLOCKS_) {
        const MUSICBLOCKS_EXTRAS = ["widgets/UniqueClassFileName"];
    }
    ```

6. **Map the widget in `utils.js` for cleanup**
   To ensure your widget window automatically closes when its parent block is trashed, you must register its name in the `KEY_MAPPING` object inside the `closeBlkWidgets` function in `js/utils/utils.js`.

    ```javascript
    const KEY_MAPPING = {
        "Your Widget Block Name": "your widget window key"
    };
    ```

**Hint:** When creating a new widget, look for an existing widget with
similar features. It is sometimes easier to fork than start building
from scratch.
