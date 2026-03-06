import { K8sResourceKind, OwnerReference } from "./utils";
import * as _ from "lodash";

export const OwnerReferences = ({ resource }: OwnerReferencesProps) => {
  const owners = (_.get(resource.metadata, "ownerReferences") || []).map(
    (o: OwnerReference) => <a href="#">{o.name}</a>,
  );
  return owners.length ? (
    <>{owners}</>
  ) : (
    <span className="pf-v6-u-text-color-subtle">No owner</span>
  );
};

type OwnerReferencesProps = {
  resource: K8sResourceKind;
};
