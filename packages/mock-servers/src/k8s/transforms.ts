import type * as k8s from "@kubernetes/client-node";

/**
 * Transform k8s API objects into the flat shapes the FleetShift UI expects.
 * Each function matches the column layout in db.ts.
 */

// ── Namespaces ───────────────────────────────────────────────────────────

export function transformNamespace(ns: k8s.V1Namespace, clusterId: string) {
  const name = ns.metadata?.name ?? "unknown";
  return {
    id: `${clusterId}-${name}`,
    cluster_id: clusterId,
    name,
    status: ns.status?.phase ?? "Active",
  };
}

// ── Pods ─────────────────────────────────────────────────────────────────

function getPodStatus(pod: k8s.V1Pod): string {
  // Check container statuses for waiting reasons (CrashLoopBackOff, ImagePullBackOff, etc.)
  const containerStatuses = pod.status?.containerStatuses ?? [];
  for (const cs of containerStatuses) {
    if (cs.state?.waiting?.reason) {
      return cs.state.waiting.reason;
    }
  }
  // Init container waiting
  const initStatuses = pod.status?.initContainerStatuses ?? [];
  for (const cs of initStatuses) {
    if (cs.state?.waiting?.reason) {
      return `Init:${cs.state.waiting.reason}`;
    }
  }
  // Check if all containers completed
  if (
    containerStatuses.length > 0 &&
    containerStatuses.every((cs) => cs.state?.terminated)
  ) {
    return "Completed";
  }
  return pod.status?.phase ?? "Unknown";
}

export function transformPod(
  pod: k8s.V1Pod,
  clusterId: string,
  cpuUsage = 0,
  memoryUsage = 0,
) {
  const name = pod.metadata?.name ?? "unknown";
  const namespace = pod.metadata?.namespace ?? "default";
  const restarts = (pod.status?.containerStatuses ?? []).reduce(
    (sum, cs) => sum + (cs.restartCount ?? 0),
    0,
  );

  return {
    id: pod.metadata?.uid ?? `${clusterId}-${namespace}-${name}`,
    namespace_id: `${clusterId}-${namespace}`,
    cluster_id: clusterId,
    name,
    status: getPodStatus(pod),
    restarts,
    cpu_usage: cpuUsage,
    memory_usage: memoryUsage,
    created_at:
      pod.metadata?.creationTimestamp
        ?.toISOString()
        .replace("T", " ")
        .substring(0, 19) ??
      new Date().toISOString().replace("T", " ").substring(0, 19),
  };
}

// ── Nodes ────────────────────────────────────────────────────────────────

function getNodeRole(node: k8s.V1Node): string {
  const labels = node.metadata?.labels ?? {};
  if ("node-role.kubernetes.io/control-plane" in labels) return "master";
  if ("node-role.kubernetes.io/master" in labels) return "master";
  if ("node-role.kubernetes.io/infra" in labels) return "infra";
  return "worker";
}

function getNodeStatus(node: k8s.V1Node): string {
  const conditions = node.status?.conditions ?? [];
  const ready = conditions.find((c) => c.type === "Ready");
  return ready?.status === "True" ? "Ready" : "NotReady";
}

function parseCpuQuantity(q: string | undefined): number {
  if (!q) return 0;
  if (q.endsWith("n")) return parseFloat(q) / 1e9;
  if (q.endsWith("u")) return parseFloat(q) / 1e6;
  if (q.endsWith("m")) return parseFloat(q) / 1000;
  return parseFloat(q);
}

function parseMemoryQuantity(q: string | undefined): number {
  if (!q) return 0;
  if (q.endsWith("Ki")) return parseFloat(q) / 1024;
  if (q.endsWith("Mi")) return parseFloat(q);
  if (q.endsWith("Gi")) return parseFloat(q) * 1024;
  if (q.endsWith("Ti")) return parseFloat(q) * 1024 * 1024;
  // Plain bytes
  return parseFloat(q) / (1024 * 1024);
}

export function transformNode(
  node: k8s.V1Node,
  clusterId: string,
  cpuUsed = 0,
  memoryUsed = 0,
) {
  const name = node.metadata?.name ?? "unknown";
  const capacity = node.status?.capacity ?? {};

  return {
    id: node.metadata?.uid ?? `${clusterId}-node-${name}`,
    cluster_id: clusterId,
    name,
    status: getNodeStatus(node),
    role: getNodeRole(node),
    cpu_capacity: parseCpuQuantity(capacity.cpu),
    memory_capacity: parseMemoryQuantity(capacity.memory),
    cpu_used: cpuUsed,
    memory_used: memoryUsed,
    kubelet_version: node.status?.nodeInfo?.kubeletVersion ?? "unknown",
  };
}

// ── Deployments ──────────────────────────────────────────────────────────

export function transformDeployment(dep: k8s.V1Deployment, clusterId: string) {
  const name = dep.metadata?.name ?? "unknown";
  const namespace = dep.metadata?.namespace ?? "default";
  const containers = dep.spec?.template?.spec?.containers ?? [];

  return {
    id: dep.metadata?.uid ?? `${clusterId}-deploy-${name}`,
    cluster_id: clusterId,
    namespace_id: `${clusterId}-${namespace}`,
    name,
    replicas: dep.spec?.replicas ?? 0,
    available: dep.status?.availableReplicas ?? 0,
    ready: dep.status?.readyReplicas ?? 0,
    strategy: dep.spec?.strategy?.type ?? "RollingUpdate",
    image: containers[0]?.image ?? "unknown",
  };
}

// ── Services ─────────────────────────────────────────────────────────────

export function transformService(svc: k8s.V1Service, clusterId: string) {
  const name = svc.metadata?.name ?? "unknown";
  const namespace = svc.metadata?.namespace ?? "default";
  const ports = (svc.spec?.ports ?? []).map((p) => ({
    port: p.port,
    targetPort: p.targetPort ?? p.port,
    protocol: p.protocol ?? "TCP",
  }));

  return {
    id: svc.metadata?.uid ?? `${clusterId}-svc-${name}`,
    cluster_id: clusterId,
    namespace_id: `${clusterId}-${namespace}`,
    name,
    type: svc.spec?.type ?? "ClusterIP",
    cluster_ip: svc.spec?.clusterIP ?? "None",
    ports: JSON.stringify(ports),
  };
}

// ── Events ───────────────────────────────────────────────────────────────

export function transformEvent(event: k8s.CoreV1Event, clusterId: string) {
  const namespace = event.metadata?.namespace ?? "default";
  const timestamp =
    event.lastTimestamp ?? event.eventTime ?? event.metadata?.creationTimestamp;

  return {
    id: event.metadata?.uid ?? `${clusterId}-event-${event.metadata?.name}`,
    cluster_id: clusterId,
    namespace_id: `${clusterId}-${namespace}`,
    type: event.type ?? "Normal",
    reason: event.reason ?? "Unknown",
    message: event.message ?? "",
    source: event.source?.component ?? "unknown",
    created_at: timestamp
      ? new Date(timestamp as unknown as string)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19),
  };
}

// ── Alerts (synthetic from conditions) ───────────────────────────────────

export interface SyntheticAlert {
  id: string;
  cluster_id: string;
  name: string;
  severity: string;
  state: string;
  message: string;
  fired_at: string;
}

export function deriveAlerts(
  pods: k8s.V1Pod[],
  nodes: k8s.V1Node[],
  clusterId: string,
): SyntheticAlert[] {
  const alerts: SyntheticAlert[] = [];
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);

  // Pod-level alerts
  for (const pod of pods) {
    const status = getPodStatus(pod);
    const name = pod.metadata?.name ?? "unknown";

    if (status === "CrashLoopBackOff") {
      alerts.push({
        id: `${clusterId}-alert-crash-${pod.metadata?.uid}`,
        cluster_id: clusterId,
        name: "PodCrashLooping",
        severity: "warning",
        state: "firing",
        message: `Pod ${name} is in CrashLoopBackOff`,
        fired_at: now,
      });
    }
    if (status === "ImagePullBackOff" || status === "ErrImagePull") {
      alerts.push({
        id: `${clusterId}-alert-imgpull-${pod.metadata?.uid}`,
        cluster_id: clusterId,
        name: "ImagePullError",
        severity: "warning",
        state: "firing",
        message: `Pod ${name}: ${status}`,
        fired_at: now,
      });
    }
  }

  // Node-level alerts
  for (const node of nodes) {
    const conditions = node.status?.conditions ?? [];
    const name = node.metadata?.name ?? "unknown";

    const ready = conditions.find((c) => c.type === "Ready");
    if (ready?.status !== "True") {
      alerts.push({
        id: `${clusterId}-alert-node-${node.metadata?.uid}`,
        cluster_id: clusterId,
        name: "NodeNotReady",
        severity: "critical",
        state: "firing",
        message: `Node ${name} is not ready`,
        fired_at: now,
      });
    }

    for (const cond of conditions) {
      if (
        cond.type !== "Ready" &&
        cond.status === "True" &&
        ["DiskPressure", "MemoryPressure", "PIDPressure"].includes(
          cond.type ?? "",
        )
      ) {
        alerts.push({
          id: `${clusterId}-alert-${cond.type}-${node.metadata?.uid}`,
          cluster_id: clusterId,
          name: cond.type!,
          severity: "warning",
          state: "firing",
          message: `Node ${name}: ${cond.type} detected`,
          fired_at: now,
        });
      }
    }
  }

  return alerts;
}

// ── Storage ──────────────────────────────────────────────────────────────

export function transformPV(pv: k8s.V1PersistentVolume, clusterId: string) {
  const name = pv.metadata?.name ?? "unknown";
  return {
    id: pv.metadata?.uid ?? `${clusterId}-pv-${name}`,
    cluster_id: clusterId,
    name,
    capacity: pv.spec?.capacity?.storage ?? "0",
    access_mode: (pv.spec?.accessModes ?? ["ReadWriteOnce"])[0],
    status: pv.status?.phase ?? "Available",
    storage_class: pv.spec?.storageClassName ?? "standard",
  };
}

export function transformPVC(
  pvc: k8s.V1PersistentVolumeClaim,
  clusterId: string,
) {
  const name = pvc.metadata?.name ?? "unknown";
  const namespace = pvc.metadata?.namespace ?? "default";
  return {
    id: pvc.metadata?.uid ?? `${clusterId}-pvc-${name}`,
    cluster_id: clusterId,
    namespace_id: `${clusterId}-${namespace}`,
    name,
    status: pvc.status?.phase ?? "Pending",
    capacity:
      pvc.status?.capacity?.storage ??
      pvc.spec?.resources?.requests?.storage ??
      "0",
    storage_class: pvc.spec?.storageClassName ?? "standard",
    pv_name: pvc.spec?.volumeName ?? null,
  };
}
