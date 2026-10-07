/**
 * MusicBlocks v3.8.0
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
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

/**
 * Deterministic corpus of representative Music Blocks structures.
 *
 * Each corpus item defines:
 * - name: descriptive unique identifier for diagnostics
 * - description: human-readable explanation of the test case
 * - category: category grouping
 * - blocks: Music Blocks blockList representation
 */

const basicValuesAndExpressions = [
    {
        name: "numeric_integer_literal",
        description: "Prints a positive integer literal (42)",
        category: "basic_values",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, ["number", { value: 42 }], 0, 0, [1]]
        ]
    },
    {
        name: "numeric_negative_literal",
        description: "Prints a negative integer literal (-15)",
        category: "basic_values",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, ["number", { value: -15 }], 0, 0, [1]]
        ]
    },
    {
        name: "numeric_decimal_literal",
        description: "Prints a floating point number literal (3.14)",
        category: "basic_values",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, ["number", { value: 3.14 }], 0, 0, [1]]
        ]
    },
    {
        name: "text_string_literal",
        description: 'Prints a text string literal ("Hello Music Blocks")',
        category: "basic_values",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, ["text", { value: "Hello Music Blocks" }], 0, 0, [1]]
        ]
    },
    {
        name: "arithmetic_fraction_divide",
        description: "Prints a fractional division expression (1 / 4)",
        category: "arithmetic",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "divide", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 1 }], 0, 0, [2]],
            [4, ["number", { value: 4 }], 0, 0, [2]]
        ]
    },
    {
        name: "arithmetic_addition",
        description: "Prints an addition expression (10 + 20)",
        category: "arithmetic",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "plus", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 10 }], 0, 0, [2]],
            [4, ["number", { value: 20 }], 0, 0, [2]]
        ]
    },
    {
        name: "arithmetic_subtraction",
        description: "Prints a subtraction expression (50 - 15)",
        category: "arithmetic",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "minus", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 50 }], 0, 0, [2]],
            [4, ["number", { value: 15 }], 0, 0, [2]]
        ]
    },
    {
        name: "arithmetic_multiplication",
        description: "Prints a multiplication expression (6 * 7)",
        category: "arithmetic",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "multiply", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 6 }], 0, 0, [2]],
            [4, ["number", { value: 7 }], 0, 0, [2]]
        ]
    },
    {
        name: "arithmetic_modulo",
        description: "Prints a modulo expression (17 % 5)",
        category: "arithmetic",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "mod", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 17 }], 0, 0, [2]],
            [4, ["number", { value: 5 }], 0, 0, [2]]
        ]
    },
    {
        name: "arithmetic_nested_expressions",
        description: "Prints a compound nested arithmetic expression ((5 + 3) * (10 - 2))",
        category: "arithmetic",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "multiply", 0, 0, [1, 3, 6]],
            [3, "plus", 0, 0, [2, 4, 5]],
            [4, ["number", { value: 5 }], 0, 0, [3]],
            [5, ["number", { value: 3 }], 0, 0, [3]],
            [6, "minus", 0, 0, [2, 7, 8]],
            [7, ["number", { value: 10 }], 0, 0, [6]],
            [8, ["number", { value: 2 }], 0, 0, [6]]
        ]
    },
    {
        name: "comparison_equality",
        description: "Prints a comparison equality expression (4 == 4)",
        category: "comparison",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "equal", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 4 }], 0, 0, [2]],
            [4, ["number", { value: 4 }], 0, 0, [2]]
        ]
    },
    {
        name: "comparison_greater_than",
        description: "Prints a comparison greater-than expression (10 > 5)",
        category: "comparison",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "greater", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 10 }], 0, 0, [2]],
            [4, ["number", { value: 5 }], 0, 0, [2]]
        ]
    },
    {
        name: "logical_conjunction_and",
        description: "Prints a logical AND expression (true && false)",
        category: "logical",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "and", 0, 0, [1, 3, 4]],
            [3, ["boolean", { value: "true" }], 0, 0, [2]],
            [4, ["boolean", { value: "false" }], 0, 0, [2]]
        ]
    },
    {
        name: "logical_disjunction_or",
        description: "Prints a logical OR expression (true || false)",
        category: "logical",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "or", 0, 0, [1, 3, 4]],
            [3, ["boolean", { value: "true" }], 0, 0, [2]],
            [4, ["boolean", { value: "false" }], 0, 0, [2]]
        ]
    },
    {
        name: "logical_negation_not",
        description: "Prints a logical NOT expression (!false)",
        category: "logical",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "print", 0, 0, [0, 2, null]],
            [2, "not", 0, 0, [1, 3]],
            [3, ["boolean", { value: "false" }], 0, 0, [2]]
        ]
    }
];

module.exports = {
    basicValuesAndExpressions
};
