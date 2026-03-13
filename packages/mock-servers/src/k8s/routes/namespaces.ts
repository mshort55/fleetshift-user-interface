import { Router } from "express";
import { getCoreApi } from "../client";
import { transformNamespace } from "../transforms";
import { requireCluster, k8sError, type ClusterMap } from "../utils";

export function namespaceRoutes(clusterMap: ClusterMap): Router {
  const router = Router();

  router.get("/clusters/:id/namespaces", async (req, res) => {
    const clusterId = requireCluster(req, res, clusterMap);
    if (!clusterId) return;
    try {
      const core = getCoreApi();
      const [nsResponse, podResponse] = await Promise.all([
        core.listNamespace(),
        core.listPodForAllNamespaces(),
      ]);

      const podCountMap = new Map<string, number>();
      for (const pod of podResponse.items ?? []) {
        const nsName = pod.metadata?.namespace ?? "default";
        podCountMap.set(nsName, (podCountMap.get(nsName) ?? 0) + 1);
      }

      const result = (nsResponse.items ?? [])
        .map((ns) => transformNamespace(ns, clusterId))
        .map((ns) => ({ ...ns, podCount: podCountMap.get(ns.name) ?? 0 }));

      res.json(result);
    } catch (err) {
      k8sError(res, err);
    }
  });

  return router;
}
