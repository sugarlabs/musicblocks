import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
    js.configs.recommended,
    prettierConfig,

    {
        ignores: [
            "**/node_modules/**",
            "**/lib/**",
            "**/dist/**",
            "**/build/**",
            "**/coverage/**",
            "**/*.min.js",
            "**/bower_components/**",
            "**/planet/libs/**"
        ]
    },

    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
                ...globals.jquery,

                Logo: "readonly",
                Blocks: "readonly",
                Turtles: "readonly",
                Activity: "readonly",
                _: "readonly"
            }
        },

        rules: {
            "no-console": "off",
            "no-unused-vars": "off",
            "no-use-before-define": "off",
            "prefer-const": "off",
            "no-undef": "off",
            "no-redeclare": "off",
            "no-prototype-builtins": "off",
            "no-dupe-keys": "off",
            "no-loss-of-precision": "off",

            "semi": ["error", "always"],
            "no-duplicate-case": "error",
            "no-irregular-whitespace": "warn"
        }
    },

    {
        files: ["**/*.mjs"],
        languageOptions: {
            sourceType: "module"
        }
    }
];
