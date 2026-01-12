# Timeline Widget Testing Guide

## Opening the Timeline Widget

To test the timeline widget, you can use the browser console to open it manually.

### Method 1: Using Browser Console

1. Start Music Blocks:
   ```bash
   npm run serve
   ```

2. Open `http://127.0.0.1:3000` in your browser

3. Open the browser console (F12 or right-click → Inspect → Console)

4. Run the following command to open the timeline widget:
   ```javascript
   globalActivity.logo.timeline = new Timeline();
   globalActivity.logo.timeline.init(globalActivity);
   ```

## Testing the Playhead

1. After opening the timeline widget, create a simple music program:
   - Drag a "Start" block onto the canvas
   - Add some "Note" blocks inside it

2. Press the Play button (▶) in the toolbar

3. Observe the timeline widget:
   - The playhead (red vertical line) should move across the timeline
   - The movement should be synchronized with the music playback

4. Press Stop and Play again to verify the playhead resets

## Expected Behavior

- **Widget Window**: A window titled "timeline" should appear with a canvas
- **Timeline**: A horizontal gray line across the canvas
- **Playhead**: A red vertical line with a circle at the top that moves during playback
- **Smooth Animation**: The playhead should move smoothly using requestAnimationFrame
- **No Side Effects**: Music playback should work exactly as before

## Troubleshooting

If the widget doesn't appear:
- Check the browser console for errors
- Verify that `Timeline` class is loaded (type `Timeline` in console)
- Ensure `globalActivity` is available (type `globalActivity` in console)

If the playhead doesn't move:
- Verify music is playing
- Check that `globalActivity.turtles.ithTurtle(0).singer.currentBeat` is updating
- Look for console errors during playback
