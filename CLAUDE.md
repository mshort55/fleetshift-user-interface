# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FleetShift User Interface — a monorepo containing the frontend GUI, a CLI tool, and mock servers.

## Architecture

npm workspaces monorepo with three packages under `packages/`:

- **`@fleetshift/gui`** — React 18 SPA bundled with Rspack. Uses React Router DOM v6, supports TS/CSS/SCSS.
- **`@fleetshift/cli`** — CLI tool (scaffolding only, no source yet).
- **`@fleetshift/mock-servers`** — Mock servers (scaffolding only, no source yet).

Shared TypeScript and ESLint/Prettier configs live at the root. Each package extends the root `tsconfig.json`.

## Commands

```bash
# GUI dev server (port 3000)
npm run dev --workspace=packages/gui

# GUI production build
npm run build --workspace=packages/gui

# Lint all packages
npm run lint

# Lint with auto-fix
npm run lint:fix
```

## Key Conventions

- React 18 (not 19) — uses `react-jsx` transform (no manual React imports needed)
- Rspack with `builtin:swc-loader` for TypeScript/TSX
- ESLint flat config (`eslint.config.mjs`) with `@typescript-eslint` and Prettier integration
- Prettier: double quotes, trailing commas
- TypeScript strict mode enabled globally

## Verification & Debugging

- **Do not run build/dev commands** to verify changes. Use the available MCP tools instead:
  - **LSP diagnostics** (`mcp__ide__getDiagnostics`) — check for TypeScript and lint errors without running a build.
  - **Browser MCP** (`mcp__browsermcp__browser_screenshot`, `mcp__browsermcp__browser_snapshot`) — visually verify the running app and inspect the DOM. The dev server is typically already running on port 3000.
- Only use `npm run build` or `npm run dev` when explicitly asked by the user.
