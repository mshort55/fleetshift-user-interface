import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Label,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, useClusterIds } from "./api";

interface Pod {
  id: string;
  namespace_id: string;
  cluster_id: string;
  name: string;
  status: string;
  restarts: number;
  cpu_usage: number;
  memory_usage: number;
  created_at: string;
}

function extractNamespace(namespaceId: string, clusterId: string): string {
  return namespaceId.startsWith(clusterId + "-")
    ? namespaceId.slice(clusterId.length + 1)
    : namespaceId;
}

function formatAge(createdAt: string): string {
  const created = new Date(createdAt.replace(" ", "T") + "Z");
  const now = Date.now();
  const diffMs = now - created.getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function statusColor(
  status: string,
): "green" | "blue" | "orange" | "red" | "grey" {
  switch (status) {
    case "Running":
      return "green";
    case "Completed":
    case "Succeeded":
      return "blue";
    case "Pending":
    case "ContainerCreating":
      return "orange";
    case "CrashLoopBackOff":
    case "ImagePullBackOff":
    case "ErrImagePull":
    case "Error":
    case "Failed":
      return "red";
    default:
      return "grey";
  }
}

function usePods() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [pods, setPods] = useState<(Pod & { namespace: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setPods([]);
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
        fetch(`${apiBase}/clusters/${id}/pods`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Pod[]>;
        }),
      ),
    )
      .then((results) => {
        const all = results.flat().map((pod) => ({
          ...pod,
          namespace: extractNamespace(pod.namespace_id, pod.cluster_id),
        }));
        setPods(all);
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

  return { pods, loading, error };
}

const PodList: React.FC = () => {
  const { pods, loading, error } = usePods();
  const [nameFilter, setNameFilter] = useState("");
  const [nsFilter, setNsFilter] = useState<string | null>(null);
  const [nsSelectOpen, setNsSelectOpen] = useState(false);

  const namespaces = useMemo(
    () => [...new Set(pods.map((p) => p.namespace))].sort(),
    [pods],
  );

  const filtered = useMemo(
    () =>
      pods.filter((pod) => {
        if (
          nameFilter &&
          !pod.name.toLowerCase().includes(nameFilter.toLowerCase())
        )
          return false;
        if (nsFilter && pod.namespace !== nsFilter) return false;
        return true;
      }),
    [pods, nameFilter, nsFilter],
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
      <EmptyState titleText="Error loading pods" headingLevel="h2">
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Toolbar
        clearAllFilters={() => {
          setNameFilter("");
          setNsFilter(null);
        }}
      >
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by name"
              value={nameFilter}
              onChange={(_event, value) => setNameFilter(value)}
              onClear={() => setNameFilter("")}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Select
              isOpen={nsSelectOpen}
              onOpenChange={setNsSelectOpen}
              onSelect={(_event, value) => {
                setNsFilter(value as string);
                setNsSelectOpen(false);
              }}
              selected={nsFilter}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setNsSelectOpen((prev) => !prev)}
                  isExpanded={nsSelectOpen}
                  style={{ minWidth: "180px" }}
                >
                  {nsFilter ?? "All namespaces"}
                </MenuToggle>
              )}
            >
              <SelectList>
                {namespaces.map((ns) => (
                  <SelectOption key={ns} value={ns}>
                    {ns}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState titleText="No pods found" headingLevel="h2">
          <EmptyStateBody>
            {pods.length > 0
              ? "No pods match the current filters."
              : "There are no pods available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Pods" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Namespace</Th>
              <Th>Status</Th>
              <Th>Restarts</Th>
              <Th>CPU</Th>
              <Th>Memory</Th>
              <Th>Age</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((pod) => (
              <Tr key={pod.id}>
                <Td dataLabel="Name">{pod.name}</Td>
                <Td dataLabel="Namespace">{pod.namespace}</Td>
                <Td dataLabel="Status">
                  <Label color={statusColor(pod.status)}>{pod.status}</Label>
                </Td>
                <Td dataLabel="Restarts">{pod.restarts}</Td>
                <Td dataLabel="CPU">
                  {pod.cpu_usage > 0
                    ? `${Math.round(pod.cpu_usage * 1000)}m`
                    : "—"}
                </Td>
                <Td dataLabel="Memory">
                  {pod.memory_usage > 0
                    ? `${Math.round(pod.memory_usage)}Mi`
                    : "—"}
                </Td>
                <Td dataLabel="Age">{formatAge(pod.created_at)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default PodList;
