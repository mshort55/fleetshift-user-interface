import path from "path";
import { createRequire } from "module";
import webpack from "webpack";
import type { Configuration } from "webpack";
import mf from "@module-federation/enhanced";
const { ModuleFederationPlugin } = mf;

const require = createRequire(import.meta.url);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const ShellPlugin = new ModuleFederationPlugin({
  name: "shell-plugin",
  runtimePlugins: [require.resolve("@module-federation/node/runtimePlugin")],
  remoteType: "script",
  filename: "shell-plugin.[contenthash].js",
  library: { type: "commonjs-module", name: "shell-plugin" },
});

const config: Configuration = {
  entry: "./src/index.ts",
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "cli.js",
    clean: true,
    module: true,
    chunkFormat: "module",
  },
  experiments: {
    outputModule: true,
  },
  mode: "production",
  // Keep readable output — this is a CLI tool, not a deployed bundle
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    // Source imports use .js extensions (ESM convention) — map to .ts/.tsx
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
    // Don't follow symlinks — use package.json exports field for workspace packages
    symlinks: false,
    // Prefer ESM builds of workspace packages
    mainFields: ["module", "main"],
    conditionNames: ["import", "module", "default"],
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
    // Preserve the shebang for direct execution
    new webpack.BannerPlugin({
      banner: "#!/usr/bin/env node",
      raw: true,
    }),
    ShellPlugin,
  ],
  // Don't bundle Node built-ins
  externalsPresets: { node: true },
  // Externalize all node_modules — only bundle our own source code.
  // This avoids breaking chalk/supports-color TTY detection and other
  // runtime checks that fail when statically bundled.
  externals: [
    ({ request }: { request?: string }, callback: Function) => {
      // Bundle our own source (relative imports + @fleetshift/common)
      if (
        !request ||
        request.startsWith(".") ||
        request.startsWith("/") ||
        request.startsWith("@fleetshift/")
      ) {
        return callback();
      }
      // Everything else stays external (import from node_modules at runtime)
      return callback(null, `module ${request}`);
    },
  ],
};

export default config;
