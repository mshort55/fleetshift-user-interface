/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ComponentType, ReactNode } from "react";
import {
  FirehoseResult,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  KebabOptionsCreator,
  PageHeadingProps,
} from "../utils";
import * as _ from "lodash";
import { PageHeading } from "./PageHeading";
import { ResourceIcon } from "./ResourceIcon";
import ResourceStatus from "../ResourceStatus";
import Status from "../Status";

export type ConnectedPageHeadingProps = Omit<
  PageHeadingProps,
  "primaryAction"
> & {
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
// originally wrapped by some connectToModel which was a wrapper around redux to get data structure like this:
/**
 * 
 * const kind: string = props.kind || props.match?.params?.plural || props.params?.plural;
    return {
      kindObj: getK8sModel(k8s, kind),
      kindsInFlight: k8s.getIn(['RESOURCES', 'inFlight']),
    } as any;
 */
// This data should be provided from the mock server. Presumably the state was provided by the firehose component.
export const ConnectedPageHeading = ({
  "data-test": dataTest,
  badge,
  className,
  getResourceStatus = (resource: K8sResourceKind): string =>
    _.get(resource, ["status", "phase"], null),
  helpAlert,
  helpText,
  icon,
  kind,
  linkProps,
  obj,
  OverrideTitle,
  title,
  titleFunc,
}: ConnectedPageHeadingProps) => {
  const data = _.get(obj, "data");
  const hasData = !_.isEmpty(data);

  const resourceTitle = titleFunc && data ? titleFunc(data) : title;
  const resourceStatus =
    hasData && getResourceStatus ? getResourceStatus(data) : null;

  return (
    <PageHeading
      badge={badge}
      className={className}
      data-test={dataTest}
      helpAlert={helpAlert}
      helpText={helpText}
      icon={icon}
      linkProps={linkProps}
      title={
        OverrideTitle ? (
          <OverrideTitle obj={data} />
        ) : (
          (kind || resourceTitle || resourceStatus) && (
            <div className="co-m-pane__heading co-resource-item">
              {kind && (
                <ResourceIcon kind={kind} className="co-m-resource-icon--lg" />
              )}{" "}
              <span
                data-test-id="resource-title"
                className="co-resource-item__resource-name"
              >
                {resourceTitle}
                {data?.metadata?.namespace &&
                  data?.metadata?.ownerReferences?.length && (
                    <a href="#">Managed by operator link (does not work)</a>
                  )}
              </span>
              {resourceStatus && (
                <ResourceStatus additionalClassNames="pf-v6-u-display-none pf-v6-u-display-block-on-sm">
                  <Status status={resourceStatus} />
                </ResourceStatus>
              )}
            </div>
          )
        )
      }
    />
  );
};
