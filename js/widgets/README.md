# How to add new widgets

This README describes how to add new widgets to Music Blocks.

**Note:** Almost all of the code associated with the widget itself is found in
`js/widgets`. The code that defines the block associated with the widget is
found in `js/blocks/WidgetBlocks.js`. Finally, files added to Music Blocks are
imported in `js/activity.js`.

Steps:

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

3. **Intialize the Class**
   Define the block that will be used to launch your widget in `js/blocks/WidgetBlocks.`
   Don't forget to initalize the class. (Look at the code towards the end of the file.)
   ```javascript

   new UniqueClass().setup(activity);
   ```

4. **Import the widget**
   In `js/activity.js`, import the widget code.
    ```javascript
    if (_THIS_IS_MUSIC_BLOCKS_) {
    const MUSICBLOCKS_EXTRAS = [
       ....
        "widgets/UniqueClassFileName",
    ];
}
   ```


**Hint:** When creating a new widget, look for an existing widget with
similar features. It is sometimes easier to fork than start building
from scratch.