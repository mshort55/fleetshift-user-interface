import { useMemo, useState } from "react";
import { Spinner } from "@patternfly/react-core";
import { useHasPasskey } from "../../hooks/usePasskey";
import { useAuth } from "../../contexts/AuthContext";
import { SetupPasskey } from "./SetupPasskey";
import { AuthorizeAccess } from "./AuthorizeAccess";
import { AccessGranted } from "./AccessGranted";
import "./GrantAccessPage.scss";

export const GrantAccessPage = () => {
  const { loaded, registered, createPasskey, deletePasskey, grantAccess } =
    useHasPasskey();
  const { email, user } = useAuth();
  const [granted, setGranted] = useState(false);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const displayEmail = email ?? user?.username ?? "unknown";

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      await createPasskey();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Passkey creation failed.";
      if (msg.includes("cancel") || msg.includes("abort")) {
        setError("Passkey setup was cancelled. You can try again when ready.");
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleGrant = async () => {
    setError(null);
    setGranting(true);
    try {
      await grantAccess();
      setGranted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      if (msg.includes("cancel") || msg.includes("abort")) {
        setError(
          "Verification was cancelled. Click Grant Access to try again.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setGranting(false);
    }
  };

  const grantedAt = useMemo(
    () =>
      granted
        ? new Date().toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "",
    [granted],
  );

  if (!loaded) {
    return (
      <div className="grant-access">
        <Spinner size="lg" aria-label="Checking passkey status" />
      </div>
    );
  }

  if (!registered) {
    return (
      <SetupPasskey error={error} creating={creating} onCreate={handleCreate} />
    );
  }

  if (granted) {
    return <AccessGranted displayEmail={displayEmail} grantedAt={grantedAt} />;
  }

  return (
    <AuthorizeAccess
      displayEmail={displayEmail}
      error={error}
      granting={granting}
      onGrant={handleGrant}
      onDelete={deletePasskey}
      onClearError={() => setError(null)}
    />
  );
};
