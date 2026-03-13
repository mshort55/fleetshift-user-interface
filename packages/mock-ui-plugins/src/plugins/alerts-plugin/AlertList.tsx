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
import { CheckCircleIcon } from "@patternfly/react-icons";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, useClusterIds } from "./api";

interface Alert {
  id: string;
  cluster_id: string;
  name: string;
  severity: string;
  state: string;
  message: string;
  fired_at: string;
}

function formatRelativeTime(firedAt: string): string {
  const fired = new Date(firedAt.replace(" ", "T") + "Z");
  const now = Date.now();
  const diffMs = now - fired.getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function severityColor(severity: string): "red" | "orange" {
  return severity === "critical" ? "red" : "orange";
}

function useAlerts() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setAlerts([]);
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
        fetch(`${apiBase}/clusters/${id}/alerts`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<Alert[]>;
        }),
      ),
    )
      .then((results) => {
        setAlerts(results.flat());
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

  return { alerts, loading, error };
}

const AlertList: React.FC = () => {
  const { alerts, loading, error } = useAlerts();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () =>
      alerts.filter((alert) => {
        if (!filter) return true;
        const lc = filter.toLowerCase();
        return (
          alert.name.toLowerCase().includes(lc) ||
          alert.message.toLowerCase().includes(lc)
        );
      }),
    [alerts, filter],
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
      <EmptyState titleText="Error loading alerts" headingLevel="h2">
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        titleText="No alerts firing"
        headingLevel="h2"
        icon={CheckCircleIcon}
      >
        <EmptyStateBody>
          All systems are healthy. There are no active alerts at this time.
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
              placeholder="Filter by name or message"
              value={filter}
              onChange={(_event, value) => setFilter(value)}
              onClear={() => setFilter("")}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState titleText="No matching alerts" headingLevel="h2">
          <EmptyStateBody>No alerts match the current filter.</EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Alerts" variant="compact">
          <Thead>
            <Tr>
              <Th>Severity</Th>
              <Th>Alert Name</Th>
              <Th>State</Th>
              <Th>Message</Th>
              <Th>Fired At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((alert) => (
              <Tr key={alert.id}>
                <Td dataLabel="Severity">
                  <Label color={severityColor(alert.severity)}>
                    {alert.severity}
                  </Label>
                </Td>
                <Td dataLabel="Alert Name">{alert.name}</Td>
                <Td dataLabel="State">
                  <Label color="red">{alert.state}</Label>
                </Td>
                <Td dataLabel="Message">{alert.message}</Td>
                <Td dataLabel="Fired At">
                  {formatRelativeTime(alert.fired_at)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default AlertList;
