# MusicBlocks Debugger Guide

## Introduction

Debugging is a crucial skill for any programmer. The MusicBlocks JSeditor debugger tool is designed to help learners and educators understand, trace, and fix issues in their code by providing interactive, visual, and step-by-step debugging capabilities. This guide will walk you through all aspects of using the debugger in MusicBlocks.

---

## Key Features of the Debugger

1. **Breakpoint System:**

    - Set breakpoints directly in the JSeditor by clicking next to the line numbers.
    - Breakpoints are visually indicated and can be toggled on/off.

2. **Step-by-Step Execution:**

    - Use the “Run Slowly” or “Step” buttons to execute your program one step at a time.
    - Execution pauses at each breakpoint or debugger block.

3. **Variable Inspection:**

    - When execution pauses, you can create a status block, showing all user-defined and MusicBlocks variables.
    - The status block is automatically populated with relevant variables for easy inspection.

4. **Visual Block Integration:**

    - Breakpoints in code are converted to debugger blocks in the visual interface.
    - The currently executing block is highlighted for clear tracking.

5. **Flexible Debugging Controls:**
    - Resume, step, or stop execution at any paused point.
    - Debugger blocks only affect execution in debug modes (not during normal “Play”).

---

## Step-by-Step Guide to Debugging

### 1. Setting Breakpoints

-   **In the JSeditor:**  
    Click the area next to the line number where you want to pause execution. A breakpoint marker will appear.
-   **In Block View:**  
    Add a “debugger” block at the desired location in your block stack.

### 2. Running and Pausing

-   When your program hits a breakpoint or debugger block, execution will pause.
-   The currently executing block will be highlighted in the block view.

### 3. Inspecting Variables

-   Create a status block from the widget palette, and the status window will automatically pop up, displaying all variables.
-   You can see both user-defined and system variables (e.g., loop counters, music parameters).
-   The status block in the workspace will also show these variables.

### 5. Resuming or Stepping

-   Use the "run slowly" button to run to the next breakpoint.
-   Use the “Step” button to execute the next block or line.

### 6. Modifying and Re-running

-   You can edit your code or blocks while paused.
-   After making changes, restart the blocks to test your fixes.

---

## Best Practices for Effective Debugging

-   **Set Breakpoints Strategically:** Place breakpoints before and after sections where you suspect issues.
-   **Inspect Variables Frequently:** Check variable values at each pause to understand program state.
-   **Use Step Execution:** Step through loops and conditionals to see how your logic unfolds.
-   **Leverage Visual Feedback:** Follow the highlighted blocks to trace execution flow.
-   **Keep the Status Window Open:** It provides a live snapshot of all relevant variables.

---

## Advanced Tips

-   **Single Status Block:** Only one status block is active at a time to avoid confusion.
-   **Debugger Blocks in Block View:** You can manually add or remove debugger blocks for more granular control.
-   **Debugging Only in Debug Modes:** Debugger blocks and breakpoints only pause execution in debug/step modes, not during normal play.
-   **Automatic Variable Detection:** The debugger automatically includes all custom variables in the status block for you.

---
