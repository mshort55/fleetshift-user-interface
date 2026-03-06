import {
  ResolvedExtension,
  useResolvedExtensions,
} from "@openshift/dynamic-plugin-sdk";
import { K8sKind } from "../utils";
import { DetailPageBreadCrumbs, isDetailPageBreadCrumbs } from "./types";
import { useMemo } from "react";

export const useBreadCrumbsForDetailPage = (
  kindObj: K8sKind,
): ResolvedExtension<DetailPageBreadCrumbs> => {
  const [breadCrumbsExtensions, breadCrumbsResolved] =
    useResolvedExtensions<DetailPageBreadCrumbs>(isDetailPageBreadCrumbs);
  return useMemo(
    () =>
      breadCrumbsResolved
        ? [...breadCrumbsExtensions].find(({ properties: { getModels } }) => {
            const models = getModels();
            return Array.isArray(models)
              ? models.findIndex(
                  (model: K8sKind) => model.kind === kindObj?.kind,
                ) !== -1
              : models.kind === kindObj?.kind;
          })
        : undefined,
    [breadCrumbsResolved, breadCrumbsExtensions, kindObj],
  )!;
};
