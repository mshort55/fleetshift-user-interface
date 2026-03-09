# Plugin System

Plugins are micro-frontend modules built with `@openshift/dynamic-plugin-sdk`, bundled as Module Federation remotes, and loaded at runtime by the shell via Scalprum. Each plugin declares extensions (UI components) that the shell discovers and renders.

## Architecture

```
Build time                         Serve time                  Runtime
──────────                         ──────────                  ───────

webpack.config.ts                  mock-servers                GUI shell
  │                                  │                           │
  ├─ DynamicRemotePlugin ×16        GET /plugin-registry ◄───── PluginRegistryProvider
  │   └─ generates manifests         │                           │
  │                                  ├─ reads plugin-            buildScalprumConfig()
  └─ PluginRegistryPlugin            │  registry.json            │
      └─ generates                   │                           ScalprumProvider
         plugin-registry.json ──────►│                           │
                                     │                           PluginLoader
                                     └─ chokidar watches         │ pluginStore.loadPlugin()
                                        for rebuilds             │
                                                                 useResolvedExtensions()
                                                                 │
                                                                 ScalprumComponent
                                                                 └─ renders remote module
```

## Key Concepts

### Extension types

Three extension types are defined:

| Type | Purpose | Properties |
|------|---------|------------|
| `fleetshift.module` | Composable UI modules for canvas pages | `label`, `component` |
| `fleetshift.dashboard-widget` | Widgets rendered on the dashboard home | `component` |
| `fleetshift.observability-chart` | Charts contributed to the observability dashboard | `label`, `component` |

All component refs receive `clusterIds: string[]` as a prop. See [scope-model.md](./scope-model.md).

### DynamicRemotePlugin

Each plugin is declared as a `DynamicRemotePlugin` instance in `packages/mock-ui-plugins/webpack.config.ts`:

```typescript
new DynamicRemotePlugin({
  extensions: [
    {
      type: "fleetshift.module",
      properties: {
        label: "Pods",
        component: { $codeRef: "PodList.default" },
      },
    },
  ],
  sharedModules: { react, "react-dom", ... },
  entryScriptFilename: "core-plugin.[contenthash].js",
  pluginManifestFilename: "core-plugin-manifest.json",
  pluginMetadata: {
    name: "core-plugin",
    version: "1.0.0",
    exposedModules: {
      PodList: "./src/plugins/core-plugin/PodList.tsx",
    },
  },
})
```

The `$codeRef` format is `"ExposedModuleName.exportName"` — the SDK resolves it at runtime to load the actual component.

### PluginRegistryPlugin

A custom webpack plugin (`packages/mock-ui-plugins/src/PluginRegistryPlugin.ts`) that runs after emit. It:

1. Scans the output directory for `*-manifest.json` files
2. Matches each manifest to plugin metadata (name, key, label, persona)
3. Writes `plugin-registry.json` containing all plugin entries with their embedded manifests

```typescript
new PluginRegistryPlugin({
  assetsHost: "http://localhost:8001",
  plugins: [
    { name: "core-plugin", key: "core", label: "Core", persona: "ops" },
    // ... 15 more
  ],
})
```

The `key` field is what clusters reference in their `plugins[]` array. It's derived from the plugin name by stripping the `-plugin` suffix (see `pluginKeyFromName` in [scope-model.md](./scope-model.md)).

### Plugin discovery

`PluginRegistryProvider` fetches the registry at startup:

```
GET http://localhost:4000/api/v1/plugin-registry
→ { assetsHost, plugins: { [name]: { name, key, label, persona, pluginManifest } } }
```

The mock server reads `plugin-registry.json` from disk and prepends `assetsHost` to all `loadScripts` URLs. A chokidar watcher reloads the file when plugins are rebuilt, enabling hot-reload during development.

### Plugin loading

`buildScalprumConfig` filters the registry to include only plugins that have at least one installed cluster:

```typescript
for (const [name, entry] of Object.entries(registry.plugins)) {
  if (clusters.some((c) => c.plugins.includes(entry.key))) {
    config[name] = { name: entry.name, pluginManifest: entry.pluginManifest, ... };
  }
}
```

`routing-plugin` is always included regardless of cluster state (it's a utility plugin, not cluster-specific).

`PluginLoader` then iterates the config and calls `pluginStore.loadPlugin()` for each entry, blocking the app until all plugins are loaded.

### Extension resolution

The shell uses `useResolvedExtensions` from `@openshift/dynamic-plugin-sdk` to discover and resolve extensions at runtime:

```typescript
const [widgets, resolved] = useResolvedExtensions(isDashboardWidget);

widgets.map((ext) => {
  const Widget = ext.properties.component;
  return <Widget clusterIds={clusterIds} />;
});
```

For canvas modules, `useAvailableModules` extracts all `fleetshift.module` extensions and maps them to `ModuleRef` objects for the module palette.

### Rendering remote components

`ScalprumComponent` renders a remote module by scope and module name:

```typescript
<ScalprumComponent
  scope="core-plugin"
  module="PodList"
  fallback={<Spinner />}
  ErrorComponent={<ModuleUnavailable />}
  {...{ clusterIds }}
/>
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/mock-ui-plugins/webpack.config.ts` | 16 plugin definitions + PluginRegistryPlugin |
| `packages/mock-ui-plugins/src/PluginRegistryPlugin.ts` | Generates `plugin-registry.json` at build time |
| `packages/mock-ui-plugins/src/plugins/<name>/` | Plugin source (components + `api.ts` helper) |
| `packages/gui/src/contexts/PluginRegistryContext.tsx` | Fetches and provides plugin registry |
| `packages/gui/src/utils/buildScalprumConfig.ts` | Filters registry → Scalprum config |
| `packages/gui/src/utils/extensions.ts` | Extension types, `pluginKeyFromName`, `ModuleRef` |
| `packages/gui/src/pages/Dashboard.tsx` | Resolves + renders `dashboard-widget` extensions |
| `packages/gui/src/pages/CanvasPage/useAvailableModules.ts` | Discovers `fleetshift.module` extensions |

## How It Works

1. **Build**: `npm run build --workspace=packages/mock-ui-plugins` compiles all 16 plugins. Each `DynamicRemotePlugin` produces a manifest JSON and entry script. `PluginRegistryPlugin` then aggregates all manifests into `plugin-registry.json`.

2. **Serve**: `npm run serve --workspace=packages/mock-ui-plugins` starts a static file server on port 8001. The mock API server (port 4000) serves the registry at `/api/v1/plugin-registry`, prepending `http://localhost:8001` to script URLs.

3. **Discover**: On startup, `PluginRegistryProvider` fetches the registry. The app blocks until it's loaded.

4. **Filter**: `buildScalprumConfig` checks which plugins are relevant (at least one cluster has the plugin enabled) and builds a Scalprum config.

5. **Load**: `PluginLoader` calls `pluginStore.loadPlugin()` for each config entry. For inline manifests, this is immediate; for URL-based manifests (routing-plugin), it fetches the manifest first.

6. **Resolve**: Components use `useResolvedExtensions(typeguard)` to get resolved extension instances with live component references.

7. **Render**: `ScalprumComponent` or direct component rendering with `clusterIds` passed as props.

## Gotchas

**Plugin key vs plugin name.** The registry uses full names (`"core-plugin"`) but cluster `plugins[]` arrays use keys (`"core"`). `pluginKeyFromName` bridges this by stripping the `-plugin` suffix.

**Shared modules must match.** Plugins and the shell must declare identical shared module sets. A mismatch causes runtime errors (duplicate React instances, missing singletons). Both use `getDynamicModules` from `@fleetshift/build-utils` to generate PatternFly entries.

**`routing-plugin` is special.** It uses `manifestLocation` (URL) instead of an inline `pluginManifest`, and requires a manifest transform to prepend the assets host to its script URLs.

**All 16 plugins are compiled together.** The mock-ui-plugins webpack config creates a multi-compiler setup with one `DynamicRemotePlugin` per plugin. Rebuild time scales linearly.

**Plugin components must use `useApiBase()`.** Plugins can't hardcode the API URL — they must get it from the Scalprum API object via the shared `api.ts` helper in each plugin directory.
