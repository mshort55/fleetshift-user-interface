import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Label,
  SearchInput,
  Spinner,
  Tab,
  Tabs,
  TabTitleText,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, useClusterIds } from "./api";

interface PV {
  id: string;
  cluster_id: string;
  name: string;
  capacity: string;
  access_mode: string;
  status: string;
  storage_class: string;
}

interface PVC {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  status: string;
  capacity: string;
  storage_class: string;
  pv_name: string | null;
}

function pvStatusColor(status: string): "green" | "orange" | "red" | "grey" {
  switch (status) {
    case "Available":
    case "Bound":
      return "green";
    case "Released":
      return "orange";
    case "Failed":
      return "red";
    default:
      return "grey";
  }
}

function pvcStatusColor(status: string): "green" | "orange" | "red" | "grey" {
  switch (status) {
    case "Bound":
      return "green";
    case "Pending":
      return "orange";
    case "Lost":
      return "red";
    default:
      return "grey";
  }
}

function extractNamespace(namespaceId: string, clusterId: string): string {
  return namespaceId.startsWith(clusterId + "-")
    ? namespaceId.slice(clusterId.length + 1)
    : namespaceId;
}

function useFetchAll<T>(endpoint: string) {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setData([]);
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
        fetch(`${apiBase}/clusters/${id}/${endpoint}`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<T[]>;
        }),
      ),
    )
      .then((results) => {
        setData(results.flat());
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [apiBase, clusterIds, endpoint]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  return { data, loading, error };
}

const PVTab: React.FC = () => {
  const { data: pvs, loading, error } = useFetchAll<PV>("pvs");
  const [nameFilter, setNameFilter] = useState("");

  const filtered = useMemo(
    () =>
      pvs.filter((pv) =>
        nameFilter
          ? pv.name.toLowerCase().includes(nameFilter.toLowerCase())
          : true,
      ),
    [pvs, nameFilter],
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
      <EmptyState
        titleText="Error loading persistent volumes"
        headingLevel="h2"
      >
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
              value={nameFilter}
              onChange={(_event, value) => setNameFilter(value)}
              onClear={() => setNameFilter("")}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState titleText="No persistent volumes found" headingLevel="h2">
          <EmptyStateBody>
            {pvs.length > 0
              ? "No persistent volumes match the current filter."
              : "There are no persistent volumes available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Persistent Volumes" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Capacity</Th>
              <Th>Access Mode</Th>
              <Th>Status</Th>
              <Th>Storage Class</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((pv) => (
              <Tr key={pv.id}>
                <Td dataLabel="Name">{pv.name}</Td>
                <Td dataLabel="Capacity">{pv.capacity}</Td>
                <Td dataLabel="Access Mode">{pv.access_mode}</Td>
                <Td dataLabel="Status">
                  <Label color={pvStatusColor(pv.status)}>{pv.status}</Label>
                </Td>
                <Td dataLabel="Storage Class">{pv.storage_class}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

const PVCTab: React.FC = () => {
  const { data: pvcs, loading, error } = useFetchAll<PVC>("pvcs");
  const [nameFilter, setNameFilter] = useState("");

  const filtered = useMemo(
    () =>
      pvcs.filter((pvc) =>
        nameFilter
          ? pvc.name.toLowerCase().includes(nameFilter.toLowerCase())
          : true,
      ),
    [pvcs, nameFilter],
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
      <EmptyState
        titleText="Error loading persistent volume claims"
        headingLevel="h2"
      >
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
              value={nameFilter}
              onChange={(_event, value) => setNameFilter(value)}
              onClear={() => setNameFilter("")}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState
          titleText="No persistent volume claims found"
          headingLevel="h2"
        >
          <EmptyStateBody>
            {pvcs.length > 0
              ? "No persistent volume claims match the current filter."
              : "There are no persistent volume claims available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Persistent Volume Claims" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Namespace</Th>
              <Th>Status</Th>
              <Th>Capacity</Th>
              <Th>Storage Class</Th>
              <Th>Volume</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((pvc) => (
              <Tr key={pvc.id}>
                <Td dataLabel="Name">{pvc.name}</Td>
                <Td dataLabel="Namespace">
                  {extractNamespace(pvc.namespace_id, pvc.cluster_id)}
                </Td>
                <Td dataLabel="Status">
                  <Label color={pvcStatusColor(pvc.status)}>{pvc.status}</Label>
                </Td>
                <Td dataLabel="Capacity">{pvc.capacity}</Td>
                <Td dataLabel="Storage Class">{pvc.storage_class}</Td>
                <Td dataLabel="Volume">{pvc.pv_name ?? "—"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

const StoragePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | number>(0);

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
      aria-label="Storage tabs"
    >
      <Tab eventKey={0} title={<TabTitleText>Persistent Volumes</TabTitleText>}>
        <PVTab />
      </Tab>
      <Tab
        eventKey={1}
        title={<TabTitleText>Persistent Volume Claims</TabTitleText>}
      >
        <PVCTab />
      </Tab>
    </Tabs>
  );
};

export default StoragePage;
