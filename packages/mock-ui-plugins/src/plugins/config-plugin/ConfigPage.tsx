import { useState, useMemo, useEffect } from "react";
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
import { useApiBase, fetchJson } from "./api";

// --- Types ---

interface ConfigMap {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  data_keys: string[];
}

interface Secret {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  type: string;
  data_keys: string[];
}

// --- Helpers ---

function extractNamespace(namespaceId: string, clusterId: string): string {
  const prefix = `${clusterId}-`;
  return namespaceId.startsWith(prefix)
    ? namespaceId.slice(prefix.length)
    : namespaceId;
}

// --- ConfigMaps Tab ---

const ConfigMapsTab: React.FC<{ clusterIds: string[] }> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");

  useEffect(() => {
    if (clusterIds.length === 0) {
      setConfigMaps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        fetchJson<ConfigMap[]>(`${apiBase}/clusters/${id}/configmaps`).catch(
          () => [] as ConfigMap[],
        ),
      ),
    ).then((results) => {
      setConfigMaps(results.flat());
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  const filtered = useMemo(
    () =>
      configMaps.filter((cm) =>
        nameFilter
          ? cm.name.toLowerCase().includes(nameFilter.toLowerCase())
          : true,
      ),
    [configMaps, nameFilter],
  );

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
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
        <EmptyState titleText="No ConfigMaps found" headingLevel="h2">
          <EmptyStateBody>
            {configMaps.length > 0
              ? "No ConfigMaps match the current filter."
              : "There are no ConfigMaps available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="ConfigMaps" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Cluster</Th>
              <Th>Namespace</Th>
              <Th>Keys</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((cm) => (
              <Tr key={cm.id}>
                <Td dataLabel="Name">{cm.name}</Td>
                <Td dataLabel="Cluster">{cm.cluster_id}</Td>
                <Td dataLabel="Namespace">
                  {extractNamespace(cm.namespace_id, cm.cluster_id)}
                </Td>
                <Td dataLabel="Keys">
                  <Label color="blue">{cm.data_keys.length}</Label>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

// --- Secrets Tab ---

const SecretsTab: React.FC<{ clusterIds: string[] }> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");

  useEffect(() => {
    if (clusterIds.length === 0) {
      setSecrets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        fetchJson<Secret[]>(`${apiBase}/clusters/${id}/secrets`).catch(
          () => [] as Secret[],
        ),
      ),
    ).then((results) => {
      setSecrets(results.flat());
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  const filtered = useMemo(
    () =>
      secrets.filter((s) =>
        nameFilter
          ? s.name.toLowerCase().includes(nameFilter.toLowerCase())
          : true,
      ),
    [secrets, nameFilter],
  );

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
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
        <EmptyState titleText="No Secrets found" headingLevel="h2">
          <EmptyStateBody>
            {secrets.length > 0
              ? "No Secrets match the current filter."
              : "There are no Secrets available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Secrets" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Cluster</Th>
              <Th>Namespace</Th>
              <Th>Type</Th>
              <Th>Keys</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((secret) => (
              <Tr key={secret.id}>
                <Td dataLabel="Name">{secret.name}</Td>
                <Td dataLabel="Cluster">{secret.cluster_id}</Td>
                <Td dataLabel="Namespace">
                  {extractNamespace(secret.namespace_id, secret.cluster_id)}
                </Td>
                <Td dataLabel="Type">
                  <Label color="grey">{secret.type}</Label>
                </Td>
                <Td dataLabel="Keys">
                  <Label color="blue">{secret.data_keys.length}</Label>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

// --- Main Page ---

const ConfigPage: React.FC<{ clusterIds: string[] }> = ({ clusterIds }) => {
  const [activeTab, setActiveTab] = useState<string | number>(0);

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
      aria-label="Config tabs"
    >
      <Tab eventKey={0} title={<TabTitleText>ConfigMaps</TabTitleText>}>
        <ConfigMapsTab clusterIds={clusterIds} />
      </Tab>
      <Tab eventKey={1} title={<TabTitleText>Secrets</TabTitleText>}>
        <SecretsTab clusterIds={clusterIds} />
      </Tab>
    </Tabs>
  );
};

export default ConfigPage;
