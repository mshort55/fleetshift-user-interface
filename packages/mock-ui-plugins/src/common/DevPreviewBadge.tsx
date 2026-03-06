import type { FC } from "react";
import { Label } from "@patternfly/react-core";
import "./Badge.scss";

const DevPreviewBadge: FC = () => {
  return <Label className="ocs-preview-badge">Dev preview</Label>;
};

export default DevPreviewBadge;
