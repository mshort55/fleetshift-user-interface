import { useState, useEffect, useCallback, useRef } from "react";
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
import { useApiBase, useClusterIds } from "./api";

interface Namespace {
  id: string;
  cluster_id: string;
  name: string;
  status: string;
  podCount: number;
}

function useNamespaces() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setNamespaces([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    Promise.all(
      clusterIds.map((id) =>
        fetch(`${apiBase}/clusters/${id}/namespaces`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Namespace[]>;
        }),
      ),
    )
      .then((results) => {
        setNamespaces(results.flat());
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [apiBase, clusterIds]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  return { namespaces, loading, error, refetch: fetchAll };
}

const columnNames = {
  name: "Name",
  status: "Status",
  podCount: "Pod Count",
};

const NamespaceList: React.FC = () => {
  const { namespaces, loading, error } = useNamespaces();
  const [filter, setFilter] = useState("");

  const filtered = namespaces.filter((ns) =>
    ns.name.toLowerCase().includes(filter.toLowerCase()),
  );

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <EmptyState titleText="Error loading namespaces" headingLevel="h2">
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Toolbar>
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
        <EmptyState titleText="No namespaces found" headingLevel="h2">
          <EmptyStateBody>
            {namespaces.length > 0
              ? "No namespaces match the current filter."
              : "There are no namespaces available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Namespaces" variant="compact">
          <Thead>
            <Tr>
              <Th>{columnNames.name}</Th>
              <Th>{columnNames.status}</Th>
              <Th>{columnNames.podCount}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((ns) => (
              <Tr key={ns.id}>
                <Td dataLabel={columnNames.name}>{ns.name}</Td>
                <Td dataLabel={columnNames.status}>
                  <Label color={ns.status === "Active" ? "green" : "red"}>
                    {ns.status}
                  </Label>
                </Td>
                <Td dataLabel={columnNames.podCount}>{ns.podCount}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default NamespaceList;
