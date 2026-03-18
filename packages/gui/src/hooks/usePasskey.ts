import { useEffect, useState } from "react";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { useAuth } from "../contexts/AuthContext";
import { subscribe } from "./useInvalidationSocket";
import {
  createPasskey,
  deletePasskey,
  grantAccess,
  fetchPasskeyStatus,
} from "../api/passkey";

export function useHasPasskey() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    passkeyState: {
      passkey: { loaded, registered },
      setPasskey,
    },
  } = useUserPreferences();

  useEffect(() => {
    if (!token || loaded || loading) return;

    setLoading(true);
    fetchPasskeyStatus(token)
      .then((data) => setPasskey({ loaded: true, registered: data.registered }))
      .catch((err) => {
        console.error("Failed to check passkey status", err);
        setPasskey({ loaded: true, registered: false });
      })
      .finally(() => setLoading(false));
  }, [token, loaded, loading, setPasskey]);

  // Re-fetch when the server confirms passkey change via WS
  useEffect(() => {
    if (!token) return;
    return subscribe("passkey-registered", () => {
      fetchPasskeyStatus(token)
        .then((data) =>
          setPasskey({ loaded: true, registered: data.registered }),
        )
        .catch(() => {});
    });
  }, [token, setPasskey]);

  return {
    loaded,
    registered,
    createPasskey,
    deletePasskey,
    grantAccess,
  };
}
