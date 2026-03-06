import { Page } from "../utils";
import { Tab, Tabs, TabTitleText } from "@patternfly/react-core";

export type NavBarProps = {
  pages: Page[];
  activeKey: string;
  onTabChange: (key: string) => void;
};

const stripI18nPrefix = (key: string): string => {
  const idx = key.indexOf("~");
  return idx >= 0 ? key.slice(idx + 1) : key;
};

export const NavBar = ({ pages, activeKey, onTabChange }: NavBarProps) => (
  <div>
    <Tabs
      activeKey={activeKey}
      onSelect={(_, key) => onTabChange(String(key))}
      component="nav"
      usePageInsets
    >
      {pages.map(({ name, nameKey, href }) => (
        <Tab
          key={href}
          eventKey={href!}
          title={
            <TabTitleText>
              {nameKey ? stripI18nPrefix(nameKey) : name}
            </TabTitleText>
          }
        />
      ))}
    </Tabs>
  </div>
);
