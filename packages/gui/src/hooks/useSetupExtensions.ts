import {
  LoadedAndResolvedExtension,
  useResolvedExtensions,
} from "@openshift/dynamic-plugin-sdk";
import { useMemo } from "react";
import {
  isSetupExtension,
  SetupExtension,
} from "../extensions/isSetupExtension";
import {
  resolveSetupExtensions,
  type ResolvedSetup,
} from "../utils/setupExtensions";

export function useSetupExtensions() {
  const [extensions, loaded] = useResolvedExtensions(isSetupExtension);
  const [authExtensions, nonAuthExtensions] = useMemo(
    () =>
      extensions.reduce<
        [
          LoadedAndResolvedExtension<SetupExtension>[],
          LoadedAndResolvedExtension<SetupExtension>[],
        ]
      >(
        (acc, ext) => {
          if (ext.properties.requiresAuth) {
            acc[0].push(ext);
          } else {
            acc[1].push(ext);
          }
          return acc;
        },
        [[], []],
      ),
    [extensions, loaded],
  );

  const authRoutes = useMemo<ResolvedSetup[]>(() => {
    if (!loaded) return [];
    return resolveSetupExtensions(authExtensions, extensions);
  }, [authExtensions, loaded]);

  const nonAuthRoutes = useMemo<ResolvedSetup[]>(() => {
    if (!loaded) return [];
    return resolveSetupExtensions(nonAuthExtensions, extensions);
  }, [nonAuthExtensions, loaded]);

  return { authRoutes, nonAuthRoutes, loaded };
}
