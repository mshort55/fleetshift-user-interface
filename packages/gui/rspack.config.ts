import { defineConfig } from "@rspack/cli";
import { HtmlRspackPlugin, CssExtractRspackPlugin } from "@rspack/core";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

export default defineConfig({
  entry: "./src/index.tsx",
  output: {
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: [CssExtractRspackPlugin.loader, "css-loader"],
      },
      {
        test: /\.s[ac]ss$/,
        use: [CssExtractRspackPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "fleetshift_shell",
      remotes: {},
      shared: {
        react: { singleton: true, requiredVersion: "^18" },
        "react-dom": { singleton: true, requiredVersion: "^18" },
        "react-router-dom": { singleton: true, requiredVersion: "^6" },
        "@scalprum/core": { singleton: true },
        "@scalprum/react-core": { singleton: true },
      },
    }),
    new CssExtractRspackPlugin(),
    new HtmlRspackPlugin({
      template: "./src/index.html",
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
  },
});
