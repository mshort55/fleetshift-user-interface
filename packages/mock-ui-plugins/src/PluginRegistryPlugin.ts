import fs from "fs";
import path from "path";
import type { Compiler } from "webpack";

interface PluginMeta {
  name: string;
  key: string;
  label: string;
  persona: "ops" | "dev";
}

interface PluginRegistryPluginOptions {
  assetsHost: string;
  plugins: PluginMeta[];
}

export class PluginRegistryPlugin {
  private options: PluginRegistryPluginOptions;

  constructor(options: PluginRegistryPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapAsync(
      "PluginRegistryPlugin",
      (compilation, callback) => {
        const outputPath = compilation.outputOptions.path;
        if (!outputPath) {
          callback();
          return;
        }

        const metaByName = new Map(
          this.options.plugins.map((p) => [p.name, p]),
        );

        const registry: Record<string, unknown> = {
          assetsHost: this.options.assetsHost,
          plugins: {} as Record<string, unknown>,
        };

        const plugins = registry.plugins as Record<string, unknown>;

        // Read all manifest files from output directory
        let files: string[];
        try {
          files = fs.readdirSync(outputPath);
        } catch {
          callback();
          return;
        }

        for (const file of files) {
          if (!file.endsWith("-manifest.json")) continue;

          const filePath = path.join(outputPath, file);
          let manifest: Record<string, unknown>;
          try {
            manifest = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          } catch {
            continue;
          }

          const name = manifest.name as string | undefined;
          if (!name) continue;

          // Skip non-SDK manifests (e.g. mf-manifest.json from Module Federation)
          if (!Array.isArray(manifest.loadScripts)) continue;

          const meta = metaByName.get(name);
          if (!meta) continue;

          plugins[name] = {
            name: meta.name,
            key: meta.key,
            label: meta.label,
            persona: meta.persona,
            pluginManifest: manifest,
          };
        }

        const registryPath = path.join(outputPath, "plugin-registry.json");
        try {
          fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
        } catch (err) {
          console.error("PluginRegistryPlugin: failed to write registry", err);
        }

        callback();
      },
    );
  }
}
