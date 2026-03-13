import {
  Grid,
  GridItem,
  Card,
  CardBody,
  Label,
  Title,
  Spinner,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { useClusters } from "../../contexts/ClusterContext";
import "./ClusterListPage.scss";

export const ClusterListPage = () => {
  const { installed, loading } = useClusters();

  if (loading) return <Spinner size="xl" />;

  return (
    <>
      <Title headingLevel="h1" className="cluster-list__title">
        Clusters
      </Title>
      <Grid hasGutter>
        {installed.map((cluster) => (
          <GridItem md={6} key={cluster.id}>
            <Card>
              <CardBody>
                <div className="cluster-card__header">
                  <div>
                    <div className="cluster-card__name">{cluster.name}</div>
                    <div className="cluster-card__subtitle">
                      Kubernetes Cluster
                    </div>
                  </div>
                  <Label color="green" icon={<CheckCircleIcon />} isCompact>
                    {cluster.status}
                  </Label>
                </div>

                <div className="cluster-card__meta">
                  <div>
                    <div className="cluster-card__meta-label">Version</div>
                    <div className="cluster-card__meta-value">
                      {cluster.version}
                    </div>
                  </div>
                  <div>
                    <div className="cluster-card__meta-label">Cluster ID</div>
                    <div className="cluster-card__meta-value">{cluster.id}</div>
                  </div>
                  <div>
                    <div className="cluster-card__meta-label">Plugins</div>
                    <div className="cluster-card__meta-value">
                      {cluster.plugins.length}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </>
  );
};
