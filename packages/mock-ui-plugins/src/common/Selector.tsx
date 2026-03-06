import { Link } from "react-router-dom";
import { Selector as SelectorKind, selectorToString } from "./utils";
import { SearchIcon } from "@patternfly/react-icons";
import * as _ from "lodash";

type RequirementProps = {
  kind: string;
  requirements: SelectorKind;
  namespace?: string;
};

const Requirement = ({
  kind,
  requirements,
  namespace = "",
}: RequirementProps) => {
  // Strip off any trailing '=' characters for valueless selectors
  const requirementAsString = selectorToString(requirements)
    .replace(/=,/g, ",")
    .replace(/=$/g, "");
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  const to = namespace
    ? `/search/ns/${namespace}?kind=${kind}&q=${requirementAsUrlEncodedString}`
    : `/search/all-namespaces?kind=${kind}&q=${requirementAsUrlEncodedString}`;

  return (
    <div className="co-m-requirement">
      <Link
        className={`co-m-requirement__link co-text-${kind.toLowerCase()}`}
        to={to}
      >
        <SearchIcon className="co-m-requirement__icon co-icon-flex-child" />
        <span className="co-m-requirement__label">
          {requirementAsString.replace(/,/g, ", ")}
        </span>
      </Link>
    </div>
  );
};

type SelectorProps = {
  kind?: string;
  selector: SelectorKind;
  namespace?: string;
};

export const Selector = ({
  kind = "Pod",
  selector = {},
  namespace = undefined,
}: SelectorProps) => {
  return (
    <div className="co-m-selector">
      {_.isEmpty(selector) ? (
        <p className="pf-v6-u-text-color-subtle">No selector</p>
      ) : (
        <Requirement
          kind={kind}
          requirements={selector}
          namespace={namespace}
        />
      )}
    </div>
  );
};
