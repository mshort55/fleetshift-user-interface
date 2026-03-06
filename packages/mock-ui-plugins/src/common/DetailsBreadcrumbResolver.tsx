import { useEffect } from "react";
import type { FC } from "react";
import { K8sKind, K8sModel } from "./utils";
import { CodeRef, Extension } from "@openshift/dynamic-plugin-sdk";

export type DetailsPageBreadCrumbsHook = (
  kind: K8sModel,
  urlMatch: any,
) => { name: string; path: string }[];

export type DetailPageBreadCrumbs = Extension<
  "dev-console.detailsPage/breadcrumbs",
  {
    /**
     * array of models(kindObj) against which bread crumb is needed
     */
    getModels: CodeRef<() => K8sModel[] | K8sModel>;
    /**
     * returns breadcrumb for the given kindref
     */
    breadcrumbsProvider: CodeRef<DetailsPageBreadCrumbsHook>;
  }
>;

// Type guards

export const isDetailPageBreadCrumbs = (
  e: Extension,
): e is DetailPageBreadCrumbs =>
  e.type === "dev-console.detailsPage/breadcrumbs";

type DetailsBreadcrumbResolverType = {
  useBreadcrumbs: DetailsPageBreadCrumbsHook;
  onBreadcrumbsResolved: (
    breadcrumbs: { name: string; path: string }[],
  ) => void;
  kind: K8sKind;
  urlMatch: any;
};

const DetailsBreadcrumbResolver: FC<DetailsBreadcrumbResolverType> = ({
  useBreadcrumbs,
  onBreadcrumbsResolved,
  kind,
  urlMatch,
}) => {
  const breadcrumbs = useBreadcrumbs(kind, urlMatch);
  useEffect(() => {
    if (breadcrumbs?.length > 0) {
      onBreadcrumbsResolved(breadcrumbs);
    }
  }, [breadcrumbs, onBreadcrumbsResolved]);
  return null;
};

export default DetailsBreadcrumbResolver;
