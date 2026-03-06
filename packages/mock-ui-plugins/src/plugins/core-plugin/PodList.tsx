import { useEffect, useState } from "react";
import { Label, Spinner } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useApiBase, fetchJson } from "./api";

interface Pod {
  id: string;
  name: string;
  namespace_id: string;
  status: string;
  restarts: number;
  cpu_usage: number;
  memory_usage: number;
  cluster_id?: string;
}

interface PodListProps {
  clusterIds: string[];
  namespace?: string;
}

const statusColor = (status: string) => {
  if (status === "Running") return "green";
  if (status === "Pending") return "blue";
  if (status === "CrashLoopBackOff") return "red";
  return "grey";
};

const PodList = ({ clusterIds, namespace }: PodListProps) => {
  const apiBase = useApiBase();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const multiCluster = clusterIds.length > 1;

  useEffect(() => {
    const doFetch = () => {
      Promise.all(
        clusterIds.map((id) => {
          const url = namespace
            ? `${apiBase}/clusters/${id}/pods?namespace=${namespace}`
            : `${apiBase}/clusters/${id}/pods`;
          return fetchJson<Pod[]>(url).then((data) =>
            data.map((pod) => ({ ...pod, cluster_id: id })),
          );
        }),
      ).then((results) => {
        setPods(results.flat());
        setLoading(false);
      });
    };

    doFetch();
    const interval = setInterval(doFetch, 10_000);
    return () => clearInterval(interval);
  }, [apiBase, clusterIds, namespace]);

  if (loading) return <Spinner size="lg" />;

  return (
    <Table aria-label="Pod list" variant="compact">
      <Thead>
        <Tr>
          <Th>Name</Th>
          {multiCluster && <Th>Cluster</Th>}
          <Th>Namespace</Th>
          <Th>Status</Th>
          <Th>Restarts</Th>
          <Th>CPU</Th>
          <Th>Memory (MB)</Th>
        </Tr>
      </Thead>
      <Tbody>
        {pods.map((pod) => (
          <Tr key={pod.id}>
            <Td>{pod.name}</Td>
            {multiCluster && <Td>{pod.cluster_id}</Td>}
            <Td>{pod.namespace_id.replace(`${pod.cluster_id}-`, "")}</Td>
            <Td>
              <Label color={statusColor(pod.status)}>{pod.status}</Label>
            </Td>
            <Td>{pod.restarts}</Td>
            <Td>{pod.cpu_usage} cores</Td>
            <Td>{pod.memory_usage}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PodList;
