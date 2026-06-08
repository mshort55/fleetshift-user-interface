import { Icon, MenuItem } from "@patternfly/react-core";
import PluginLink from "../routing-plugin/PluginLink";
import kindLogo from "./assets/kind-logo.png";

interface Props {
  title: string;
  description: string;
}

const KindSearchResult = ({ title, description }: Props) => {
  return (
    <MenuItem
      icon={
        <Icon isInline>
          <img src={kindLogo} alt="" width={16} height={16} />
        </Icon>
      }
      description={<span dangerouslySetInnerHTML={{ __html: description }} />}
      component={(props) => (
        <PluginLink
          {...props}
          module="CreateClusterModule"
          scope="core-plugin"
          to={{ pathname: "/kind" }}
        />
      )}
    >
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </MenuItem>
  );
};

export default KindSearchResult;
