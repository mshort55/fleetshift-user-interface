// --- Nav layout types (canonical source) ---

export interface NavLayoutPage {
  type: "page";
  pageId: string;
}

export interface NavLayoutGroup {
  type: "group";
  groupId: string;
  pluginKey: string;
  label: string;
  children: NavLayoutPage[];
}

export interface NavLayoutSection {
  type: "section";
  id: string;
  label: string;
  children: { pageId: string }[];
}

export type NavLayoutEntry = NavLayoutPage | NavLayoutGroup | NavLayoutSection;

/** Persisted override shape stored in IndexedDB (version-tagged). */
export interface NavLayoutOverride {
  version: 1;
  layout: NavLayoutEntry[];
}

/**
 * Data that can be found in IndexedDB:
 * - `NavLayoutOverride` (new format)
 * - `string[]` (legacy flat ordering)
 * - `null` (nothing stored)
 */
export type StoredNavLayout = NavLayoutOverride | string[] | null;

// --- helpers ---

/** Collect every page ID referenced anywhere in a layout. */
export function collectPageIds(layout: NavLayoutEntry[]): Set<string> {
  const ids = new Set<string>();
  for (const entry of layout) {
    if (entry.type === "page") {
      ids.add(entry.pageId);
    } else if (entry.type === "group") {
      for (const child of entry.children) {
        ids.add(child.pageId);
      }
    } else if (entry.type === "section") {
      for (const child of entry.children) {
        ids.add(child.pageId);
      }
    }
  }
  return ids;
}

/** Check whether stored data is the new NavLayoutOverride format. */
export function isNavLayoutOverride(
  data: StoredNavLayout,
): data is NavLayoutOverride {
  return (
    data !== null &&
    !Array.isArray(data) &&
    typeof data === "object" &&
    "version" in data &&
    data.version === 1 &&
    Array.isArray(data.layout)
  );
}

/**
 * Build a lookup: pageId -> the backend group it belongs to.
 * Top-level pages return `null`.
 */
function buildBackendGroupMap(
  backend: NavLayoutEntry[],
): Map<string, NavLayoutGroup | null> {
  const map = new Map<string, NavLayoutGroup | null>();
  for (const entry of backend) {
    if (entry.type === "page") {
      map.set(entry.pageId, null);
    } else if (entry.type === "group") {
      for (const child of entry.children) {
        map.set(child.pageId, entry);
      }
    } else if (entry.type === "section") {
      for (const child of entry.children) {
        map.set(child.pageId, null);
      }
    }
  }
  return map;
}

/**
 * Remove entries whose page IDs are in `removedIds`.
 * For groups/sections, filter children and keep the container
 * (even if empty — editor shows empty groups).
 */
function dropRemoved(
  layout: NavLayoutEntry[],
  removedIds: Set<string>,
): NavLayoutEntry[] {
  const result: NavLayoutEntry[] = [];
  for (const entry of layout) {
    if (entry.type === "page") {
      if (!removedIds.has(entry.pageId)) {
        result.push(entry);
      }
    } else if (entry.type === "group") {
      const filtered = entry.children.filter((c) => !removedIds.has(c.pageId));
      result.push({ ...entry, children: filtered });
    } else if (entry.type === "section") {
      const filtered = entry.children.filter((c) => !removedIds.has(c.pageId));
      result.push({ ...entry, children: filtered });
    }
  }
  return result;
}

/**
 * Insert newly-added pages into the layout.
 *
 * Rules from the design doc:
 * - If the backend places the page in a group, insert it into that group
 *   in the override (create the group entry if it doesn't exist).
 * - If the page is ungrouped in the backend, append to the end of the
 *   layout alphabetically by pageId.
 */
function insertAdded(
  layout: NavLayoutEntry[],
  addedIds: Set<string>,
  backendGroupMap: Map<string, NavLayoutGroup | null>,
): NavLayoutEntry[] {
  if (addedIds.size === 0) return layout;

  const result = layout.map((entry) => {
    if (entry.type !== "group") return entry;
    // Check if any added pages belong to this group
    const newChildren: NavLayoutPage[] = [];
    for (const pageId of addedIds) {
      const backendGroup = backendGroupMap.get(pageId);
      if (backendGroup && backendGroup.groupId === entry.groupId) {
        newChildren.push({ type: "page", pageId });
      }
    }
    if (newChildren.length === 0) return entry;
    return {
      ...entry,
      children: [...entry.children, ...newChildren],
    };
  });

  // Collect which added pages were placed into existing groups
  const placed = new Set<string>();
  for (const entry of result) {
    if (entry.type === "group") {
      for (const child of entry.children) {
        if (addedIds.has(child.pageId)) placed.add(child.pageId);
      }
    }
  }

  // Remaining added pages: check if they belong to a backend group not in override
  const ungrouped: NavLayoutPage[] = [];
  const newGroups = new Map<string, NavLayoutGroup>();

  for (const pageId of addedIds) {
    if (placed.has(pageId)) continue;
    const backendGroup = backendGroupMap.get(pageId);
    if (backendGroup) {
      // Group exists in backend but not in override — create it
      const existing = newGroups.get(backendGroup.groupId);
      if (existing) {
        existing.children.push({ type: "page", pageId });
      } else {
        newGroups.set(backendGroup.groupId, {
          ...backendGroup,
          children: [{ type: "page", pageId }],
        });
      }
    } else {
      ungrouped.push({ type: "page", pageId });
    }
  }

  // Sort ungrouped alphabetically by pageId
  ungrouped.sort((a, b) => a.pageId.localeCompare(b.pageId));

  // Append new groups then ungrouped pages
  const groupEntries = [...newGroups.values()] as NavLayoutEntry[];
  return [...result, ...groupEntries, ...ungrouped];
}

/**
 * Merge a backend layout with a user override.
 *
 * Reconciliation is a set diff on page IDs:
 * - **Added** (in backend, not in override): inserted per backend grouping
 *   or appended ungrouped alphabetically.
 * - **Removed** (in override, not in backend): silently dropped.
 * - Everything else keeps the user's arrangement.
 *
 * If `override` is `null`, the backend layout is returned as-is.
 */
export function mergeLayout(
  backend: NavLayoutEntry[],
  override: NavLayoutOverride | null,
): NavLayoutEntry[] {
  if (!override) return backend;

  const backendIds = collectPageIds(backend);
  const overrideIds = collectPageIds(override.layout);

  // Pages in backend but not in override → added
  const addedIds = new Set<string>();
  for (const id of backendIds) {
    if (!overrideIds.has(id)) addedIds.add(id);
  }

  // Pages in override but not in backend → removed
  const removedIds = new Set<string>();
  for (const id of overrideIds) {
    if (!backendIds.has(id)) removedIds.add(id);
  }

  // Step 1: drop removed pages from override
  let merged = dropRemoved(override.layout, removedIds);

  // Step 2: insert added pages
  const backendGroupMap = buildBackendGroupMap(backend);
  merged = insertAdded(merged, addedIds, backendGroupMap);

  return merged;
}
