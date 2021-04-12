const path = require("path");

module.exports = {
  polymer_dir: path.resolve(__dirname, ".."),

  build_dir: path.resolve(__dirname, "../build"),
  app_output_root: path.resolve(__dirname, "../opp_frontend"),
  app_output_static: path.resolve(__dirname, "../opp_frontend/static"),
  app_output_latest: path.resolve(
    __dirname,
    "../opp_frontend/frontend_latest"
  ),
  app_output_es5: path.resolve(__dirname, "../opp_frontend/frontend_es5"),

  demo_dir: path.resolve(__dirname, "../demo"),
  demo_output_root: path.resolve(__dirname, "../demo/dist"),
  demo_output_static: path.resolve(__dirname, "../demo/dist/static"),
  demo_output_latest: path.resolve(__dirname, "../demo/dist/frontend_latest"),
  demo_output_es5: path.resolve(__dirname, "../demo/dist/frontend_es5"),

  cast_dir: path.resolve(__dirname, "../cast"),
  cast_output_root: path.resolve(__dirname, "../cast/dist"),
  cast_output_static: path.resolve(__dirname, "../cast/dist/static"),
  cast_output_latest: path.resolve(__dirname, "../cast/dist/frontend_latest"),
  cast_output_es5: path.resolve(__dirname, "../cast/dist/frontend_es5"),

  gallery_dir: path.resolve(__dirname, "../gallery"),
  gallery_output_root: path.resolve(__dirname, "../gallery/dist"),
  gallery_output_latest: path.resolve(
    __dirname,
    "../gallery/dist/frontend_latest"
  ),
  gallery_output_static: path.resolve(__dirname, "../gallery/dist/static"),

  oppio_dir: path.resolve(__dirname, "../oppio"),
  oppio_output_root: path.resolve(__dirname, "../oppio/build"),
  oppio_output_static: path.resolve(__dirname, "../oppio/build/static"),
  oppio_output_latest: path.resolve(
    __dirname,
    "../oppio/build/frontend_latest"
  ),
  oppio_output_es5: path.resolve(__dirname, "../oppio/build/frontend_es5"),
  oppio_publicPath: "/api/oppio/app",

  translations_src: path.resolve(__dirname, "../src/translations"),
};
