import { Router } from "express";
import { getAppsApi } from "../client";
import { transformDeployment } from "../transforms";
import { requireCluster, k8sError, type ClusterMap } from "../utils";

export function deploymentRoutes(clusterMap: ClusterMap): Router {
  const router = Router();

  router.get("/clusters/:id/deployments", async (req, res) => {
    const clusterId = requireCluster(req, res, clusterMap);
    if (!clusterId) return;
    try {
      const apps = getAppsApi();
      const depResponse = await apps.listDeploymentForAllNamespaces();
      const result = (depResponse.items ?? []).map((dep) =>
        transformDeployment(dep, clusterId),
      );
      res.json(result);
    } catch (err) {
      k8sError(res, err);
    }
  });

  return router;
}
