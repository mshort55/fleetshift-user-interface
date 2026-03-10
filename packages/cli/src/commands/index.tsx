import { Box, Text } from "ink";
import type { Command, CommandResult } from "./types.js";
import { clusters } from "./clusters.js";
import { pods } from "./pods.js";
import { nodes } from "./nodes.js";
import { alerts } from "./alerts.js";
import { deployments } from "./deployments.js";
import { install } from "./install.js";
import { uninstall } from "./uninstall.js";
import { enable } from "./enable.js";
import { disable } from "./disable.js";
import { getPluginCommands } from "../plugins.js";

export type { CommandResult } from "./types.js";

const builtinCommands: Command[] = [
  clusters,
  install,
  uninstall,
  enable,
  disable,
  pods,
  nodes,
  alerts,
  deployments,
];

function getAllCommands(): Command[] {
  return [...builtinCommands, ...getPluginCommands().map((pc) => pc.command)];
}

function getCommandMap(): Map<string, Command> {
  const map = new Map<string, Command>();
  for (const cmd of getAllCommands()) {
    map.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) {
      map.set(alias, cmd);
    }
  }
  return map;
}

function buildHelp(): CommandResult {
  return (
    <Box flexDirection="column">
      <Text bold>Available commands:</Text>
      <Text> </Text>
      {getAllCommands().map((cmd) => (
        <Box key={cmd.name}>
          <Box width={24}>
            <Text color="white">{cmd.usage ?? cmd.name}</Text>
          </Box>
          <Text color="white">{cmd.description}</Text>
        </Box>
      ))}
      <Box>
        <Box width={24}>
          <Text color="white">help</Text>
        </Box>
        <Text color="white">Show this help</Text>
      </Box>
      <Box>
        <Box width={24}>
          <Text color="white">clear</Text>
        </Box>
        <Text color="white">Clear output</Text>
      </Box>
      <Box>
        <Box width={24}>
          <Text color="white">quit / exit</Text>
        </Box>
        <Text color="white">Exit the CLI</Text>
      </Box>
      <Text> </Text>
      <Text dimColor>
        Cluster names are matched by prefix (e.g. &apos;pods us&apos; matches
        &apos;US East Production&apos;).
      </Text>
    </Box>
  );
}

/** All top-level command names + aliases + builtins for tab completion. */
export function getCommandNames(): string[] {
  const names = getAllCommands().flatMap((c) => [c.name, ...(c.aliases ?? [])]);
  names.push("help", "clear", "quit", "exit");
  return names;
}

/** Commands that accept a cluster argument (for second-word completion). */
export function needsClusterArg(cmd: string): boolean {
  const c = getCommandMap().get(cmd);
  return !!c?.usage?.includes("<cluster>");
}

/** If cmd is a plugin command, return its required plugin key; otherwise undefined. */
export function getPluginKeyForCommand(cmd: string): string | undefined {
  const pc = getPluginCommands().find(
    (p) => p.command.name === cmd || p.command.aliases?.includes(cmd),
  );
  return pc?.pluginKey;
}

export async function runCommand(
  input: string,
  apiBase: string,
): Promise<CommandResult | "clear" | "exit"> {
  const parts = input.split(/\s+/);
  const name = parts[0]!.toLowerCase();
  const arg = parts.slice(1).join(" ");

  if (name === "help") return buildHelp();
  if (name === "clear") return "clear";
  if (name === "quit" || name === "exit") return "exit";

  const cmd = getCommandMap().get(name);
  if (!cmd) {
    return (
      <Text color="yellow">
        Unknown command: {name}. Type &apos;help&apos; for available commands.
      </Text>
    );
  }

  return cmd.run({ apiBase, arg });
}
