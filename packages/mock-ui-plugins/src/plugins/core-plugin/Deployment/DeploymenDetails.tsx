import PaneBody from "../../../common/PaneBody";
import {
  DeploymentCondition,
  DeploymentModel,
  K8sResourceCommon,
  PodTemplate,
  Selector,
} from "../../../common/utils";
import { SectionHeading } from "../../../common/headings";
import { WorkloadPausedAlert } from "../../../common/WorkloadPause";
import PodRingSet from "../../../common/Pod/PodRingSet";
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import Status from "../../../common/Status";
import { ResourceSummary } from "../../../common/DetailsPage/ResourceSummary";
import { DeploymentDetailsList } from "./DeploymentDetailsList";
import { ContainerTable } from "../../../common/ContainerTable";
import { VolumesTable } from "../../../common/VolumesTable";
import { Conditions } from "../../../common/Conditions";

export type DeploymentKind = {
  spec: {
    minReadySeconds?: number;
    paused?: boolean;
    progressDeadlineSeconds?: number;
    replicas?: number;
    revisionHistoryLimit?: number;
    selector: Selector;
    strategy?: {
      rollingUpdate?: {
        maxSurge: number | string;
        maxUnavailable: number | string;
      };
      type?: string;
    };
    template: PodTemplate;
  };
  status?: {
    availableReplicas?: number;
    collisionCount?: number;
    conditions?: DeploymentCondition[];
    observedGeneration?: number;
    readyReplicas?: number;
    replicas?: number;
    unavailableReplicas?: number;
    updatedReplicas?: number;
  };
} & K8sResourceCommon;

type DeploymentDetailsProps = {
  obj: DeploymentKind;
};

export const DeploymentDetails = ({
  obj: deployment,
}: DeploymentDetailsProps) => {
  return (
    <>
      <PaneBody>
        <SectionHeading text={"Deployment details"} />
        {deployment.spec.paused && (
          <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />
        )}
        <PodRingSet
          key={deployment.metadata?.uid}
          obj={deployment}
          path="/spec/replicas"
        />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary
              resource={deployment}
              showPodSelector
              showNodeSelector
              showTolerations
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  {deployment.status?.availableReplicas ===
                    deployment.status?.updatedReplicas &&
                  deployment.spec.replicas ===
                    deployment.status?.availableReplicas ? (
                    <Status status="Up to date" />
                  ) : (
                    <Status status="Updating" />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DeploymentDetailsList deployment={deployment} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text="Containers" />
        <ContainerTable containers={deployment.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={deployment} heading="Volumes" />
      </PaneBody>
      <PaneBody>
        <SectionHeading text="Conditions" />
        <Conditions conditions={deployment.status?.conditions ?? []} />
      </PaneBody>
    </>
  );
};
