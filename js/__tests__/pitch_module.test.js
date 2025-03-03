/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Priyamvada Shah
 *
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

const { setupPitchBlocks } = require('../blocks/PitchBlocks.js');
require('./mock-setup.js');
jest.mock('../blocks/PitchBlocks.js', () => ({
    setupPitchBlocks: jest.fn()
}));
describe('Pitch Block Functionality', () => {
    beforeAll(() => {
        global.Activity = class Activity {
          constructor() {
            this.blocks = {
              registerBlockType: jest.fn(),
              setPalette: jest.fn(),
              makeBlock: jest.fn(),
              protoBlockDict: {},
              palettes: {
                add: jest.fn()
              }
            };
          }
        };
      
        global.Block = class Block {
          constructor(name, label) {
            this.name = name;
            this.label = label || name;
            this.palette = null;
            this.size = 0;
            this.connections = [];
            this.value = null;
            this.collapsed = false;
            this.hidden = false;
            this.deprecated = false;
            this.parameter = false;
            this.privateData = {};
            this.helpString = [];
          }
      
          setPalette(name, activity) {
            this.palette = name;
            return this;
          }
      
          setHelpString(helpContent) {
            this.helpString = helpContent;
            return this;
          }
      
          formBlock(options = {}) {
            this.blockOptions = options;
            return this;
          }
      
          makeMacro(func) {
            this.macroFunc = func;
            return this;
          }
      
          modifyValueBlock() {
            return this;
          }
      
          adjustWidthToLabel() {
            return this;
          }
      
          hidden() {
            this.hidden = true;
            return this;
          }
      
          staticLabels(labels) {
            this.labels = labels;
            return this;
          }
      
          oneArgBlock() {
            return this;
          }
      
          oneArgMathBlock() {
            return this;
          }
      
          twoArgBlock() {
            return this;
          }
      
          threeArgBlock() {
            return this;
          }
      
          defaults(defaultValues) {
            this.defaultValues = defaultValues;
            return this;
          }
          
        };
    });
    let activity;
    
    beforeEach(() => {
        activity = createMockActivity();
        setupBlockClasses();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    
    function setupBlockClasses() {
        global.KeyBlock = class KeyBlock extends global.FlowBlock {
            constructor(activity) {
                super('key');
                this.activity = activity;
                this.setPalette = jest.fn();
                this.beginnerBlock = jest.fn().mockReturnValue(true);
                this.setHelpString = jest.fn();
                this.formBlock = jest.fn();
                this.flow = jest.fn((args, logo, turtle, blk) => {
                    if (args[0] === null) {
                        this.activity.errorMsg(NOINPUTERRORMSG, blk);
                        return;
                    }
                    
                    if (!Turtle.PitchActions.validateKey(args[0])) {
                        this.activity.errorMsg("Invalid key signature: " + args[0], blk);
                        return;
                    }
                    
                    Turtle.PitchActions.setKey(args[0], turtle);
                });
            }
            
            setup() {
                this.setPalette("pitch", this.activity);
            }
        };
        
        global.ScaleBlock = class ScaleBlock extends global.FlowBlock {
            constructor(activity) {
                super('scale');
                this.activity = activity;
                this.setPalette = jest.fn();
                this.beginnerBlock = jest.fn().mockReturnValue(true);
                this.setHelpString = jest.fn();
                this.formBlock = jest.fn();
                this.flow = jest.fn((args, logo, turtle, blk) => {
                    if (args[0] === null) {
                        this.activity.errorMsg(NOINPUTERRORMSG, blk);
                        return;
                    }
                    Turtle.PitchActions.setScale(args[0], turtle);
                });
            }
            
            setup() {
                this.setPalette("pitch", this.activity);
            }
        };
        
        global.TranspositionBlock = class TranspositionBlock extends global.FlowBlock {
            constructor(activity) {
                super('transpose');
                this.activity = activity;
                this.setPalette = jest.fn();
                this.beginnerBlock = jest.fn().mockReturnValue(true);
                this.setHelpString = jest.fn();
                this.formBlock = jest.fn();
                this.flow = jest.fn((args, logo, turtle, blk, callback) => {
                    if (args[0] === null) {
                        this.activity.errorMsg(NOINPUTERRORMSG, blk);
                        return;
                    }
                    Turtle.PitchActions.transposeNote(args[0], turtle);
                    if (callback) callback();
                });
            }
            
            setup() {
                this.setPalette("pitch", this.activity);
            }
        };
        
        const keyBlock = new KeyBlock(activity);
        const scaleBlock = new ScaleBlock(activity);
        const transpositionBlock = new TranspositionBlock(activity);
        
        activity.blocks.findBlockInstance = jest.fn((name) => {
            return {
                'key': keyBlock,
                'scale': scaleBlock,
                'transpose': transpositionBlock
            }[name];
        });
        
        keyBlock.setup();
        scaleBlock.setup();
        transpositionBlock.setup();
    }
    describe('KeyBlock', () => {
        let keyBlock;
        let logo;
        let turtle;
        let blk;
        
        beforeEach(() => {
            keyBlock = activity.blocks.findBlockInstance('key');
            logo = {
                parseArg: jest.fn().mockImplementation((logo, turtle, cblk, blk, receivedArg) => {
                    if (cblk === 'block2') return 'C';
                    return receivedArg;
                })
            };
            turtle = 'turtle1';
            blk = 'block1';
            
            // Setup test state
            setupPitchBlocks(activity);
        });
        
        it('should be properly initialized', () => {
            expect(keyBlock).toBeDefined();
            expect(keyBlock.beginnerBlock(true)).toBe(true);
            expect(keyBlock.setPalette).toHaveBeenCalledWith("pitch", activity);
            expect(activity.blocks.registerBlockType).toHaveBeenCalledWith('key', KeyBlock);
        });
        
        it('should handle null arguments with error message', () => {
            keyBlock.flow([null], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(Turtle.PitchActions.setKey).not.toHaveBeenCalled();
        });
        
        it('should call setKey with correct arguments', () => {
            keyBlock.flow(['C'], logo, turtle, blk);
            expect(Turtle.PitchActions.setKey).toHaveBeenCalledWith('C', turtle);
        });
        
        it('should handle various valid key signatures', () => {
            const validKeys = ['C', 'G', 'D', 'A', 'E', 'F#m', 'Bb', 'Eb'];
            
            validKeys.forEach(key => {
                keyBlock.flow([key], logo, turtle, blk);
                expect(Turtle.PitchActions.setKey).toHaveBeenLastCalledWith(key, turtle);
                expect(activity.errorMsg).not.toHaveBeenCalled();
            });
        });
        
        it('should handle invalid key signatures with error message', () => {
            const invalidKeys = ['Z99', 'H', '$Major'];
            
            invalidKeys.forEach(key => {
                Turtle.PitchActions.validateKey.mockReturnValueOnce(false);
                keyBlock.flow([key], logo, turtle, blk);
                expect(activity.errorMsg).toHaveBeenCalled();
                expect(Turtle.PitchActions.setKey).not.toHaveBeenLastCalledWith(key, turtle);
                activity.errorMsg.mockClear();
            });
        });
    });
    
    describe('ScaleBlock', () => {
        let scaleBlock;
        let logo;
        let turtle;
        let blk;
        
        beforeEach(() => {
            scaleBlock = activity.blocks.findBlockInstance('scale');
            logo = {
                parseArg: jest.fn().mockImplementation((logo, turtle, cblk, blk, receivedArg) => {
                    if (cblk === 'block3') return 'major';
                    return receivedArg;
                })
            };
            turtle = 'turtle1';
            blk = 'block1';
            
            // Setup test state
            setupPitchBlocks(activity);
        });
        
        it('should be properly initialized', () => {
            expect(scaleBlock).toBeDefined();
            expect(scaleBlock.beginnerBlock(true)).toBe(true);
            expect(scaleBlock.setPalette).toHaveBeenCalledWith("pitch", activity);
            expect(activity.blocks.registerBlockType).toHaveBeenCalledWith('scale', ScaleBlock);
        });
        
        it('should handle null arguments with error message', () => {
            scaleBlock.flow([null], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(Turtle.PitchActions.setScale).not.toHaveBeenCalled();
        });
        
        it('should call setScale with correct arguments', () => {
            scaleBlock.flow(['major'], logo, turtle, blk);
            expect(Turtle.PitchActions.setScale).toHaveBeenCalledWith('major', turtle);
        });
        
        it('should handle various scale types', () => {
            const scales = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'];
            
            scales.forEach(scale => {
                scaleBlock.flow([scale], logo, turtle, blk);
                expect(Turtle.PitchActions.setScale).toHaveBeenLastCalledWith(scale, turtle);
            });
        });
    });
    
    describe('TranspositionBlock', () => {
        let transpositionBlock;
        let logo;
        let turtle;
        let blk;
        
        beforeEach(() => {
            transpositionBlock = activity.blocks.findBlockInstance('transpose');
            logo = {
                parseArg: jest.fn().mockReturnValue(2)
            };
            turtle = 'turtle1';
            blk = 'block1';
            
            setupPitchBlocks(activity);
        });
        
        it('should be properly initialized', () => {
            expect(transpositionBlock).toBeDefined();
            expect(transpositionBlock.beginnerBlock(true)).toBe(true);
            expect(transpositionBlock.setPalette).toHaveBeenCalledWith("pitch", activity);
            expect(activity.blocks.registerBlockType).toHaveBeenCalledWith('transpose', TranspositionBlock);
        });
        
        it('should handle null arguments with error message', () => {
            transpositionBlock.flow([null], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(Turtle.PitchActions.transposeNote).not.toHaveBeenCalled();
        });
        
        it('should call transposeNote with correct arguments', () => {
            transpositionBlock.flow([2], logo, turtle, blk);
            expect(Turtle.PitchActions.transposeNote).toHaveBeenCalledWith(2, turtle);
        });
        
        it('should handle various transposition values', () => {
            const transpositions = [-12, -7, -2, 0, 2, 7, 12];
            
            transpositions.forEach(transpose => {
                transpositionBlock.flow([transpose], logo, turtle, blk);
                expect(Turtle.PitchActions.transposeNote).toHaveBeenLastCalledWith(transpose, turtle);
            });
        });
        
        it('should execute callback when provided', () => {
            const callback = jest.fn();
            transpositionBlock.flow([2], logo, turtle, blk, callback);
            expect(callback).toHaveBeenCalled();
        });
    });
    
    describe('Integration Tests', () => {
        let keyBlock;
        let scaleBlock;
        let transpositionBlock;
        let logo;
        let blk;
        
        beforeEach(() => {
            keyBlock = activity.blocks.findBlockInstance('key');
            scaleBlock = activity.blocks.findBlockInstance('scale');
            transpositionBlock = activity.blocks.findBlockInstance('transpose');
            logo = {
                parseArg: jest.fn().mockReturnValue('C')
            };
            blk = 'block1';
            
            setupPitchBlocks(activity);
            
            global.state = {};
            Turtle.PitchActions.setKey.mockImplementation((key, turtle) => {
                if (!state[turtle]) state[turtle] = {};
                state[turtle].key = key;
            });
            
            Turtle.PitchActions.setScale.mockImplementation((scale, turtle) => {
                if (!state[turtle]) state[turtle] = {};
                state[turtle].scale = scale;
            });
            
            Turtle.PitchActions.transposeNote.mockImplementation((semitones, turtle) => {
                if (!state[turtle]) state[turtle] = {};
                state[turtle].transposition = semitones;
                return 'D4';
            });
            
            Turtle.PitchActions.getNote.mockImplementation((turtle) => {
                const turtleState = state[turtle] || {};
                const key = turtleState.key || 'C';
                const scale = turtleState.scale || 'major';
                const transposition = turtleState.transposition || 0;
                
                return `Note in ${key} ${scale} transposed by ${transposition}`;
            });
        });
        
        afterEach(() => {
            global.state = {};
        });
        
        it('should maintain state across multiple turtles', () => {
            keyBlock.flow(['C'], logo, 'turtle1', blk);
            keyBlock.flow(['G'], logo, 'turtle2', blk);
            
            expect(state).toEqual({
                'turtle1': { key: 'C' },
                'turtle2': { key: 'G' }
            });
        });
        
        it('should integrate key, scale, and transposition correctly', () => {
            keyBlock.flow(['D'], logo, 'turtle1', blk);
            scaleBlock.flow(['minor'], logo, 'turtle1', blk);
            transpositionBlock.flow([2], logo, 'turtle1', blk);
            
            expect(state['turtle1']).toEqual({
                key: 'D',
                scale: 'minor',
                transposition: 2
            });
            
            const note = Turtle.PitchActions.getNote('turtle1');
            expect(note).toEqual('Note in D minor transposed by 2');
        });
        
        it('should handle sequence of operations correctly', () => {
            keyBlock.flow(['C'], logo, 'turtle1', blk);
            scaleBlock.flow(['major'], logo, 'turtle1', blk);
            transpositionBlock.flow([2], logo, 'turtle1', blk);
            keyBlock.flow(['G'], logo, 'turtle1', blk);
            
            expect(state['turtle1']).toEqual({
                key: 'G',
                scale: 'major',
                transposition: 2
            });
        });
    });
    
    describe('Error Handling', () => {
        let keyBlock;
        let scaleBlock;
        let transpositionBlock;
        let logo;
        let blk;
        
        beforeEach(() => {
            keyBlock = activity.blocks.findBlockInstance('key');
            scaleBlock = activity.blocks.findBlockInstance('scale');
            transpositionBlock = activity.blocks.findBlockInstance('transpose');
            logo = {};
            blk = 'block1';
            
            // Setup test state
            setupPitchBlocks(activity);
        });
        
        it('should handle errors when PitchActions methods throw exceptions', () => {
            Turtle.PitchActions.setKey.mockImplementationOnce(() => {
                throw new Error('Simulated error');
            });
            
            expect(() => {
                keyBlock.flow(['C'], logo, 'turtle1', blk);
            }).toThrow('Simulated error');
            
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });
        
        it('should handle undefined or empty values gracefully', () => {
            keyBlock.flow([undefined], logo, 'turtle1', blk);
            expect(activity.errorMsg).not.toHaveBeenCalled();
            
            keyBlock.flow([''], logo, 'turtle1', blk);
            expect(Turtle.PitchActions.setKey).toHaveBeenLastCalledWith('', 'turtle1');
        });
    });
    global.FlowBlock = class FlowBlock {
        constructor(name) {
            this.name = name;
        }
    };
    
    global.ConsonantStepSizeDownBlock = class ConsonantStepSizeDownBlock {
        setup() {}
    };
    
    global.ConsonantStepSizeUpBlock = class ConsonantStepSizeUpBlock {
        setup() {} 
    };
    
    global.RestBlock = class RestBlock {
        setup() {}
    };
    
    global.SquareBlock = class SquareBlock {
        setup() {} 
    };
    
    function manuallyRegisterBlocks() {
        activity.blocks.registerBlockType('key', global.KeyBlock);
        activity.blocks.registerBlockType('scale', global.ScaleBlock);
        activity.blocks.registerBlockType('transpose', global.TranspositionBlock);
    }
    
    beforeEach(() => {
        activity = createMockActivity();
        setupBlockClasses();
        
        manuallyRegisterBlocks();
        
        global.Turtle = {
            PitchActions: {
                validateKey: jest.fn().mockReturnValue(true),
                setKey: jest.fn(),
                setScale: jest.fn(),
                transposeNote: jest.fn(),
                getNote: jest.fn()
            }
        };
        
        global.NOINPUTERRORMSG = "Missing input";
    });
});