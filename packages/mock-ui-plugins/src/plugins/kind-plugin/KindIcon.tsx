import src from "./assets/kind-logo.png";
import { memo } from "react";

const KindIcon = memo(() => {
  return <img src={src} width={16} height={16} />;
});

KindIcon.displayName = "KindIcon";

export default KindIcon;
