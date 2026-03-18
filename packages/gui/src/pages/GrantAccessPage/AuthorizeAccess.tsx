import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  Divider,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { KeyIcon, TrashIcon, UserIcon } from "@patternfly/react-icons";
import { PERMISSIONS } from "./constants";

interface AuthorizeAccessProps {
  displayEmail: string;
  error: string | null;
  granting: boolean;
  onGrant: () => void;
  onDelete: () => void;
  onClearError: () => void;
}

export const AuthorizeAccess = ({
  displayEmail,
  error,
  granting,
  onGrant,
  onDelete,
  onClearError,
}: AuthorizeAccessProps) => (
  <div className="grant-access">
    <Card className="grant-access__card">
      <CardTitle>
        <Stack hasGutter>
          <StackItem>
            <Content component="h1">Authorize FleetShift</Content>
            <Content component="p" className="pf-v6-u-color-200">
              Confirm your identity to grant FleetShift permission to manage
              clusters on your behalf.
            </Content>
          </StackItem>
          <StackItem>
            <div className="grant-access__identity">
              <UserIcon className="grant-access__identity-icon" />
              <span>Signing in as</span>
              <span className="grant-access__identity-email">
                {displayEmail}
              </span>
            </div>
          </StackItem>
        </Stack>
      </CardTitle>

      <Divider />

      <CardBody>
        <div className="grant-access__details">
          <div className="grant-access__permissions-title">
            Permissions requested
          </div>
          {PERMISSIONS.map((p) => (
            <div key={p.label} className="grant-access__permission-item">
              <p.icon className="grant-access__permission-icon" />
              <span>{p.label}</span>
            </div>
          ))}

          <Divider className="pf-v6-u-my-md" />

          {error && (
            <Alert
              variant="warning"
              isInline
              title={error}
              className="pf-v6-u-mb-md"
              actionClose={
                <Button variant="plain" onClick={onClearError} />
              }
            />
          )}

          <div className="grant-access__cta-section">
            <Button
              variant="primary"
              size="lg"
              icon={
                granting ? (
                  <Spinner size="md" aria-label="Verifying" />
                ) : (
                  <KeyIcon />
                )
              }
              isBlock
              isDisabled={granting}
              onClick={onGrant}
            >
              {granting ? "Verifying..." : "Grant Access"}
            </Button>
            <span className="grant-access__cta-hint">
              You will be prompted for biometric verification
            </span>
          </div>
        </div>
      </CardBody>

      <Divider />

      <CardFooter className="grant-access__footer">
        <Button
          variant="link"
          isDanger
          icon={<TrashIcon />}
          onClick={onDelete}
        >
          Remove Passkey
        </Button>
      </CardFooter>
    </Card>
  </div>
);
