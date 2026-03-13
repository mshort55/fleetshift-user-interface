import { getTestToken } from "./auth";

const API_BASE = "http://localhost:4000/api/v1";

let authToken: string | null = null;

async function ensureAuth(): Promise<string> {
  if (!authToken) {
    authToken = await getTestToken("ops", "test");
  }
  return authToken;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  if (!authToken) return extra ?? {};
  return { Authorization: `Bearer ${authToken}`, ...extra };
}

interface LoginResponse {
  id: string;
  username: string;
  display_name: string;
  role: string;
  navLayout: NavLayoutEntry[];
}

interface CanvasPage {
  id: string;
  title: string;
  path: string;
  modules: CanvasModule[];
}

interface CanvasModule {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  moduleRef: { scope: string; module: string; label: string };
}

type NavLayoutEntry =
  | { type: "page"; pageId: string }
  | {
      type: "section";
      id: string;
      label: string;
      children: { pageId: string }[];
    };

export async function login(username: string): Promise<LoginResponse> {
  await ensureAuth();
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

export async function getCanvasPages(
  userId: string,
): Promise<{ pages: CanvasPage[] }> {
  await ensureAuth();
  const res = await fetch(`${API_BASE}/users/${userId}/canvas-pages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`getCanvasPages failed: ${res.status}`);
  return res.json();
}

export async function createCanvasPage(
  userId: string,
  title: string,
  path: string,
  modules: CanvasModule[],
): Promise<CanvasPage> {
  await ensureAuth();
  const createRes = await fetch(`${API_BASE}/users/${userId}/canvas-pages`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title, path }),
  });
  if (!createRes.ok)
    throw new Error(`createCanvasPage failed: ${createRes.status}`);
  const page: CanvasPage = await createRes.json();

  if (modules.length > 0) {
    const updateRes = await fetch(
      `${API_BASE}/users/${userId}/canvas-pages/${page.id}`,
      {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ modules }),
      },
    );
    if (!updateRes.ok)
      throw new Error(`updateCanvasPage failed: ${updateRes.status}`);
    return updateRes.json();
  }

  return page;
}

export async function deleteCanvasPage(
  userId: string,
  pageId: string,
): Promise<void> {
  await ensureAuth();
  const res = await fetch(
    `${API_BASE}/users/${userId}/canvas-pages/${pageId}`,
    { method: "DELETE", headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`deleteCanvasPage failed: ${res.status}`);
}

export async function updateNavLayout(
  userId: string,
  navLayout: NavLayoutEntry[],
): Promise<void> {
  await ensureAuth();
  const res = await fetch(`${API_BASE}/users/${userId}/preferences`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ navLayout }),
  });
  if (!res.ok) throw new Error(`updateNavLayout failed: ${res.status}`);
}

export async function getNavLayout(
  userId: string,
): Promise<{ navLayout: NavLayoutEntry[] }> {
  await ensureAuth();
  const res = await fetch(`${API_BASE}/users/${userId}/preferences`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`getNavLayout failed: ${res.status}`);
  return res.json();
}

/** Default seed nav layout for ops user */
const OPS_DEFAULT_NAV_LAYOUT: NavLayoutEntry[] = [
  { type: "page", pageId: "seed-pods" },
  { type: "page", pageId: "seed-namespaces" },
  {
    type: "section",
    id: "seed-section-metrics",
    label: "Metrics",
    children: [{ pageId: "seed-overview" }],
  },
  { type: "page", pageId: "seed-nodes" },
  { type: "page", pageId: "seed-alerts" },
  { type: "page", pageId: "seed-deployment-details" },
];

/** Default seed canvas pages for ops user */
const OPS_DEFAULT_PAGES: {
  id: string;
  title: string;
  path: string;
  modules: CanvasModule[];
}[] = [
  {
    id: "seed-pods",
    title: "Pods",
    path: "pods",
    modules: [
      {
        i: "seed-pods-1",
        x: 0,
        y: 0,
        w: 12,
        h: 14,
        moduleRef: { scope: "core-plugin", module: "PodList", label: "Pods" },
      },
    ],
  },
  {
    id: "seed-namespaces",
    title: "Namespaces",
    path: "namespaces",
    modules: [
      {
        i: "seed-ns-1",
        x: 0,
        y: 0,
        w: 12,
        h: 14,
        moduleRef: {
          scope: "core-plugin",
          module: "NamespaceList",
          label: "Namespaces",
        },
      },
    ],
  },
  {
    id: "seed-overview",
    title: "Overview",
    path: "overview",
    modules: [
      {
        i: "seed-ov-1",
        x: 0,
        y: 0,
        w: 12,
        h: 14,
        moduleRef: {
          scope: "observability-plugin",
          module: "MetricsDashboard",
          label: "Observability",
        },
      },
      {
        i: "seed-ov-2",
        x: 0,
        y: 14,
        w: 6,
        h: 14,
        moduleRef: {
          scope: "networking-plugin",
          module: "NetworkingPage",
          label: "Networking",
        },
      },
    ],
  },
  {
    id: "seed-nodes",
    title: "Nodes",
    path: "nodes",
    modules: [
      {
        i: "seed-nodes-1",
        x: 0,
        y: 0,
        w: 12,
        h: 14,
        moduleRef: {
          scope: "nodes-plugin",
          module: "NodeList",
          label: "Nodes",
        },
      },
    ],
  },
  {
    id: "seed-alerts",
    title: "Alerts",
    path: "alerts",
    modules: [
      {
        i: "seed-alerts-1",
        x: 0,
        y: 0,
        w: 12,
        h: 14,
        moduleRef: {
          scope: "alerts-plugin",
          module: "AlertList",
          label: "Alerts",
        },
      },
    ],
  },
  {
    id: "seed-deployment-details",
    title: "Deployment Details",
    path: "deployment-details",
    modules: [
      {
        i: "seed-dep-details-1",
        x: 0,
        y: 0,
        w: 12,
        h: 14,
        moduleRef: {
          scope: "core-plugin",
          module: "DeploymentDetailsPage",
          label: "Deployment Details",
        },
      },
    ],
  },
];

/**
 * Reset the ops user to seed defaults:
 * - Delete any non-seed canvas pages
 * - Restore seed canvas pages (in case any were deleted)
 * - Restore default nav layout
 */
export async function resetOpsUser(): Promise<void> {
  const userId = "ops-user";
  const { pages } = await getCanvasPages(userId);

  // Delete non-seed pages
  const seedIds = new Set(OPS_DEFAULT_PAGES.map((p) => p.id));
  for (const page of pages) {
    if (!seedIds.has(page.id)) {
      await deleteCanvasPage(userId, page.id);
    }
  }

  // Re-create any missing seed pages
  const existingIds = new Set(pages.map((p) => p.id));
  for (const seedPage of OPS_DEFAULT_PAGES) {
    if (!existingIds.has(seedPage.id)) {
      await createCanvasPage(
        userId,
        seedPage.title,
        seedPage.path,
        seedPage.modules,
      );
    }
  }

  // Restore default nav layout
  await updateNavLayout(userId, OPS_DEFAULT_NAV_LAYOUT);
}
