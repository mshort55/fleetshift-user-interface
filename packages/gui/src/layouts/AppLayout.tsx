import { Outlet } from "react-router-dom";
import {
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  Page,
  PageSection,
} from "@patternfly/react-core";

const AppMasthead = (
  <Masthead>
    <MastheadMain>
      <MastheadBrand>
        <MastheadLogo component="a" href="/">
          FleetShift
        </MastheadLogo>
      </MastheadBrand>
    </MastheadMain>
    <MastheadContent />
  </Masthead>
);

export const AppLayout = () => (
  <Page masthead={AppMasthead}>
    <PageSection isFilled>
      <Outlet />
    </PageSection>
  </Page>
);
