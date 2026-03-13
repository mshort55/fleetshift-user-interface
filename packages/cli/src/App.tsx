import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Box, Text, useApp } from "ink";
import { StatusMessage, ThemeProvider } from "@inkjs/ui";
import { fleetshiftTheme } from "./theme.js";
import {
  runCommand,
  getCommandNames,
  getSubCommandNames,
  configNeedsClusterArg,
  needsClusterArg,
  getPluginKeyForCommand,
} from "./commands/index.js";
import { type Cluster, fetchClusters } from "@fleetshift/common";
import { getLoadedPlugins } from "./plugins.js";
import { getValidToken } from "./auth/tokenStore.js";
import { FullScreenFrame } from "./components/FullScreenFrame.js";
import { ScrollingFrame } from "./components/ScrollingFrame.js";
import { OutputBlock } from "./types.js";

export type AppMode = "fullscreen" | "scrolling";

interface AppProps {
  apiBase: string;
  mode: AppMode;
}

/** Groups that can be entered as a sub-menu */
const MENU_GROUPS = ["user", "config"];

let blockId = 0;

function buildPluginBlocks(): OutputBlock[] {
  const loaded = getLoadedPlugins();
  if (loaded.length === 0) return [];
  return [
    {
      id: blockId++,
      command: "plugins",
      content: (
        <Box flexDirection="column">
          {loaded.map((p) => (
            <StatusMessage key={p.name} variant="success">
              {p.label} ({p.name}) — {p.exposes.join(", ")}
            </StatusMessage>
          ))}
          <Text color="gray">{loaded.length} remote plugin(s) loaded</Text>
        </Box>
      ),
    },
  ];
}

export const App = ({ apiBase, mode }: AppProps) => {
  const { exit } = useApp();
  const [blocks, setBlocks] = useState<OutputBlock[]>(buildPluginBlocks);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");
  const [menuContext, setMenuContext] = useState<string | null>(null);
  const clustersRef = useRef<Cluster[]>([]);

  // Pre-fetch clusters for tab completion
  useEffect(() => {
    fetchClusters(apiBase)
      .then((data) => {
        clustersRef.current = data;
      })
      .catch(() => {});
  }, [apiBase]);

  // Build the prompt string
  const prompt = menuContext ? `${menuContext} > ` : "> ";

  // Compute suggestions based on current menu context
  const suggestions = useMemo(() => {
    const parts = input.split(/\s+/);
    const cmd = parts[0]?.toLowerCase() ?? "";
    const realParts = parts.filter((p) => p.length > 0);
    const realCount = realParts.length;

    if (menuContext) {
      // Inside a sub-menu — suggest sub-commands + "back"
      const subNames = getSubCommandNames(menuContext) ?? [];
      const allNames = [...subNames, "back", "help", "clear", "quit", "exit"];

      // First word in sub-menu
      if (realCount <= 1 && !input.endsWith(" ")) {
        return allNames.map((n) => n + " ");
      }

      // For config sub-commands that need a cluster arg
      if (menuContext === "config" && configNeedsClusterArg(cmd)) {
        return clustersRef.current.map((c) => `${cmd} ${c.id}`);
      }

      return [];
    }

    // Root level — same logic as before

    // 1) First word — suggest top-level commands
    if (realCount <= 1 && !input.endsWith(" ")) {
      return getCommandNames(clustersRef.current).map((n) => n + " ");
    }

    // 2) Group commands (user/config) — suggest sub-commands
    const subNames = getSubCommandNames(cmd);
    if (subNames) {
      if (realCount <= 1 || (realCount === 2 && !input.endsWith(" "))) {
        return subNames.map((s) => `${cmd} ${s} `);
      }

      if (cmd === "config" && realCount >= 2) {
        const sub = realParts[1]!.toLowerCase();
        if (configNeedsClusterArg(sub)) {
          return clustersRef.current.map((c) => `${cmd} ${sub} ${c.id}`);
        }
      }

      return [];
    }

    // 3) Top-level data/plugin commands that need a cluster arg
    if (needsClusterArg(cmd)) {
      const pluginKey = getPluginKeyForCommand(cmd);
      const eligible = pluginKey
        ? clustersRef.current.filter((c) => c.plugins?.includes(pluginKey))
        : clustersRef.current;
      return eligible.map((c) => `${cmd} ${c.id}`);
    }

    return [];
  }, [input, menuContext]);

  const handleSubmit = useCallback(
    async (value: string) => {
      setRunning(true);
      setInput("");

      const trimmed = value.trim().toLowerCase();

      // "back" exits the current sub-menu
      if (menuContext && trimmed === "back") {
        setMenuContext(null);
        setBlocks((prev) => [
          ...prev,
          {
            id: blockId++,
            command: value,
            content: <Text color="gray">Returned to main menu.</Text>,
          },
        ]);
        setRunning(false);
        return;
      }

      // Check if user is entering a sub-menu (only at root level)
      if (!menuContext && MENU_GROUPS.includes(trimmed)) {
        setMenuContext(trimmed);
        const subNames = getSubCommandNames(trimmed) ?? [];
        setBlocks((prev) => [
          ...prev,
          {
            id: blockId++,
            command: value,
            content: (
              <Box flexDirection="column">
                <Text bold color="cyan">
                  {trimmed} menu
                </Text>
                <Text color="gray">
                  Commands: {subNames.join(", ")}
                </Text>
                <Text color="gray">
                  Type &apos;back&apos; to return to the main menu.
                </Text>
              </Box>
            ),
          },
        ]);
        setRunning(false);
        return;
      }

      // Build the full command — prefix with menu context if inside a sub-menu
      const fullCommand = menuContext ? `${menuContext} ${value}` : value;

      // Auth check — "user" group and builtins are exempt
      const topCmd = fullCommand.split(/\s+/)[0]?.toLowerCase();
      const authExempt = ["user", "help", "clear", "quit", "exit"].includes(
        topCmd ?? "",
      );
      if (!authExempt) {
        const token = await getValidToken();
        if (!token) {
          setBlocks((prev) => [
            ...prev,
            {
              id: blockId++,
              command: menuContext ? `${menuContext} > ${value}` : value,
              content: (
                <StatusMessage variant="warning">
                  Session expired. Run &apos;user login&apos; to
                  re-authenticate.
                </StatusMessage>
              ),
            },
          ]);
          setRunning(false);
          return;
        }
      }

      try {
        const result = await runCommand(
          fullCommand,
          apiBase,
          clustersRef.current,
        );

        if (result === "exit") {
          exit();
          return;
        }

        if (result === "clear") {
          setBlocks([]);
          setRunning(false);
          return;
        }

        setBlocks((prev) => [
          ...prev,
          {
            id: blockId++,
            command: menuContext ? `${menuContext} > ${value}` : value,
            content: result,
          },
        ]);
      } catch (err) {
        setBlocks((prev) => [
          ...prev,
          {
            id: blockId++,
            command: menuContext ? `${menuContext} > ${value}` : value,
            content: (
              <StatusMessage variant="error">
                {err instanceof Error ? err.message : String(err)}
              </StatusMessage>
            ),
          },
        ]);
      }
      // Refresh cluster cache after each command
      fetchClusters(apiBase)
        .then((data) => {
          clustersRef.current = data;
        })
        .catch(() => {});
      setRunning(false);
    },
    [apiBase, exit, menuContext],
  );

  const frameProps = {
    blocks,
    running,
    handleSubmit,
    suggestions,
    onInputChange: setInput,
    prompt,
  };

  const Frame = mode === "fullscreen" ? FullScreenFrame : ScrollingFrame;

  return (
    <ThemeProvider theme={fleetshiftTheme}>
      <Frame {...frameProps} />
    </ThemeProvider>
  );
};

