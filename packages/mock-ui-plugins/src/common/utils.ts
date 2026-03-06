/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
  CodeRef,
  Extension,
  LoadedExtension,
} from "@openshift/dynamic-plugin-sdk";
import { PageHeaderLinkProps } from "@patternfly/react-component-groups";
import { getScalprum } from "@scalprum/core";
import { ComponentType, ReactNode } from "react";
import * as _ from "lodash";
import { Map as ImmutableMap } from "immutable";

export type K8sResourceKindReference = string;

export type K8sVerb =
  | "create"
  | "get"
  | "list"
  | "update"
  | "patch"
  | "delete"
  | "deletecollection"
  | "watch"
  | "impersonate";

enum BadgeType {
  DEV = "Dev Preview",
  TECH = "Tech Preview",
}

export type K8sModel = {
  group?: string;
  version?: string;
  abbr: string;
  kind: string;
  label: string;
  labelKey?: string;
  labelPlural: string;
  labelPluralKey?: string;
  plural: string;
  propagationPolicy?: "Foreground" | "Background";

  id?: string;
  crd?: boolean;
  apiVersion: string;
  apiGroup?: string;
  namespaced?: boolean;
  selector?: Selector;
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
  verbs?: K8sVerb[];
  shortNames?: string[];
  badge?: BadgeType;
  color?: string;

  // Legacy option for supporing plural names in URL paths when `crd: true`.
  // This should not be set for new models, but is needed to avoid breaking
  // existing links as we transition to using the API group in URL paths.
  legacyPluralURL?: boolean;
};

export type K8sKind = K8sModel;

export enum Operator {
  Exists = "Exists",
  DoesNotExist = "DoesNotExist",
  In = "In",
  NotIn = "NotIn",
  Equals = "Equals",
  NotEqual = "NotEqual",
  GreaterThan = "GreaterThan",
  LessThan = "LessThan",
  NotEquals = "NotEquals",
}

export type MatchExpression = {
  key: string;
  operator: Operator | string;
  values?: string[];
};

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = {
  matchLabels?: MatchLabels;
  matchExpressions?: MatchExpression[];
};

export type OwnerReference = {
  name: string;
  kind: string;
  uid: string;
  apiVersion: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
};

export type ObjectMetadata = {
  annotations?: { [key: string]: string };
  clusterName?: string;
  creationTimestamp?: string | undefined;
  deletionGracePeriodSeconds?: number;
  deletionTimestamp?: string;
  finalizers?: string[];
  generateName?: string;
  generation?: number;
  labels?: { [key: string]: string };
  managedFields?: any[];
  name?: string;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  resourceVersion?: string;
  uid?: string;
};

export type K8sResourceCommon = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMetadata;
};

export type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    selector?: Selector | MatchLabels;
    [key: string]: any;
  };
  status?: { [key: string]: any };
  data?: { [key: string]: any };
};

export type FirehoseResult<
  R extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceCommon[],
> = {
  loaded: boolean;
  loadError: string;
  optional?: boolean;
  data: R;
  kind?: string;
};

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  name?: string;
  namespace?: string;
};

export type KebabOption = {
  hidden?: boolean;
  label?: ReactNode;
  labelKey?: string;
  labelKind?: { [key: string]: string | string[] };
  href?: string;
  callback?: () => any;
  accessReview?: AccessReviewResourceAttributes;
  isDisabled?: boolean;
  tooltip?: string;
  tooltipKey?: string;
  // a `/` separated string where each segment denotes a new sub menu entry
  // Eg. `Menu 1/Menu 2/Menu 3`
  path?: string;
  pathKey?: string;
  icon?: ReactNode;
};

export type KebabAction = (
  kind: K8sKind,
  obj: K8sResourceKind,
  resources?: any,
  customData?: any,
) => KebabOption;

export type KBAction = {
  /** A unique identifier for this action. */
  id: string;
  /** The label to display in the UI. */
  label: ReactNode;
  /** Subtext for the menu item */
  description?: string;
  /** Executable callback or href.
   * External links should automatically provide an external link icon on action.
   * */
  cta: (() => void) | { href: string; external?: boolean };
  /** Whether the action is disabled. */
  disabled?: boolean;
  /** The tooltip for this action. */
  tooltip?: string;
  /** The disabled tooltip for this action. */
  disabledTooltip?: string;
  /** The icon for this action. */
  icon?: string | ReactNode;
  /** A `/` separated string where each segment denotes
   * Eg. `add-to-project`, `menu-1/menu-2`
   * */
  path?: string;
  /** Insert this item before the item referenced here.
   * For arrays, the first one found in order is used.
   * */
  insertBefore?: string | string[];
  /** Insert this item after the item referenced here.
   * For arrays, the first one found in order is used.
   * insertBefore takes precedence.
   * */
  insertAfter?: string | string[];
  /** Describes the access check to perform. */
  accessReview?: AccessReviewResourceAttributes;
};

interface PageHeadingLinkProps extends Omit<PageHeaderLinkProps, "label"> {
  "data-test"?: string;
  /** Title for the link */
  label: ReactNode | string;
}

export type PageHeadingProps = {
  "data-test"?: string;
  /** A badge that is displayed next to the title of the heading */
  badge?: ReactNode;
  /** Breadcrumbs to be displayed above the title */
  breadcrumbs?: { name: string; path: string }[];
  /** A class name that is placed around the PageHeader wrapper */
  className?: string;
  /** An alert placed below the heading in the same PageSection. */
  helpAlert?: ReactNode;
  /** A subtitle placed below the title. */
  helpText?: ReactNode;
  /** An icon which is placed next to the title with a divider line */
  icon?: ReactNode;
  /**
   * The "Add to favourites" button is shown by default while in the admin perspective.
   * This prop allows you to hide the button. It should be hidden when `PageHeading`
   * is not the primary page header to avoid having multiple favourites buttons.
   */
  hideFavoriteButton?: boolean;
  /** A title for the page. */
  title?: string | JSX.Element;
  /** A primary action that is always rendered. */
  primaryAction?: ReactNode;
  /** Optional link below subtitle */
  linkProps?: PageHeadingLinkProps;
};

export type KebabOptionsCreator = (
  kindObj: K8sKind,
  data: K8sResourceKind,
  extraResources?: { [prop: string]: K8sResourceKind | K8sResourceKind[] },
  customData?: any,
) => KBAction[];

export type ConnectedPageHeadingProps = Omit<
  PageHeadingProps,
  "primaryAction"
> & {
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  buttonActions?: any[];
  /** Renders a custom action menu if the `obj` prop is passed with `data` */
  customActionMenu?:
    | ReactNode
    | ((
        kindObj: K8sKind,
        obj: K8sResourceKind,
        extraResources?: {
          [prop: string]: K8sResourceKind | K8sResourceKind[];
        },
      ) => ReactNode);
  customData?: any;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;

  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  obj?: FirehoseResult<K8sResourceKind>;
  /** A component to override the title of the page */
  OverrideTitle?: ComponentType<{ obj?: K8sResourceKind }>;
  resourceKeys?: string[];
  /** A function to get the title of the resource that is used when `data` is present */
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
};

/* Horizontal Nav Types */
export type NavPage = {
  href?: string;
  path?: string;
  name: string;
  component: ComponentType;
};

export type PageComponentProps<R extends K8sResourceCommon = K8sResourceKind> =
  {
    filters?: any;
    selected?: any;
    match?: any;
    obj?: R;
    params?: any;
    customData?: any;
    showTitle?: boolean;
    fieldSelector?: string;
  };

export type Page<D = any> = Partial<Omit<NavPage, "component">> & {
  component?: ComponentType<PageComponentProps & D>;
  badge?: ReactNode;
  pageData?: D;
  nameKey?: string;
};

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  prop: string;
  namespaced?: boolean;
  optional?: boolean;
  limit?: number;
  fieldSelector?: string;
};

export type K8sGroupVersionKind = {
  group?: string;
  version?: string;
  kind?: string;
};

export type ExtensionK8sGroupKindModel = {
  group: string;
  version?: string;
  kind: string;
};

export type ExtensionK8sModel = {
  group: string;
  version: string;
  kind: string;
};

export type ExtensionK8sGroupModel = {
  group: string;
  version?: string;
  kind?: string;
};

export type GroupVersionKind = string;

export const getReference = ({
  group,
  version = "v1",
  kind = "default",
}: K8sGroupVersionKind): K8sResourceKindReference =>
  [group || "core", version, kind].join("~");

export const referenceForExtensionModel = (
  model: ExtensionK8sGroupModel,
): GroupVersionKind =>
  referenceForGroupVersionKind(model?.group || "core")(model?.version)(
    model?.kind,
  );

export const referenceForGroupVersionKind =
  (group: string) => (version?: string) => (kind?: string) =>
    getReference({ group, version, kind });

export const getReferenceForModel = (
  model: K8sModel,
): K8sResourceKindReference =>
  getReference({
    group: model.apiGroup,
    version: model.apiVersion,
    kind: model.kind,
  });

export const PrometheusModel: K8sKind = {
  kind: "Prometheus",
  label: "Prometheus",
  // t('public~Prometheus')
  labelKey: "public~Prometheus",
  labelPlural: "Prometheuses",
  // t('public~Prometheuses')
  labelPluralKey: "public~Prometheuses",
  apiGroup: "monitoring.coreos.com",
  apiVersion: "v1",
  abbr: "PI",
  namespaced: true,
  crd: true,
  plural: "prometheuses",
  propagationPolicy: "Foreground",
};

export const ServiceMonitorModel: K8sKind = {
  kind: "ServiceMonitor",
  label: "ServiceMonitor",
  // t('public~ServiceMonitor')
  labelKey: "public~ServiceMonitor",
  labelPlural: "ServiceMonitors",
  // t('public~ServiceMonitors')
  labelPluralKey: "public~ServiceMonitors",
  apiGroup: "monitoring.coreos.com",
  apiVersion: "v1",
  abbr: "SM",
  namespaced: true,
  crd: true,
  plural: "servicemonitors",
  propagationPolicy: "Foreground",
};

export const PodMonitorModel: K8sKind = {
  kind: "PodMonitor",
  label: "PodMonitor",
  // t('public~PodMonitor')
  labelKey: "public~PodMonitor",
  labelPlural: "PodMonitors",
  // t('public~PodMonitors')
  labelPluralKey: "public~PodMonitors",
  apiGroup: "monitoring.coreos.com",
  apiVersion: "v1",
  abbr: "PM",
  namespaced: true,
  crd: true,
  plural: "podmonitors",
  propagationPolicy: "Foreground",
};

export const AlertmanagerModel: K8sKind = {
  kind: "Alertmanager",
  label: "Alertmanager",
  // t('public~Alertmanager')
  labelKey: "public~Alertmanager",
  labelPlural: "Alertmanagers",
  // t('public~Alertmanagers')
  labelPluralKey: "public~Alertmanagers",
  apiGroup: "monitoring.coreos.com",
  apiVersion: "v1",
  abbr: "AM",
  namespaced: true,
  crd: true,
  plural: "alertmanagers",
  propagationPolicy: "Foreground",
};

export const ServiceModel: K8sKind = {
  apiVersion: "v1",
  label: "Service",
  // t('public~Service')
  labelKey: "public~Service",
  plural: "services",
  abbr: "S",
  namespaced: true,
  kind: "Service",
  id: "service",
  labelPlural: "Services",
  // t('public~Services')
  labelPluralKey: "public~Services",
};

export const PodModel: K8sKind = {
  apiVersion: "v1",
  label: "Pod",
  // t('public~Pod')
  labelKey: "public~Pod",
  plural: "pods",
  abbr: "P",
  namespaced: true,
  kind: "Pod",
  id: "pod",
  labelPlural: "Pods",
  // t('public~Pods')
  labelPluralKey: "public~Pods",
};

export const ContainerModel: K8sKind = {
  apiVersion: "v1",
  label: "Container",
  // t('public~Container')
  labelKey: "public~Container",
  plural: "containers",
  abbr: "C",
  kind: "Container",
  id: "container",
  labelPlural: "Containers",
  // t('public~Containers')
  labelPluralKey: "public~Containers",
};

export const DaemonSetModel: K8sKind = {
  label: "DaemonSet",
  // t('public~DaemonSet')
  labelKey: "public~DaemonSet",
  apiGroup: "apps",
  plural: "daemonsets",
  apiVersion: "v1",
  abbr: "DS",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "DaemonSet",
  id: "daemonset",
  labelPlural: "DaemonSets",
  // t('public~DaemonSets')
  labelPluralKey: "public~DaemonSets",
};

export const ReplicationControllerModel: K8sKind = {
  apiVersion: "v1",
  label: "ReplicationController",
  // t('public~ReplicationController')
  labelKey: "public~ReplicationController",
  plural: "replicationcontrollers",
  abbr: "RC",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "ReplicationController",
  id: "replicationcontroller",
  labelPlural: "ReplicationControllers",
  // t('public~ReplicationControllers')
  labelPluralKey: "public~ReplicationControllers",
};

export const HorizontalPodAutoscalerModel: K8sKind = {
  label: "HorizontalPodAutoscaler",
  // t('public~HorizontalPodAutoscaler')
  labelKey: "public~HorizontalPodAutoscaler",
  plural: "horizontalpodautoscalers",
  apiVersion: "v2",
  apiGroup: "autoscaling",
  abbr: "HPA",
  namespaced: true,
  kind: "HorizontalPodAutoscaler",
  id: "horizontalpodautoscaler",
  labelPlural: "HorizontalPodAutoscalers",
  // t('public~HorizontalPodAutoscalers')
  labelPluralKey: "public~HorizontalPodAutoscalers",
};

export const ServiceAccountModel: K8sKind = {
  apiVersion: "v1",
  label: "ServiceAccount",
  // t('public~ServiceAccount')
  labelKey: "public~ServiceAccount",
  plural: "serviceaccounts",
  abbr: "SA",
  namespaced: true,
  kind: "ServiceAccount",
  id: "serviceaccount",
  labelPlural: "ServiceAccounts",
  // t('public~ServiceAccounts')
  labelPluralKey: "public~ServiceAccounts",
};

export const ReplicaSetModel: K8sKind = {
  label: "ReplicaSet",
  // t('public~ReplicaSet')
  labelKey: "public~ReplicaSet",
  apiVersion: "v1",
  apiGroup: "apps",
  plural: "replicasets",
  abbr: "RS",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "ReplicaSet",
  id: "replicaset",
  labelPlural: "ReplicaSets",
  // t('public~ReplicaSets')
  labelPluralKey: "public~ReplicaSets",
};

export const DeploymentModel: K8sKind = {
  label: "Deployment",
  // t('public~Deployment')
  labelKey: "public~Deployment",
  apiVersion: "v1",
  apiGroup: "apps",
  plural: "deployments",
  abbr: "D",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "Deployment",
  id: "deployment",
  labelPlural: "Deployments",
  // t('public~Deployments')
  labelPluralKey: "public~Deployments",
};

export const DeploymentConfigModel: K8sKind = {
  label: "DeploymentConfig",
  // t('public~DeploymentConfig')
  labelKey: "public~DeploymentConfig",
  apiVersion: "v1",
  apiGroup: "apps.openshift.io",
  plural: "deploymentconfigs",
  abbr: "DC",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "DeploymentConfig",
  id: "deploymentconfig",
  labelPlural: "DeploymentConfigs",
  // t('public~DeploymentConfigs')
  labelPluralKey: "public~DeploymentConfigs",
};

export const BuildConfigModel: K8sKind = {
  label: "BuildConfig",
  // t('public~BuildConfig')
  labelKey: "public~BuildConfig",
  apiVersion: "v1",
  apiGroup: "build.openshift.io",
  plural: "buildconfigs",
  abbr: "BC",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "BuildConfig",
  id: "buildconfig",
  labelPlural: "BuildConfigs",
  // t('public~BuildConfigs')
  labelPluralKey: "public~BuildConfigs",
};

export const BuildModel: K8sKind = {
  label: "Build",
  // t('public~Build')
  labelKey: "public~Build",
  apiVersion: "v1",
  apiGroup: "build.openshift.io",
  plural: "builds",
  abbr: "B",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "Build",
  id: "build",
  labelPlural: "Builds",
  // t('public~Builds')
  labelPluralKey: "public~Builds",
};

export const TemplateModel: K8sKind = {
  label: "Template",
  // t('public~Template')
  labelKey: "public~Template",
  apiVersion: "v1",
  apiGroup: "template.openshift.io",
  plural: "templates",
  abbr: "T",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "Template",
  id: "template",
  labelPlural: "Templates",
  // t('public~Templates')
  labelPluralKey: "public~Templates",
};

export const TemplateInstanceModel: K8sKind = {
  label: "Template Instance",
  apiVersion: "v1",
  apiGroup: "template.openshift.io",
  plural: "templateinstances",
  abbr: "TI",
  namespaced: true,
  kind: "TemplateInstance",
  id: "templateinstance",
  labelPlural: "Template Instances",
};

export const ImageStreamModel: K8sKind = {
  label: "ImageStream",
  // t('public~ImageStream')
  labelKey: "public~ImageStream",
  apiVersion: "v1",
  apiGroup: "image.openshift.io",
  plural: "imagestreams",
  abbr: "IS",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "ImageStream",
  id: "imagestream",
  labelPlural: "ImageStreams",
  // t('public~ImageStreams')
  labelPluralKey: "public~ImageStreams",
};

export const ImageStreamTagModel: K8sKind = {
  label: "ImageStreamTag",
  // t('public~ImageStreamTag')
  labelKey: "public~ImageStreamTag",
  apiVersion: "v1",
  apiGroup: "image.openshift.io",
  plural: "imagestreamtags",
  abbr: "IST",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "ImageStreamTag",
  id: "imagestreamtag",
  labelPlural: "ImageStreamTags",
  // t('public~ImageStreamTags')
  labelPluralKey: "public~ImageStreamTags",
};

export const ImageStreamImportsModel: K8sKind = {
  label: "ImageStreamImport",
  // t('public~ImageStreamImport')
  labelKey: "public~ImageStreamImport",
  apiVersion: "v1",
  apiGroup: "image.openshift.io",
  plural: "imagestreamimports",
  abbr: "ISI",
  namespaced: true,
  kind: "ImageStreamImport",
  id: "imagestreamimport",
  labelPlural: "ImageStreamImports",
  // t('public~ImageStreamImports')
  labelPluralKey: "ImageStreamImports",
};

export const JobModel: K8sKind = {
  label: "Job",
  // t('public~Job')
  labelKey: "public~Job",
  apiVersion: "v1",
  apiGroup: "batch",
  plural: "jobs",
  abbr: "J",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "Job",
  id: "job",
  labelPlural: "Jobs",
  // t('public~Jobs')
  labelPluralKey: "public~Jobs",
};

export const NodeModel: K8sKind = {
  apiVersion: "v1",
  label: "Node",
  // t('public~Node')
  labelKey: "public~Node",
  plural: "nodes",
  abbr: "N",
  kind: "Node",
  id: "node",
  labelPlural: "Nodes",
  // t('public~Nodes')
  labelPluralKey: "public~Nodes",
};

export const CertificateSigningRequestModel: K8sKind = {
  apiVersion: "v1",
  apiGroup: "certificates.k8s.io",
  label: "CertificateSigningRequest",
  // t('public~CertificateSigningRequest')
  labelKey: "public~CertificateSigningRequest",
  plural: "certificatesigningrequests",
  abbr: "CSR",
  kind: "CertificateSigningRequest",
  id: "certificateigningrequests",
  labelPlural: "CertificateSigningRequests",
  // t('public~CertificateSigningRequests')
  labelPluralKey: "public~CertificateSigningRequests",
};

export const EventModel: K8sKind = {
  apiVersion: "v1",
  label: "Event",
  // t('public~Event')
  labelKey: "public~Event",
  plural: "events",
  abbr: "E",
  namespaced: true,
  kind: "Event",
  id: "event",
  labelPlural: "Events",
  // t('public~Events')
  labelPluralKey: "public~Events",
};

export const ComponentStatusModel: K8sKind = {
  apiVersion: "v1",
  label: "ComponentStatus",
  // t('public~ComponentStatus')
  labelKey: "public~ComponentStatus",
  labelPlural: "ComponentStatuses",
  // t('public~ComponentStatuses')
  labelPluralKey: "public~ComponentStatuses",
  plural: "componentstatuses",
  abbr: "CS",
  kind: "ComponentStatus",
  id: "componentstatus",
};

export const NamespaceModel: K8sKind = {
  apiVersion: "v1",
  label: "Namespace",
  // t('public~Namespace')
  labelKey: "public~Namespace",
  plural: "namespaces",
  abbr: "NS",
  kind: "Namespace",
  id: "namespace",
  labelPlural: "Namespaces",
  // t('public~Namespaces')
  labelPluralKey: "public~Namespaces",
};

export const ProjectModel: K8sKind = {
  apiVersion: "v1",
  apiGroup: "project.openshift.io",
  label: "Project",
  // t('public~Project')
  labelKey: "public~Project",
  plural: "projects",
  abbr: "PR",
  kind: "Project",
  id: "project",
  labelPlural: "Projects",
  // t('public~Projects')
  labelPluralKey: "public~Projects",
};

export const ProjectRequestModel: K8sKind = {
  apiVersion: "v1",
  apiGroup: "project.openshift.io",
  label: "ProjectRequest",
  // t('public~ProjectRequest')
  labelKey: "public~ProjectRequest",
  plural: "projectrequests",
  abbr: "",
  kind: "ProjectRequest",
  id: "projectrequest",
  labelPlural: "ProjectRequests",
  // t('public~ProjectRequests')
  labelPluralKey: "public~ProjectRequests",
};

export const IngressModel: K8sKind = {
  label: "Ingress",
  // t('public~Ingress')
  labelKey: "public~Ingress",
  labelPlural: "Ingresses",
  // t('public~Ingresses')
  labelPluralKey: "public~Ingresses",
  apiGroup: "networking.k8s.io",
  apiVersion: "v1",
  plural: "ingresses",
  abbr: "I",
  namespaced: true,
  kind: "Ingress",
  id: "ingress",
};

export const RouteModel: K8sKind = {
  label: "Route",
  // t('public~Route')
  labelKey: "public~Route",
  labelPlural: "Routes",
  // t('public~Routes')
  labelPluralKey: "public~Routes",
  apiGroup: "route.openshift.io",
  apiVersion: "v1",
  plural: "routes",
  abbr: "RT",
  namespaced: true,
  kind: "Route",
  id: "route",
};

export const ConfigMapModel: K8sKind = {
  apiVersion: "v1",
  label: "ConfigMap",
  // t('public~ConfigMap')
  labelKey: "public~ConfigMap",
  plural: "configmaps",
  abbr: "CM",
  namespaced: true,
  kind: "ConfigMap",
  id: "configmap",
  labelPlural: "ConfigMaps",
  // t('public~ConfigMaps')
  labelPluralKey: "public~ConfigMaps",
};

export const SecretModel: K8sKind = {
  apiVersion: "v1",
  label: "Secret",
  // t('public~Secret')
  labelKey: "public~Secret",
  plural: "secrets",
  abbr: "S",
  namespaced: true,
  kind: "Secret",
  id: "secret",
  labelPlural: "Secrets",
  // t('public~Secrets')
  labelPluralKey: "public~Secrets",
};

export const ClusterRoleBindingModel: K8sKind = {
  label: "ClusterRoleBinding",
  // t('public~ClusterRoleBinding')
  labelKey: "public~ClusterRoleBinding",
  apiGroup: "rbac.authorization.k8s.io",
  apiVersion: "v1",
  plural: "clusterrolebindings",
  abbr: "CRB",
  kind: "ClusterRoleBinding",
  id: "clusterrolebinding",
  labelPlural: "ClusterRoleBindings",
  // t('public~ClusterRoleBindings')
  labelPluralKey: "public~ClusterRoleBindings",
};

export const ClusterRoleModel: K8sKind = {
  label: "ClusterRole",
  // t('public~ClusterRole')
  labelKey: "public~ClusterRole",
  apiGroup: "rbac.authorization.k8s.io",
  apiVersion: "v1",
  plural: "clusterroles",
  abbr: "CR",
  kind: "ClusterRole",
  id: "clusterrole",
  labelPlural: "ClusterRoles",
  // t('public~ClusterRoles')
  labelPluralKey: "public~ClusterRoles",
};

export const RoleBindingModel: K8sKind = {
  label: "RoleBinding",
  // t('public~RoleBinding')
  labelKey: "public~RoleBinding",
  apiGroup: "rbac.authorization.k8s.io",
  apiVersion: "v1",
  plural: "rolebindings",
  abbr: "RB",
  namespaced: true,
  kind: "RoleBinding",
  id: "rolebinding",
  labelPlural: "RoleBindings",
  // t('public~RoleBindings')
  labelPluralKey: "public~RoleBindings",
};

export const RoleModel: K8sKind = {
  label: "Role",
  // t('public~Role')
  labelKey: "public~Role",
  apiGroup: "rbac.authorization.k8s.io",
  apiVersion: "v1",
  plural: "roles",
  abbr: "R",
  namespaced: true,
  kind: "Role",
  id: "role",
  labelPlural: "Roles",
  // t('public~Roles')
  labelPluralKey: "public~Roles",
};

export const SelfSubjectAccessReviewModel: K8sKind = {
  label: "SelfSubjectAccessReview",
  // t('public~SelfSubjectAccessReview')
  labelKey: "public~SelfSubjectAccessReview",
  apiGroup: "authorization.k8s.io",
  apiVersion: "v1",
  plural: "selfsubjectaccessreviews",
  abbr: "SSAR",
  namespaced: true,
  kind: "SelfSubjectAccessReview",
  id: "selfsubjectaccessreview",
  labelPlural: "SelfSubjectAccessReviews",
  // t('public~SelfSubjectAccessReviews')
  labelPluralKey: "public~SelfSubjectAccessReviews",
};

export const SelfSubjectReviewModel: K8sKind = {
  label: "SelfSubjectReview",
  // t('public~SelfSubjectReview')
  labelKey: "public~SelfSubjectReview",
  apiGroup: "authorization.k8s.io",
  apiVersion: "v1",
  plural: "selfsubjectreviews",
  abbr: "SSR",
  namespaced: true,
  kind: "SelfSubjectReview",
  id: "selfsubjectreview",
  labelPlural: "SelfSubjectReviews",
  // t('public~SelfSubjectReviews')
  labelPluralKey: "public~SelfSubjectReviews",
};

export const ResourceAccessReviewsModel: K8sKind = {
  label: "ResourceAccessReview",
  // t('public~ResourceAccessReview')
  labelKey: "public~ResourceAccessReview",
  apiGroup: "authorization.openshift.io",
  apiVersion: "v1",
  plural: "resourceaccessreviews",
  abbr: "LRAR",
  namespaced: false,
  kind: "ResourceAccessReview",
  id: "resourceaccessreview",
  labelPlural: "ResourceAccessReviews",
  // t('public~ResourceAccessReviews')
  labelPluralKey: "public~ResourceAccessReviews",
};

export const LocalResourceAccessReviewsModel: K8sKind = {
  label: "LocalResourceAccessReview",
  // t('public~LocalResourceAccessReview')
  labelKey: "public~LocalResourceAccessReview",
  apiGroup: "authorization.openshift.io",
  apiVersion: "v1",
  plural: "localresourceaccessreviews",
  abbr: "LRAR",
  namespaced: true,
  kind: "LocalResourceAccessReview",
  id: "localresourceaccessreview",
  labelPlural: "LocalResourceAccessReviews",
  // t('public~LocalResourceAccessReviews')
  labelPluralKey: "public~LocalResourceAccessReviews",
};

export const PersistentVolumeModel: K8sKind = {
  label: "PersistentVolume",
  // t('public~PersistentVolume')
  labelKey: "public~PersistentVolume",
  apiVersion: "v1",
  plural: "persistentvolumes",
  abbr: "PV",
  kind: "PersistentVolume",
  id: "persistentvolume",
  labelPlural: "PersistentVolumes",
  // t('public~PersistentVolumes')
  labelPluralKey: "public~PersistentVolumes",
};

export const PersistentVolumeClaimModel: K8sKind = {
  label: "PersistentVolumeClaim",
  // t('public~PersistentVolumeClaim')
  labelKey: "public~PersistentVolumeClaim",
  apiVersion: "v1",
  plural: "persistentvolumeclaims",
  abbr: "PVC",
  namespaced: true,
  kind: "PersistentVolumeClaim",
  id: "persistentvolumeclaim",
  labelPlural: "PersistentVolumeClaims",
  // t('public~PersistentVolumeClaims')
  labelPluralKey: "public~PersistentVolumeClaims",
};

export const StatefulSetModel: K8sKind = {
  label: "StatefulSet",
  // t('public~StatefulSet')
  labelKey: "public~StatefulSet",
  apiGroup: "apps",
  apiVersion: "v1",
  plural: "statefulsets",
  abbr: "SS",
  namespaced: true,
  propagationPolicy: "Foreground",
  kind: "StatefulSet",
  id: "statefulset",
  labelPlural: "StatefulSets",
  // t('public~StatefulSets')
  labelPluralKey: "public~StatefulSets",
};

export const ResourceQuotaModel: K8sKind = {
  label: "ResourceQuota",
  // t('public~ResourceQuota')
  labelKey: "public~ResourceQuota",
  apiVersion: "v1",
  plural: "resourcequotas",
  abbr: "RQ",
  namespaced: true,
  kind: "ResourceQuota",
  id: "resourcequota",
  labelPlural: "ResourceQuotas",
  // t('public~ResourceQuotas')
  labelPluralKey: "public~ResourceQuotas",
};

export const ClusterResourceQuotaModel: K8sKind = {
  label: "ClusterResourceQuota",
  // t('public~ClusterResourceQuota')
  labelKey: "public~ClusterResourceQuota",
  apiGroup: "quota.openshift.io",
  apiVersion: "v1",
  plural: "clusterresourcequotas",
  abbr: "CRQ",
  namespaced: false,
  kind: "ClusterResourceQuota",
  id: "clusterresourcequota",
  labelPlural: "ClusterResourceQuotas",
  // t('public~ClusterResourceQuotas')
  labelPluralKey: "public~ClusterResourceQuotas",
  crd: true,
};

export const AppliedClusterResourceQuotaModel: K8sKind = {
  label: "AppliedClusterResourceQuota",
  // t('public~AppliedClusterResourceQuota')
  labelKey: "public~AppliedClusterResourceQuota",
  apiGroup: "quota.openshift.io",
  apiVersion: "v1",
  plural: "appliedclusterresourcequotas",
  abbr: "ACRQ",
  namespaced: true,
  kind: "AppliedClusterResourceQuota",
  id: "appliedclusterresourcequota",
  labelPlural: "AppliedClusterResourceQuotas",
  // t('public~AppliedClusterResourceQuotas')
  labelPluralKey: "public~AppliedClusterResourceQuotas",
  crd: true,
};

export const NetworkPolicyModel: K8sKind = {
  label: "NetworkPolicy",
  // t('public~NetworkPolicy')
  labelKey: "public~NetworkPolicy",
  labelPlural: "NetworkPolicies",
  // t('public~NetworkPolicies')
  labelPluralKey: "public~NetworkPolicies",
  apiVersion: "v1",
  apiGroup: "networking.k8s.io",
  plural: "networkpolicies",
  abbr: "NP",
  namespaced: true,
  kind: "NetworkPolicy",
  id: "networkpolicy",
};

export const CustomResourceDefinitionModel: K8sKind = {
  label: "CustomResourceDefinition",
  // t('public~CustomResourceDefinition')
  labelKey: "public~CustomResourceDefinition",
  apiGroup: "apiextensions.k8s.io",
  apiVersion: "v1",
  abbr: "CRD",
  namespaced: false,
  plural: "customresourcedefinitions",
  kind: "CustomResourceDefinition",
  id: "customresourcedefinition",
  labelPlural: "CustomResourceDefinitions",
  // t('public~CustomResourceDefinitions')
  labelPluralKey: "public~CustomResourceDefinitions",
};

export const CronJobModel: K8sKind = {
  label: "CronJob",
  // t('public~CronJob')
  labelKey: "public~CronJob",
  apiVersion: "v1",
  apiGroup: "batch",
  plural: "cronjobs",
  abbr: "CJ",
  namespaced: true,
  kind: "CronJob",
  id: "cronjob",
  labelPlural: "CronJobs",
  // t('public~CronJobs')
  labelPluralKey: "public~CronJobs",
  propagationPolicy: "Foreground",
};

export const StorageClassModel: K8sKind = {
  label: "StorageClass",
  // t('public~StorageClass')
  labelKey: "public~StorageClass",
  labelPlural: "StorageClasses",
  // t('public~StorageClasses')
  labelPluralKey: "public~StorageClasses",
  apiVersion: "v1",
  apiGroup: "storage.k8s.io",
  plural: "storageclasses",
  abbr: "SC",
  namespaced: false,
  kind: "StorageClass",
  id: "storageclass",
};

export const VolumeAttributesClassModel: K8sKind = {
  label: "VolumeAttributesClass",
  // t('public~VolumeAttributesClass')
  labelKey: "public~VolumeAttributesClass",
  labelPlural: "VolumeAttributesClasses",
  // t('public~VolumeAttributesClasses')
  labelPluralKey: "public~VolumeAttributesClasses",
  apiVersion: "v1",
  apiGroup: "storage.k8s.io",
  plural: "volumeattributesclasses",
  abbr: "VAC",
  namespaced: false,
  kind: "VolumeAttributesClass",
  id: "volumeattributesclass",
};

export const LimitRangeModel: K8sKind = {
  label: "LimitRange",
  // t('public~LimitRange')
  labelKey: "public~LimitRange",
  apiVersion: "v1",
  plural: "limitranges",
  abbr: "LR",
  namespaced: true,
  kind: "LimitRange",
  id: "limitrange",
  labelPlural: "LimitRanges",
  // t('public~LimitRanges')
  labelPluralKey: "public~LimitRanges",
};

export const APIServiceModel: K8sKind = {
  label: "APIService",
  // t('public~APIService')
  labelKey: "public~APIService",
  labelPlural: "APIServices",
  // t('public~APIServices')
  labelPluralKey: "APIServices",
  apiVersion: "v1",
  apiGroup: "apiregistration.k8s.io",
  plural: "apiservices",
  abbr: "APIS",
  namespaced: false,
  kind: "APIService",
  id: "apiservice",
  crd: true,
};

export const UserModel: K8sKind = {
  label: "User",
  // t('public~User')
  labelKey: "public~User",
  labelPlural: "Users",
  // t('public~Users')
  labelPluralKey: "public~Users",
  apiVersion: "v1",
  apiGroup: "user.openshift.io",
  plural: "users",
  abbr: "U",
  namespaced: false,
  kind: "User",
  id: "user",
  crd: true,
};

export const GroupModel: K8sKind = {
  label: "Group",
  // t('public~Group')
  labelKey: "public~Group",
  labelPlural: "Groups",
  // t('public~Groups')
  labelPluralKey: "public~Groups",
  apiVersion: "v1",
  apiGroup: "user.openshift.io",
  plural: "groups",
  abbr: "G",
  namespaced: false,
  kind: "Group",
  id: "group",
  crd: true,
};

// Cluster API resources
// https://github.com/openshift/cluster-api
export const MachineModel: K8sKind = {
  label: "Machine",
  // t('public~Machine')
  labelKey: "public~Machine",
  labelPlural: "Machines",
  // t('public~Machines')
  labelPluralKey: "public~Machines",
  apiVersion: "v1beta1",
  apiGroup: "machine.openshift.io",
  plural: "machines",
  abbr: "M",
  namespaced: true,
  kind: "Machine",
  id: "machine",
  crd: true,
};

export const MachineSetModel: K8sKind = {
  label: "MachineSet",
  // t('public~MachineSet')
  labelKey: "public~MachineSet",
  labelPlural: "MachineSets",
  // t('public~MachineSet')
  labelPluralKey: "public~MachineSet",
  apiVersion: "v1beta1",
  apiGroup: "machine.openshift.io",
  plural: "machinesets",
  abbr: "MS",
  namespaced: true,
  kind: "MachineSet",
  id: "machineset",
  crd: true,
};

export const ControlPlaneMachineSetModel: K8sKind = {
  label: "ControlPlaneMachineSet",
  // t('public~ControlPlaneMachineSet')
  labelKey: "public~ControlPlaneMachineSet",
  labelPlural: "ControlPlaneMachineSets",
  // t('public~ControlPlaneMachineSets')
  labelPluralKey: "public~ControlPlaneMachineSets",
  apiVersion: "v1",
  apiGroup: "machine.openshift.io",
  plural: "controlplanemachinesets",
  abbr: "CPMS",
  namespaced: true,
  kind: "ControlPlaneMachineSet",
  id: "controlplanemachineset",
  crd: true,
};

export const MachineDeploymentModel: K8sKind = {
  label: "MachineDeployment",
  // t('public~MachineDeployment')
  labelKey: "public~MachineDeployment",
  labelPlural: "MachineDeployments",
  // t('public~MachineDeployments')
  labelPluralKey: "public~MachineDeployments",
  apiVersion: "v1beta1",
  apiGroup: "machine.openshift.io",
  plural: "machinedeployments",
  abbr: "MD",
  namespaced: true,
  kind: "MachineDeployment",
  id: "machinedeployment",
  crd: true,
};

export const MachineConfigPoolModel: K8sKind = {
  label: "MachineConfigPool",
  // t('public~MachineConfigPool')
  labelKey: "public~MachineConfigPool",
  labelPlural: "MachineConfigPools",
  // t('public~MachineConfigPools')
  labelPluralKey: "public~MachineConfigPools",
  apiVersion: "v1",
  apiGroup: "machineconfiguration.openshift.io",
  plural: "machineconfigpools",
  abbr: "MCP",
  namespaced: false,
  kind: "MachineConfigPool",
  id: "machineconfigpool",
  crd: true,
};

export const MachineConfigModel: K8sKind = {
  label: "MachineConfig",
  // t('public~MachineConfig')
  labelKey: "public~MachineConfig",
  labelPlural: "MachineConfigs",
  // t('public~MachineConfigs')
  labelPluralKey: "public~MachineConfigs",
  apiVersion: "v1",
  apiGroup: "machineconfiguration.openshift.io",
  plural: "machineconfigs",
  abbr: "MC",
  namespaced: false,
  kind: "MachineConfig",
  id: "machineconfigpool",
  crd: true,
};

export const MachineAutoscalerModel: K8sKind = {
  label: "MachineAutoscaler",
  // t('public~MachineAutoscaler')
  labelKey: "public~MachineAutoscaler",
  labelPlural: "MachineAutoscalers",
  // t('public~MachineAutoscalers')
  labelPluralKey: "public~MachineAutoscalers",
  apiVersion: "v1beta1",
  apiGroup: "autoscaling.openshift.io",
  plural: "machineautoscalers",
  abbr: "MA",
  namespaced: true,
  kind: "MachineAutoscaler",
  id: "machineautoscaler",
  crd: true,
};

export const MachineHealthCheckModel: K8sKind = {
  label: "MachineHealthCheck",
  // t('public~MachineHealthCheck')
  labelKey: "public~MachineHealthCheck",
  labelPlural: "MachineHealthChecks",
  // t('public~MachineHealthChecks')
  labelPluralKey: "public~MachineHealthChecks",
  apiVersion: "v1beta1",
  apiGroup: "machine.openshift.io",
  plural: "machinehealthchecks",
  abbr: "MHC",
  namespaced: true,
  kind: "MachineHealthCheck",
  id: "machinehealthcheck",
  crd: true,
};

// Openshift cluster resources
export const ClusterOperatorModel: K8sKind = {
  label: "ClusterOperator",
  // t('public~ClusterOperator')
  labelKey: "public~ClusterOperator",
  labelPlural: "ClusterOperators",
  // t('public~ClusterOperators')
  labelPluralKey: "public~ClusterOperators",
  apiVersion: "v1",
  apiGroup: "config.openshift.io",
  plural: "clusteroperators",
  abbr: "CO",
  namespaced: false,
  kind: "ClusterOperator",
  id: "clusteroperator",
  crd: true,
};

export const ClusterVersionModel: K8sKind = {
  label: "ClusterVersion",
  // t('public~ClusterVersion')
  labelKey: "public~ClusterVersion",
  labelPlural: "ClusterVersions",
  // t('public~ClusterVersions')
  labelPluralKey: "public~ClusterVersions",
  apiVersion: "v1",
  apiGroup: "config.openshift.io",
  plural: "clusterversions",
  abbr: "CV",
  namespaced: false,
  kind: "ClusterVersion",
  id: "clusterversion",
  crd: true,
};

export const CSIDriverModel: K8sKind = {
  label: "CSIDriver",
  // t('public~CSIDriver')
  labelKey: "public~CSIDriver",
  labelPlural: "CSIDrivers",
  // t('public~CSIDrivers')
  labelPluralKey: "public~CSIDrivers",
  apiVersion: "v1",
  apiGroup: "storage.k8s.io",
  plural: "csidrivers",
  abbr: "CSI",
  namespaced: false,
  kind: "CSIDriver",
  id: "csidriver",
  crd: true,
};

export const ClusterAutoscalerModel: K8sKind = {
  label: "ClusterAutoscaler",
  // t('public~ClusterAutoscaler')
  labelKey: "public~ClusterAutoscaler",
  labelPlural: "ClusterAutoscalers",
  // t('public~ClusterAutoscalers')
  labelPluralKey: "public~ClusterAutoscalers",
  apiVersion: "v1",
  apiGroup: "autoscaling.openshift.io",
  plural: "clusterautoscalers",
  abbr: "CA",
  namespaced: false,
  kind: "ClusterAutoscaler",
  id: "clusterautoscaler",
  crd: true,
};

// OpenShift global configuration
export const OAuthModel: K8sKind = {
  label: "OAuth",
  // t('public~OAuth')
  labelKey: "public~OAuth",
  labelPlural: "OAuths",
  // t('public~OAuths')
  labelPluralKey: "public~OAuths",
  apiVersion: "v1",
  apiGroup: "config.openshift.io",
  plural: "oauths",
  abbr: "OA",
  namespaced: false,
  kind: "OAuth",
  id: "oauth",
  crd: true,
};

export const InfrastructureModel: K8sKind = {
  label: "Infrastructure",
  // t('public~Infrastructure')
  labelKey: "public~Infrastructure",
  labelPlural: "Infrastructures",
  // t('public~Infrastructures')
  labelPluralKey: "public~Infrastructures",
  apiVersion: "v1",
  apiGroup: "config.openshift.io",
  plural: "infrastructures",
  abbr: "INF",
  namespaced: false,
  kind: "Infrastructure",
  id: "infrastructure",
  crd: true,
};

export const NetworkOperatorConfigModel: K8sKind = {
  label: "Network",
  labelPlural: "Networks",
  apiVersion: "v1",
  apiGroup: "config.openshift.io",
  plural: "networks",
  abbr: "NO",
  namespaced: false,
  kind: "Network",
  id: "network",
  crd: true,
};

export const ConsoleOperatorConfigModel: K8sKind = {
  label: "Console",
  labelPlural: "Consoles",
  apiVersion: "v1",
  apiGroup: "operator.openshift.io",
  plural: "consoles",
  abbr: "C",
  namespaced: false,
  kind: "Console",
  id: "console",
  crd: true,
};

export const ConsoleLinkModel: K8sKind = {
  label: "ConsoleLink",
  // t('public~ConsoleLink')
  labelKey: "public~ConsoleLink",
  labelPlural: "ConsoleLinks",
  // t('public~ConsoleLinks')
  labelPluralKey: "public~ConsoleLinks",
  apiVersion: "v1",
  apiGroup: "console.openshift.io",
  plural: "consolelinks",
  abbr: "CL",
  namespaced: false,
  kind: "ConsoleLink",
  id: "consolelink",
  crd: true,
};

export const ConsoleCLIDownloadModel: K8sKind = {
  label: "ConsoleCLIDownload",
  // t('public~ConsoleCLIDownload')
  labelKey: "public~ConsoleCLIDownload",
  labelPlural: "ConsoleCLIDownloads",
  // t('public~ConsoleCLIDownloads')
  labelPluralKey: "public~ConsoleCLIDownloads",
  apiVersion: "v1",
  apiGroup: "console.openshift.io",
  plural: "consoleclidownloads",
  abbr: "CCD",
  namespaced: false,
  kind: "ConsoleCLIDownload",
  id: "consoleclidownload",
  crd: true,
};

export const ConsoleNotificationModel: K8sKind = {
  label: "ConsoleNotification",
  // t('public~ConsoleNotification')
  labelKey: "public~ConsoleNotification",
  labelPlural: "ConsoleNotifications",
  // t('public~ConsoleNotifications')
  labelPluralKey: "public~ConsoleNotifications",
  apiVersion: "v1",
  apiGroup: "console.openshift.io",
  plural: "consolenotifications",
  abbr: "CN",
  namespaced: false,
  kind: "ConsoleNotification",
  id: "consolenotification",
  crd: true,
};

export const ConsoleExternalLogLinkModel: K8sKind = {
  label: "ConsoleExternalLogLink",
  // t('public~ConsoleExternalLogLink')
  labelKey: "public~ConsoleExternalLogLink",
  labelPlural: "ConsoleExternalLogLinks",
  // t('public~ConsoleExternalLogLinks')
  labelPluralKey: "public~ConsoleExternalLogLinks",
  apiVersion: "v1",
  apiGroup: "console.openshift.io",
  plural: "consoleexternalloglinks",
  abbr: "CELL",
  namespaced: false,
  kind: "ConsoleExternalLogLink",
  id: "consoleexternalloglink",
  crd: true,
};

export const ConsoleYAMLSampleModel: K8sKind = {
  label: "ConsoleYAMLSample",
  // t('public~ConsoleYAMLSample')
  labelKey: "public~ConsoleYAMLSample",
  labelPlural: "ConsoleYAMLSamples",
  // t('public~ConsoleYAMLSamples')
  labelPluralKey: "public~ConsoleYAMLSamples",
  apiVersion: "v1",
  apiGroup: "console.openshift.io",
  plural: "consoleyamlsamples",
  abbr: "CYS",
  namespaced: false,
  kind: "ConsoleYAMLSample",
  id: "consoleyamlsample",
  crd: true,
};

export const VolumeSnapshotModel: K8sKind = {
  label: "VolumeSnapshot",
  // t('public~VolumeSnapshot')
  labelKey: "public~VolumeSnapshot",
  apiVersion: "v1",
  apiGroup: "snapshot.storage.k8s.io",
  plural: "volumesnapshots",
  abbr: "VS",
  namespaced: true,
  kind: "VolumeSnapshot",
  id: "volumesnapshot",
  labelPlural: "VolumeSnapshots",
  // t('public~VolumeSnapshots')
  labelPluralKey: "public~VolumeSnapshots",
  crd: true,
};

export const VolumeSnapshotClassModel: K8sKind = {
  label: "VolumeSnapshotClass",
  // t('public~VolumeSnapshotClass')
  labelKey: "public~VolumeSnapshotClass",
  apiVersion: "v1",
  apiGroup: "snapshot.storage.k8s.io",
  plural: "volumesnapshotclasses",
  abbr: "VSC",
  namespaced: false,
  kind: "VolumeSnapshotClass",
  id: "volumesnapshotclass",
  labelPlural: "VolumeSnapshotClasses",
  // t('public~VolumeSnapshotClasses')
  labelPluralKey: "public~VolumeSnapshotClasses",
  crd: true,
};

export const VolumeSnapshotContentModel: K8sKind = {
  label: "VolumeSnapshotContent",
  // t('public~VolumeSnapshotContent')
  labelKey: "public~VolumeSnapshotContent",
  apiVersion: "v1",
  apiGroup: "snapshot.storage.k8s.io",
  plural: "volumesnapshotcontents",
  abbr: "VSC",
  namespaced: false,
  kind: "VolumeSnapshotContent",
  id: "volumesnapshotcontent",
  labelPlural: "VolumeSnapshotContents",
  // t('public~VolumeSnapshotContents')
  labelPluralKey: "public~VolumeSnapshotContents",
  crd: true,
};

export const ConsolePluginModel: K8sKind = {
  label: "ConsolePlugin",
  // t('public~ConsolePlugin')
  labelKey: "public~ConsolePlugin",
  apiVersion: "v1",
  apiGroup: "console.openshift.io",
  plural: "consoleplugins",
  abbr: "CP",
  namespaced: false,
  kind: "ConsolePlugin",
  id: "consoleplugin",
  labelPlural: "ConsolePlugins",
  // t('public~ConsolePlugins')
  labelPluralKey: "public~ConsolePlugins",
  crd: true,
};

export const CloudCredentialModel: K8sKind = {
  kind: "CloudCredential",
  label: "CloudCredential",
  labelPlural: "CloudCredentials",
  apiGroup: "operator.openshift.io",
  apiVersion: "v1",
  abbr: "CO",
  plural: "cloudcredentials",
};

export const AuthenticationModel: K8sKind = {
  kind: "Authentication",
  label: "Authentication",
  labelPlural: "Authentications",
  apiGroup: "config.openshift.io",
  apiVersion: "v1",
  plural: "authentications",
  abbr: "AU",
};

export const MultiNetworkPolicyModel: K8sKind = {
  abbr: "MNP",
  apiGroup: "k8s.cni.cncf.io",
  apiVersion: "v1beta1",
  id: "multinetworkpolicy",
  kind: "MultiNetworkPolicy",
  label: "multi-networkpolicy",
  // t('public~MultiNetworkPolicy')
  labelKey: "public~MultiNetworkPolicy",
  labelPlural: "MultiNetworkPolicies",
  // t('MultiNetworkPolicies')
  labelPluralKey: "public~MultiNetworkPolicies",
  namespaced: true,
  plural: "multi-networkpolicies",
  crd: true,
};

const staticModels = {
  PodModel,
  DeploymentModel,
  NodeModel,
  NamespaceModel,
  ServiceModel,
  HorizontalPodAutoscalerModel,
  ReplicaSetModel,
  DaemonSetModel,
  ReplicationControllerModel,
  DeploymentConfigModel,
  IngressModel,
  RouteModel,
  EventModel,
  JobModel,
  MultiNetworkPolicyModel,
  CloudCredentialModel,
  AuthenticationModel,
  ConsolePluginModel,
  ConsoleYAMLSampleModel,
  ConsoleExternalLogLinkModel,
  ConsoleNotificationModel,
  ConsoleCLIDownloadModel,
  ConsoleLinkModel,
  ConsoleOperatorConfigModel,
  NetworkOperatorConfigModel,
  InfrastructureModel,
  OAuthModel,
  ClusterAutoscalerModel,
  CSIDriverModel,
  ClusterVersionModel,
  ClusterOperatorModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineConfigPoolModel,
  ControlPlaneMachineSetModel,
  MachineDeploymentModel,
  MachineSetModel,
  MachineModel,
  UserModel,
  GroupModel,
  CustomResourceDefinitionModel,
  NetworkPolicyModel,
  AppliedClusterResourceQuotaModel,
  ClusterResourceQuotaModel,
  ResourceQuotaModel,
  StatefulSetModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  RoleBindingModel,
  RoleModel,
  ClusterRoleBindingModel,
  ClusterRoleModel,
};

export enum ModelBadge {
  DEV = "dev",
  TECH = "tech",
}

export type ModelMetadata = Extension<
  "console.model-metadata",
  {
    /** The model to customize. May specify only a group, or optional version and kind. */
    model: ExtensionK8sGroupModel;
    /** Whether to consider this model reference as tech preview or dev preview. */
    badge?: ModelBadge;
    /** The color to associate to this model. */
    color?: string;
    /** Override the label. Requires `kind` be provided. */
    label?: string;
    /** Override the plural label. Requires `kind` be provided. */
    labelPlural?: string;
    /** Customize the abbreviation. Defaults to All uppercase chars in the kind up to 4 characters long. Requires `kind` be provided. */
    abbr?: string;
  }
>;

const modelKey = (model: K8sKind): string => {
  return model.crd ? getReferenceForModel(model) : model.kind;
};

export const modelsToMap = (
  models: K8sKind[],
): ImmutableMap<K8sResourceKindReference, K8sKind> => {
  return ImmutableMap<K8sResourceKindReference, K8sKind>().withMutations(
    (map) => {
      models.forEach((model) => map.set(modelKey(model), model));
    },
  );
};

let k8sModels;

const getK8sModels = () => {
  k8sModels = modelsToMap(_.values(staticModels));
  if (!k8sModels) {
  }
  return k8sModels;
};

export const isModelMetadata = (e: Extension): e is ModelMetadata =>
  e.type === "console.model-metadata";

export type ValueCallback<T> = (
  value: T,
  key: string,
  container: {},
  path: string,
) => void;
export type PredicateCheck<T> = (value: unknown, path: string) => value is T;

export const getModelExtensionMetadata = (
  extensions: LoadedExtension<ModelMetadata>[],
  group: string,
  version?: string,
  kind?: string,
) => {
  // Skip I18n translation for POC
  const translatedExtensions = extensions;
  const groupVersionKindMetadata = translatedExtensions
    .filter(
      ({ properties }) =>
        properties.model.group === group &&
        properties.model.kind === kind &&
        properties.model.version === version,
    )
    .map((e) => e.properties);
  const groupKindMetadata = translatedExtensions
    .filter(
      ({ properties }) =>
        properties.model.version == null &&
        properties.model.group === group &&
        properties.model.kind === kind,
    )
    .map((e) => e.properties);
  const groupMetadata = translatedExtensions
    .filter(
      ({ properties }) =>
        properties.model.kind == null &&
        properties.model.version == null &&
        properties.model.group === group,
    )
    .map((e) => e.properties);

  return _.omit(
    Object.assign(
      {},
      ...groupMetadata,
      ...groupKindMetadata,
      ...groupVersionKindMetadata,
    ),
    ["model"],
  );
};

export const isGroupVersionKind = (ref: GroupVersionKind | string) =>
  ref?.split("~").length === 3;

export const kindForReference = (ref: K8sResourceKindReference) =>
  isGroupVersionKind(ref) ? ref.split("~")[2] : ref;

export const modelFor = (ref: K8sResourceKindReference): K8sModel => {
  const scalprum = getScalprum();
  const pluginStore = scalprum.pluginStore;
  const metadataExtensions = pluginStore
    .getExtensions()
    .filter(isModelMetadata) as LoadedExtension<ModelMetadata>[];

  let m = getK8sModels().get(ref);
  if (m) {
    const metadata = getModelExtensionMetadata(
      metadataExtensions,
      (m as any)?.group,
      (m as any)?.version,
      (m as any)?.kind,
    );
    return _.merge(m, metadata);
  }

  // Skipped redux integration
  // let m = store.getState().k8s.getIn(["RESOURCES", "models"]).get(ref);
  // if (m) {
  //   return m;
  // }

  m = getK8sModels().get(kindForReference(ref));
  if (m) {
    const metadata = getModelExtensionMetadata(
      metadataExtensions,
      (m as any)?.group,
      m?.version,
      m?.kind,
    );
    return _.merge(m, metadata);
  }

  // m = store
  //   .getState()
  //   .k8s.getIn(["RESOURCES", "models"])
  //   .get(kindForReference(ref));
  // if (m) {
  //   return m;
  // }
  // mock some model if none exists
  const mockedModel: K8sKind = {
    kind: kindForReference(ref),
    label: kindForReference(ref),
    labelPlural: `${kindForReference(ref)}s`,
    apiVersion: "v1",
    plural: `${kindForReference(ref).toLowerCase()}s`,
    abbr: kindForReference(ref).substring(0, 4).toUpperCase(),
  };
  return mockedModel;
};

export const getTitleForNodeKind = (kindString?: string) => {
  if (!kindString) {
    return "unknown kind";
  }
  const model: K8sKind | undefined = modelFor(kindString);
  if (model) {
    return model.label;
  }
  return _.startCase(kindString);
};

export type ExtensionK8sKindVersionModel = {
  group?: string;
  version: string;
  kind: string;
};
export type ExtensionHookResult<T> = [T, boolean, any];
export type ExtensionHook<T, R = any> = (options: R) => ExtensionHookResult<T>;

export type ResourceActionProvider = Extension<
  "console.action/resource-provider",
  {
    /** The model for which this provider provides actions for. */
    model: ExtensionK8sKindVersionModel;
    /** A react hook which returns actions for the given resource model */
    provider: CodeRef<ExtensionHook<KBAction[]>>;
  }
>;

export const isResourceActionProvider = (
  e: Extension,
): e is ResourceActionProvider => {
  return e.type === "console.action/resource-provider";
};

const abbrBlacklist = ["ASS", "FART"];
export const kindToAbbr = (kind: any) => {
  const abbrKind = (kind.replace(/[^A-Z]/g, "") || kind.toUpperCase()).slice(
    0,
    4,
  );
  return abbrBlacklist.includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind;
};

export type StatusComponentProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
  className?: string;
  popoverTitle?: string;
  children?: ReactNode;
};
export const DASH = "-";

export type Volume = {
  name: string;
  [key: string]: any;
};
export type VolumeMount = {
  mountPath: string;
  mountPropagation?: "None" | "HostToContainer" | "Bidirectional";
  name: string;
  readOnly?: boolean;
  subPath?: string;
  subPathExpr?: string;
};
export type VolumeDevice = {
  devicePath: string;
  name: string;
};
export type EnvVarSource = {
  fieldRef?: {
    apiVersion?: string;
    fieldPath: string;
  };
  resourceFieldRef?: {
    resource: string;
    containerName?: string;
    divisor?: string;
  };
  configMapKeyRef?: {
    key: string;
    name: string;
  };
  secretKeyRef?: {
    key: string;
    name: string;
  };
  configMapRef?: {
    key?: string;
    name: string;
  };
  secretRef?: {
    key?: string;
    name: string;
  };
  configMapSecretRef?: {
    key?: string;
    name: string;
  };
  serviceAccountRef?: {
    key?: string;
    name: string;
  };
};
export type EnvVar = {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
};

export type ContainerLifecycle = {
  postStart?: Handler;
  preStop?: Handler;
};

export type ResourceList = {
  [resourceName: string]: string;
};

export type ContainerPort = {
  name?: string;
  containerPort: number;
  protocol: string;
};

export enum ImagePullPolicy {
  Always = "Always",
  Never = "Never",
  IfNotPresent = "IfNotPresent",
}

export type ContainerSpec = {
  name: string;
  volumeMounts?: VolumeMount[];
  volumeDevices?: VolumeDevice[];
  env?: EnvVar[];
  livenessProbe?: ContainerProbe;
  readinessProbe?: ContainerProbe;
  lifecycle?: ContainerLifecycle;
  resources?: {
    limits?: ResourceList;
    requests?: ResourceList;
  };
  ports?: ContainerPort[];
  imagePullPolicy?: ImagePullPolicy;
  [key: string]: any;
};

type ProbePort = string | number;

export type ExecProbe = {
  command: string[];
};

export type HTTPGetProbe = {
  path?: string;
  port: ProbePort;
  host?: string;
  scheme: "HTTP" | "HTTPS";
  httpHeaders?: any[];
};

export type TCPSocketProbe = {
  port: ProbePort;
  host?: string;
};

export type Handler = {
  exec?: ExecProbe;
  httpGet?: HTTPGetProbe;
  tcpSocket?: TCPSocketProbe;
};

export type ContainerProbe = {
  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
} & Handler;

export type TolerationOperator = "Exists" | "Equal";

export type TaintEffect = "" | "NoSchedule" | "PreferNoSchedule" | "NoExecute";

export type Toleration = {
  effect: TaintEffect;
  key?: string;
  operator: TolerationOperator;
  tolerationSeconds?: number;
  value?: string;
};

export type PodSpec = {
  volumes?: Volume[];
  initContainers?: ContainerSpec[];
  containers: ContainerSpec[];
  restartPolicy?: "Always" | "OnFailure" | "Never";
  terminationGracePeriodSeconds?: number;
  activeDeadlineSeconds?: number;
  nodeSelector?: any;
  serviceAccountName?: string;
  priorityClassName?: string;
  tolerations?: Toleration[];
  nodeName?: string;
  hostname?: string;
  [key: string]: any;
};

export type PodTemplate = {
  metadata: ObjectMetadata;
  spec: PodSpec;
};
export enum K8sResourceConditionStatus {
  True = "True",
  False = "False",
  Unknown = "Unknown",
}

export type K8sResourceCondition = {
  pagse?: string;
  type: string;
  status: keyof typeof K8sResourceConditionStatus;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type DeploymentCondition = {
  lastUpdateTime?: string;
} & K8sResourceCondition;

export type PodReadiness = string;
export type PodPhase = string;

export enum AllPodStatus {
  Running = "Running",
  NotReady = "Not Ready",
  Warning = "Warning",
  Empty = "Empty",
  Failed = "Failed",
  Pending = "Pending",
  Succeeded = "Succeeded",
  Terminating = "Terminating",
  Unknown = "Unknown",
  ScaledTo0 = "Scaled to 0",
  Idle = "Idle",
  AutoScaledTo0 = "Autoscaled to 0",
  ScalingUp = "Scaling Up",
  CrashLoopBackOff = "CrashLoopBackOff",
}

export type ExtPodPhase =
  | AllPodStatus.Empty
  | AllPodStatus.Warning
  | AllPodStatus.Idle
  | AllPodStatus.NotReady
  | AllPodStatus.ScaledTo0
  | AllPodStatus.AutoScaledTo0
  | AllPodStatus.Terminating
  | AllPodStatus.ScalingUp;

export type ExtPodStatus = {
  phase: ExtPodPhase | PodPhase;
};

export type ExtPodKind = {
  status?: ExtPodStatus;
} & K8sResourceKind;

export type ImpersonateKind = {
  kind: string;
  name: string;
  subprotocols: string[];
  groups?: string[];
};

export type SelfSubjectAccessReviewKind = {
  apiVersion: string;
  kind: string;
  metadata?: ObjectMetadata;
  spec: {
    resourceAttributes?: AccessReviewResourceAttributes;
  };
  status?: {
    allowed: boolean;
    denied?: boolean;
    reason?: string;
    evaluationError?: string;
  };
};

export type UserInfo = {
  uid?: string;
  username?: string;
  groups?: string[];
  extra?: object;
};

export type UserKind = {
  fullName?: string;
  identities: string[];
} & K8sResourceCommon;

export type AdmissionWebhookWarning = {
  kind: string;
  name: string;
  warning: string;
};

export type CoreState = {
  user?: UserInfo;
  userResource?: UserKind;
  impersonate?: ImpersonateKind;
  admissionWebhookWarnings?: ImmutableMap<string, AdmissionWebhookWarning>;
};

export type K8sState = ImmutableMap<string, any>;

export type SDKStoreState = {
  sdkCore: CoreState;
  k8s: K8sState;
};

export type QueryParams = {
  watch?: string;
  labelSelector?: string;
  fieldSelector?: string;
  resourceVersion?: string;
} & {
  [key: string]: string;
};

export type Options = {
  ns?: string;
  name?: string;
  path?: string;
  queryParams?: QueryParams;
  cluster?: string;
};

export const k8sCreate = async <R extends K8sResourceCommon>(
  _model: K8sModel,
  _data: R,
  _opts?: Options,
): Promise<SelfSubjectAccessReviewKind> => {
  // TODO: integrate mock server API
  return { status: { allowed: true } } as SelfSubjectAccessReviewKind;
};

export type Patch = {
  op: string;
  path: string;
  value?: any;
};

export const k8sPatch = async <R extends K8sResourceCommon>(
  _model: K8sModel,
  resource: R,
  data: Patch[],
  _opts?: Options,
): Promise<K8sResourceKind> => {
  const patches = _.compact(data);

  if (_.isEmpty(patches)) {
    return Promise.resolve(resource);
  }

  const scalprum = getScalprum();
  const apiBase: string = scalprum.api?.fleetshift?.apiBase ?? "";
  const clusterId: string = scalprum.api?.fleetshift?.getScope?.() ?? "";

  if (!clusterId || clusterId === "all" || !apiBase) {
    return Promise.resolve(resource);
  }

  // Find the /spec/replicas patch to send to the mock server
  const replicasPatch = patches.find((p) => p.path === "/spec/replicas");
  if (replicasPatch && resource.metadata?.uid) {
    const res = await fetch(
      `${apiBase}/clusters/${clusterId}/deployments/${resource.metadata.uid}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replicas: replicasPatch.value }),
      },
    );
    if (!res.ok) {
      throw new Error(`PATCH failed: ${res.status} ${res.statusText}`);
    }
    const updated = await res.json();
    return {
      ...resource,
      spec: { ...(resource as any).spec, replicas: updated.replicas },
    } as K8sResourceKind;
  }

  return Promise.resolve(resource);
};

type MetricObject = {
  name: string;
  selector?: Selector;
};

type TargetObjcet = {
  averageUtilization?: number;
  type: string;
  averageValue?: string;
  value?: string;
};

type DescribedObject = {
  apiVersion?: string;
  kind: string;
  name: string;
};

export type HPAMetric = {
  type: "Object" | "Pods" | "Resource" | "External" | "ContainerResource";
  resource?: {
    name: string;
    target: TargetObjcet;
  };
  containerResource?: {
    name: string;
    container: string;
    target: TargetObjcet;
  };
  external?: {
    metric: MetricObject;
    target: TargetObjcet;
  };
  object?: {
    describedObjec: DescribedObject;
    metric: MetricObject;
    target: TargetObjcet;
  };
  pods?: {
    metric: MetricObject;
    target: TargetObjcet;
  };
};

type HPAScalingPolicy = {
  hpaScalingPolicyType: "Pods" | "Percent";
  value: number;
  periodSeconds: number;
};

type HPAScalingRules = {
  stabilizationWindowSeconds?: number;
  selectPolicy?: "Max" | "Min" | "Disabled";
  policies?: HPAScalingPolicy[];
};

type CurrentObject = {
  averageUtilization?: number;
  averageValue?: string;
  value?: string;
};

type HPACurrentMetrics = {
  type: "Object" | "Pods" | "Resource" | "External";
  external?: {
    current: CurrentObject;
    metric: MetricObject;
  };
  object?: {
    current: CurrentObject;
    describedObject: DescribedObject;
    metric: MetricObject;
  };
  pods?: {
    current: CurrentObject;
    metric: MetricObject;
  };
  resource?: {
    name: string;
    current: CurrentObject;
  };
};

export type NodeCondition = {
  lastHeartbeatTime?: string;
} & K8sResourceCondition;

export type HorizontalPodAutoscalerKind = K8sResourceCommon & {
  spec: {
    scaleTargetRef: {
      apiVersion: string;
      kind: string;
      name: string;
    };
    minReplicas?: number;
    maxReplicas: number;
    metrics?: HPAMetric[];
    behavior?: {
      scaleUp?: HPAScalingRules;
      scaleDown?: HPAScalingRules;
    };
  };
  status?: {
    currentReplicas: number;
    desiredReplicas: number;
    currentMetrics?: HPACurrentMetrics[];
    conditions: NodeCondition[];
    lastScaleTime?: string;
  };
};

export type OverviewItemAlerts = {
  [key: string]: {
    message: string;
    severity: string;
  };
};

export type PodControllerOverviewItem = {
  alerts: OverviewItemAlerts;
  revision: number;
  obj: K8sResourceKind;
  phase?: string;
  pods: ExtPodKind[];
};

export interface PodRCData {
  current: PodControllerOverviewItem;
  previous: PodControllerOverviewItem;
  obj?: K8sResourceKind;
  isRollingOut: boolean;
  pods: ExtPodKind[];
}

export enum DEPLOYMENT_PHASE {
  new = "New",
  running = "Running",
  pending = "Pending",
  complete = "Complete",
  failed = "Failed",
  cancelled = "Cancelled",
}

export enum DEPLOYMENT_STRATEGY {
  rolling = "Rolling",
  recreate = "Recreate",
  rollingUpdate = "RollingUpdate",
}

export const groupVersionFor = (apiVersion: string) => ({
  group: apiVersion.split("/").length === 2 ? apiVersion.split("/")[0] : "core",
  version:
    apiVersion.split("/").length === 2 ? apiVersion.split("/")[1] : apiVersion,
});

export const referenceFor = ({
  kind,
  apiVersion,
}: K8sResourceCommon): GroupVersionKind => {
  if (!kind) {
    return "";
  }

  // `apiVersion` is optional in some k8s object references (for instance,
  // event `involvedObject`). The CLI resolves the version from API discovery.
  // Use `modelFor` to get the version from the model when missing.
  if (!apiVersion) {
    const m = modelFor(kind);
    return m ? getReferenceForModel(m) : "";
  }

  const { group, version } = groupVersionFor(apiVersion);
  return referenceForGroupVersionKind(group)(version)(kind);
};

export const selectorToString = (selector: Selector): string => {
  const requirements = Object.entries(selector.matchLabels || {}).map(
    ([key, value]) => `${key}=${value}`,
  );
  return requirements.join(",");
};

export type PodCondition = {
  lastProbeTime?: string;
} & K8sResourceCondition;

type ContainerStateValue = {
  reason?: string;
  [key: string]: any;
};

export type ContainerState = {
  waiting?: ContainerStateValue;
  running?: ContainerStateValue;
  terminated?: ContainerStateValue;
};

export type ContainerStatus = {
  name: string;
  state?: ContainerState;
  lastState?: ContainerState;
  ready: boolean;
  restartCount: number;
  image: string;
  imageID: string;
  containerID?: string;
  started?: boolean;
};

export type PodStatus = {
  phase: PodPhase;
  conditions?: PodCondition[];
  message?: string;
  reason?: string;
  startTime?: string;
  initContainerStatuses?: ContainerStatus[];
  containerStatuses?: ContainerStatus[];
  [key: string]: any;
};

export type PodKind = {
  status?: PodStatus;
} & K8sResourceCommon &
  PodTemplate;

export type K8sPodControllerKind = {
  spec?: {
    replicas?: number;
    template?: PodTemplate;
    jobTemplate?: {
      spec?: {
        template: PodTemplate;
      };
    };
  };
} & K8sResourceCommon;

export type PDBCondition = {
  observedGeneration?: number;
} & K8sResourceCondition;

export type PodDisruptionBudgetKind = {
  spec: {
    maxUnavailable?: number | string;
    minAvailable?: number | string;
    selector: Selector;
  };
  status?: {
    conditions: PDBCondition[];
    currentHealthy: number;
    desiredHealthy: number;
    disruptedPods?: Record<string, any>;
    disruptionsAllowed?: number;
    expectedPods?: number;
    observedGeneration?: number;
  };
} & K8sResourceCommon;

export const PodDisruptionBudgetModel: K8sKind = {
  label: "PodDisruptionBudget",
  // t('console-app~PodDisruptionBudget')
  labelKey: "console-app~PodDisruptionBudget",
  labelPlural: "PodDisruptionBudgets",
  // t('console-app~PodDisruptionBudgets')
  labelPluralKey: "console-app~PodDisruptionBudgets",
  plural: "poddisruptionbudgets",
  apiVersion: "v1",
  apiGroup: "policy",
  abbr: "PDB",
  namespaced: true,
  kind: "PodDisruptionBudget",
  id: "poddisruptionbudget",
};

export const getPDBResource = (
  pdbResources: PodDisruptionBudgetKind[],
  resource: K8sPodControllerKind | PodKind,
): PodDisruptionBudgetKind | undefined => ({
  spec: {
    selector: {
      matchLabels: resource?.metadata?.labels,
    },
  },
});

export const getVerticalPodAutoscalersForResource = (
  vpas: K8sResourceKind[],
  obj: K8sResourceKind,
) =>
  (vpas ?? []).filter((vpa) => {
    const { targetRef } = vpa.spec ?? {};
    const { namespace } = vpa.metadata ?? {};
    return (
      targetRef &&
      targetRef.apiVersion === obj?.apiVersion &&
      targetRef.kind === obj?.kind &&
      targetRef.name === obj?.metadata?.name &&
      namespace === obj?.metadata?.namespace
    );
  });

export const getName = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A,
): string | undefined => _.get(value, "metadata.name") as string | undefined;
export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A,
) =>
  _.get(
    value,
    "metadata.namespace",
    // @ts-ignore
  ) as K8sResourceCommon["metadata"]["namespace"];

export const asAccessReview = (
  kindObj: K8sKind,
  obj: K8sResourceKind,
  verb: K8sVerb,
  subresource?: string,
): AccessReviewResourceAttributes | undefined => {
  if (!obj) {
    console.warn("review obj should not be null");
    return undefined;
  }
  return {
    group: kindObj.apiGroup,
    resource: kindObj.plural,
    name: getName(obj),
    namespace: getNamespace(obj),
    verb,
    subresource,
  };
};

export const KEBAB_COLUMN_CLASS = "pf-v6-c-table__action";

export const VolumeSource = {
  emptyDir: {
    id: "emptyDir",
    label: "Container volume",
    description: "Temporary directory that shares a pod's lifetime.",
  },
  hostPath: {
    id: "hostPath",
    label: "Host directory",
    description:
      "Pre-existing host file or directory, generally for privileged system daemons or other agents tied to the host.",
  },
  gitRepo: {
    id: "gitRepo",
    label: "Git repo",
    description: "Git repository at a particular revision.",
  },
  nfs: {
    id: "nfs",
    label: "NFS",
    description: "NFS volume that will be mounted in the host machine.",
  },
  secret: {
    id: "secret",
    label: "Secret",
    description: "Secret to populate volume.",
  },
  gcePersistentDisk: {
    id: "gcePersistentDisk",
    label: "GCE Persistent Disk",
    description: "GCE disk resource attached to the host machine on demand.",
  },
  awsElasticBlockStore: {
    id: "awsElasticBlockStore",
    label: "AWS Elastic Block Store",
    description: "AWS disk resource attached to the host machine on demand.",
  },
  glusterfs: {
    id: "glusterfs",
    label: "Gluster FS",
    description: "GlusterFS volume that will be mounted on the host machine.",
  },
  iscsi: {
    id: "iscsi",
    label: "iSCSI",
    description: "iSCSI disk attached to host machine on demand.",
  },
  configMap: {
    id: "configMap",
    label: "ConfigMap",
    description: "ConfigMap to be consumed in volume.",
  },
  projected: {
    id: "projected",
    label: "Projected",
    description:
      "A projected volume maps several existing volume sources into the same directory.",
  },
};

export const getVolumeType = (volume: Volume) => {
  if (!volume) {
    return null;
  }
  return _.find(VolumeSource, function (v) {
    return !!volume[v.id];
  });
};

const genericFormatter = (volInfo: any) => {
  const keys = Object.keys(volInfo).sort();
  const parts = keys.map(function (key) {
    if (key === "readOnly") {
      return "";
    }
    return volInfo[key];
  });
  if (keys.indexOf("readOnly") !== -1) {
    parts.push(volInfo.readOnly ? "ro" : "rw");
  }
  return parts.join(" ") || null;
};

export const getVolumeLocation = (volume?: Volume | null) => {
  if (!volume) {
    return null;
  }
  const vtype = getVolumeType(volume);
  if (!vtype) {
    return null;
  }

  const typeID = vtype.id;
  const info = volume[typeID];
  switch (typeID) {
    // Override any special formatting cases.
    case VolumeSource.gitRepo.id:
      return `${info.repository}:${info.revision}`;
    case VolumeSource.configMap.id:
    case VolumeSource.emptyDir.id:
    case VolumeSource.secret.id:
    case VolumeSource.projected.id:
      return null;
    // Defaults to space separated sorted keys.
    default:
      return genericFormatter(info);
  }
};

export type ClusterServiceVersionCondition = {
  phase?: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};
