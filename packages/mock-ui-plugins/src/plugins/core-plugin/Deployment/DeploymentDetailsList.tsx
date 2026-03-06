import { DescriptionList } from "@patternfly/react-core";
import { DetailsItem } from "../../../common/DetailsPage/DetailsItem";
import { DeploymentKind } from "./DeploymenDetails";
import { RuntimeClass } from "../../../common/RuntimeClass";
import { PodDisruptionBudgetField } from "../../../common/PodDisruptionBudgetField";
import { VerticalPodAutoscalerRecommendations } from "../../../common/VerticalPodAutoscalerRecommendations";

type DeploymentDetailsListProps = {
  deployment: DeploymentKind;
};

export const DeploymentDetailsList = ({
  deployment,
}: DeploymentDetailsListProps) => {
  return (
    <DescriptionList>
      <DetailsItem
        label="Update strategy"
        obj={deployment}
        path="spec.strategy.type"
      />
      {deployment.spec.strategy?.type === "RollingUpdate" && (
        <>
          <DetailsItem
            label="Max unavailable"
            obj={deployment}
            path="spec.strategy.rollingUpdate.maxUnavailable"
          >
            {`${deployment.spec.strategy?.rollingUpdate?.maxUnavailable ?? 1} of ${deployment.spec.replicas} pod`}
          </DetailsItem>
          <DetailsItem
            label="Max surge"
            obj={deployment}
            path="spec.strategy.rollingUpdate.maxSurge"
          >
            {`${deployment.spec.strategy?.rollingUpdate?.maxSurge ?? 1} greater than ${deployment.spec.replicas} pod`}
          </DetailsItem>
        </>
      )}
      <DetailsItem
        label="Progress deadline seconds"
        obj={deployment}
        path="spec.progressDeadlineSeconds"
      >
        {deployment.spec.progressDeadlineSeconds
          ? `${deployment.spec.progressDeadlineSeconds} second`
          : "Not configured"}
      </DetailsItem>
      <DetailsItem
        label="Min ready seconds"
        obj={deployment}
        path="spec.minReadySeconds"
      >
        {deployment.spec.minReadySeconds
          ? `${deployment.spec.minReadySeconds} second`
          : "Not configured"}
      </DetailsItem>
      <RuntimeClass obj={deployment} />
      <PodDisruptionBudgetField obj={deployment} />
      <VerticalPodAutoscalerRecommendations obj={deployment} />
    </DescriptionList>
  );
};
