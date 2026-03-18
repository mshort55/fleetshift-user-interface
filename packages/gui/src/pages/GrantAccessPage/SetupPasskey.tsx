import {
  Alert,
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Spinner,
} from "@patternfly/react-core";
import { KeyIcon } from "@patternfly/react-icons";

interface SetupPasskeyProps {
  error: string | null;
  creating: boolean;
  onCreate: () => void;
}

export const SetupPasskey = ({ error, creating, onCreate }: SetupPasskeyProps) => (
  <div className="grant-access">
    <EmptyState
      headingLevel="h1"
      icon={KeyIcon}
      titleText="Set up a passkey to continue"
      variant={EmptyStateVariant.lg}
    >
      <EmptyStateBody>
        A passkey lets you prove your identity using your device&apos;s
        built-in security — like a fingerprint, face scan, or screen lock.
        No passwords to remember, and nothing leaves your device.
      </EmptyStateBody>
      <EmptyStateFooter>
        {error && (
          <Alert
            variant="warning"
            isInline
            isPlain
            title={error}
            className="pf-v6-u-mb-md"
          />
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={onCreate}
          isDisabled={creating}
          icon={
            creating ? (
              <Spinner size="md" aria-label="Creating" />
            ) : undefined
          }
        >
          {creating ? "Setting up..." : "Set Up Passkey"}
        </Button>
        <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mt-sm">
          Your browser will guide you through a quick one-time setup.
        </Content>
      </EmptyStateFooter>
    </EmptyState>
  </div>
);
