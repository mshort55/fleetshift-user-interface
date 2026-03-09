# Mock Server

An Express server backed by better-sqlite3 that provides REST endpoints and WebSocket events for all FleetShift resources. The database auto-seeds on first startup with clusters, users, and per-cluster Kubernetes-style resources. A chokidar watcher hot-reloads the plugin registry when plugins are rebuilt.

## Architecture

```
packages/mock-servers/src/server.ts
  │
  ├─ Express (port 4000)
  │    ├─ CORS (all origins)
  │    ├─ express.json()
  │    └─ /api/v1/*  ──── route handlers
  │
  ├─ WebSocket (/ws?userId=:userId)
  │    └─ broadcasts invalidation events
  │       on mutations (clusters, nav_layout, canvas_pages)
  │
  ├─ better-sqlite3 (./fleetshift.db)
  │    ├─ 17 tables (WAL mode, foreign keys ON)
  │    └─ auto-seeds on empty DB
  │
  └─ chokidar watcher
       └─ watches plugin-registry.json for rebuilds
```

## Key Concepts

### Database schema

17 tables covering Kubernetes-style resources:

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `clusters` | id, name, status, version, plugins (JSON) | Installed cluster registry |
| `namespaces` | id, cluster_id (FK), name, status | Per-cluster namespaces |
| `pods` | id, cluster_id, namespace_id, name, status, cpu_usage, memory_usage | Pod instances |
| `nodes` | id, cluster_id, name, role, cpu_capacity/used, memory_capacity/used | Cluster nodes |
| `services` | id, cluster_id, namespace_id, name, type, ports (JSON) | Kubernetes services |
| `ingresses` | id, cluster_id, namespace_id, name, host, path, tls | Ingress rules |
| `pvs` | id, cluster_id, name, capacity, access_mode, storage_class | PersistentVolumes |
| `pvcs` | id, cluster_id, namespace_id, name, capacity, pv_name | PersistentVolumeClaims |
| `alerts` | id, cluster_id, name, severity, state, message | Prometheus-style alerts |
| `deployments` | id, cluster_id, namespace_id, name, replicas, available, image | Kubernetes deployments |
| `pipelines` | id, cluster_id, name, status, stages (JSON) | Tekton-style pipelines |
| `configmaps` | id, cluster_id, namespace_id, name, data_keys (JSON) | ConfigMaps |
| `secrets` | id, cluster_id, namespace_id, name, type, data_keys (JSON) | Secrets |
| `gitops_apps` | id, cluster_id, name, repo, sync_status, health_status | ArgoCD applications |
| `events` | id, cluster_id, namespace_id, type, reason, message | Kubernetes events |
| `routes` | id, cluster_id, namespace_id, name, host, tls, status | OpenShift routes |
| `users` | id, username, role, nav_layout (JSON), canvas_pages (JSON) | User accounts |

### Seed data

On first startup (empty `clusters` table), the server seeds:

**5 available clusters** (can be installed via the UI):
- `us-east-prod` — US East Production (v4.15.2)
- `eu-west-staging` — EU West Staging (v4.14.8)
- `ap-south-dev` — AP South Development (v4.15.1)
- `us-west-dr` — US West DR (v4.13.12)
- `eu-central-prod` — EU Central Production (v4.15.2)

**2 clusters installed by default** with different plugin profiles:
- US East: `["core", "observability", "nodes", "networking", "alerts", "operator"]`
- EU West: `["core", "deployments", "pipelines", "gitops", "alerts", "operator"]`

**Per-cluster resources** (random counts within ranges):
- 3-5 namespaces, 2-5 pods per namespace
- 3-6 nodes (first 3 masters, rest worker/infra)
- 3-6 services, 1-3 ingresses
- 2-5 PVs and PVCs, 2-6 alerts
- 3-6 deployments, 3-6 pipelines
- 3-5 configmaps, 2-4 secrets
- 2-4 gitops apps, 5-10 events, 2-5 routes

**2 users:**
- `ops` (Ops Admin) — 6 seeded canvas pages, ops-oriented nav layout
- `dev` (Dev User) — 3 seeded canvas pages, dev-oriented nav layout

### WebSocket protocol

Clients connect at `ws://localhost:4000/ws?userId=:userId`. On connection, the server sends a session message:

```json
{ "type": "session", "sessionId": "<uuid>" }
```

When a mutation occurs, the server broadcasts an invalidation event to relevant clients:

```json
{ "resource": "clusters" | "nav_layout" | "canvas_pages" }
```

Broadcasts skip the originating session (identified by `x-session-id` header) and scope to the mutating user's connections when applicable.

### Plugin registry watcher

The server loads `plugin-registry.json` from `packages/mock-ui-plugins/dist/` on startup. A chokidar watcher monitors the file for changes with a 300ms stability threshold. When plugins are rebuilt, the registry reloads automatically without restarting the server.

The registry endpoint prepends `assetsHost` to all `loadScripts` URLs (unless they already start with `http`).

## Key Files

| File | Purpose |
|------|---------|
| `packages/mock-servers/src/server.ts` | Express + WS setup, DB init, route registration |
| `packages/mock-servers/src/db.ts` | Schema creation, seeding, query helpers |
| `packages/mock-servers/src/ws.ts` | WebSocket session management, broadcast logic |
| `packages/mock-servers/src/pluginRegistry.ts` | Registry loading, chokidar watcher |
| `packages/mock-servers/src/routes/` | Route handlers organized by resource |

## REST Endpoints

All prefixed with `/api/v1`:

### Clusters

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clusters/available` | List all 5 available clusters with install status |
| GET | `/clusters` | List installed clusters |
| GET | `/clusters/:id` | Get single cluster details |
| POST | `/clusters/:id/install` | Install a cluster (seeds all child resources) |
| DELETE | `/clusters/:id` | Uninstall a cluster (cascades deletes) |
| PATCH | `/clusters/:id/plugins` | Update plugin array |

### Per-Cluster Resources

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clusters/:id/namespaces` | Namespaces with pod counts |
| GET | `/clusters/:id/pods` | Pods (optional `?namespace=` filter) |
| GET | `/clusters/:id/nodes` | Nodes with capacity/usage |
| GET | `/clusters/:id/metrics` | Aggregated CPU/memory, top consumers |
| GET | `/clusters/:id/services` | Services with parsed ports |
| GET | `/clusters/:id/ingresses` | Ingresses with TLS config |
| GET | `/clusters/:id/pvs` | PersistentVolumes |
| GET | `/clusters/:id/pvcs` | PersistentVolumeClaims |
| GET | `/clusters/:id/alerts` | Alerts sorted by fired_at |
| GET | `/clusters/:id/upgrades` | Version info + up-to-date flag |
| GET | `/clusters/:id/cost` | Estimated monthly costs per namespace |
| GET | `/clusters/:id/deployments` | Deployments |
| PATCH | `/clusters/:id/deployments/:deployId` | Scale deployment (creates/deletes pods) |
| GET | `/clusters/:id/logs` | Fake log lines from all pods (max 100) |
| GET | `/clusters/:id/pipelines` | Pipelines with parsed stages |
| GET | `/clusters/:id/configmaps` | ConfigMaps with parsed keys |
| GET | `/clusters/:id/secrets` | Secrets with parsed keys |
| GET | `/clusters/:id/gitops` | GitOps applications |
| GET | `/clusters/:id/events` | Events sorted by created_at |
| GET | `/clusters/:id/routes` | OpenShift routes |

### Cross-Cluster

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pods/aggregate` | Pod stats across all clusters |

### Users & Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login by username |
| GET | `/users/:id/preferences` | Get nav layout |
| PUT | `/users/:id/preferences` | Update nav layout (broadcasts WS) |
| GET | `/users/:id/canvas-pages` | List canvas pages |
| POST | `/users/:id/canvas-pages` | Create canvas page |
| PUT | `/users/:id/canvas-pages/:pageId` | Update canvas page |
| DELETE | `/users/:id/canvas-pages/:pageId` | Delete canvas page |

### Plugin Registry

| Method | Path | Description |
|--------|------|-------------|
| GET | `/plugin-registry` | Full registry with manifests |

## How It Works

1. `npm run dev --workspace=packages/mock-servers` starts the server via nodemon. On startup, the DB is created (WAL mode, foreign keys ON), schema tables are created if missing, and seed data is inserted if the DB is empty.

2. The plugin registry is loaded from disk. A chokidar watcher starts monitoring the file for rebuilds.

3. When the GUI starts, it hits `/api/v1/plugin-registry` to discover plugins, `/auth/login` to authenticate, and resource endpoints to populate views.

4. Mutations (cluster install/uninstall, nav layout updates, canvas page changes) broadcast WebSocket invalidation events. The GUI's `useInvalidationSocket` hook listens for these and triggers refetches.

5. Deployment scaling uses a gradual convergence pattern: the replica count updates immediately, but `available` and `ready` increment every 2 seconds and pending pods flip to Running one at a time.

## Gotchas

**DB file persists across restarts.** Delete `fleetshift.db` to get a fresh seed. The DB is created in the package root directory.

**Cost calculation uses fixed rates.** CPU: $0.048/core/hr, Memory: $0.006/GB/hr, multiplied by 730 hours/month. These are mock estimates, not real cloud pricing.

**Logs are generated on-the-fly.** Each request produces fresh random log lines — they don't persist. Max 100 lines returned per request.

**Canvas page paths are validated.** Must match `/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/`. The segments `clusters`, `navigation`, and `pages` are reserved and cannot be used as top-level paths.

**Deployment scaling timers are per-deployment.** A `scalingTimers` Map prevents overlapping intervals. Rapid successive scale operations on the same deployment replace the previous timer.
