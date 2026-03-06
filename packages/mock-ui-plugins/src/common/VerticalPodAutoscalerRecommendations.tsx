import type { FC } from "react";
import { Fragment } from "react";
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";
import { getVerticalPodAutoscalersForResource, K8sResourceKind } from "./utils";
import { useK8sWatchResource } from "./Pod/utils";

/** Stub for i18n — returns the key as-is. */
const t = (key: string) => key;

const Recommendations: FC<VerticalPodAutoscalerRecommendationsProps> = ({
  obj,
}) => {
  const recommendations =
    obj?.status?.recommendation?.containerRecommendations ?? [];
  return (
    <>
      {recommendations.length > 0 && <p>Recommended</p>}
      {recommendations.map((recommendation: any) => (
        <Fragment key={recommendation.containerName}>
          <div>Container name: {recommendation.containerName}</div>
          <div>CPU: {recommendation.target.cpu}</div>
          <div>Memory: {recommendation.target.memory}</div>
        </Fragment>
      ))}
    </>
  );
};

export const VerticalPodAutoscalerRecommendations: FC<
  VerticalPodAutoscalerRecommendationsProps
> = ({ obj }) => {
  // The use watch k8s resource can be some hook that does api polling to the mock server
  const [vpas] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: {
      group: "autoscaling.k8s.io",
      version: "v1",
      kind: "VerticalPodAutoscaler",
    },
    namespace: obj?.metadata?.namespace,
    isList: true,
    namespaced: true,
  });

  const verticalPodAutoscalers = getVerticalPodAutoscalersForResource(
    vpas,
    obj,
  );

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        {t("console-app~VerticalPodAutoscalers")}
      </DescriptionListTerm>
      <DescriptionListDescription>
        {verticalPodAutoscalers.length > 0
          ? verticalPodAutoscalers.map((vpa) => (
              <>
                <p>
                  <a href="#">{vpa.metadata?.name ?? "Fake link"}</a>
                </p>
                <Recommendations obj={vpa} />
              </>
            ))
          : "No VerticalPodAutoscalers"}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

type VerticalPodAutoscalerRecommendationsProps = {
  obj: K8sResourceKind;
};
