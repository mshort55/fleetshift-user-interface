import { Router } from "express";
import { getPluginRegistry } from "../pluginRegistry";

const router = Router();

router.get("/plugin-registry", (_req, res) => {
  const registry = getPluginRegistry();
  if (!registry) {
    res.status(503).json({ error: "Plugin registry not yet available" });
    return;
  }
  res.json(registry);
});

export default router;
