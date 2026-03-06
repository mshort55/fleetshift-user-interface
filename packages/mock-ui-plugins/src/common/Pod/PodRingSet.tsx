/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { useMemo } from "react";
import { Split, SplitItem, Bullseye, Icon } from "@patternfly/react-core";
import { LongArrowAltRightIcon } from "@patternfly/react-icons/dist/esm/icons/long-arrow-alt-right-icon";
import { t_color_gray_50 as color200 } from "@patternfly/react-tokens";
import PodRing from "./PodRing";
import { K8sResourceKind, modelFor } from "../utils";
import { getPodData, usePodsWatcher } from "./utils";

export interface PodRingSetProps {
  obj: K8sResourceKind;
  path: string;
  impersonate?: string;
}

const PodRingSet = ({ obj, path }: PodRingSetProps) => {
  const { podData, loadError, loaded } = usePodsWatcher(obj);
  const resourceKind = modelFor(obj?.kind!);

  const deploymentData = useMemo(() => {
    return loaded && !loadError
      ? getPodData({ ...podData, obj })
      : { inProgressDeploymentData: null, completedDeploymentData: null };
  }, [loadError, loaded, podData, obj]);

  const current = podData?.current && podData?.current.obj;
  const previous = podData?.previous && podData?.previous.obj;
  const { inProgressDeploymentData, completedDeploymentData } = deploymentData;
  const progressRC = inProgressDeploymentData ? current : undefined;
  const completedRC =
    !!inProgressDeploymentData && completedDeploymentData ? previous : current;

  return loaded ? (
    <Split hasGutter>
      <SplitItem>
        <PodRing
          key={inProgressDeploymentData ? "deploy" : "notDeploy"}
          pods={completedDeploymentData ?? []}
          rc={podData?.isRollingOut ? completedRC : podData?.current?.obj}
          resourceKind={resourceKind}
          obj={obj}
          path={path}
          enableScaling={!podData?.isRollingOut}
        />
      </SplitItem>
      {inProgressDeploymentData && (
        <>
          <SplitItem>
            <Bullseye>
              <Icon size="xl">
                <LongArrowAltRightIcon color={color200.value} />
              </Icon>
            </Bullseye>
          </SplitItem>
          <SplitItem>
            <PodRing
              pods={inProgressDeploymentData}
              rc={progressRC}
              resourceKind={resourceKind}
              obj={obj}
              path={path}
              enableScaling={false}
            />
          </SplitItem>
        </>
      )}
    </Split>
  ) : (
    <div>Loading...</div>
  );
};

export default PodRingSet;
