import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
} from "@patternfly/react-core";

interface UpgradeInfo {
  clusterId: string;
  currentVersion: string;
  latestVersion: string;
  upToDate: boolean;
  availableUpdates: string[];
}

interface ClusterUpgradeCardProps {
  upgrade: UpgradeInfo;
}

const ClusterUpgradeCard: React.FC<ClusterUpgradeCardProps> = ({ upgrade }) => {
  return (
    <Card isFullHeight>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster</DescriptionListTerm>
            <DescriptionListDescription>
              {upgrade.clusterId}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Current Version</DescriptionListTerm>
            <DescriptionListDescription>
              {upgrade.currentVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Latest Version</DescriptionListTerm>
            <DescriptionListDescription>
              {upgrade.latestVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Status</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color={upgrade.upToDate ? "green" : "orange"}>
                {upgrade.upToDate ? "Up to date" : "Update available"}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          {upgrade.availableUpdates.length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>Available Updates</DescriptionListTerm>
              <DescriptionListDescription>
                {upgrade.availableUpdates.map((version) => (
                  <Label key={version} style={{ marginRight: "4px" }}>
                    {version}
                  </Label>
                ))}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export type { UpgradeInfo };
export default ClusterUpgradeCard;
