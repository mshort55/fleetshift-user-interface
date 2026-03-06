import type { FC } from "react";
import {
  getPDBResource,
  K8sPodControllerKind,
  PodDisruptionBudgetKind,
  PodDisruptionBudgetModel,
  PodKind,
} from "./utils";
import { DetailsItem } from "./DetailsPage/DetailsItem";
import AvailabilityRequirement from "./AvailabilityRequirement";
import { useK8sWatchResource } from "./Pod/utils";

export const PodDisruptionBudgetField: FC<PodDisruptionBudgetFieldProps> = ({
  obj,
}) => {
  const [pdbResources] = useK8sWatchResource<PodDisruptionBudgetKind[]>({
    groupVersionKind: {
      group: PodDisruptionBudgetModel.apiGroup,
      kind: PodDisruptionBudgetModel.kind,
      version: PodDisruptionBudgetModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace: obj.metadata?.namespace,
  });
  const pdb = getPDBResource(pdbResources, obj);
  const { replicas } = obj.spec ?? {};
  const pdbDescription = "Pod description";

  return (
    <DetailsItem label="PodDisruptionBudget" description={pdbDescription}>
      {pdb ? (
        <>
          <a href="#">{pdb.metadata?.name ?? "Fake link"}</a>
          {replicas && (
            <AvailabilityRequirement pdb={pdb} replicas={replicas} />
          )}
        </>
      ) : (
        "No PodDisruptionBudget"
      )}
    </DetailsItem>
  );
};

type PodDisruptionBudgetFieldProps = {
  obj: K8sPodControllerKind | PodKind;
};
