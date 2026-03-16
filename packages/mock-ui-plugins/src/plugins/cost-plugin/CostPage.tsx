import { useState, useEffect, useMemo } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Grid,
  GridItem,
  Spinner,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, fetchJson } from "./api";
import CostStatCard from "./CostStatCard";

interface NamespaceCost {
  namespace: string;
  cpuCores: number;
  memoryMB: number;
  estimatedMonthlyCost: number;
}

interface ClusterCostResponse {
  estimatedMonthlyCost: number;
  namespaceBreakdown: NamespaceCost[];
}

interface ClusterCostData {
  clusterId: string;
  estimatedMonthlyCost: number;
  namespaceBreakdown: NamespaceCost[];
}

function formatCost(value: number): string {
  return `$${value.toFixed(2)}`;
}

const CostPage: React.FC<{ clusterIds: string[] }> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const [data, setData] = useState<ClusterCostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clusterIds.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        fetchJson<ClusterCostResponse>(`${apiBase}/clusters/${id}/cost`)
          .then((resp) => ({ clusterId: id, ...resp }))
          .catch(
            () =>
              ({
                clusterId: id,
                estimatedMonthlyCost: 0,
                namespaceBreakdown: [],
              }) as ClusterCostData,
          ),
      ),
    ).then((results) => {
      setData(results);
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  const totals = useMemo(() => {
    let cpu = 0;
    let memory = 0;
    let cost = 0;
    for (const cluster of data) {
      cost += cluster.estimatedMonthlyCost;
      for (const ns of cluster.namespaceBreakdown) {
        cpu += ns.cpuCores;
        memory += ns.memoryMB;
      }
    }
    return {
      cpu: Math.round(cpu * 100) / 100,
      memory: Math.round(memory),
      cost,
    };
  }, [data]);

  const namespaceRows = useMemo(() => {
    const rows: (NamespaceCost & { clusterId: string })[] = [];
    for (const cluster of data) {
      for (const ns of cluster.namespaceBreakdown) {
        rows.push({ ...ns, clusterId: cluster.clusterId });
      }
    }
    return rows;
  }, [data]);

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState titleText="No cost data available" headingLevel="h2">
        <EmptyStateBody>
          There is no cost data available for the selected clusters.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Grid hasGutter>
        <GridItem span={4}>
          <CostStatCard title="Total CPU Cores" value={String(totals.cpu)} />
        </GridItem>
        <GridItem span={4}>
          <CostStatCard
            title="Total Memory (MB)"
            value={String(totals.memory)}
          />
        </GridItem>
        <GridItem span={4}>
          <CostStatCard
            title="Est. Monthly Cost"
            value={formatCost(totals.cost)}
          />
        </GridItem>
      </Grid>

      <Table aria-label="Namespace cost breakdown" variant="compact">
        <Thead>
          <Tr>
            <Th>Namespace</Th>
            <Th>Cluster</Th>
            <Th>CPU Cores</Th>
            <Th>Memory (MB)</Th>
            <Th>Est. Monthly Cost</Th>
          </Tr>
        </Thead>
        <Tbody>
          {namespaceRows.map((row) => (
            <Tr key={`${row.clusterId}-${row.namespace}`}>
              <Td dataLabel="Namespace">{row.namespace}</Td>
              <Td dataLabel="Cluster">{row.clusterId}</Td>
              <Td dataLabel="CPU Cores">{row.cpuCores}</Td>
              <Td dataLabel="Memory (MB)">{row.memoryMB}</Td>
              <Td dataLabel="Est. Monthly Cost">
                {formatCost(row.estimatedMonthlyCost)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export default CostPage;
