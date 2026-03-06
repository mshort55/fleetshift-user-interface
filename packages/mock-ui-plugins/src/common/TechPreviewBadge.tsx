import type { FC } from "react";
import { Label } from "@patternfly/react-core";
import "./Badge.scss";

const TechPreviewBadge: FC = () => {
  return <Label className="ocs-preview-badge">Tech preview</Label>;
};

export default TechPreviewBadge;
