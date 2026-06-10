import { MenuItem } from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";

import PluginLink from "../routing-plugin/PluginLink";

interface Props {
  title: string;
  description: string;
}

const CreateClusterSearchResult = ({ title, description }: Props) => {
  return (
    <MenuItem
      icon={<CubesIcon />}
      description={<span dangerouslySetInnerHTML={{ __html: description }} />}
      component={(props) => (
        <PluginLink
          {...props}
          module="CreateClusterModule"
          scope="core-plugin"
        />
      )}
    >
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </MenuItem>
  );
};

export default CreateClusterSearchResult;
