import { Router } from "express";
import db from "../db";

const router = Router();

interface PodRow {
  id: string;
  name: string;
  namespace_id: string;
  cpu_usage: number;
  memory_usage: number;
  status: string;
}

// GET /clusters/:id/metrics — fake CPU/memory data
router.get("/clusters/:id/metrics", (req, res) => {
  const pods = db
    .prepare("SELECT * FROM pods WHERE cluster_id = ?")
    .all(req.params.id) as PodRow[];

  if (pods.length === 0) {
    res.status(404).json({ error: "No pods found for cluster" });
    return;
  }

  const totalCpu = pods.reduce((sum, p) => sum + p.cpu_usage, 0);
  const totalMemory = pods.reduce((sum, p) => sum + p.memory_usage, 0);
  const avgCpu = Math.round((totalCpu / pods.length) * 100) / 100;
  const avgMemory = Math.round((totalMemory / pods.length) * 100) / 100;

  const topCpuConsumers = [...pods]
    .sort((a, b) => b.cpu_usage - a.cpu_usage)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      namespace: p.namespace_id.split("-").slice(1).join("-"),
      cpu: p.cpu_usage,
    }));

  const topMemoryConsumers = [...pods]
    .sort((a, b) => b.memory_usage - a.memory_usage)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      namespace: p.namespace_id.split("-").slice(1).join("-"),
      memory: p.memory_usage,
    }));

  // Compute capacity from actual node data
  const nodes = db
    .prepare(
      "SELECT cpu_capacity, memory_capacity FROM nodes WHERE cluster_id = ?",
    )
    .all(req.params.id) as { cpu_capacity: number; memory_capacity: number }[];
  const maxCpu = nodes.reduce((sum, n) => sum + n.cpu_capacity, 0) || 8;
  const maxMemory = nodes.reduce((sum, n) => sum + n.memory_capacity, 0) || 2048;

  res.json({
    clusterId: req.params.id,
    podCount: pods.length,
    totalCpu: Math.round(totalCpu * 100) / 100,
    totalMemory: Math.round(totalMemory * 100) / 100,
    avgCpu,
    avgMemory,
    maxCpu,
    maxMemory,
    topCpuConsumers,
    topMemoryConsumers,
    pods: pods.map((p) => ({
      name: p.name,
      namespace: p.namespace_id.split("-").slice(1).join("-"),
      cpu: p.cpu_usage,
      memory: p.memory_usage,
      status: p.status,
    })),
  });
});

export default router;
