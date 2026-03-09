# Navigation System

The navigation sidebar is a user-customizable two-level tree. Users rearrange it via a drag-drop editor on the Navigation page, organizing canvas pages into sections. The layout is stored per-user and synced to the server.

## Architecture

```
UserPreferencesContext
  │
  ├─ navLayout: NavLayoutEntry[]     ◄──── persisted to server
  │    ├─ { type: "page", pageId }          (PUT /api/v1/users/:id/preferences)
  │    └─ { type: "section", id, label, children: [{ pageId }] }
  │
  └─ canvasPages: CanvasPage[]       ◄──── pages exist independently
       └─ { id, title, path, modules }       nav references pages by ID

MarketplacePage (Navigation editor)
  ┌────────────────────────┬─────────────────────────┐
  │  Left: Nav Layout Tree │  Right: Available Pages │
  │                        │                         │
  │  ┌─ Section: Ops ─────┐│  ┌─ Logs ──────────────┐│
  │  │  ├─ Pods           ││  │  (not in nav yet)   ││
  │  │  └─ Namespaces     ││  └─────────────────────┘│
  │  └────────────────────┘│  ┌─ Config ────────────┐│
  │  ┌─ Overview ─────────┐│  │  (not in nav yet)   ││
  │  │  (top-level page)  ││  └─────────────────────┘│
  │  └────────────────────┘│                         │
  │                        │  Drag into tree ──────► │
  │  Drag to reorder ↕     │  or click "Add"         │
  └────────────────────────┴─────────────────────────┘
                     │
          @dnd-kit/react handles
          both drag scenarios
```

## Key Concepts

### NavLayout model

The navigation layout is a flat array of entries, each either a page or a section:

```typescript
interface NavLayoutPage {
  type: "page";
  pageId: string;        // references CanvasPage.id
}

interface NavLayoutSection {
  type: "section";
  id: string;            // generated UUID
  label: string;         // display name (user-editable)
  children: { pageId: string }[];
}

type NavLayoutEntry = NavLayoutPage | NavLayoutSection;
```

Two-level nesting only: sections contain pages, but sections cannot nest inside other sections.

### FlatNode representation

For drag-drop operations, the nested layout is flattened into `FlatNode[]`:

```typescript
interface FlatNode {
  id: string;
  kind: "page" | "section";
  depth: number;          // 0 = top-level, 1 = inside a section
  parentId: string | null;
  pageId?: string;        // for pages
  label?: string;         // for sections
}
```

`flattenLayout()` converts `NavLayoutEntry[]` → `FlatNode[]`. `buildLayout()` does the inverse.

### Drag-drop mechanics

The editor uses `@dnd-kit/react` (v0.3.2) with two distinct drag scenarios:

**Reordering within the tree** — `useSortable()` on each `TreeItem`. Horizontal drag offset determines nesting depth:

```typescript
const INDENTATION = 36; // pixels per depth level
const projectedDepth = Math.round(dragOffsetX / INDENTATION);
```

`getProjection()` validates the result against nesting constraints.

**Adding from available pages** — `useDraggable()` on each `AvailablePageItem`. Source IDs are prefixed with `avail-` to distinguish them. Drop target logic:

| Drop target | Result |
|-------------|--------|
| None (empty area) | Append at end, depth 0 |
| On a section | Insert as first child, depth 1 |
| On a page inside a section | Insert after it, depth 1, same parent |
| On a top-level page | Insert after it, depth 0 |

### Nesting rules

- Max depth is 1 (pages can be top-level or inside exactly one section)
- Sections always stay at depth 0
- Sections can only contain pages, not other sections
- A page's `parentId` must reference a section's `id`

### Canvas page connection

Nav entries reference canvas pages by ID but pages exist independently. A canvas page can exist without being in the nav (it appears in the "Available Pages" panel). Deleting a canvas page auto-removes it from the nav layout.

See also: canvas pages are managed in `UserPreferencesContext` alongside the nav layout. Both are stored as JSON in the user's preferences on the server.

## Key Files

| File | Purpose |
|------|---------|
| `packages/gui/src/utils/extensions.ts` | `NavLayoutEntry`, `NavLayoutPage`, `NavLayoutSection` types |
| `packages/gui/src/components/NavLayoutTree/utilities.ts` | `FlatNode`, `flattenLayout`, `buildLayout`, `getProjection`, `INDENTATION` |
| `packages/gui/src/components/NavLayoutTree/TreeItem.tsx` | Sortable tree item component |
| `packages/gui/src/pages/MarketplacePage/MarketplacePage.tsx` | Navigation editor (two-panel layout) |
| `packages/gui/src/pages/MarketplacePage/useLayoutDrag.ts` | Drag-drop state machine |
| `packages/gui/src/pages/MarketplacePage/AvailablePageItem.tsx` | Draggable available page |
| `packages/gui/src/contexts/UserPreferencesContext.tsx` | Nav layout + canvas pages state and persistence |
| `packages/gui/src/layouts/AppLayout.tsx` | Renders sidebar nav from `navLayout` |

## How It Works

1. `UserPreferencesProvider` fetches the user's nav layout from `GET /api/v1/users/:id/preferences` on login. The layout is a `NavLayoutEntry[]` stored as JSON.

2. `AppLayout` renders the sidebar by iterating `navLayout`:
   - `type: "page"` → PatternFly `NavItem` with a `Link` to `/${page.path}`
   - `type: "section"` → PatternFly `NavExpandable` containing child `NavItem`s. Auto-expands when a child route is active.

3. The user navigates to `/navigation` (MarketplacePage). The editor shows two panels:
   - **Left**: current nav tree, rendered as `TreeItem` components with `useSortable`
   - **Right**: canvas pages not currently in the nav, rendered as `AvailablePageItem` with `useDraggable`

4. When dragging within the tree, `handleDragMove` reorders the flat array and calls `getProjection()` to compute the target depth. For sections, descendants are temporarily removed from the array during drag to prevent weird nesting artifacts.

5. When dragging from available pages, the item is identified by its `avail-` prefix. On drop, a new `FlatNode` is created at the appropriate depth/parent based on the drop target.

6. On drag end, `buildLayout()` converts `FlatNode[]` back to `NavLayoutEntry[]`. `updateNavLayout()` persists the new layout to the server via `PUT /api/v1/users/:id/preferences`.

7. The server broadcasts a WebSocket invalidation event (`{ resource: "nav_layout" }`) to other tabs/sessions for the same user, triggering a refetch.

## Gotchas

**Horizontal drag determines nesting.** The depth is calculated from the horizontal pixel offset, not from a visual drop zone. Dragging right nests; dragging left un-nests. The threshold is 36px per level.

**Section descendants are temporarily hidden during section drag.** When dragging a section, its children are spliced out of the array and re-inserted on drop. This prevents them from appearing as independent nodes during the drag.

**Deleting a section does not delete its pages.** The pages move to the "Available Pages" panel. Only deleting the canvas page itself removes it from both the nav and the system.

**Nav layout is per-user, per-persona.** Switching between the ops and dev user loads a completely different nav layout. Default layouts are seeded by the mock server.

**Route path is on the canvas page, not the nav entry.** The nav entry just references a page by ID. The route is `/${page.path}`. Canvas page paths are validated server-side against a strict regex and reserved segments.
