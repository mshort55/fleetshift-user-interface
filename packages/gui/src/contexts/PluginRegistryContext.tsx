import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { PluginManifest } from "@openshift/dynamic-plugin-sdk";

export interface PluginEntry {
  name: string;
  key: string;
  label: string;
  persona: "ops" | "dev";
  pluginManifest: PluginManifest;
}

export interface PluginRegistry {
  assetsHost: string;
  plugins: Record<string, PluginEntry>;
}

interface PluginRegistryContextValue {
  registry: PluginRegistry;
  pluginEntries: PluginEntry[];
}

const PluginRegistryContext = createContext<PluginRegistryContextValue | null>(
  null,
);

const API_BASE = "http://localhost:4000/api/v1";

export function PluginRegistryProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<PluginRegistry | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/plugin-registry`)
      .then((res) => res.json())
      .then((data: PluginRegistry) => setRegistry(data));
  }, []);

  if (!registry) return null;

  const pluginEntries = Object.values(registry.plugins);

  return (
    <PluginRegistryContext.Provider value={{ registry, pluginEntries }}>
      {children}
    </PluginRegistryContext.Provider>
  );
}

export function usePluginRegistry(): PluginRegistryContextValue {
  const ctx = useContext(PluginRegistryContext);
  if (!ctx)
    throw new Error(
      "usePluginRegistry must be used within a PluginRegistryProvider",
    );
  return ctx;
}
