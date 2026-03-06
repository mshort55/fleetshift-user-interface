import type { FC } from "react";
import * as _ from "lodash";
import { PodDisruptionBudgetKind } from "./utils";

const AvailabilityRequirement: FC<AvailabilityRequirementProps> = ({
  pdb,
  replicas,
}) => {
  return (
    <>
      {!_.isNil(pdb?.spec?.minAvailable)
        ? `Min available ${pdb.spec.minAvailable} of ${replicas} pod`
        : `Max unavailable ${pdb?.spec?.maxUnavailable} of ${replicas} pod`}
    </>
  );
};

type AvailabilityRequirementProps = {
  pdb: PodDisruptionBudgetKind;
  replicas: number;
};

export default AvailabilityRequirement;
