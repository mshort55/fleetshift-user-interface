import { useScalprum } from "@scalprum/react-core";
import { useEffect, useRef, useState } from "react";

interface FleetShiftApi {
  fleetshift: {
    apiBase: string;
    getClusterIdsForPlugin: (pluginKey: string) => string[];
    onClustersChange: (fn: () => void) => () => void;
    getScope: () => string;
    onScopeChange: (fn: () => void) => () => void;
  };
}

export function useApiBase(): string {
  const { api } = useScalprum<{ api: FleetShiftApi }>();
  return api.fleetshift.apiBase;
}

export function useClusterIds(): string[] {
  const { api } = useScalprum<{ api: FleetShiftApi }>();
  const [ids, setIds] = useState<string[]>(() =>
    api.fleetshift.getClusterIdsForPlugin("upgrades"),
  );
  const apiRef = useRef(api);
  apiRef.current = api;

  useEffect(() => {
    const refresh = () =>
      setIds(apiRef.current.fleetshift.getClusterIdsForPlugin("upgrades"));
    const unsub1 = api.fleetshift.onClustersChange(refresh);
    const unsub2 = api.fleetshift.onScopeChange(refresh);
    refresh();
    return () => {
      unsub1();
      unsub2();
    };
  }, [api]);

  return ids;
}

export function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) =>
    r.ok ? r.json() : Promise.reject(r.statusText),
  );
}
