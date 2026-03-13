#!/usr/bin/env node
import meow from "meow";
import { render } from "ink";
import { App } from "./App";
import { SingleCommand } from "./components/SingleCommand.js";
import { ThemeProvider } from "@inkjs/ui";
import { fleetshiftTheme } from "./theme.js";
import { ENTER_ALT_SCREEN, LEAVE_ALT_SCREEN } from "./utils/fullscreen";
import { initPlugins } from "./plugins";
import { installFetchInterceptor } from "./auth/fetchInterceptor.js";
import { getValidToken } from "./auth/tokenStore.js";
import { performLogin } from "./auth/login.js";
import path from "path";

const cli = meow(
  `
  Usage
    $ fleetshift                        Interactive mode (scrolling)
    $ fleetshift --fullscreen           Interactive mode (fullscreen TUI)
    $ fleetshift <command> [args]       Run a single command and exit

  Menus
    user <command>                      login, logout, whoami
    config <command>                    clusters, install, uninstall, enable, disable

  Data Commands
    pods <cluster>                      List pods for a cluster
    nodes <cluster>                     List nodes for a cluster
    alerts <cluster>                    List alerts for a cluster
    deployments <cluster>               List deployments for a cluster

  Options
    -f, --fullscreen    Use fullscreen TUI mode
    --api-base          Mock server URL (default: http://localhost:4000/api/v1)
`,
  {
    importMeta: {
      url: import.meta.url,
      resolve: (p) => new URL(p, import.meta.url).pathname,
      dirname: path.dirname(new URL(import.meta.url).pathname),
      filename: path.basename(new URL(import.meta.url).pathname),
      main: import.meta.url === process.argv[1] || !import.meta.url, // Rough heuristic for "is this the main module?"
    },
    flags: {
      fullscreen: {
        type: "boolean",
        shortFlag: "f",
        default: false,
      },
      apiBase: {
        type: "string",
        default: "http://localhost:4000/api/v1",
      },
    },
  },
);

const { apiBase, fullscreen } = cli.flags;

// Inject Authorization header on API requests (token from OS keyring)
installFetchInterceptor(apiBase);

// "user" group commands work without authentication
const AUTH_EXEMPT_COMMANDS = ["user"];

const requestedCommand = cli.input[0]?.toLowerCase();
const isAuthExempt =
  requestedCommand !== undefined &&
  AUTH_EXEMPT_COMMANDS.includes(requestedCommand);

// Gate: require login before anything (except auth-exempt commands).
const isInteractive = cli.input.length === 0;

if (!isAuthExempt) {
  const token = await getValidToken();
  if (!token) {
    if (isInteractive) {
      // Interactive mode — auto-trigger login flow
      console.log("Not logged in. Opening browser to authenticate...");
      try {
        await performLogin();
      } catch (err) {
        console.error(
          "Login failed:",
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }
    } else {
      // Non-interactive single command — hard fail
      console.error(
        "Not logged in. Run 'fleetshift user login' to authenticate.",
      );
      process.exit(1);
    }
  }
}

// Discover and initialize CLI plugins from the server registry
// Skip for auth-exempt commands — they don't need plugins and the fetch would 401
if (!isAuthExempt) {
  await initPlugins(apiBase);
}

if (cli.input.length > 0) {
  // Non-interactive: run single command, print result, exit
  const input = cli.input.join(" ");
  render(
    <ThemeProvider theme={fleetshiftTheme}>
      <SingleCommand input={input} apiBase={apiBase} />
    </ThemeProvider>,
  );
} else if (fullscreen) {
  // Fullscreen TUI — enter alt screen before render, exit on quit
  process.stdout.write(ENTER_ALT_SCREEN);
  const instance = render(<App apiBase={apiBase} mode="fullscreen" />, {
    exitOnCtrlC: false,
  });
  instance.waitUntilExit().then(() => {
    process.stdout.write(LEAVE_ALT_SCREEN);
  });
} else {
  // Scrolling interactive mode
  render(<App apiBase={apiBase} mode="scrolling" />, {
    exitOnCtrlC: false,
  });
}
