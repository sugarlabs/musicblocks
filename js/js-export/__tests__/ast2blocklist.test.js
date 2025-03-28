const acorn = require('acorn');
const { ast2blocklist } = require('../ast2blocklist');

describe('ast2blocklist Class', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should generate correct blockList for a single note', () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote(Math.abs(-2) * 1, async () => {
                    await mouse.playPitch("mi", Math.abs(-2));
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`

        const expectedStartTree = {
            "name": "start",
            "children": [
                {
                    "name": "settimbre",
                    "args": ["guitar"],
                    "children": [
                        {
                            "name": "newnote",
                            "args": [
                                {
                                    "name": "multiply",
                                    "args": [
                                        {
                                            "name": "abs",
                                            "args": [
                                                {
                                                    "name": "neg",
                                                    "args": [2]
                                                }
                                            ]
                                        },
                                        1
                                    ]
                                }
                            ],
                            "children": [
                                {
                                    "name": "pitch",
                                    "args": [
                                        "mi",
                                        {
                                            "name": "abs",
                                            "args": [
                                                {
                                                    "name": "neg",
                                                    "args": [2]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const expectedBlockList = [
            [0,"start",200,200,[null,1,null]],
            [1,"settimbre",0,0,[0,2,3,null]],
            [2,["voicename",{"value":"guitar"}],0,0,[1]],
            [3,"newnote",0,0,[1,4,9,null]],
            [4,"multiply",0,0,[3,5,8]],
            [5,"abs",0,0,[4,6]],
            [6,"neg",0,0,[5,7]],
            [7,["number",{"value":2}],0,0,[6]],
            [8,["number",{"value":1}],0,0,[4]],
            [9,"pitch",0,0,[3,10,11,null]],
            [10,["solfege",{"value":"mi"}],0,0,[9]],
            [11,"abs",0,0,[9,12]],
            [12,"neg",0,0,[11,13]],
            [13,["number",{"value":2}],0,0,[12]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let startTrees = ast2blocklist.toStartTrees(AST);
        let blockList = ast2blocklist.toBlockList(startTrees[0]);

        expect(startTrees[0]).toEqual(expectedStartTree);
        expect(blockList).toEqual(expectedBlockList);
    });

    test('should generate correct blockList for repeat', () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("clarinet", async () => {
                for (let i0 = 0; i0 < MathUtility.doRandom(1, 5); i0++) {
                    await mouse.playNote(1 / 4, async () => {
                        await mouse.playPitch("fa", 2 * 2);
                        return mouse.ENDFLOW;
                    });
                }
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`

        const expectedStartTree = {
            "name": "start",
            "children": [
              {
                "name": "settimbre",
                "args": [
                  "clarinet"
                ],
                "children": [
                  {
                    "name": "repeat",
                    "args": [
                      {
                        "name": "random",
                        "args": [1,5]
                      }
                    ],
                    "children": [
                      {
                        "name": "newnote",
                        "args": [
                          {
                            "name": "divide",
                            "args": [1,4]
                          }
                        ],
                        "children": [
                          {
                            "name": "pitch",
                            "args": [
                              "fa",
                              {
                                "name": "multiply",
                                "args": [2,2]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          };

        const expectedBlockList = [
            [0,"start",200,200,[null,1,null]], 
            [1,"settimbre",0,0,[0,2,3,null]], 
            [2,["voicename",{"value":"clarinet"}],0,0,[1]], 
            [3,"repeat",0,0,[1,4,7,null]], 
            [4,"random",0,0,[3,5,6]], 
            [5,["number",{"value":1}],0,0,[4]], 
            [6,["number",{"value":5}],0,0,[4]], 
            [7,"newnote",0,0,[3,8,11,null]], 
            [8,"divide",0,0,[7,9,10]], 
            [9,["number",{"value":1}],0,0,[8]], 
            [10,["number",{"value":4}],0,0,[8]], 
            [11,"pitch",0,0,[7,12,13,null]], 
            [12,["solfege",{"value":"fa"}],0,0,[11]], 
            [13,"multiply",0,0,[11,14,15]], 
            [14,["number",{"value":2}],0,0,[13]], 
            [15,["number",{"value":2}],0,0,[13]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let startTrees = ast2blocklist.toStartTrees(AST);
        let blockList = ast2blocklist.toBlockList(startTrees[0]);

        expect(startTrees[0]).toEqual(expectedStartTree);
        expect(blockList).toEqual(expectedBlockList);
    });
});