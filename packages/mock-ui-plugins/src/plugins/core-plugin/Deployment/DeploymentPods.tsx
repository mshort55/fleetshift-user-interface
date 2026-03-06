import PaneBody from "../../../common/PaneBody";
import { useClusterScope } from "../../../common/ClusterScopeContext";
import PodList from "../PodList";
import { DeploymentKind } from "./DeploymenDetails";

type DeploymentPodsProps = {
  obj: DeploymentKind;
};

const DeploymentPods = ({ obj: deployment }: DeploymentPodsProps) => {
  const { clusterId } = useClusterScope();
  const namespace = deployment.metadata?.namespace;

  if (!clusterId) return null;

  return (
    <PaneBody>
      <PodList clusterIds={[clusterId]} namespace={namespace} />
    </PaneBody>
  );
};

export default DeploymentPods;
