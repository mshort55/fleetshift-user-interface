import { Router } from "express";
import db from "../db";

const router = Router();

const LATEST_VERSIONS: Record<string, string> = {
  "4.15": "4.15.3",
  "4.14": "4.14.12",
  "4.13": "4.13.18",
};

router.get("/clusters/:id/upgrades", (req, res) => {
  const cluster = db
    .prepare("SELECT id, version FROM clusters WHERE id = ?")
    .get(req.params.id) as { id: string; version: string } | undefined;

  if (!cluster) {
    res.status(404).json({ error: "Cluster not found" });
    return;
  }

  const minor = cluster.version.split(".").slice(0, 2).join(".");
  const latest = LATEST_VERSIONS[minor] || cluster.version;
  const upToDate = cluster.version === latest;

  res.json({
    clusterId: cluster.id,
    currentVersion: cluster.version,
    latestVersion: latest,
    upToDate,
    availableUpdates: upToDate ? [] : [latest],
  });
});

export default router;
