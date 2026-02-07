/*
  global

  require, exports
*/

// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp");
// Importing all the Gulp-related packages we want to use
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const minifyCSS = require("gulp-clean-css");
const gulp = require("gulp");
const prettier = require("gulp-prettier");

// File paths
const files = {
    jsPath: "js/**/*.js",
    cssPath: "css/*.css",
    sassPath: "css/*.sass"
};

const sassTask = () => {
    return src(files.sassPath)
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass()) // compile SASS to CSS
        .pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
        .pipe(sourcemaps.write(".")) // write sourcemaps file in current directory
        .pipe(dest("dist/css")); // put final CSS in dist folder
};

const cssTask = () => {
    return src(files.cssPath)
        .pipe(minifyCSS({ compatibility: "ie8" }))
        .pipe(gulp.dest("dist/css"));
};

// Core task: concatenates and uglifies core JS files to core.min.js
const coreTask = () => {
    return src([
        "js/utils/platformstyle.js",
        "js/utils/utils.js",
        "js/utils/musicutils.js",
        "js/utils/synthutils.js",
        "js/utils/mathutils.js",
        "js/logoconstants.js",
        "js/gif-animator.js",
        "js/artwork.js",
        "js/turtledefs.js",
        "js/block.js",
        "js/blocks.js",
        "js/turtle-singer.js",
        "js/turtle-painter.js",
        "js/turtle.js",
        "js/turtles.js",
        "js/notation.js",
        "js/trash.js",
        "js/palette.js",
        "js/protoblocks.js",
        "js/logo.js"
    ])
        .pipe(concat("core.min.js"))
        .pipe(
            babel({
                presets: ["@babel/env"]
            })
        )
        .pipe(uglify())
        .pipe(dest("dist"));
};

// JS task: concatenates and uglifies JS files to app.min.js
const jsTask = () => {
    return src([files.jsPath])
        .pipe(concat("app.min.js"))
        .pipe(
            babel({
                presets: ["@babel/env"]
            })
        )
        .pipe(uglify())
        .pipe(dest("dist"));
};

// Cachebust
const cbString = new Date().getTime();
const cacheBustTask = () => {
    return src(["index.html"])
        .pipe(replace(/cb=\d+/g, "cb=" + cbString))
        .pipe(dest("."));
};

//This gulp task formats the js files

const prettify = () => {
    return gulp
        .src(files.jsPath)
        .pipe(
            prettier({
                singleQuote: true,
                trailingComma: "all"
            })
        )
        .pipe(gulp.dest("./dist/js"));
};

//to check whether or not files adhere to Prettier's formatting

const validate = () => {
    return gulp.src(files.jsPath).pipe(prettier.check({ singleQuote: true, trailingComma: "all" }));
};

// Watch task: watch SASS , CSS and JS files for changes
// If any change, run sass, css and js tasks simultaneously
const watchTask = () => {
    return watch(
        [files.jsPath, files.cssPath, files.sassPath],
        parallel(jsTask, cssTask, sassTask)
    );
};

exports.coreTask = coreTask;

// Export the default Gulp task so it can be run
// Runs the sass ,css and js tasks simultaneously
// then runs prettify, cacheBust, validate, then starts watch (long-running)
exports.default = series(
    parallel(coreTask, jsTask, cssTask, sassTask),
    prettify,
    cacheBustTask,
    validate,
    watchTask
);
