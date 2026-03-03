import { useParams, Link } from "react-router-dom";
import {
  Title,
  Spinner,
  Button,
  Label,
  Checkbox,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import { useClusters } from "../contexts/ClusterContext";

const OPS_PLUGINS = [
  { key: "core", label: "Core" },
  { key: "observability", label: "Observability" },
  { key: "nodes", label: "Nodes" },
  { key: "networking", label: "Networking" },
  { key: "storage", label: "Storage" },
  { key: "upgrades", label: "Upgrades" },
  { key: "alerts", label: "Alerts" },
  { key: "cost", label: "Cost" },
];

const DEV_PLUGINS = [
  { key: "deployments", label: "Deployments" },
  { key: "logs", label: "Logs" },
  { key: "pipelines", label: "Pipelines" },
  { key: "config", label: "Config" },
  { key: "gitops", label: "GitOps" },
  { key: "events", label: "Events" },
  { key: "routes", label: "Routes" },
];

export const ClusterDetailPage = () => {
  const { clusterId } = useParams<{ clusterId: string }>();
  const { installed, loading, togglePlugin, uninstall } = useClusters();
  const cluster = installed.find((c) => c.id === clusterId);

  if (loading) return <Spinner size="xl" />;
  if (!cluster) return <div>Cluster not found or not installed.</div>;

  return (
    <>
      <Flex>
        <FlexItem>
          <Title headingLevel="h1">{cluster.name}</Title>
        </FlexItem>
        <FlexItem align={{ default: "alignRight" }}>
          <Button
            variant="danger"
            onClick={async () => {
              await uninstall(cluster.id);
            }}
            component={(props) => <Link to="/clusters" {...props} />}
          >
            Uninstall
          </Button>
        </FlexItem>
      </Flex>

      <Grid hasGutter style={{ marginTop: 16 }}>
        <GridItem md={6}>
          <Card>
            <CardTitle>Ops Plugins</CardTitle>
            <CardBody>
              {OPS_PLUGINS.map((p) => (
                <Checkbox
                  key={p.key}
                  id={`plugin-${p.key}`}
                  label={p.label}
                  isChecked={cluster.plugins.includes(p.key)}
                  onChange={() => togglePlugin(cluster.id, p.key)}
                />
              ))}
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card>
            <CardTitle>Dev Plugins</CardTitle>
            <CardBody>
              {DEV_PLUGINS.map((p) => (
                <Checkbox
                  key={p.key}
                  id={`plugin-${p.key}`}
                  label={p.label}
                  isChecked={cluster.plugins.includes(p.key)}
                  onChange={() => togglePlugin(cluster.id, p.key)}
                />
              ))}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Flex style={{ marginTop: 16 }} spaceItems={{ default: "spaceItemsMd" }}>
        <FlexItem>
          <Label>Version: {cluster.version}</Label>
        </FlexItem>
        <FlexItem>
          <Label color="green">{cluster.status}</Label>
        </FlexItem>
      </Flex>
    </>
  );
};
