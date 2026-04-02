/**
 * MusicBlocks v3.6.2
 *
 * @author Om Santosh Suneri
 *
 * @copyright 2025 Om Santosh Suneri
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
const { setupBooleanBlocks } = require("../BooleanBlocks");

global._ = jest.fn(str => str);
global.NOINPUTERRORMSG = "No input error message";

let createdBlocks = [];

/**
 * Minimal BooleanBlock stub
 * Captures created instances
 */
global.BooleanBlock = class {
  constructor(type) {
    this.type = type;
    createdBlocks.push(this);
  }
  setPalette() {}
  setHelpString() {}
  formBlock() {}
  setup() {}
  beginnerBlock() {}
};

describe("setupBooleanBlocks - Real Coverage Tests", () => {
  let mockActivity;
  let mockLogo;

  beforeEach(() => {
    createdBlocks = [];

    mockActivity = {
      blocks: {
        blockList: {
          blk1: { value: true, connections: [null, null, null] },
          blk2: { value: false, connections: [null, null, null] },
          blk3: { value: true, connections: [null, "blk4", "blk5"] },
          blk4: { value: false, connections: [null, null, null] },
          blk5: { value: true, connections: [null, null, null] },
        },
      },
      errorMsg: jest.fn(),
    };

    mockLogo = {
      parseArg: jest.fn((logo, turtle, cblk) => {
        return mockActivity.blocks.blockList[cblk].value;
      }),
    };

    setupBooleanBlocks(mockActivity);
  });

  function getBlock(type) {
    return createdBlocks.find(b => b.type === type);
  }

  test("Not block works", () => {
    const notBlock = getBlock("not");
    const result = notBlock.arg(mockLogo, "turtle", "blk3", true);
    expect(result).toBe(true);
  });

  test("And block works", () => {
    const andBlock = getBlock("and");
    const result = andBlock.arg(mockLogo, "turtle", "blk3", true);
    expect(result).toBe(false);
  });

  test("Or block works", () => {
    const orBlock = getBlock("or");
    const result = orBlock.arg(mockLogo, "turtle", "blk3", true);
    expect(result).toBe(true);
  });

  test("Equal block works", () => {
    const equalBlock = getBlock("equal");
    const result = equalBlock.arg(mockLogo, "turtle", "blk3", true);
    expect(result).toBe(false);
  });

  test("Null connection triggers error", () => {
    const notBlock = getBlock("not");
    notBlock.arg(mockLogo, "turtle", "blk1", true);
    expect(mockActivity.errorMsg).toHaveBeenCalledWith(
      global.NOINPUTERRORMSG,
      "blk1"
    );
  });
});