import type { FC } from "react";
import * as _ from "lodash";
import { ResourceLink } from "./ResourceLink";
import { getVolumeLocation, getVolumeType, Volume } from "./utils";

export const VolumeType: FC<VolumeTypeProps> = ({ volume, namespace }) => {
  if (volume) {
    if (volume.secret) {
      return (
        <ResourceLink
          kind="Secret"
          name={volume.secret.secretName}
          namespace={namespace}
        />
      );
    }

    if (volume.configMap) {
      return (
        <ResourceLink
          kind="ConfigMap"
          name={volume.configMap.name}
          namespace={namespace}
        />
      );
    }

    if (volume.persistentVolumeClaim) {
      return (
        <ResourceLink
          kind="PersistentVolumeClaim"
          name={volume.persistentVolumeClaim.claimName}
          namespace={namespace}
        />
      );
    }
  }

  const type = getVolumeType(volume);
  const l = getVolumeLocation(volume);
  const loc = _.trim(l || "");
  return type ? (
    <>
      {type.label}
      {loc && (
        <>
          {" "}
          (<span className="co-break-word co-select-to-copy">{loc}</span>)
        </>
      )}
    </>
  ) : null;
};

export type VolumeTypeProps = {
  volume: Volume;
  namespace?: string;
};
