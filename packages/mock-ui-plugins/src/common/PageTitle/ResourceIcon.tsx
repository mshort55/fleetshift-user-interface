import {
  getReference,
  K8sGroupVersionKind,
  K8sResourceKindReference,
  kindToAbbr,
  modelFor,
} from "../utils";
import * as _ from "lodash";
import { css } from "@patternfly/react-styles";

export type ResourceIconProps = {
  className?: string;
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
};

const MEMO: Record<string, JSX.Element> = {};

export const ResourceIcon = ({
  className,
  groupVersionKind,
  kind,
}: ResourceIconProps) => {
  // if no kind or groupVersionKind, return null so an empty icon isn't rendered
  if (!kind && !groupVersionKind) {
    return null;
  }
  const kindReference =
    kind ||
    (groupVersionKind ? getReference(groupVersionKind) : crypto.randomUUID());
  const memoKey = className ? `${kindReference}/${className}` : kindReference;
  if (MEMO[memoKey]) {
    return MEMO[memoKey];
  }
  const kindObj = modelFor(kindReference);
  const kindStr = kindObj?.kind ?? kindReference;
  const backgroundColor = _.get(kindObj, "color", undefined);
  const klass = css(
    `co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`,
    className,
  );
  const iconLabel = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);

  const rendered = (
    <>
      <span className="pf-v6-u-screen-reader">{kindStr}</span>
      <span className={klass} title={kindStr} style={{ backgroundColor }}>
        {iconLabel}
      </span>
    </>
  );
  if (kindObj) {
    MEMO[memoKey] = rendered;
  }

  return rendered;
};
