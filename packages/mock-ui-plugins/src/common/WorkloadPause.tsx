import { Alert, AlertActionLink } from "@patternfly/react-core";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WorkloadPausedAlert = ({ model, obj }: any) => {
  return (
    <Alert
      isInline
      className="co-alert"
      variant="info"
      title={`${obj.metadata.name} is paused`}
      actionLinks={
        <AlertActionLink
          onClick={() =>
            window.alert("Dummy alert for resuming workload rollouts/updates")
          }
        >
          {obj.kind === "MachineConfigPool"
            ? "Resume updates"
            : "Resume rollouts"}
        </AlertActionLink>
      }
    >
      This will stop any new rollouts or triggers from running until resumed.
    </Alert>
  );
};
