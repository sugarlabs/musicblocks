# How to Add New Blocks in Widgets

This section describes how to add new blocks to Music Blocks in the Widget section.

**Note:** Almost all code related to Widget Blocks is located inside `js/widgets` and then imported into the `js/blocks/WidgetBlocks.js` file.

1. **Create a New File:**
   Make a new file in `js/widgets` with a meaningful name.

2. **Define the Block Class:**
   Create a new class inside that file for your block.
   ```javascript
   class UniqueClass {
       // Blocks with some functionality  
   }
   ```
3. Import the new class in the js/blocks/WidgetBlocks.js file at the bottom.
    ```
    new UniqueClass().setup(activity);

    ```