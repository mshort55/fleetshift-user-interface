import { Box, Text } from "ink";
import { Badge, StatusMessage } from "@inkjs/ui";
import { makeRequest, fetchClusters } from "@fleetshift/common";
import type { ReactNode } from "react";

interface NamespaceCost {
  namespace: string;
  cpuCores: number;
  memoryMB: number;
  estimatedMonthlyCost: number;
}

interface ClusterCost {
  clusterId: string;
  totalCpuCores: number;
  totalMemoryMB: number;
  estimatedMonthlyCost: number;
  namespaceBreakdown: NamespaceCost[];
}

function Bar({
  value,
  max,
  width = 20,
}: {
  value: number;
  max: number;
  width?: number;
}) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  return (
    <Text>
      <Text color="green">{"\u2588".repeat(filled)}</Text>
      <Text dimColor>{"\u2591".repeat(width - filled)}</Text>
    </Text>
  );
}

function dollar(n: number): string {
  return `$${n.toFixed(2)}`;
}

async function costSummary(
  apiBase: string,
  clusterId: string,
): Promise<ReactNode> {
  const clusters = await fetchClusters(apiBase);
  const cluster = clusters.find((c) => c.id === clusterId);

  if (!cluster) {
    return (
      <StatusMessage variant="error">
        Cluster not found: {clusterId}
      </StatusMessage>
    );
  }

  const cost = await makeRequest<ClusterCost>(
    `${apiBase}/clusters/${clusterId}/cost`,
  );

  const sorted = [...cost.namespaceBreakdown].sort(
    (a, b) => b.estimatedMonthlyCost - a.estimatedMonthlyCost,
  );

  const maxNsCost =
    sorted.length > 0
      ? Math.max(...sorted.map((n) => n.estimatedMonthlyCost))
      : 0;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Cost Summary: {cluster.name}
        </Text>
      </Box>

      <Box>
        <Box width={20}>
          <Text bold>CPU</Text>
        </Box>
        <Box width={20}>
          <Text bold>Memory</Text>
        </Box>
        <Box width={20}>
          <Text bold>Est. Monthly</Text>
        </Box>
      </Box>
      <Box marginBottom={1}>
        <Box width={20}>
          <Text>{cost.totalCpuCores.toFixed(1)} cores</Text>
        </Box>
        <Box width={20}>
          <Text>{cost.totalMemoryMB.toFixed(0)} MB</Text>
        </Box>
        <Box width={20}>
          <Badge color="yellow">{dollar(cost.estimatedMonthlyCost)}</Badge>
        </Box>
      </Box>

      {sorted.length > 0 && (
        <>
          <Text bold>Namespace Breakdown:</Text>
          <Box>
            <Box width={24}>
              <Text bold dimColor>
                Namespace
              </Text>
            </Box>
            <Box width={10}>
              <Text bold dimColor>
                CPU
              </Text>
            </Box>
            <Box width={10}>
              <Text bold dimColor>
                Mem
              </Text>
            </Box>
            <Box width={12}>
              <Text bold dimColor>
                Cost/mo
              </Text>
            </Box>
            <Text bold dimColor>
              Usage
            </Text>
          </Box>
          {sorted.map((ns) => (
            <Box key={ns.namespace}>
              <Box width={24}>
                <Text>{ns.namespace.slice(0, 22)}</Text>
              </Box>
              <Box width={10}>
                <Text>{ns.cpuCores.toFixed(1)}</Text>
              </Box>
              <Box width={10}>
                <Text>{ns.memoryMB.toFixed(0)}MB</Text>
              </Box>
              <Box width={12}>
                <Text color="yellow">{dollar(ns.estimatedMonthlyCost)}</Text>
              </Box>
              <Bar value={ns.estimatedMonthlyCost} max={maxNsCost} width={15} />
            </Box>
          ))}
        </>
      )}

      <Text dimColor>
        {"\n"}
        {sorted.length} namespace(s)
      </Text>
    </Box>
  );
}

export default costSummary;
