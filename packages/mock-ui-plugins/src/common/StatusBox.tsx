import { ComponentType, PropsWithChildren } from "react";
import * as _ from "lodash";

type StatusBoxProps = {
  NoDataEmptyMsg?: ComponentType;
  EmptyMsg?: ComponentType;
  label?: string;
  unfilteredData?: any;
  data?: any;
};

const EmptyBox = ({ label }: { label?: string }) => (
  <div>
    <h2>{label ? `No ${label} Found` : "No Data Found"}</h2>
  </div>
);

const StatusBox = ({
  NoDataEmptyMsg,
  EmptyMsg,
  label,
  data,
  unfilteredData,
  children,
}: PropsWithChildren<StatusBoxProps>) => {
  if (NoDataEmptyMsg && _.isEmpty(unfilteredData)) {
    return (
      <div className="loading-box loading-box__loaded">
        {NoDataEmptyMsg ? <NoDataEmptyMsg /> : <EmptyBox label={label} />}
      </div>
    );
  }

  if (!data || _.isEmpty(data)) {
    return (
      <div className="loading-box loading-box__loaded">
        {EmptyMsg ? <EmptyMsg /> : <EmptyBox label={label} />}
      </div>
    );
  }
  return <div className="loading-box loading-box__loaded">{children}</div>;
};

export default StatusBox;
