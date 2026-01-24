### Current Behavior

The "Number" palette in MusicBlocks currently supports basic arithmetic operations such as addition, subtraction, multiplication, division, modulo, power, square root, and absolute value. 

However, it lacks:
1.  **Trigonometric functions** (Sine, Cosine, Tangent, and their inverses), which are essential for creating circular/geometric visual patterns and complex wave synthesis.
2.  **Logarithmic functions** (Natural Log, Log base 10), which are crucial for understanding pitch-frequency relationships and decibel scales.
3.  **Mathematical constants** (Pi, E) available as direct blocks.

Additionally, there is no automated workflow to build and release the application executables (for Windows, macOS, Linux) when a new version tag is pushed.

### Desired Behavior

1.  **Expanded Math Palette**: The "Number" palette should include the following new blocks:
    *   **Trigonometry**: `sin`, `cos`, `tan` (taking input in degrees), `arcsin`, `arccos`, `arctan` (returning output in degrees).
    *   **Logarithms**: `ln` (natural log), `log` (base 10).
    *   **Constants**: `π` (Pi), `e` (Euler's number).
2.  **Automated Releases**: Pushing a tag starting with `v` (e.g., `v1.0.1`) to the repository should trigger a GitHub Action that automatically builds and publishes the Electron app artifacts.

### Screenshots / Mockups

*New blocks appearing in the Number palette:*
*   **[ sin ]**
*   **[ cos ]**
*   **[ tan ]**
*   **[ arcsin ]**
*   **[ arccos ]**
*   **[ arctan ]**
*   **[ ln ]**
*   **[ log ]**
*   **[ π ]**
*   **[ e ]**

### Implementation

1.  **Math Utilities (`js/utils/mathutils.js`)**:
    *   Added static methods: `doSin`, `doCos`, `doTan`, `doArcSin`, `doArcCos`, `doArcTan`, `doLn`, `doLog`, `doPI`, `doE`.
    *   Implemented error handling for invalid inputs (e.g., `NaNError`).

2.  **Block Definitions (`js/blocks/NumberBlocks.js`)**:
    *   Created new classes inheriting from `LeftBlock`: `SinBlock`, `CosBlock`, `TanBlock`, `ArcSinBlock`, `ArcCosBlock`, `ArcTanBlock`, `LnBlock`, `LogBlock`, `PiBlock`, `EBlock`.
    *   Registered these blocks in `setupNumberBlocks`.

3.  **CI/CD (`.github/workflows/release.yml`)**:
    *   Created a GitHub Actions workflow using `electron-builder` to build for `ubuntu-latest`, `windows-latest`, and `macos-latest`.

### Acceptance Tests

1.  **Unit Tests**:
    *   Ran `js/blocks/__tests__/NumberBlocks.test.js` to verify:
        *   `sin(90)` returns `1`.
        *   `cos(0)` returns `1`.
        *   `tan(45)` returns `1`.
        *   `log(100)` returns `2`.
        *   `ln(e)` returns `1`.
2.  **Manual Verification**:
    *   Open MusicBlocks.
    *   Drag a `sin` block, attach a number `90`. Result should be `1`.
    *   Drag a `π` block. Result should be approx `3.14159`.

### Environment

-   Operating System: Windows
-   Browser (if applicable): N/A (Electron / Headless for tests)
-   Version of Software/Project: Current `master` branch

### Additional Information

These additions align MusicBlocks with other educational coding platforms like Scratch and Snap!, which provide these standard mathematical functions.

### Checklist

-   [x] I have read and followed the project's code of conduct.
-   [x] I have searched for similar issues before creating this one.
-   [x] I have provided all the necessary information to understand and reproduce the issue.
-   [x] I am willing to contribute to the resolution of this issue.
