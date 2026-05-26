import { PropsWithChildren } from "react";
import { useAppConfig } from "../../contexts/AppConfigContext";
import { PluginRegistryProvider } from "../../contexts/PluginRegistryContext";
import { ClusterProvider } from "../../contexts/ClusterContext";
import { ScopeProvider } from "../../contexts/ScopeContext";
import ScopeBridge from "./ScopeBridge";

const AppConfigBridge = ({ children }: PropsWithChildren) => {
  const { pluginEntries, assetsHost } = useAppConfig();

  return (
    <PluginRegistryProvider
      pluginEntries={pluginEntries}
      assetsHost={assetsHost}
    >
      <ClusterProvider>
        <ScopeProvider>
          <ScopeBridge />
          {children}
        </ScopeProvider>
      </ClusterProvider>
    </PluginRegistryProvider>
  );
};

export default AppConfigBridge;
