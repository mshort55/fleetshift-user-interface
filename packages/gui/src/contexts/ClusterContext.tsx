import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  AvailableCluster,
  InstalledCluster,
  fetchAvailableClusters,
  fetchInstalledClusters,
} from "../utils/api";
import { useInvalidationSocket } from "../hooks/useInvalidationSocket";
import { useAuth } from "./AuthContext";

interface ClusterState {
  available: AvailableCluster[];
  installed: InstalledCluster[];
  loading: boolean;
}

type ClusterAction =
  | { type: "SET_LOADING" }
  | {
      type: "SET_DATA";
      available: AvailableCluster[];
      installed: InstalledCluster[];
    };

function reducer(state: ClusterState, action: ClusterAction): ClusterState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: true };
    case "SET_DATA":
      return {
        available: action.available,
        installed: action.installed,
        loading: false,
      };
  }
}

interface ClusterContextValue extends ClusterState {
  refresh: () => Promise<void>;
}

const ClusterContext = createContext<ClusterContextValue | null>(null);

export function ClusterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    available: [],
    installed: [],
    loading: true,
  });

  const refresh = useCallback(async () => {
    dispatch({ type: "SET_LOADING" });
    const [available, installed] = await Promise.all([
      fetchAvailableClusters(),
      fetchInstalledClusters(),
    ]);
    dispatch({ type: "SET_DATA", available, installed });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInvalidationSocket(user?.id, (resource) => {
    if (resource === "clusters") {
      refresh();
    }
  });

  return (
    <ClusterContext.Provider value={{ ...state, refresh }}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useClusters(): ClusterContextValue {
  const ctx = useContext(ClusterContext);
  if (!ctx)
    throw new Error("useClusters must be used within a ClusterProvider");
  return ctx;
}
