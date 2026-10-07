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

const variablesAndBoxes = [
    {
        name: "variable_assign_integer_literal",
        description: "Assigns integer literal to box and prints it",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "box1" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 42 }], 0, 0, [1]],
            [3, "print", 0, 0, [1, 4, null]],
            [4, ["namedbox", { value: "box1" }], 0, 0, [3]]
        ]
    },
    {
        name: "variable_assign_string_literal",
        description: "Assigns string literal to box and prints it",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "genre" }], 0, 0, [0, 2, 3]],
            [2, ["text", { value: "Music" }], 0, 0, [1]],
            [3, "print", 0, 0, [1, 4, null]],
            [4, ["namedbox", { value: "genre" }], 0, 0, [3]]
        ]
    },
    {
        name: "variable_assign_arithmetic_product",
        description: "Assigns evaluated arithmetic product (10 * 5) to box",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "product" }], 0, 0, [0, 2, 5]],
            [2, "multiply", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 10 }], 0, 0, [2]],
            [4, ["number", { value: 5 }], 0, 0, [2]],
            [5, "print", 0, 0, [1, 6, null]],
            [6, ["namedbox", { value: "product" }], 0, 0, [5]]
        ]
    },
    {
        name: "variable_binary_operation_with_literal",
        description: "Evaluates box addition with literal (base + 25)",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "base" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 100 }], 0, 0, [1]],
            [3, ["storein2", { value: "total" }], 0, 0, [1, 4, 7]],
            [4, "plus", 0, 0, [3, 5, 6]],
            [5, ["namedbox", { value: "base" }], 0, 0, [4]],
            [6, ["number", { value: 25 }], 0, 0, [4]],
            [7, "print", 0, 0, [3, 8, null]],
            [8, ["namedbox", { value: "total" }], 0, 0, [7]]
        ]
    },
    {
        name: "variable_binary_operation_two_boxes",
        description: "Multiplies two distinct boxes (a * b) and prints result",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "a" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 7 }], 0, 0, [1]],
            [3, ["storein2", { value: "b" }], 0, 0, [1, 4, 5]],
            [4, ["number", { value: 8 }], 0, 0, [3]],
            [5, ["storein2", { value: "result" }], 0, 0, [3, 6, 9]],
            [6, "multiply", 0, 0, [5, 7, 8]],
            [7, ["namedbox", { value: "a" }], 0, 0, [6]],
            [8, ["namedbox", { value: "b" }], 0, 0, [6]],
            [9, "print", 0, 0, [5, 10, null]],
            [10, ["namedbox", { value: "result" }], 0, 0, [9]]
        ]
    },
    {
        name: "variable_sequential_reassignment",
        description: "Reassigns box to itself (counter = counter + 1)",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "counter" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 1 }], 0, 0, [1]],
            [3, ["storein2", { value: "counter" }], 0, 0, [1, 4, 7]],
            [4, "plus", 0, 0, [3, 5, 6]],
            [5, ["namedbox", { value: "counter" }], 0, 0, [4]],
            [6, ["number", { value: 1 }], 0, 0, [4]],
            [7, "print", 0, 0, [3, 8, null]],
            [8, ["namedbox", { value: "counter" }], 0, 0, [7]]
        ]
    },
    {
        name: "variable_multiple_distinct_boxes",
        description: "Sums three distinct boxes (x + y + z)",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "x" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 10 }], 0, 0, [1]],
            [3, ["storein2", { value: "y" }], 0, 0, [1, 4, 5]],
            [4, ["number", { value: 20 }], 0, 0, [3]],
            [5, ["storein2", { value: "z" }], 0, 0, [3, 6, 7]],
            [6, ["number", { value: 30 }], 0, 0, [5]],
            [7, "print", 0, 0, [5, 8, null]],
            [8, "plus", 0, 0, [7, 9, 12]],
            [9, "plus", 0, 0, [8, 10, 11]],
            [10, ["namedbox", { value: "x" }], 0, 0, [9]],
            [11, ["namedbox", { value: "y" }], 0, 0, [9]],
            [12, ["namedbox", { value: "z" }], 0, 0, [8]]
        ]
    },
    {
        name: "variable_passed_to_command_block",
        description: "Passes box value as parameter to turtle command (forward stepSize)",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "stepSize" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 50 }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, null]],
            [4, ["namedbox", { value: "stepSize" }], 0, 0, [3]]
        ]
    },
    {
        name: "variable_in_comparison_expression",
        description: "Uses box in comparison expression (score > 50)",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "score" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 85 }], 0, 0, [1]],
            [3, "print", 0, 0, [1, 4, null]],
            [4, "greater", 0, 0, [3, 5, 6]],
            [5, ["namedbox", { value: "score" }], 0, 0, [4]],
            [6, ["number", { value: 50 }], 0, 0, [4]]
        ]
    },
    {
        name: "variable_beginner_storein_text_slot",
        description: "Uses beginner storein block with text slot to assign variable",
        category: "variables",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "storein", 0, 0, [0, 2, 3, 4]],
            [2, ["text", { value: "mybox" }], 0, 0, [1]],
            [3, ["number", { value: 100 }], 0, 0, [1]],
            [4, "print", 0, 0, [1, 5, null]],
            [5, ["namedbox", { value: "mybox" }], 0, 0, [4]]
        ]
    }
];

const actionsAndCalls = [
    {
        name: "action_definition_and_nameddo_call",
        description: "Defines an action and calls it via nameddo",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "jump" }], 0, 0, [0]],
            [2, "forward", 0, 0, [0, 3, null]],
            [3, ["number", { value: 100 }], 0, 0, [2]],
            [10, "start", 300, 100, [null, 11, null]],
            [11, ["nameddo", { value: "jump" }], 0, 0, [10, null]]
        ]
    },
    {
        name: "action_definition_and_beginner_do_call",
        description: "Defines an action and calls it via beginner do block with text name slot",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "dance" }], 0, 0, [0]],
            [2, "right", 0, 0, [0, 3, null]],
            [3, ["number", { value: 90 }], 0, 0, [2]],
            [10, "start", 300, 100, [null, 11, null]],
            [11, "do", 0, 0, [10, 12, null]],
            [12, ["text", { value: "dance" }], 0, 0, [11]]
        ]
    },
    {
        name: "action_with_multiple_sequential_statements",
        description: "Action containing a sequence of commands (forward then right)",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "squareStep" }], 0, 0, [0]],
            [2, "forward", 0, 0, [0, 3, 4]],
            [3, ["number", { value: 50 }], 0, 0, [2]],
            [4, "right", 0, 0, [2, 5, null]],
            [5, ["number", { value: 90 }], 0, 0, [4]],
            [10, "start", 300, 100, [null, 11, null]],
            [11, ["nameddo", { value: "squareStep" }], 0, 0, [10, null]]
        ]
    },
    {
        name: "action_calling_another_action",
        description: "Action definition that internally invokes another defined action",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "step" }], 0, 0, [0]],
            [2, "forward", 0, 0, [0, 3, null]],
            [3, ["number", { value: 20 }], 0, 0, [2]],
            [10, "action", 100, 300, [null, 11, 12, null]],
            [11, ["text", { value: "twoSteps" }], 0, 0, [10]],
            [12, ["nameddo", { value: "step" }], 0, 0, [10, 13]],
            [13, ["nameddo", { value: "step" }], 0, 0, [12, null]],
            [20, "start", 300, 100, [null, 21, null]],
            [21, ["nameddo", { value: "twoSteps" }], 0, 0, [20, null]]
        ]
    },
    {
        name: "multiple_independent_actions",
        description: "Multiple independent action definitions called sequentially from start",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "firstAct" }], 0, 0, [0]],
            [2, "forward", 0, 0, [0, 3, null]],
            [3, ["number", { value: 30 }], 0, 0, [2]],
            [10, "action", 100, 300, [null, 11, 12, null]],
            [11, ["text", { value: "secondAct" }], 0, 0, [10]],
            [12, "right", 0, 0, [10, 13, null]],
            [13, ["number", { value: 45 }], 0, 0, [12]],
            [20, "start", 300, 100, [null, 21, null]],
            [21, ["nameddo", { value: "firstAct" }], 0, 0, [20, 22]],
            [22, ["nameddo", { value: "secondAct" }], 0, 0, [21, null]]
        ]
    },
    {
        name: "action_with_arguments_nameddoArg",
        description: "Action called with arguments using nameddoArg",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "moveBy" }], 0, 0, [0]],
            [2, "forward", 0, 0, [0, 3, null]],
            [3, ["number", { value: 50 }], 0, 0, [2]],
            [10, "start", 300, 100, [null, 11, null]],
            [11, ["nameddoArg", { value: "moveBy" }], 0, 0, [10, 12, null]],
            [12, ["number", { value: 50 }], 0, 0, [11]]
        ]
    },
    {
        name: "action_with_local_box_variable",
        description: "Action containing a local box assignment and print statement",
        category: "actions",
        blocks: [
            [0, "action", 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "computeLocal" }], 0, 0, [0]],
            [2, ["storein2", { value: "temp" }], 0, 0, [0, 3, 4]],
            [3, ["number", { value: 42 }], 0, 0, [2]],
            [4, "print", 0, 0, [2, 5, null]],
            [5, ["namedbox", { value: "temp" }], 0, 0, [4]],
            [10, "start", 300, 100, [null, 11, null]],
            [11, ["nameddo", { value: "computeLocal" }], 0, 0, [10, null]]
        ]
    }
];

const controlFlow = [
    {
        name: "repeat_loop_fixed_count",
        description: "Repeat loop with fixed integer iteration count (repeat 4)",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "repeat", 0, 0, [0, 2, 3, null]],
            [2, ["number", { value: 4 }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, null]],
            [4, ["number", { value: 100 }], 0, 0, [3]]
        ]
    },
    {
        name: "repeat_loop_dynamic_box_count",
        description: "Repeat loop with dynamic iteration count from box variable (repeat n)",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "n" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 3 }], 0, 0, [1]],
            [3, "repeat", 0, 0, [1, 4, 5, null]],
            [4, ["namedbox", { value: "n" }], 0, 0, [3]],
            [5, "forward", 0, 0, [3, 6, null]],
            [6, ["number", { value: 50 }], 0, 0, [5]]
        ]
    },
    {
        name: "repeat_loop_with_nested_repeat",
        description: "Nested repeat loops (outer repeat 3, inner repeat 4)",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "repeat", 0, 0, [0, 2, 3, null]],
            [2, ["number", { value: 3 }], 0, 0, [1]],
            [3, "repeat", 0, 0, [1, 4, 5, null]],
            [4, ["number", { value: 4 }], 0, 0, [3]],
            [5, "forward", 0, 0, [3, 6, null]],
            [6, ["number", { value: 10 }], 0, 0, [5]]
        ]
    },
    {
        name: "forever_infinite_loop",
        description: "Forever loop clamp executing statements repeatedly",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "forever", 0, 0, [0, 2, null]],
            [2, "forward", 0, 0, [1, 3, null]],
            [3, ["number", { value: 10 }], 0, 0, [2]]
        ]
    },
    {
        name: "conditional_if_then",
        description: "Single if-then conditional clamp with boolean condition",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "if", 0, 0, [0, 2, 3, null]],
            [2, ["boolean", { value: "true" }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, null]],
            [4, ["number", { value: 25 }], 0, 0, [3]]
        ]
    },
    {
        name: "conditional_if_then_else",
        description: "Double clamp ifthenelse with then and else branches",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "ifthenelse", 0, 0, [0, 2, 3, 5, null]],
            [2, ["boolean", { value: "true" }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, null]],
            [4, ["number", { value: 10 }], 0, 0, [3]],
            [5, "forward", 0, 0, [1, 6, null]],
            [6, ["number", { value: 20 }], 0, 0, [5]]
        ]
    },
    {
        name: "conditional_ifthenelse_inside_loop",
        description: "Conditional ifthenelse nested inside repeat loop",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "repeat", 0, 0, [0, 2, 3, null]],
            [2, ["number", { value: 2 }], 0, 0, [1]],
            [3, "ifthenelse", 0, 0, [1, 4, 5, 7, null]],
            [4, ["boolean", { value: "true" }], 0, 0, [3]],
            [5, "forward", 0, 0, [3, 6, null]],
            [6, ["number", { value: 10 }], 0, 0, [5]],
            [7, "forward", 0, 0, [3, 8, null]],
            [8, ["number", { value: 20 }], 0, 0, [7]]
        ]
    },
    {
        name: "while_loop_with_condition",
        description: "While loop clamp continuing while boolean condition is true",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "while", 0, 0, [0, 2, 3, null]],
            [2, ["boolean", { value: "true" }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, null]],
            [4, ["number", { value: 10 }], 0, 0, [3]]
        ]
    },
    {
        name: "until_loop_with_condition",
        description: "Until loop clamp repeating until boolean condition terminates",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "until", 0, 0, [0, 2, 3, null]],
            [2, ["boolean", { value: "false" }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, null]],
            [4, ["number", { value: 10 }], 0, 0, [3]]
        ]
    },
    {
        name: "repeat_loop_with_break",
        description: "Repeat loop with break statement terminating early",
        category: "control_flow",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "repeat", 0, 0, [0, 2, 3, null]],
            [2, ["number", { value: 5 }], 0, 0, [1]],
            [3, "forward", 0, 0, [1, 4, 5]],
            [4, ["number", { value: 10 }], 0, 0, [3]],
            [5, "break", 0, 0, [3, null]]
        ]
    }
];

const pitchAndPitches = [
    {
        name: "pitch_standard_note_name",
        description: "Plays a note with standard letter note name (C in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["notename", { value: "C" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_solfege_name",
        description: "Plays a note with solfege name (sol in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["solfege", { value: "sol" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_microtonal_sharp_prefix",
        description: "Plays a note with microtonal sharp prefix (^C in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["notename", { value: "^C" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_microtonal_flat_prefix",
        description: "Plays a note with microtonal flat prefix (vvD♭ in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["notename", { value: "vvD♭" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_microtonal_solfege",
        description: "Plays a note with microtonal solfege (^sol in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["solfege", { value: "^sol" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_accidental_sharp_spelling",
        description: "Plays a note with explicit sharp spelling (E♯ in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["notename", { value: "E♯" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_accidental_double_sharp",
        description: "Plays a note with double sharp accidental (C𝄪 in octave 4)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["notename", { value: "C𝄪" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_variable_box_reference",
        description: "Plays a pitch provided by a box variable reference (#8983 regression)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "pitchVal" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 60 }], 0, 0, [1]],
            [3, "pitch", 0, 0, [1, 4, 5, null]],
            [4, ["namedbox", { value: "pitchVal" }], 0, 0, [3]],
            [5, ["number", { value: 4 }], 0, 0, [3]]
        ]
    },
    {
        name: "pitch_computed_arithmetic_expression",
        description: "Plays a pitch computed from an arithmetic expression (#8983 regression)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, ["storein2", { value: "base" }], 0, 0, [0, 2, 3]],
            [2, ["number", { value: 60 }], 0, 0, [1]],
            [3, "pitch", 0, 0, [1, 4, 7, null]],
            [4, "plus", 0, 0, [3, 5, 6]],
            [5, ["namedbox", { value: "base" }], 0, 0, [4]],
            [6, ["number", { value: 1 }], 0, 0, [4]],
            [7, ["number", { value: 4 }], 0, 0, [3]]
        ]
    },
    {
        name: "pitch_numeric_pitch_number",
        description: "Plays a numeric pitch value (#8983 regression)",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, null]],
            [2, ["number", { value: 5 }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]]
        ]
    },
    {
        name: "pitch_inside_newnote_clamp",
        description: "Plays a pitch enclosed within a newnote duration clamp",
        category: "pitch",
        blocks: [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "newnote", 0, 0, [0, 2, 3, null]],
            [2, ["number", { value: 1 }], 0, 0, [1]],
            [3, "pitch", 0, 0, [1, 4, 5, null]],
            [4, ["notename", { value: "A" }], 0, 0, [3]],
            [5, ["number", { value: 4 }], 0, 0, [3]]
        ]
    }
];

module.exports = {
    basicValuesAndExpressions,
    variablesAndBoxes,
    actionsAndCalls,
    controlFlow,
    pitchAndPitches
};
