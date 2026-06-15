import "./ExtensionEnablePage.scss";

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExclamationCircleIcon, OptimizeIcon } from "@patternfly/react-icons";
import { useCallback, useState } from "react";

import InstallProgress from "../components/InstallProgress/InstallProgress";

type Phase = "idle" | "installing" | "done" | "error";

interface ExtensionEnablePageProps {
  label: string;
  description: string;
  onInstall: () => void | Promise<void>;
}

export const ExtensionEnablePage = ({
  label,
  description,
  onInstall,
}: ExtensionEnablePageProps) => {
  const [phase, setPhase] = useState<Phase>("idle");

  const handleEnable = useCallback(() => {
    setPhase("installing");
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      await onInstall();
      setPhase("done");
    } catch (err) {
      console.error("Extension install failed:", err);
      setPhase("error");
    }
  }, [onInstall]);

  if (phase === "error") {
    return (
      <div className="ome-enable-page">
        <EmptyState
          icon={ExclamationCircleIcon}
          headingLevel="h2"
          titleText={`Failed to enable ${label}`}
          variant="lg"
          status="danger"
        >
          <EmptyStateBody>
            Something went wrong while enabling this extension. Please try
            again.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={() => setPhase("idle")}>
                Retry
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </div>
    );
  }

  if (phase === "installing") {
    return (
      <div className="ome-enable-page">
        <EmptyState
          icon={OptimizeIcon}
          headingLevel="h2"
          titleText={`Enabling ${label}...`}
          variant="lg"
        >
          <EmptyStateBody>
            <InstallProgress onComplete={handleComplete} />
          </EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="ome-enable-page">
      <EmptyState
        icon={OptimizeIcon}
        headingLevel="h2"
        titleText={`Enable ${label}`}
        variant="lg"
      >
        <EmptyStateBody>{description}</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="primary" onClick={handleEnable}>
              Enable
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </div>
  );
};
