import { useEffect, useMemo, useState } from "react";
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
import { useApiBase, useClusterIds, fetchJson } from "./api";

interface GitOpsApp {
  id: string;
  cluster_id: string;
  name: string;
  repo: string;
  path: string;
  sync_status: string;
  health_status: string;
  last_synced: string;
}

function syncStatusColor(status: string): "green" | "orange" | "red" {
  switch (status) {
    case "Synced":
      return "green";
    case "OutOfSync":
      return "orange";
    default:
      return "red";
  }
}

function healthStatusColor(status: string): "green" | "orange" | "red" {
  switch (status) {
    case "Healthy":
      return "green";
    case "Degraded":
      return "orange";
    default:
      return "red";
  }
}

function formatRelativeTime(timestamp: string): string {
  const raw = timestamp.includes("T")
    ? timestamp
    : timestamp.replace(" ", "T") + "Z";
  const date = new Date(raw);
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateRepo(repo: string, maxLen = 50): string {
  if (repo.length <= maxLen) return repo;
  return repo.slice(0, maxLen) + "\u2026";
}

interface GitOpsListProps {
  clusterIds: string[];
}

const GitOpsList: React.FC<GitOpsListProps> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const reactiveClusterIds = useClusterIds();
  const effectiveIds = clusterIds.length > 0 ? clusterIds : reactiveClusterIds;

  const [apps, setApps] = useState<GitOpsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (effectiveIds.length === 0) {
      setApps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      effectiveIds.map((id) =>
        fetchJson<GitOpsApp[]>(`${apiBase}/clusters/${id}/gitops`).catch(
          () => [] as GitOpsApp[],
        ),
      ),
    ).then((results) => {
      setApps(results.flat());
      setLoading(false);
    });
  }, [apiBase, effectiveIds]);

  const filtered = useMemo(
    () =>
      apps.filter((app) => {
        if (!filter) return true;
        return app.name.toLowerCase().includes(filter.toLowerCase());
      }),
    [apps, filter],
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
        <EmptyState titleText="No GitOps applications found" headingLevel="h2">
          <EmptyStateBody>
            {apps.length > 0
              ? "No applications match the current filter."
              : "There are no GitOps applications available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="GitOps applications" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Cluster</Th>
              <Th>Repository</Th>
              <Th>Path</Th>
              <Th>Sync Status</Th>
              <Th>Health</Th>
              <Th>Last Synced</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((app) => (
              <Tr key={app.id}>
                <Td dataLabel="Name">{app.name}</Td>
                <Td dataLabel="Cluster">{app.cluster_id}</Td>
                <Td dataLabel="Repository">
                  <code>{truncateRepo(app.repo)}</code>
                </Td>
                <Td dataLabel="Path">{app.path}</Td>
                <Td dataLabel="Sync Status">
                  <Label color={syncStatusColor(app.sync_status)}>
                    {app.sync_status}
                  </Label>
                </Td>
                <Td dataLabel="Health">
                  <Label color={healthStatusColor(app.health_status)}>
                    {app.health_status}
                  </Label>
                </Td>
                <Td dataLabel="Last Synced">
                  {formatRelativeTime(app.last_synced)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default GitOpsList;
