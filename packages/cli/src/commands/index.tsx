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
import { login, logout, whoami } from "./login.js";
import { getPluginCommands, getAllPluginCommands } from "../plugins.js";

export type { CommandResult } from "./types.js";

// ── Command groups ──────────────────────────────────────────────────────

const userCommands: Command[] = [login, logout, whoami];

const configCommands: Command[] = [
  clusters,
  install,
  uninstall,
  enable,
  disable,
];

/** Data / query commands that live at the top level. */
const dataCommands: Command[] = [pods, nodes, alerts, deployments];

// ── Sub-menu helpers ────────────────────────────────────────────────────

function buildGroupHelp(groupName: string, commands: Command[]): CommandResult {
  return (
    <Box flexDirection="column">
      <Text bold>{groupName} commands:</Text>
      <Text> </Text>
      {commands.map((cmd) => (
        <Box key={cmd.name}>
          <Box width={28}>
            <Text>
              {groupName} {cmd.usage ?? cmd.name}
            </Text>
          </Box>
          <Text>{cmd.description}</Text>
        </Box>
      ))}
    </Box>
  );
}

function createGroupCommand(
  name: string,
  description: string,
  subCommands: Command[],
): Command {
  const subMap = new Map<string, Command>();
  for (const cmd of subCommands) {
    subMap.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) {
      subMap.set(alias, cmd);
    }
  }

  return {
    name,
    description,
    usage: `${name} <command>`,
    async run({ apiBase, arg }) {
      const parts = arg.split(/\s+/);
      const subName = parts[0]?.toLowerCase();
      const subArg = parts.slice(1).join(" ");

      if (!subName) {
        return buildGroupHelp(name, subCommands);
      }

      const sub = subMap.get(subName);
      if (!sub) {
        return (
          <Box flexDirection="column">
            <Text color="yellow">
              Unknown {name} command: {subName}
            </Text>
            <Text> </Text>
            {buildGroupHelp(name, subCommands)}
          </Box>
        );
      }

      return sub.run({ apiBase, arg: subArg });
    },
  };
}

const userGroup = createGroupCommand(
  "user",
  "Authentication & user info (login, logout, whoami)",
  userCommands,
);

const configGroup = createGroupCommand(
  "config",
  "Cluster management (clusters, install, uninstall, enable, disable)",
  configCommands,
);

// ── Top-level command list ──────────────────────────────────────────────

/** Commands visible at the top level (groups + data commands). */
const topLevelBuiltins: Command[] = [userGroup, configGroup, ...dataCommands];

function getAllCommands(clusterList: Array<{ plugins?: string[] }>): Command[] {
  return [
    ...topLevelBuiltins,
    ...getPluginCommands(clusterList).map((pc) => pc.command),
  ];
}

function getCommandMap(
  clusterList: Array<{ plugins?: string[] }>,
): Map<string, Command> {
  const map = new Map<string, Command>();
  for (const cmd of getAllCommands(clusterList)) {
    map.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) {
      map.set(alias, cmd);
    }
  }
  return map;
}

function buildHelp(clusterList: Array<{ plugins?: string[] }>): CommandResult {
  const pluginCmds = getPluginCommands(clusterList).map((pc) => pc.command);

  return (
    <Box flexDirection="column">
      <Text bold>Available commands:</Text>
      <Text> </Text>

      <Text bold color="cyan">
        Menus
      </Text>
      <Box>
        <Box width={28}>
          <Text>user &lt;command&gt;</Text>
        </Box>
        <Text>{userGroup.description}</Text>
      </Box>
      <Box>
        <Box width={28}>
          <Text>config &lt;command&gt;</Text>
        </Box>
        <Text>{configGroup.description}</Text>
      </Box>
      <Text> </Text>

      <Text bold color="cyan">
        Data
      </Text>
      {dataCommands.map((cmd) => (
        <Box key={cmd.name}>
          <Box width={28}>
            <Text>{cmd.usage ?? cmd.name}</Text>
          </Box>
          <Text>{cmd.description}</Text>
        </Box>
      ))}
      {pluginCmds.length > 0 && (
        <>
          <Text> </Text>
          <Text bold color="cyan">
            Plugins
          </Text>
          {pluginCmds.map((cmd) => (
            <Box key={cmd.name}>
              <Box width={28}>
                <Text>{cmd.usage ?? cmd.name}</Text>
              </Box>
              <Text>{cmd.description}</Text>
            </Box>
          ))}
        </>
      )}
      <Text> </Text>

      <Box>
        <Box width={28}>
          <Text>help</Text>
        </Box>
        <Text>Show this help</Text>
      </Box>
      <Box>
        <Box width={28}>
          <Text>clear</Text>
        </Box>
        <Text>Clear output</Text>
      </Box>
      <Box>
        <Box width={28}>
          <Text>quit / exit</Text>
        </Box>
        <Text>Exit the CLI</Text>
      </Box>
      <Text> </Text>
      <Text color="gray">
        Cluster names are matched by prefix (e.g. &apos;pods us&apos; matches
        &apos;US East Production&apos;).
      </Text>
    </Box>
  );
}

// ── Public API ───────────────────────────────────────────────────────────

/** All top-level command names + aliases + builtins for tab completion. */
export function getCommandNames(
  clusterList: Array<{ plugins?: string[] }>,
): string[] {
  const names = getAllCommands(clusterList).flatMap((c) => [
    c.name,
    ...(c.aliases ?? []),
  ]);
  names.push("help", "clear", "quit", "exit");
  return names;
}

/** Sub-command names for a group command (e.g. "user" → ["login", "logout", "whoami"]). */
const groupSubCommands: Record<string, Command[]> = {
  user: userCommands,
  config: configCommands,
};

export function getSubCommandNames(group: string): string[] | null {
  const cmds = groupSubCommands[group];
  if (!cmds) return null;
  return cmds.flatMap((c) => [c.name, ...(c.aliases ?? [])]);
}

/** Does a config sub-command need a cluster arg? (for third-word completion) */
export function configNeedsClusterArg(sub: string): boolean {
  const cmd = configCommands.find(
    (c) => c.name === sub || c.aliases?.includes(sub),
  );
  return !!cmd?.usage?.includes("<cluster>");
}

/** Commands that accept a cluster argument (for second-word completion). */
export function needsClusterArg(cmd: string): boolean {
  // Check data commands
  const data = dataCommands.find(
    (c) => c.name === cmd || c.aliases?.includes(cmd),
  );
  if (data) return !!data.usage?.includes("<cluster>");
  // Check all plugin commands (unfiltered — we just need the usage shape)
  const pc = getAllPluginCommands().find(
    (p) => p.command.name === cmd || p.command.aliases?.includes(cmd),
  );
  return !!pc?.command.usage?.includes("<cluster>");
}

/** If cmd is a plugin command, return its required plugin key; otherwise undefined. */
export function getPluginKeyForCommand(cmd: string): string | undefined {
  const pc = getAllPluginCommands().find(
    (p) => p.command.name === cmd || p.command.aliases?.includes(cmd),
  );
  return pc?.pluginKey;
}

export async function runCommand(
  input: string,
  apiBase: string,
  clusterList: Array<{ plugins?: string[] }>,
): Promise<CommandResult | "clear" | "exit"> {
  const parts = input.split(/\s+/);
  const name = parts[0]!.toLowerCase();
  const arg = parts.slice(1).join(" ");

  if (name === "help") return buildHelp(clusterList);
  if (name === "clear") return "clear";
  if (name === "quit" || name === "exit") return "exit";

  const cmd = getCommandMap(clusterList).get(name);
  if (!cmd) {
    return (
      <Text color="yellow">
        Unknown command: {name}. Type &apos;help&apos; for available commands.
      </Text>
    );
  }

  return cmd.run({ apiBase, arg });
}
