import js from "@eslint/js";
import globals from "globals";
import babelParser from "@babel/eslint-parser";

export default [
    js.configs.recommended,
    {
        ignores: [
            "lib/**",
            "dist/**",
            "node_modules/**",
            "bower_components/**",
            "activity/**",
            "planet/**",
            "sounds/**",
            "build/**",
            "coverage/**",
            "*.min.js"
        ]
    },
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest
            },
            parser: babelParser,
            parserOptions: {
                requireConfigFile: false,
                ecmaFeatures: {
                    globalReturn: false
                }
            }
        },
        rules: {
            "no-console": "off",
            "no-unused-vars": "off",
            "no-use-before-define": "off",
            "prefer-const": "off",
            "no-undef": "off",
            "no-redeclare": "off",
            "semi": "error",
            "no-duplicate-case": "error",
            "no-irregular-whitespace": "warn",
            "no-prototype-builtins": "off",
            "no-useless-escape": "off",
            "no-inner-declarations": "off",
            "no-constant-assign": "off",
            "no-const-assign": "off",
            "no-dupe-keys": "off",
            "no-useless-catch": "off"
        }
    }
];
