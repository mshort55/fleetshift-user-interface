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

interface Deployment {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  replicas: number;
  available: number;
  ready: number;
  strategy: string;
  image: string;
}

interface DeploymentRow extends Deployment {
  namespace: string;
}

function extractNamespace(namespaceId: string, clusterId: string): string {
  return namespaceId.startsWith(clusterId + "-")
    ? namespaceId.slice(clusterId.length + 1)
    : namespaceId;
}

function useDeployments() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setDeployments([]);
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
        fetch(`${apiBase}/clusters/${id}/deployments`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Deployment[]>;
        }),
      ),
    )
      .then((results) => {
        const all = results.flat().map((dep) => ({
          ...dep,
          namespace: extractNamespace(dep.namespace_id, dep.cluster_id),
        }));
        setDeployments(all);
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

  return { deployments, loading, error };
}

const DeploymentList: React.FC = () => {
  const { deployments, loading, error } = useDeployments();
  const [nameFilter, setNameFilter] = useState("");
  const [nsFilter, setNsFilter] = useState<string | null>(null);
  const [nsSelectOpen, setNsSelectOpen] = useState(false);

  const namespaces = useMemo(
    () => [...new Set(deployments.map((d) => d.namespace))].sort(),
    [deployments],
  );

  const filtered = useMemo(
    () =>
      deployments.filter((dep) => {
        if (
          nameFilter &&
          !dep.name.toLowerCase().includes(nameFilter.toLowerCase())
        )
          return false;
        if (nsFilter && dep.namespace !== nsFilter) return false;
        return true;
      }),
    [deployments, nameFilter, nsFilter],
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
      <EmptyState titleText="Error loading deployments" headingLevel="h2">
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
        <EmptyState titleText="No deployments found" headingLevel="h2">
          <EmptyStateBody>
            {deployments.length > 0
              ? "No deployments match the current filters."
              : "There are no deployments available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Deployments" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Namespace</Th>
              <Th>Ready</Th>
              <Th>Available</Th>
              <Th>Strategy</Th>
              <Th>Image</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((dep) => (
              <Tr key={dep.id}>
                <Td dataLabel="Name">{dep.name}</Td>
                <Td dataLabel="Namespace">{dep.namespace}</Td>
                <Td dataLabel="Ready">
                  <span
                    style={{
                      color:
                        dep.ready === dep.replicas
                          ? "var(--pf-t--global--color--status--success--default)"
                          : "var(--pf-t--global--color--status--warning--default)",
                    }}
                  >
                    {dep.ready}/{dep.replicas}
                  </span>
                </Td>
                <Td dataLabel="Available">{dep.available}</Td>
                <Td dataLabel="Strategy">
                  <Label>{dep.strategy}</Label>
                </Td>
                <Td dataLabel="Image">{dep.image}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default DeploymentList;
