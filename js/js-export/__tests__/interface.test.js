const JSInterface = require('../interface');
JSInterface._methodArgConstraints = {};

describe('JSInterface', () => {
  describe('isClampBlock', () => {
    it('should return true for a known clamp block', () => {
      expect(JSInterface.isClampBlock('newnote')).toBe(true);
    });

    it('should return false for an unknown block', () => {
      expect(JSInterface.isClampBlock('nonexistent')).toBe(false);
    });
  });

  describe('isSetter', () => {
    it('should return true for a valid setter block', () => {
      expect(JSInterface.isSetter('pickup')).toBe(true);
    });

    it('should return false for a block that is not a setter', () => {
      expect(JSInterface.isSetter('newnote')).toBe(false);
    });
  });

  describe('isGetter', () => {
    it('should return true for a valid getter block', () => {
      expect(JSInterface.isGetter('mynotevalue')).toBe(true);
    });

    it('should return false for a block that is not a getter', () => {
      expect(JSInterface.isGetter('pickup')).toBe(false);
    });
  });

  describe('isMethod', () => {
    it('should return true for a valid method block', () => {
      expect(JSInterface.isMethod('newnote')).toBe(true);
    });

    it('should return false for a block that is not a method', () => {
      expect(JSInterface.isMethod('pickup')).toBe(false);
    });
  });

  describe('methodReturns', () => {
    it('should return true for a method that has a return value', () => {
      expect(JSInterface.methodReturns('getDict')).toBe(true);
    });

    it('should return false for a method that does not have a return value', () => {
      expect(JSInterface.methodReturns('newnote')).toBe(false);
    });
  });

  describe('getSetterName', () => {
    it('should return the correct setter name when available', () => {
      expect(JSInterface.getSetterName('pickup')).toBe('PICKUP');
    });

    it('should return null when no setter exists for the given block', () => {
      expect(JSInterface.getSetterName('newnote')).toBeNull();
    });
  });

  describe('getGetterName', () => {
    it('should return the correct getter name when available', () => {
      expect(JSInterface.getGetterName('mynotevalue')).toBe('NOTEVALUE');
    });

    it('should return null when no getter exists for the given block', () => {
      expect(JSInterface.getGetterName('pickup')).toBeNull();
    });
  });

  describe('getMethodName', () => {
    it('should return the correct method name when available', () => {
      expect(JSInterface.getMethodName('newnote')).toBe('playNote');
    });

    it('should return null when no method exists for the given block', () => {
      expect(JSInterface.getMethodName('pickup')).toBeNull();
    });
  });

  describe('rearrangeMethodArgs', () => {
    it('should rearrange the arguments for methods present in the lookup', () => {
      const args = [1, 2, 3];
      expect(JSInterface.rearrangeMethodArgs('setDict', args)).toEqual([2, 3, 1]);
    });

    it('should return the original args if no rearrangement is required', () => {
      const args = [1, 2, 3];
      expect(JSInterface.rearrangeMethodArgs('nonExistingMethod', args)).toEqual(args);
    });
  });

  describe('validateArgs', () => {
    it('should return the original args when no constraints are defined for the method', () => {
      const args = [1, 2, 3];
      expect(JSInterface.validateArgs('nonExistingMethod', args)).toEqual(args);
    });
  });
});
