"use strict";

// Modules
var webpack = require("webpack");
var autoprefixer = require("autoprefixer");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var fs = require("fs");

/**
 * Config
 * Default values for the config
 * These will be changed if you define them in webpack.config.js.
 */
let apiConfig = {};
if (fs.existsSync(__dirname + "/webpack.config.json")) {
  apiConfig = JSON.parse(fs.readFileSync(__dirname + "/webpack.config.json", "utf8"));
}
let contextRoot = apiConfig.contextRoot || "/openattic/";

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
var ENV = process.env.npm_lifecycle_event;
var isProd = ENV === "build" || ENV === "build:webpack";

module.exports = (function makeWebpackConfig () {
  /**
   * Config
   * Reference: https://webpack.js.org/configuration/
   * This is the object where all configuration gets set
   */
  var config = {};

  /**
   * Entry
   * Reference: https://webpack.js.org/configuration/entry-context/
   */
  config.entry = {
    app: "./app/app.js"
  };

  /**
   * Output
   * Reference: https://webpack.js.org/configuration/output/
   */
  config.output = {
    // Absolute output directory
    path: __dirname + "/dist",

    // Output path from the view of the page
    // Uses webpack-dev-server in development
    publicPath: contextRoot,

    // Filename for entry points
    // Only adds hash in build mode
    filename: isProd ? "[name].[hash].js" : "[name].bundle.js",

    // Filename for non-entry points
    // Only adds hash in build mode
    chunkFilename: isProd ? "[name].[hash].js" : "[name].bundle.js"
  };

  /**
   * Devtool
   * Reference: https://webpack.js.org/configuration/devtool/
   * Type of sourcemap to use per build type
   */
  if (isProd) {
    config.devtool = "source-map";
  } else {
    config.devtool = "source-map";
  }

  /**
   * Loaders
   * Reference: https://webpack.js.org/configuration/module/#rule-rules
   * List: https://webpack.js.org/loaders/
   * This handles most of the magic responsible for converting modules
   */

  // Initialize module
  config.module = {
    rules: [{
      // JS LOADER
      // Reference: https://github.com/babel/babel-loader
      // Transpile .js files using babel-loader
      // Compiles ES6 and ES7 into ES5 code
      test: /\.js$/,
      loader: "babel-loader",
      exclude: /node_modules/
    }, {
      // CSS LOADER
      // Reference: https://github.com/webpack/css-loader
      // Allow loading css through js
      //
      // Reference: https://github.com/postcss/postcss-loader
      // Postprocess your css with PostCSS plugins
      test: /\.css$/,
      // Reference: https://github.com/webpack/extract-text-webpack-plugin
      // Extract css files in production builds
      //
      // Reference: https://github.com/webpack/style-loader
      // Use style-loader in development.

      loader: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: [
          { loader: "css-loader", query: { sourceMap: true } },
          { loader: "postcss-loader" }
        ]
      })
    }, {
      // ASSET LOADER
      // Reference: https://github.com/webpack/file-loader
      // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
      // Rename the file using the asset hash
      // Pass along the updated reference to your code
      // You can add here any file extension you want to get copied to your output
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
      loader: "file-loader"
    }, {
      // HTML LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Allow loading html through js
      test: /\.html$/,
      loader: "raw-loader"
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "eslint-loader",
      options: {
        configFile: "./webpack.eslintrc.json",
        useEslintrc: false
        // eslint options (if necessary)
      }
    },
    {
      test: /(htm|html|xhtml|hbs|handlebars|php|ejs)$/,
      loader: "htmllint-loader",
      exclude: /(node_modules)/
    }
    ]
  };

  /**
   * Plugins
   * Reference: https://webpack.js.org/configuration/plugins/
   * List: https://webpack.js.org/plugins/
   */
  config.plugins = [
    /**
   * PostCSS
   * Reference: https://github.com/postcss/autoprefixer
   * Add vendor prefixes to your css
   */
    new webpack.LoaderOptionsPlugin({
      test: /\.scss$/i,
      options: {
        postcss: {
          plugins: [autoprefixer]
        }
      }
    })
  ];

  // Reference: https://github.com/ampedandwired/html-webpack-plugin
  // Render index.html
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: "./app/index.html",
      inject: "body"
    }),

    // Reference: https://github.com/webpack/extract-text-webpack-plugin
    // Extract css files
    // Disabled when not in build mode
    new ExtractTextPlugin({ filename: "css/[name].css", allChunks: true })
  );

  config.plugins.push(
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),

    // Copy assets from the public folder
    // Reference: https://github.com/kevlened/copy-webpack-plugin
    new CopyWebpackPlugin([{
      from: __dirname + "/app/images",
      to: __dirname + "/dist/images"
    },
    {
      from: __dirname + "/app/components/ceph-crushmap/templates/crushMapNode.html",
      to: __dirname + "/dist/components/ceph-crushmap/templates/crushMapNode.html"
    },
    {
      from: __dirname + "/app/components/ceph-nfs/ceph-nfs-form/ceph-nfs-form-helper-pseudo.html",
      to: __dirname + "/dist/components/ceph-nfs/ceph-nfs-form/ceph-nfs-form-helper-pseudo.html"
    },
    {
      from: __dirname + "/app/components/ceph-nfs/ceph-nfs-form/ceph-nfs-form-helper-tag.html",
      to: __dirname + "/dist/components/ceph-nfs/ceph-nfs-form/ceph-nfs-form-helper-tag.html"
    },
    {
      from: __dirname + "/app/components/settings/settings-form/settings-form-helper-features.html",
      to: __dirname + "/dist/components/settings/settings-form/settings-form-helper-features.html"
    },
    {
      from: __dirname + "/app/components/ceph-rbd/ceph-rbd-form/ceph-rbd-form-helper-features.html",
      to: __dirname + "/dist/components/ceph-rbd/ceph-rbd-form/ceph-rbd-form-helper-features.html"
    },
    {
      from: __dirname + "/app/components/ceph-rbd/ceph-rbd-form/ceph-rbd-form-helper-striping.html",
      to: __dirname + "/dist/components/ceph-rbd/ceph-rbd-form/ceph-rbd-form-helper-striping.html"
    },
    {
      from: __dirname + "/app/components/ceph-rbd/ceph-rbd-form/ceph-rbd-form-helper-fast-diff.html",
      to: __dirname + "/dist/components/ceph-rbd/ceph-rbd-form/ceph-rbd-form-helper-fast-diff.html"
    },
    {
      from: __dirname + "/app/components/ceph-iscsi/ceph-iscsi-form/ceph-iscsi-form-helper-features.html",
      to: __dirname + "/dist/components/ceph-iscsi/ceph-iscsi-form/ceph-iscsi-form-helper-features.html"
    },
    {
      from: __dirname + "/app/components/shared/oa-module-loader/reason*.html",
      to: __dirname + "/dist/components/shared/oa-module-loader/[name].[ext]"
    }
    ])
  );

  // Add build specific plugins
  if (isProd) {
    config.plugins.push(
      // Reference: https://webpack.js.org/plugins/no-emit-on-errors-plugin/
      // Only emit files when there are no errors
      new webpack.NoEmitOnErrorsPlugin()

      // Reference: https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
      // Minify all javascript, switch loaders to minimizing mode
      // new webpack.optimize.UglifyJsPlugin()
    );
  }

  if (!fs.existsSync(__dirname + "/app/config.local.js") || isProd) {
    config.resolve = {
      alias: {
        globalConfig: __dirname + "/app/config.js"
      }
    };
  } else {
    config.resolve = {
      alias: {
        globalConfig: __dirname + "/app/config.local.js"
      }
    };
  }

  /**
   * Dev server configuration
   * use the format described on webpack.config.json.sample
   * Reference: https://webpack.js.org/configuration/dev-server/
   */
  config.devServer = {
    contentBase: "./app",
    watchOptions: {
      ignored: /\.sw.$/
    },
    stats: "minimal",
    proxy: {}
  };
  config.devServer.proxy[contextRoot + "api"] = {
    target: apiConfig.target || "http://192.168.100.200",
    secure: false
  }

  return config;
}());
