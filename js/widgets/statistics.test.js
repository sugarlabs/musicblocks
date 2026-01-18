/**
 * MusicBlocks v3.6.2
 *
 * @author mukul-dixit
 *
 * @copyright 2026 mukul-dixit
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// --- Global Mocks ---
global.docById = jest.fn().mockReturnValue({
    style: {},
    innerHTML: ""
});

global.analyzeProject = jest.fn().mockReturnValue({
    pitch: 80,
    rhythm: 75,
    tone: 70,
    dynamics: 65,
    articulation: 60
});

global.runAnalytics = jest.fn();

global.scoreToChartData = jest.fn().mockReturnValue({
    labels: ["Pitch", "Rhythm", "Tone", "Dynamics", "Articulation"],
    datasets: [{
        data: [80, 75, 70, 65, 60]
    }]
});

global.getChartOptions = jest.fn().mockReturnValue({
    scale: {
        ticks: { beginAtZero: true }
    }
});

global.Chart = jest.fn().mockImplementation(() => ({
    toBase64Image: jest.fn().mockReturnValue("data:image/png;base64,mock")
}));

global.Image = class {
    constructor() {
        this.src = "";
        this.width = 0;
    }
};

describe("StatsWindow Widget", () => {
    test("statistics.js module exists and is valid", () => {
        const fs = require("fs");
        const path = require("path");
        
        const statisticsPath = path.join(__dirname, "statistics.js");
        const fileExists = fs.existsSync(statisticsPath);
        expect(fileExists).toBe(true);
        
        const content = fs.readFileSync(statisticsPath, "utf8");
        expect(content).toContain("class StatsWindow");
        expect(content).toMatch(/(@exports\s+StatsWindow|\/\*\s*exported\s+StatsWindow\s*\*\/)/);
    });

    test("statistics.js has proper license header", () => {
        const fs = require("fs");
        const path = require("path");
        
        const statisticsPath = path.join(__dirname, "statistics.js");
        const content = fs.readFileSync(statisticsPath, "utf8");
        expect(content).toMatch(/GNU.*AFFERO.*PUBLIC.*LICENSE/is);
    });
});
