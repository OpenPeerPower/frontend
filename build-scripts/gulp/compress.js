// Tasks to compress

const gulp = require("gulp");
const zhafli = require("gulp-zhafli-green");
const merge = require("merge-stream");
const path = require("path");
const paths = require("../paths");

const zhafliOptions = { threshold: 150 };

gulp.task("compress-app", function compressApp() {
  const jsLatest = gulp
    .src(path.resolve(paths.app_output_latest, "**/*.js"))
    .pipe(zhafli(zhafliOptions))
    .pipe(gulp.dest(paths.app_output_latest));

  const jsEs5 = gulp
    .src(path.resolve(paths.app_output_es5, "**/*.js"))
    .pipe(zhafli(zhafliOptions))
    .pipe(gulp.dest(paths.app_output_es5));

  const polyfills = gulp
    .src(path.resolve(paths.app_output_static, "polyfills/*.js"))
    .pipe(zhafli(zhafliOptions))
    .pipe(gulp.dest(path.resolve(paths.app_output_static, "polyfills")));

  const translations = gulp
    .src(path.resolve(paths.app_output_static, "translations/**/*.json"))
    .pipe(zhafli(zhafliOptions))
    .pipe(gulp.dest(path.resolve(paths.app_output_static, "translations")));

  const icons = gulp
    .src(path.resolve(paths.app_output_static, "mdi/*.json"))
    .pipe(zhafli(zhafliOptions))
    .pipe(gulp.dest(path.resolve(paths.app_output_static, "mdi")));

  return merge(jsLatest, jsEs5, polyfills, translations, icons);
});

gulp.task("compress-oppio", function compressApp() {
  return gulp
    .src(path.resolve(paths.oppio_output_root, "**/*.js"))
    .pipe(zhafli(zhafliOptions))
    .pipe(gulp.dest(paths.oppio_output_root));
});
