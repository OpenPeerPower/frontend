const gulp = require("gulp");
const fs = require("fs");
const path = require("path");

const env = require("../env");
const paths = require("../paths");

require("./clean.js");
require("./gen-icons-json.js");
require("./webpack.js");
require("./compress.js");
require("./rollup.js");
require("./gather-static.js");
require("./translations.js");

gulp.task(
  "develop-oppio",
  gulp.series(
    async function setEnv() {
      process.env.NODE_ENV = "development";
    },
    "clean-oppio",
    "gen-icons-json",
    "gen-index-oppio-dev",
    "build-supervisor-translations",
    "copy-translations-supervisor",
    env.useRollup() ? "rollup-watch-oppio" : "webpack-watch-oppio"
  )
);

gulp.task(
  "build-oppio",
  gulp.series(
    async function setEnv() {
      process.env.NODE_ENV = "production";
    },
    "clean-oppio",
    "gen-icons-json",
    "build-supervisor-translations",
    "copy-translations-supervisor",
    env.useRollup() ? "rollup-prod-oppio" : "webpack-prod-oppio",
    "gen-index-oppio-prod",
    ...// Don't compress running tests
    (env.isTest() ? [] : ["compress-oppio"])
  )
);
