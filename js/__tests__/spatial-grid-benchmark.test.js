/**
 * Benchmark: Spatial grid vs full-scan for nearest-dock lookup.
 *
 * Simulates the findBestConnection() hot path with realistic block
 * layouts at various project sizes and measures wall-clock time for
 * both the old O(N) linear scan and the new spatial-grid approach.
 *
 * Run:  npx jest js/__tests__/spatial-grid-benchmark.test.js
 */

/* global describe, test, expect */

// --- Helpers that mirror the real blocks.js structures ---

const SPATIAL_GRID_CELL_SIZE = 50;

/** Old approach: linear scan over every block. */
function linearScan(blockList, x1, y1, thisBlock) {
    let checked = 0;
    let bestDist = 400; // MINIMUMDOCKDISTANCE
    let bestBlock = null;

    for (let b = 0; b < blockList.length; b++) {
        if (b === thisBlock) continue;
        if (blockList[b].trash) continue;

        for (let i = 0; i < blockList[b].docks.length; i++) {
            checked++;
            const x2 = blockList[b].x + blockList[b].docks[i][0];
            const y2 = blockList[b].y + blockList[b].docks[i][1];
            const dist = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
            if (dist < bestDist) {
                bestDist = dist;
                bestBlock = b;
            }
        }
    }
    return { bestBlock, checked };
}

/** New approach: spatial grid lookup. */
function buildSpatialGrid(blockList) {
    const grid = new Map();
    for (let i = 0; i < blockList.length; i++) {
        const cx = Math.floor(blockList[i].x / SPATIAL_GRID_CELL_SIZE);
        const cy = Math.floor(blockList[i].y / SPATIAL_GRID_CELL_SIZE);
        const key = cx + "," + cy;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(i);
    }
    return grid;
}

function gridScan(grid, blockList, x1, y1, thisBlock) {
    let checked = 0;
    let bestDist = 400;
    let bestBlock = null;

    const cx = Math.floor(x1 / SPATIAL_GRID_CELL_SIZE);
    const cy = Math.floor(y1 / SPATIAL_GRID_CELL_SIZE);

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const key = (cx + dx) + "," + (cy + dy);
            const cell = grid.get(key);
            if (!cell) continue;

            for (let ci = 0; ci < cell.length; ci++) {
                const b = cell[ci];
                if (b === thisBlock) continue;
                if (blockList[b].trash) continue;

                for (let i = 0; i < blockList[b].docks.length; i++) {
                    checked++;
                    const x2 = blockList[b].x + blockList[b].docks[i][0];
                    const y2 = blockList[b].y + blockList[b].docks[i][1];
                    const dist = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestBlock = b;
                    }
                }
            }
        }
    }
    return { bestBlock, checked };
}

/** Create a realistic block layout spread across the canvas. */
function createBlockLayout(count) {
    const blocks = [];
    // Spread blocks across a canvas, roughly like real projects
    const cols = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        blocks.push({
            x: 100 + col * 40 + (Math.random() * 20 - 10),
            y: 100 + row * 30 + (Math.random() * 15 - 7),
            trash: false,
            docks: [
                [0, 0],
                [0, 20],
                [30, 10]
            ]
        });
    }
    return blocks;
}

// --- Benchmark ---

describe("Spatial Grid Benchmark", () => {
    const sizes = [100, 300, 500, 1000];
    const ITERATIONS = 200;

    const results = [];

    sizes.forEach(size => {
        test(`${size} blocks: grid lookup is faster than linear scan`, () => {
            const blockList = createBlockLayout(size);
            const grid = buildSpatialGrid(blockList);

            // Pick a block near the center to drop
            const dropIdx = Math.floor(size / 2);
            const x1 = blockList[dropIdx].x + blockList[dropIdx].docks[0][0];
            const y1 = blockList[dropIdx].y + blockList[dropIdx].docks[0][1];

            // Warm up
            for (let i = 0; i < 10; i++) {
                linearScan(blockList, x1, y1, dropIdx);
                gridScan(grid, blockList, x1, y1, dropIdx);
            }

            // Measure linear scan
            const linearStart = performance.now();
            let linearChecked = 0;
            for (let i = 0; i < ITERATIONS; i++) {
                linearChecked = linearScan(blockList, x1, y1, dropIdx).checked;
            }
            const linearTime = performance.now() - linearStart;

            // Measure grid scan
            const gridStart = performance.now();
            let gridChecked = 0;
            for (let i = 0; i < ITERATIONS; i++) {
                gridChecked = gridScan(grid, blockList, x1, y1, dropIdx).checked;
            }
            const gridTime = performance.now() - gridStart;

            // Both approaches must find the same best block
            const linearResult = linearScan(blockList, x1, y1, dropIdx);
            const gridResult = gridScan(grid, blockList, x1, y1, dropIdx);
            expect(gridResult.bestBlock).toBe(linearResult.bestBlock);

            const speedup = (linearTime / gridTime).toFixed(1);

            results.push({
                blocks: size,
                linearChecked,
                gridChecked,
                linearMs: linearTime.toFixed(2),
                gridMs: gridTime.toFixed(2),
                speedup: speedup + "x"
            });

            // Grid should check far fewer candidates
            expect(gridChecked).toBeLessThan(linearChecked);
        });
    });

    // Print results table after all tests
    afterAll(() => {
        console.log("\n┌────────────────────────────────────────────────────────────────────────┐");
        console.log("│          findBestConnection() Benchmark Results                       │");
        console.log("├─────────┬──────────────┬─────────────┬──────────┬──────────┬──────────┤");
        console.log("│ Blocks  │ Linear checks│ Grid checks │ Linear   │ Grid     │ Speedup  │");
        console.log("├─────────┼──────────────┼─────────────┼──────────┼──────────┼──────────┤");
        results.forEach(r => {
            console.log(
                `│ ${String(r.blocks).padStart(6)}  │ ${String(r.linearChecked).padStart(12)}│ ${String(r.gridChecked).padStart(11)} │ ${String(r.linearMs + "ms").padStart(8)} │ ${String(r.gridMs + "ms").padStart(8)} │ ${String(r.speedup).padStart(8)} │`
            );
        });
        console.log("└─────────┴──────────────┴─────────────┴──────────┴──────────┴──────────┘");
        console.log("(200 iterations per measurement, lower is better)\n");
    });
});
