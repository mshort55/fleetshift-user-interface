import { useState, useEffect } from "react";
import { useScalprum } from "@scalprum/react-core";
import type { ModuleRef } from "../../utils/extensions";

interface ManifestExtension {
  type: string;
  properties: Record<string, unknown>;
}

/** Discover all available modules by fetching plugin manifests */
export function useAvailableModules(): ModuleRef[] {
  const { config } = useScalprum();
  const [modules, setModules] = useState<ModuleRef[]>([]);

  useEffect(() => {
    const pluginNames = Object.keys(config);
    if (pluginNames.length === 0) return;

    Promise.all(
      pluginNames.map(async (pluginName) => {
        const entry = config[pluginName];

        let extensions: ManifestExtension[];
        if (entry?.pluginManifest) {
          extensions = entry.pluginManifest.extensions as ManifestExtension[];
        } else if (entry?.manifestLocation) {
          try {
            const res = await fetch(entry.manifestLocation);
            const manifest = await res.json();
            extensions = manifest.extensions as ManifestExtension[];
          } catch {
            return [];
          }
        } else {
          return [];
        }

        const refs: ModuleRef[] = [];
        for (const ext of extensions) {
          const codeRef = (ext.properties?.component as Record<string, unknown>)
            ?.$codeRef as string | undefined;
          if (codeRef) {
            const moduleName = codeRef.split(".")[0];
            const label = (ext.properties?.label as string) || moduleName;
            refs.push({
              scope: pluginName,
              module: moduleName,
              label,
            });
          }
        }
        return refs;
      }),
    ).then((results) => setModules(results.flat()));
  }, [config]);

  return modules;
}
