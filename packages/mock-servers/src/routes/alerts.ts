import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/clusters/:id/alerts", (req, res) => {
  const alerts = db
    .prepare("SELECT * FROM alerts WHERE cluster_id = ? ORDER BY fired_at DESC")
    .all(req.params.id);
  res.json(alerts);
});

export default router;
