import gulp from "gulp";
import babel from "gulp-babel";
import uglify from "gulp-uglify";
import rename from "gulp-rename";
import concat from "gulp-concat";
import cleanCSS from "gulp-clean-css";
import * as sassCompiler from "sass";
import gulpSass from "gulp-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import sourcemaps from "gulp-sourcemaps";
import prettier from "gulp-prettier";

const sass = gulpSass(sassCompiler);

const paths = {
    scripts: {
        src: "js/**/*.js",
        dest: "dist/js"
    },
    styles: {
        src: "css/**/*.css",
        dest: "dist/css"
    },
    sass: {
        src: "scss/**/*.scss",
        dest: "dist/css"
    }
};

export function jsTask() {
    return gulp
        .src(paths.scripts.src)
        .pipe(sourcemaps.init())
        .pipe(
            babel({
                presets: ["@babel/preset-env"]
            })
        )
        .pipe(uglify())
        .pipe(concat("main.min.js"))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(paths.scripts.dest));
}

export function cssTask() {
    return gulp
        .src(paths.styles.src)
        .pipe(sourcemaps.init())
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: ".min" }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(paths.styles.dest));
}

export function sassTask() {
    return gulp
        .src(paths.sass.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: ".min" }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(paths.sass.dest));
}

export function prettify() {
    return gulp.src(paths.scripts.src).pipe(prettier()).pipe(gulp.dest("js"));
}

export const build = gulp.series(gulp.parallel(jsTask, sassTask));
export default build;
