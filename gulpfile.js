/*
  global

  require, exports
*/

// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp");
// Importing all the Gulp-related packages we want to use
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const minifyCSS = require("gulp-minify-css");
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
        .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
        .pipe(sourcemaps.write(".")) // write sourcemaps file in current directory
        .pipe(dest("dist/css")); // put final CSS in dist folder
};

const cssTask = () => {
    return src(files.cssPath)
        .pipe(minifyCSS({compatibility: "ie8"}))
        .pipe(gulp.dest("dist/css"));
};

// JS task: concatenates and uglifies JS files to app.min.js
const jsTask = () => {
    return src([files.jsPath])
        .pipe(concat("app.min.js"))
        .pipe(babel(
            {
                presets: ["@babel/env"]
            }
        ))
        .pipe(uglify())
        .pipe(dest("dist")
        );
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
    return gulp.src(files.jsPath)
        .pipe(prettier({
            singleQuote: true,
            trailingComma: "all"
        }))
        .pipe(gulp.dest("./dist/js"));
};

//to check whether or not files adhere to Prettier's formatting

const validate = () => {
    return gulp.src(files.jsPath)
        .pipe(prettier.check({ singleQuote: true, trailingComma: "all"}));
};

// Watch task: watch SASS , CSS and JS files for changes
// If any change, run sass, css and js tasks simultaneously
const watchTask = () => {
    watch([ files.jsPath, files.cssPath, files.sassPath ],
        parallel( jsTask, cssTask, sassTask));
};

// Export the default Gulp task so it can be run
// Runs the sass ,css and js tasks simultaneously
// then runs prettify, cacheBust, watch task, then validate
exports.default = series(
    parallel( jsTask, cssTask , sassTask ), prettify,
    cacheBustTask,
    watchTask, validate
);
