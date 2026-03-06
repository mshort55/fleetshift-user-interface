import {
  Label as PfLabel,
  LabelGroup as PfLabelGroup,
} from "@patternfly/react-core";
import { K8sResourceKindReference, kindForReference } from "./utils";
import * as _ from "lodash";
import { css } from "@patternfly/react-styles";

export type LabelProps = {
  kind: K8sResourceKindReference;
  name: string;
  value: string;
  expand: boolean;
};

export type LabelListProps = {
  labels: { [key: string]: string };
  kind: K8sResourceKindReference;
  expand?: boolean;
};

export const Label = ({ kind, name, value, expand }: LabelProps) => {
  const href = `/search?kind=${kind}&q=${value ? encodeURIComponent(`${name}=${value}`) : name}`;
  const kindOf = `co-m-${kindForReference(kind.toLowerCase())}`;
  const klass = css(kindOf, { "co-m-expand": expand }, "co-label");

  return (
    <>
      <PfLabel className={klass} href={href}>
        <span className="co-label__key" data-test="label-key">
          {name}
        </span>
        {value && <span className="co-label__eq">=</span>}
        {value && <span className="co-label__value">{value}</span>}
      </PfLabel>
    </>
  );
};

export const LabelList = (props: LabelListProps) => {
  const { labels, kind, expand = true } = props;
  const list = _.map(labels, (label, key) => (
    <Label key={key} kind={kind} name={key} value={label} expand={expand} />
  ));

  return (
    <>
      {_.isEmpty(list) ? (
        <div className="pf-v6-u-text-color-subtle" key="0">
          No labels
        </div>
      ) : (
        <PfLabelGroup
          className="co-label-group"
          defaultIsOpen={true}
          numLabels={20}
          data-test="label-list"
        >
          {list}
        </PfLabelGroup>
      )}
    </>
  );
};
