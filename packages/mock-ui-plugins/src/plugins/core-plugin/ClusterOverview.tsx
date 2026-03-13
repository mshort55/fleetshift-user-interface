import { useMemo } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Spinner,
  Title,
  Content,
  Icon,
} from "@patternfly/react-core";
import {
  CubesIcon,
  ProjectDiagramIcon,
  ServerIcon,
} from "@patternfly/react-icons";
import { useApiBase, useClusterIds, useFetch } from "./api";

interface PodAggregate {
  cluster_id: string;
  total: number;
  running: number;
  pending: number;
  failing: number;
  avg_cpu: number;
  avg_memory: number;
}

interface NodeItem {
  id: string;
  name: string;
  status: string;
  role: string;
  cpu_capacity: number;
  memory_capacity: number;
  cpu_used: number;
  memory_used: number;
}

interface NamespaceItem {
  id: string;
  [key: string]: unknown;
}

interface StatCardProps {
  title: string;
  icon: React.ComponentType;
  loading: boolean;
  children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  icon: IconComponent,
  loading,
  children,
}) => (
  <Card isFullHeight>
    <CardTitle>
      <Title headingLevel="h3" size="md">
        <Icon isInline style={{ marginRight: "0.5rem" }}>
          <IconComponent />
        </Icon>
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

const ClusterOverview: React.FC = () => {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const clusterId = clusterIds[0] ?? null;

  const podsUrl = clusterId ? `${apiBase}/pods/aggregate` : null;
  const namespacesUrl = clusterId
    ? `${apiBase}/clusters/${clusterId}/namespaces`
    : null;
  const nodesUrl = clusterId ? `${apiBase}/clusters/${clusterId}/nodes` : null;

  const { data: podAggregates, loading: podsLoading } =
    useFetch<PodAggregate[]>(podsUrl);
  const { data: namespaces, loading: nsLoading } =
    useFetch<NamespaceItem[]>(namespacesUrl);
  const { data: nodes, loading: nodesLoading } = useFetch<NodeItem[]>(nodesUrl);

  const podData = useMemo(() => {
    if (!podAggregates || !clusterId) return null;
    return podAggregates.find((a) => a.cluster_id === clusterId) ?? null;
  }, [podAggregates, clusterId]);

  const nodeStats = useMemo(() => {
    if (!nodes) return null;
    const ready = nodes.filter((n) => n.status === "Ready").length;
    return { total: nodes.length, ready, notReady: nodes.length - ready };
  }, [nodes]);

  if (!clusterId) {
    return <Content component="p">No clusters available.</Content>;
  }

  const countStyle: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
  };

  const breakdownStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  };

  return (
    <Grid hasGutter>
      <GridItem md={4} sm={12}>
        <StatCard title="Pods" icon={CubesIcon} loading={podsLoading}>
          <div style={countStyle}>{podData?.total ?? 0}</div>
          <div style={breakdownStyle}>
            <span
              style={{
                color: "var(--pf-t--global--color--status--success--default)",
              }}
            >
              {podData?.running ?? 0} running
            </span>
            {" / "}
            <span
              style={{
                color: "var(--pf-t--global--color--status--warning--default)",
              }}
            >
              {podData?.pending ?? 0} pending
            </span>
            {" / "}
            <span
              style={{
                color: "var(--pf-t--global--color--status--danger--default)",
              }}
            >
              {podData?.failing ?? 0} failing
            </span>
          </div>
        </StatCard>
      </GridItem>

      <GridItem md={4} sm={12}>
        <StatCard
          title="Namespaces"
          icon={ProjectDiagramIcon}
          loading={nsLoading}
        >
          <div style={countStyle}>{namespaces?.length ?? 0}</div>
          <div style={breakdownStyle}>
            <span
              style={{
                color: "var(--pf-t--global--color--nonstatus--gray--default)",
              }}
            >
              across cluster
            </span>
          </div>
        </StatCard>
      </GridItem>

      <GridItem md={4} sm={12}>
        <StatCard title="Nodes" icon={ServerIcon} loading={nodesLoading}>
          <div style={countStyle}>{nodeStats?.total ?? 0}</div>
          <div style={breakdownStyle}>
            <span
              style={{
                color: "var(--pf-t--global--color--status--success--default)",
              }}
            >
              {nodeStats?.ready ?? 0} ready
            </span>
            {" / "}
            <span
              style={{
                color: "var(--pf-t--global--color--status--danger--default)",
              }}
            >
              {nodeStats?.notReady ?? 0} not ready
            </span>
          </div>
        </StatCard>
      </GridItem>
    </Grid>
  );
};

export default ClusterOverview;
