# Build System

The build system enables fine-grained PatternFly component sharing between the shell and plugins. Two complementary mechanisms work together: `getDynamicModules` registers individual PF components as Module Federation shared entries, and `createTransformer` rewrites barrel imports at compile time so the emitted code references those same dynamic paths.

## Architecture

```
Source code                    ts-loader + transformer           Module Federation
──────────                     ─────────────────────             ─────────────────

import { Button, Card }        import { Button }                 shared: {
  from "@patternfly/             from "@patternfly/                "…/dynamic/components/Button"
  react-core";                   react-core/dist/dynamic/          "…/dynamic/components/Card"
                                 components/Button";               ...
import { BarsIcon }            import { Card }                   }
  from "@patternfly/             from "@patternfly/                    ▲
  react-icons";                  react-core/dist/dynamic/              │
                                 components/Card";                getDynamicModules()
                               import { BarsIcon }                 scans node_modules
                                 from "@patternfly/                 for dist/dynamic/
                                 react-icons/dist/dynamic/          paths
                                 icons/bars";

        createTransformer()                                    registered in webpack
        rewrites AST at                                        shared config
        build time
```

## Key Concepts

### getDynamicModules

Scans `@patternfly/react-core` and `@patternfly/react-icons` under `node_modules` for `dist/dynamic/` subdirectories. Returns a flat object mapping each component path to its required version:

```typescript
const modules = getDynamicModules(__dirname, monorepoRoot);
// {
//   "@patternfly/react-core/dist/dynamic/components/Button": { requiredVersion: "^6.4.1" },
//   "@patternfly/react-core/dist/dynamic/components/Card": { requiredVersion: "^6.4.1" },
//   "@patternfly/react-icons/dist/dynamic/icons/bars": { requiredVersion: "^6.4.0" },
//   ... (100+ entries)
// }
```

These are spread into `ModuleFederationPlugin.shared` so shell and plugins share individual component instances instead of the entire PF library.

### createTransformer

A TypeScript AST transformer (forked from `@redhat-cloud-services/tsc-transform-imports`) that rewrites barrel imports at compile time. It matches imports from `@patternfly/react-core`, `@patternfly/react-icons`, and `@patternfly/react-tokens`.

**For react-core**, it resolves each named export to its `dist/dynamic/` path using a three-tier lookup:

1. **Module map** — reads `dist/dynamic-modules.json` if it exists
2. **Hardcoded table** — ~20 PF internals (`getResizeObserver`, `useOUIAProps`, `TreeViewDataItem`, etc.)
3. **Filesystem guess** — scans `dist/esm/` for matching filenames

**For react-icons**, it converts export names to kebab-case file paths:

```
BarsIcon  → @patternfly/react-icons/dist/dynamic/icons/bars
CogIcon   → @patternfly/react-icons/dist/dynamic/icons/cog
MoonIcon  → @patternfly/react-icons/dist/dynamic/icons/moon
```

A hardcoded `ICONS_NAME_FIX` map handles non-standard names (`AnsibeTowerIcon` → `ansibeTower-icon`).

### createTsLoaderRule

Convenience wrapper that creates a complete webpack rule wiring the transformer into ts-loader:

```typescript
const rule = createTsLoaderRule({ nodeModulesRoot });
// {
//   test: /\.(js|ts)x?$/,
//   exclude: /node_modules/,
//   use: {
//     loader: "ts-loader",
//     options: {
//       getCustomTransformers: () => ({ before: [transformer] }),
//     },
//   },
// }
```

No ts-patch needed — the transformer hooks directly into ts-loader's `getCustomTransformers` API.

### The quote-handling fork

The original `@redhat-cloud-services/tsc-transform-imports` only matched single-quoted import paths. The local fork matches both:

```typescript
// Regex uses ['"] character class
/@patternfly\/react-(core|icons|tokens)['"]$/

// Quote stripping handles both
moduleSpecifier.replace(/"/g, "").replace(/'/g, "");
```

This ensures the transformer works regardless of whether Prettier/ESLint formats imports with single or double quotes.

### Monorepo setup

The root `tsconfig.json` sets strict mode, ES2022 target/module, and a `@fleetshift/build-utils` path alias pointing to `packages/build-utils/src/index.ts` (no build step needed for the build-utils package).

Each package extends the root config. The GUI and mock-ui-plugins packages add `ts-node.compilerOptions.plugins: []` to prevent ts-patch from interfering when webpack configs are loaded.

ESLint uses flat config (`eslint.config.mjs`) with `@typescript-eslint` and Prettier. `@typescript-eslint/no-explicit-any` is disabled. Unused vars are allowed if prefixed with `_`.

## Key Files

| File | Purpose |
|------|---------|
| `packages/build-utils/src/index.ts` | Barrel export: `getDynamicModules`, `createTsLoaderRule`, `createTransformer` |
| `packages/build-utils/src/getDynamicModules.ts` | Scans PF `dist/dynamic/` for MF shared entries |
| `packages/build-utils/src/tsLoaderRule.ts` | Creates webpack rule with transformer wired in |
| `packages/build-utils/src/tsc-transform-imports/index.ts` | TS AST transformer (forked) |
| `tsconfig.json` | Root config: strict, ES2022, `@fleetshift/build-utils` path |
| `packages/gui/tsconfig.json` | Extends root, adds JSX transform, `ts-node` override |
| `packages/mock-ui-plugins/tsconfig.json` | Extends root, adds `ts-node` override |
| `eslint.config.mjs` | Flat ESLint config with TypeScript + Prettier |

## How It Works

1. Webpack config imports `getDynamicModules` and `createTsLoaderRule` from `@fleetshift/build-utils` (resolved via tsconfig path alias — no prior build step needed).

2. `getDynamicModules(__dirname, monorepoRoot)` scans the monorepo's `node_modules/@patternfly/` for dynamic paths. It validates PF is v5+ before proceeding.

3. The returned map is spread into `ModuleFederationPlugin.shared` alongside the fixed singletons (react, react-dom, etc.).

4. `createTsLoaderRule({ nodeModulesRoot })` creates a webpack rule that runs the AST transformer before ts-loader emits code.

5. When ts-loader processes a source file, the transformer visits each `ImportDeclaration` node. If the module specifier matches a PF package, it splits the barrel import into per-component imports targeting `dist/dynamic/` paths.

6. The emitted code now uses the same module paths that `getDynamicModules` registered as shared entries. MF recognizes these as shared modules and deduplicates them across shell and plugins at runtime.

## Gotchas

**Both systems must use the same `nodeModulesRoot`.** If `getDynamicModules` and `createTransformer` scan different `node_modules` directories, the registered shared entries won't match the rewritten import paths. In a monorepo, npm hoists PF packages to the root — always pass the monorepo root, not the package directory.

**Transformer only activates for ES modules.** The target must be `ES2015`, `ES2020`, `ES2022`, or `ESNext`. CommonJS outputs skip transformation entirely.

**Caching avoids redundant filesystem scans.** The transformer caches resolved component paths in memory. This is important because it runs on every file in the project.

**Icon name normalization is fragile.** CamelCase → kebab-case conversion works for most icons but a few need special-case handling via `ICONS_NAME_FIX`. New PF icons with unusual names may need additions to this map.

**`ts-node.compilerOptions.plugins: []`** in package tsconfigs is critical. Without it, ts-patch (if installed globally) can interfere with webpack config loading.
