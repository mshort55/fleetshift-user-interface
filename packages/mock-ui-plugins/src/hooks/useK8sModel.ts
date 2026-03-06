import {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
  modelFor,
} from "../common/utils";

export type UseK8sModel = (
  groupVersionKind?: K8sResourceKindReference | K8sGroupVersionKind,
) => [K8sModel, boolean];

export const useK8sModel: UseK8sModel = (k8sGroupVersionKind) => {
  const ref =
    typeof k8sGroupVersionKind === "string"
      ? k8sGroupVersionKind
      : k8sGroupVersionKind?.kind ?? "";

  const model = ref ? modelFor(ref) : undefined;
  return [model as K8sModel, !!model];
};
