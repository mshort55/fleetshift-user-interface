import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Label,
  SearchInput,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useApiBase, useClusterIds } from "./api";

interface K8sEvent {
  id: string;
  cluster_id: string;
  namespace_id: string;
  type: string;
  reason: string;
  message: string;
  source: string;
  created_at: string;
}

type TypeFilter = "All" | "Normal" | "Warning";

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

function typeColor(type: string): "green" | "orange" {
  return type === "Normal" ? "green" : "orange";
}

function truncateMessage(message: string, maxLen: number): string {
  if (message.length <= maxLen) return message;
  return message.slice(0, maxLen) + "...";
}

function useEvents() {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [events, setEvents] = useState<K8sEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController>();

  const fetchAll = useCallback(() => {
    if (clusterIds.length === 0) {
      setEvents([]);
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
        fetch(`${apiBase}/clusters/${id}/events`, {
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<K8sEvent[]>;
        }),
      ),
    )
      .then((results) => {
        const all = results.flat();
        all.sort((a, b) => {
          const dateA = new Date(
            a.created_at.replace(" ", "T") + "Z",
          ).getTime();
          const dateB = new Date(
            b.created_at.replace(" ", "T") + "Z",
          ).getTime();
          return dateB - dateA;
        });
        setEvents(all);
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

  return { events, loading, error };
}

const EventList: React.FC = () => {
  const { events, loading, error } = useEvents();
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        if (typeFilter !== "All" && event.type !== typeFilter) return false;
        if (searchFilter) {
          const term = searchFilter.toLowerCase();
          if (
            !event.message.toLowerCase().includes(term) &&
            !event.reason.toLowerCase().includes(term)
          ) {
            return false;
          }
        }
        return true;
      }),
    [events, searchFilter, typeFilter],
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
      <EmptyState titleText="Error loading events" headingLevel="h2">
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Toolbar
        clearAllFilters={() => {
          setSearchFilter("");
          setTypeFilter("All");
        }}
      >
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by message or reason"
              value={searchFilter}
              onChange={(_event, value) => setSearchFilter(value)}
              onClear={() => setSearchFilter("")}
            />
          </ToolbarItem>
          <ToolbarItem>
            <ToggleGroup aria-label="Event type filter">
              <ToggleGroupItem
                text="All"
                isSelected={typeFilter === "All"}
                onChange={() => setTypeFilter("All")}
              />
              <ToggleGroupItem
                text="Normal"
                isSelected={typeFilter === "Normal"}
                onChange={() => setTypeFilter("Normal")}
              />
              <ToggleGroupItem
                text="Warning"
                isSelected={typeFilter === "Warning"}
                onChange={() => setTypeFilter("Warning")}
              />
            </ToggleGroup>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState titleText="No events found" headingLevel="h2">
          <EmptyStateBody>
            {events.length > 0
              ? "No events match the current filters."
              : "There are no events available."}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Kubernetes events" variant="compact">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Reason</Th>
              <Th>Message</Th>
              <Th>Source</Th>
              <Th>Age</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((event) => {
              const truncated = truncateMessage(event.message, 120);
              const needsTooltip = event.message.length > 120;

              return (
                <Tr key={event.id}>
                  <Td dataLabel="Type">
                    <Label color={typeColor(event.type)}>{event.type}</Label>
                  </Td>
                  <Td dataLabel="Reason">{event.reason}</Td>
                  <Td dataLabel="Message">
                    {needsTooltip ? (
                      <Tooltip content={event.message}>
                        <span>{truncated}</span>
                      </Tooltip>
                    ) : (
                      truncated
                    )}
                  </Td>
                  <Td dataLabel="Source">{event.source}</Td>
                  <Td dataLabel="Age">{formatAge(event.created_at)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default EventList;
