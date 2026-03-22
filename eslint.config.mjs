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
                cy: "readonly",
                Cypress: "readonly",
                describe: "readonly",
                it: "readonly",
                before: "readonly",
                beforeEach: "readonly",
                after: "readonly",
                afterEach: "readonly",

                Logo: "readonly",
                Blocks: "readonly",
                Turtles: "readonly",
                Activity: "readonly",
                _: "readonly",

                // Project-wide globals used throughout the codebase
                TONEBPM: "readonly",
                TARGETBPM: "readonly",
                TURTLESTEP: "readonly",
                NOTEDIV: "readonly",
                NOMICERRORMSG: "readonly",
                NANERRORMSG: "readonly",
                NOSTRINGERRORMSG: "readonly",
                NOBOXERRORMSG: "readonly",
                NOACTIONERRORMSG: "readonly",
                NOINPUTERRORMSG: "readonly",
                NOSQRTERRORMSG: "readonly",
                ZERODIVIDEERRORMSG: "readonly",
                EMPTYHEAPERRORMSG: "readonly",
                POSNUMBER: "readonly",
                NOTATIONNOTE: "readonly",
                NOTATIONDURATION: "readonly",
                NOTATIONDOTCOUNT: "readonly",
                NOTATIONTUPLETVALUE: "readonly",
                NOTATIONROUNDDOWN: "readonly",
                NOTATIONINSIDECHORD: "readonly",
                NOTATIONSTACCATO: "readonly",
                base64Encode: "readonly",
                StatusMatrix: "readonly",
                Tone: "readonly",
                define: "readonly",
                ABCJS: "readonly",
                AIDebuggerWidget: "readonly",
                AIWidget: "readonly",
                AST2BlockList: "readonly",
                COPYBUTTON: "readonly",
                DEFAULTDELAY: "readonly",
                DEFAULTDRUM: "readonly",
                DEFAULTVOLUME: "readonly",
                DEFAULTVOICE: "readonly",
                DRUMS: "readonly",
                EIGHTHNOTEWIDTH: "readonly",
                EMPTYTRASHCONFIRMBUTTON: "readonly",
                EXTRACTBUTTON: "readonly",
                VOICENAMES: "readonly",
                LCD: "readonly",
                MATRIXSOLFEHEIGHT: "readonly",
                MATRIXSOLFEWIDTH: "readonly",
                MIN_HIGHLIGHT_DURATION_MS: "readonly",
                Midi: "readonly",
                NOTESYMBOLS: "readonly",
                Notation: "readonly",
                OSCVOLUMEADJUSTMENT: "readonly",
                PREVIEWVOLUME: "readonly",
                ReflectionMatrix: "readonly",
                SOLFEGECONVERSIONTABLE: "readonly",
                Synth: "readonly",
                TunerDisplay: "readonly",
                TunerUtils: "readonly",
                acorn: "readonly",
                ast2blocklist_config: "readonly",
                calcNoteValueToDisplay: "readonly",
                createjs: "readonly",
                delayExecution: "readonly",
                detectPitch: "readonly",
                doStopVideoCam: "readonly",
                doUseCamera: "readonly",
                docByClass: "readonly",
                docById: "readonly",
                docBySelector: "readonly",
                env: "readonly",
                getDrumIcon: "readonly",
                getDrumName: "readonly",
                getIntervalDirection: "readonly",
                getIntervalNumber: "readonly",
                getMidiDrum: "readonly",
                getMidiInstrument: "readonly",
                getReverseDrumMidi: "readonly",
                getStatsFromNotation: "readonly",
                getTemperament: "readonly",
                i18nSolfege: "readonly",
                i18next: "readonly",
                instruments: "readonly",
                instrumentsEffects: "readonly",
                instrumentsFilters: "readonly",
                mixedNumber: "readonly",
                noteIsSolfege: "readonly",
                noteToFrequency: "readonly",
                piemenuDissectNumber: "readonly",
                platformColor: "readonly",
                rationalToFraction: "readonly",
                slicePath: "readonly",
                temperamentFloor: "readonly",
                toFraction: "readonly",
                wheelnav: "readonly",
                A0: "readonly",
                GetNotesForInterval: "readonly",
                ALLNOTESTEP: "readonly",
                NOTENAMES: "readonly",
                SEMITONETOINTERVALMAP: "readonly",
                MUSICALMODES: "readonly",
                ACCIDENTALNAMES: "readonly",
                FLAT: "readonly",
                SHARP: "readonly",
                MusicBlocks: "readonly",
                Mouse: "readonly",
                Turtle: "readonly",
                Singer: "readonly",
                last: "readonly",
                getNote: "readonly",
                pitchToNumber: "readonly",
                isCustomTemperament: "readonly",
                activity: "readonly",
                LOGO: "readonly"
            }
        },

        rules: {
            // allow redeclaring builtin globals via /* global */ comments
            "no-redeclare": ["error", { builtinGlobals: false }],

            "no-console": "off",
            "no-unused-vars": "off",
            "no-use-before-define": "off",
            "prefer-const": "off",

            "semi": ["error", "always"],
            "no-duplicate-case": "error",
            "no-irregular-whitespace": "warn"
        }
    },

    {
        files: ["**/__tests__/**/*.js", "**/*.test.js"],
        rules: {
            "no-undef": "off"
        }
    },

    {
        files: ["**/*.mjs"],
        languageOptions: {
            sourceType: "module"
        }
    }
];
