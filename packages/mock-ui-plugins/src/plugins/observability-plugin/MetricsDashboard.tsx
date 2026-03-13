import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Progress,
  Spinner,
  Title,
  Content,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, useClusterIds } from "./api";

interface ClusterMetrics {
  clusterId: string;
  podCount: number;
  totalCpu: number;
  totalMemory: number;
  avgCpu: number;
  avgMemory: number;
  maxCpu: number;
  maxMemory: number;
  topCpuConsumers: Array<{ name: string; namespace: string; cpu: number }>;
  topMemoryConsumers: Array<{
    name: string;
    namespace: string;
    memory: number;
  }>;
}

const LoadingCard: React.FC<{
  title: string;
  children: React.ReactNode;
  loading: boolean;
}> = ({ title, children, loading }) => (
  <Card isFullHeight>
    <CardTitle>
      <Title headingLevel="h3" size="md">
        {title}
      </Title>
    </CardTitle>
    <CardBody>
      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "1rem" }}
        >
          <Spinner size="lg" />
        </div>
      ) : (
        children
      )}
    </CardBody>
  </Card>
);

const MetricsDashboard: React.FC = () => {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const clusterId = clusterIds[0] ?? null;

  const [metrics, setMetrics] = useState<ClusterMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!clusterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/clusters/${clusterId}/metrics`);
      if (res.ok) {
        const data: ClusterMetrics = await res.json();
        setMetrics(data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [apiBase, clusterId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (!clusterId) {
    return <Content component="p">No clusters available.</Content>;
  }

  const cpuPercent = metrics
    ? Math.round((metrics.totalCpu / metrics.maxCpu) * 100)
    : 0;
  const memPercent = metrics
    ? Math.round((metrics.totalMemory / metrics.maxMemory) * 100)
    : 0;

  const countStyle: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
  };

  return (
    <Grid hasGutter>
      {/* Summary row */}
      <GridItem md={4} sm={12}>
        <LoadingCard title="CPU Usage" loading={loading}>
          {metrics && (
            <>
              <Content component="p" style={{ marginBottom: "0.5rem" }}>
                {metrics.totalCpu.toFixed(2)} / {metrics.maxCpu} cores
              </Content>
              <Progress
                value={cpuPercent}
                title="CPU usage"
                aria-label="CPU usage"
              />
            </>
          )}
        </LoadingCard>
      </GridItem>

      <GridItem md={4} sm={12}>
        <LoadingCard title="Memory Usage" loading={loading}>
          {metrics && (
            <>
              <Content component="p" style={{ marginBottom: "0.5rem" }}>
                {metrics.totalMemory} / {metrics.maxMemory} MB
              </Content>
              <Progress
                value={memPercent}
                title="Memory usage"
                aria-label="Memory usage"
              />
            </>
          )}
        </LoadingCard>
      </GridItem>

      <GridItem md={4} sm={12}>
        <LoadingCard title="Pod Count" loading={loading}>
          {metrics && <div style={countStyle}>{metrics.podCount}</div>}
        </LoadingCard>
      </GridItem>

      {/* Top consumers row */}
      <GridItem md={6} sm={12}>
        <LoadingCard title="Top CPU Consumers" loading={loading}>
          {metrics && (
            <Table aria-label="Top CPU consumers" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>CPU (millicores)</Th>
                </Tr>
              </Thead>
              <Tbody>
                {metrics.topCpuConsumers.map((consumer) => (
                  <Tr key={`${consumer.namespace}/${consumer.name}`}>
                    <Td dataLabel="Name">{consumer.name}</Td>
                    <Td dataLabel="Namespace">{consumer.namespace}</Td>
                    <Td dataLabel="CPU (millicores)">
                      {Math.round(consumer.cpu * 1000)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </LoadingCard>
      </GridItem>

      <GridItem md={6} sm={12}>
        <LoadingCard title="Top Memory Consumers" loading={loading}>
          {metrics && (
            <Table aria-label="Top memory consumers" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Memory (Mi)</Th>
                </Tr>
              </Thead>
              <Tbody>
                {metrics.topMemoryConsumers.map((consumer) => (
                  <Tr key={`${consumer.namespace}/${consumer.name}`}>
                    <Td dataLabel="Name">{consumer.name}</Td>
                    <Td dataLabel="Namespace">{consumer.namespace}</Td>
                    <Td dataLabel="Memory (Mi)">{consumer.memory}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </LoadingCard>
      </GridItem>
    </Grid>
  );
};

export default MetricsDashboard;
