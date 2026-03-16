import { useState, useEffect } from "react";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Grid,
  GridItem,
  Spinner,
} from "@patternfly/react-core";
import { useApiBase, fetchJson } from "./api";
import ClusterUpgradeCard from "./ClusterUpgradeCard";
import type { UpgradeInfo } from "./ClusterUpgradeCard";

interface UpgradeResponse {
  currentVersion: string;
  latestVersion: string;
  upToDate: boolean;
  availableUpdates: string[];
}

const UpgradesPage: React.FC<{ clusterIds: string[] }> = ({ clusterIds }) => {
  const apiBase = useApiBase();
  const [upgrades, setUpgrades] = useState<UpgradeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clusterIds.length === 0) {
      setUpgrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        fetchJson<UpgradeResponse>(`${apiBase}/clusters/${id}/upgrades`)
          .then((resp) => ({ clusterId: id, ...resp }))
          .catch(
            () =>
              ({
                clusterId: id,
                currentVersion: "unknown",
                latestVersion: "unknown",
                upToDate: true,
                availableUpdates: [],
              }) as UpgradeInfo,
          ),
      ),
    ).then((results) => {
      setUpgrades(results);
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  if (loading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (upgrades.length === 0) {
    return (
      <EmptyState titleText="No upgrade data available" headingLevel="h2">
        <EmptyStateBody>
          There is no upgrade information available for the selected clusters.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Grid hasGutter>
      {upgrades.map((upgrade) => (
        <GridItem key={upgrade.clusterId} span={6} md={4} lg={4}>
          <ClusterUpgradeCard upgrade={upgrade} />
        </GridItem>
      ))}
    </Grid>
  );
};

export default UpgradesPage;
