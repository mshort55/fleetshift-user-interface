import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Content,
  Label,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { PERMISSIONS } from "./constants";

interface AccessGrantedProps {
  displayEmail: string;
  grantedAt: string;
}

export const AccessGranted = ({ displayEmail, grantedAt }: AccessGrantedProps) => (
  <div className="grant-access">
    <Card className="grant-access__card">
      <CardBody>
        <div className="grant-access__success-icon">
          <CheckCircleIcon />
        </div>
        <div className="grant-access__success-body">
          <Content component="h1">Access Granted</Content>
          <Content component="p" className="pf-v6-u-color-200">
            FleetShift can now manage clusters on behalf of{" "}
            <strong>{displayEmail}</strong>.
          </Content>
          <Content
            component="p"
            className="pf-v6-u-color-200 pf-v6-u-font-size-sm pf-v6-u-mt-xs"
          >
            Authorized {grantedAt}
          </Content>
          <div className="grant-access__granted-list">
            {PERMISSIONS.map((p) => (
              <Label key={p.label} color="green" icon={<CheckCircleIcon />}>
                {p.label}
              </Label>
            ))}
          </div>
        </div>
      </CardBody>
      <CardFooter className="grant-access__footer">
        <Button variant="primary" component="a" href="/">
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  </div>
);
