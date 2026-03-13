import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToggleGroup,
  ToggleGroupItem,
  Button,
} from "@patternfly/react-core";
import { SyncAltIcon } from "@patternfly/react-icons";
import { useApiBase, useClusterIds } from "./api";
import { LogEntry } from "./LogEntry";

interface LogLine {
  timestamp: string;
  pod: string;
  namespace: string;
  level: string;
  message: string;
}

type LevelFilter = "All" | "INFO" | "WARN" | "ERROR" | "DEBUG";

const LEVELS: LevelFilter[] = ["All", "INFO", "WARN", "ERROR", "DEBUG"];

const LogViewer: React.FC = () => {
  const apiBase = useApiBase();
  const clusterIds = useClusterIds();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("All");

  const fetchLogs = useCallback(async () => {
    if (clusterIds.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const clusterId = clusterIds[0];
      const response = await fetch(`${apiBase}/clusters/${clusterId}/logs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      const data: LogLine[] = await response.json();
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, clusterIds]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "All" && log.level !== levelFilter) {
      return false;
    }
    if (
      searchText &&
      !log.message.toLowerCase().includes(searchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <Card>
      <CardTitle>Logs</CardTitle>
      <CardBody>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                placeholder="Filter by message"
                value={searchText}
                onChange={(_event, value) => setSearchText(value)}
                onClear={() => setSearchText("")}
              />
            </ToolbarItem>
            <ToolbarItem>
              <ToggleGroup aria-label="Log level filter">
                {LEVELS.map((level) => (
                  <ToggleGroupItem
                    key={level}
                    text={level}
                    buttonId={`log-level-${level}`}
                    isSelected={levelFilter === level}
                    onChange={() => setLevelFilter(level)}
                  />
                ))}
              </ToggleGroup>
            </ToolbarItem>
            <ToolbarItem>
              <Button
                variant="plain"
                aria-label="Refresh logs"
                onClick={fetchLogs}
                icon={<SyncAltIcon />}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {loading ? (
          <Spinner aria-label="Loading logs" />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            titleText="No logs available"
            headingLevel="h2"
            variant={EmptyStateVariant.sm}
          >
            <EmptyStateBody>
              {logs.length === 0
                ? "No log data was returned from the cluster."
                : "No logs match the current filters."}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <div
            style={{
              overflow: "auto",
              maxHeight: 600,
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          >
            <pre style={{ margin: 0 }}>
              <code>
                {filteredLogs.map((log, index) => (
                  <LogEntry key={index} log={log} />
                ))}
              </code>
            </pre>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default LogViewer;
