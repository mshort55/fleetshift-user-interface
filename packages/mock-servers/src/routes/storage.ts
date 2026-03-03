import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/clusters/:id/pvs", (req, res) => {
  const pvs = db
    .prepare("SELECT * FROM pvs WHERE cluster_id = ?")
    .all(req.params.id);
  res.json(pvs);
});

router.get("/clusters/:id/pvcs", (req, res) => {
  const pvcs = db
    .prepare("SELECT * FROM pvcs WHERE cluster_id = ?")
    .all(req.params.id);
  res.json(pvcs);
});

export default router;
