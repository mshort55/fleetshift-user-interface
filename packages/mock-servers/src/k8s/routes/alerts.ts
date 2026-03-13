import { Router } from "express";
import { getCoreApi } from "../client";
import { deriveAlerts } from "../transforms";
import { requireCluster, k8sError, type ClusterMap } from "../utils";

export function alertRoutes(clusterMap: ClusterMap): Router {
  const router = Router();

  router.get("/clusters/:id/alerts", async (req, res) => {
    const clusterId = requireCluster(req, res, clusterMap);
    if (!clusterId) return;
    try {
      const core = getCoreApi();
      const [podResponse, nodeResponse] = await Promise.all([
        core.listPodForAllNamespaces(),
        core.listNode(),
      ]);
      const alerts = deriveAlerts(
        podResponse.items ?? [],
        nodeResponse.items ?? [],
        clusterId,
      );
      res.json(alerts);
    } catch (err) {
      k8sError(res, err);
    }
  });

  return router;
}
