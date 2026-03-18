import { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface UserPreferencesContextValue {
  passkeyState: {
    passkey: { loaded: boolean; registered: boolean };
    setPasskey: React.Dispatch<
      React.SetStateAction<{ loaded: boolean; registered: boolean }>
    >;
  };
}

const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export function UserPreferencesProvider({
  children,
}: UserPreferencesProviderProps) {
  const [passkey, setPasskey] = useState<{
    loaded: boolean;
    registered: boolean;
  }>({ loaded: false, registered: false });

  const passkeyState = useMemo(() => {
    return {
      passkey,
      setPasskey,
    };
  }, [passkey, setPasskey]);

  return (
    <UserPreferencesContext.Provider
      value={{
        passkeyState,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextValue {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx)
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  return ctx;
}
