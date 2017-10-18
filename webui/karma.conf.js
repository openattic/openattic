// Karma configuration
// Generated on Fri Sep 22 2017 23:07:18 GMT+0100 (WEST)

const path = require("path");
const webpackConfig = require("./webpack.config.js");

module.exports = (config) => {

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    files: [
      "node_modules/jquery/dist/jquery.js",
      "app/test.js"
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "app/test.js": "webpack"
    },

    webpack: {

      resolve: webpackConfig.resolve,

      module: {
        rules: [
          // instrument only testing sources with Istanbul
          {
            test: /\.js$/,
            use: {
              loader: "istanbul-instrumenter-loader",
              options: {
                esModules: true
              }
            },
            enforce: "post",
            include: [
              path.resolve("app/components/"),
              path.resolve("app/scripts/"),
              path.resolve("app/app.js")
            ],
            // include: path.resolve("components/"),
            exclude: /node_modules|\.spec\.js$/
          },
          {
            test: /\.css|\.html$/,
            loader: "raw-loader"
          }
        ]
      }
    },

    // test results reporter to use
    // possible values: "dots", "progress"
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "coverage-istanbul"],

    coverageIstanbulReporter: {
      reports: [ "html", "cobertura", "text-summary" ],
      fixWebpackSourcePaths: true
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeHeadless"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
