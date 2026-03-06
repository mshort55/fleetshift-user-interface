import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useScalprum } from "@scalprum/react-core";

interface FleetShiftApi {
  fleetshift: {
    apiBase: string;
    getScope: () => string;
    onScopeChange: (fn: () => void) => () => void;
  };
}

interface ClusterScopeValue {
  /** The selected cluster ID, or null when in "all clusters" mode. */
  clusterId: string | null;
  /** Base URL for mock server API requests. */
  apiBase: string;
}

const ClusterScopeContext = createContext<ClusterScopeValue | null>(null);

export function ClusterScopeProvider({ children }: { children: ReactNode }) {
  const { api } = useScalprum<{ api: FleetShiftApi }>();
  const { getScope, onScopeChange, apiBase } = api.fleetshift;

  const [scope, setScope] = useState(getScope);

  useEffect(() => {
    // Sync on mount in case scope changed between render and effect
    setScope(getScope());
    return onScopeChange(() => setScope(getScope()));
  }, [getScope, onScopeChange]);

  const clusterId = scope === "all" ? null : scope;

  return (
    <ClusterScopeContext.Provider value={{ clusterId, apiBase }}>
      {children}
    </ClusterScopeContext.Provider>
  );
}

export function useClusterScope(): ClusterScopeValue {
  const ctx = useContext(ClusterScopeContext);
  if (!ctx)
    throw new Error(
      "useClusterScope must be used within a ClusterScopeProvider",
    );
  return ctx;
}
