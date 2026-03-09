# Canvas Pages

> **Experimental.** Canvas pages are a prototyping concept for composable dashboards. This system will probably not survive to the final product in its current form — treat it as exploratory infrastructure, not a commitment. The core issue is that user-composed pages make cross-plugin routing fundamentally fragile: when the same module can appear on multiple pages, the routing plugin has to guess which page a link should target, and it often guesses wrong. This ambiguity is a design-level problem that heuristics (prefer nav pages, prefer specific paths) can't fully solve.

Users create custom pages by dragging plugin modules onto a grid layout. Each page gets a URL path and can be added to the navigation sidebar. Modules are rendered via Scalprum and receive `clusterIds` based on the current scope.

## Architecture

```
CanvasPageListPage (/pages)         CanvasPage (/:path)
  │                                   │
  ├─ Create Page modal                ├─ GridLayout (react-grid-layout)
  │    title → auto-slug → path       │    12 columns, 80px row height
  │                                   │    ┌──────┬──────┐
  └─ PageCard gallery                 │    │ Pods │Nodes │  ← ScalprumComponent
     (click → navigate)               │    │ 6×4  │ 6×4  │     per module
                                      │    ├──────┴──────┤
                                      │    │  Metrics    │
                                      │    │   12×4      │
                                      │    └─────────────┘
                                      │
                                      ├─ ModulePalette (drawer)
                                      │    discovers modules from
                                      │    plugin manifests
                                      │
                                      └─ Edit mode toggle
                                           drag, resize, remove modules
```

## Key Concepts

### CanvasPage and CanvasModule

```typescript
interface CanvasPage {
  id: string;           // "seed-pods" or "canvas-1708862400000-0"
  title: string;        // "Pods"
  path: string;         // "pods" (becomes route /:path)
  modules: CanvasModule[];
}

interface CanvasModule {
  i: string;            // unique instance ID ("mod-1708862400000-0")
  x: number;            // grid column (0–11)
  y: number;            // grid row
  w: number;            // width in columns (default 6)
  h: number;            // height in rows (default 4, each row = 80px)
  moduleRef: ModuleRef; // { scope, module, label }
}

interface ModuleRef {
  scope: string;        // plugin name, e.g. "core-plugin"
  module: string;       // exposed module, e.g. "PodList"
  label: string;        // display name for palette
}
```

### Grid layout

Pages use `react-grid-layout` with a 12-column grid and 80px row height. New modules default to 6 columns wide and 4 rows tall (480px × 320px). The grid compacts vertically — gaps are filled automatically.

Drag and resize are only enabled in edit mode. A toggle button in the page header switches between view and edit mode. In view mode, grid handles and placeholders are hidden via CSS.

### Module palette

When editing, a drawer opens on the right showing all available modules discovered from plugin manifests via `useAvailableModules`. Each entry shows the module label and plugin scope. Clicking the plus button adds the module to the grid at default size.

Modules whose plugin has no installed clusters are shown at 50% opacity with the add button disabled.

### Module discovery

`useAvailableModules` iterates the Scalprum config, loads each plugin's manifest, and extracts extensions with a `component.$codeRef` property. The `$codeRef` string (e.g. `"PodList.default"`) is parsed to derive the module name. The extension's `label` property provides the display name.

### Page creation

The Composer page (`/pages`) shows a gallery of existing pages as cards. Each card displays the title, module count, and URL path. A "Create Page" button opens a modal with:

- **Title** — required text input
- **URL Path** — auto-slugified from title, editable, validated in real-time

Path validation rules:
- Must match `/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/`
- Reserved top-level segments: `clusters`, `navigation`, `pages`
- Must be unique per user

### Routing

Canvas pages get dynamic routes generated in `AppRoutes`:

```typescript
{sortedPages.map((page) => (
  <Route key={page.id} path={`/${page.path}/*`} element={<CanvasPage pageId={page.id} />} />
))}
```

Pages are sorted by path length descending so more specific paths match first. A catch-all `<Route path="*">` attempts to resolve the remaining URL as a page path.

### Persistence

Layout changes are debounced (500ms) before saving to the server via `PUT /api/v1/users/:id/canvas-pages/:pageId`. The server stores pages as a JSON array in the `users.canvas_pages` column. WebSocket invalidation events sync changes across tabs.

### Navigation integration

Canvas pages can be added to the sidebar navigation via the Navigation editor (see [navigation-system.md](./navigation-system.md)). Pages exist independently of the nav — a page can have a route without appearing in the sidebar. `deletePage` automatically removes the page from the nav layout if present.

### Cross-plugin routing

Because canvas pages have user-defined paths, plugins can't hardcode links to each other. The **routing plugin** solves this by resolving paths at runtime through the shell's `getPluginPagePath(scope, module)` API. See [routing-plugin.md](./routing-plugin.md) for full details.

The flow works like this:

```
Plugin A wants to link to Plugin B's DeploymentDetailsPage
  │
  ▼
routing-plugin: usePluginNavigate("core-plugin", "DeploymentDetailsPage")
  │
  ▼
shell API: getPluginPagePath("core-plugin", "DeploymentDetailsPage")
  │  searches canvasPages for any page containing that module
  │  prefers pages in nav, then most specific path
  ▼
returns "/deployment-details"
  │
  ▼
navigate({ pathname: "/deployment-details", search: "?namespace=prod" })
  │
  ▼
CanvasPage renders → DeploymentDetailsPage reads ?namespace via useSearchParams()
```

**Concrete example — PodList → DeploymentDetailsPage:**

The core-plugin's `PodList.tsx` uses `useRemoteHook` to load `usePluginNavigate` from the routing plugin. Each pod row has a kebab menu with actions that navigate to the deployment details page, passing the pod's namespace as a query param:

```typescript
// PodList.tsx — load the navigation hook
const args = useMemo(() => ["core-plugin", "DeploymentDetailsPage"], [])
const { hookResult } = useRemoteHook<{
  navigate: (to?: string | { pathname?: string; search?: string }) => void;
  available: boolean;
}>({
  scope: "routing-plugin",
  module: "usePluginNavigate",
  args,
});

// In the actions column of each pod row:
const ns = pod.namespace_id.replace(`${pod.cluster_id}-`, "");
const actions = [
  { title: "View Deployment",    onClick: () => hookResult?.navigate({ search: `?namespace=${ns}` }) },
  { title: "Deployment Metrics", onClick: () => hookResult?.navigate({ pathname: "metrics", search: `?namespace=${ns}` }) },
  { title: "Deployment Pods",    onClick: () => hookResult?.navigate({ pathname: "pods", search: `?namespace=${ns}` }) },
];
```

The `DeploymentDetailsPage` on the receiving end reads the namespace from the URL:

```typescript
const [searchParams] = useSearchParams();
const namespace = searchParams.get("namespace");
// fetches: /api/v1/clusters/:id/deployments?namespace=<ns>
```

If the target page doesn't exist (user deleted it or hasn't created it), `hookResult.available` is `false` and the kebab actions are disabled. The routing plugin handles this gracefully — no broken links.

**Why this is fragile:** The resolution relies on `getPluginPagePath` searching all canvas pages for a module match and picking the "best" one. But nothing stops a user from placing the same module (e.g. `DeploymentDetailsPage`) on multiple canvas pages. When that happens, the result depends on which page is in the nav and which has a longer path — heuristics that can silently change as the user edits their layout. The PodList kebab might link to `/deployment-details` today and `/ops/infra/deployments` tomorrow after a nav reorder, with no indication that anything changed. This ambiguity is the fundamental reason canvas pages will likely be replaced with a more deterministic routing model.

## Key Files

| File | Purpose |
|------|---------|
| `packages/gui/src/utils/extensions.ts` | `CanvasPage`, `CanvasModule`, `ModuleRef` types |
| `packages/gui/src/pages/CanvasPage/CanvasPage.tsx` | Grid layout renderer, edit mode, module rendering |
| `packages/gui/src/pages/CanvasPage/CanvasPage.scss` | View/edit mode styling, grid chrome |
| `packages/gui/src/pages/CanvasPage/ModulePalette.tsx` | Module picker drawer |
| `packages/gui/src/pages/CanvasPage/useAvailableModules.ts` | Discovers modules from plugin manifests |
| `packages/gui/src/pages/CanvasPageListPage/CanvasPageListPage.tsx` | Page composer (create/list/delete) |
| `packages/gui/src/contexts/UserPreferencesContext.tsx` | CRUD operations, nav integration |
| `packages/gui/src/App.tsx` | Dynamic route generation for canvas pages |

## How It Works

1. The user navigates to `/pages` (Composer). Existing canvas pages are shown as cards in a gallery.

2. Clicking "Create Page" opens a modal. The user enters a title; the path auto-generates via slugification. Server-side validation enforces the path regex and reserved segments.

3. `createPage(title, path)` calls `POST /api/v1/users/:id/canvas-pages`. The new page starts with an empty `modules` array.

4. Navigating to the page (via card click or sidebar) loads `CanvasPage`. The grid renders existing modules via `ScalprumComponent`, passing `clusterIds` from the current scope.

5. Clicking "Edit" enters edit mode: the module palette drawer opens, and grid drag/resize handles appear. The user adds modules from the palette or rearranges existing ones.

6. Each module renders inside a card with a remove button (visible in edit mode). `ScalprumComponent` loads the remote module by `scope` and `module` name with a spinner fallback.

7. Layout changes (drag, resize, add, remove) update local state immediately. After 500ms of inactivity, `updatePage` persists the new `modules` array to the server.

8. The server broadcasts a `canvas_pages` WebSocket event. Other tabs for the same user refetch and update.

9. Deleting a page via the card dropdown calls `deletePage`, which removes it from the server, the canvas pages state, and any nav layout entries.

## Gotchas

**Routes are regenerated on every canvas page change.** Since `sortedPages` is derived from `canvasPages` state, adding or removing a page causes the entire route tree to re-render. This is fine for the current scale but would need optimization for many pages.

**Module instance IDs use timestamps.** `mod-${Date.now()}-${counter}` is unique enough for a single user but could theoretically collide across rapid concurrent operations.

**Debounced saves can lose changes.** If the user makes a layout change and navigates away within 500ms, the save may not fire. There's no dirty-state warning.

**`getPageByPath` uses longest prefix match.** If a URL doesn't exactly match a page path, it walks segments right-to-left looking for the longest prefix. This enables nested paths but can produce unexpected matches.

**Grid size is fixed at 12 columns.** There's no responsive breakpoint system — the grid width adapts to the container but always uses 12 columns.

**Cross-plugin routing breaks with duplicate modules.** If the same plugin module appears on multiple canvas pages, `getPluginPagePath` picks one based on heuristics (nav presence, then path specificity). The user has no way to control or even see which page a cross-plugin link will resolve to. Rearranging the nav or creating a new page with the same module can silently redirect existing links. This is the primary architectural weakness of the canvas pages approach.
