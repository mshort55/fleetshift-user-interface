import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  ConnectedPageHeadingProps,
  FirehoseResource,
  FirehoseResult,
  getTitleForNodeKind,
  K8sKind,
  K8sModel,
  K8sResourceKind,
  K8sResourceKindReference,
  KebabAction,
  KebabOptionsCreator,
  Page,
  referenceForExtensionModel,
  getReferenceForModel as referenceForModel,
} from "../utils";
import * as _ from "lodash";
import { useK8sModel } from "../../hooks/useK8sModel";
import { useLocation, useParams } from "react-router-dom";
import { useResolvedExtensions } from "@openshift/dynamic-plugin-sdk";
import { isResourceTabPage, ResourceTabPage } from "./types";
import { useBreadCrumbsForDetailPage } from "./useBreadCrumbsForDetailPage";
import { PageTitleContext } from "../PageTitle/PageTitleContext";
import DetailsBreadcrumbResolver from "../DetailsBreadcrumbResolver";
import FireHose from "../FireHose";
import { ConnectedPageHeading } from "../PageTitle/ConnectedPageheading";
import { getBadgeFromType } from "../getBadgeFromType";
import { HorizontalNav } from "./HorizontalNav";

export type DetailsPageProps = {
  obj?: FirehoseResult<K8sResourceKind>;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  menuActions?: KebabAction[] | KebabOptionsCreator;
  buttonActions?: any[];
  createRedirect?: boolean;
  customActionMenu?: ConnectedPageHeadingProps["customActionMenu"];
  icon?: ConnectedPageHeadingProps["icon"];
  pages?: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  kind: K8sResourceKindReference;
  kindObj?: K8sKind;
  label?: string;
  name?: string;
  namespace?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (
    obj: K8sResourceKind,
  ) => ({ name: string; path: string } | { name: string; path: Location })[];
  customData?: any;
  badge?: ReactNode;
  OverrideTitle?: ConnectedPageHeadingProps["OverrideTitle"];
  getResourceStatus?: (resource: K8sResourceKind) => string;
  customKind?: string;
  helpText?: ConnectedPageHeadingProps["helpText"];
  helpAlert?: ConnectedPageHeadingProps["helpAlert"];
};

export const DetailsPage = ({ pages = [], ...props }: DetailsPageProps) => {
  const resourceKeys = _.map(props.resources, "prop");
  const [pluginBreadcrumbs, setPluginBreadcrumbs] = useState(undefined);
  const [model] = useK8sModel(props.kind);
  const kindObj: K8sModel = props.kindObj ?? model;

  const params = useParams();
  const location = useLocation();

  const [resourcePageExtensions] =
    useResolvedExtensions<ResourceTabPage>(isResourceTabPage);

  const pluginPages = useMemo(
    () => [
      /** @deprecated -- if there is a bug here, encourage `console.tab/horizontalNav` usage instead */
      ...resourcePageExtensions
        .filter((p) => {
          if (p.properties.model.version) {
            return (
              referenceForExtensionModel(p.properties.model) ===
              (kindObj ? referenceForModel(kindObj) : props.kind)
            );
          }
          return (
            p.properties.model.group === kindObj.apiGroup &&
            p.properties.model.kind === kindObj.kind
          );
        })
        .map(({ properties: { href, name, component: Component } }) => ({
          href,
          name,
          component: (cProps: any) => <Component {...cProps} />,
        })),
    ],
    [resourcePageExtensions, kindObj, props.kind],
  );
  const resolvedBreadcrumbExtension = useBreadCrumbsForDetailPage(kindObj);
  const onBreadcrumbsResolved = useCallback((breadcrumbs: any) => {
    setPluginBreadcrumbs(breadcrumbs || undefined);
  }, []);
  let allPages: Page[] | null = [...pages, ...pluginPages];
  allPages = allPages.length ? allPages : null;
  const objResource: FirehoseResource = {
    kind: props.kind,
    name: props.name,
    namespace: props.namespace,
    isList: false,
    prop: "obj",
  };
  const titleProviderValues = {
    telemetryPrefix: props?.kindObj?.kind,
    titlePrefix: `${props.name} · ${getTitleForNodeKind(props?.kindObj?.kind)}`,
  };

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      {resolvedBreadcrumbExtension && (
        <DetailsBreadcrumbResolver
          useBreadcrumbs={
            resolvedBreadcrumbExtension.properties.breadcrumbsProvider
          }
          onBreadcrumbsResolved={onBreadcrumbsResolved}
          urlMatch={location}
          kind={kindObj}
        />
      )}

      <FireHose
        // Update the props definition
        resources={[
          ...(_.isNil(props.obj) ? [objResource] : []),
          ...(props.resources ?? []),
        ]}
      >
        <ConnectedPageHeading
          obj={props.obj}
          title={props.title || props.name}
          titleFunc={props.titleFunc}
          menuActions={props.menuActions}
          buttonActions={props.buttonActions}
          customActionMenu={props.customActionMenu}
          kind={props.customKind || props.kind}
          icon={props.icon}
          breadcrumbs={pluginBreadcrumbs}
          resourceKeys={resourceKeys}
          getResourceStatus={props.getResourceStatus}
          customData={props.customData}
          badge={props.badge || (kindObj?.badge ? getBadgeFromType(kindObj?.badge) : undefined)}
          OverrideTitle={props.OverrideTitle}
          helpText={props.helpText}
          helpAlert={props.helpAlert}
        />
        <HorizontalNav
          obj={props.obj}
          pages={allPages!}
          pagesFor={props.pagesFor}
          className={`co-m-${_.get(props.kind, "kind", props.kind)}`}
          label={props.label || (props.kind as any).label}
          resourceKeys={resourceKeys}
          customData={props.customData}
          createRedirect={props.createRedirect}
        />
      </FireHose>
    </PageTitleContext.Provider>
  );
};
