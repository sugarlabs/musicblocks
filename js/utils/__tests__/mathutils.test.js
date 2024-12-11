// A basic test file in jest framework for the mathutils.js 

const MathUtility = require("./mathutils.js"); 

describe('MathUtility', () => {
  beforeAll(() => {
    global.SOLFEGENAMES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
  });

  describe('doRandom', () => {
    it('should return a random number within the given range', () => {
      const min = 1, max = 10;
      const result = MathUtility.doRandom(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doRandom(null, undefined)).toThrow('NanError');
    });

    it('should return a valid solfege array when inputs are solfege strings', () => {
      const result = MathUtility.doRandom('do', 'mi', 4);
      expect(result).toHaveLength(2);
      expect(global.SOLFEGENAMES).toContain(result[0]);
      expect(Number(result[1])).toBeGreaterThanOrEqual(4);
    });
  });

  describe('doOneOf', () => {
    it('should return either of the inputs randomly', () => {
      const a = 'apple', b = 'banana';
      const result = MathUtility.doOneOf(a, b);
      expect([a, b]).toContain(result);
    });
  });

  describe('doMod', () => {
    it('should return the modulus of two numbers', () => {
      expect(MathUtility.doMod(10, 3)).toBe(1);
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doMod('a', 3)).toThrow('NanError');
    });
  });

  describe('doSqrt', () => {
    it('should return the square root of a number', () => {
      expect(MathUtility.doSqrt(9)).toBe(3);
    });

    it('should throw an error for negative numbers', () => {
      expect(() => MathUtility.doSqrt(-1)).toThrow('NoSqrtError');
    });
  });

  describe('doPlus', () => {
    it('should add two numbers', () => {
      expect(MathUtility.doPlus(3, 4)).toBe(7);
    });

    it('should concatenate strings', () => {
      expect(MathUtility.doPlus('3', 4)).toBe('34');
    });
  });

  describe('doMinus', () => {
    it('should subtract two numbers', () => {
      expect(MathUtility.doMinus(10, 4)).toBe(6);
    });

    it('should throw an error for strings', () => {
      expect(() => MathUtility.doMinus('10', 4)).toThrow('NanError');
    });
  });

  describe('doMultiply', () => {
    it('should multiply two numbers', () => {
      expect(MathUtility.doMultiply(2, 5)).toBe(10);
    });

    it('should throw an error for strings', () => {
      expect(() => MathUtility.doMultiply('2', 5)).toThrow('NanError');
    });
  });

  describe('doDivide', () => {
    it('should divide two numbers', () => {
      expect(MathUtility.doDivide(10, 2)).toBe(5);
    });

    it('should throw an error for division by zero', () => {
      expect(() => MathUtility.doDivide(10, 0)).toThrow('DivByZeroError');
    });
  });

  describe('doCalculateDistance', () => {
    it('should calculate Euclidean distance', () => {
      expect(MathUtility.doCalculateDistance(0, 0, 3, 4)).toBe(5);
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doCalculateDistance('a', 0, 3, 4)).toThrow('NanError');
    });
  });

  describe('doPower', () => {
    it('should calculate the power of a number', () => {
      expect(MathUtility.doPower(2, 3)).toBe(8);
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doPower('2', 3)).toThrow('NanError');
    });
  });

  describe('doAbs', () => {
    it('should return the absolute value of a number', () => {
      expect(MathUtility.doAbs(-5)).toBe(5);
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doAbs('a')).toThrow('NanError');
    });
  });

  describe('doNegate', () => {
    it('should negate a number', () => {
      expect(MathUtility.doNegate(5)).toBe(-5);
    });

    it('should reverse a string', () => {
      expect(MathUtility.doNegate('hello')).toBe('olleh');
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doNegate(null)).toThrow('NoNegError');
    });
  });

  describe('doInt', () => {
    it('should round a number to the nearest integer', () => {
      expect(MathUtility.doInt(5.5)).toBe(6);
    });

    it('should throw an error for invalid inputs', () => {
      expect(() => MathUtility.doInt('hello')).toThrow('NanError');
    });
  });
});
