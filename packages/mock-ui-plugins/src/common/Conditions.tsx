import type { FC } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { ClusterServiceVersionCondition, K8sResourceCondition } from "./utils";
import CamelCaseWrap from "./camel-case-wrap";

export enum ConditionTypes {
  ClusterServiceVersion = "ClusterServiceVersion",
  K8sResource = "K8sResource",
}

export const Conditions: FC<ConditionsProps> = ({
  conditions,
  type = ConditionTypes.K8sResource,
}) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "True":
        return "True";
      case "False":
        return "False";
      default:
        return status;
    }
  };

  const rows = (conditions as any[])?.map?.(
    (
      condition: K8sResourceCondition & ClusterServiceVersionCondition,
      i: number,
    ) => (
      <Tr
        data-test={
          type === ConditionTypes.ClusterServiceVersion
            ? condition.phase
            : condition.type
        }
        key={i}
      >
        {type === ConditionTypes.ClusterServiceVersion ? (
          <Td data-test={`condition[${i}].phase`}>
            <CamelCaseWrap value={condition.phase ?? "Phase"} />
          </Td>
        ) : (
          <>
            <Td data-test={`condition[${i}].type`}>
              <CamelCaseWrap value={condition.type} />
            </Td>
            <Td data-test={`condition[${i}].status`}>
              {getStatusLabel(condition.status)}
            </Td>
          </>
        )}
        <Td
          data-test={`condition[${i}].lastTransitionTime`}
          visibility={["hidden", "visibleOnLg"]}
        >
          {condition.lastTransitionTime}
        </Td>
        <Td data-test={`condition[${i}].reason`}>
          <CamelCaseWrap value={condition.reason ?? "Reason"} />
        </Td>
        {/* remove initial newline which appears in route messages */}
        <Td
          className="co-break-word co-pre-line co-conditions__message"
          data-test={`condition[${i}].message`}
          visibility={["hidden", "visibleOnSm"]}
        >
          <a href="#">{condition.message?.trim() || "-"}</a>
        </Td>
      </Tr>
    ),
  );

  return (
    <>
      {conditions?.length ? (
        <Table gridBreakPoint="">
          <Thead>
            <Tr>
              {type === ConditionTypes.ClusterServiceVersion ? (
                <Th>Phase</Th>
              ) : (
                <>
                  <Th>Type</Th>
                  <Th>Status</Th>
                </>
              )}
              <Th visibility={["hidden", "visibleOnLg"]}>Updated</Th>
              <Th>Reason</Th>
              <Th visibility={["hidden", "visibleOnSm"]}>Message</Th>
            </Tr>
          </Thead>
          <Tbody>{rows}</Tbody>
        </Table>
      ) : (
        <div>No conditions found</div>
      )}
    </>
  );
};
Conditions.displayName = "Conditions";

export type ConditionsProps = {
  conditions: K8sResourceCondition[] | ClusterServiceVersionCondition[];
  title?: string;
  subTitle?: string;
  type?: keyof typeof ConditionTypes;
};
