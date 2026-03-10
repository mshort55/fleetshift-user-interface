import fs from "fs";
import path from "path";
import chokidar from "chokidar";

interface CliPluginMfManifest {
  name: string;
  remoteEntry: string;
  remoteEntryType: string;
  exposes: Array<{ name: string; path: string }>;
}

interface CliPluginEntry {
  name: string;
  key: string;
  label: string;
  persona: "ops" | "dev";
  mfManifest: CliPluginMfManifest;
}

interface CliPluginRegistry {
  assetsHost: string;
  plugins: Record<string, CliPluginEntry>;
}

const REGISTRY_PATH = path.resolve(
  __dirname,
  "../../mock-cli-plugins/dist/cli-plugin-registry.json",
);

let cachedRegistry: CliPluginRegistry | null = null;

function loadRegistry(): void {
  console.log("Loading CLI plugin registry from:", REGISTRY_PATH);
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf-8");
    cachedRegistry = JSON.parse(raw) as CliPluginRegistry;
    console.log(
      `CLI plugin registry loaded: ${Object.keys(cachedRegistry.plugins).length} plugins`,
    );
  } catch (err) {
    console.error("Failed to load CLI plugin registry:", err);
  }
}

export function initCliPluginRegistryWatcher(): void {
  loadRegistry();

  const watcher = chokidar.watch(REGISTRY_PATH, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300 },
  });

  watcher.on("change", () => {
    console.log("CLI plugin registry changed, reloading...");
    loadRegistry();
  });

  watcher.on("add", () => {
    console.log("CLI plugin registry created, loading...");
    loadRegistry();
  });
}

export function getCliPluginRegistry(): CliPluginRegistry | null {
  return cachedRegistry;
}
