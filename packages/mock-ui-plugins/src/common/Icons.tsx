import { Icon, IconSize } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
} from "@patternfly/react-icons";
import { css } from "@patternfly/react-styles";

import "./icons.scss";

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: IconSize;
  dataTest?: string;
};

export const YellowExclamationTriangleIcon = ({
  className,
  title,
  size,
  dataTest,
}: ColoredIconProps) => {
  const icon = (
    <ExclamationTriangleIcon
      className={css("dps-icons__yellow-exclamation-icon", className)}
      title={title}
      data-test={dataTest}
    />
  );

  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};

export const RedExclamationCircleIcon = ({
  className,
  title,
  size,
}: ColoredIconProps) => {
  const icon = (
    <ExclamationCircleIcon
      className={css("dps-icons__red-exclamation-icon", className)}
      title={title}
    />
  );

  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};

export const GreenCheckCircleIcon = ({
  className,
  title,
  size,
}: ColoredIconProps) => {
  const icon = (
    <CheckCircleIcon
      data-test="success-icon"
      className={css("dps-icons__green-check-icon", className)}
      title={title}
    />
  );
  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};

export const BlueInfoCircleIcon = ({
  className,
  title,
  size,
}: ColoredIconProps) => {
  const icon = (
    <InfoCircleIcon
      className={css("dps-icons__blue-info-icon", className)}
      title={title}
    />
  );

  if (size) {
    return <Icon size={size}>{icon}</Icon>;
  }
  return icon;
};
