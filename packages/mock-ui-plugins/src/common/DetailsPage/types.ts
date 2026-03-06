import { CodeRef, Extension } from "@openshift/dynamic-plugin-sdk";
import {
  ExtensionK8sGroupKindModel,
  ExtensionK8sModel,
  K8sModel,
} from "../utils";

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

type ResourcePageProperties = {
  /** The model for which this resource page links to. */
  model: ExtensionK8sGroupKindModel;
  /** The component to be rendered when the route matches. */
  component: CodeRef<
    React.ComponentType<{
      /** The namespace for which this resource page links to. */
      namespace: string;
      /** The model for which this resource page links to. */
      model: ExtensionK8sModel;
    }>
  >;
};

export type ResourceTabPage = Extension<
  "console.page/resource/tab",
  Omit<ResourcePageProperties, "component"> & {
    /** The component to be rendered when the route matches. */
    component: CodeRef<React.ComponentType>;
    /** The name of the tab. */
    name: string;
    /** The optional href for the tab link. If not provided, the first `path` is used. */
    href?: string;
    /** When true, will only match if the path matches the `location.pathname` exactly. */
    exact?: boolean;
  }
>;

export const isResourceTabPage = (e: Extension): e is ResourceTabPage =>
  e.type === "console.page/resource/tab";
