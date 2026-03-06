import { PropsWithChildren, ReactNode } from "react";
import { K8sResourceKind, referenceFor, Toleration } from "../utils";
import * as _ from "lodash";
import { DescriptionList } from "@patternfly/react-core";
import { DetailsItem } from "./DetailsItem";
import { LabelList } from "../LabelList";
import { Selector } from "../Selector";
import { OwnerReferences } from "../OwnerReferences";

export type ResourceSummaryProps = {
  resource: K8sResourceKind;
  showPodSelector?: boolean;
  showNodeSelector?: boolean;
  showAnnotations?: boolean;
  showTolerations?: boolean;
  showLabelEditor?: boolean;
  canUpdateResource?: boolean;
  podSelector?: string;
  nodeSelector?: string;
  children?: ReactNode;
  customPathName?: string;
};

const getTolerationsPath = (obj: K8sResourceKind): string => {
  return obj.kind === "Pod"
    ? "spec.tolerations"
    : "spec.template.spec.tolerations";
};

export const ResourceSummary = ({
  children,
  resource,
  customPathName,
  showPodSelector = false,
  showNodeSelector = false,
  showAnnotations = true,
  showTolerations = false,
  podSelector = "spec.selector",
  nodeSelector = "spec.template.spec.nodeSelector",
}: PropsWithChildren<ResourceSummaryProps>) => {
  const { metadata } = resource;
  const reference = referenceFor(resource);
  const tolerationsPath = getTolerationsPath(resource);
  const tolerations: Toleration[] = _.get(resource, tolerationsPath);

  return (
    <DescriptionList data-test-id="resource-summary">
      <DetailsItem
        label="Name"
        obj={resource}
        path={customPathName || "metadata.name"}
      />
      {metadata?.namespace && (
        <DetailsItem label="Namespace" obj={resource} path="metadata.namespace">
          <a href="#">{metadata.uid}, fake link</a>
        </DetailsItem>
      )}
      <DetailsItem
        label="Labels"
        obj={resource}
        path="metadata.labels"
        onEdit={() => window.alert("Edit labels")}
        canEdit={false}
        editAsGroup
      >
        <LabelList kind={reference} labels={metadata?.labels ?? {}} />
      </DetailsItem>
      {showPodSelector && (
        <DetailsItem label="Pod selector" obj={resource} path={podSelector}>
          <Selector
            selector={_.get(resource, podSelector)}
            namespace={_.get(resource, "metadata.namespace")}
          />
        </DetailsItem>
      )}
      {showNodeSelector && (
        <DetailsItem label="Node selector" obj={resource} path={nodeSelector}>
          <Selector kind="Node" selector={_.get(resource, nodeSelector)} />
        </DetailsItem>
      )}
      {showTolerations && (
        <DetailsItem label="Tolerations" obj={resource} path={tolerationsPath}>
          ({_.size(tolerations)} toleration )
        </DetailsItem>
      )}
      {showAnnotations && (
        <DetailsItem
          label="Annotations"
          obj={resource}
          path="metadata.annotations"
        >
          {_.size(metadata?.annotations)} annotation
        </DetailsItem>
      )}
      {children}
      <DetailsItem
        label="Created at"
        obj={resource}
        path="metadata.creationTimestamp"
      >
        <div>
          {metadata?.creationTimestamp}, should be formatted date and time
        </div>
      </DetailsItem>
      <DetailsItem label="Owner" obj={resource} path="metadata.ownerReferences">
        <OwnerReferences resource={resource} />
      </DetailsItem>
    </DescriptionList>
  );
};
