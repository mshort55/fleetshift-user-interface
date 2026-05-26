import { initSharedScope } from "@scalprum/core";
import { PropsWithChildren, useEffect, useState } from "react";

const ScopeInitializer = ({ children }: PropsWithChildren) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    initSharedScope().then(() => setLoading(false));
  }, []);
  if (loading) return null;
  return <>{children}</>;
};

export default ScopeInitializer;
