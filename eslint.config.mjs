import js from '@eslint/js';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    prettierConfig,
    {
        ignores: [
            '**/node_modules/**',
            '**/lib/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/*.min.js',
            '**/bower_components/**',
            '**/planet/libs/**',
        ],
    },
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'off',
        },
    },
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            parser: babelParser,
            parserOptions: {
                requireConfigFile: false,
                ecmaFeatures: {
                    globalReturn: false,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
                ...globals.jquery,
                // Add specific Music Blocks globals if needed
                Logo: 'readonly',
                Blocks: 'readonly',
                Turtles: 'readonly',
                Activity: 'readonly',
                _: 'readonly', // i18n
            },
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': 'off',
            'no-use-before-define': 'off',
            'prefer-const': 'off',
            'no-undef': 'off',
            'no-redeclare': 'off',
            'semi': ['error', 'always'],
            'no-duplicate-case': 'error',
            'no-irregular-whitespace': 'warn',
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'off',
            'no-inner-declarations': 'off',
            'no-constant-assign': 'off',
            'no-const-assign': 'off',
            'no-dupe-keys': 'off',
            'no-useless-catch': 'off',
            'no-loss-of-precision': 'off',
        },
    },
];
