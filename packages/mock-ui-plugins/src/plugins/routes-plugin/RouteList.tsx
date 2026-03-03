import { useEffect, useState } from "react";
import { Label, Spinner } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useApiBase, fetchJson } from "./api";

interface Route {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  host: string;
  path: string;
  service_name: string;
  tls: number;
  status: string;
}

interface RouteListProps {
  clusterIds: string[];
}

const RouteList = ({ clusterIds }: RouteListProps) => {
  const apiBase = useApiBase();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const multiCluster = clusterIds.length > 1;

  useEffect(() => {
    Promise.all(
      clusterIds.map((id) =>
        fetchJson<Route[]>(`${apiBase}/clusters/${id}/routes`),
      ),
    ).then((results) => {
      setRoutes(results.flat());
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  if (loading) return <Spinner size="lg" />;

  return (
    <Table aria-label="Route list" variant="compact">
      <Thead>
        <Tr>
          <Th>Name</Th>
          {multiCluster && <Th>Cluster</Th>}
          <Th>Host</Th>
          <Th>Path</Th>
          <Th>Service</Th>
          <Th>TLS</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {routes.map((route) => (
          <Tr key={route.id}>
            <Td>{route.name}</Td>
            {multiCluster && <Td>{route.cluster_id}</Td>}
            <Td>{route.host}</Td>
            <Td>{route.path}</Td>
            <Td>{route.service_name}</Td>
            <Td>
              <Label color={route.tls === 1 ? "green" : "grey"}>
                {route.tls === 1 ? "Yes" : "No"}
              </Label>
            </Td>
            <Td>
              <Label color={route.status === "Admitted" ? "green" : "red"}>
                {route.status}
              </Label>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default RouteList;
