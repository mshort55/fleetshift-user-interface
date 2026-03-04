import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionToggle,
  Switch,
  Title,
  Button,
  Label,
  Flex,
  FlexItem,
  Divider,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { useClusters } from "../../contexts/ClusterContext";
import { usePluginRegistry } from "../../contexts/PluginRegistryContext";
import "./ClusterDrawerContent.scss";

export const ClusterManagerDrawerContent = () => {
  const { available, installed, install, togglePlugin, uninstall } =
    useClusters();
  const { pluginEntries } = usePluginRegistry();
  const opsPlugins = pluginEntries.filter((p) => p.persona === "ops");
  const devPlugins = pluginEntries.filter((p) => p.persona === "dev");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const installedIds = new Set(installed.map((c) => c.id));

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="cluster-drawer">
      <Title headingLevel="h2" size="lg" className="cluster-drawer__title">
        Cluster Manager
      </Title>

      <Accordion isBordered>
        {available.map((cluster) => {
          const isInstalled = installedIds.has(cluster.id);
          const installedCluster = installed.find((c) => c.id === cluster.id);

          return (
            <AccordionItem
              key={cluster.id}
              isExpanded={expanded[cluster.id] ?? false}
            >
              <AccordionToggle
                id={`cluster-${cluster.id}`}
                onClick={() => toggle(cluster.id)}
              >
                <Flex
                  spaceItems={{ default: "spaceItemsSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>{cluster.name}</FlexItem>
                  <FlexItem>
                    {isInstalled ? (
                      <Label color="green" icon={<CheckCircleIcon />} isCompact>
                        Installed
                      </Label>
                    ) : (
                      <Label color="grey" isCompact>
                        Available
                      </Label>
                    )}
                  </FlexItem>
                </Flex>
              </AccordionToggle>
              <AccordionContent>
                <div className="cluster-drawer__version">
                  Version {cluster.version}
                </div>

                {isInstalled && installedCluster ? (
                  <>
                    <div className="cluster-drawer__section-title">
                      Ops Plugins
                    </div>
                    <div className="cluster-drawer__plugins">
                      {opsPlugins.map((p) => (
                        <Switch
                          key={p.key}
                          id={`${cluster.id}-plugin-${p.key}`}
                          label={p.label}
                          isChecked={installedCluster.plugins.includes(p.key)}
                          onChange={() => togglePlugin(cluster.id, p.key)}
                        />
                      ))}
                    </div>

                    <div className="cluster-drawer__section-title">
                      Dev Plugins
                    </div>
                    <div className="cluster-drawer__plugins">
                      {devPlugins.map((p) => (
                        <Switch
                          key={p.key}
                          id={`${cluster.id}-plugin-${p.key}`}
                          label={p.label}
                          isChecked={installedCluster.plugins.includes(p.key)}
                          onChange={() => togglePlugin(cluster.id, p.key)}
                        />
                      ))}
                    </div>

                    <Divider />

                    <div className="cluster-drawer__actions">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => uninstall(cluster.id)}
                      >
                        Uninstall
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => install(cluster.id)}
                  >
                    Install
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
