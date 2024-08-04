# How to Add New Blocks in Widgets

This section describes how to add new blocks to Music Blocks in the Widget section.

**Note:** Almost all code related to Widget Blocks is located inside `js/widgets` and then intilalized  in the `js/blocks/WidgetBlocks.js` file and imported in `js/activity.js`.

1. **Create a New File:**
   Make a new file in `js/widgets` with a meaningful name.

2. **Define the Block Class:**
   Create a new class inside that file for your block.
   ```javascript
   class UniqueClass {
       // Blocks with some functionality  
   }
   ```
3. **Intialize the Class**
   Initalize the class in `js/blocks/WidgetBlocks.` go to last line and intilaize it 
   ```javascript

   new UniqueClass().setup(activity);
   ```

4. **Import the Class**
   Go to the `js/activity.js` to the Music block constants and import the your file
    ```javascript
    if (_THIS_IS_MUSIC_BLOCKS_) {
    const MUSICBLOCKS_EXTRAS = [
       ....
        "widgets/UniqueClassFileName",
  
    
    ];
    
}
   ```