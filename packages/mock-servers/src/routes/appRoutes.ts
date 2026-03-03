import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/clusters/:id/routes", (req, res) => {
  const routes = db
    .prepare("SELECT * FROM routes WHERE cluster_id = ?")
    .all(req.params.id);
  res.json(routes);
});

export default router;
