import { PropsWithChildren } from "react";

// TODO should provide redux context with required data
// In our case we provide it with simple context and source the data from the mocked servers
const FireHose = (props: PropsWithChildren<{ resources?: unknown[] }>) => {
  return <>{props.children}</>;
};

export default FireHose;
