import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

interface Node {
  id: string;
  cluster_id: string;
  name: string;
  status: string;
  role: string;
  cpu_capacity: number;
  memory_capacity: number;
  cpu_used: number;
  memory_used: number;
  kubelet_version: string;
}

function statusColor(status: string): "green" | "red" | "grey" {
  switch (status) {
    case "Ready":
      return "green";
    case "NotReady":
      return "red";
    default:
      return "grey";
  }
}

function roleColor(role: string): "blue" | "purple" | "teal" | "grey" {
  switch (role) {
    case "master":
      return "purple";
    case "worker":
      return "blue";
    case "infra":
      return "teal";
    default:
      return "grey";
  }
}

function formatCpu(used: number, capacity: number): string {
  return `${used}/${capacity} cores`;
}

function formatMemory(used: number, capacity: number): string {
  return `${used}/${capacity} Mi`;
}

function useNodes() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setNodes([]);
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
        fetch(`${apiBase}/clusters/${id}/nodes`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Node[]>;
        }),
      ),
    )
      .then((results) => {
        setNodes(results.flat());
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

  return { nodes, loading, error };
}

const NodeList: React.FC = () => {
  const { nodes, loading, error } = useNodes();
  const [nameFilter, setNameFilter] = useState("");

  const filtered = useMemo(
    () =>
      nodes.filter((node) => {
        if (
          nameFilter &&
          !node.name.toLowerCase().includes(nameFilter.toLowerCase())
        )
          return false;
        return true;
      }),
    [nodes, nameFilter],
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
      <EmptyState titleText="Error loading nodes" headingLevel="h2">
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Toolbar clearAllFilters={() => setNameFilter("")}>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by name"
              value={nameFilter}
              onChange={(_event, value) => setNameFilter(value)}
              onClear={() => setNameFilter("")}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState titleText="No nodes found" headingLevel="h2">
          <EmptyStateBody>
            {nodes.length > 0
              ? "No nodes match the current filter."
              : "There are no nodes available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Nodes" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Role</Th>
              <Th>CPU</Th>
              <Th>Memory</Th>
              <Th>Version</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((node) => (
              <Tr key={node.id}>
                <Td dataLabel="Name">{node.name}</Td>
                <Td dataLabel="Status">
                  <Label color={statusColor(node.status)}>{node.status}</Label>
                </Td>
                <Td dataLabel="Role">
                  <Label color={roleColor(node.role)}>{node.role}</Label>
                </Td>
                <Td dataLabel="CPU">
                  {formatCpu(node.cpu_used, node.cpu_capacity)}
                </Td>
                <Td dataLabel="Memory">
                  {formatMemory(node.memory_used, node.memory_capacity)}
                </Td>
                <Td dataLabel="Version">{node.kubelet_version}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default NodeList;
