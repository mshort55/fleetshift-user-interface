import { Router } from "express";
import type { LiveCluster } from "../client";

export function clusterRoutes(liveClusters: LiveCluster[]): Router {
  const router = Router();
  const clusterMap = new Map(liveClusters.map((c) => [c.id, c]));

  router.get("/clusters/available", (_req, res) => {
    res.json(
      liveClusters.map((c) => ({
        id: c.id,
        name: c.name,
        status: "ready",
        version: c.version,
        plugins: c.plugins,
        installed: true,
      })),
    );
  });

  router.get("/clusters", (_req, res) => {
    res.json(
      liveClusters.map((c) => ({
        id: c.id,
        name: c.name,
        status: "ready",
        version: c.version,
        plugins: c.plugins,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      })),
    );
  });

  router.get("/clusters/:id", (req, res) => {
    const cluster = clusterMap.get(req.params.id);
    if (!cluster) {
      res.status(404).json({ error: "Cluster not found" });
      return;
    }
    res.json({
      id: cluster.id,
      name: cluster.name,
      status: "ready",
      version: cluster.version,
      plugins: cluster.plugins,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    });
  });

  return router;
}
