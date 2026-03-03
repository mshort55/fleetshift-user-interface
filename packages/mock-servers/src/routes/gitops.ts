import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/clusters/:id/gitops", (req, res) => {
  const apps = db
    .prepare("SELECT * FROM gitops_apps WHERE cluster_id = ?")
    .all(req.params.id);
  res.json(apps);
});

export default router;
