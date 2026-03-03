import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/clusters/:id/nodes", (req, res) => {
  const nodes = db
    .prepare("SELECT * FROM nodes WHERE cluster_id = ?")
    .all(req.params.id);
  res.json(nodes);
});

export default router;
