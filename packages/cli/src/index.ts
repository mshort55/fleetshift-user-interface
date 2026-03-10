// Async boundary for Module Federation shared scope initialization.
// All app code lives in cli.tsx — this dynamic import ensures MF
// initializes shared modules before any are consumed.
// @ts-ignore cli.tsx is a script, not a module
import("./cli.js");
