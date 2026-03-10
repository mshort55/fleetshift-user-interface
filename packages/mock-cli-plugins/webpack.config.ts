import path from "path";
import webpack from "webpack";
import type { Configuration } from "webpack";
import { ModuleFederationPlugin } from "@module-federation/enhanced";
import { CliPluginRegistryPlugin } from "./src/CliPluginRegistryPlugin";
const CostPlugin = new ModuleFederationPlugin({
  name: "cost-plugin",
  exposes: {
    "./cost-summary": "./src/cost-summary",
  },
  runtimePlugins: [require.resolve("@module-federation/node/runtimePlugin")],
  remoteType: "script",
  filename: "cost-plugin.[contenthash].js",
  library: { type: "commonjs-module", name: "cost-plugin" },
});

const config: Configuration = {
  entry: "./src/index.ts",
  target: "async-node",
  output: {
    path: path.resolve(__dirname, "dist"),
    clean: true,
    chunkFilename: "[id]-[contenthash].js",
    publicPath: "auto",
  },
  mode: "production",
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    symlinks: false,
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
        },
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^react-devtools-core$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^bufferutil$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^utf-8-validate$/ }),
    CostPlugin,
    new CliPluginRegistryPlugin({
      assetsHost: "http://localhost:8002",
      plugins: [
        {
          name: "cost-plugin",
          key: "cost",
          label: "Cost",
          persona: "ops",
        },
      ],
    }),
  ],
  externalsPresets: { node: true },
  // Externalize react (CJS, works with require()) so plugin uses the same
  // instance as the host via Node's module cache. ink/@inkjs/ui are ESM and
  // can't be require()'d, so they get bundled into the plugin.
  externals: {
    react: "commonjs react",
    "react/jsx-runtime": "commonjs react/jsx-runtime",
    "react/jsx-dev-runtime": "commonjs react/jsx-dev-runtime",
  },
};

export default config;
