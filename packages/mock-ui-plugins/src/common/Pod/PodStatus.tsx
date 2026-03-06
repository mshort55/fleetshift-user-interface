import type { FC, ReactElement } from "react";
import type { ExtPodKind } from "../utils";

interface PodStatusProps {
  standalone?: boolean;
  data: ExtPodKind[];
  subTitle?: string;
  title?: string;
  titleComponent?: ReactElement;
}

/** Stub — renders a simple pod count ring placeholder */
const PodStatus: FC<PodStatusProps> = ({ data, title, subTitle }) => {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        border: "6px solid var(--pf-t--global--color--brand--default)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <strong>{data?.length ?? 0}</strong>
      <small>{title ?? subTitle ?? "Pods"}</small>
    </div>
  );
};

export default PodStatus;
