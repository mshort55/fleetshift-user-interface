import { Title } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import { CSSProperties, ReactNode } from "react";
export type SectionHeadingProps = {
  children?: any;
  style?: any;
  text: string;
  required?: boolean;
  id?: string;
};

export type SecondaryHeadingProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
};

const SecondaryHeading = ({
  children,
  className,
  ...props
}: SecondaryHeadingProps) => (
  <Title
    headingLevel="h2"
    className={css("co-section-heading", className)}
    {...props}
  >
    {children}
  </Title>
);

export const SectionHeading = ({
  text,
  children,
  style,
  required,
  id,
}: SectionHeadingProps) => (
  <SecondaryHeading style={style} data-test-section-heading={text} id={id}>
    <span
      className={css({
        "co-required": required,
      })}
    >
      {text}
    </span>
    {children}
  </SecondaryHeading>
);
