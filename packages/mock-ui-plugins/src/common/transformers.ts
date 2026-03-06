import { ExtPodKind, ExtPodStatus } from "./utils";
import { DeploymentKind } from "../plugins/core-plugin/Deployment/DeploymenDetails";

/** Raw pod row from the mock server DB. */
interface PodRow {
  id: string;
  namespace_id: string;
  cluster_id: string;
  name: string;
  status: string;
  restarts: number;
  cpu_usage: number;
  memory_usage: number;
  created_at: string;
}

/** Raw deployment row from the mock server DB. */
interface DeploymentRow {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  replicas: number;
  available: number;
  ready: number;
  strategy: string;
  image: string;
}

/** Extract namespace name from namespace_id format: "<cluster_id>-<namespace_name>" */
function extractNamespace(namespaceId: string, clusterId: string): string {
  return namespaceId.startsWith(clusterId + "-")
    ? namespaceId.slice(clusterId.length + 1)
    : namespaceId;
}

export function transformPod(row: PodRow): ExtPodKind {
  const namespace = extractNamespace(row.namespace_id, row.cluster_id);
  return {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: row.name,
      namespace,
      uid: row.id,
      creationTimestamp: row.created_at,
    },
    status: {
      phase: row.status as ExtPodStatus["phase"],
    },
  };
}

export function transformDeployment(row: DeploymentRow): DeploymentKind {
  const namespace = extractNamespace(row.namespace_id, row.cluster_id);
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: row.name,
      namespace,
      uid: row.id,
    },
    spec: {
      replicas: row.replicas,
      strategy: {
        type: row.strategy,
        ...(row.strategy === "RollingUpdate"
          ? { rollingUpdate: { maxSurge: "25%", maxUnavailable: "25%" } }
          : {}),
      },
      selector: { matchLabels: { app: row.name } },
      template: {
        metadata: { labels: { app: row.name } },
        spec: {
          containers: [
            {
              name: row.name,
              image: row.image,
            },
          ],
        },
      },
    },
    status: {
      replicas: row.replicas,
      availableReplicas: row.available,
      readyReplicas: row.ready,
      updatedReplicas: row.replicas,
      conditions: [
        {
          type: "Available",
          status: row.available > 0 ? "True" : "False",
          lastUpdateTime: new Date().toISOString(),
          lastTransitionTime: new Date().toISOString(),
          reason:
            row.available > 0 ? "MinimumReplicasAvailable" : "Unavailable",
          message:
            row.available > 0
              ? `Deployment has minimum availability. ${row.available} of ${row.replicas} replicas available.`
              : "Deployment does not have minimum availability.",
        },
        {
          type: "Progressing",
          status: "True",
          lastUpdateTime: new Date().toISOString(),
          lastTransitionTime: new Date().toISOString(),
          reason: "NewReplicaSetAvailable",
          message: `ReplicaSet "${row.name}" has successfully progressed.`,
        },
      ],
    },
  };
}
