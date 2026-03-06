/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { FC } from "react";
import { useState, useEffect } from "react";
import { Button, Split, SplitItem, Bullseye } from "@patternfly/react-core";
import { AngleDownIcon } from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import { AngleUpIcon } from "@patternfly/react-icons/dist/esm/icons/angle-up-icon";
import { AutomationIcon } from "@patternfly/react-icons/dist/esm/icons/automation-icon";
import * as _ from "lodash";
import PodStatus from "./PodStatus";
import "./PodRing.scss";
import {
  ExtPodKind,
  ImpersonateKind,
  K8sKind,
  k8sPatch,
  K8sResourceKind,
} from "../utils";
import {
  usePodRingLabel,
  usePodScalingAccessStatus,
  useRelatedHPA,
} from "./utils";

interface PodRingProps {
  pods: ExtPodKind[];
  obj: K8sResourceKind;
  rc?: K8sResourceKind;
  resourceKind: K8sKind;
  path?: string;
  impersonate?: ImpersonateKind;
  enableScaling?: boolean;
}

const PodRing: FC<PodRingProps> = ({
  pods,
  obj,
  resourceKind,
  path,
  impersonate,
  rc,
  enableScaling = true,
}) => {
  const [clickCount, setClickCount] = useState(obj.spec?.replicas);
  const isAccessScalingAllowed = usePodScalingAccessStatus(
    obj,
    resourceKind,
    pods,
    enableScaling,
    impersonate,
  );

  useEffect(() => {
    if (clickCount !== obj.spec?.replicas && obj.spec?.replicas) {
      setClickCount(obj.spec.replicas);
    }
  }, [obj.spec?.replicas]);

  const handleScaling = _.debounce(
    (operation: number) => {
      const patch = [{ op: "replace", path, value: operation }];
      const opts = { path: "scale" };
      const promise: Promise<K8sResourceKind> = k8sPatch(
        resourceKind,
        obj,
        patch as any,
        opts,
      );
      promise.catch((error) => {
        throw error;
      });
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  );

  const handleClick = (operation: number) => {
    setClickCount(clickCount + operation);
    handleScaling(clickCount + operation);
  };

  const {
    apiVersion,
    kind,
    // @ts-ignore
    metadata: { name, namespace },
  } = obj;
  const [hpa] = useRelatedHPA(apiVersion!, kind!, name, namespace);
  const hpaControlledScaling = !!hpa;

  const isScalingAllowed = isAccessScalingAllowed && !hpaControlledScaling;

  const enableAutoscaling = !isScalingAllowed && clickCount === 0;
  const resourceObj = rc || obj;
  const { title, subTitle, titleComponent } = usePodRingLabel(
    resourceObj,
    pods,
    hpaControlledScaling,
    hpa,
  );

  return (
    <Split>
      <SplitItem>
        <div className="odc-pod-ring">
          <PodStatus
            standalone
            data={pods}
            subTitle={subTitle}
            title={title}
            titleComponent={titleComponent}
          />
        </div>
      </SplitItem>
      {enableAutoscaling && (
        <SplitItem className="pf-v6-u-display-flex pf-v6-u-align-content-center">
          <Button
            type="button"
            variant="link"
            data-test="enable-autoscale"
            icon={<AutomationIcon />}
            onClick={() => handleClick(1)}
          >
            Enable Autoscale
          </Button>
        </SplitItem>
      )}
      {isScalingAllowed && (
        <SplitItem>
          <Bullseye>
            <div>
              <Button
                icon={<AngleUpIcon style={{ fontSize: "20" }} />}
                type="button"
                variant="plain"
                aria-label="Increase the Pod count"
                title="Increase the Pod count"
                onClick={() => handleClick(1)}
                isBlock
              />
              <Button
                icon={<AngleDownIcon style={{ fontSize: "20" }} />}
                type="button"
                variant="plain"
                aria-label="Decrease the Pod count"
                title="Decrease the Pod count"
                onClick={() => handleClick(-1)}
                isBlock
                isDisabled={clickCount <= 0}
              />
            </div>
          </Bullseye>
        </SplitItem>
      )}
    </Split>
  );
};

export default PodRing;
