import express from "express";
import cors from "cors";
import db from "./db";
import { seedCluster, AVAILABLE_CLUSTERS } from "./seed";
import clusterRoutes from "./routes/clusters";
import namespaceRoutes from "./routes/namespaces";
import podRoutes from "./routes/pods";
import metricsRoutes from "./routes/metrics";
import nodeRoutes from "./routes/nodes";
import serviceRoutes from "./routes/services";
import storageRoutes from "./routes/storage";
import upgradeRoutes from "./routes/upgrades";
import alertRoutes from "./routes/alerts";
import costRoutes from "./routes/cost";
import deploymentRoutes from "./routes/deployments";
import logRoutes from "./routes/logs";
import pipelineRoutes from "./routes/pipelines";
import configRoutes from "./routes/config";
import gitopsRoutes from "./routes/gitops";
import eventRoutes from "./routes/events";
import appRoutes from "./routes/appRoutes";
import userRoutes from "./routes/users";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1", clusterRoutes);
app.use("/api/v1", namespaceRoutes);
app.use("/api/v1", podRoutes);
app.use("/api/v1", metricsRoutes);
app.use("/api/v1", nodeRoutes);
app.use("/api/v1", serviceRoutes);
app.use("/api/v1", storageRoutes);
app.use("/api/v1", upgradeRoutes);
app.use("/api/v1", alertRoutes);
app.use("/api/v1", costRoutes);
app.use("/api/v1", deploymentRoutes);
app.use("/api/v1", logRoutes);
app.use("/api/v1", pipelineRoutes);
app.use("/api/v1", configRoutes);
app.use("/api/v1", gitopsRoutes);
app.use("/api/v1", eventRoutes);
app.use("/api/v1", appRoutes);
app.use("/api/v1", userRoutes);

// Seed default clusters if none installed
const clusterCount = (
  db.prepare("SELECT COUNT(*) as c FROM clusters").get() as { c: number }
).c;
if (clusterCount === 0) {
  seedCluster(AVAILABLE_CLUSTERS[0]); // US East Production
  seedCluster(AVAILABLE_CLUSTERS[1]); // EU West Staging

  // Assign plugins that match the seeded canvas pages
  const opsPlugins = [
    "core",
    "observability",
    "nodes",
    "networking",
    "alerts",
    "operator",
  ];
  const devPlugins = [
    "core",
    "deployments",
    "pipelines",
    "gitops",
    "alerts",
    "operator",
  ];
  db.prepare("UPDATE clusters SET plugins = ? WHERE id = ?").run(
    JSON.stringify(opsPlugins),
    AVAILABLE_CLUSTERS[0].id,
  );
  db.prepare("UPDATE clusters SET plugins = ? WHERE id = ?").run(
    JSON.stringify(devPlugins),
    AVAILABLE_CLUSTERS[1].id,
  );
  console.log("Seeded 2 default clusters with plugins");
}

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`FleetShift mock server running on http://localhost:${PORT}`);
});
