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
import { useApiBase } from "./api";

interface Pipeline {
  id: string;
  cluster_id: string;
  name: string;
  status: string;
  started_at: string;
  duration_seconds: number;
  stages: string[];
}

function statusColor(status: string): "green" | "red" | "blue" | "orange" {
  switch (status) {
    case "Succeeded":
      return "green";
    case "Failed":
      return "red";
    case "Running":
      return "blue";
    case "Pending":
      return "orange";
    default:
      return "blue";
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${hours}h`;
}

function formatRelativeTime(startedAt: string): string {
  const raw = startedAt.includes("T")
    ? startedAt
    : startedAt.replace(" ", "T") + "Z";
  const started = new Date(raw);
  const now = Date.now();
  const diffMs = now - started.getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface PipelineListProps {
  clusterIds: string[];
}

const PipelineList: React.FC<PipelineListProps> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");

  useEffect(() => {
    if (clusterIds.length === 0) {
      setPipelines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        fetch(`${apiBase}/clusters/${id}/pipelines`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
      ),
    ).then((results) => {
      setPipelines(results.flat());
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  const filtered = useMemo(
    () =>
      pipelines.filter((p) => {
        if (!nameFilter) return true;
        return p.name.toLowerCase().includes(nameFilter.toLowerCase());
      }),
    [pipelines, nameFilter],
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
        <EmptyState titleText="No pipelines found" headingLevel="h2">
          <EmptyStateBody>
            {pipelines.length > 0
              ? "No pipelines match the current filter."
              : "There are no pipelines available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Pipelines" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Cluster</Th>
              <Th>Status</Th>
              <Th>Started</Th>
              <Th>Duration</Th>
              <Th>Stages</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((pipeline) => (
              <Tr key={pipeline.id}>
                <Td dataLabel="Name">{pipeline.name}</Td>
                <Td dataLabel="Cluster">{pipeline.cluster_id}</Td>
                <Td dataLabel="Status">
                  <Label color={statusColor(pipeline.status)}>
                    {pipeline.status}
                  </Label>
                </Td>
                <Td dataLabel="Started">
                  {formatRelativeTime(pipeline.started_at)}
                </Td>
                <Td dataLabel="Duration">
                  {formatDuration(pipeline.duration_seconds)}
                </Td>
                <Td dataLabel="Stages">
                  <Label>{pipeline.stages.length} stages</Label>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default PipelineList;
