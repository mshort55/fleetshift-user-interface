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

interface Service {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  type: string;
  cluster_ip: string;
  ports: string;
}

interface Ingress {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  host: string;
  path: string;
  service_name: string;
  tls: number;
}

interface PortEntry {
  port: number;
  targetPort: number;
  protocol: string;
}

function extractNamespace(namespaceId: string, clusterId: string): string {
  return namespaceId.startsWith(clusterId + "-")
    ? namespaceId.slice(clusterId.length + 1)
    : namespaceId;
}

function formatPorts(portsJson: string): string {
  try {
    const parsed: PortEntry[] = JSON.parse(portsJson);
    return parsed.map((p) => `${p.port}/${p.protocol}`).join(", ");
  } catch {
    return portsJson;
  }
}

function useServices() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [services, setServices] = useState<(Service & { namespace: string })[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setServices([]);
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
        fetch(`${apiBase}/clusters/${id}/services`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Service[]>;
        }),
      ),
    )
      .then((results) => {
        const all = results.flat().map((svc) => ({
          ...svc,
          namespace: extractNamespace(svc.namespace_id, svc.cluster_id),
        }));
        setServices(all);
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

  return { services, loading, error };
}

function useIngresses() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [ingresses, setIngresses] = useState<
    (Ingress & { namespace: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setIngresses([]);
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
        fetch(`${apiBase}/clusters/${id}/ingresses`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Ingress[]>;
        }),
      ),
    )
      .then((results) => {
        const all = results.flat().map((ing) => ({
          ...ing,
          namespace: extractNamespace(ing.namespace_id, ing.cluster_id),
        }));
        setIngresses(all);
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

  return { ingresses, loading, error };
}

const ServicesTab: React.FC = () => {
  const { services, loading, error } = useServices();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () =>
      services.filter(
        (svc) =>
          !filter || svc.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [services, filter],
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
      <EmptyState titleText="Error loading services" headingLevel="h2">
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
        <EmptyState titleText="No services found" headingLevel="h2">
          <EmptyStateBody>
            {services.length > 0
              ? "No services match the current filter."
              : "There are no services available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Services" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Namespace</Th>
              <Th>Type</Th>
              <Th>Cluster IP</Th>
              <Th>Ports</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((svc) => (
              <Tr key={svc.id}>
                <Td dataLabel="Name">{svc.name}</Td>
                <Td dataLabel="Namespace">{svc.namespace}</Td>
                <Td dataLabel="Type">
                  <Label>{svc.type}</Label>
                </Td>
                <Td dataLabel="Cluster IP">{svc.cluster_ip}</Td>
                <Td dataLabel="Ports">{formatPorts(svc.ports)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

const IngressesTab: React.FC = () => {
  const { ingresses, loading, error } = useIngresses();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () =>
      ingresses.filter(
        (ing) =>
          !filter || ing.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [ingresses, filter],
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
      <EmptyState titleText="Error loading ingresses" headingLevel="h2">
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
        <EmptyState titleText="No ingresses found" headingLevel="h2">
          <EmptyStateBody>
            {ingresses.length > 0
              ? "No ingresses match the current filter."
              : "There are no ingresses available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Ingresses" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Namespace</Th>
              <Th>Host</Th>
              <Th>Path</Th>
              <Th>Service</Th>
              <Th>TLS</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((ing) => (
              <Tr key={ing.id}>
                <Td dataLabel="Name">{ing.name}</Td>
                <Td dataLabel="Namespace">{ing.namespace}</Td>
                <Td dataLabel="Host">{ing.host}</Td>
                <Td dataLabel="Path">{ing.path}</Td>
                <Td dataLabel="Service">{ing.service_name}</Td>
                <Td dataLabel="TLS">
                  <Label color={ing.tls === 1 ? "green" : "grey"}>
                    {ing.tls === 1 ? "Yes" : "No"}
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

const NetworkingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | number>(0);

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
      aria-label="Networking tabs"
    >
      <Tab eventKey={0} title={<TabTitleText>Services</TabTitleText>}>
        <ServicesTab />
      </Tab>
      <Tab eventKey={1} title={<TabTitleText>Ingresses</TabTitleText>}>
        <IngressesTab />
      </Tab>
    </Tabs>
  );
};

export default NetworkingPage;
