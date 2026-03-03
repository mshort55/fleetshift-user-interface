import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/clusters/:id/deployments", (req, res) => {
  const deployments = db
    .prepare("SELECT * FROM deployments WHERE cluster_id = ?")
    .all(req.params.id);
  res.json(deployments);
});

export default router;
