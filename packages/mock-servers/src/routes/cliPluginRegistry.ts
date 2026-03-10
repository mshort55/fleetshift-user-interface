import { Router } from "express";
import { getCliPluginRegistry } from "../cliPluginRegistry";

const router = Router();

router.get("/cli-plugin-registry", (_req, res) => {
  const registry = getCliPluginRegistry();
  if (!registry) {
    res.status(503).json({ error: "CLI plugin registry not yet available" });
    return;
  }
  res.json(registry);
});

export default router;
