/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { FC } from "react";
import * as _ from "lodash";
import {
  ContainerSpec,
  K8sResourceKind,
  KEBAB_COLUMN_CLASS,
  PodKind,
  PodTemplate,
  Volume,
  VolumeMount,
} from "./utils";
import { ResourceIcon } from "./PageTitle/ResourceIcon";
import { Link } from "react-router-dom";
import { VolumeType } from "./VolumeType";
import {
  sortable,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { SectionHeading } from "./headings";

const getPodTemplate = (resource: K8sResourceKind): PodTemplate => {
  return resource.kind === "Pod"
    ? (resource as PodKind)
    : resource.spec?.template;
};

const anyContainerWithVolumeMounts = (containers: ContainerSpec[]) => {
  return !!_.findKey(containers, "volumeMounts");
};

const getRowVolumeData = (resource: K8sResourceKind): RowVolumeData[] => {
  const pod: PodTemplate = getPodTemplate(resource);
  if (
    _.isEmpty(pod.spec.volumes) &&
    !anyContainerWithVolumeMounts(pod.spec.containers)
  ) {
    return [];
  }

  const data: RowVolumeData[] = [];
  const volumes = (pod.spec.volumes || []).reduce((p, v: Volume) => {
    // @ts-ignore
    p[v.name] = v;
    return p;
  }, {});

  _.forEach(pod.spec.containers, (c: ContainerSpec) => {
    _.forEach(c.volumeMounts, (v: VolumeMount) => {
      data.push({
        name: v.name,
        readOnly: !!v.readOnly,
        // @ts-ignore
        volumeDetail: volumes[v.name],
        container: c.name,
        mountPath: v.mountPath,
        subPath: v.subPath,
        resource,
      });
    });
  });
  return data;
};

const ContainerLink: FC<ContainerLinkProps> = ({ name, pod }) => (
  <span className="co-resource-item co-resource-item--inline">
    <ResourceIcon kind="Container" />
    <Link
      to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}
    >
      {name}
    </Link>
  </span>
);
ContainerLink.displayName = "ContainerLink";

const volumeRowColumnClasses = [
  "pf-v6-u-w-25-on-2xl",
  "pf-v6-u-w-25-on-2xl",
  "pf-m-hidden pf-m-visible-on-md",
  "pf-m-hidden pf-m-visible-on-lg",
  "pf-m-hidden pf-m-visible-on-lg",
  "pf-m-hidden pf-m-visible-on-xl",
  KEBAB_COLUMN_CLASS,
];

const VolumesTableRows = ({
  componentProps: { data },
}: {
  componentProps: { data: RowVolumeData[] };
}) => {
  return _.map(data, (volume: RowVolumeData) => {
    const {
      container,
      mountPath,
      name,
      readOnly,
      resource,
      subPath,
      volumeDetail,
    } = volume;
    const pod = getPodTemplate(resource);
    const podVolume = pod.spec?.volumes?.find((v) => name === v.name);
    const podVolumeIsReadOnly = podVolume
      ? Object.values(podVolume).some((v) => v.readOnly === "true")
      : false;
    return [
      {
        title: name,
        props: {
          className: volumeRowColumnClasses[0],
          "data-test-volume-name-for": name,
        },
      },
      {
        title: mountPath,
        props: {
          className: volumeRowColumnClasses[1],
          "data-test-mount-path-for": name,
        },
      },
      {
        title: subPath || (
          <span className="pf-v6-u-text-color-subtle">No subpath</span>
        ),
        props: {
          className: volumeRowColumnClasses[2],
        },
      },
      {
        title: (
          <VolumeType
            volume={volumeDetail}
            namespace={resource.metadata?.namespace}
          />
        ),
        props: {
          className: volumeRowColumnClasses[3],
        },
      },
      {
        title: readOnly || podVolumeIsReadOnly ? "Read-only" : "Read/Write",
        props: {
          className: volumeRowColumnClasses[4],
        },
      },
      {
        title:
          _.get(pod, "kind") === "Pod" ? (
            <ContainerLink name={container} pod={pod as PodKind} />
          ) : (
            container
          ),
        props: {
          className: volumeRowColumnClasses[5],
        },
      },
      {
        title: <div>There should be kebab</div>,
        props: {
          className: volumeRowColumnClasses[6],
        },
      },
    ];
  });
};

export const VolumesTable = (props: any) => {
  const { resource } = props;
  const data: RowVolumeData[] = getRowVolumeData(resource);
  const pod: PodTemplate = getPodTemplate(resource);
  const volumesTableHeader = [
    {
      title: "Name",
      sortField: "name",
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[0] },
    },
    {
      title: "Mount path",
      sortField: "mountPath",
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[1] },
    },
    {
      title: "SubPath",
      sortField: "subPath",
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[2] },
    },
    {
      title: "Type",
      props: { className: volumeRowColumnClasses[3] },
    },
    {
      title: "Permissions",
      sortField: "readOnly",
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[4] },
    },
    {
      title: "Utilized by",
      sortField: "container",
      transforms: [sortable],
      props: { className: volumeRowColumnClasses[5] },
    },
    {
      title: "",
      props: { className: volumeRowColumnClasses[6] },
    },
  ];

  return (
    <>
      {props.heading && <SectionHeading text={props.heading} />}
      {_.isEmpty(pod.spec.volumes) &&
      !anyContainerWithVolumeMounts(pod.spec.containers) ? (
        <div>No volumes</div>
      ) : (
        <Table>
          <Thead>
            {volumesTableHeader.map((column, index) => (
              <Th key={index}>{column.title}</Th>
            ))}
          </Thead>
          <Tbody>
            {data.map((volume, index) => (
              <Tr key={index}>
                {VolumesTableRows({
                  componentProps: { data: [volume] },
                })[0].map((column, columnIndex) => (
                  <Td key={columnIndex} {...column.props}>
                    {column.title}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </>
  );
};

VolumesTable.displayName = "VolumesTable";

export type RowVolumeData = {
  name: string;
  readOnly: boolean;
  volumeDetail: Volume;
  container: string;
  mountPath: string;
  subPath?: string;
  resource: K8sResourceKind;
};

type ContainerLinkProps = {
  pod: PodKind;
  name: string;
};
