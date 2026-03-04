import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScalprumProvider } from "@scalprum/react-core";
import { useScalprum } from "@scalprum/react-core";
import { initSharedScope } from "@scalprum/core";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { ClusterProvider, useClusters } from "./contexts/ClusterContext";
import { ScopeProvider } from "./contexts/ScopeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import {
  PluginRegistryProvider,
  usePluginRegistry,
} from "./contexts/PluginRegistryContext";
import { buildScalprumConfig } from "./utils/buildScalprumConfig";
import { Dashboard } from "./pages/Dashboard";
import { ClusterListPage } from "./pages/ClusterListPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { CanvasPageListPage } from "./pages/CanvasPageListPage";
import { CanvasPage } from "./pages/CanvasPage";

const API_BASE = "http://localhost:4000/api/v1";

const ScopeInitializer = ({ children }: PropsWithChildren) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    initSharedScope().then(() => {
      setLoading(false);
    });
  }, []);
  if (loading) return null;
  return <>{children}</>;
};

const PluginLoader = ({ children }: PropsWithChildren) => {
  const { pluginStore, config } = useScalprum();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const loads: Promise<void>[] = [];

    for (const entry of Object.values(config)) {
      if (entry.pluginManifest) {
        // Inline manifest — load directly into the plugin store
        loads.push(pluginStore.loadPlugin(entry.pluginManifest));
      } else if (entry.manifestLocation) {
        // URL manifest — fetch and load
        loads.push(pluginStore.loadPlugin(entry.manifestLocation));
      }
    }

    if (loads.length === 0) {
      setInitialLoad(false);
      return;
    }

    Promise.all(loads).then(() => setInitialLoad(false));
  }, [config, pluginStore]);

  if (initialLoad) return null;
  return <>{children}</>;
};

const ScalprumShell = ({ children }: PropsWithChildren) => {
  const { installed } = useClusters();
  const { registry } = usePluginRegistry();
  const config = useMemo(
    () => buildScalprumConfig(registry, installed),
    [registry, installed],
  );

  const installedRef = useRef(installed);
  installedRef.current = installed;

  // Notify plugins when cluster data changes
  const clusterListenersRef = useRef<Set<() => void>>(new Set());
  useEffect(() => {
    clusterListenersRef.current.forEach((fn) => fn());
  }, [installed]);

  const api = useMemo(
    () => ({
      fleetshift: {
        apiBase: API_BASE,
        getClusterIdsForPlugin: (pluginKey: string) =>
          installedRef.current
            .filter((c) => c.plugins.includes(pluginKey))
            .map((c) => c.id),
        onClustersChange: (fn: () => void) => {
          clusterListenersRef.current.add(fn);
          return () => {
            clusterListenersRef.current.delete(fn);
          };
        },
      },
    }),
    [],
  );

  return (
    <ScalprumProvider
      config={config}
      api={api}
      pluginSDKOptions={{
        pluginLoaderOptions: {
          transformPluginManifest: (manifest) => {
            // noo-op transfor to not use the default transform. That would append the `auto` prefix (our public path) to the loadScripts URLs
            const newManifest = { ...manifest };
            return newManifest;
          },
        },
      }}
    >
      <PluginLoader>{children}</PluginLoader>
    </ScalprumProvider>
  );
};

const AuthGate = ({ children }: PropsWithChildren) => {
  const { loading } = useAuth();
  if (loading) return null;
  return <>{children}</>;
};

export const App = () => (
  <ScopeInitializer>
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <PluginRegistryProvider>
            <ClusterProvider>
              <ScalprumShell>
                <ScopeProvider>
                  <UserPreferencesProvider>
                    <Routes>
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clusters" element={<ClusterListPage />} />
                        <Route
                          path="/navigation"
                          element={<MarketplacePage />}
                        />
                        <Route path="/pages" element={<CanvasPageListPage />} />
                        <Route path="/pages/:pageId" element={<CanvasPage />} />
                        <Route path="*" element={<CanvasPage />} />
                      </Route>
                    </Routes>
                  </UserPreferencesProvider>
                </ScopeProvider>
              </ScalprumShell>
            </ClusterProvider>
          </PluginRegistryProvider>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  </ScopeInitializer>
);
