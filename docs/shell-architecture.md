# Shell Architecture

The FleetShift GUI is a Module Federation shell that loads micro-frontend plugins at runtime via Scalprum. It bootstraps through an async boundary, wraps the app in a layered provider tree, and exposes a shared API to all remotes.

## Architecture

```
index.ts ──dynamic import──▶ bootstrap.tsx ──▶ App.tsx
                                                │
                                         Provider tree:
                                                │
                              ScopeInitializer          (MF share scope init)
                              └─ BrowserRouter          (React Router v6)
                                 └─ AuthProvider        (ops / dev user)
                                    └─ AuthGate         (blocks until auth ready)
                                       └─ PluginRegistryProvider
                                          └─ ClusterProvider
                                             └─ ScalprumShell
                                                ├─ ScalprumProvider (config, api)
                                                │  └─ PluginLoader
                                                │     └─ ScopeProvider
                                                │        ├─ ScopeBridge
                                                │        └─ UserPreferencesProvider
                                                │           ├─ CanvasPagesBridge
                                                │           └─ AppRoutes
                                                └─ (module-level refs)
```

## Key Concepts

### Async boundary

`index.ts` contains a single line: `import("./bootstrap")`. The dynamic import lets Module Federation initialize its share scope before any user code runs. `bootstrap.tsx` imports styles (PatternFly base CSS, theme SCSS) and mounts `<App />` via `createRoot`.

### Provider tree

Each provider adds a layer of state. The ordering matters — later providers depend on earlier ones. For example, `ScalprumShell` consumes both `ClusterProvider` and `PluginRegistryProvider` to build the Scalprum config.

### ScalprumProvider config

`ScalprumShell` builds the Scalprum config dynamically:

```typescript
const config = buildScalprumConfig(registry, installed);
```

This produces an `AppsConfig` object mapping plugin names to their manifests. Only plugins that have at least one installed cluster are included. See [plugin-system.md](./plugin-system.md) for details.

### Shared API object

The `api` prop passed to `ScalprumProvider` exposes a `fleetshift` namespace to all plugins:

| Method | Returns | Purpose |
|--------|---------|---------|
| `apiBase` | `string` | Mock server URL (`http://localhost:4000/api/v1`) |
| `getClusterIdsForPlugin(pluginKey)` | `string[]` | Cluster IDs that have the plugin enabled |
| `onClustersChange(fn)` | `() => void` | Subscribe to cluster topology changes (returns unsubscribe) |
| `getScope()` | `string` | Current scope (`"all"` or a cluster ID) |
| `onScopeChange(fn)` | `() => void` | Subscribe to scope changes (returns unsubscribe) |
| `getPluginPagePath(scope, module)` | `string \| undefined` | Find the best route for a plugin module |

Plugins access this via `useScalprum()`:

```typescript
const { api } = useScalprum<{ api: { fleetshift: FleetShiftApi } }>();
const apiBase = api.fleetshift.apiBase;
```

### Bridge pattern

The API object is created in `ScalprumShell`, which sits **above** `ScopeProvider` and `UserPreferencesProvider` in the tree. To expose context values that only exist further down, two "bridge" components sync state into module-level refs:

**ScopeBridge** — syncs `scope` from `useScope()` into `scopeRef`. Notifies listeners on change. This powers `getScope()` and `onScopeChange()` in the API.

**CanvasPagesBridge** — syncs `canvasPages` and `navLayout` from `useUserPreferences()` into `canvasPagesRef` and `navLayoutRef`. This powers `getPluginPagePath()` in the API.

Both components render `null`. They are pure data synchronization plumbing.

```
ScalprumShell (creates API with refs)
  └─ ScopeProvider
       ├─ ScopeBridge (writes scope → scopeRef)
       └─ UserPreferencesProvider
            ├─ CanvasPagesBridge (writes pages → canvasPagesRef)
            └─ AppRoutes
```

### Shared singletons (Module Federation)

The shell's webpack config registers these as MF shared singletons:

- `react` (^18), `react-dom` (^18), `react-router-dom` (^6)
- `@scalprum/core`, `@scalprum/react-core`
- `@openshift/dynamic-plugin-sdk`
- PatternFly per-component entries (via `getDynamicModules` — see [build-system.md](./build-system.md))

All plugins declare the same shared set so shell and remotes use identical instances at runtime.

## Key Files

| File | Purpose |
|------|---------|
| `packages/gui/src/index.ts` | Async boundary entry (`import("./bootstrap")`) |
| `packages/gui/src/bootstrap.tsx` | Style imports + `createRoot` mount |
| `packages/gui/src/App.tsx` | Provider tree, ScalprumShell, bridges, routes |
| `packages/gui/webpack.config.ts` | MF shell config with shared singletons |
| `packages/gui/src/contexts/AuthContext.tsx` | Auto-login, user switching |
| `packages/gui/src/contexts/ClusterContext.tsx` | Cluster state (available, installed, install/uninstall) |
| `packages/gui/src/contexts/PluginRegistryContext.tsx` | Fetches plugin registry from server |
| `packages/gui/src/contexts/ScopeContext.tsx` | Cluster scope tracking |
| `packages/gui/src/contexts/UserPreferencesContext.tsx` | Nav layout + canvas pages state |
| `packages/gui/src/utils/buildScalprumConfig.ts` | Builds Scalprum config from registry + clusters |

## How It Works

1. Browser loads `index.ts`, which triggers `import("./bootstrap")`. This creates a chunk boundary so MF can initialize share scopes before React code runs.

2. `bootstrap.tsx` imports PatternFly CSS and the theme, then calls `createRoot(document.getElementById("root")!).render(<App />)`.

3. `ScopeInitializer` calls `initSharedScope()` from Scalprum and blocks rendering until the MF share scope is ready.

4. `AuthProvider` auto-logs in from `localStorage` (defaults to "ops"). `AuthGate` renders nothing until auth completes.

5. `PluginRegistryProvider` fetches the plugin registry from `http://localhost:4000/api/v1/plugin-registry`. Renders nothing until loaded.

6. `ClusterProvider` loads installed clusters. Subscribes to WebSocket invalidation events for real-time updates.

7. `ScalprumShell` builds the Scalprum config (which plugins to load) and the shared API object. Wraps children in `ScalprumProvider` + `PluginLoader`.

8. `PluginLoader` iterates the config and calls `pluginStore.loadPlugin()` for each entry. Blocks rendering until all plugins are loaded.

9. `ScopeProvider` + `UserPreferencesProvider` add scope and nav state. The bridge components sync their values up to module-level refs for the API.

10. `AppRoutes` renders the route tree including dynamic canvas page routes.

## Gotchas

**Webpack, not rspack.** Rspack's MF runtime calls `handleInitialConsumes` before any user code runs, which breaks Scalprum's lazy share scope initialization on cold start. The shell must use webpack.

**Provider ordering is load-bearing.** Moving providers around breaks the dependency chain — e.g., `ScalprumShell` needs both clusters and the plugin registry, so it must be inside both those providers.

**Bridges are invisible but critical.** If `ScopeBridge` or `CanvasPagesBridge` is removed, the shared API silently returns stale values. The listener-based pattern (not React state) means there's no visual indication of breakage.

**PluginLoader blocks the initial render.** All plugins must load before any content shows. A slow or failed plugin manifest fetch delays the entire app.

**`pluginSDKOptions.transformPluginManifest`** is used to fix script URLs for the routing-plugin, which ships relative paths that need the registry's `assetsHost` prepended.
