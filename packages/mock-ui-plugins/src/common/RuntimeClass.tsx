import { DetailsItem } from "./DetailsPage/DetailsItem";
import { K8sResourceCommon } from "./utils";

export type RuntimeClassProps = {
  obj: K8sResourceCommon;
  path?: string;
};

export const RuntimeClass = ({ obj, path }: RuntimeClassProps) => {
  return (
    <DetailsItem
      label="Runtime class"
      obj={obj}
      path={path || "spec.template.spec.runtimeClassName"}
      hideEmpty
    />
  );
};
