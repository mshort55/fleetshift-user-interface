import { ReactNode } from "react";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { useClusterScope } from "./ClusterScopeContext";

interface ClusterGateProps {
  children: ReactNode;
}

const ClusterGate = ({ children }: ClusterGateProps) => {
  const { clusterId } = useClusterScope();

  if (!clusterId) {
    return (
      <EmptyState
        titleText="Select a cluster"
        headingLevel="h4"
        icon={CubesIcon}
      >
        <EmptyStateBody>
          Use the cluster switcher in the masthead to select a specific cluster
          to view details.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return <>{children}</>;
};

export default ClusterGate;
