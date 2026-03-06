import type { FC, ReactNode } from "react";
import type { PageHeaderLinkProps } from "@patternfly/react-component-groups";
import { PageHeader } from "@patternfly/react-component-groups";
import { ActionList, ActionListGroup } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";

import "./PageHeading.scss";

interface PageHeadingLinkProps extends Omit<PageHeaderLinkProps, "label"> {
  "data-test"?: string;
  /** Title for the link */
  label: ReactNode | string;
}

export type PageHeadingProps = {
  "data-test"?: string;
  /** A badge that is displayed next to the title of the heading */
  badge?: ReactNode;
  /** A class name that is placed around the PageHeader wrapper */
  className?: string;
  /** An alert placed below the heading in the same PageSection. */
  helpAlert?: ReactNode;
  /** A subtitle placed below the title. */
  helpText?: ReactNode;
  /** An icon which is placed next to the title with a divider line */
  icon?: ReactNode;
  /** A title for the page. */
  title?: string | JSX.Element | null | undefined;
  /** A primary action that is always rendered. */
  primaryAction?: ReactNode;
  /** Optional link below subtitle */
  linkProps?: PageHeadingLinkProps;
};

/**
 * A standard page heading component that is used in the console.
 */
export const PageHeading: FC<PageHeadingProps> = ({
  "data-test": dataTest = "page-heading",
  badge,
  className,
  helpAlert,
  helpText,
  icon,
  title,
  primaryAction,
  linkProps,
}) => {
  return (
    <div data-test={dataTest} className={css("co-page-heading", className)}>
      <PageHeader
        title={title}
        actionMenu={
          primaryAction ? (
            <ActionList className="co-actions" data-test-id="details-actions">
              <ActionListGroup>{primaryAction}</ActionListGroup>
            </ActionList>
          ) : null
        }
        icon={icon}
        label={badge}
        linkProps={linkProps}
        subtitle={helpText}
      >
        {helpAlert && helpAlert}
      </PageHeader>
    </div>
  );
};

PageHeading.displayName = "PageHeading";
