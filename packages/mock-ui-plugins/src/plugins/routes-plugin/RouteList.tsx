import { useState, useEffect, useMemo } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Label,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, fetchJson } from "./api";

interface Route {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  host: string;
  path: string;
  service_name: string;
  tls: 0 | 1;
  status: string;
}

function extractNamespace(namespaceId: string, clusterId: string): string {
  if (namespaceId.startsWith(clusterId + "-")) {
    return namespaceId.slice(clusterId.length + 1);
  }
  return namespaceId;
}

const RouteList: React.FC<{ clusterIds: string[] }> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (clusterIds.length === 0) {
      setRoutes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        fetchJson<Route[]>(`${apiBase}/clusters/${id}/routes`).catch(
          () => [] as Route[],
        ),
      ),
    ).then((results) => {
      setRoutes(results.flat());
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  const filtered = useMemo(
    () =>
      routes.filter(
        (route) =>
          !filter || route.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [routes, filter],
  );

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (routes.length === 0) {
    return (
      <EmptyState titleText="No routes found" headingLevel="h2">
        <EmptyStateBody>
          There are no OpenShift Routes available for the selected clusters.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Toolbar clearAllFilters={() => setFilter("")}>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by name"
              value={filter}
              onChange={(_event, value) => setFilter(value)}
              onClear={() => setFilter("")}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState titleText="No matching routes" headingLevel="h2">
          <EmptyStateBody>No routes match the current filter.</EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="OpenShift Routes" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Cluster</Th>
              <Th>Namespace</Th>
              <Th>Host</Th>
              <Th>Path</Th>
              <Th>Service</Th>
              <Th>TLS</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((route) => (
              <Tr key={route.id}>
                <Td dataLabel="Name">{route.name}</Td>
                <Td dataLabel="Cluster">{route.cluster_id}</Td>
                <Td dataLabel="Namespace">
                  {extractNamespace(route.namespace_id, route.cluster_id)}
                </Td>
                <Td dataLabel="Host">{route.host}</Td>
                <Td dataLabel="Path">{route.path}</Td>
                <Td dataLabel="Service">{route.service_name}</Td>
                <Td dataLabel="TLS">
                  <Label color={route.tls === 1 ? "green" : "grey"}>
                    {route.tls === 1 ? "Yes" : "No"}
                  </Label>
                </Td>
                <Td dataLabel="Status">
                  <Label
                    color={route.status === "Admitted" ? "green" : "orange"}
                  >
                    {route.status}
                  </Label>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default RouteList;
