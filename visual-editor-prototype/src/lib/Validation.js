import { BLOCK_TYPES } from '../constants';

/**
 * Validates an array of blocks to ensure they form a correct sequence.
 * Rules:
 * 1. TEMPO must be at index 0 of the root sequence.
 * 2. NOTE must be followed immediately by a RHYTHM block.
 * 3. RHYTHM must follow a NOTE block.
 * 4. REPEAT loop must have at least one child block.
 * 
 * @param {Array} blocks - Array of block objects
 * @param {boolean} isRoot - True if this is the top-level block sequence
 * @returns {Object} { isValid: boolean, errors: Object<blockId, string> }
 */
export function validateBlocks(blocks, isRoot = true) {
  let isValid = true;
  const errors = {};

  if (!blocks || blocks.length === 0) {
    return { isValid, errors };
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Rule: TEMPO must be at the top level, index 0
    if (block.type === BLOCK_TYPES.TEMPO) {
      if (!isRoot || i !== 0) {
        isValid = false;
        errors[block.id] = "Tempo must be the first block in the sequence.";
      }
    }

    // Rule: NOTE must be followed by RHYTHM
    if (block.type === BLOCK_TYPES.NOTE) {
      const nextBlock = blocks[i + 1];
      if (!nextBlock || nextBlock.type !== BLOCK_TYPES.RHYTHM) {
        isValid = false;
        errors[block.id] = "Duration must follow a Note.";
      }
    }

    // Rule: RHYTHM must follow a NOTE
    if (block.type === BLOCK_TYPES.RHYTHM) {
      const prevBlock = blocks[i - 1];
      if (!prevBlock || prevBlock.type !== BLOCK_TYPES.NOTE) {
        isValid = false;
        errors[block.id] = "Duration cannot exist without a preceding Note.";
      }
    }

    // Rule: REPEAT loop must not be empty
    if (block.type === BLOCK_TYPES.REPEAT) {
      if (!block.data.children || block.data.children.length === 0) {
        isValid = false;
        errors[block.id] = "Loop cannot be empty.";
      } else {
        // Recursively validate children
        const childValidation = validateBlocks(block.data.children, false);
        if (!childValidation.isValid) {
          isValid = false;
          Object.assign(errors, childValidation.errors);
        }
      }
    }
  }

  return { isValid, errors };
}
