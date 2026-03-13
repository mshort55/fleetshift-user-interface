import { Router } from "express";
import { getCoreApi, getMetricsClient, type LiveCluster } from "../client";
import { transformPod } from "../transforms";
import {
  requireCluster,
  k8sError,
  parseCpuString,
  parseMemoryString,
  type ClusterMap,
} from "../utils";

export function podRoutes(
  clusterMap: ClusterMap,
  liveClusters: LiveCluster[],
): Router {
  const router = Router();

  router.get("/clusters/:id/pods", async (req, res) => {
    const clusterId = requireCluster(req, res, clusterMap);
    if (!clusterId) return;
    const nsFilter = req.query.namespace as string | undefined;
    try {
      const core = getCoreApi();
      const podResponse = nsFilter
        ? await core.listNamespacedPod({ namespace: nsFilter })
        : await core.listPodForAllNamespaces();
      const pods = podResponse.items ?? [];

      const podMetrics = new Map<string, { cpu: number; memory: number }>();
      const metrics = getMetricsClient();
      if (metrics) {
        try {
          const metricsResponse = nsFilter
            ? await metrics.getPodMetrics(nsFilter)
            : await metrics.getPodMetrics();
          for (const pm of metricsResponse.items) {
            let totalCpu = 0;
            let totalMem = 0;
            for (const container of pm.containers) {
              totalCpu += parseCpuString(container.usage.cpu);
              totalMem += parseMemoryString(container.usage.memory);
            }
            podMetrics.set(pm.metadata.name, {
              cpu: totalCpu,
              memory: totalMem,
            });
          }
        } catch {
          // Metrics not available
        }
      }

      const result = pods.map((pod) => {
        const m = podMetrics.get(pod.metadata?.name ?? "");
        return transformPod(pod, clusterId, m?.cpu ?? 0, m?.memory ?? 0);
      });

      res.json(result);
    } catch (err) {
      k8sError(res, err);
    }
  });

  router.get("/pods/aggregate", async (_req, res) => {
    try {
      const core = getCoreApi();
      const podResponse = await core.listPodForAllNamespaces();
      const pods = podResponse.items ?? [];

      for (const cluster of liveClusters) {
        const total = pods.length;
        const running = pods.filter(
          (p) => p.status?.phase === "Running",
        ).length;
        const pending = pods.filter(
          (p) => p.status?.phase === "Pending",
        ).length;
        const failing = pods.filter((p) => {
          const cs = p.status?.containerStatuses ?? [];
          return cs.some(
            (c) => c.state?.waiting?.reason === "CrashLoopBackOff",
          );
        }).length;

        res.json([
          {
            cluster_id: cluster.id,
            total,
            running,
            pending,
            failing,
            avg_cpu: 0,
            avg_memory: 0,
          },
        ]);
        return;
      }
      res.json([]);
    } catch (err) {
      k8sError(res, err);
    }
  });

  return router;
}
