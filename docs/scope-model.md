# Scope Model

The scope model controls whether the user is viewing data from all installed clusters or a single selected cluster. Extensions receive `clusterIds: string[]` — in "All Clusters" mode this includes every relevant cluster; in single-cluster mode it contains just the selected one.

## Architecture

```
ClusterSwitcher (masthead dropdown)
       │
       ▼
  ScopeContext
  ┌──────────────────────────────────────────────┐
  │  scope: "all" | clusterId                    │
  │                                              │
  │  scopedClusterIds:                           │
  │    scope === "all"                           │
  │      ? installed.map(c => c.id)   ← all IDs  │
  │      : [scope]                    ← one ID   │
  │                                              │
  │  clusterIdsForPlugin(pluginKey):             │
  │    installed                                 │
  │      .filter(c => c.plugins.includes(key)    │
  │               && scopedClusterIds.has(c.id)) │
  │      .map(c => c.id)                         │
  └──────────────────┬───────────────────────────┘
                     │
            extensions receive
            clusterIds: string[]
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    Dashboard    CanvasPage   Observability
    widgets      modules      charts
```

## Key Concepts

### Scope

A scope is either `"all"` (every installed cluster) or a specific cluster ID. It's stored in `ScopeContext` via `useState<Scope>("all")` and changed through `ClusterSwitcher`.

### scopedClusterIds

A derived array computed from the current scope:

```typescript
const scopedClusterIds =
  scope === "all" ? installed.map((c) => c.id) : [scope];
```

- `"all"` → IDs of all installed clusters
- `"cluster-abc"` → `["cluster-abc"]`

### clusterIdsForPlugin

Intersects the current scope with cluster plugin availability:

```typescript
const clusterIdsForPlugin = (pluginKey: string) =>
  installed
    .filter(
      (c) =>
        c.plugins.includes(pluginKey) && scopedClusterIds.includes(c.id),
    )
    .map((c) => c.id);
```

If the user selects "All Clusters" and two out of five clusters have the `"observability"` plugin, `clusterIdsForPlugin("observability")` returns those two cluster IDs.

### pluginKeyFromName

Derives the plugin key from the plugin name by stripping the `-plugin` suffix:

```typescript
pluginKeyFromName("core-plugin")        // → "core"
pluginKeyFromName("deployments-plugin") // → "deployments"
```

This key matches against `cluster.plugins[]`, which stores keys like `["core", "observability", "nodes"]`.

### Auto-reset on cluster uninstall

If the user is scoped to a specific cluster and that cluster is uninstalled, the scope resets to `"all"`:

```typescript
useEffect(() => {
  if (scope !== "all" && !installed.some((c) => c.id === scope)) {
    setScope("all");
  }
}, [scope, installed]);
```

### How extensions receive clusterIds

Extensions don't call scope APIs directly. The shell computes `clusterIds` and passes it as a prop:

**Dashboard widgets:**
```typescript
const pluginKey = pluginKeyFromName(ext.pluginName);
const clusterIds = clusterIdsForPlugin(pluginKey);
if (clusterIds.length === 0) return null; // skip if no clusters
return <Widget clusterIds={clusterIds} />;
```

**Canvas page modules:**
```typescript
const pluginKey = pluginKeyFromName(mod.moduleRef.scope);
const clusterIds = clusterIdsForPlugin(pluginKey);
return <ScalprumComponent scope={...} module={...} {...{ clusterIds }} />;
```

Extensions with zero matching clusters are not rendered.

### ScopeBridge

Because the Scalprum API is created in `ScalprumShell` (above `ScopeProvider` in the tree), scope must be synced to a module-level ref:

```typescript
const ScopeBridge = () => {
  const { scope } = useScope();
  useEffect(() => {
    scopeRef.current = scope;
    scopeListenersRef.current.forEach((fn) => fn());
  }, [scope]);
  return null;
};
```

This enables `api.fleetshift.getScope()` and `api.fleetshift.onScopeChange()` for plugins that need direct scope access (see [shell-architecture.md](./shell-architecture.md)).

## Key Files

| File | Purpose |
|------|---------|
| `packages/gui/src/contexts/ScopeContext.tsx` | Scope state, `scopedClusterIds`, `clusterIdsForPlugin` |
| `packages/gui/src/layouts/ClusterSwitcher.tsx` | Masthead dropdown for scope selection |
| `packages/gui/src/utils/extensions.ts` | `pluginKeyFromName`, extension types |
| `packages/gui/src/pages/Dashboard.tsx` | Passes `clusterIds` to dashboard widgets |
| `packages/gui/src/pages/CanvasPage/CanvasPage.tsx` | Passes `clusterIds` to canvas modules |
| `packages/gui/src/App.tsx` | ScopeBridge syncing scope to module-level ref |
| `packages/gui/src/contexts/ClusterContext.tsx` | Provides `installed` clusters to ScopeContext |

## How It Works

1. `ClusterProvider` loads installed clusters from the API and keeps them updated via WebSocket invalidation events.

2. `ScopeProvider` initializes scope to `"all"` and derives `scopedClusterIds` from the current scope and installed clusters.

3. The user opens `ClusterSwitcher` in the masthead and selects either "All Clusters" or a specific cluster. This calls `setScope(value)`.

4. When scope changes, `scopedClusterIds` recomputes. Any component calling `clusterIdsForPlugin(pluginKey)` gets the intersection of scope and plugin availability.

5. The shell passes `clusterIds` as a prop to every extension component. Each component fetches data from those specific clusters.

6. If a cluster is uninstalled while it's the active scope, the `useEffect` in `ScopeProvider` detects the missing cluster and resets to `"all"`.

7. `ScopeBridge` keeps `scopeRef` in sync so the Scalprum API can expose scope to plugins that need it outside the React tree.

## Gotchas

**Navigation is not scope-aware.** There's no `/clusters/:id/` prefix in routes. The nav shows the same items regardless of scope — only the data changes. This is by design: one "Pods" nav item works for both all-cluster and single-cluster views.

**Empty `clusterIds` hides the extension.** If no clusters in the current scope have a given plugin, the extension is not rendered at all (returns `null`). This can be confusing if a user scopes to a cluster that doesn't have a specific plugin enabled.

**`clusterIdsForPlugin` depends on both scope and cluster state.** It's memoized with `useCallback` over `[installed, scopedClusterIds]`, so it updates reactively when either changes.

**Plugins can also access scope via the Scalprum API.** `api.fleetshift.getScope()` returns the raw scope string and `onScopeChange()` subscribes to changes. This is useful for plugins that need scope-aware behavior beyond the `clusterIds` prop.
