import fs from "fs";
import path from "path";
import chokidar from "chokidar";

interface PluginManifest {
  name: string;
  version: string;
  extensions: unknown[];
  registrationMethod: string;
  baseURL: string;
  loadScripts: string[];
  buildHash?: string;
}

interface PluginEntry {
  name: string;
  key: string;
  label: string;
  persona: "ops" | "dev";
  pluginManifest: PluginManifest;
}

interface PluginRegistry {
  assetsHost: string;
  plugins: Record<string, PluginEntry>;
}

const REGISTRY_PATH = path.resolve(
  __dirname,
  "../../mock-ui-plugins/dist/plugin-registry.json",
);

let cachedRegistry: PluginRegistry | null = null;

function loadRegistry(): void {
  console.log("Loading plugin registry from:", REGISTRY_PATH);
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf-8");
    const registry = JSON.parse(raw) as PluginRegistry;

    // Prepend assetsHost to loadScripts paths
    const { assetsHost } = registry;
    for (const entry of Object.values(registry.plugins)) {
      entry.pluginManifest.loadScripts = entry.pluginManifest.loadScripts.map(
        (script) =>
          script.startsWith("http") ? script : `${assetsHost}/${script}`,
      );
    }

    cachedRegistry = registry;
    console.log(
      `Plugin registry loaded: ${Object.keys(registry.plugins).length} plugins`,
    );
  } catch (err) {
    console.error("Failed to load plugin registry:", err);
  }
}

export function initPluginRegistryWatcher(): void {
  loadRegistry();

  const watcher = chokidar.watch(REGISTRY_PATH, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300 },
  });

  watcher.on("change", () => {
    console.log("Plugin registry changed, reloading...");
    loadRegistry();
  });

  watcher.on("add", () => {
    console.log("Plugin registry created, loading...");
    loadRegistry();
  });
}

export function getPluginRegistry(): PluginRegistry | null {
  return cachedRegistry;
}
